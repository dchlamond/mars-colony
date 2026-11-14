/* Science-informed game rules. NASA principles are sourced; numerical bonuses are game tuning. */
(function () {
'use strict';
const POWER_SOURCE='https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/';
const BOOST={cost:2,workDays:1,duration:3,multiplier:1.2,cooldown:8};
const MILESTONES=['First solar power','Air for everyone','Water recovery and first harvest','Welcomed two explorers','Prepared for dust','Protected the crew','A self-supplying expedition'];
function state(){
 if(!S.missionSystems){
  S.missionSystems={version:1,awards:{},surveys:{},boost:null};
  // Existing saves already received their milestone Fame. Record provenance
  // without paying them again, including when a checkpoint is restored.
  for(let n=1;n<=Math.min(7,S.junior?.phase||0);n++)S.missionSystems.awards['mission-'+n]={key:'mission-'+n,title:MILESTONES[n-1],points:3,sol:null,legacy:true};
 }
 return S.missionSystems;
}
function notify(){document.dispatchEvent(new CustomEvent('missionsystems:update'));}
function award(key,title,points){
 const data=state();if(data.awards[key])return 0;
 data.awards[key]={key,title,points,sol:S.sol};
 addFame(points,title);log(title+'. +'+points+' Fame.','good');notify();return points;
}
function solar(){return S.builds.filter(b=>b.type==='solar'&&b.done&&b.on&&S.sol>=(b.offUntil||0));}
function wantsTechnician(){return !!(S.junior&&state().boost?.working&&solar().length);}
function solarMultiplier(){return S.junior&&state().boost?.remaining>0?BOOST.multiplier:1;}
function boostInfo(){
 const junior=!!S.junior,b=state().boost,remainingDays=b?.remaining||0,cooldownDays=Math.max(0,(b?.cooldownUntil||0)-S.sol);
 const info={supported:junior,available:false,label:'Align solar arrays',cost:BOOST.cost,workDays:BOOST.workDays,duration:BOOST.duration,multiplier:BOOST.multiplier,cooldownDays,remainingDays,status:'blocked',sourceUrl:POWER_SOURCE,scienceNote:'Pointing a solar array toward the Sun improves its output. Our 20% bonus, three-day duration and eight-day cooldown are game rules, not NASA measurements.',evidence:{title:'InSight: a measured power recovery',text:'On 22 May 2021, InSight gained about 30 watt-hours per Martian day after wind-blown grains lifted panel dust. That observed recovery is different from our fictional 20% alignment bonus.',url:'https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/'}};
 if(!junior)return {...info,reason:'Commander uses its existing power research, upgrades and panel cleaning. This timed alignment action is for Junior missions.'};
 if(S.over||S.junior.recovery)return {...info,reason:'Retry your checkpoint before assigning work.'};
 if(b?.working)return {...info,status:'working',reason:solar().length?'One technician will align the arrays on the next day with available crew and no radiation alert.':'Alignment is waiting: switch on a completed solar array.'};
 if(remainingDays)return {...info,status:'active',reason:'Solar output is 20% higher for '+remainingDays+' more production day'+(remainingDays===1?'':'s')+'. Dust still reduces it.'};
 if(cooldownDays)return {...info,status:'cooldown',reason:'Alignment can be repeated in '+cooldownDays+' day'+(cooldownDays===1?'':'s')+'.'};
 if(!solar().length)return {...info,reason:'Build and switch on a solar array first.'};
 if(S.storm?.active)return {...info,reason:'Wait until the crew can leave radiation shelter.'};
 if(S.cleaning)return {...info,reason:'Finish cleaning the arrays first.'};
 if(S.parts<BOOST.cost)return {...info,reason:'Keep 2 Parts for the alignment kit.'};
 const crew=compute().crew;
 if(crew.resting+crew.builders+crew.cleaners<1)return {...info,reason:'Free one crew member without taking an operator from life support.'};
 return {...info,available:true,status:'ready',reason:'Spend 2 Parts and one technician day. Then solar output rises 20% for three days. Construction may slow; this does not replace cleaning or batteries.'};
}
function activateBoost(){
 if(window.Blackout?.isActive()&&!Blackout.allowsAction())return {ok:false,message:'Use the mission preparation choices during this short training mission.'};
 const info=boostInfo();if(!info.available)return {ok:false,message:info.reason};
 S.parts-=BOOST.cost;state().boost={working:true,remaining:0,started:S.sol,cooldownUntil:S.sol+BOOST.cooldown};
 log('Solar alignment booked: 2 Parts spent. One free crew member will work on the arrays.','info');
 render();notify();return {ok:true,message:'One technician will align the arrays next day. The following three days receive 20% more solar power.'};
}
// Called once after the day's production. Completing alignment never boosts the
// same work day. Existing bonuses expire only after exactly three ledger ticks.
function finishDay(e){
 const b=state().boost;if(!S.junior||!b)return;
 if(b.working){
  if(e.crew.technicians>0&&!e.sheltering){
   b.working=false;b.remaining=BOOST.duration;b.completed=S.sol;
   award('solar-alignment','Proved solar alignment',4);
   log('Arrays aligned. The next three production days receive 20% more solar power. Dust and panel dirt still matter.','good');
  }
 }else if(b.remaining>0){b.remaining--;if(!b.remaining)log('The solar alignment bonus has ended. Plan around normal generation again.','info');}
 notify();
}
function milestone(phase){return phase>=1&&phase<=7?award('mission-'+phase,MILESTONES[phase-1],3):0;}
function fameInfo(){
 const score=Number.isFinite(S.fame)?S.fame:0,awards=Object.values(state().awards).sort((a,b)=>(b.sol||0)-(a.sol||0));
 const medals=MEDALS.map(m=>({name:m.name,threshold:m.at,earned:score>=m.at})),next=medals.find(m=>!m.earned);
 return {score,label:medals.filter(m=>m.earned).at(-1)?.name||'New expedition',awards,medals,fieldReadings:Object.values(state().surveys),nextMedal:next?{...next,remaining:next.threshold-score}:null,
  explanation:S.junior?'Fame records completed missions and different kinds of evidence. Each award is earned once per mission save. Repeating a click or measurement gives no extra Fame. Medals celebrate progress; they do not unlock basic life support or change Junior invitations.':'Fame combines existing Commander achievements with new one-time field evidence. Existing medals still improve recruitment weight. Repeat readings do not award more Fame.'};
}
function recordSurvey(data){
 const condition=data?.condition,t=Number.isInteger(data?.c)&&Number.isInteger(data?.r)?tileAt(data.c,data.r):null;
 if(S.over||S.junior?.recovery)return {ok:false,recorded:false,reward:0,message:'Return to an active mission before recording evidence.'};
 if(!t||!['open','rock','shelter'].includes(condition)||data.kind!=='radiation'||data.source!=='simulation'||!Number.isFinite(data.exposureIndex)||data.exposureIndex<0)return {ok:false,recorded:false,reward:0,message:'A valid simulated surface reading is needed.'};
 if(window.Blackout?.isActive())return Blackout.recordFieldReading(data);
 const records=state().surveys;
 if(records[condition])return {ok:true,recorded:false,reward:0,message:'You already recorded '+condition+' ground. Compare a different condition; repeated readings do not add Fame.'};
 records[condition]={kind:'radiation',condition,c:data.c,r:data.r,sol:S.sol,exposureIndex:data.exposureIndex,source:'simulation'};
 let reward=award('surface-'+condition,'Recorded '+condition+' radiation model',3);
 if(records.open&&records.rock)reward+=award('compare-rock','Compared open ground with rock cover',4);
 if(records.open&&records.shelter)reward+=award('compare-shelter','Compared open ground with a shelter',4);
 render();notify();return {ok:true,recorded:true,reward,message:'Recorded '+condition+' ground: '+data.exposureIndex+' on the game exposure index. +'+reward+' Fame. This is a simulation, not a measured astronaut dose.'};
}
const originalRoverStep=roverStep;
roverStep=function(){
 const trip=S.rover,done=trip?.done;originalRoverStep();
 if(trip&&!done&&trip.done){
  const type=tileAt(trip.c,trip.r)?.type;
  const names={plain:'open plain',ice:'likely-ice terrain',lava:'possible lava-tube terrain',rock:'rocky terrain'};
  if(names[type])award('rover-'+type,'Surveyed '+names[type],3);
 }
};
window.MissionSystems={boostInfo,activateBoost,fameInfo,recordSurvey,wantsTechnician,solarMultiplier,finishDay,milestone};
state();notify();
})();
