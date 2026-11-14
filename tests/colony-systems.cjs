const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__MARS_MODE__='commander'});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');await page.waitForFunction(()=>window.ColonySystems&&G.R3);
  const result=await page.evaluate(()=>{
   const C=ColonySystems;let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
   const reset=()=>{newGame(182,0);modalQ=[];modalOpen=false;$('overlay').style.display='none';S.speed=0;C.ensure();};
   const add=(type,props={})=>{const t=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock');const b={type,c:t.c,r:t.r,done:true,on:true,lvl:1,age:100,...props};t.build=b;S.builds.push(b);return b;};
   reset();add('solar');add('solar');const m=add('moxie'),base=compute();C.setMethod(m,'push');const pushed=compute();check(pushed.o2p>base.o2p,'intensive production increases actual air');check(pushed.demand>base.demand,'intensive production consumes more power');
   C.setMethod(m,'conserve');const economy=compute();check(economy.o2p<base.o2p&&economy.demand<base.demand,'economy trades yield for power');
   C.setMethod(m,'balanced');m.condition=40;check(compute().o2p<base.o2p,'condition affects real output');m.condition=0;check(compute().o2p===0,'broken extractor stops');m.condition=100;
   const managementBefore=JSON.stringify(S.management),flagsBefore=JSON.stringify(S.builds.map(b=>[b.staffed,b.powered]));C.preview(s=>s.management.crew[0].duty='power');Operations.forecast('moxie',Operations.candidates('moxie')[0]);check(JSON.stringify(S.management)===managementBefore&&JSON.stringify(S.builds.map(b=>[b.staffed,b.powered]))===flagsBefore,'previews leave state and staffing unchanged');
   const idle=compute().idle;C.assign(2,'power');check(compute().idle===idle-1&&compute().demand<base.demand,'power specialist uses a real worker');C.assign(2,'general');
   C.assign(0,'maintenance');check(compute().idle===idle,'repair specialist returns to general work with empty queue');
   const parts=S.parts,metal=S.metal;check(C.repair(m),'repair accepted');check(!C.repair(m),'duplicate repair rejected');check(S.parts===parts-2&&S.metal===metal-1,'materials spent once');check(upgrade(m).includes('repair'),'repair blocks simultaneous upgrade');
   check(compute().o2p>0,'queued repair stays online');check(compute().idle===idle-1,'crew reserved for queued repair');
   S.sol++;C.beginSol();check(compute().o2p===0,'started repair stops production');const progress=C.ensure().repairs[0].progress;C.endSol();const after=C.ensure().repairs[0].progress;check(after>progress,'assigned engineer makes progress');C.endSol();check(C.ensure().repairs[0].progress===after,'same sol cannot double progress');
   C.assign(0,'general');S.sol++;C.beginSol();C.endSol();check(compute().o2p===0&&C.ensure().repairs[0].progress===after,'started repair stays offline when crew reassigned');
   C.assign(0,'maintenance');S.storm={active:true,choice:'shelter'};S.sol++;C.beginSol();C.endSol();check(C.ensure().repairs[0].progress===after,'shelter pauses repairs');S.storm=null;
   for(let i=0;i<20&&C.ensure().repairs.length;i++){S.sol++;C.beginSol();compute();C.endSol();}check(!C.ensure().repairs.length&&m.condition===100&&compute().o2p>0,'repair restores production');
   C.repair(m);C.cancelRepair(m);check(S.parts===parts-2&&S.metal===metal-1,'unstarted cancellation refunds');C.repair(m);S.sol++;C.beginSol();const committed=S.parts;C.cancelRepair(m);check(S.parts===committed&&compute().o2p>0,'started cancellation no refund and resumes machine');
   reset();add('solar');add('solar');const crop=add('green');const food=compute().foodp,idleBefore=compute().idle;C.assign(1,'crops');check(compute().foodp>food&&compute().idle===idleBefore-1,'crop specialist real output and staffing tradeoff');
   C.assign(1,'training');for(let n=0;n<12;n++){S.sol++;C.beginSol();compute();C.endSol();}check(C.ensure().crew[1].level===2&&C.ensure().crew[1].duty==='general','12 working sols train one level');
   C.assign(1,'training');S.storm={active:true,choice:'shelter'};S.sol++;C.beginSol();compute();C.endSol();check(C.ensure().crew[1].training===0,'training pauses while sheltered');S.storm=null;C.assign(1,'general');
   C.ensure().crew.forEach(p=>p.duty='power');S.pop=2;S.rover={crew:1};check(C.allocation().reserved===1&&compute().idle===0,'cannot reserve more workers than available');S.rover=null;S.sol++;C.beginSol();check(C.ensure().crew.filter(p=>!p.home).length===2,'departed founders marked home');S.pop=8;C.beginSol();check(C.ensure().crew.filter(p=>!p.home).length===2,'new arrivals do not resurrect founders');
   reset();const t1=S.tiles.find(t=>t.seen&&!t.build),elev=t1.elev;t1.elev=tileAt(S.builds[0].c,S.builds[0].r).elev;const flat=C.serviceWork(t1);t1.elev+=4;check(C.serviceWork(t1)===flat+4,'terrain height changes actual repair workload');t1.elev=elev;
   const r=S.rivals[0],d=r.development,metal0=S.metal,parts0=S.parts,rp=d.parts,rm=d.metal;check(C.trade(0),'resource trade accepted');check(S.metal===metal0-6&&S.parts===parts0+3&&d.parts===rp-3&&d.metal===rm+6,'trade conserves both colonies resources');check(!C.trade(0),'trade cooldown prevents farming');
   for(let i=0;i<100;i++){S.sol++;C.beginSol();compute();C.endSol();}check(d.builds.length>0&&C.rivalAppeal(r)>0,'rival builds with actual budget and gains appeal');check(d.parts>=0&&d.metal>=0,'rival cannot overspend');
   const boost=C.rivalAppeal(r),normal=splitPool(2,[60,59,60]),stronger=splitPool(2,[60,59+boost,60]);check(stronger[1]>normal[1],'finished rival structures affect passenger competition');
   render();Strategy.saveMission();const saved=JSON.parse(localStorage.getItem('mars-colony-save'));check(saved.state.rivals[0].development.builds.length===d.builds.length,'rival structures saved without scene references');S.management=null;Strategy.loadMission();check(S.management.crew.length===6&&S.rivals[0].development.builds.length>0,'management and rival state restored');
   delete saved.state.management;saved.state.rivals.forEach(r=>delete r.development);localStorage.setItem('mars-colony-save',JSON.stringify(saved));Strategy.loadMission();check(C.ensure().crew.length===6&&S.rivals.every(r=>r.development),'older saves migrate safely');
   reset();const life=add('moxie'),solar=add('solar');add('solar');C.setMethod(life,'push');compute();const old=life.condition??100;S.sol++;C.beginSol();compute();C.endSol();check(Math.abs(life.condition-(old-.24))<1e-8,'intensive wear applied once per productive sol');life.on=false;const stopped=life.condition;S.sol++;C.beginSol();compute();C.endSol();check(life.condition===stopped,'switched-off machinery does not wear');life.on=true;life.condition=55;render();buildingPanel(life);
   return {checks};
  });
  await page.locator('[data-method]').selectOption('conserve');await page.getByRole('button',{name:'Use method',exact:true}).click();assert.equal(await page.locator('[data-method]').inputValue(),'conserve');
  await page.locator('[data-system^="repair:"]').click();await page.getByRole('button',{name:'Queue repair',exact:true}).click();
  await page.screenshot({path:'/tmp/mars-test/management-building.png'});
  await page.locator('[data-tab=people]').click();await page.locator('[data-duty="0"]').selectOption('maintenance');await page.getByRole('button',{name:'Assign duty',exact:true}).click();assert.equal(await page.locator('[data-duty="0"]').inputValue(),'maintenance');
  await page.screenshot({path:'/tmp/mars-test/management-people.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab=rivals]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/tmp/mars-test/management-mobile.png'});
  assert.deepEqual(errors,[]);console.log({...result,ui:'method / repair / assignment confirmed',mobileOverflow:false,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
