/* AI-assisted release verification: exercise player-facing controls and persistence. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const output=path.resolve('dist/verification');fs.mkdirSync(output,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],failed=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack||e.message);});
  page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded',timeout:90000});
  await page.getByRole('button',{name:'Begin mission',exact:true}).waitFor();
  await page.locator('#aresColonyName').fill('Ares Academy');
  await page.getByRole('button',{name:'Begin mission',exact:true}).click();
  await page.waitForFunction(()=>Junior.isActive()&&!modalOpen&&AresWorld.pending===0,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>S.speed),0,'Junior waits for a deliberate next-day action');
  assert.equal(await page.locator('#aresResources .ares-resource').count(),6,'five resources and actual crew total');
  await page.locator('[data-ares-resource=water]').click();
  assert((await page.locator('#aresDrawer').innerText()).includes('Change in your tank'),'water detail explains the real daily ledger');
  assert.equal(await page.locator('[data-ares-resource=water] strong').innerText(),String(Math.round(await page.evaluate(()=>S.water))),'water display matches the simulation');
  await page.locator('#aresCloseDrawer').click();
  await page.locator('#aresAppeal').click();
  assert((await page.locator('#aresDrawer').innerText()).includes('Colony appeal'),'appeal explanation opens');
  await page.locator('#aresAppealCrew').click();
  assert((await page.locator('#aresDrawer').innerText()).includes('Everyone has one job'),'crew distribution is explained');
  const roles=await page.evaluate(()=>Junior.crewRoles());
  assert.equal(roles.operators+roles.builders+roles.technicians+roles.cleaners+roles.explorers+roles.resting+roles.sheltered,roles.total,'role counts never duplicate population');
  await page.locator('#aresCloseDrawer').click();
  assert.equal(await page.locator('#aresGuide img').evaluate(el=>el.complete&&el.naturalWidth>0),true,'human mission adviser loads');
  await page.locator('[data-ares-tab="build"]').click();
  await page.locator('#build [data-t="solar"]').click();
  // Project a real clear tile through the live camera, then place by pointer.
  const location=await page.evaluate(()=>{
   const canvas=R3.renderer.domElement,rect=canvas.getBoundingClientRect();
   const blockers=['commandPanel','aresMission','aresDock','aresNextDay','aresGuide','aresMini','strategyTop','camctl'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden&&e.getBoundingClientRect().width).map(e=>e.getBoundingClientRect());
   return S.tiles.filter(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock').map(t=>{const p=new THREE.Vector3(tx(t),tileY(t),tz(t)).project(R3.cam);return {c:t.c,r:t.r,x:rect.x+(p.x+1)*rect.width/2,y:rect.y+(1-p.y)*rect.height/2,z:p.z};}).find(p=>p.z<1&&p.x>360&&p.x<innerWidth-320&&p.y>170&&p.y<innerHeight-140&&!blockers.some(r=>p.x>=r.left-12&&p.x<=r.right+12&&p.y>=r.top-12&&p.y<=r.bottom+12));
  });
  assert(location,'a playable tile remains visible around the interface');
  await page.mouse.click(location.x,location.y);
  await page.waitForFunction(()=>S.builds.some(b=>b.type==='solar'));
  assert.equal(await page.evaluate(()=>S.parts),62,'pointer placement charges exactly the visible six Parts');
  await page.locator('#closePanel').click();
  await page.locator('#aresNextDay').click();await page.locator('#aresNextDay').click();
  await page.waitForFunction(()=>S.builds.find(b=>b.type==='solar')?.done);
  assert.equal(await page.evaluate(()=>S.junior.phase),1,'construction advances the actual mission');
  await page.locator('[data-ares-tab="science"]').click();
  await page.locator('[data-fact="solar"]').click();
  assert.equal(await page.locator('#overlay').isVisible(),true,'discovery opens the full lesson');
  assert((await page.locator('#modal').innerText()).length>120,'science explanation includes substance');
  assert(await page.locator('#modal a[href^="https://"]').count()>0,'science explanation links its source');
  await page.getByRole('button',{name:'Back to my colony',exact:true}).click();
  await page.locator('#aresGuidebook').click();
  const guide=page.frameLocator('iframe[title="Mission guide"]');
  await guide.locator('h1').waitFor();
  assert((await guide.locator('body').innerText()).includes('One person, one role'),'embedded mechanics guide contains the crew explanation');
  assert.equal(await guide.locator('body').evaluate(el=>document.documentElement.scrollWidth<=innerWidth+1),true,'guide fits its iframe without horizontal page overflow');
  assert(await guide.locator('a[href*="nasa.gov"]').count()>0,'guide retains NASA source links');
  await page.getByRole('button',{name:'Back to my colony',exact:true}).click();
  await page.locator('#aresData').click();
  assert((await page.locator('#modal').innerText()).includes('MOLA'),'Data sources remain accessible');
  await page.locator('#modal .btns button').last().click();
  await page.locator('#aresCloseDrawer').click();
  await page.locator('#aresSettings').click();await page.locator('#saveMission').click();
  const saved=await page.evaluate(()=>({day:S.sol,parts:S.parts,phase:S.junior.phase}));
  await page.locator('#closePanel').click();await page.locator('#aresNextDay').click();
  await page.locator('#aresSettings').click();await page.locator('#loadMission').click();
  assert.deepEqual(await page.evaluate(()=>({day:S.sol,parts:S.parts,phase:S.junior.phase})),saved,'Junior save returns to the same day and mission');
  await page.locator('#closePanel').click();
  const sizes=[[1440,900],[1280,720],[1024,600],[390,844],[844,390]];
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});await page.waitForTimeout(450);
   const fit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:['aresDock','aresNextDay','aresMission','strategyTop','aresResources','aresAppeal','aresFame','aresPowerBoost','aresSettings'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};}),hit:['#aresNextDay','[data-ares-tab="build"]'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {s,reachable:e===t||e.contains(t)};})}));
   assert(!fit.overflow,`no horizontal overflow at ${width}×${height}`);
   for(const r of fit.controls)assert(r.w>0&&r.h>0&&r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,height,r}));
   for(const h of fit.hit)assert(h.reachable,`action is not covered at ${width}×${height}: ${h.s}`);
   if(width===390)assert(fit.controls.find(r=>r.id==='strategyTop').h<height*.3,'expanded phone HUD leaves room for the map');
   const resourceFit=await page.locator('#aresResources').evaluate(el=>[...el.children].map(button=>{const r=button.getBoundingClientRect();return {key:button.dataset.aresResource,x:r.x,right:r.right,overflow:button.scrollWidth>button.clientWidth+2};}));
   for(const r of resourceFit)assert(r.x>=0&&r.right<=width&&!r.overflow,'resource stays readable: '+JSON.stringify({width,r}));
   const cameraHit=await page.locator('#camctl button').evaluateAll(buttons=>buttons.map(e=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:e.textContent,visible:r.width>0&&r.height>0,reachable:e===t||e.contains(t)};}).filter(b=>b.visible));
   for(const b of cameraHit)assert(b.reachable,'camera action stays reachable at '+width+'×'+height+': '+b.label);
   await page.screenshot({path:path.join(output,`ares-${width}x${height}.png`)});
   if(width===390){
    await page.locator('[data-ares-tab="science"]').click();await page.locator('#aresGuidebook').click();
    await guide.locator('h1').waitFor();
    const guideFit=await guide.locator('body').evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,font:parseFloat(getComputedStyle(document.body).fontSize)}));
    assert(!guideFit.overflow&&guideFit.font>=16,'phone guide remains readable and does not overflow');
    await page.getByRole('button',{name:'Back to my colony',exact:true}).click();await page.locator('#aresCloseDrawer').click();
   }
  }
  await page.setViewportSize({width:1280,height:720});
  await page.locator('[data-ares-tab="explore"]').click();await page.locator('#aresWalk').click();
  const back=await page.locator('[data-a="walk"]').boundingBox();const shell=await page.locator('#strategyTop').boundingBox();assert(back&&shell&&back.y>=shell.y+shell.height&&back.y<shell.y+shell.height+50,'Back to map stays immediately below the top HUD');
  await page.locator('[data-a="walk"]').click();
  assert.equal(await page.evaluate(()=>S.speed),0,'returning from Walk preserves Junior turn pacing');
  await page.setViewportSize({width:1440,height:900});
  assert.equal(await page.evaluate(()=>AresUI.title),'DEAD RECKONING: BLACKOUT','exact game branding');
  assert((await page.locator('#aresGuide img').getAttribute('src')).includes('mission-adviser.jpg'),'human adviser replaces the Martian');
  await page.locator('#aresFame').click();assert((await page.locator('#aresDrawer').innerText()).includes('First solar power'),'Fame explains an actual earned milestone');await page.locator('#aresCloseDrawer').click();
  await page.locator('#aresPowerBoost').click();
  assert((await page.locator('#aresDrawer').innerText()).includes('Technician time'),'boost explains the real crew cost');
  await page.locator('.ares-boost-card summary').click();
  assert(await page.locator('a[href="https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/"]').count()===1,'measured InSight evidence has its direct source');
  const beforeBoost=await page.evaluate(()=>S.parts);await page.locator('#aresActivateBoost').click();
  assert.equal(await page.evaluate(()=>S.parts),beforeBoost-2,'visible boost charges exactly two Parts');
  assert.equal(await page.evaluate(()=>Junior.crewRoles().technicians),1,'one actual crew member works on the boost');
  await page.locator('#aresCloseDrawer').click();
  await page.locator('#aresSettings').click();
  const families=[];
  for(const theme of ['flight','expedition','deep','frontier','horizon']){
   await page.locator('[data-ui-theme-choice="'+theme+'"]').click();
   assert.equal(await page.evaluate(()=>AresUI.theme),theme,'Settings applies the actual skin');
   assert.equal(await page.evaluate(()=>localStorage.getItem('dead-reckoning-ui-theme')),theme,'skin choice persists');
   await page.evaluate(()=>document.fonts.ready);
   families.push(await page.evaluate(()=>getComputedStyle(document.body).fontFamily));
   await page.locator('#closePanel').click();
   for(const [width,height] of [[1440,900],[390,844],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(200);
    const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,font:parseFloat(getComputedStyle(document.body).fontSize),blocked:[...document.querySelectorAll('#aresTools button,#aresDock button,#camctl button,#aresNextDay')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&!e.hidden;}).filter(e=>{const r=e.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e!==top&&!e.contains(top);}).map(e=>e.id||e.textContent)}));
    assert(!result.overflow&&result.font>=16,theme+' stays readable at '+width);assert.deepEqual(result.blocked,[],theme+' controls reachable at '+width);
   }
   await page.setViewportSize({width:1440,height:900});await page.locator('#aresSettings').click();
  }
  assert.equal(new Set(families).size,5,'all five themes use different real font families');
  await page.locator('#aresThemeGallery').click();assert.equal(await page.locator('.ares-theme-gallery img').count(),5,'gallery contains all five game captures');
  await page.locator('#modal [data-ui-theme-choice="flight"]').click();await page.getByRole('button',{name:'Keep this interface',exact:true}).click();await page.locator('#closePanel').click();
  // A real recycler changes daily loss. Gross circulation must not trigger a
  // false shortage warning for a tank that contains many days of replacement water.
  const waterReserve=await page.evaluate(()=>{
   const t=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type!=='ice'&&t.type!=='rock');
   S.pop=8;S.water=20;S.builds.push({type:'ice',c:t.c,r:t.r,done:true,on:true,lvl:1,age:0});
   S.eco=compute();AresUI.update();return {net:S.eco.waterNet,use:S.eco.waterUse,powered:S.builds.at(-1).powered};
  });
  assert(waterReserve.powered&&waterReserve.use===8&&waterReserve.net<0&&waterReserve.net>-.5,'water-warning fixture uses actual recycling');
  assert.equal(await page.locator('[data-ares-resource=water]').evaluate(el=>el.classList.contains('ares-low')),false,'20 water with eight crew and recycling is a healthy reserve');
  const commanderUrl=new URL(process.env.GAME_URL||'http://127.0.0.1:8765');commanderUrl.searchParams.set('mode','commander');
  await page.goto(commanderUrl.toString(),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.AresWorld?.ready&&AresWorld.pending===0,null,{timeout:90000});
  await page.evaluate(()=>{modalQ=[];modalOpen=false;$('overlay').style.display='none';render();});
  assert.equal(await page.evaluate(()=>AresUI.theme),'flight','theme selection survives navigation');
  assert.equal(await page.locator('#aresResources .ares-resource').count(),7,'Commander includes Metal as its own resource');
  assert((await page.locator('[data-ares-resource=water]').innerText()).includes('farms watered'),'Commander water is honestly labelled as irrigation');
  for(const [width,height] of [[1280,720],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(450);
   const fit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,resources:[...document.querySelectorAll('#aresResources .ares-resource')].map(e=>{const r=e.getBoundingClientRect();return {key:e.dataset.aresResource,x:r.x,right:r.right,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth+2};})}));
   assert(!fit.overflow,'Commander has no horizontal overflow at '+width);
   for(const r of fit.resources)assert(r.x>=0&&r.right<=width&&r.bottom<=height&&!r.overflow,'Commander resource fits '+JSON.stringify({width,r}));
   const cameraHit=await page.locator('#camctl button').evaluateAll(buttons=>buttons.map(e=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:e.textContent,visible:r.width>0&&r.height>0,reachable:e===t||e.contains(t)};}).filter(b=>b.visible));
   for(const b of cameraHit)assert(b.reachable,'Commander camera action stays reachable at '+width+'×'+height+': '+b.label);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const result={passed:true,themes:['flight','expedition','deep','frontier','horizon'],flow:'Welcome → water ledger → appeal → crew roles → pointer build → next day → discovery → embedded guide → source → save/restore → walk',sizes,errors,failed};
  fs.writeFileSync(path.join(output,'ares-ui.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
