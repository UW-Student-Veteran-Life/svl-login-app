import { Container, Database } from '@azure/cosmos';
import UserLogin from 'models/UserLogin';
import Student from 'models/Student';

export async function addLogin(containerName: string, studentInfo: Student, database: Database) {
  const container: Container = database.container(containerName);

  let login: UserLogin = new UserLogin(studentInfo, '');

  return await container.items.upsert(login);
}
  
// async function getItems(containerName, userQuery) {
//   if (!_database) {
//     await connectDatabase();
//   }

//   const container = _database.container(containerName);

//   const qry = {
//     query: userQuery
//   };

//   const { resources } = await container.items.query(qry).fetchAll();

//   return resources;
// }

// async function deleteItem(containerName, itemId) {
//   if (!_database) {
//     await connectDatabase();
//   }

//   const container = _database.container(containerName);

//   await container.item(itemId, itemId).delete();
// }
