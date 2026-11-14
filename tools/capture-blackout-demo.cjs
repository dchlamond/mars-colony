/* Capture actual BLACKOUT play with visible controls. No state or DOM fabrication. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const out=path.resolve('docs/demo'),publicOut=path.resolve('game/demo'),raw=path.resolve('../overnight/evidence/demo');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(publicOut,{recursive:true});fs.mkdirSync(raw,{recursive:true});
const url=process.env.GAME_URL||'http://127.0.0.1:8765/';
const readHashes=()=>Object.fromEntries(['game/index.html','game/blackout.js','game/blackout-ui.js','game/blackout-ui.css','game/ares-render.js','game/ares-world.js','game/junior.js','game/mission-systems.js','game/strategy.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const manifest={capturedAt:new Date().toISOString(),url,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:'Uncommitted integrated overnight candidate; hashes identify the exact captured runtime.',runtimeSHA256:readHashes(),method:'Visible mouse controls, real deterministic mission, browser video. Read-only state assertions. Editorial captions and trimmed holds; no fabricated UI, resource values or outcomes.',shots:[],actions:[],errors:[],failedAssets:[]};
const ffmpeg='/opt/homebrew/bin/ffmpeg',ffprobe='/opt/homebrew/bin/ffprobe';
let browser,context,page,videoStart,videoPath;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function activate(type,value){const selector=`#blackoutPanel [data-blackout-action="${type}"]`+(value?`[data-value="${value}"]`:'');await page.locator(selector).click();manifest.actions.push({type,value,state:await page.evaluate(()=>{const v=Blackout.view();return {stage:v.stage,day:v.day};})});await sleep(350);}
async function shot(id,duration,title,caption){
 await sleep(1000);
 const start=(Date.now()-videoStart)/1000;
 const state=await page.evaluate(()=>Blackout.view());
 assert(await page.locator('#blackoutArtCredit').isVisible(),'AI artwork disclosure must remain visible');
 await page.screenshot({path:path.join(out,id+'.png')});
 manifest.shots.push({id,start,duration,title,caption,state:{stage:state.stage,day:state.day,preparation:state.preparation,comms:state.comms,firstOutcome:state.firstOutcome,alternateOutcome:state.alternateOutcome,comparison:state.comparison}});
 await sleep((duration+1)*1000);
}
function encode(){
 const font=path.resolve('game/assets/fonts/BarlowCondensed-SemiBold.ttf');
 for(const s of manifest.shots){
  const titleFile=path.join(raw,s.id+'-title.txt'),captionFile=path.join(raw,s.id+'-caption.txt');
  fs.writeFileSync(titleFile,s.title);fs.writeFileSync(captionFile,s.caption);
  const filter=`scale=1728:972,pad=1920:1080:96:0:color=0x09151e,drawtext=fontfile='${font}':textfile='${titleFile}':fontsize=28:fontcolor=0xd8eef4:x=96:y=988,drawtext=fontfile='${font}':textfile='${captionFile}':fontsize=25:fontcolor=0xa9bdca:x=96:y=1024,drawtext=fontfile='${font}':text='Actual gameplay | AI-generated artwork visible':fontsize=17:fontcolor=0x91a5b1:x=w-tw-96:y=1055`;
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(s.start+.15),'-i',videoPath,'-t',String(s.duration),'-an','-vf',filter,'-r','25','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p',path.join(raw,s.id+'.mp4')],{stdio:'inherit'});
 }
 const concat=path.join(raw,'concat.txt');fs.writeFileSync(concat,manifest.shots.map(s=>`file '${path.join(raw,s.id+'.mp4')}'`).join('\n'));
 const target=path.join(publicOut,'blackout-demo.mp4');
 execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart','-metadata','title=DEAD RECKONING: BLACKOUT — actual game demo','-metadata','comment=Actual browser gameplay; edited with AI assistance; includes visibly labelled AI-generated artwork. No narration, music, real children, or added NASA logos.',target],{stdio:'inherit'});
 const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',target],{encoding:'utf8'}));
 assert(Number(probe.format.duration)<=30,'Demo must not exceed 30 seconds');assert(Number(probe.format.duration)>=28,'All planned shots must be present');
 manifest.video=probe;manifest.output=path.relative(process.cwd(),target);manifest.finalRuntimeSHA256=readHashes();
 manifest.runtimeChangedDuringCapture=Object.keys(manifest.runtimeSHA256).filter(f=>manifest.runtimeSHA256[f]!==manifest.finalRuntimeSHA256[f]);
 fs.writeFileSync(path.join(out,'capture-manifest.json'),JSON.stringify(manifest,null,2));
 fs.writeFileSync(path.join(publicOut,'manifest.json'),JSON.stringify({title:'DEAD RECKONING: BLACKOUT',durationSeconds:Number(probe.format.duration),capturedAt:manifest.capturedAt,commit:manifest.commit,workingTree:manifest.workingTree,runtimeSHA256:manifest.runtimeSHA256,runtimeChangedDuringCapture:manifest.runtimeChangedDuringCapture,method:manifest.method,video:probe,disclosure:'Actual browser gameplay, edited with AI assistance. Includes visibly labelled AI-generated artwork. No narration, music, real children or added NASA logos.'},null,2));
 console.log(JSON.stringify({file:target,duration:probe.format.duration,bytes:probe.format.size,shots:manifest.shots.length,errors:manifest.errors,failedAssets:manifest.failedAssets,runtimeChanged:manifest.runtimeChangedDuringCapture},null,2));
}
(async()=>{try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 context=await browser.newContext({viewport:{width:1600,height:900},recordVideo:{dir:raw,size:{width:1600,height:900}}});
 videoStart=Date.now();page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>manifest.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon.ico'))manifest.failedAssets.push({url:r.url(),status:r.status()});});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.getByRole('button',{name:'Begin mission',exact:true}).waitFor();
 await page.locator('#aresMissionCode').fill('DRB1-20261114-0');await page.getByRole('button',{name:'Begin mission',exact:true}).click();
 await page.waitForFunction(()=>window.Blackout?.isActive()&&!modalOpen&&window.AresWorld?.pending===0,null,{timeout:90000});await sleep(2500);
 await shot('01-predict',3,'DEAD RECKONING: BLACKOUT','A playable Mars mission: predict what will keep six crew safe.');
 await activate('predict','store');
 await shot('02-prepare',4,'A FINITE BUDGET. A REAL CHOICE.','Store spare energy in a battery, align solar arrays, or save the Parts.');
 await activate('prepare','battery');await activate('predictField','shelter');await activate('observe','open');await activate('observe','shelter');await activate('shelter','shelter');await activate('request');
 while((await page.evaluate(()=>Blackout.view())).day<4)await activate('next');
 assert.equal((await page.evaluate(()=>Blackout.view())).comms.status,'blackout');
 await shot('03-blackout',4,'EARTH IS QUIET. YOUR COLONY KEEPS WORKING.','Radio delay and dust affect different systems. Compressed training time.');
 while((await page.evaluate(()=>Blackout.view())).stage==='running')await activate('next');
 let v=await page.evaluate(()=>Blackout.view());assert.equal(v.stage,'outcome');assert(v.firstOutcome.safe,'Battery plan must complete safely');
 await page.locator('.blackout-outcome').first().scrollIntoViewIfNeeded();
 await shot('04-outcome',4,'YOUR FIRST RESULT IS PRESERVED.','Actual mission reserves show what the battery preparation changed.');
 await activate('compare','align');
 for(let n=0;n<24&&(await page.evaluate(()=>Blackout.view())).stage==='compare';n++)await activate('next');
 v=await page.evaluate(()=>Blackout.view());assert.equal(v.stage,'explain');assert(v.comparison.sameStart&&v.comparison.sameEvents,'Branches must share starting state and events');assert(v.alternateOutcome);
 await page.locator('.blackout-futures').scrollIntoViewIfNeeded();
 await shot('05-two-futures',6,'ONE MISSION. TWO FUTURES.','Replay the same colony and events with solar alignment. Compare the evidence.');
 await page.locator('.blackout-sources > summary').click();await page.locator('.blackout-sources article').first().scrollIntoViewIfNeeded();
 await shot('06-nasa-evidence',4,'NASA EVIDENCE. CLEAR MODEL LIMITS.','Historical records inform the mission; the game labels its simplified rules.');
 await activate('explain','stored-energy');await activate('transfer','reserve');
 v=await page.evaluate(()=>Blackout.view());assert.equal(v.stage,'complete');assert(v.learning.explanation.correct&&v.learning.transfer.correct);
 await page.locator('.blackout-record').scrollIntoViewIfNeeded();
 await shot('07-learning',4,'PREDICT. OBSERVE. COMPARE. EXPLAIN.','An anonymous learning record turns play into a science discussion.');
 const pending=page.waitForEvent('download');await page.locator('[data-blackout-ui="export"]').click();await(await pending).saveAs(path.join(out,'captured-learning-record.json'));
 manifest.completedAt=new Date().toISOString();assert.equal(manifest.errors.length,0);assert.equal(manifest.failedAssets.length,0);videoPath=await page.video().path();await context.close();context=null;await browser.close();browser=null;encode();
 }catch(e){manifest.failure={message:e.message,stack:e.stack};fs.writeFileSync(path.join(out,'capture-failure.json'),JSON.stringify(manifest,null,2));console.error(e);process.exitCode=1;}finally{await context?.close();await browser?.close();}})();
