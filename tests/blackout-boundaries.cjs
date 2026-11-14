/* A real-control regression for a previously unlogged resource mutation. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const output=path.resolve('dist/verification');fs.mkdirSync(output,{recursive:true});
 try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');
  await page.getByRole('button',{name:'Begin mission',exact:true}).click();
  await page.waitForFunction(()=>Blackout.isActive()&&AresWorld.pending===0);
  const choice=(action,value)=>page.locator(`#blackoutPanel [data-blackout-action="${action}"][data-value="${value}"]`);
  await choice('predict','store').click();await choice('prepare','battery').click();
  const baseline=await page.evaluate(()=>({air:S.o2,parts:S.parts,actions:JSON.stringify(S.blackout.actions)}));
  await page.locator('#camctl [data-a="walk"]').click();
  await page.waitForFunction(()=>!!R3.fp);
  await page.getByRole('button',{name:'Space weather',exact:true}).click();
  assert(await page.locator('#sampleRock').isDisabled(),'Unlogged sampling is unavailable in the short comparison mission');
  assert.match(await page.locator('#sampleStatus').innerText(),/dosimeter|both futures/i);
  assert.deepEqual(await page.evaluate(()=>({air:S.o2,parts:S.parts,actions:JSON.stringify(S.blackout.actions)})),baseline,'Opening the evidence panel changes no resources or decisions');
  // Defence at the action boundary too, in case another UI still calls it.
  await page.locator('#sampleRock').evaluate(el=>el.onclick());
  assert.deepEqual(await page.evaluate(()=>({air:S.o2,parts:S.parts,actions:JSON.stringify(S.blackout.actions)})),baseline,'Sampling handler cannot bypass mission guard');
  await page.getByRole('button',{name:'Close space weather',exact:true}).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>!!R3.fp),false,'Escape exits the surface view');
  assert.equal(await page.locator('#camctl [data-a="walk"]').innerText(),'Walk on Mars');
  assert.deepEqual(errors,[]);
  const result={passed:true,checks:7,route:'Begin → predict → prepare → Walk → Space weather → sample guard → Escape',defects:['B05','B06'],errors};
  fs.writeFileSync(path.join(output,'blackout-boundaries.json'),JSON.stringify(result,null,2));console.log(result);
 }catch(error){await page.screenshot({path:path.join(output,'blackout-boundaries-failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
