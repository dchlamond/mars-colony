/* BLACKOUT short mission. AI-assisted implementation; NASA observations and
   intentionally compressed training rules are distinguished in the evidence. */
(function(){
'use strict';
const VERSION=1,RULES='blackout-1',DATA='mola-horizons-20261114',HORIZON=9,STEP_MINUTES=20,HISTORY_KEY='blackout-attempts-v1';
const SOURCE_ROWS=window.MARS_EPHEMERIS?.rows||[];
const SOURCES=[
 {id:'horizons',title:'Earth–Mars light time',kind:'NASA/JPL calculation',url:'https://ssd.jpl.nasa.gov/horizons/',date:'2023-11-20',text:'The saved Horizons record gives one-way light time in minutes. We approximate the signal-only round trip by doubling it, before human reply time. Each day with a usable link adds 20 minutes to the teaching reply queue. Pausing this queue is a classroom shortcut, not stopped light or the length of a Martian day.'},
 {id:'conjunction',title:'Planning through solar conjunction',kind:'Historical NASA operations',url:'https://www.nasa.gov/solar-system/planets/mars/nasas-mars-fleet-will-still-conduct-science-while-lying-low/',date:'2023-11',text:'NASA paused Mars commanding during solar conjunction while preplanned science continued. Our scheduled radio pause is a training scenario. It does not turn off sunlight or cause the separately scheduled dust and radiation exercises.'},
 {id:'mola',title:'A map measured by a laser',kind:'NASA source plus model',url:'https://trek.nasa.gov/mars/',text:'MOLA elevation supplies the global map. Our height-to-air production formula and exaggerated local terrain are simplified models.'},
 {id:'rad',title:'Radiation is not temperature',kind:'Observation and teaching model',url:'https://science.nasa.gov/resource/radiation-measurements-on-mars/',text:'Curiosity RAD measures ionizing radiation. This mission compares a simulated relative exposure index: 100 outside and 30 at the shelter marker. These are not dose readings or NASA protection ratings.'},
 {id:'solar',title:'Pointing panels toward the Sun',kind:'Engineering principle plus game tuning',url:'https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/',text:'Array orientation changes solar collection. The game charges 2 Parts and one technician day for a 20% boost lasting three production days; those quantities are game rules.'},
 {id:'water',title:'Reuse water, but do not create it',kind:'NASA principle plus game tuning',url:'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',text:'NASA demonstrated 98% recovery of collected water on the ISS. Our staffed processor recovers 95% of crew water; the simplified game still consumes fresh water.'}
];
const STAGES={prediction:['One mission. Two futures.','Six crew are ready. Predict which preparation will help when dust reduces sunlight.'],preparation:['Make your preparation','Spend a limited budget before the quiet radio period. Both useful options have a cost.'],field:['Use evidence to choose shelter','Predict, compare two simulated readings, then choose where the crew will take cover.'],request:['Ask Earth, then plan locally','A radio reply takes time. Request advice, then run the outpost while it travels.'],running:['Keep the colony working','Advance deliberately. Watch reserves, production and the crew. Radio loss alone does not switch off the power.'],outcome:['Your first future','Review what happened, then change one preparation under exactly the same conditions.'],explain:['What caused the difference?','Use the two real simulation outcomes to explain what changed.'],transfer:['Try a new situation','A new machine needs power too. What would you check before switching it on?'],complete:['Mission evidence ready','You planned, observed, compared and explained. Your evidence stays on this device.' ]};
let internal=false,permitTick=false,lastError='',storageWarning='',dispatching=false,memoryHistory={},historyPending=false;
const clone=v=>JSON.parse(JSON.stringify(v));
const isActive=()=>!!S?.blackout&&S.blackout.version===VERSION;
const state=()=>isActive()?S.blackout:null;
const val=p=>p&&typeof p==='object'?p.value:p;
function emit(){if(dispatching)return;dispatching=true;document.dispatchEvent(new CustomEvent('blackout:update'));dispatching=false;}
function storageFailed(){storageWarning='Device storage is unavailable. First attempts remain separate while this page stays open. Export the evidence card before closing it.';}
function validHistoryResult(r){return !!r&&typeof r==='object'&&typeof r.safe==='boolean'&&r.rules===RULES&&r.data===DATA&&r.score&&Array.isArray(r.score.rank)&&r.score.rank.length===4&&r.score.rank.every(Number.isFinite)&&['day','air','food','water','parts','battery'].every(k=>Number.isFinite(r[k]));}
function history(){
 try{
  const raw=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}'),h={};
  if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const [code,entry] of Object.entries(raw)){
   if(normalizeCode(code)&&entry?.rules===RULES&&entry.data===DATA&&validHistoryResult(entry.first)&&Array.isArray(entry.practice)&&entry.practice.every(validHistoryResult))h[code]=entry;
   else storageWarning='Some saved attempt history could not be read. The current mission remains playable; export its evidence card.';
  }
  // An unsuccessful write must not erase an earlier attempt on retry. Keep the
  // unsaved history in this session and merge it before the next write.
  memoryHistory=historyPending?{...h,...memoryHistory}:h;
 }catch{storageFailed();}
 return clone(memoryHistory);
}
function storeHistory(h){memoryHistory=clone(h);historyPending=true;try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h));historyPending=false;return true;}catch{storageFailed();return false;}}
function normalizeCode(input){
 const match=String(input||'DRB1-20261114-0').trim().toUpperCase().match(/^DRB1-(\d{1,10})-([0-3])$/);
 if(!match)return null;
 const seed=Number(match[1]);if(!Number.isInteger(seed)||seed<1||seed>2147483647)return null;
 return {code:'DRB1-'+seed+'-'+match[2],seed,site:Number(match[2]),rules:RULES,data:DATA};
}
function stamp(){return {day:S.sol,air:S.o2,food:S.food,water:S.water,parts:S.parts,battery:S.battery,pop:S.pop,fame:S.fame};}
function compactEconomy(e){return {generation:e.gen,demand:e.demand,airProduced:e.o2p,foodProduced:e.foodp,waterNet:e.waterNet,shut:e.shut,unstaffed:e.unstaffed,operators:e.crew.operators,technicians:e.crew.technicians,builders:e.crew.builders,sheltered:e.crew.sheltered,resting:e.crew.resting};}
function rosterSite(type,offset){
 const pod=S.builds[0],free=S.tiles.filter(t=>!t.build&&!t.owner&&t.type!=='rock'&&hdist(t,pod)<=4).sort((a,b)=>{
  const da=(a.c-pod.c-offset[0])**2+(a.r-pod.r-offset[1])**2,db=(b.c-pod.c-offset[0])**2+(b.r-pod.r-offset[1])**2;return da-db||a.r-b.r||a.c-b.c;
 });
 const t=free[0];if(!t)throw Error('No safe site for the prepared outpost.');
 const b={type,c:t.c,r:t.r,done:true,on:true,progress:Junior.work(type),age:type==='green'?4:0};S.builds.push(b);t.build=b;t.seen=true;return b;
}
function start(options={}){
 const parsed=normalizeCode(options.code||('DRB1-'+(options.seed||20261114)+'-'+(options.site??0)));
 if(!parsed)return {ok:false,error:'Use a mission code such as DRB1-20261114-0.'};
 const retainedFirst=state()?.code===parsed.code?clone(state().firstAttempt||null):null;
 internal=true;
 try{
  Junior.start('junior',parsed.site,parsed.seed);
  S.pop=6;S.peak=6;S.parts=12;S.o2=36;S.food=36;S.water=30;S.metal=0;S.battery=0;S.panelClean=1;S.fame=0;S.imports=0;S.tech={};S.orders=[];S.rover=null;
  S.junior.phase=0;S.junior.nextSupply=1e9;S.junior.completed=false;S.junior.recovery=null;
  S.missionSystems={version:1,awards:{},surveys:{},boost:null};
  S.unlocked={solar:true,moxie:true,green:true,ice:true,battery:true,shield:true};
  [['solar',[-2,0]],['solar',[-2,1]],['solar',[-1,2]],['moxie',[1,-1]],['moxie',[2,-1]],['ice',[2,1]],['green',[1,2]],['shield',[-1,-2]]].forEach(([type,offset])=>rosterSite(type,offset));
  S.tiles.forEach(t=>{if(hdist(t,S.builds[0])<=5&&!t.owner)t.seen=true;});
  const source=SOURCE_ROWS.find(r=>r.date==='2023-11-20');
  if(!source||!Number.isFinite(source.minutes))throw Error('The verified Horizons light-time record is missing.');
  const b=S.blackout={version:VERSION,rules:RULES,data:DATA,code:parsed.code,seed:parsed.seed,site:parsed.site,stage:'prediction',branch:'first',prediction:null,preparation:null,field:{prediction:null,readings:[],shelter:null},comms:{requested:false,elapsed:0,delivered:false,oneWayMinutes:source.minutes,roundTripMinutes:source.minutes*2,sourceDate:source.date},eventTape:{radioStart:3,radioEnd:6,dustStart:4,dustEnd:7,radiationStart:7,horizon:HORIZON},actions:[],timeline:[],firstOutcome:null,alternateOutcome:null,comparison:null,learning:{explanation:null,transfer:null},initial:null,returnState:null,replayQueue:null,rejections:[],helpUsed:0,retries:0,completed:false,storageWarning:'',tour:!!options.tour};
  S.dust={arrive:b.eventTape.dustStart,active:false,end:b.eventTape.dustEnd,len:3,bad:false,imp0:0};
  S.storm={arrive:b.eventTape.radiationStart,active:false,end:8,choice:'shelter',ev:STORMS[0]};
  S.say=STAGES.prediction[1];S.eco=compute();lastError='';storageWarning='';
  b.firstAttempt=retainedFirst||history()[b.code]?.first||null;b.attemptKind=b.firstAttempt?'practice in progress':'in progress';if(historyPending)storageFailed();
  b.initial=Junior.capture({omitBlackout:true});S.junior.checkpoint=clone(b.initial.state);
  if(R3){if(R3.fp)toggleWalk();buildWorld();R3.target.set(tx(S.builds[0]),0,tz(S.builds[0]));R3.dist=15;}
  buildMenu();render();emit();return {ok:true,code:b.code};
 }catch(error){lastError=error.message;return {ok:false,error:lastError};}finally{internal=false;}
}
function record(type,value){const b=state();if(b)b.actions.push({type,value:value??null,day:S.sol});}
function allow(type,stages){const b=state();return !!b&&stages.includes(b.stage);}
function fail(message){lastError=message;emit();return {ok:false,error:message,message};}
function okay(){lastError='';S.eco=compute();S.say=objective().detail;render();emit();return {ok:true};}
function prepare(value){
 const b=state();if(!allow('prepare',['preparation'])||!['battery','align','wait'].includes(value))return fail('Choose one available preparation.');
 internal=true;let error=null;
 try{
  if(value==='battery'){
   const pod=S.builds[0],t=S.tiles.filter(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock').sort((a,b)=>hdist(a,pod)-hdist(b,pod)||a.r-b.r||a.c-b.c)[0];
   error=t?tryBuild('battery',t):'No clear battery site is available.';
  }else if(value==='align'){const result=MissionSystems.activateBoost();if(!result.ok)error=result.message;}
 }finally{internal=false;}
 if(error)return fail(error);
 b.preparation=value;b.stage='field';record('prepare',value);return okay();
}
function recordFieldReading(data){
 const b=state();if(!b||b.stage!=='field'||!b.field.prediction)return {ok:false,recorded:false,reward:0,message:'Predict which location is better protected in the mission card first.'};
 if(!data||!['open','shelter'].includes(data.condition)||data.source!=='simulation'||data.kind!=='radiation'||!Number.isFinite(data.exposureIndex))return {ok:false,recorded:false,reward:0,message:'Compare open ground with the built shelter marker for this mission.'};
 const expected=data.condition==='open'?100:30;
 if(data.exposureIndex!==expected)return {ok:false,recorded:false,reward:0,message:'This reading does not match the mission teaching model.'};
 if(b.field.readings.some(r=>r.condition===data.condition))return {ok:true,recorded:false,reward:0,message:'This condition is already recorded. Repeated readings earn no extra Fame.'};
 b.field.readings.push({condition:data.condition,exposureIndex:data.exposureIndex,index:data.exposureIndex,label:data.condition==='open'?'Open ground':'Shelter marker',method:data.method||'first-person',source:'simulation',day:S.sol,c:data.c??null,r:data.r??null});
 record('observe',data.condition);okay();return {ok:true,recorded:true,reward:0,message:'Recorded '+data.condition+': '+data.exposureIndex+' simulated relative index. Now compare the evidence; this is not a measured dose.'};
}
function beforeDay(){if(!state())return true;return permitTick&&state().stage==='running';}
function afterDay(e){
 const b=state();if(!b)return;
 if(b.comms.requested&&!b.comms.delivered){
  const paused=S.sol>=b.eventTape.radioStart&&S.sol<b.eventTape.radioEnd;
  if(!paused)b.comms.elapsed+=STEP_MINUTES;
  if(!paused&&b.comms.elapsed>=b.comms.roundTripMinutes){b.comms.delivered=true;b.comms.deliveredDay=S.sol;log('Earth reply received: stored energy and supplies help when sunlight or work is interrupted. Your local decisions kept the mission moving.','good');}
 }
 const now=stamp();b.timeline.push({...now,economy:compactEconomy(e),radioPaused:S.sol>=b.eventTape.radioStart&&S.sol<b.eventTape.radioEnd,dust:!!S.dust?.active,radiation:!!S.storm?.active});
 if(S.junior.recovery||S.sol>=HORIZON)finishOutcome();
}
function outcome(){
 const b=state(),e=compute(),failed=!!S.junior.recovery,safe=!failed&&S.pop===6,stoppedDays=b.timeline.filter(t=>t.economy.shut>0).length;
 const reserves=Math.max(0,Math.floor(Math.min(S.o2/6,S.food/6,S.water/6)*10));
 const score={safe,completed:!failed,crew:S.pop,reserves,partsRemaining:S.parts,discoveries:b.field.readings.length,rank:[safe?1:0,reserves,S.parts,b.field.readings.length],label:safe?'Crew safe · mission complete':'Setback · checkpoint recovery available'};
 return {...stamp(),evaluationDay:HORIZON,stoppedEarly:S.sol<HORIZON,safe,completed:!failed,preparation:b.preparation,shelter:b.field.shelter,stoppedDays,recovery:S.junior.recovery||null,score,timeline:clone(b.timeline),actions:clone(b.actions),sourceDate:b.comms.sourceDate,rules:RULES,data:DATA,code:b.code};
}
function finishOutcome(){
 const b=state(),result=outcome();
 if(b.branch==='comparison'){
  const actual=b.returnState,original=b.originalMeta,alternate=result,rejections=clone(b.rejections);
  Junior.restore(actual,{render:false,checkpoint:false});S.blackout=original;S.blackout.alternateOutcome=alternate;S.blackout.stage='explain';S.blackout.branch='first';S.blackout.comparison=compareResults(original.firstOutcome,alternate,rejections);S.blackout.returnState=null;S.blackout.replayQueue=null;
  S.junior.checkpoint=clone(S.blackout.initial.state);if(R3)buildWorld();return;
 }
 b.firstOutcome=result;b.stage='outcome';
 const h=history(),entry=h[b.code]||{rules:RULES,data:DATA,first:null,practice:[]};
 if(!entry.first&&b.firstAttempt)entry.first=clone(b.firstAttempt);
 if(!entry.first)entry.first=clone(result);else{entry.practice.push(clone(result));entry.practice=entry.practice.slice(-12);}
 h[b.code]=entry;storeHistory(h);b.firstAttempt=clone(entry.first);b.attemptKind=entry.practice.length?'practice':'first attempt';
}
function compareResults(a,b,rejections){
 const delta={air:b.air-a.air,food:b.food-a.food,water:b.water-a.water,parts:b.parts-a.parts,battery:b.battery-a.battery,stoppedDays:b.stoppedDays-a.stoppedDays};
 const battery=[a.preparation,b.preparation].includes('battery'),alignment=[a.preparation,b.preparation].includes('align');
 const total=(out,key)=>out.timeline.reduce((n,t)=>n+(t.economy[key]||0),0),format=n=>Math.round(n*10)/10;
 const airChange=format(delta.air),foodChange=format(delta.food),partsChange=format(delta.parts);
 const evidence='The alternate result has '+Math.abs(airChange)+' '+(airChange>=0?'more':'less')+' air, '+Math.abs(foodChange)+' '+(foodChange>=0?'more':'less')+' food and '+Math.abs(partsChange)+' '+(partsChange>=0?'more':'less')+' Parts than your original result.';
 const principle=battery?(alignment?'A battery keeps surplus energy for later. Alignment changes generation for only three production days.':'A battery keeps surplus energy for later, using Parts and builder time. Waiting keeps those Parts but adds no storage.'):'Alignment uses Parts and a technician day, then changes solar generation for three production days.';
 return {changedDecision:{from:a.preparation,to:b.preparation},sameStart:true,sameEvents:true,sameHorizon:a.evaluationDay===b.evaluationDay,horizon:HORIZON,firstDay:a.day,alternateDay:b.day,delta,rejections,
  title:'One changed preparation, the same external events',
  explanation:principle+' '+evidence,reasons:['The original plan had '+a.stoppedDays+' days with power-limited machines; the alternate had '+b.stoppedDays+'.','Recorded food production: '+format(total(a,'foodProduced'))+' units originally and '+format(total(b,'foodProduced'))+' in the alternative.'],
  caveat:a.day!==b.day?'Both policies are evaluated through training day 9. A shortage ends a branch early; its terminal failure stays recorded at the evaluation horizon. The cards show actual stop days. Failed reserves are not ranked against successful reserves.':'Both outcomes use the same ending day. Later requested actions were held constant.',correctReason:battery?'stored-energy':'more-sunlight',correctReasons:[...(battery?['stored-energy']:[]),...(alignment?['more-sunlight']:[])]};
}
function beginComparison(value){
 const b=state();if(!b?.firstOutcome||!['outcome','explain','complete'].includes(b.stage)||!['battery','align','wait'].includes(value)||value===b.firstOutcome.preparation)return fail('Choose a different preparation to compare.');
 // Sequential replay is explicit gameplay. The original colony is preserved and
 // restored when the alternative ends; no hidden preview swaps live frame state.
 const original=clone({...b,returnState:null,replayQueue:null,originalMeta:undefined}),actual=Junior.capture({omitBlackout:true}),initial=clone(b.initial);
 const queue=b.firstOutcome.actions.filter(a=>!['predict','prepare'].includes(a.type));
 Junior.restore(initial,{render:false,checkpoint:false});
 S.blackout={...clone(original),stage:'preparation',branch:'comparison',preparation:null,field:{prediction:null,readings:[],shelter:null},comms:{...original.comms,requested:false,elapsed:0,delivered:false,deliveredDay:null},actions:[],timeline:[],learning:{explanation:null,transfer:null},returnState:actual,originalMeta:original,replayQueue:clone(queue),rejections:[],firstOutcome:original.firstOutcome,alternateOutcome:null,comparison:null,completed:false};
 S.junior.recovery=null;prepare(value);if(R3)buildWorld();return okay();
}
function replayNext(){
 const b=state();if(!b||b.branch!=='comparison')return fail('No alternative replay is active.');
 let steps=0;
 while(state()?.branch==='comparison'&&state().replayQueue.length&&steps++<64){
  const a=state().replayQueue.shift(),result=perform(a.type,a.value,true);
  if(!result.ok&&state()?.branch==='comparison')state().rejections.push({day:S.sol,...a,error:result.error||result.message});
  if(a.type==='next')return okay();
 }
 if(state()?.branch==='comparison'){
  if(state().stage==='running'&&S.sol<HORIZON&&!S.junior.recovery)return perform('next',null,true);
  if(!state().firstOutcome||S.sol<HORIZON){state().rejections.push({error:'Recorded actions ended before the shared horizon.'});}
  finishOutcome();
 }
 return okay();
}
function award(key,title,points){
 const m=S.missionSystems||(S.missionSystems={version:1,awards:{},surveys:{},boost:null});if(m.awards[key])return;
 m.awards[key]={key,title,points,sol:S.sol};addFame(points,title);
}
function perform(type,payload,replaying=false){
 const b=state(),value=val(payload);if(!b)return fail('Start the short blackout mission first.');
 if(b.branch==='comparison'&&!replaying){if(type==='next')return replayNext();if(type!=='restart')return fail('The alternative repeats your recorded actions. Choose Replay next step.');}
 if(type==='predict'){
  if(b.stage!=='prediction'||!['store','generate','same'].includes(value))return fail('Choose your prediction first.');
  b.prediction=value;b.stage='preparation';record(type,value);return okay();
 }
 if(type==='prepare')return prepare(value);
 if(type==='predictField'){
  if(b.stage!=='field'||b.field.prediction||!['open','shelter'].includes(value))return fail('Predict which location offers more protection.');
  b.field.prediction=value;record(type,value);return okay();
 }
 if(type==='observe'){
  if(!['open','shelter'].includes(value))return fail('Choose open ground or the shelter marker.');
  const t=value==='shelter'?S.builds.find(x=>x.type==='shield'):S.tiles.find(t=>!t.build&&hdist(t,S.builds[0])===2);
  const result=recordFieldReading({condition:value,exposureIndex:value==='open'?100:30,kind:'radiation',source:'simulation',method:'map',c:t?.c,r:t?.r});return result.ok?{ok:true}:fail(result.message);
 }
 if(type==='shelter'){
  if(b.stage!=='field'||b.field.readings.length<2||!['shelter','ship','outside'].includes(value))return fail('Record both locations before choosing shelter.');
  const choice=value==='outside'?'ship':value;b.field.shelter=choice;
  S.builds.filter(x=>x.type==='shield').forEach(x=>x.on=choice==='shelter');b.stage='request';record(type,choice);return okay();
 }
 if(type==='request'){
  if(b.stage!=='request'||b.comms.requested)return fail('The Earth advice request is already queued or not ready.');
  b.comms.requested=true;b.comms.requestDay=S.sol;b.stage='running';record(type,null);log('Advice requested. The sourced round-trip time is '+b.comms.roundTripMinutes.toFixed(1)+' minutes. The training clock compresses this; the scheduled radio pause delays receipt.','info');return okay();
 }
 if(type==='next'){
  if(b.stage!=='running'||S.junior.recovery)return fail('Complete the current mission choice before advancing.');
  record(type,null);permitTick=true;try{tickSol();}finally{permitTick=false;}
  Junior.animationUntil=performance.now()+1800;return okay();
 }
 if(type==='clean'){
  if(b.stage!=='running'||S.cleaning||S.panelClean>=.8)return fail('Cleaning is available when dust remains on the panels.');
  internal=true;try{Junior.clean();}finally{internal=false;}record(type,null);return okay();
 }
 if(type==='compare')return beginComparison(value);
 if(type==='explain'){
  if(b.stage!=='explain'||!['stored-energy','more-sunlight','radio-power'].includes(value))return fail('Compare both futures before explaining.');
  const accepted=b.comparison.correctReasons||[b.comparison.correctReason];
  b.learning.explanation={answer:value,correct:accepted.includes(value)};if(b.learning.explanation.correct)award('blackout-reason','Explained the preparation evidence',3);b.stage='transfer';return okay();
 }
 if(type==='transfer'){
  if(b.stage!=='transfer'||!['reserve','ask-earth','more-machines'].includes(value))return fail('Choose what to check before adding a machine.');
  b.learning.transfer={answer:value,correct:value==='reserve'};if(b.learning.transfer.correct)award('blackout-transfer','Applied a lesson to a new machine',3);
  award('blackout-complete','Completed the two-futures investigation',4);b.stage='complete';b.completed=true;
  const h=history();if(h[b.code]){h[b.code].lastLearning={prediction:b.prediction,field:clone(b.field),learning:clone(b.learning)};storeHistory(h);}return okay();
 }
 if(type==='retry'){
  if(!S.junior.recovery&&!b.firstOutcome?.recovery)return fail('This run has no shortage checkpoint to retry.');
  const code=b.code,retries=(b.retries||0)+1;const result=start({code});if(result.ok){S.blackout.retries=retries;S.junior.failures=retries;}return result;
 }
 if(type==='restart')return start({code:b.code});
 if(type==='help'){b.helpUsed++;return okay();}
 return fail('That mission action is not available.');
}
function action(type,payload){try{return perform(type,payload);}catch(error){return fail(error.message||'The mission action could not finish.');}}
function objective(){
 const b=state();if(!b)return {title:'Short blackout mission',detail:'Start a mission to plan through a quiet radio period.',action:'blackout'};
 const row=b.branch==='comparison'?['Alternative replay','The same recorded actions and external events are replayed. Your original colony will be restored when this comparison ends.']:STAGES[b.stage]||STAGES.running;
 return {title:row[0],detail:S.junior.recovery&&b.stage==='outcome'?S.junior.recovery+' Retry or compare another preparation.':row[1],action:'blackout',phase:Math.max(0,Object.keys(STAGES).indexOf(b.stage))};
}
function choice(action,value,label,detail,cost){return {action,value,label,detail,cost,disabled:false};}
function choices(){
 const b=state();if(!b)return [];
 if(b.branch==='comparison')return [choice('next',null,'Replay next step','The alternative uses the same recorded decisions after your changed preparation.')];
 switch(b.stage){
  case 'prediction':return [choice('predict','store','Stored power will help most','A battery can use spare power later.'),choice('predict','generate','More generation will help most','Alignment can improve solar output for a few days.'),choice('predict','same','They will have the same result','Make a prediction, then test it.')];
  case 'preparation':return [choice('prepare','battery','Build a battery','Two builders need two days. It stores surplus energy; it does not create power.',8),choice('prepare','align','Align the solar arrays','One technician works for one day. The next three days have a 20% generation bonus.',2),choice('prepare','wait','Keep the Parts','No preparation cost, but no added storage or generation.',0)];
  case 'field':{
   if(!b.field.prediction)return [choice('predictField','shelter','Predict: shelter is safer','Then inspect both simulated readings.'),choice('predictField','open','Predict: open ground is safer','Then inspect both simulated readings.')];
   if(b.field.readings.length<2)return ['open','shelter'].filter(c=>!b.field.readings.some(r=>r.condition===c)).map(c=>choice('observe',c,c==='open'?'Inspect open ground':'Inspect shelter marker','Map-based instrument reading; the first-person dosimeter is also available.'));
   return [choice('shelter','shelter','Use the soil shelter','The model reading is lower. Crew pause work for one radiation-practice day.',0),choice('shelter','ship','Return to the landing ship','A safe backup: transport costs 2 Parts and pauses work for two days.',2)];
  }
  case 'request':return [choice('request',null,'Request Earth advice','Then choose Next day to keep working while a reply travels.')];
  case 'running':return [...(S.panelClean<.8&&!S.cleaning?[choice('clean',null,'Book panel cleaning','Two free crew clean on the next day outside radiation shelter. Cleaning restores the light reaching the panels; it creates no new energy.',0)]:[]),choice('next',null,'Next day','Advance one day. Reading and planning never use up mission time.')];
  case 'outcome':return [...['battery','align','wait'].filter(p=>p!==b.firstOutcome.preparation).map(p=>choice('compare',p,'Compare: '+({battery:'battery',align:'solar alignment',wait:'keep the Parts'})[p],'Change this preparation only; replay the same later actions.')),...(b.firstOutcome.recovery?[choice('retry',null,'Retry the mission','Your first result stays recorded. Try a stronger preparation.')]:[])];
  case 'explain':return [choice('explain','stored-energy','Storage kept energy for later','A battery can cover a generation shortfall.'),choice('explain','more-sunlight','Alignment increased generation','The temporary boost changed solar output.'),choice('explain','radio-power','The radio pause switched off sunlight','Check whether the evidence supports this idea.')];
  case 'transfer':return [choice('transfer','reserve','Check spare power and reserves','A new machine uses some of the same supply.'),choice('transfer','ask-earth','Wait for Earth to decide everything','Think about what happens when a reply is delayed.'),choice('transfer','more-machines','Add it without checking','Think about the cost to the other machines.')];
  case 'complete':return [choice('restart',null,'Practice this mission again','First-attempt results stay separate from practice.')];
  default:return [];
 }
}
function view(){
 const b=state();if(!b)return {active:false,version:VERSION,defaultCode:'DRB1-20261114-0',sources:clone(SOURCES)};
 const e=compute(),o=objective(),paused=S.sol>=b.eventTape.radioStart&&S.sol<b.eventTape.radioEnd,status=b.comms.delivered?'received':!b.comms.requested?'not requested':paused?'blackout':'travelling';
 const comms={...b.comms,status,label:({received:'Earth reply received','not requested':'Ready to send',blackout:'Radio quiet period',travelling:'Reply travelling'})[status],detail:paused?'Commands and replies are paused. Life support continues under its own rules.':b.comms.delivered?'Advice arrived after you made local decisions.':'One training day advances the radio clock by 20 minutes. This is a teaching conversion.',trainingRemaining:Math.max(0,Math.ceil((b.comms.roundTripMinutes-b.comms.elapsed)/STEP_MINUTES)),clockLabel:'20 radio minutes per training day'};
 return {active:true,version:VERSION,rules:RULES,data:DATA,code:b.code,tour:b.tour,stage:b.branch==='comparison'?'compare':b.stage,actualStage:b.stage,branch:b.branch,title:o.title,detail:o.detail,day:S.sol,horizon:HORIZON,progress:(S.sol-1)/(HORIZON-1),choices:choices(),canAdvance:b.stage==='running'||b.branch==='comparison',resources:{air:S.o2,water:S.water,food:S.food,power:e.gen,powerUsed:e.demand,storedPower:S.battery,storageCapacity:e.store,parts:S.parts,crew:S.pop,appeal:S.appeal,fame:S.fame},economy:compactEconomy(e),comms,prediction:b.prediction,preparation:b.preparation,field:clone(b.field),firstOutcome:b.firstOutcome?clone(b.firstOutcome):null,alternateOutcome:b.alternateOutcome?clone(b.alternateOutcome):null,comparison:b.comparison?clone(b.comparison):null,learning:clone(b.learning),score:b.firstOutcome?.score||null,firstAttempt:b.firstAttempt?clone(b.firstAttempt):null,attemptKind:b.attemptKind||'in progress',sources:clone(SOURCES),error:lastError,storageWarning,completed:b.completed,recovery:S.junior.recovery,eventTape:clone(b.eventTape)};
}
function exportRecord(){
 const b=state();if(!b)return null;
 return {format:'dead-reckoning-learning-record',version:VERSION,code:b.code,rules:RULES,data:DATA,disclosure:'Local anonymous learning record. Simulated outcomes are not NASA observations. Automated play is not evidence of child learning.',prediction:b.prediction,field:clone(b.field),firstOutcome:clone(b.firstOutcome),alternateOutcome:clone(b.alternateOutcome),comparison:clone(b.comparison),learning:clone(b.learning),firstAttempt:clone(b.firstAttempt||null),helpUsed:b.helpUsed,retries:b.retries,sources:clone(SOURCES),childPilot:'Not yet conducted'};
}
function validateState(b){
 const parsed=normalizeCode(b?.code);
 if(!b||b.version!==VERSION||b.rules!==RULES||b.data!==DATA||!parsed||parsed.seed!==b.seed||parsed.site!==b.site||!STAGES[b.stage]||!['first','comparison'].includes(b.branch))throw Error('This blackout save uses unsupported mission rules.');
 if(!b.field||!Array.isArray(b.field.readings)||b.field.readings.length>2||!Array.isArray(b.actions)||b.actions.length>256||!Array.isArray(b.timeline)||b.timeline.length>HORIZON||!b.learning||!b.initial||b.initial.state?.blackout)throw Error('This blackout save has an invalid mission record.');
 if(!b.comms||!Number.isFinite(b.comms.elapsed)||b.comms.elapsed<0||!Number.isFinite(b.comms.oneWayMinutes)||b.comms.oneWayMinutes<=0||Math.abs(b.comms.roundTripMinutes-2*b.comms.oneWayMinutes)>1e-8)throw Error('This blackout save has invalid message timing.');
 const tape=b.eventTape;if(!tape||tape.radioStart!==3||tape.radioEnd!==6||tape.dustStart!==4||tape.dustEnd!==7||tape.radiationStart!==7||tape.horizon!==HORIZON)throw Error('This blackout save has a different event schedule.');
 for(const r of b.field.readings)if(!r||!['open','shelter'].includes(r.condition)||r.exposureIndex!==(r.condition==='open'?100:30))throw Error('This blackout save has an invalid teaching reading.');
 const validActions=['predict','prepare','predictField','observe','shelter','request','next','clean'];
 for(const a of b.actions)if(!a||!validActions.includes(a.type)||!Number.isInteger(a.day)||a.day<1||a.day>HORIZON)throw Error('This blackout save has an invalid action record.');
 for(const result of [b.firstOutcome,b.alternateOutcome])if(result){for(const key of ['day','air','food','water','parts','battery','pop'])if(!Number.isFinite(result[key]))throw Error('This blackout save has an invalid outcome.');if(!Array.isArray(result.actions)||!Array.isArray(result.timeline)||!result.score)throw Error('This blackout save is missing outcome evidence.');}
 if(['outcome','explain','transfer','complete'].includes(b.stage)&&!b.firstOutcome)throw Error('This blackout save is missing its first result.');
 if(['explain','transfer','complete'].includes(b.stage)&&(!b.alternateOutcome||!b.comparison))throw Error('This blackout save is missing its comparison.');
 Junior.validateCapture(b.initial);
 if(b.branch==='comparison'){
  if(!b.returnState||b.returnState.state?.blackout||!b.originalMeta||b.originalMeta.branch!=='first'||!Array.isArray(b.replayQueue)||b.replayQueue.length>256)throw Error('This alternative replay cannot restore its original colony.');
  Junior.validateCapture(b.returnState);validateState(b.originalMeta);
 }
 return true;
}
function restore(raw){
 validateState(raw?.state?.blackout);Junior.restore(raw);emit();return true;
}
window.Blackout={isActive,start,view,action,objective,beforeDay,afterDay,recordFieldReading,allowsAction:()=>internal,snapshot:()=>Junior.capture(),restore,validateState,exportRecord,normalizeCode,version:VERSION,rules:RULES,data:DATA};
emit();
})();
