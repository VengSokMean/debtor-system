import { collection,json } from './_db.mjs';
export const config={schedule:'0 1 * * *'}; // 08:00 Cambodia, UTC+7
const DAY=86400000;
const money=d=>d.currency==='USD'?`$${Number(d.amount).toFixed(2)}`:`${Number(d.amount).toLocaleString('en-US')} ៛`;
const safe=s=>String(s||'').replace(/[\r\n]+/g,' ').slice(0,130);
export async function handler(){try{
 const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
 if(!token||!chat)throw Error('Missing Telegram environment variables');
 const c=await collection(),today=new Date().toISOString().slice(0,10);
 const now=Date.parse(today+'T00:00:00Z');
 const debts=await c.find({status:'unpaid'}).toArray();
 const groups=[{label:'🚨 DUE TODAY',key:'due',items:[]},{label:'⚠️ OVERDUE',key:'overdue-'+today,items:[]},{label:'⏰ DUE TOMORROW',key:'1day',items:[]},{label:'📅 DUE IN 3 DAYS',key:'3days',items:[]}];
 for(const d of debts){if(!d.dueDate)continue;const diff=Math.round((Date.parse(d.dueDate+'T00:00:00Z')-now)/DAY);
 const g=diff===0?groups[0]:diff<0?groups[1]:diff===1?groups[2]:diff===3?groups[3]:null;
 if(g&&!d.reminders?.[g.key])g.items.push(d);
 }
 let sent=0;
 for(const g of groups){if(!g.items.length)continue;
 // Split large lists to stay under Telegram's 4096-character message limit.
 let batch=[],length=0;
 async function deliver(){if(!batch.length)return;
 const usd=batch.filter(d=>d.currency==='USD').reduce((s,d)=>s+Number(d.amount),0);
 const khr=batch.filter(d=>d.currency==='KHR').reduce((s,d)=>s+Number(d.amount),0);
 const lines=batch.map((d,i)=>`${i+1}. ${safe(d.name)} — ${money(d)}\n   Due: ${d.dueDate}${d.invoiceNumber?` | Invoice: ${safe(d.invoiceNumber)}`:''}`);
 const message=`🔔 DEBT PAYMENT REMINDER\n📅 ${today}\n\n${g.label}\n\n${lines.join('\n\n')}\n\nPeople: ${batch.length}\nTotal USD: $${usd.toFixed(2)}\nTotal KHR: ${khr.toLocaleString('en-US')} ៛`;
 const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:message})});
 if(!r.ok)throw Error('Telegram delivery failed: '+r.status);
 await c.bulkWrite(batch.map(d=>({updateOne:{filter:{_id:d._id,status:'unpaid'},update:{$set:{[`reminders.${g.key}`]:new Date()}}}})));
 sent+=batch.length;batch=[];length=0;
 }
 for(const d of g.items){const estimated=safe(d.name).length+safe(d.invoiceNumber).length+120;if(length+estimated>3200)await deliver();batch.push(d);length+=estimated;}
 await deliver();
 }
 return json(200,{ok:true,reminded:sent});
}catch(e){console.error(e);return json(500,{message:e.message})}}
