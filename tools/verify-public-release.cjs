/* Verify the deployed bytes and public judge/teacher/demo routes without credentials. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=new URL(process.env.GAME_URL||'https://mars-colony-tau.vercel.app/');
const out=path.resolve(root,'dist/verification/public-release.json');
const files=['index.html','blackout.js','blackout-ui.js','blackout-ui.css','blackout-audio.js','junior.js','strategy.js','mission-systems.js','expedition.js','ares-world.js','ares-render.js','ares-ui.js','teacher-kit.html','mission-guide.html','judge-tour.html','demo/index.html','demo/blackout-demo.mp4','demo/demo.vtt','assets/ares/service-controller-b03.glb','assets/ares/water-witness-b03.glb'];
const report={startedAt:new Date().toISOString(),url:base.href,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:[],pages:[],errors:[],failures:[]};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let browser;
(async()=>{try{
 for(const file of files){
  const url=new URL(file,base),res=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'Cache-Control':'no-cache'}});
  assert.equal(res.status,200,`${file} is publicly accessible`);
  const bytes=Buffer.from(await res.arrayBuffer()),expected=sha(fs.readFileSync(path.join(root,'game',file)));
  assert.equal(sha(bytes),expected,`${file} matches the tested local candidate`);
  report.files.push({path:file,status:res.status,bytes:bytes.length,sha256:expected});
 }
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const route of ['judge-tour.html','teacher-kit.html','mission-guide.html','demo/']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon.ico'))failed.push({url:r.url(),status:r.status()});});
  await page.goto(new URL(route,base).href,{waitUntil:'networkidle',timeout:60000});
  const heading=await page.locator('h1').first().innerText();assert(heading.length>5);
  await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} has no horizontal overflow`);
  let duration=null;
  if(await page.locator('video').count()){await page.waitForFunction(()=>document.querySelector('video').readyState>=1);duration=await page.locator('video').evaluate(v=>v.duration);assert(duration>0&&duration<=30,'Official demo is at most thirty seconds');}
  if(route==='judge-tour.html')assert.equal(await page.locator('a.launch').getAttribute('href'),'./?tour=1');
  if(route==='teacher-kit.html')assert((await page.locator('body').innerText()).includes('Child pilot not yet conducted.'));
  assert.deepEqual(errors,[],`${route} browser errors`);assert.deepEqual(failed,[],`${route} assets`);
  const screenshot=path.join(path.dirname(out),'public-'+route.replace(/[^a-z]/gi,'-')+'.png');await page.screenshot({path:screenshot});
  report.pages.push({route,heading,duration,errors,failed,screenshot});await page.close();
 }
 report.passed=true;report.completedAt=new Date().toISOString();console.log(JSON.stringify({passed:true,commit:report.commit,matchingFiles:report.files.length,publicPages:report.pages.length},null,2));
}catch(e){report.failures.push({message:e.message,stack:e.stack});console.error(e);process.exitCode=1;}
finally{await browser?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));}})();
