/* Save boundary regression: failures must never replace the running colony. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out=path.resolve('dist/verification');fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');
  await page.waitForFunction(()=>window.Blackout&&window.Junior&&AresWorld.pending===0);
  const result=await page.evaluate(()=>{
   // These are isolated save-boundary fixtures, not claimed UI playthroughs.
   R3=null;render=()=>{};syncScene=()=>{};buildMenu=()=>{};
   let checks=0;const cases=[];
   const check=(ok,msg)=>{checks++;if(!ok)throw Error(msg);};
   const key='mars-colony-save',clone=x=>JSON.parse(JSON.stringify(x));
   const projection=()=>JSON.stringify({seed:S.seed,day:S.sol,parts:S.parts,water:S.water,food:S.food,air:S.o2,pop:S.pop,mode:!!S.junior,blackout:S.blackout?.stage||null,rng:rng.state});
   localStorage.removeItem(key);localStorage.removeItem(key+'-backup');
   Junior.start('junior',0,814);Junior.nextDay();
   check(Strategy.saveMission(),'A valid Junior mission saves');
   const first=localStorage.getItem(key),expected=projection();
   check(JSON.parse(first).version===2,'New saves have schema 2');
   check(!!JSON.parse(first).state.junior.checkpoint,'Saved mission retains recovery checkpoint');
   Junior.nextDay();check(Strategy.loadMission()&&projection()===expected,'Exact day/resources/RNG restore');
   Junior.nextDay();check(Strategy.saveMission(),'Second valid save succeeds');
   check(localStorage.getItem(key+'-backup')===first,'Last readable save is retained as backup');
   cases.push('Junior capture, exact restoration and backup');

   const valid=JSON.parse(first);
   for(const [name,mutate] of [
    ['future envelope',d=>d.version=99],
    ['bad terrain',d=>d.state.tiles[0].c=99],
    ['missing pod',d=>d.state.builds[0].type='solar'],
    ['invalid numeric stock',d=>d.state.o2='many'],
    ['future Junior',d=>d.state.junior.version=99],
    ['corrupt checkpoint',d=>d.state.junior.checkpoint.tiles=[]],
   ]){
    const bad=clone(valid);mutate(bad);localStorage.setItem(key,JSON.stringify(bad));const before=projection();
    check(!Strategy.loadMission()&&projection()===before,name+' rejected before replacing the game');
   }
   const unchanged=projection();localStorage.setItem(key,'{"broken":');check(!Strategy.loadMission()&&projection()===unchanged,'Broken JSON preserves live mission');
   cases.push('Corrupt/future save nonmutation');

   const legacy=clone(valid);legacy.version=1;delete legacy.state.water;delete legacy.state.junior.checkpoint.water;
   localStorage.setItem(key,JSON.stringify(legacy));check(Strategy.loadMission()&&S.water===64,'Legacy Junior missing water migrates once');
   check(JSON.parse(localStorage.getItem(key+'-backup')).version===1,'Original legacy save preserved before applying');
   cases.push('Version-1 legacy migration');

   Junior.start('commander',1,815);check(Strategy.saveMission(),'Commander capture saves');
   const commander=projection();Junior.start('junior',0,816);check(Strategy.loadMission()&&!S.junior&&projection()===commander,'Commander restores from Junior without losing its rules');
   cases.push('Commander compatibility');

   check(Blackout.start({code:'DRB1-817-0'}).ok,'Blackout starts');
   for(const [type,value] of [['predict','store'],['prepare','battery'],['predictField','shelter'],['observe','open'],['observe','shelter'],['shelter','shelter'],['request',null],['next',null]])check(Blackout.action(type,{value}).ok,type+' fixture action');
   check(Strategy.saveMission(),'Pending-radio Blackout saves');
   const blackout=projection(),message=clone(S.blackout.comms),bk=localStorage.getItem(key);
   check(Blackout.action('next').ok,'Advance pending-radio mission');
   check(Strategy.loadMission()&&projection()===blackout,'Blackout exact state restored');
   check(JSON.stringify(S.blackout.comms)===JSON.stringify(message),'Pending radio countdown restored exactly');
   const badBlackout=JSON.parse(bk);badBlackout.state.blackout.rules='unsupported';localStorage.setItem(key,JSON.stringify(badBlackout));
   check(!Strategy.loadMission()&&projection()===blackout,'Future scenario rejected safely');
   cases.push('Blackout pending reply and scenario version');

   localStorage.setItem(key,bk);const saved=localStorage.getItem(key),before=projection(),set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};
   try{check(!Strategy.saveMission(),'Full storage reports failed save');check(projection()===before,'Storage failure preserves live state');}
   finally{Storage.prototype.setItem=set;}
   check(localStorage.getItem(key)===saved,'Storage failure preserves last good saved mission');
   check(/Save failed/.test(document.getElementById('notice').textContent),'Storage failure is explained visibly');
   cases.push('Quota failure leaves live and saved missions intact');
   return {checks,cases,savedBytes:bk.length};
  });
  assert.deepEqual(errors,[],'No uncaught runtime errors');
  fs.writeFileSync(path.join(out,'persistence.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify(result,null,2));
 }catch(error){await page.screenshot({path:path.join(out,'persistence-failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
