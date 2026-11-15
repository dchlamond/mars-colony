const {engine}=require('./engine-harness.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const e=engine();
const result=e.run(`(()=>{
 let checks=0;const check=(v,msg)=>{checks++;if(!v)throw Error(msg);};
 const act=(a,value)=>{const r=Blackout.action(a,{value});check(r.ok,a+': '+r.error);};
 const rows=[];
 check(!Strategy.savedMissionStatus().available,'Fresh browser cannot continue a nonexistent save');
 for(const raw of ['null','[]','{}','broken','{"version":999}']){localStorage.setItem('mars-colony-save',raw);check(!Strategy.savedMissionStatus().available,'Invalid save safely reported: '+raw);}
 for(let seed=1;seed<=16;seed++)for(let site=0;site<4;site++)for(const prep of ['battery','align','wait']){
  check(Blackout.start({seed:seed*32771,site}).ok,'Start seeded scenario');
  act('predict','store');act('prepare',prep);act('predictField','shelter');act('observe','open');act('observe','shelter');act('shelter','shelter');act('request');
  let turns=0;
  while(Blackout.view().stage==='running'&&turns++<9){
   if(prep==='align'&&Blackout.view().choices.some(x=>x.action==='clean'))act('clean');
   act('next');const c=compute(),r=c.crew;
   for(const k of ['o2','water','food','parts','battery'])check(Number.isFinite(S[k])&&S[k]>=0,'Valid '+k);
   check(r.operators+r.builders+r.cleaners+r.technicians+r.explorers+r.resting+r.sheltered===6,'No duplicate crew');
   if(S.sol===3){const before=JSON.stringify(Blackout.snapshot());check(Strategy.saveMission(),'Save during mission');check(Strategy.savedMissionStatus().available,'Readable save is offered');check(Strategy.loadMission(),'Load during mission');check(JSON.stringify(Blackout.snapshot())===before,'Reload keeps exact pending actions, RNG and resources');}
  }
  const v=Blackout.view();check(v.stage==='outcome','All policies reach a finite outcome');
  if(prep!=='wait')check(v.firstOutcome.safe,prep+' succeeds at site '+site+' seed '+seed);
  rows.push({seed:seed*32771,site,prep,safe:v.firstOutcome.safe,day:v.day});
 }
 const original=Storage.prototype.getItem;Storage.prototype.getItem=function(){throw new DOMException('Storage denied','SecurityError');};
 try{check(!Strategy.savedMissionStatus().available,'Blocked storage cannot advertise Continue');check(Blackout.start({seed:9991}).ok,'Blocked storage still permits a new game');act('predict','store');act('prepare','battery');}finally{Storage.prototype.getItem=original;}
 return {checks,rows};
})()`,'audit-boundaries');
// Execute the shipped preference parser against corrupt storage and valid options.
const source=fs.readFileSync(path.resolve(__dirname,'../game/blackout-ui.js'),'utf8');
const start=source.indexOf("const prefKey='blackout-accessibility'"),end=source.indexOf('  const prefControls=',start);
for(const [raw,expected] of [['null',{}],['[]',{}],['true',{}],['broken',{}],['{"text":"999","motion":"false"}',{}],['{"motion":true,"contrast":false,"text":"20"}',{motion:true,contrast:false,text:'20'}]]){
 e.context.localStorage.setItem('blackout-accessibility',raw);
 const parsed=e.run('(()=>{'+source.slice(start,end)+';return JSON.stringify(prefs);})()');assert.deepEqual(JSON.parse(parsed),expected);result.checks++;
}
fs.mkdirSync(path.resolve(__dirname,'../dist/verification'),{recursive:true});
fs.writeFileSync(path.resolve(__dirname,'../dist/verification/audit-boundaries.json'),JSON.stringify({time:new Date().toISOString(),...result},null,2));
console.log(JSON.stringify({checks:result.checks,missions:result.rows.length,safe:result.rows.filter(r=>r.safe).length}));
