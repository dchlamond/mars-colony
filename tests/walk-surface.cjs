const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],base=process.argv[2]||'http://127.0.0.1:8765';let releaseTerrain;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  if(process.env.ARES_LOW==='1')await page.addInitScript(()=>localStorage.setItem('marsq','low'));
  page.on('pageerror',e=>errors.push(e.message));
  const gate=new Promise(resolve=>{releaseTerrain=resolve;});let delayed=false;
  await page.route('**/assets/ares/mars-mola-*.glb',async route=>{delayed=true;await gate;await route.continue();});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.SurfaceSurvey&&window.Junior&&window.AresRender,null,{timeout:120000});
  const early=await page.evaluate(()=>{
   Junior.start('junior',0,20261114);modalQ=[];modalOpen=false;$('overlay').style.display='none';setSpeed(0);
   R3.target.set(X0+PW*.4,0,Z0+PH*.3);toggleWalk();AresRender.render();
   return {walking:!!R3.fp,clearance:R3.cam.position.y-surfaceY(R3.fp.x,R3.fp.z),loaded:AresWorld.terrain==='Blender MOLA mesh',grid:R3.surfaceGrid};
  });
  assert(delayed&&!early.loaded&&early.walking,'enter Walk before delayed terrain arrives');assert(early.clearance>=.489,'fallback surface keeps camera above ground');
  releaseTerrain();
  await page.waitForFunction(()=>SurfaceSurvey.ready&&AresWorld.pending===0,null,{timeout:120000});
  const report=await page.evaluate(()=>{
   let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;},close=(a,b,tol=.00002)=>Math.abs(a-b)<tol;
   check(AresWorld.errors.length===0,'all authored models load');check(!!R3.fp,'terrain replacement preserves Walk');
   check(R3.cam.position.y-surfaceY(R3.fp.x,R3.fp.z)>=WALK_EYE-.001,'late terrain replacement preserves camera clearance');
   check(S.speed===0,'Junior Walk preserves the player-controlled day');check(!R3.patch.visible&&!R3.overlay.visible,'only one opaque terrain surface is visible in Walk');
   const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,-1,0);R3.scene.updateMatrixWorld(true);let largestError=0;
   for(let i=0;i<40;i++){
    const x=X0+PW*((i*.371+.021)%1),z=Z0+PH*((i*.173+.013)%1);ray.set(new THREE.Vector3(x,20,z),direction);const hit=ray.intersectObject(R3.map)[0];
    check(!!hit,'terrain has no triangle holes at sampled mountain/polar positions');largestError=Math.max(largestError,Math.abs(hit.point.y-surfaceY(x,z)));check(close(hit.point.y,surfaceY(x,z)),'walking samples actual rendered triangles');
   }
   for(const z of [Z0+.1,Z0+PH*.24,Z0+PH*.55,Z0+PH-.1])check(close(surfaceY(X0+.000001,z),surfaceY(X0+PW-.000001,z),.0001),'dateline heights meet continuously');
   // Walk over more than two full longitude periods; every integration step is
   // bounded by speed, with no hidden range clamp or teleport back to the pod.
   clearWalkInput();const f=R3.fp;f.x=X0+PW-.3;f.z=Z0+PH*.78;f.yaw=-Math.PI/2;f.y=surfaceY(f.x,f.z)+WALK_EYE;keys.w=true;keys.shift=true;const start=f.x;let maxStep=0;
   for(let i=0;i<720;i++){const previous=f.x;walkStep(.1);const delta=f.x-previous;maxStep=Math.max(maxStep,delta);check(delta>=-.000001&&delta<=.385,'continuous movement across repeated longitude seams');check(R3.cam.position.y-surfaceY(f.x,f.z)>=WALK_EYE-.001,'running cannot enter the ground');}
   clearWalkInput();const distanceWalked=f.x-start;check(distanceWalked>PW*2,'walker can travel past two full planet widths');AresRender.render();R3.scene.updateMatrixWorld(true);
   const wraps=R3.scene.children.filter(n=>n.name==='Mars longitude wrap'&&n.visible);ray.set(new THREE.Vector3(f.x,20,f.z),direction);check(wraps.some(n=>ray.intersectObject(n).length),'visible terrain follows the walker beyond the original neighbour copies');
   // A canonical building footprint must have a visible copy in the same world.
   const pod=S.builds[0],px=tx(pod)+2*PW,pz=tz(pod);f.x=px;f.z=pz+1.4;walkStep(0);AresRender.render();
   check(AresRender.colonyLongitudeCopies.includes(2),'colony is visibly rendered on the second longitude image');check(walkBlocked(px,pz),'physical pod footprint blocks walking');check(!walkBlocked(px,pz+1.4),'walkable space outside the visible pod stays clear');
   const copy=R3.scene.children.find(n=>n.name==='Visible colony longitude wrap'&&close(n.position.x,2*PW));check(copy?.children.length>=S.builds.length,'wrapped collision has corresponding visible building meshes');
   // Explicit poles stop at the actual mesh edge, and reversing always works.
   f.x=X0+PW*.55;f.z=Z0+.03;f.yaw=0;keys.w=true;for(let i=0;i<20;i++)walkStep(.1);check(/North polar edge/.test(f.boundary),'actual polar limit is explained');check(f.z>=Z0,'camera stays inside the actual polar mesh');keys.w=false;keys.s=true;const pole=f.z;for(let i=0;i<10;i++)walkStep(.1);clearWalkInput();check(f.z>pole+.5,'reversing escapes the polar edge');
   // Releasing pointer lock pauses movement; it does not exit or relocate.
   const before=f.x;keys.w=true;R3.fpLocked=true;document.dispatchEvent(new Event('pointerlockchange'));check(R3.fp===f&&!keys.w&&f.x===before,'pointer-lock release preserves position and clears held keys');
   const end={x:wrapWorldX(f.x),z:f.z};toggleWalk();check(close(R3.target.x,end.x)&&close(R3.target.z,end.z),'Back to map returns to the visited location, not the landing pod');
   R3.target.set(tx(pod),0,tz(pod));toggleWalk();check(!walkBlocked(R3.fp.x,R3.fp.z),'entering over a building chooses a clear spawn');
   AresRender.render();const site=SurfaceSurvey.site;check(site&&site.artistic,'a real authored rock teaching site exists');check(hdist(site,pod)===3,'rock site is reachable three colony tiles away');
   R3.fp.x=site.sampleX;R3.fp.z=site.sampleZ;walkStep(0);AresRender.render();check(!walkBlocked(R3.fp.x,R3.fp.z),'rock sampling position is physically accessible');check(SurfaceSurvey.reading().condition==='rock'&&SurfaceSurvey.reading().exposureIndex===96,'rock comparison uses the actual visible outcrop');
   const initialFame=S.fame,result=SurfaceSurvey.record();check(result.ok&&result.recorded&&S.fame>initialFame,'physical survey grants evidence Fame');const earned=S.fame;SurfaceSurvey.record();check(S.fame===earned,'repeat reading cannot farm Fame');
   R3.fp.x=tx(pod);R3.fp.z=tz(pod)+2.3;walkStep(0);check(SurfaceSurvey.reading().condition==='open','ordinary clear ground has the outdoor reference');check(SurfaceSurvey.record().recorded,'outdoor sample is recorded');check(S.fame>=earned+7,'comparing open and rock earns comparison Fame once');
   const savedFame=S.fame;Strategy.saveMission();Strategy.loadMission();modalQ=[];modalOpen=false;$('overlay').style.display='none';SurfaceSurvey.update();check(!document.getElementById('surveyResult').textContent.includes('+'),'old mission notification is cleared on load');if(!R3.fp)toggleWalk();R3.fp.x=tx(S.builds[0]);R3.fp.z=tz(S.builds[0])+2.3;walkStep(0);SurfaceSurvey.record();check(S.fame===savedFame,'saved survey cannot be farmed after load');
   SurfaceSurvey.science();check(document.getElementById('modal').textContent.includes('8,100 micrograys')&&document.getElementById('modal').textContent.includes('not a temperature'),'source card distinguishes historical dose from temperature');modalQ=[];modalOpen=false;$('overlay').style.display='none';
   return {checks,quality:QUAL,largestSurfaceError:largestError,maxStep,distanceWalked,earlyGrid:HQ?640:240,authoredGrid:R3.surfaceGrid,site:{c:site.c,r:site.r},fame:savedFame};
  });
  fs.mkdirSync('dist/verification',{recursive:true});
  const layouts=[];
  for(const [width,height] of [[1440,900],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(400);
   const layout=await page.evaluate(()=>{
    const box=id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const back=document.querySelector('[data-a=walk]').getBoundingClientRect();return {panel:box('surfaceSurvey'),back:{x:back.x,y:back.y,right:back.right,bottom:back.bottom},overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert(!layout.overflow,'no horizontal overflow');for(const r of [layout.panel,layout.back])assert(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,height,r}));
   assert(layout.back.bottom<=layout.panel.y||layout.back.x>=layout.panel.right||layout.back.right<=layout.panel.x,'survey panel does not cover Back to map '+JSON.stringify({width,height,layout}));
   layouts.push({width,height,...layout});await page.screenshot({path:`dist/verification/walk-surface-${width}-${process.env.ARES_LOW==='1'?'low':'high'}.png`});
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,...report,layouts,errors},null,2));
 }finally{releaseTerrain?.();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
