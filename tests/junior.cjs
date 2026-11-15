const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');await page.waitForFunction(()=>window.Junior&&window.G&&AresWorld.pending===0);
  const result=await page.evaluate(()=>{
   const advance=()=>{tickSol();if(window.Campaign?.data().pending)Campaign.settle(Date.now()+10001);};let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
   // This checks real rules through public actions; rendering is unrelated to the
   // multi-campaign numerical test and is suppressed to keep the test quick.
   R3=null;render=()=>{};syncScene=()=>{};buildMenu=()=>{};
   const choose=(type)=>S.tiles.filter(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock'&&(Junior.isActive()||!DEF[type].needs||t.type===DEF[type].needs)).sort((a,b)=>type==='moxie'?b.air-a.air:type==='solar'?b.sun-a.sun:0)[0];
   const place=type=>{const t=choose(type);return t?tryBuild(type,t):'No site';};
   const rows=[];
   for(let site=0;site<4;site++){
    Junior.start('junior',site,20261114);let ticks=0;
    while(!S.junior.completed&&!S.junior.recovery&&ticks++<100){
     const e=S.eco=compute(),j=S.junior,n=j.phase===3?S.pop+2:S.pop;
     let type=null;
     if(!S.builds.some(b=>!b.done)){
      if(j.phase===0)type='solar';
      else if(j.phase<=3){
       if(e.o2p<n){type=e.gen-e.demand<4?'solar':'moxie';}
       else if(j.phase>=2&&!count('ice'))type=e.gen-e.demand<2?'solar':'ice';
       else if(j.phase>=2&&S.builds.filter(b=>b.type==='green').length*6<n)type=e.gen-e.demand<2?'solar':'green';
       else if(j.phase===3&&e.beds<n)type='habitat';
      }else if(j.phase===4&&!count('battery'))type='battery';
      else if(j.phase===5&&e.shelter<S.pop)type='shield';
     }
     if(type&&S.unlocked[type])place(type);
     if(j.phase===3&&Junior.canInvite().ok)Junior.invite();
     if(S.panelClean<.75)Junior.clean();
     if(j.phase>=6&&!j.discovered&&!S.rover){const t=S.tiles.find(t=>!t.owner&&hdist(t,S.builds[0])===4);tryBuild('rover',t);}
     advance();
    }
    rows.push({site:S.site.name,day:S.sol,completed:S.junior.completed,recovery:S.junior.recovery,phase:S.junior.phase,crew:S.pop,parts:S.parts,air:Math.round(S.o2),food:Math.round(S.food),water:Math.round(S.water),buildings:S.builds.map(b=>b.type),economy:compute()});
    check(S.junior.completed,'A careful Junior policy must complete at '+S.site.name+': '+JSON.stringify(rows.at(-1)));
    check(S.pop===8&&S.junior.failures===0,'Careful path welcomes two explorers without rescues');
    check(S.metal===0,'Junior never charges hidden metal');
    check(S.water>0,'Careful play preserves water at '+S.site.name);
    const roles=Junior.crewRoles();check(roles.operators+roles.builders+roles.cleaners+roles.explorers+roles.resting+roles.sheltered===S.pop,'Every crew member has exactly one role');
   }
   check(!Junior.canInvite().ok||(compute().beds>=S.pop+2&&compute().foodp>=S.pop+2&&compute().o2p>=S.pop+2),'Completed mission invitations still require housing and life-support capacity');
   const finish=type=>{const error=place(type);if(error)throw Error(error);while(S.builds.some(b=>!b.done))advance();};
   finish('habitat');finish('solar');finish('green');
   while(S.builds.some(b=>b.type==='green'&&(b.age||0)<4))advance();
   check(Junior.canInvite().ok&&Junior.invite(),'After the mission, improved air, food and beds permit another invitation');
   check(!Junior.canInvite().ok&&Junior.canInvite().pending&&!Junior.canInvite().blocked,'A ready booked shuttle cannot receive a duplicate invitation');
   const savedWater=S.water;S.water=0;check(Junior.canInvite().blocked&&/water/.test(Junior.canInvite().reason),'A booked arrival waits when its water reserve is missing');S.water=savedWater;
   const lifeSupport=S.builds.find(b=>b.type==='moxie'&&b.on),bookedDay=S.junior.arrival;lifeSupport.on=false;
   check(Junior.canInvite().blocked&&/waiting in orbit.*air/.test(Junior.canInvite().reason),'A pending shuttle explains the actual air-production blocker');
   check(!Junior.invite()&&S.junior.arrival===bookedDay,'A blocked shuttle cannot be booked twice');
   advance();check(S.pop===8&&S.junior.arrival===S.sol+1&&Junior.canInvite().blocked,'Unsafe arrivals stay in orbit with their blocker still visible');
   lifeSupport.on=true;
   check(!Junior.canInvite().ok&&!Junior.canInvite().blocked&&/arrive next day/.test(Junior.canInvite().reason),'Restored capacity clears the warning without enabling duplicate booking');
   const postMissionParts=S.parts+(S.sol+1>=S.junior.nextSupply?8:0);advance();
   check(S.pop===10&&S.parts===postMissionParts,'Later invitations grow the town without repeatedly awarding first-arrival Parts');
   Junior.start('junior',0,812);const before={parts:S.parts,metal:S.metal},t=choose('solar');
   check(!tryBuild('solar',t),'First construction accepted');check(S.parts===before.parts-Junior.cost('solar')&&S.metal===before.metal,'Displayed Parts cost equals actual debit');
   const b=t.build;cancel(b);check(S.parts===before.parts&&S.metal===before.metal,'Cancel refunds only actual Parts paid');
   for(let i=0;i<30&&!S.junior.recovery;i++)advance();
   check(!!S.junior.recovery&&S.pop===6,'Ignoring life support causes a recoverable setback, not free victory or child-facing deaths');
   const halted=S.sol;advance();check(S.sol===halted,'A shortage freezes time until retry');
   check(Junior.recover()&&S.sol===1&&S.junior.failures===1&&S.parts===68,'Retry rolls back day and spending to checkpoint, records setback');
   const add=(type,extra={})=>{const t=choose(type);const b={type,c:t.c,r:t.r,done:true,on:true,age:4,...extra};t.build=b;S.builds.push(b);return b;};
   const solar=add('solar'),oxygen=add('moxie');const working=compute().o2p;solar.on=false;check(compute().o2p<working,'Poor power planning stops actual air production');solar.on=true;
   oxygen.condition=0;oxygen.method='push';check(compute().o2p===working,'Junior removes wear and production-method complexity from actual rules');
   S.junior.phase=3;S.unlocked.moxie=true;check(!Junior.canInvite().ok,'Arrivals wait when food and air capacity are not ready');
   const lower=S.tiles.filter(t=>t.seen&&!t.owner&&!t.build).sort((a,b)=>b.air-a.air)[0];const high=S.tiles.filter(t=>t.seen&&!t.owner&&!t.build).sort((a,b)=>a.air-b.air)[0];
   oxygen.c=lower.c;oxygen.r=lower.r;const lowAir=compute().o2p;oxygen.c=high.c;oxygen.r=high.r;check(lowAir>=compute().o2p,'NASA height-derived air density changes real production');
   Junior.start('junior',0,812);S.junior.phase=5;S.storm={arrive:2,active:false,end:3,choice:'shelter',ev:STORMS[0]};const transportParts=S.parts;advance();
   check(S.parts===transportParts-2&&S.storm.active&&S.storm.end===4,'Missing radiation shelter costs transport parts and two days of work');
   check(compute().o2p===0&&compute().foodp===0,'Taking cover uses reserves and stops outdoor production');
   Junior.start('junior',0,812);const basic=compute();
   check(Math.abs(basic.waterUse-6)<1e-9&&Math.abs(basic.waterRecovered-4.5)<1e-9&&basic.waterp<basic.waterUse,'Basic recycling recovers 75% and cannot create water');
   S.junior.nextSupply=2;const supplyWater=S.water;advance();check(Math.abs(S.water-(supplyWater+12-1.5))<1e-9,'Supply delivery adds exactly twelve water before the day balance');
   const dryTile=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type==='plain');S.unlocked.ice=true;
   check(!tryBuild('ice',dryTile),'Water processor can recycle on a non-ice site');
   while(!dryTile.build.done)advance();
   const recycled=compute();check(recycled.waterRecovery===.95&&recycled.waterExtracted===0&&recycled.waterp<=recycled.waterUse,'Advanced recycler respects the actual water throughput');
   const waterBefore=S.water,netBefore=recycled.waterNet;advance();check(Math.abs(S.water-waterBefore-netBefore)<1e-8,'Stored water follows the reported net water ledger');
   dryTile.type='ice';const extracted=compute();check(extracted.waterExtracted===4&&Math.abs(extracted.waterNet-(recycled.waterNet+4))<1e-8,'Only an ice-site processor adds newly extracted water');
   dryTile.type='plain';S.water=.1;S.junior.nextSupply=999;S.o2=100;S.food=100;advance();check(/water reserve/.test(S.junior.recovery),'Depleted water causes a recoverable setback');
   Junior.start('junior',0,812);const rosterStart=Junior.crewRoles();check(rosterStart.resting===6&&rosterStart.operators===0,'Initial head count is not multiplied into workers');
   S.unlocked.solar=true;place('solar');const construction=Junior.crewRoles();check(construction.builders===2&&construction.constructionWork===4&&construction.resting===4,'Two real builders provide four work per day');
   const nextJob=S.builds.find(b=>!b.done),progressBefore=nextJob.progress;advance();check(nextJob.progress-progressBefore===4,'Construction consumes the reported real crew capacity');
   for(const b of S.builds)b.done=true;add('moxie');add('moxie');add('green');add('green');add('ice');add('dome');add('mine');
   let roles=Junior.crewRoles();check(roles.operators===6&&roles.resting===0&&compute().unstaffed===1,'More machines than people leave a machine unstaffed');
   S.unlocked.rover=true;const tripTile=S.tiles.find(t=>!t.owner&&hdist(t,S.builds[0])===4);check(/operators/.test(tryBuild('rover',tripTile)),'Rover cannot borrow people already operating machines');
   S.builds.filter(b=>['dome','mine','green'].includes(b.type)).forEach(b=>b.on=false);check(!tryBuild('rover',tripTile),'Free crew can leave on a rover');roles=Junior.crewRoles();check(roles.explorers===2&&roles.operators+roles.resting+roles.explorers===S.pop,'Rover explorers are not also counted at home');
   S.storm={active:true};roles=Junior.crewRoles();check(roles.sheltered===4&&roles.explorers===2&&roles.operators===0&&roles.builders===0,'Sheltering and off-site explorers remain distinct roles');
   S.storm=null;S.o2=100;S.food=100;S.water=64;S.builds.filter(b=>['moxie','green'].includes(b.type)).forEach(b=>b.on=true);S.rover=null;
   const snapshotAppeal=Junior.appealInfo();check(snapshotAppeal.score===S.appeal&&snapshotAppeal.reasons.length===7,'Appeal is an explained assessment of actual conditions');
   Junior.start('commander',0,812);check(!Junior.isActive(),'Commander is explicitly selectable');
   const commanderMetal=S.metal;S.unlocked.moxie=true;check(!tryBuild('moxie',choose('moxie'))&&S.metal===commanderMetal-DEF.moxie.metal,'Commander retains its original metal economy');
   const commanderDay=S.sol;advance();check(S.sol===commanderDay+1,'Commander simulation still advances');
   return {checks,campaigns:rows};
  });
  await page.reload();await page.waitForFunction(()=>window.Junior&&window.Strategy);
  const persistence=await page.evaluate(()=>{
   Junior.start('junior',1,901);Junior.nextDay();Strategy.saveMission();
   const saved=JSON.parse(localStorage.getItem('mars-colony-save'));
   if(!saved.state.junior?.checkpoint)throw Error('Junior checkpoint missing from save');
   const day=S.sol;Junior.start('commander',0,902);Strategy.loadMission();
   if(!Junior.isActive()||S.sol!==day||S.seed!==901)throw Error('Junior save did not restore its mode/day/seed');
   delete saved.state.junior;localStorage.setItem('mars-colony-save',JSON.stringify(saved));Strategy.loadMission();
   if(Junior.isActive())throw Error('Legacy save incorrectly converted to Junior');
   return {juniorRestore:true,legacyPreserved:true,savedBytes:JSON.stringify(saved).length};
  });
  result.persistence=persistence;result.checks+=3;
  assert.deepEqual(errors,[]);fs.mkdirSync(path.join(__dirname,'../research'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../research/junior-balance.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
