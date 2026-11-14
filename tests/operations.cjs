const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');await page.waitForFunction(()=>window.Operations&&G.R3);
  await page.evaluate(()=>{modalQ=[];modalOpen=false;$('overlay').style.display='none';render();});
  await page.locator('[data-tab=council]').click();
  await page.locator('[data-op="review:air"]').click();
  await page.getByRole('button',{name:'Commit 2 parts'}).click();
  assert.match(await page.locator('#projectCouncil').innerText(),/65 sols left/);
  await page.locator('[data-tab=science]').click();assert.equal(await page.locator('.site-comparison thead th').count(),4);await page.locator('#opSiteType').selectOption('solar');await page.locator('#siteLab [data-op^="build:"]').click();assert.equal(await page.evaluate(()=>S.builds.length),2);await page.locator('[data-tab=science]').click();
  await page.screenshot({path:'/tmp/mars-test/operations-science.png'});
  const result=await page.evaluate(()=>{
   let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
   const reset=()=>{newGame(182,0);modalQ=[];modalOpen=false;$('overlay').style.display='none';S.speed=0;};reset();
   const at=sol=>{S.sol=sol;Operations.step();};
   check(MARS_EPHEMERIS.rows.length===833,'833 dated ephemeris rows');
   check(Math.abs(signalDelay()-20.98606)<.0001,'actual JPL down-leg light time');
   check(Operations.replySols()===21,'rounded round-trip game time');
   S.sol=417;check(Operations.replySols()<10,'distance actually changes delay');reset();
   const t=Operations.candidates('moxie')[0],flags=JSON.stringify(S.builds.map(b=>[b.staffed,b.powered])),parts=S.parts;
   Operations.forecast('moxie',t);check(S.parts===parts&&JSON.stringify(S.builds.map(b=>[b.staffed,b.powered]))===flags,'forecast does not mutate real economy');
   check(Operations.accept('shelter'),'accept contract');check(!Operations.accept('air'),'cannot accept twice');check(S.parts===parts-2,'bond charged once');
   S.eco={...S.eco,shelter:9};S.o2=100;S.food=100;at(2);at(2);check(Operations.state().active.streak===1,'same sol counts once');at(3);at(4);
   check(Operations.state().active.ready,'three consecutive evidence sols');check(Operations.transmit(),'transmit evidence');check(!Operations.transmit(),'cannot send twice');
   const remaining=Operations.state().active.packet.left;
   Strategy.saveMission();S.parts=999;Strategy.loadMission();check(S.parts===parts-2&&Operations.state().active.packet.left===remaining,'saved evidence restores');
   let deadline=Operations.state().active.deadline;for(let i=0;i<remaining;i++)at(5+i);
   check(Operations.state().completed.includes('shelter'),'confirmed before deadline');check(S.parts===parts+6,'grant and bond paid exactly once');at(50);check(S.parts===parts+6,'no duplicate payout');check(!Operations.accept('shelter'),'no completed-contract farming');
   reset();Operations.accept('air');S.eco={...S.eco,o2p:10,shut:0};at(2);S.eco.o2p=0;at(3);check(Operations.state().active.streak===0,'failed operation resets streak');
   const a=Operations.state().active;S.fame=9;at(a.deadline);check(!Operations.state().active&&S.fame===4,'deadline consequences');const lostParts=S.parts;at(a.deadline);check(S.parts===lostParts&&S.fame===4,'failure only once');
   const boost=Operations.state().rivalBoost;check(boost&&boost.amount===8,'rival gains timed modifier');
   const boosted=splitPool(2,[60,55,70]);Operations.state().rivalBoost=null;const normal=splitPool(2,[60,55,70]);check(boosted[1]>normal[1],'rival modifier changes real distribution');
   reset();S.sol=370;Operations.accept('shelter');Operations.state().active.ready=true;check(Operations.transmit(),'send ahead of blackout');const n=Operations.state().active.packet.left;at(374);check(Operations.state().active.packet.left===n,'blackout holds packet');at(388);check(Operations.state().active.packet.left===n-1,'packet resumes after blackout');
   reset();S.sol=374;Operations.accept('air');Operations.state().active.ready=true;check(!Operations.transmit(),'blackout blocks sending');
   reset();S.parts=1;check(!Operations.accept('air'),'cannot overspend bond');S.parts=30;S.over='loss';check(!Operations.accept('air'),'cannot act after mission ends');
   reset();Strategy.saveMission();const old=JSON.parse(localStorage.getItem('mars-colony-save'));delete old.state.operations;localStorage.setItem('mars-colony-save',JSON.stringify(old));Strategy.loadMission();check(!Operations.state().active,'old saves initialize safely');
   return {checks};
  });
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab=council]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/mars-test/operations-mobile.png'});
  if(!process.env.GAME_URL){await page.goto('file://'+path.resolve('dist/Mars-Colony.html'));await page.waitForFunction(()=>window.Operations);assert.equal(await page.evaluate(()=>MARS_EPHEMERIS.rows.length),833);}
  assert.deepEqual(errors,[]);console.log({...result,mobileOverflow:false,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
