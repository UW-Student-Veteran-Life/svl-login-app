import { Container, Database } from '@azure/cosmos';
import UserLogin from 'models/UserLogin';
import Student from 'models/Student';

export async function addLogin(studentInfo: Student, database: Database) {
  const container: Container = database.container('Logins');

  let login: UserLogin = new UserLogin(studentInfo, '');

  return await container.items.upsert(login);
}
  
export async function getItems(userQuery: string, database: Database): Promise<Array<UserLogin>> {
  const container = database.container('Logins');

  const qry = {
    query: userQuery
  };

  const { resources } = await container.items.query(qry).fetchAll();
  const logins: Array<UserLogin> = resources.map(record => {
    const studentInfo: Student = new Student(record.name, record.studentId, record.uwNetId);
    return new UserLogin(studentInfo, record.loginReason);
  });

  return logins;
}

export async function deleteItem(login: UserLogin, database: Database) {
  const container = database.container('Logins');

  if (login.id == null || login.id == undefined) {
    throw Error('Cannot delete a login with an ID that is null or undefined');
  }

  await container.item(login.id, login.id).delete();
}
