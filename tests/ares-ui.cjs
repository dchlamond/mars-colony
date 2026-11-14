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
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');
  await page.getByRole('button',{name:'Begin mission',exact:true}).waitFor();
  await page.locator('#aresColonyName').fill('Ares Academy');
  await page.getByRole('button',{name:'Begin mission',exact:true}).click();
  await page.waitForFunction(()=>Junior.isActive()&&!modalOpen&&AresWorld.pending===0);
  assert.equal(await page.evaluate(()=>S.speed),0,'Junior waits for a deliberate next-day action');
  assert.equal(await page.locator('#aresResources .ares-resource').count(),4,'four primary resources');
  assert.equal(await page.locator('#aresGuide img').evaluate(el=>el.complete&&el.naturalWidth>0),true,'Grok guide loads');
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
   await page.setViewportSize({width,height});await page.waitForTimeout(120);
   const fit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:['aresDock','aresNextDay','aresMission','strategyTop'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};}),hit:['#aresNextDay','[data-ares-tab="build"]'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {s,reachable:e===t||e.contains(t)};})}));
   assert(!fit.overflow,`no horizontal overflow at ${width}×${height}`);
   for(const r of fit.controls)assert(r.w>0&&r.h>0&&r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,height,r}));
   for(const h of fit.hit)assert(h.reachable,`action is not covered at ${width}×${height}: ${h.s}`);
   await page.screenshot({path:path.join(output,`ares-${width}x${height}.png`)});
  }
  await page.setViewportSize({width:1280,height:720});
  await page.locator('[data-ares-tab="explore"]').click();await page.locator('#aresWalk').click();
  const back=await page.locator('[data-a="walk"]').boundingBox();assert(back&&back.y<150,'Back to map stays at the top');
  await page.locator('[data-a="walk"]').click();
  assert.equal(await page.evaluate(()=>S.speed),0,'returning from Walk preserves Junior turn pacing');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const result={passed:true,flow:'Welcome → pointer build → next day → discovery → source → save/restore → walk',sizes,errors,failed};
  fs.writeFileSync(path.join(output,'ares-ui.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
