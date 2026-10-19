const assert = require('node:assert/strict');
const { test } = require('node:test');

const { Option } = require('../core/Option');
const { Student } = require('../core/Student');
const { UserLogin } = require('../core/UserLogin');
const { addOption, getOptions, deleteOption } = require('../db/options');
const {
  addLogin,
  getAllLogins,
  getLoginsByDate,
  getLoginsByStudent
} = require('../db/logins');
const { isAuthenticated, isAuthorized } = require('../utilities/auth');

function createDatabase(resources = []) {
  const calls = [];
  const database = {
    container(name) {
      calls.push({ operation: 'container', name });
      return {
        items: {
          create: async item => {
            calls.push({ operation: 'create', item });
            return { statusCode: 201, resource: item };
          },
          query: query => {
            calls.push({ operation: 'query', query });
            return {
              fetchAll: async () => ({ resources })
            };
          }
        },
        item: (...args) => ({
          delete: async () => {
            calls.push({ operation: 'delete', args });
            return { statusCode: 204 };
          }
        })
      };
    }
  };

  return { database, calls };
}

test('Option creates a UUID and defaults its creation date', () => {
  const option = new Option('Advising');

  assert.equal(option.description, 'Advising');
  assert.ok(option.createdAt instanceof Date);
  assert.match(option.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('Student and UserLogin preserve the supplied student, reasons, and timestamp', () => {
  const student = new Student('Alex Student', '1234567', 'alexs');
  const createdAt = new Date('2025-01-02T03:04:05.000Z');
  const login = new UserLogin(student, ['Advising', 'Food pantry'], createdAt);

  assert.ok(student instanceof Student);
  assert.deepEqual(
    [student.name, student.number, student.uwNetId],
    ['Alex Student', '1234567', 'alexs']
  );
  assert.equal(login.student, student);
  assert.deepEqual(login.loginReasons, ['Advising', 'Food pantry']);
  assert.equal(login.createdAt, createdAt);
});

test('authentication helpers check login state and required application roles', () => {
  assert.equal(isAuthenticated({}), false);
  assert.equal(isAuthenticated({ session: { isAuthenticated: true } }), true);
  assert.equal(isAuthorized({ session: { isAuthenticated: false } }, 'Login.Read'), false);
  assert.equal(isAuthorized({
    session: {
      isAuthenticated: true,
      account: { idTokenClaims: { roles: ['Login.Read'] } }
    }
  }, 'Login.Read'), true);
  assert.equal(isAuthorized({
    session: {
      isAuthenticated: true,
      account: { idTokenClaims: { roles: ['Other.Role'] } }
    }
  }, 'Login.Read'), false);
});

test('addOption writes to the Options container', async () => {
  const { database, calls } = createDatabase();
  const option = new Option('Advising');

  const result = await addOption(option, database);

  assert.equal(result.statusCode, 201);
  assert.deepEqual(calls, [
    { operation: 'container', name: 'Options' },
    { operation: 'create', item: option }
  ]);
});

test('getOptions sorts through Cosmos and hydrates Option records', async () => {
  const { database, calls } = createDatabase([
    { description: 'Tutoring', createdAt: '2025-02-01T00:00:00.000Z', id: 'second' },
    { description: 'Advising', createdAt: '2025-01-01T00:00:00.000Z', id: 'first' }
  ]);

  const options = await getOptions(database);

  assert.equal(calls[0].name, 'Options');
  assert.match(calls[1].query.query, /ORDER BY C\.description ASC/);
  assert.deepEqual(options.map(option => [option.description, option.id]), [
    ['Tutoring', 'second'],
    ['Advising', 'first']
  ]);
  assert.ok(options.every(option => option instanceof Option));
});

test('deleteOption deletes the matching Cosmos item', async () => {
  const { database, calls } = createDatabase();

  const result = await deleteOption('option-id', database);

  assert.equal(result.statusCode, 204);
  assert.deepEqual(calls, [
    { operation: 'container', name: 'Options' },
    { operation: 'delete', args: ['option-id', 'option-id'] }
  ]);
});

test('addLogin writes to the Logins container', async () => {
  const { database, calls } = createDatabase();
  const login = new UserLogin(new Student('Alex Student', '1234567', 'alexs'), ['Advising']);

  const result = await addLogin(login, database);

  assert.equal(result.statusCode, 201);
  assert.deepEqual(calls, [
    { operation: 'container', name: 'Logins' },
    { operation: 'create', item: login }
  ]);
});

test('getAllLogins hydrates student and login records in Cosmos result order', async () => {
  const { database, calls } = createDatabase([
    {
      student: { name: 'Alex Student', number: '1234567', uwNetId: 'alexs' },
      loginReasons: ['Advising'],
      createdAt: '2025-01-02T03:04:05.000Z'
    }
  ]);

  const logins = await getAllLogins(database);

  assert.match(calls[1].query.query, /ORDER BY C\.createdAt DESC/);
  assert.equal(logins.length, 1);
  assert.ok(logins[0] instanceof UserLogin);
  assert.ok(logins[0].student instanceof Student);
  assert.deepEqual(logins[0].student, new Student('Alex Student', '1234567', 'alexs'));
  assert.deepEqual(logins[0].loginReasons, ['Advising']);
});

test('getLoginsByDate uses inclusive ISO date bounds and returns login records', async () => {
  const startDate = new Date('2025-01-01T00:00:00.000Z');
  const endDate = new Date('2025-01-31T23:59:59.000Z');
  const student = { name: 'Alex Student', number: '1234567', uwNetId: 'alexs' };
  const { database, calls } = createDatabase([
    { student, loginReasons: ['Advising'], createdAt: '2025-01-02T03:04:05.000Z' }
  ]);

  const logins = await getLoginsByDate(startDate, database, endDate);

  assert.match(calls[1].query.query, /C\.createdAt >= '2025-01-01T00:00:00\.000Z'/);
  assert.match(calls[1].query.query, /C\.createdAt <= '2025-01-31T23:59:59\.000Z'/);
  assert.equal(logins.length, 1);
  assert.ok(logins[0] instanceof UserLogin);
  assert.equal(logins[0].student, student);
});

test('getLoginsByStudent parameterizes the student number', async () => {
  const { database, calls } = createDatabase([]);
  const studentNumber = "1234567' OR true";

  const logins = await getLoginsByStudent(studentNumber, database);

  assert.match(calls[1].query.query, /WHERE C\.student\.number = @studentNumber/);
  assert.deepEqual(calls[1].query.parameters, [
    { name: '@studentNumber', value: studentNumber }
  ]);
  assert.deepEqual(logins, []);
});
