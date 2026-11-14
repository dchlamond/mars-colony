/* AI-assisted Ares Atlas Junior rules. Quantities and pacing are game models. See AI_USE.md. */
(function () {
'use strict';
const COSTS={solar:6,moxie:10,green:8,ice:10,shield:4,habitat:9,battery:8,rover:1,mine:6,dome:10,reactor:30};
const WORK={solar:8,moxie:8,green:8,ice:8,shield:8,habitat:12,battery:8,mine:10,dome:12,reactor:24};
const base={newGame,compute,tickSol,tryBuild,cancel,upgrade,upCost,buildMenu,render,setSpeed,buildingPanel,cleanPanels,startRover,orderCrate};
let nextMode=(window.__MARS_MODE__==='commander'||new URLSearchParams(location.search).get('mode')==='commander')?'commander':'junior';
const active=()=>!!S?.junior;
const cost=type=>COSTS[type]??DEF[type]?.cost??0;
const ready=type=>S.builds.filter(b=>b.type===type&&b.done&&b.on);
const science={solar:'Sunlight follows latitude on this NASA-based map. Dust blocks sunlight, so batteries matter.',moxie:'The NASA MOLA height map changes air thickness here. Lower ground gives our oxygen machine more gas to use.',green:'Plants need light and time. NASA grows plants in sealed space gardens; these four-day harvests are a game shortcut.',ice:'NASA demonstrated 98% recovery of collected water on the space station. Our processor recycles used water; on a likely-ice tile it also extracts new water. Game recovery rates are simplified, and ice tiles are not surveyed deposits.',shield:'Mars has thin air and no global magnetic shield. NASA measured radiation on Mars; our shelter sizes are game numbers.'};
function info(type){
 const lines={solar:'Makes up to 5 power in sunlight.',moxie:'Makes 4 × local air thickness. Uses 4 power.',green:'Makes 4 food after 4 powered days, or 6 with advanced water recycling. Uses 2 power and 0.5 water before recycling.',ice:'Recovers 95% of crew water and 90% of plant water. On likely ice, also extracts 4 water/day. Uses 2 power and 1 operator.',shield:'Shelters 6 people; a cave shelters 14.',habitat:'Adds 8 beds for new explorers.',battery:'Stores 40 spare power for dark days.',rover:'Two explorers survey nearby ground and return in 4 days.',mine:'Makes 1 part each day. Uses 2 power.',dome:'A shared place to relax. Uses 3 power.',reactor:'Makes 14 power, including during dust storms.'};
 return {name:type==='ice'?'Water Processor':DEF[type]?.name||type,source:type==='ice'?'NASA: water recovery on the space station':FACTS[type]?.s,url:type==='ice'?'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/':FACTS[type]?.u,cost:cost(type),days:Math.ceil((WORK[type]||4)/4),benefit:lines[type]||'',why:science[type]||FACTS[type]?.t||''};
}
function unlocked(){
 const p=S.junior.phase;
 S.unlocked={solar:true};
 if(p>=1)S.unlocked.moxie=true;
 if(p>=2)Object.assign(S.unlocked,{green:true,ice:true,rover:true});
 if(p>=3)Object.assign(S.unlocked,{habitat:true,battery:true});
 if(p>=4)S.unlocked.shield=true;
 if(p>=6)Object.assign(S.unlocked,{mine:true,dome:true,reactor:true});
}
function snapshot(){
 const omit=new Set(['mesh','astro','decor','solid','build','checkpoint']);
 // Remove scene references before JSON serialization: Three.js toJSON runs
 // before a replacer and may follow userData back into a building record.
 const clean=o=>Object.fromEntries(Object.entries(o).filter(([key])=>!omit.has(key)));
 return JSON.parse(JSON.stringify({...S,junior:clean(S.junior),builds:S.builds.map(clean),tiles:S.tiles.map(clean)}));
}
function checkpoint(){S.junior.checkpoint=snapshot();}
function init(){
 S.junior={version:2,phase:0,failures:0,recovery:null,invited:false,totalArrivals:0,arrival:null,dustDone:false,radiationDone:false,discovered:false,nextSupply:9,completed:false};
 S.o2=96;S.food=144;S.water=64;S.parts=68;S.metal=0;S.speed=0;S.nextStorm=S.nextDust=S.nextFestival=S.nextLab=S.nextQ=1e9;
 S.rescued=S.rescuedFood=true;S.padOpen=false;S.goal=0;S.management=null;S.operations=null;S.say='Start with sunlight. Build a solar panel, then choose Next day to see the crew work.';
 unlocked();S.eco=compute();checkpoint();
}
// A roster is a real allocation of the colony head count. Display figures must
// never add up to more than S.pop, and every machine needs its own operator.
const CREW_NAMES=['Nara','Tavi','Ivo','Mina','Sol','Ada'];
function crewRoles(){return active()?compute().crew:null;}
function allocateCrew(machines,sheltering){
 const total=Math.max(0,Math.floor(S.pop)),explorers=Math.min(total,S.rover?.crew||0);
 const assignments=Array.from({length:total},(_,id)=>({id,name:CREW_NAMES[id]||'Explorer '+(id+1),role:id>=total-explorers?'explorer':'resting',c:S.builds[0].c,r:S.builds[0].r}));
 const home=assignments.filter(p=>p.role!=='explorer');
 let operators=0,builders=0,cleaners=0,technicians=0,sheltered=0;
 if(sheltering){home.forEach(p=>p.role='sheltered');sheltered=home.length;}
 else{
  const priority={moxie:0,ice:1,green:2,reactor:3,mine:4,dome:5};
  for(const b of machines.slice().sort((a,b)=>(priority[a.type]??9)-(priority[b.type]??9)||S.builds.indexOf(a)-S.builds.indexOf(b))){
   const p=home[operators];if(!p)break;
   b.staffed=true;Object.assign(p,{role:'operator',c:b.c,r:b.r,buildingKey:b.c+','+b.r,type:b.type});operators++;
  }
  const available=home.slice(operators),job=S.builds.find(b=>!b.done);
  if(window.MissionSystems?.wantsTechnician()&&available.length){const p=available.shift(),solar=S.builds.find(b=>b.type==='solar'&&b.done&&b.on&&S.sol>=(b.offUntil||0));technicians=1;Object.assign(p,{role:'power',type:'solar',c:solar.c,r:solar.r,buildingKey:solar.c+','+solar.r});}
  if(S.cleaning){cleaners=Math.min(2,available.length);const solar=S.builds.find(b=>b.type==='solar'&&b.done)||S.builds[0];available.slice(0,cleaners).forEach(p=>Object.assign(p,{role:'cleaner',type:'solar',c:solar.c,r:solar.r,buildingKey:solar.c+','+solar.r}));}
  else if(job){builders=Math.min(2,available.length);available.slice(0,builders).forEach(p=>Object.assign(p,{role:'builder',c:job.c,r:job.r,buildingKey:job.c+','+job.r,type:job.type}));}
 }
 return {total,operators,builders,cleaners,technicians,explorers,sheltered,resting:total-operators-builders-cleaners-technicians-explorers-sheltered,constructionWork:builders*2,assignments};
}
function appealFor(e){
 const reasons=[];let score=40;
 const add=(ok,points,good,bad)=>{if(ok)score+=points;reasons.push({label:ok?good:bad,points:ok?points:0,ready:ok});};
 add(S.o2>=S.pop*2&&e.o2p>=S.pop,15,'Air is secure','Make and store enough air');
 add(S.food>=S.pop*2&&e.foodp>=S.pop,15,'Food is secure','Grow and store enough food');
 add(S.water>=Math.max(4,-e.waterNet*3),10,'Water reserve is healthy','Refill the water reserve');
 add(e.beds>=S.pop,5,'Everyone has a bed','More beds are needed');
 add(e.shelter>=S.pop,5,'Everyone has storm shelter','More storm shelter is needed');
 add(!e.shut&&!e.unstaffed,5,'Machines have power and crew','Some machines are waiting');
 add(e.cover>=S.pop,5,'Everyone can enjoy the recreation dome','Build a powered recreation dome for comfort');
 if(S.junior.recovery)score=Math.min(score,35);
 return {score:Math.max(0,Math.min(100,score)),label:score>=85?'Thriving':score>=65?'Settling in':'Needs care',reasons};
}
function juniorCompute(){
 // Old Junior saves predate the water ledger. Give them their normal starting
 // tank once; their existing buildings/mission progress remain intact.
 if(!Number.isFinite(S.water))S.water=64;
 const j=S.junior,away=S.rover?.crew||0,sheltering=!!S.storm?.active;
 const dust=S.dust?.active ? .35 : 1;
 let gen=0,store=0,shelter=0,beds=0,cover=0;
 const candidates=[];
 for(const b of S.builds){
  b.staffed=false;b.powered=false;b.cut=false;
  if(!b.done||!b.on||S.sol<(b.offUntil||0))continue;
  const d=DEF[b.type],t=tileAt(b.c,b.r),level=(b.lvl||1)>1;
  if(b.type==='pod'){gen+=3;beds+=8;shelter+=3;}
  if(b.type==='solar')gen+=5*(level?1.5:1)*t.sun*S.panelClean*dust*(window.MissionSystems?.solarMultiplier()||1);
  if(b.type==='battery')store+=40*(level?2:1);
  if(b.type==='habitat')beds+=level?12:8;
  if(b.type==='shield')shelter+=(t.type==='lava'?14:6)+(level?4:0);
  if(d.worker)candidates.push(b);
 }
 const crew=allocateCrew(candidates,sheltering),machines=candidates.filter(b=>b.staffed);
 machines.filter(b=>b.type==='reactor').forEach(b=>{gen+=14;b.powered=true;});
 const consumers=machines.filter(b=>DEF[b.type].use);
 let demand=consumers.reduce((n,b)=>n+DEF[b.type].use+((b.lvl||1)>1?(UPG[b.type]?.use||0):0),0),shut=0;
 const available=gen+S.battery;
 for(const type of ['dome','mine','green','ice','moxie'])for(const b of consumers.filter(x=>x.type===type).reverse()){
  const use=DEF[b.type].use+((b.lvl||1)>1?(UPG[b.type]?.use||0):0);
  if(demand>available+1e-9){b.cut=true;demand-=use;shut++;}
 }
 consumers.forEach(b=>b.powered=!b.cut);
 const on=type=>machines.filter(b=>b.type===type&&b.powered),processors=on('ice');
 const greens=on('green'),ripe=greens.filter(b=>(b.age||0)>=4);
 const waterRecovery=processors.length?.95:.75,plantRecovery=processors.length?.9:.5;
 const waterCrewUse=S.pop,waterPlantUse=greens.length*.5,waterUse=waterCrewUse+waterPlantUse;
 const waterRecovered=waterCrewUse*waterRecovery+waterPlantUse*plantRecovery;
 const waterExtracted=processors.reduce((n,b)=>n+(tileAt(b.c,b.r).type==='ice'?4*((b.lvl||1)>1?1.5:1):0),0);
 const waterp=waterRecovered+waterExtracted,waterNet=waterp-waterUse;
 const watered=S.water>0&&processors.length>0;
 const o2p=on('moxie').reduce((n,b)=>n+4*tileAt(b.c,b.r).air*((b.lvl||1)>1?1.5:1),0);
 const foodp=S.water<=0?0:ripe.reduce((n,b)=>n+4+(watered?2:0)+((b.lvl||1)>1?2:0),0);
 cover=on('dome').length*8;
 const result={away,reserved:crew.explorers,gen,demand,store,shelter,staffed:crew.operators,idle:crew.builders,constructionWork:crew.constructionWork,crew,shut,unstaffed:sheltering?0:candidates.length-machines.length,o2p,foodp,waterp,waterUse,waterNet,waterRecovered,waterExtracted,waterRecovery,waterCrewUse,waterPlantUse,metalp:0,partsp:on('mine').length,beds,cover,noise:0,domes:on('dome').length,greens:ripe.length,seedlings:greens.length-ripe.length,dry:watered?0:ripe.length,sheltering,dust};
 result.appeal=appealFor(result);S.appeal=result.appeal.score;
 return result;
}
compute=function(){return active()?juniorCompute():base.compute();};
function canInvite(){
 if(!active())return {ok:false,reason:'Available in Junior missions.'};
 const j=S.junior,e=compute(),n=S.pop+2,pending=!!j.arrival;
 const blocked=reason=>({ok:false,pending,blocked:pending,reason:pending?'Shuttle waiting in orbit: '+reason:reason});
 if(j.recovery)return {ok:false,reason:'Retry this checkpoint first.'};
 if(j.invited&&j.phase<7)return {ok:false,reason:'Your two explorers are home. Finish this mission before inviting more.'};
 if(j.phase<3)return {ok:false,reason:'Finish your first harvest first.'};
 if(S.dust?.active||S.storm?.active)return blocked('Wait until the storm is over.');
 if(e.beds<n)return blocked('Build a habitat: two more beds are needed.');
 if(e.o2p<n)return blocked('Make '+n+' air each day for the larger crew.');
 if(S.water<Math.max(4,2*Math.max(0,-e.waterNet+2*(1-e.waterRecovery))))return blocked('Keep two days of water in reserve after recycling.');
 if(e.foodp<n)return blocked('Grow '+n+' food each day for the larger crew.');
 if(S.o2<n*2||S.food<n*2)return blocked('Keep two days of air and food in reserve.');
 if(e.unstaffed)return blocked('Some machines need operators. Switch off optional machines first.');
 if(pending)return {ok:false,pending:true,blocked:false,reason:'Shuttle booked. Two explorers arrive next day.'};
 return {ok:true,reason:'Air, food, water and beds are ready. Two explorers can arrive next day.'};
}
function invite(){if(!canInvite().ok)return false;S.junior.arrival=S.sol+1;log('Two explorers accepted your invitation. Their shuttle arrives next day.','good');render();return true;}
function objective(){
 if(!active())return {title:GOALS[S.goal].text,detail:S.say||'',action:'build',phase:S.goal};
 const j=S.junior,e=S.eco||compute();
 if(j.recovery)return {title:'Try this part again',detail:j.recovery+' Retry the checkpoint and change your plan. Your earlier discoveries stay complete.',action:'recover',phase:j.phase};
 const goals=[
 ['Build a solar panel','Choose a sunny tile. It takes two days to build.','build'],
 ['Make air for everyone','Your crew use '+S.pop+' air each day. Lower ground helps oxygen extractors.','build'],
 ['Grow food for everyone','Recycle your water, then keep greenhouses powered for four days. Your crew need '+S.pop+' food each day.','build'],
 ['Welcome two explorers',canInvite().reason,'crew'],
 ['Prepare for the dust storm',S.dust?.active?'Dust dims solar panels. Stored power keeps air and food machines running.':'Build a battery and store spare power. Dust arrives in '+Math.max(0,(S.dust?.arrive||S.sol)-S.sol)+' days.','build'],
 ['Protect the crew from radiation',S.storm?.active?'Everyone is taking cover. Stored air and food keep them safe.':'Build enough soil shelter for '+S.pop+' people. Radiation arrives in '+Math.max(0,(S.storm?.arrive||S.sol)-S.sol)+' days.','build'],
 ['Explore and keep the town supplied',e.shelter<S.pop?'Add enough shelter for everyone, then send a rover to nearby ground.':'Send a rover to nearby ground. Keep making enough air and food while your explorers are away.',e.shelter<S.pop?'build':'explore'],
 ['Mars is becoming home','You grew food, welcomed explorers, prepared for storms and surveyed Mars. Keep building or start a Commander mission.','next']
 ];
 const row=goals[Math.min(j.phase,7)];
 if(S.panelClean<.75&&j.phase>=4&&!S.storm?.active)return {title:'Brush dust off the panels',detail:e.crew.resting+e.crew.builders+e.crew.cleaners<1?'Free one crew member by switching off an optional machine, then clean the panels.':'Dust is reducing your power. Cleaning pauses construction for one day.',action:'clean',phase:j.phase};
 if(j.phase===2&&!ready('ice').some(b=>b.powered))return {title:'Recycle your water',detail:'Build a Water Processor on any clear tile and power it. On likely ice it also extracts new water.',action:'build',phase:j.phase};
 if(e.unstaffed>0)return {title:'Give the crew room to work',detail:e.unstaffed+' machine'+(e.unstaffed===1?' needs':'s need')+' an operator. Switch off optional machines or prepare for more explorers.',action:'build',phase:j.phase};
 if(e.shut>0&&j.phase<4)return {title:'Give your machines enough power',detail:e.shut+' machine'+(e.shut===1?' is':'s are')+' waiting for power. Add solar panels or switch something off.',action:'build',phase:j.phase};
 return {title:row[0],detail:row[1],action:row[2],phase:j.phase};
}
function progress(){
 const j=S.junior,e=S.eco=compute();let done=false;
 switch(j.phase){
  case 0:done=count('solar')>0;break;
  case 1:done=e.o2p>=S.pop;break;
  case 2:done=e.foodp>=S.pop&&ready('ice').some(b=>b.powered);break;
  case 3:done=j.invited;break;
  case 4:done=j.dustDone;break;
  case 5:done=j.radiationDone;break;
  case 6:done=j.discovered&&!S.rover&&e.o2p>=S.pop&&e.foodp>=S.pop&&e.shelter>=S.pop;break;
 }
 if(!done)return;
 j.phase++;S.goal=Math.min(j.phase,GOALS.length-1);unlocked();S.parts+=3;if(window.MissionSystems)MissionSystems.milestone(j.phase);else S.fame+=3;
 if(j.phase===4){S.dust={arrive:S.sol+5,active:false,end:S.sol+8,len:3,bad:false,imp0:S.imports};log('Dust forecast: five days to fill a battery. The storm will last three days.','info');}
 if(j.phase===5){S.storm={arrive:S.sol+5,active:false,end:S.sol+6,choice:'shelter',ev:STORMS[0]};log('Radiation practice alert: five days to build shelter. This scenario uses NASA science, not a live forecast.','info');}
 if(j.phase===7){j.completed=true;S.indep=100;log('Mission complete: your town makes its own air and food, protects its crew and explores Mars.','good');}
 S.say=objective().detail;log('Discovery complete. '+objective().title+'. +3 parts.','good');checkpoint();buildMenu();
}
function shortage(reason){S.junior.recovery=reason;S.speed=0;log(reason+' Day advancement is paused. Retry your last checkpoint.','bad');}
function recover(){
 if(!active()||!S.junior.checkpoint)return false;
 const old=S.junior,stored=old.checkpoint,failures=old.failures+1;
 S=JSON.parse(JSON.stringify(stored));S.junior.failures=failures;S.junior.recovery=null;S.junior.checkpoint=stored;
 S.builds.forEach(b=>{tileAt(b.c,b.r).build=b;});S.speed=0;buildSel=null;modalQ=[];modalOpen=false;$('overlay').style.display='none';
 rng=mulberry(S.seed);if(R3)buildWorld();log('Checkpoint restored. Progress since this checkpoint was undone; try a different plan.','info');buildMenu();render();return true;
}
function nextDay(){
 if(!active())return false;
 if(S.junior.recovery||modalOpen)return false;
 tickSol();S.speed=0;window.Junior.animationUntil=performance.now()+1800;render();return true;
}
tickSol=function(){
 if(!active())return base.tickSol();
 const j=S.junior;if(S.over||j.recovery)return;
 S.sol++;S.speed=0;
 if(S.sol>=j.nextSupply){S.parts+=8;S.water=Math.min(Math.max(160,S.pop*10),S.water+12);j.nextSupply+=8;log('Supply shuttle: +8 parts and +12 water. Next delivery in eight days.','info');}
 if(j.arrival&&S.sol>=j.arrival){
  // A reserved seat does not overrule life support if the player switches machines off.
  const arrival=j.arrival;j.arrival=null;const check=canInvite();
  if(check.ok){const first=!j.invited;S.pop+=2;if(first)S.parts+=4;j.invited=true;j.totalArrivals=(j.totalArrivals||0)+2;S.lastSplit=[2,0,0];log('Two explorers arrived.'+(first?' Their first-mission equipment adds 4 parts.':'')+' The crew now need '+S.pop+' air and food each day.','good');}
  else {j.arrival=arrival+1;log('The shuttle is waiting safely in orbit: '+check.reason,'info');}
 }
 if(S.dust&&!S.dust.active&&S.sol>=S.dust.arrive){S.dust.active=true;log('Dust storm: solar power falls to about one third for three days.','bad');}
 if(S.dust?.active&&S.sol>=S.dust.end){S.dust=null;j.dustDone=true;S.panelClean=.7;log('Dust storm finished. Dust remains on the panels; clean them to restore power.','good');}
 if(S.storm&&!S.storm.active&&S.sol>=S.storm.arrive){
  S.storm.active=true;S.storm.end=S.sol+(compute().shelter>=S.pop?1:2);
  if(compute().shelter<S.pop){S.parts=Math.max(0,S.parts-2);log('Too few sheltered spaces. The crew retreat to the landing ship; work pauses for two days and transport uses 2 parts.','bad');}
  else log('Shelters ready. Everyone takes cover for one day; stored air and food keep the town safe.','good');
 }
 if(S.storm?.active&&S.sol>=S.storm.end){S.storm=null;j.radiationDone=true;log('Radiation practice finished. The crew are back at work.','good');}
 let e=compute();
 if(S.cleaning>0&&!e.sheltering&&e.crew.cleaners>0){S.cleaning--;if(!S.cleaning){S.panelClean=1;log('Panels clean. Solar power is restored.','good');}}
 else if(!e.sheltering){const job=S.builds.find(b=>!b.done);if(job){job.progress+=e.constructionWork;if(job.progress>=(WORK[job.type]||8)){job.done=true;job.on=true;job.age=0;S.tiles.forEach(t=>{if(hdist(t,job)<=2&&!t.owner)t.seen=true;});log(info(job.type).name+' is ready.','good');const f=FACTS[job.type];if(f&&!S.seenFacts[job.type]){S.seenFacts[job.type]=true;S.journal.push({title:info(job.type).name,why:science[job.type]||f.t,src:job.type==='ice'?'NASA: water recovery on the space station':f.s,u:job.type==='ice'?'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/':f.u});}}}}
 e=compute();for(const b of S.builds)if(b.type==='green'&&b.done&&b.powered)b.age=(b.age||0)+1;
 if(S.dust?.active)S.panelClean=Math.max(.7,S.panelClean-.025);
 e=S.eco=compute();S.battery=Math.max(0,Math.min(e.store,S.battery+e.gen-e.demand));
 S.o2=Math.max(0,Math.min(capO2(),S.o2+e.o2p-S.pop));S.food=Math.max(0,Math.min(capFood(),S.food+e.foodp-S.pop));S.parts+=e.partsp||0;S.water=Math.max(0,Math.min(Math.max(160,S.pop*10),S.water+e.waterNet));
 window.MissionSystems?.finishDay(e);
 if(S.rover){roverStep();if(S.rover?.done)j.discovered=true;}
 if(S.o2<=0)shortage('The air reserve ran out. Build oxygen and power earlier.');
 else if(S.food<=0)shortage('The food reserve ran out. Start and power your greenhouses earlier.');
 else if(S.water<=0)shortage('The water reserve ran out. Power a Water Processor to recover more water, or build one on likely ice for new water.');
 S.appeal=appealFor(e).score;S.peak=Math.max(S.peak,S.pop);
 if(!j.recovery)progress();
 S.say=objective().detail;
};
newGame=function(seed,site){base.newGame(seed,site);if(nextMode==='junior')init();};
setSpeed=function(speed){return base.setSpeed(active()?0:speed);};
tryBuild=function(type,t){
 if(!active())return base.tryBuild(type,t);
 if(S.junior.recovery)return 'Retry the checkpoint before building.';
 if(!t||!S.unlocked[type])return 'Finish the current mission to unlock this choice.';
 if(type==='rover')return startRover(t);
 if(t.owner)return 'This is a neighbouring colony’s land.';
 if(!t.seen)return 'Explore this ground with your rover first.';
 if(t.build)return 'There is already something here.';
 if(t.type==='rock')return 'Choose a clear tile.';
 // Junior water processors recycle on any clear tile; extraction needs likely ice.
 if(S.builds.some(b=>!b.done))return 'Let the crew finish this building first.';
 if(S.parts<cost(type))return 'This needs '+cost(type)+' parts. The next supply shuttle arrives in '+(S.junior.nextSupply-S.sol)+' days.';
 S.parts-=cost(type);const b={type,c:t.c,r:t.r,done:false,on:true,progress:0,juniorCost:cost(type)};S.builds.push(b);t.build=b;log('Building '+info(type).name+'. '+cost(type)+' parts spent.','info');render();return null;
};
cancel=function(b){if(!active())return base.cancel(b);if(b.done||!S.builds.includes(b))return;S.parts+=b.juniorCost??cost(b.type);S.builds.splice(S.builds.indexOf(b),1);tileAt(b.c,b.r).build=null;render();};
upCost=function(b){return active()?{parts:Math.ceil(cost(b.type)/2)+2,metal:0}:base.upCost(b);};
upgrade=function(b){if(!active())return base.upgrade(b);if(!S.builds.includes(b)||!b.done||!UPG[b.type]||(b.lvl||1)>1)return 'This building cannot be upgraded.';const c=upCost(b);if(S.parts<c.parts)return 'You need '+c.parts+' parts.';S.parts-=c.parts;b.lvl=2;b.offUntil=S.sol+2;b.solid=null;render();return null;};
startRover=function(t){
 if(!active())return base.startRover(t);
 if(!t||t.owner)return 'Choose unclaimed ground.';
 if(S.rover)return 'Your explorers are already travelling.';
 const d=hdist(t,S.builds[0]);if(d<3||d>10)return 'Choose ground 3 to 10 tiles from the landing pod.';
 if(S.parts<1)return 'Exploring needs 1 part.';
 if(S.storm?.active)return 'Wait until the radiation alert is over.';
 const e=compute();if(e.crew.resting+e.crew.builders+e.crew.cleaners<2)return 'Keep the machine operators at home. Switch off optional machines or welcome more crew before sending two explorers.';
 S.parts--;S.trips++;S.rover={c:t.c,r:t.r,crew:2,start:S.sol,arrive:S.sol+2,back:S.sol+4,done:false};log('Two explorers leave. They survey the site in two days and return in four.','info');render();return null;
};
cleanPanels=function(){if(!active())return base.cleanPanels();if(S.cleaning||!count('solar')||S.junior.recovery)return;S.cleaning=1;log('The crew will clean the panels next day. Construction waits for one day.','info');render();};
orderCrate=function(type){if(!active())return base.orderCrate(type);log('Junior supplies bring 8 parts and 12 water every eight days. Retry a checkpoint if a reserve runs out.','info');render();};
buildMenu=function(){base.buildMenu();if(!active())return;document.querySelectorAll('#build .bbtn').forEach(b=>{const d=info(b.dataset.t);b.querySelector('b').textContent=d.name;b.querySelector('small').textContent=d.benefit;b.querySelector('.cost').textContent=d.cost+' parts · from '+d.days+' days';});};
buildingPanel=function(b){
 if(!active())return base.buildingPanel(b);
 Strategy.openTab('buildings');let panel=$('selection');if(!panel){panel=document.createElement('section');panel.id='selection';document.querySelector('[data-panel="buildings"]').prepend(panel);}
 const d=info(b.type),f=FACTS[b.type];
 panel.innerHTML='<h2>'+esc(d.name)+'</h2><p>'+esc(d.benefit)+'</p><p>'+(b.done?b.on?'Automatic crew assignment.':'Switched off.':'Building: '+Math.floor(b.progress)+' / '+(WORK[b.type]||8)+' work.')+'</p>'+(f?'<details><summary>Why does this matter?</summary><p>'+esc(d.why)+'</p>'+link(d.source||f.s,d.url||f.u)+'</details>':'')+'<div class="actionlist">'+(!b.done?'<button id="juniorCancel">Cancel and refund '+(b.juniorCost??cost(b.type))+' parts</button>':DEF[b.type].use?'<button id="juniorToggle">'+(b.on?'Switch off':'Switch on')+'</button>':'')+'</div>';
 $('juniorCancel')?.addEventListener('click',()=>{cancel(b);panel.remove();});$('juniorToggle')?.addEventListener('click',()=>{toggle(b);buildingPanel(b);render();});$('machineCare')?.remove();
};
function update(){
 document.body.classList.toggle('junior-mode',active());
 if(!active())return;
 const o=objective();$('clock').textContent='Day '+S.sol;$('goal').textContent=o.title;$('say').textContent=o.detail;
 document.querySelectorAll('#build .bbtn').forEach(b=>b.classList.toggle('poor',S.parts<cost(b.dataset.t)));
 if($('buildhint')&&buildSel)$('buildhint').textContent=info(buildSel).benefit+' Costs '+cost(buildSel)+' parts. Choose a tile.';
 document.dispatchEvent(new CustomEvent('junior:update'));
}
render=function(){base.render();update();};
function start(mode='junior',site=0,seed){
 nextMode=mode==='commander'?'commander':'junior';modalQ=[];modalOpen=false;$('overlay').style.display='none';buildSel=null;newGame(seed,site);buildMenu();render();return S;
}
let noticeTimer;
const juniorTryBuild=tryBuild;
tryBuild=function(type,t){
 const error=juniorTryBuild(type,t);
 if(active()&&error){const notice=$('notice');if(notice){notice.textContent=error;notice.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.classList.remove('visible'),5500);}}
 return error;
};
window.Junior={isActive:active,work:type=>WORK[type]||8,crewRoles,appealInfo:()=>active()?compute().appeal:null,start,nextDay,objective,mission:objective,cost,info,invite,canInvite,recover,retryCheckpoint:recover,clean:cleanPanels,growthDays:4,animationUntil:0,setModeForNewGame:mode=>{nextMode=mode==='commander'?'commander':'junior';},summary:()=>active()?{...S.junior,checkpoint:undefined,objective:objective(),economy:compute(),nextSupply:S.junior.nextSupply-S.sol}:null};
Object.assign(G,{newGame,compute,tickSol,tryBuild,upgrade,startRover,cleanPanels,orderCrate});
if(nextMode==='junior')init();buildMenu();render();
})();
