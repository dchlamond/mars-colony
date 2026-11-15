import assert from 'node:assert/strict';
import {handle} from '../server/rooms.ts';
let checks=0;const ok=(a,b)=>{assert.deepEqual(a,b);checks++;};
const realNow=Date.now;let now=realNow();Date.now=()=>now;
async function call(path,body={},cookie='',origin='https://mars-colony-tau.vercel.app'){
 const r=await handle(new Request('https://rooms.test/'+path,{method:'POST',headers:{'content-type':'application/json',cookie,origin,'x-real-ip':'test'},body:JSON.stringify(body)}));return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
try{
 const a=await call('create',{name:'Alpha'});ok(a.status,200);ok(a.data.players.length,1);assert.match(a.cookie,/mars_room_[a-f0-9]{32}=/);checks++;
 const b=await call('join',{name:'Beta',code:a.data.code});ok(b.status,200);ok(b.data.players.length,2);
 ok(a.data.slot,0);ok(b.data.slot,1);ok(b.data.players.map(p=>p.slot),[0,1]);
 const sharedCookies=a.cookie+'; '+b.cookie;
 const separate=await call('state',{member:b.data.you,report:{pop:9,beds:12,appeal:80,fame:20,day:1,open:true,blocked:false,over:false}},sharedCookies);
 ok(separate.data.you,b.data.you);ok(separate.data.players.find(p=>p.id===a.data.you).pop,6);ok(separate.data.players.find(p=>p.id===b.data.you).pop,9);
 ok((await call('control',{member:b.data.you,speed:5},b.cookie)).status,403);
 ok((await call('state',{member:b.data.you},a.cookie)).status,401);
 ok((await call('state',{member:a.data.you},a.cookie,'https://evil.test')).status,403);
 const report=(day,appeal,fame)=>({pop:6,beds:30,appeal,fame,day,open:true,over:false,blocked:false});
 await call('control',{member:a.data.you,start:true,speed:1},a.cookie);
 let day=1,pending;
 for(let i=0;i<9;i++){
  await call('state',{member:a.data.you,report:report(day,100,225)},a.cookie);
  await call('state',{member:b.data.you,report:report(day,50,225)},b.cookie);
  now+=8000;
  const s=await call('state',{member:a.data.you,report:report(day,100,225)},a.cookie);day=s.data.day;pending=s.data.pending;
  await call('state',{member:b.data.you,report:report(day,50,225)},b.cookie);
 }
 ok(day,10);ok(pending.pool,10);ok(pending.deadline-now,10000);
 now+=9999;const before=await call('state',{member:a.data.you,report:report(day,100,225)},a.cookie);ok(before.data.grants,0);
 now+=1;const after=await call('state',{member:a.data.you,report:report(day,100,225)},a.cookie);ok(after.data.lastArrival.seats.reduce((a,b)=>a+b,0)+after.data.lastArrival.waiting,10);assert.ok(after.data.lastArrival.seats[0]>after.data.lastArrival.seats[1]);checks++;
 const again=await call('state',{member:a.data.you},a.cookie);ok(again.data.grants,after.data.grants);
 ok((await call('join',{code:a.data.code,name:'Late'})).status,409);
 await call('state',{member:b.data.you,report:{...report(day,50,225),blocked:true}},b.cookie);now+=8000;
 ok((await call('state',{member:a.data.you},a.cookie)).data.day,10);
 await call('leave',{member:a.data.you},a.cookie);const transferred=await call('state',{member:b.data.you},b.cookie);ok(transferred.data.host,true);ok(transferred.data.slot,1);
 const fresh=await call('create',{name:'Room2'}),members=[fresh];for(let i=1;i<8;i++)members.push(await call('join',{name:'Colony '+i,code:fresh.data.code}));
 ok(members.map(m=>m.data.slot),[0,1,2,3,4,5,6,7]);ok((await call('join',{name:'Ninth',code:fresh.data.code})).status,409);
 await call('leave',{member:members[3].data.you},members[3].cookie);const replacement=await call('join',{name:'Replacement',code:fresh.data.code});ok(replacement.data.slot,3);
 for(const m of members.filter((_,i)=>i!==3))ok((await call('state',{member:m.data.you},m.cookie)).data.slot,m.data.slot);
 now+=4*3600000+1;ok((await call('state',{member:b.data.you},b.cookie)).status,401);
 console.log(JSON.stringify({checks,result:'passed',coverage:'stable eight-player slots, per-member reports/cookies/grants, host permissions, synchronized days, ten-second countdown, conservation, duplicate polling, launch lock, pause, host transfer, expiry'}));
}finally{Date.now=realNow;}
