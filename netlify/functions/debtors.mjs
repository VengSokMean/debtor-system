import { ObjectId } from 'mongodb';
import { collection,json } from './_db.mjs';
const validFile = data => !data || (typeof data==='string' && data.length<2_850_000 && /^data:(application\/pdf|image\/(jpeg|png|webp));base64,[A-Za-z0-9+/=]+$/.test(data));
function fields(b){return {name:String(b.name||'').trim(),amount:Number(b.amount),currency:b.currency==='KHR'?'KHR':'USD',owedDate:String(b.owedDate||''),dueDate:String(b.dueDate||''),note:String(b.note||''),invoiceNumber:String(b.invoiceNumber||'').slice(0,100),invoiceName:String(b.invoiceName||'').slice(0,180),invoiceData:b.invoiceData||''}}
export async function handler(event){try{
 const c=await collection();
 if(event.httpMethod==='GET')return json(200,await c.find({}).sort({createdAt:-1}).toArray());
 if(!['POST','PUT','DELETE'].includes(event.httpMethod))return json(405,{message:'Method not allowed'});
 const b=event.body?JSON.parse(event.body):{};
 if(event.httpMethod==='POST'||event.httpMethod==='PUT'){
  const f=fields(b);
  if(!f.name||!Number.isFinite(f.amount)||f.amount<=0||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(f.dueDate)||!validFile(f.invoiceData))return json(400,{message:'Valid name, positive amount, deadline and invoice (max 2 MB) required'});
  if(event.httpMethod==='POST'){const doc={...f,status:'unpaid',paidDate:null,reminders:{},createdAt:new Date()};const r=await c.insertOne(doc);return json(201,{...doc,_id:r.insertedId});}
  const id=event.queryStringParameters?.id;if(!id||!ObjectId.isValid(id))return json(400,{message:'Valid id required'});
  const old=await c.findOne({_id:new ObjectId(id)});if(!old)return json(404,{message:'Debt not found'});
  const status=b.status==='paid'?'paid':'unpaid';
  const reminders=old.dueDate!==f.dueDate||old.status!==status?{}:old.reminders||{};
  await c.updateOne({_id:old._id},{$set:{...f,status,paidDate:status==='paid'?(b.paidDate||new Date().toISOString()):null,reminders,updatedAt:new Date()}});
  return json(200,{ok:true});
 }
 const id=event.queryStringParameters?.id;if(!id||!ObjectId.isValid(id))return json(400,{message:'Valid id required'});
 await c.deleteOne({_id:new ObjectId(id)});return json(200,{ok:true});
}catch(e){console.error(e);return json(500,{message:'Server error. Check server logs.'})}}
