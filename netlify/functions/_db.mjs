import { MongoClient } from 'mongodb';
let client;
export async function collection(){
 if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
 if(!client) client=new MongoClient(process.env.MONGODB_URI);
 await client.connect(); return client.db(process.env.MONGODB_DB || 'debtor_system').collection('debtors');
}
export const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
