/* Private classroom rooms. Host clock and shared immigration are server-owned.
 * Colony economy reports are client-owned: classroom play, not ranked anti-cheat.
 * Memory-only rooms expire after 4 hours or service restart; no student identities. */
type Report={pop:number;beds:number;appeal:number;fame:number;open:boolean;day:number;blocked:boolean;over:boolean};
type Player={id:string;name:string;slot:number;token:string;seen:number;report:Report;grants:number};
type Room={code:string;host:string;players:Player[];seed:number;day:number;speed:number;started:boolean;last:number;created:number;pending:null|{pool:number;deadline:number};lastArrival:any;wave:number};
const rooms=new Map<string,Room>(),sessions=new Map<string,{code:string,id:string}>(),limits=new Map<string,{at:number,n:number}>();
const pace=[0,8000,4000,2000,1000,500];
const uid=()=>crypto.randomUUID().replaceAll('-','');
const clamp=(v:any,a:number,b:number)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
const awareness=(f:number)=>clamp(.25+Math.sqrt(clamp(f,0,10000))/20,.25,1);
function allocate(pool:number,players:Player[]){
 const weights=players.map(p=>p.report.open&&!p.report.over&&p.report.appeal>=35?Math.pow(p.report.appeal/100,2):0);
 const caps=players.map((p,i)=>weights[i]?Math.min(Math.max(0,Math.floor(p.report.beds-p.report.pop)),Math.ceil(pool*awareness(p.report.fame))):0);
 const seats=players.map(()=>0);let waiting=pool;
 while(waiting>0){let best=-1,priority=-1;players.forEach((p,i)=>{const q=weights[i]/(seats[i]+1);if(seats[i]<caps[i]&&q>priority){best=i;priority=q;}});if(best<0)break;seats[best]++;waiting--;}
 return {pool,seats,waiting};
}
function tick(r:Room,now:number){
 if(r.pending&&now>=r.pending.deadline){const eligible=r.players.filter(p=>now-p.seen<15000),result=allocate(r.pending.pool,eligible);eligible.forEach((p,i)=>{p.grants+=result.seats[i];p.report.pop+=result.seats[i];});r.lastArrival={...result,day:r.day,names:eligible.map(p=>p.name),wave:++r.wave};r.pending=null;r.last=now;return;}
 if(!r.started||!r.speed||r.pending||r.players.some(p=>now-p.seen>15000||p.report.blocked||p.report.day<r.day)){r.last=now;return;}
 if(now-r.last>=pace[r.speed]){r.day++;r.last=now;if(r.day%10===0)r.pending={pool:10,deadline:now+10000};}
}
function clean(now:number){for(const [code,r]of rooms)if(now-r.created>4*3600000){rooms.delete(code);for(const p of r.players)sessions.delete(p.token);}for(const [k,l]of limits)if(now-l.at>60000)limits.delete(k);}
function snapshot(r:Room,p:Player){return {code:r.code,you:p.id,slot:p.slot,host:r.host===p.id,seed:r.seed,day:r.day,speed:r.speed,started:r.started,pending:r.pending,grants:p.grants,lastArrival:r.lastArrival,expires:r.created+4*3600000,players:r.players.map(x=>({id:x.id,name:x.name,slot:x.slot,...x.report,online:Date.now()-x.seen<15000})),waitingFor:r.players.filter(x=>Date.now()-x.seen>15000||x.report.blocked).map(x=>x.name)};}
function report(v:any,previous:Report):Report{return {pop:Math.floor(clamp(v.pop,0,500)),beds:Math.floor(clamp(v.beds,0,600)),appeal:clamp(v.appeal,0,100),fame:clamp(v.fame,0,10000),open:v.open===true,day:Math.floor(clamp(v.day,1,10000)),blocked:v.blocked===true,over:v.over===true};}
const defaults:Report={pop:6,beds:8,appeal:45,fame:0,open:false,day:1,blocked:false,over:false};
function player(name:any,slot=0):Player{return {id:uid(),slot,token:uid()+uid(),name:String(name||'Colony').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,24)||'Colony',seen:Date.now(),report:{...defaults},grants:0};}
function response(data:any,status=200,cookie?:string){const h:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(cookie)h['Set-Cookie']=cookie;return new Response(JSON.stringify(data),{status,headers:h});}
const cookie=(id:string,t:string)=>'mars_room_'+id+'='+t+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400';
export async function handle(req:Request){
 const url=new URL(req.url),path=url.pathname.replace(/^\/room-api/,'')||'/',now=Date.now();
 if(path==='/health')return response({ok:true,service:'mars-classroom',version:2});
 clean(now);
 const origin=req.headers.get('origin');
 if(origin&&!['https://mars-colony-tau.vercel.app','https://dead-reckoning-blackout.vercel.app','http://127.0.0.1:8765','http://localhost:8765'].includes(origin))return response({error:'This origin is not allowed.'},403);
 if(req.method!=='POST')return response({error:'Use POST.'},405);
 if((req.headers.get('content-type')||'').split(';')[0]!=='application/json')return response({error:'JSON required.'},415);
 if(Number(req.headers.get('content-length')||0)>4096)return response({error:'Request too large.'},413);
 const ip=req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
 const rateKey=ip+(['create','join'].some(x=>path==='/'+x)?':entry':':state');
 const limit=limits.get(rateKey)||{at:now,n:0};limit.n++;limits.set(rateKey,limit);
 if(limit.n>(rateKey.endsWith(':entry')?30:2400))return response({error:'Please wait a moment before trying again.'},429);
 let body:any;try{const text=await req.text();if(text.length>4096)return response({error:'Request too large.'},413);body=JSON.parse(text);}catch{return response({error:'Invalid request.'},400);}
 if(!body||typeof body!=='object')return response({error:'Invalid request.'},400);
 if(path==='/create'||path==='/join'){
  if(rooms.size>=150&&path==='/create')return response({error:'Classrooms are full. Try again later.'},503);
  let r:Room;
  if(path==='/create'){let code=uid().slice(0,8).toUpperCase();while(rooms.has(code))code=uid().slice(0,8).toUpperCase();const p=player(body.name);r={code,host:p.id,players:[p],seed:Math.floor(Math.random()*1e8),day:1,speed:0,started:false,last:now,created:now,pending:null,lastArrival:null,wave:0};rooms.set(code,r);sessions.set(p.token,{code,id:p.id});return response(snapshot(r,p),200,cookie(p.id,p.token));}
  const found=rooms.get(String(body.code||'').trim().toUpperCase());if(!found)return response({error:'Room not found or expired. Ask the host for its eight-character code.'},404);r=found;
  if(r.started)return response({error:'This mission has started. Join the next room before launch.'},409);
  if(r.players.length>=8)return response({error:'This room already has eight colonies.'},409);
  // A member's site never shifts when the host leaves or another colony joins.
  const slot=Array.from({length:8},(_,i)=>i).find(i=>!r.players.some(p=>p.slot===i))!;
  const p=player(body.name,slot);r.players.push(p);sessions.set(p.token,{code:r.code,id:p.id});return response(snapshot(r,p),200,cookie(p.id,p.token));
 }
 const member=typeof body.member==='string'&&/^[a-f0-9]{32}$/.test(body.member)?body.member:'';
 const prefix='mars_room_'+member+'=';
 const token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(prefix))?.slice(prefix.length);
 const session=token&&sessions.get(token),r=session&&rooms.get(session.code),p=r?.players.find(x=>x.id===session?.id);
 if(!r||!p)return response({error:'Your room expired or restarted. Your single-player save is unchanged.'},401);
 p.seen=now;
 if(path==='/state'){if(body.report){const v=report(body.report,p.report);if(v.day>r.day||v.day<p.report.day)return response({error:'Colony clock is out of sync. Rejoin from the room panel.'},409);p.report=v;}tick(r,now);return response(snapshot(r,p));}
 if(path==='/control'){
  if(r.host!==p.id)return response({error:'Only the host controls time.'},403);
  if(body.start===true){r.started=true;r.last=now;}
  if(Number.isInteger(body.speed)&&body.speed>=0&&body.speed<=5){r.speed=body.speed;r.last=now;}
  if(body.remove){const leaving=r.players.find(x=>x.id===body.remove&&x.id!==p.id);if(leaving){sessions.delete(leaving.token);r.players=r.players.filter(x=>x!==leaving);}}
  return response(snapshot(r,p));
 }
 if(path==='/leave'){r.players=r.players.filter(x=>x!==p);sessions.delete(p.token);if(!r.players.length)rooms.delete(r.code);else if(r.host===p.id)r.host=r.players[0].id;return response({ok:true},200,cookie(p.id,'')+'; Max-Age=0');}
 return response({error:'Not found.'},404);
}
if(typeof Bun!=='undefined')Bun.serve({port:Number(Bun.env.PORT||3000),fetch:handle,maxRequestBodySize:4096});
