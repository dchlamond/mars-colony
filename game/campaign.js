/* Campaign extension. Blackout's controlled nine-day experiment stays isolated. */
(function(){
'use strict';
const R=window.CampaignRules,active=()=>!!S&&!window.Blackout?.isActive();
const speeds=[0,8000,4000,2000,1000,500];
const baseTick=tickSol,baseCompute=compute,baseShip=shipDay;
const baseBuild=tryBuild;
tryBuild=function(type,t){if(!active()||type!=='ice')return baseBuild(type,t);const needs=DEF.ice.needs;try{delete DEF.ice.needs;return baseBuild(type,t);}finally{DEF.ice.needs=needs;}};
window.G.tryBuild=tryBuild;
const data=()=>S.campaign||(S.campaign={version:1,pending:null,arrivals:[],discoveries:{},districts:[],dryDays:0,unsafeDays:0,warningDay:0,champion:false});
const event=(type,detail)=>document.dispatchEvent(new CustomEvent('campaign:'+type,{detail}));
function appeal(){return active()?R.quality(S,compute()):Junior.appealInfo();}
function colonies(){const e=compute();return [{id:'you',name:ME.name,pop:S.pop,beds:e.beds,appeal:appeal().score,fame:S.fame,open:!S.over&&S.padOpen},...S.rivals.map((r,i)=>({id:'r'+i,name:r.name,pop:r.pop,beds:r.pop+6,appeal:r.appeal,fame:Math.max(10,Math.floor(S.sol/3)+i*7),open:true}))];}
function queueWave(pool=10,invite=false){
 if(!active()||data().pending||window.Classroom?.connected)return;
 data().pending={id:S.sol+':'+pool,deadline:Date.now()+10000,pool,invite,first:!S.junior?.invited};S.speed=0;
 event('arrival',data().pending);log('Shuttle approach: 10 seconds to landing. Review beds, Appeal and Fame.','info');
}
function settle(now=Date.now()){
 if(!active())return false;const d=data(),p=d.pending;if(!p||now<p.deadline)return false;
 d.pending=null;const rows=colonies();let result;
 if(p.invite){const check=Junior.canInvite();if(!check.ok){S.junior.arrival=S.sol+1;event('alert',{title:'Shuttle holds in orbit',text:check.reason});return false;}result={pool:2,seats:[2,...S.rivals.map(()=>0)],waiting:0,aware:[2]};S.junior.invited=true;S.junior.totalArrivals=(S.junior.totalArrivals||0)+2;}
 else result=R.allocate(p.pool,rows);
 applyArrival(result.seats[0]||0,!p.invite||p.first);S.rivals.forEach((r,i)=>r.pop+=result.seats[i+1]||0);S.lastSplit=result.seats;claimAll();
 d.arrivals.unshift({...result,sol:S.sol,names:rows.map(r=>r.name)});d.arrivals=d.arrivals.slice(0,12);
 log('Shuttle landed: '+rows.map((r,i)=>r.name+' +'+result.seats[i]).join(', ')+'. '+result.waiting+' remain in orbit.','good');event('landed',d.arrivals[0]);render();return true;
}
function applyArrival(n,gear=true){n=Math.floor(R.clamp(n,0,100));if(S.over)return;S.pop+=n;if(gear)S.parts+=n*2;S.peak=Math.max(S.peak,S.pop);}
shipDay=function(){if(!active())return baseShip();if(S.sol%30===0){S.parts+=DF.ship;S.water=Math.min(200,(S.water??120)+24);log('Supply shuttle: +'+DF.ship+' parts and +24 water.','info');}if(!inBlackout())queueWave();};
// Commander makes room for a builder by moving optional industry to the end of
// the operator queue. Life support keeps first claim on available workers.
compute=function(){
 if(!active())return baseCompute();
 if(!S.junior&&!Number.isFinite(S.water))S.water=120;
 const original=S.builds,ordered=original.slice();
 if(!S.junior)ordered.sort((a,b)=>({pod:0,solar:1,reactor:2,moxie:3,ice:4,green:5,shield:6,habitat:6,battery:6,mine:9,dome:10}[a.type]??8)-({pod:0,solar:1,reactor:2,moxie:3,ice:4,green:5,shield:6,habitat:6,battery:6,mine:9,dome:10}[b.type]??8));
 const temp=[],w=R.weather(S.sol);let result;
 try{
  S.builds=ordered;
  // Solar transmittance is a game scenario; tau is shown separately as evidence.
  if(w?.active)for(const t of S.tiles){temp.push([t,t.sun]);t.sun*=w.solar;}
  if(!S.junior&&ordered.some(b=>!b.done)){
   const optional=ordered.filter(b=>b.done&&b.on&&['mine','dome'].includes(b.type));
   const workers=ordered.filter(b=>b.done&&b.on&&DEF[b.type].worker).length;
   if(workers>=S.pop&&optional.length){const b=optional.at(-1);temp.push([b,'on',b.on]);b.on=false;}
  }
  result=baseCompute();
  if(!S.junior){result.waterNet=ordered.filter(b=>b.type==='ice'&&b.done&&b.powered).length*4-S.pop*.25;}
 }finally{S.builds=original;for(const [o,key,value]of temp){if(key==='on')o.on=value;else o.sun=key;}}
 return result;
};
function failure(reason){if(S.over)return;S.cause=reason;S.speed=0;S.over='lose';event('alert',{title:'Colony evacuated',text:reason+' Your mission record is kept. Start a new colony from Settings.'});log(reason,'bad');}
function afterDay(){
 const d=data(),e=compute();
 if(!S.junior){if(!Number.isFinite(S.water))S.water=120;
  const processors=S.builds.filter(b=>b.type==='ice'&&b.done&&b.powered).length;
  S.water=Math.max(0,Math.min(200,S.water+processors*4-S.pop*.25));
  d.dryDays=S.water<=0?d.dryDays+1:0;if(d.dryDays===1)event('alert',{title:'Water exhausted',text:'Restore powered water processing within three days or the crew must evacuate.'});if(d.dryDays>=3)failure('Water unavailable for three days.');
 }
 S.appeal=R.quality(S,e).score;
 const w=R.weather(S.sol);
 if(S.sol===290)event('alert',{title:'Extreme survival begins on day 300',text:'Game scenario: day 300 and the escalating difficulty are our design, not a NASA historical date or forecast. Prepare batteries, reserves, shelters and backup power.'});
 if(w?.active){
  if((S.sol-300)%30===0){event('alert',{title:'Extreme dust · level '+w.cycle,text:'Game scenario inspired by the 2018 Opportunity storm: '+w.duration+' days, '+Math.round(w.solar*1000)/10+'% of normal solar output. These durations and losses are game rules, not recorded NASA values.'});}
  if(w.cold){S.battery=Math.max(0,S.battery-S.pop*.4*w.maintenance);S.parts=Math.max(0,S.parts-.25*w.maintenance);}
  if(w.radiation&&e.shelter<S.pop){d.unsafeDays++;if(d.unsafeDays>=2){const lost=Math.min(S.pop,Math.ceil((S.pop-e.shelter)*.25*w.maintenance));S.pop-=lost;log(lost+' unsheltered crew evacuated after the radiation alert.','bad');}}
  else d.unsafeDays=0;
  if(w.radiation&&(S.sol-300)%30===4)event('alert',{title:'Solar-particle alert',text:'Curiosity measured an 8,100 microgray event dose on 20 May 2024. Shelter capacity protects crew in this game. Add shelter before the next day.'});
  if(S.pop<=0)failure('The last crew evacuated during extreme weather.');
  if(S.junior?.recovery){S.junior.recovery=null;failure('Essential supplies failed during extreme survival.');}
 }
 // A new, distant completed district earns a single expansion reward.
 for(const b of S.builds)if(b.done&&['habitat','mine','ice'].includes(b.type)&&hdist(b,S.builds[0])>=4){const key=Math.floor(b.c/3)+':'+Math.floor(b.r/3);if(!d.districts.includes(key)){d.districts.push(key);S.parts+=6;addFame(5,'Expanded into a new district.');log('New district connected: +6 parts and +5 Fame. Expansion reveals nearby land.','good');}}
 if(S.junior&&S.junior.completed&&S.sol%10===0)queueWave();
 if(!S.junior&&S.sol%10===0&&!window.Classroom?.connected)S.rivals.forEach((r,i)=>{r.appeal=R.clamp(50+12*Math.sin(S.sol/47+i)+ColonySystems.rivalAppeal(r),35,90);});
 event('update',null);
}
tickSol=function(){
 if(!active())return baseTick();if(window.Classroom?.connected&&!Classroom.advancing)return;if(S.over||data().pending)return;
 if(S.junior?.arrival&&S.sol+1>=S.junior.arrival){S.junior.arrival=null;queueWave(2,true);return;}
 const before=S.sol,speed=S.speed;baseTick();
 if(S.sol!==before){afterDay();if(S.junior&&!S.junior.recovery&&!S.over&&!data().pending)S.speed=speed;}
};
setSpeed=function(s){s=Math.floor(R.clamp(s,0,5));if(window.Classroom?.connected)return Classroom.speed(s);S.speed=active()&&!S.over&&!data().pending?s:0;event('update',null);};
let elapsed=0,last=Date.now();
setInterval(()=>{
 const now=Date.now(),dt=Math.min(250,now-last);last=now;
 if(!active())return;settle(now);
 if(window.Classroom?.connected||document.hidden||modalOpen||R3?.fp||S.over||S.junior?.recovery||!S.speed||data().pending){elapsed=0;return;}
 elapsed+=dt;if(elapsed>=speeds[S.speed]){elapsed=0;tickSol();render();}
},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active())S.speed=0;});
const oldEnd=endGame;endGame=function(kind){if(active()&&kind==='win'&&data().champion){S.over=null;return;}oldEnd(kind);};
window.Campaign={active,data,appeal,colonies,queueWave,settle,applyArrival,afterDay,failure,speeds,get ownsClock(){return active();},get weather(){return active()?R.weather(S.sol):null;}};
window.G.tickSol=tickSol;window.G.compute=compute;
})();
