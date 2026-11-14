/* Real-control BLACKOUT playtests. State is read for assertions, never advanced by test code. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const arg=process.argv.indexOf('--url');
const url=(arg>=0&&process.argv[arg+1])||process.env.GAME_URL||'http://127.0.0.1:8765/';
const prefix=(process.env.BLACKOUT_TEST_PREFIX||'blackout-ui').replace(/[^a-z0-9_-]/gi,'-');
const out=path.resolve('dist/verification');fs.mkdirSync(out,{recursive:true});
const offline=url.startsWith('file:'),documentUrl=new URL(url).href;
const artifact=offline?(()=>{const file=require('node:url').fileURLToPath(documentUrl),data=fs.readFileSync(file);return {file,bytes:data.length,sha256:require('node:crypto').createHash('sha256').update(data).digest('hex')};})():null;
const report={url,artifact,network:offline?'offline':'online',startedAt:new Date().toISOString(),method:'Visible buttons, pointer and keyboard. Read-only state assertions. Automated testing is not child-learning validation.',runs:[],checks:[],failures:[]};
let browser,currentPage,currentRun;
const check=(condition,message)=>{assert(condition,message);report.checks.push(message);};
const selector=(action,value)=>`#blackoutPanel [data-blackout-action="${action}"]`+(value?`[data-value="${value}"]`:'');
async function keyClick(page,targetSelector){
 const target=page.locator(targetSelector);await target.waitFor({state:'visible'});let tabs=0;
 while(!(await target.evaluate(el=>el===document.activeElement))&&tabs++<100)await page.keyboard.press('Tab');
 assert(tabs<=100,`Keyboard could not reach ${targetSelector}`);await page.keyboard.press('Enter');
}
async function activate(page,a,value,keyboard){if(keyboard)await keyClick(page,selector(a,value));else await page.locator(selector(a,value)).click();}
async function screenshot(page,name){await page.screenshot({path:path.join(out,`${prefix}-${name}.png`)});}
async function play(config){
 const page=await browser.newPage({viewport:config.viewport});currentPage=page;page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(offline?120000:60000);
 const run={name:config.name,viewport:config.viewport,input:config.keyboard?'keyboard':'pointer',trace:[],errors:[],failedAssets:[],externalRequests:[],separateFileRequests:[],completed:false};report.runs.push(run);currentRun=run;
 page.on('pageerror',e=>run.errors.push(e.message));page.on('response',response=>{if(response.status()>=400&&!response.url().includes('favicon.ico'))run.failedAssets.push({url:response.url(),status:response.status()});});
 page.on('request',request=>{const requestUrl=request.url();if(/^https?:/i.test(requestUrl))run.externalRequests.push(requestUrl);if(requestUrl.startsWith('file:')&&requestUrl!==documentUrl)run.separateFileRequests.push(requestUrl);});
 if(config.recovery)await page.addInitScript(()=>{window.__blackoutAudioCues=[];document.addEventListener('blackout:audio',event=>window.__blackoutAudioCues.push(event.detail.kind));});
 if(process.env.ARES_LOW==='1')await page.addInitScript(()=>localStorage.setItem('marsq','low'));
 if(offline){await page.context().setOffline(true);await page.route(/^https?:/,route=>route.abort());}
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.getByRole('button',{name:'Begin mission',exact:true}).waitFor();
 if(config.keyboard){await page.locator('#aresMissionCode').fill('INVALID');await keyClick(page,'#modal .btns button:first-child');await page.getByRole('alert').waitFor();check((await page.getByRole('alert').innerText()).includes('mission code'),'Invalid mission code gives a recoverable explanation');await page.locator('#aresMissionCode').fill('DRB1-20261114-0');}
 if(config.keyboard)await keyClick(page,'#modal .btns button:first-child');else await page.getByRole('button',{name:'Begin mission',exact:true}).click();
 await page.waitForFunction(()=>Blackout.isActive()&&!modalOpen&&window.BlackoutUI&&AresWorld.pending===0,null,{timeout:90000});
 check(await page.locator('#blackoutPanel').isVisible(),config.name+': mission is visible');await screenshot(page,config.name+'-start');
 if(config.recovery){await page.locator('#aresSettings').click();await page.locator('#soundSetting').check();await page.locator('[data-blackout-tab="mission"]').click();}
 let saved=false,retried=false,n=0;
 while(n++<65){
  const v=await page.evaluate(()=>Blackout.view());run.trace.push({stage:v.stage,day:v.day,resources:v.resources,preparation:v.preparation,error:v.error});
  if(v.stage==='complete')break;
  if(config.savePending&&!saved&&v.stage==='running'&&v.day===2){
   const before=v.comms;await page.locator('#aresSettings').click();await page.locator('#saveMission').click();await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue saved mission',exact:true}).last().click();await page.waitForFunction(()=>Blackout.isActive()&&!modalOpen);
   const restored=await page.evaluate(()=>Blackout.view());assert.deepEqual(restored.comms,before,'Pending Earth reply survives save/reload');check(restored.day===2,'Save/continue preserves mission day');saved=true;continue;
  }
  let action,value;
  if(v.stage==='prediction'){action='predict';value=config.preparation==='align'?'generate':'store';}
  else if(v.stage==='preparation'){action='prepare';value=config.recovery&&!retried?'wait':retried?'battery':config.preparation;}
  else if(v.stage==='field'){
   if(!v.field.prediction){action='predictField';value=config.keyboard?'open':'shelter';}
   else if(v.field.readings.length<2){action='observe';value=v.field.readings.some(r=>r.condition==='open')?'shelter':'open';}
   else {action='shelter';value=config.recovery&&!retried?'ship':'shelter';check((await page.locator('.blackout-field-feedback').innerText()).includes(config.keyboard?'opposite':'matches'),'Field prediction receives evidence feedback');}
  }else if(v.stage==='request')action='request';
  else if(v.stage==='running')action=config.clean&&v.choices.some(c=>c.action==='clean')?'clean':'next';
  else if(v.stage==='outcome'){
   if(config.recovery&&!retried){check(!!v.firstOutcome.recovery,'Poor choice causes an explained recoverable setback');check(await page.evaluate(()=>window.__blackoutAudioCues.includes('warning')),'Shortage outcome starts the authored warning cue');action='retry';retried=true;}
   else {check(v.firstOutcome.safe,config.name+': preparation completes safely');action='compare';value=v.firstOutcome.preparation==='battery'?'align':'battery';}
  }else if(v.stage==='compare')action='next';
  else if(v.stage==='explain'){check(await page.locator('.blackout-cause').count()===0,'Causal answer is hidden until the player explains');action='explain';value='stored-energy';}
  else if(v.stage==='transfer'){check(await page.locator('.blackout-cause').count()===1,'Causal explanation appears after the answer');action='transfer';value='reserve';}
  else throw Error('Unknown mission stage '+v.stage);
  run.trace[run.trace.length-1].action={type:action,value};await activate(page,action,value,config.keyboard);
  if(action==='retry')check(await page.evaluate(()=>window.__blackoutAudioCues.includes('recovery')&&BlackoutAudio.state.enabled&&BlackoutAudio.state.contextState==='running'),'Actual retry starts the authored recovery cue');
 }
 const v=await page.evaluate(()=>Blackout.view());check(v.stage==='complete',config.name+': reaches comparison and learning ending within turn limit');check(v.firstOutcome.safe,config.name+': final learning run preserves crew');check(!!v.comparison&&v.comparison.sameStart&&v.comparison.sameEvents,config.name+': alternate branch shares start and event tape');
 check(v.learning.explanation?.correct&&v.learning.transfer?.correct,config.name+': recorded explanation and transfer are correct');
 if(config.recovery)check(v.firstAttempt?.safe===false&&v.firstOutcome.safe&&v.attemptKind==='practice','Recovery preserves the original first-attempt setback');
 const downloadable=page.waitForEvent('download');if(config.keyboard)await keyClick(page,'[data-blackout-ui="export"]');else await page.locator('[data-blackout-ui="export"]').click();
 const downloaded=await downloadable,recordPath=path.join(out,`${prefix}-${config.name}-record.json`);await downloaded.saveAs(recordPath);const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));check(record.format==='dead-reckoning-learning-record'&&record.code===v.code,config.name+': exports actual anonymous mission record');
 // Replace only the browser print dialog; mission progression still uses visible controls.
 await page.evaluate(()=>{window.print=()=>{document.documentElement.dataset.printRequested='true';};});
 if(config.keyboard)await keyClick(page,'[data-blackout-ui="print"]');else await page.locator('[data-blackout-ui="print"]').click();
 const printed=await page.locator('#blackoutPrint').textContent();check(printed.includes('A battery keeps spare energy for later.')&&printed.includes('Check spare power and reserves.')&&!printed.includes('stored-energy')&&!printed.includes('[object Object]'),config.name+': printable evidence card uses readable answers');
 check(await page.evaluate(()=>document.documentElement.dataset.printRequested==='true'),config.name+': learning card requests the print dialog');
 await page.emulateMedia({media:'print'});check(await page.evaluate(()=>getComputedStyle(document.body).overflow==='visible'&&getComputedStyle(document.getElementById('blackoutPrint')).display==='block'),config.name+': print layout allows the full record to paginate');
 if(config.name==='desktop-battery')await page.pdf({path:path.join(out,`${prefix}-learning-card.pdf`),preferCSSPageSize:true});
 await page.emulateMedia({media:'screen'});
 await screenshot(page,config.name+'-complete');
 await page.locator('[data-blackout-tab="systems"]').click();for(const system of ['air','water','power']){await page.locator(`[data-blackout-system="${system}"]`).click();check(await page.locator(`.blackout-system[data-system="${system}"]`).count()===1,config.name+': inspect actual '+system+' system');}
 const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,rect:document.getElementById('blackoutPanel').getBoundingClientRect().toJSON()}));check(geometry.scrollWidth<=geometry.width+1,config.name+': no horizontal page overflow');check(geometry.rect.top>=0&&geometry.rect.bottom<=config.viewport.height,config.name+': mission panel stays within viewport');
 await page.locator('#aresSettings').click();await page.locator('#teacherKit').click();const teacherFrame=page.frameLocator('iframe[title="Teacher and playtest kit"]');await teacherFrame.locator('h1').waitFor();
 check((await teacherFrame.locator('h1').innerText()).includes('Two futures. A reason why.'),config.name+': teacher kit opens from its visible settings button');
 check((await teacherFrame.locator('header').innerText()).includes('Child pilot not yet conducted.'),config.name+': teacher materials distinguish pending child pilot from automated tests');
 if(offline)check((await page.locator('iframe[title="Teacher and playtest kit"]').getAttribute('src')).startsWith('data:text/html'),config.name+': teacher kit is embedded in the offline document');
 await page.getByRole('button',{name:'Back to my colony',exact:true}).click();check(await page.evaluate(()=>S.sol)===v.day,config.name+': reading the teacher kit does not advance mission time');await page.locator('[data-blackout-tab="mission"]').click();
 if(config.keyboard){
  await page.locator('#aresSettings').click();await page.locator('#soundSetting').check();let audio=await page.evaluate(()=>BlackoutAudio.state);check(audio.enabled&&audio.started,'Visible sound setting enables local gesture-started audio');await page.locator('#motionSetting').check();await page.locator('#contrastSetting').check();await page.locator('#textSetting').selectOption('20');
  await page.locator('[data-blackout-tab="mission"]').click();check(await page.locator('#blackoutPanel .blackout-lead').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=20,'Largest text changes the visible mission copy');await page.locator('#aresSettings').click();
  for(const theme of ['flight','expedition','deep','frontier','horizon']){await page.locator(`[data-ui-theme-choice="${theme}"]`).click();check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)===theme,'Theme '+theme+' works through visible controls');}
  await page.locator('[data-ui-theme-choice="flight"]').click();await page.locator('#soundSetting').uncheck();check(!(await page.evaluate(()=>BlackoutAudio.state.enabled)),'Master mute disables mission audio');await page.locator('#saveMission').click();await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue saved mission',exact:true}).last().click();await page.waitForFunction(()=>Blackout.isActive()&&Blackout.view().stage==='complete');check(await page.evaluate(()=>document.body.classList.contains('reduce-motion')&&document.body.classList.contains('high-contrast')),'Accessibility preferences persist');check(await page.locator('#blackoutPanel .blackout-lead').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=20,'Largest text persists after reload');check(!(await page.evaluate(()=>BlackoutAudio.state.enabled)),'Mute persists after reload');
 }
 if(offline){check(run.externalRequests.length===0,config.name+': no attempted HTTP requests while offline');check(run.separateFileRequests.length===0,config.name+': no separate asset files requested');}
 check(run.errors.length===0,config.name+': no uncaught JavaScript errors');check(run.failedAssets.length===0,config.name+': no failed required assets');run.completed=true;run.outcome={first:v.firstOutcome,alternate:v.alternateOutcome,comparison:v.comparison,learning:v.learning,attemptKind:v.attemptKind};run.geometry=geometry;await page.close();currentPage=null;
}
(async()=>{try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const configurations=[{name:'desktop-battery',viewport:{width:1440,height:900},preparation:'battery',savePending:true},{name:'phone-battery',viewport:{width:390,height:844},preparation:'battery'},{name:'keyboard-alignment',viewport:{width:1280,height:720},preparation:'align',clean:true,keyboard:true},{name:'setback-recovery',viewport:{width:1366,height:768},preparation:'wait',recovery:true}];
 const selected=(process.env.BLACKOUT_TEST_RUNS||'').split(',').filter(Boolean);
 const runs=selected.length?configurations.filter(c=>selected.includes(c.name)):configurations;
 assert(runs.length,'BLACKOUT_TEST_RUNS must select a known route');for(const config of runs)await play(config);
 report.completedAt=new Date().toISOString();console.log(JSON.stringify({completedRuns:report.runs.filter(r=>r.completed).length,routes:report.runs.map(r=>({name:r.name,states:r.trace.length,completed:r.completed})),checks:report.checks.length,failures:report.failures},null,2));
}catch(error){report.failures.push({message:error.message,stack:error.stack,run:currentRun?.name});if(currentPage){await screenshot(currentPage,'failure').catch(()=>{});report.failureState=await currentPage.evaluate(()=>window.Blackout?.view()).catch(()=>null);}console.error(error);process.exitCode=1;
}finally{fs.writeFileSync(path.join(out,`${prefix}.json`),JSON.stringify(report,null,2));await browser?.close();}})();
