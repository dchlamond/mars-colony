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
    await page.goto(documentUrl);
    await page.waitForFunction(()=>window.AresWorld?.ready&&AresWorld.pending===0);
    await page.waitForFunction(()=>document.querySelector('#aresGuide img')?.naturalWidth>0);
    await page.getByRole('button',{name:'Begin mission',exact:true}).click();
    await page.waitForFunction(()=>Junior.isActive()&&!modalOpen);
    const start=await page.evaluate(()=>S.sol);
    await page.locator('#aresNextDay').click();
    const state=await page.evaluate(()=>({day:S.sol,mode:Junior.isActive()?'junior':'commander',assets:Object.keys(AresWorld.assets).sort(),pending:AresWorld.pending,assetErrors:AresWorld.errors,portraitWidth:document.querySelector('#aresGuide img').naturalWidth,embeddedAssets:['assets/ares/habitat-h01.glb','assets/ares/greenhouse-g01.glb','assets/ares/regolith-colour.png','assets/ares/regolith-height.png','assets/ares/regolith-normal.png','assets/ares-ui/martian-guide.jpg'].every(p=>window.INLINE[p]?.startsWith('data:')),crewVisible:!!S.builds[0].astro?.visible}));
    assert.equal(state.day,start+1);assert.equal(state.mode,'junior');
    assert.deepEqual(state.assets,['green','habitat','pod']);assert.deepEqual(state.assetErrors,[]);
    assert.equal(state.pending,0);assert(state.portraitWidth>0);assert(state.embeddedAssets);assert(state.crewVisible);
    assert.deepEqual(external,[]);assert.deepEqual(fileAssets,[]);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,network:'offline',...state,externalRequests:external.length,separateFileRequests:fileAssets.length,errors},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
