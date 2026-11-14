const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],external=[],fileAssets=[];
    const documentUrl=pathToFileURL(path.resolve(__dirname,'../dist/Mars-Colony.html')).href;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|GL_INVALID/i.test(m.text()))errors.push(m.text());});
    page.on('request',r=>{const u=r.url();if(/^https?:/i.test(u))external.push(u);if(u.startsWith('file:')&&u!==documentUrl)fileAssets.push(u);});
    await page.context().setOffline(true);
    await page.goto(documentUrl,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.AresRender&&AresWorld.ready&&AresWorld.pending===0,null,{timeout:120000});
    await page.waitForFunction(()=>document.querySelector('#aresGuide img')?.naturalWidth>0);
    await page.getByRole('button',{name:'Begin mission',exact:true}).click();
    await page.waitForFunction(()=>Junior.isActive()&&!modalOpen);
    const start=await page.evaluate(()=>S.sol);
    await page.locator('#aresNextDay').click();
    const state=await page.evaluate(()=>({day:S.sol,mode:Junior.isActive()?'junior':'commander',assets:Object.keys(AresWorld.assets).sort(),pending:AresWorld.pending,assetErrors:AresWorld.errors,portraitWidth:document.querySelector('#aresGuide img').naturalWidth,embeddedAssets:['assets/ares/habitat-h01.glb','assets/ares/greenhouse-g01.glb','assets/ares/regolith-colour.png','assets/ares/regolith-height.png','assets/ares/regolith-normal.png','assets/ares-ui/martian-guide.jpg','assets/ares/grok-regolith.jpg','assets/ares/mars-mola-terrain.glb','assets/ares/astronaut-a02.glb','assets/ares/rover-rv02.glb','assets/ares/shuttle-l02.glb','mission-guide.html'].every(p=>window.INLINE[p]?.startsWith('data:')),crewVisible:[...AresRender.actors.values()].filter(a=>a.visible).length,crewTotal:AresRender.actors.size,authoredCrew:[...AresRender.actors.values()].every(a=>a.userData.authoredSuit),terrain:AresWorld.terrain,patchTextureLoaded:!!R3.patch.material.map.image?.width}));
    assert.equal(state.day,start+1);assert.equal(state.mode,'junior');
    assert.deepEqual(state.assets,['battery','dome','green','habitat','ice','mine','moxie','pod','reactor','shield','solar']);assert.deepEqual(state.assetErrors,[]);
    assert.equal(state.pending,0);assert(state.portraitWidth>0);assert(state.embeddedAssets);assert.equal(state.crewVisible,6);assert.equal(state.crewTotal,6);assert(state.authoredCrew);assert.equal(state.terrain,'Blender MOLA mesh');assert(state.patchTextureLoaded);
    await page.locator('[data-ares-tab="science"]').click();await page.locator('#aresGuidebook').click();
    const guide=page.frameLocator('iframe[title="Mission guide"]');await guide.locator('#people h2').waitFor();assert.equal(await guide.locator('#people h2').innerText(),'One person, one role');
    assert((await page.locator('iframe[title="Mission guide"]').getAttribute('src')).startsWith('data:text/html'),'guide is embedded for offline use');
    await page.getByRole('button',{name:'Back to my colony',exact:true}).click();assert.equal(await page.evaluate(()=>S.sol),start+1,'opening the guide does not advance the mission');
    await page.locator('#aresCloseDrawer').click();
    const themes=await page.evaluate(async()=>{
      const result=[];
      for(const theme of AresUI.themes){AresUI.setTheme(theme.id);const family=getComputedStyle(document.body).fontFamily.split(',')[0];const faces=await document.fonts.load('16px '+family);result.push({id:theme.id,font:theme.font,family,loaded:faces.length>0&&faces.every(f=>f.status==='loaded')});}
      AresUI.setTheme('flight');return result;
    });
    assert.equal(themes.length,5);assert(themes.every(t=>t.loaded),'all five actual font files load without networking');
    const field=await page.evaluate(()=>{
      toggleWalk();SurfaceSurvey.update();const first=SurfaceSurvey.record();const repeat=SurfaceSurvey.record();
      return {ready:SurfaceSurvey.ready,instrument:AresWorld.dosimeter,condition:SurfaceSurvey.reading().condition,reward:first.reward,repeat:repeat.reward,fame:S.fame,hidden:document.getElementById('surfaceSurvey').hidden,human:window.INLINE['assets/ares-ui/mission-adviser.jpg']?.startsWith('data:image/'),tool:window.INLINE['assets/ares/surface-dosimeter.glb']?.startsWith('data:')};
    });
    assert(field.ready&&field.human&&field.tool&&!field.hidden,'human adviser and authored handheld instrument are embedded and available');
    assert.equal(field.reward,3);assert.equal(field.repeat,0);assert.equal(field.fame,3,'offline field evidence changes real Fame once');
    await page.evaluate(()=>toggleWalk());
    assert.deepEqual(external,[]);assert.deepEqual(fileAssets,[]);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,network:'offline',...state,themes,field,externalRequests:external.length,separateFileRequests:fileAssets.length,errors},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
