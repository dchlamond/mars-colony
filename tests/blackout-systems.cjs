/* Actual Junior engine policy players; no alternative simulator or free resources. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const outdir=path.join(__dirname,'../dist/verification');fs.mkdirSync(outdir,{recursive:true});
 try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');
  await page.waitForFunction(()=>window.Blackout&&window.Junior&&window.MissionSystems&&window.AresWorld?.pending===0,{timeout:30000});
  const result=await page.evaluate(()=>{
   // Rendering is suppressed for fast policy runs. Every move still calls the
   // same public action and authoritative Junior simulation as the game UI.
   R3=null;render=()=>{};syncScene=()=>{};buildMenu=()=>{};
   localStorage.removeItem('blackout-attempts-v1');
   let checks=0;const cases=[],matrix=[],failures=[];
   const check=(v,message)=>{checks++;if(!v)throw Error(message);};
   const near=(a,b,msg)=>check(Math.abs(a-b)<1e-7,msg+': '+a+' vs '+b);
   const act=(type,value)=>{const r=Blackout.action(type,{value});check(r.ok,type+' accepted: '+(r.error||r.message||''));return r;};
   const setup=(prep,ship='shelter',seed=20261114,site=0)=>{
    check(Blackout.start({seed,site}).ok,'Mission starts');
    act('predict','store');act('prepare',prep);act('predictField','shelter');act('observe','open');act('observe','shelter');act('shelter',ship);act('request');
   };
   const invariant=()=>{
    const e=compute(),b=S.blackout;
    for(const key of ['o2','food','water','parts','battery','fame'])check(Number.isFinite(S[key])&&S[key]>=0,'Finite nonnegative '+key);
    check(S.pop===6,'Fixed six-person obligation');
    check(e.crew.assignments.length===6,'Actual roster has six people');
    check(e.crew.operators+e.crew.builders+e.crew.cleaners+e.crew.technicians+e.crew.explorers+e.crew.resting+e.crew.sheltered===6,'Each crew member has one role');
    check(S.battery<=e.store+1e-7,'Battery stays within actual storage');
    check(b.timeline.length<=8,'At most eight production turns');
   };
   const finish=(clean=false)=>{
    let n=0;
    while(Blackout.view().stage==='running'&&n++<12){
     if(clean&&S.panelClean<.8&&!S.cleaning)act('clean');
     act('next');invariant();
    }
    check(n<=9,'Bounded mission finishes');
    check(Blackout.view().stage==='outcome','Mission reaches outcome');return Blackout.exportRecord().firstOutcome;
   };
   // Matrix has independent action policies and geographic input variations.
   for(const seed of [20261114,812,901])for(let site=0;site<4;site++)for(const policy of [{name:'battery',prep:'battery',clean:false},{name:'alignment-and-clean',prep:'align',clean:true},{name:'unprepared-ship',prep:'wait',clean:false,ship:'ship'}]){
    setup(policy.prep,policy.ship||'shelter',seed,site);const outcome=finish(policy.clean);
    if(policy.name!=='unprepared-ship')check(outcome.safe,policy.name+' completes on site '+site+' seed '+seed+': '+outcome.recovery);
    check(outcome.evaluationDay===9,'Every policy has the same evaluation horizon');
    matrix.push({seed,site,policy:policy.name,completed:outcome.completed,stopDay:outcome.day,evaluationDay:outcome.evaluationDay,air:outcome.air,food:outcome.food,water:outcome.water,parts:outcome.parts,stoppedDays:outcome.stoppedDays,recovery:outcome.recovery});
   }
   check(matrix.some(r=>r.policy==='unprepared-ship'&&!r.completed),'A poor policy has a real recoverable setback');
   cases.push('36 policy runs across three fixed seeds and four sites');
   // Independently calculated first-day physics/accounting, not expected values
   // returned by the production function under test.
   setup('align');const air0=S.o2,water0=S.water,food0=S.food;
   const expectedAir=4*S.builds.filter(b=>b.type==='moxie').reduce((n,b)=>n+tileAt(b.c,b.r).air,0);
   const expectedSun=3+5*S.builds.filter(b=>b.type==='solar').reduce((n,b)=>n+tileAt(b.c,b.r).sun,0);
   near(compute().gen,expectedSun,'Initial generation equals pod plus latitude-weighted panels');
   near(compute().demand,12,'Two oxygen units, processor and greenhouse use twelve power');
   act('next');near(S.o2,air0+expectedAir-6,'First day oxygen ledger');near(S.food,food0,'A ripe watered greenhouse balances six crew food');near(S.water,water0-(6+.5)+(6*.95+.5*.9),'First day water recovery conserves throughput');
   near(MissionSystems.boostInfo().remainingDays,3,'Alignment completes after work day, then grants three production days');
   check(compute().crew.operators===4,'Four actual operators run the outpost');
   cases.push('Independent first-day generation, oxygen, food, water and technician checks');
   // Source-derived communications clock and explicit pause.
   check(Blackout.view().comms.sourceDate==='2023-11-20','Cached source date is disclosed');
   near(Blackout.view().comms.roundTripMinutes,41.97212,'Round trip is twice the verified Horizons value');
   check(Blackout.view().comms.elapsed===20&&!Blackout.view().comms.delivered,'No instant Earth reply');
   act('next');act('next');act('next');check(S.sol===5&&Blackout.view().comms.elapsed===20,'Radio pause suspends the training message clock');
   const snap=Blackout.snapshot(),oldRng=rng.state;const expectedRandom=rng();Blackout.restore(snap);near(rng(),expectedRandom,'Snapshot restores exact random state');rng=mulberry(oldRng);
   act('next');check(!Blackout.view().comms.delivered,'Forty training minutes are short of the true round trip');act('next');check(Blackout.view().comms.delivered&&Blackout.view().comms.deliveredDay===7,'Reply arrives once after sufficient unpaused time');
   cases.push('Source clock, pause, saved pending message and exact RNG restoration');
   // Duplicate and illegal commands cannot spend twice or bypass the mission.
   const parts=S.parts;check(!Blackout.action('prepare','battery').ok&&S.parts===parts,'Duplicate preparation is rejected without spending');
   const t=S.tiles.find(t=>t.seen&&!t.build&&!t.owner&&t.type!=='rock'),beforeBuilds=S.builds.length;
   check(!!tryBuild('solar',t)&&S.builds.length===beforeBuilds,'Legacy build entry cannot bypass scenario actions');
   check(!MissionSystems.activateBoost().ok,'Legacy solar boost entry is guarded');
   check(!Junior.canInvite().ok,'Population cannot be reduced or expanded to exploit fixed mission score');
   const beforeBad=Blackout.snapshot(),bad=JSON.parse(JSON.stringify(beforeBad));bad.state.blackout.version=99;
   let rejected=false;try{Blackout.restore(bad);}catch{rejected=true;}check(rejected&&S.blackout.version===1&&S.sol===beforeBad.state.sol,'Future save rejected before state replacement');
   cases.push('Duplicate commands, out-of-scenario edits and invalid save isolation');
   // Exact identical policies must match, then one alternate preparation replays
   // the same later requested actions and restores the original actual colony.
   setup('battery','shelter',551,0);const first=finish();
   const projection=()=>JSON.stringify({sol:S.sol,o2:S.o2,food:S.food,water:S.water,parts:S.parts,battery:S.battery,fame:S.fame,builds:S.builds.map(({type,c,r,done,on,progress,age})=>({type,c,r,done,on,progress,age})),rng:rng.state});
   const preserved=projection(),durable=localStorage.getItem('blackout-attempts-v1');
   act('compare','align');let replaySteps=0;while(Blackout.view().stage==='compare'&&replaySteps++<16)act('next');
   check(Blackout.view().stage==='explain'&&replaySteps<=9,'Sequential alternative replay completes in a bounded number of clicks');
   check(projection()===preserved,'Alternative restores original colony resources, construction and RNG');
   check(localStorage.getItem('blackout-attempts-v1')===durable,'Alternative does not overwrite durable first attempt');
   const comparison=Blackout.view().comparison;check(comparison.sameStart&&comparison.sameEvents&&comparison.sameHorizon,'Comparison records the same initial state, events and evaluation horizon');
   check(Blackout.view().alternateOutcome.preparation==='align'&&Blackout.view().firstOutcome.preparation==='battery','Only selected preparation changes');
   const secondActions=Blackout.view().alternateOutcome.actions.filter(a=>a.type!=='prepare');
   const firstActions=first.actions.filter(a=>!['prepare','predict'].includes(a.type));
   check(JSON.stringify(secondActions)===JSON.stringify(firstActions),'All subsequent requested actions are held constant');
   const explanationCheckpoint=Blackout.snapshot();
   check(comparison.correctReasons.includes('stored-energy')&&comparison.correctReasons.includes('more-sunlight'),'Battery and alignment are both causal mechanisms in this comparison');
   act('explain','more-sunlight');check(Blackout.view().learning.explanation.correct,'A true alignment mechanism is accepted beside battery storage');
   Blackout.restore(explanationCheckpoint);
   act('explain','radio-power');check(!Blackout.view().learning.explanation.correct,'Radio pause is not graded as removing sunlight');
   Blackout.restore(explanationCheckpoint);
   const fameBefore=S.fame;act('explain','stored-energy');act('transfer','reserve');const fameAfter=S.fame;
   check(Blackout.view().completed&&fameAfter-fameBefore===10,'Reasoning, transfer and completion award finite Fame');
   check(!Blackout.action('transfer','reserve').ok&&S.fame===fameAfter,'Repeated answers cannot farm Fame');
   const record=Blackout.exportRecord();check(record.learning.explanation.correct&&record.learning.transfer.correct&&record.sources.length>=5,'Learning export carries actual answers and provenance');
   check(!JSON.stringify(record).includes('userName'),'Learning record requires no identity');
   setup('battery','shelter',551,0);const repeat=finish();check(JSON.stringify(first.timeline)===JSON.stringify(repeat.timeline),'Identical policy produces identical timeline');
   cases.push('Deterministic replay, original-state isolation, durable first attempt and finite learning rewards');
   // A failed route must recover through the same public controls, with its
   // original first-attempt result preserved rather than erased.
   localStorage.removeItem('blackout-attempts-v1');setup('wait','ship',20261114,0);const poor=finish();check(!poor.completed&&!!S.junior.recovery,'Careless canonical route produces a shortage');
   const failedResult=JSON.stringify(Blackout.view().firstAttempt);act('retry');check(S.sol===1&&S.blackout.retries===1&&!S.junior.recovery,'Retry returns to valid initial checkpoint');
   act('predict','store');act('prepare','battery');act('predictField','shelter');act('observe','open');act('observe','shelter');act('shelter','shelter');act('request');const recovered=finish();
   check(recovered.completed&&JSON.stringify(Blackout.view().firstAttempt)===failedResult,'Successful practice preserves first failed attempt');
   cases.push('Intentional setback, recoverable retry and separate practice record');
   // Storage failure is an environment limitation: progression/export continue
   // and an explicit warning replaces any false claim of durable persistence.
   Junior.start('junior',0,991);localStorage.removeItem('blackout-attempts-v1');setup('wait','ship');
   const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Storage unavailable in test');};
   const storageRun=finish(),unsavedFirst=JSON.stringify(Blackout.view().firstAttempt);
   check(!storageRun.completed&&/storage/i.test(Blackout.view().storageWarning)&&!!Blackout.exportRecord(),'Unavailable storage leaves a playable exportable mission with explicit warning');
   act('retry');act('predict','store');act('prepare','battery');act('predictField','shelter');act('observe','open');act('observe','shelter');act('shelter','shelter');act('request');finish();
   check(Blackout.view().attemptKind==='practice'&&JSON.stringify(Blackout.view().firstAttempt)===unsavedFirst,'Storage-denied retry preserves first failed attempt in session memory');
   check(/storage/i.test(Blackout.view().storageWarning),'Retry retains the warning about unsaved history');
   Storage.prototype.setItem=originalSet;
   setup('battery','shelter',991,0);finish();
   check(JSON.stringify(JSON.parse(localStorage.getItem('blackout-attempts-v1'))['DRB1-20261114-0'].first)===unsavedFirst,'Later successful write persists the unsaved original attempt');
   cases.push('Storage failure retains first attempt through retry and can persist it after recovery');
   localStorage.setItem('blackout-attempts-v1',JSON.stringify({'DRB1-1811-0':{first:7,practice:null}}));
   setup('battery','shelter',1811,0);check(/could not be read/.test(Blackout.view().storageWarning),'Malformed historical result has an explicit warning');finish();
   check(Blackout.view().firstAttempt?.score?.safe,'Malformed history cannot block a new playable result');
   // Exact Junior checkpoint recovery outside the short scenario stays compatible.
   Junior.start('junior',0,112);rng();Junior.checkpoint();const checkpointRandom=rng();S.junior.recovery='test shortage';check(Junior.recover(),'Ordinary Junior recovery works');near(rng(),checkpointRandom,'Ordinary Junior recovery restores RNG continuation');
   const legacy=Junior.capture();delete legacy.state.water;Junior.restore(legacy,{render:false});check(S.water===64,'Pre-water Junior checkpoint migrates its documented starting tank');
   return {checks,cases,matrix,failures};
  });
  assert.deepEqual(errors,[],'No browser game errors during simulation policies');
  fs.writeFileSync(path.join(outdir,'blackout-systems.json'),JSON.stringify({...result,errors},null,2));
  console.log(JSON.stringify({checks:result.checks,runs:result.matrix.length,cases:result.cases,errors},null,2));
 }catch(error){fs.writeFileSync(path.join(outdir,'blackout-systems-failure.json'),JSON.stringify({error:error.stack,errors},null,2));await page.screenshot({path:path.join(outdir,'blackout-systems-failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
