const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../../overnight/evidence/art');
fs.mkdirSync(out,{recursive:true});
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|GL_INVALID/i.test(m.text()))errors.push(m.text());});
 if(process.env.ARES_LOW==='1')await page.addInitScript(()=>localStorage.setItem('marsq','low'));
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8765')+'/?mode=commander');
 await page.waitForFunction(()=>window.AresRender&&AresWorld.pending===0&&AresWorld.serviceKit===4,null,{timeout:120000});
 const result=await page.evaluate(()=>{
  let checks=0;const check=(ok,message)=>{if(!ok)throw Error(message);checks++;};
  // Explicit art/state fixture, not claimed as an actual-control playthrough.
  modalQ=[];modalOpen=false;$('overlay').style.display='none';Junior.start('junior',0,20261114);
  S.parts=1000;const pod=S.builds[0];
  const build=(type,done=true)=>{S.unlocked[type]=true;const tile=S.tiles.filter(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock').sort((a,b)=>hdist(a,pod)-hdist(b,pod))[0];const error=tryBuild(type,tile);check(!error,'fixture '+type+': '+error);tile.build.done=done;tile.build.age=5;return tile.build;};
  const solar=[build('solar'),build('solar'),build('solar')],oxygen=[build('moxie'),build('moxie')],water=build('ice'),green=build('green');build('shield');build('battery',false);render();
  for(const actor of AresRender.actors.values())actor.userData.clock=8;animateWorkers(0);R3.dist=16;render();
  check(AresRender.serviceBuildings.size===S.builds.length,'one visual service record per actual building');
  const station=b=>AresRender.serviceBuildings.get(b.c+','+b.r);
  check(station(water).running&&station(water).witness,'water station includes original authored witness');
  check(station(water).deviceLights.every(m=>m.emissiveIntensity>0),'working water indicators lit');
  check(station(green).running,'greenhouse operational with actual crew and power');
  check(AresRender.routeSegments>0,'colony has generated surface-following tracks');
  const route=AresRender.routes.children[0].geometry.attributes.position;
  for(let i=0;i<route.count;i+=Math.max(1,Math.floor(route.count/12)))check(Math.abs(route.getY(i)-surfaceY(route.getX(i),route.getZ(i))-.022)<.002,'path follows rendered terrain');
  check([...AresRender.actors.values()].some(a=>a.userData.tablet?.visible),'operators use authored inspection tablets');
  check([...AresRender.actors.values()].filter(a=>a.visible).length===S.pop,'visual actors still match actual population');
  for(const actor of AresRender.actors.values())for(const point of actor.userData.path||[])check(!walkBlocked(point.x,point.z),'crew route avoids physical building footprints');
  const before=S.builds.filter(b=>b.type==='solar').map(b=>station(b).solar[0]?.material.color.getHex());
  S.panelClean=.5;render();check(solar.some((b,i)=>station(b).solar[0]?.material.color.getHex()!==before[i]),'dust visibly changes array material');
  S.panelClean=1;solar.forEach(b=>b.on=false);S.battery=0;render();for(const a of AresRender.actors.values())a.userData.clock=8;animateWorkers(0);
  check(!station(water).running&&station(water).reason==='no power','water reflects actual power loss');
  check(station(water).deviceLights.every(m=>m.emissiveIntensity===0),'stalled pump indicators are dark');
  check(station(green).lights.every(m=>m.emissiveIntensity===0),'unpowered greenhouse interior is dark');
  check([...AresRender.actors.values()].filter(a=>a.userData.person.role==='operator').every(a=>!a.userData.tablet?.visible),'operators stop inspection gestures for unpowered machinery');
  solar.forEach(b=>b.on=true);render();for(const a of AresRender.actors.values())a.userData.clock=8;animateWorkers(0);
  const positions=[...AresRender.actors.values()].map(a=>a.position.toArray());const clock=[...AresRender.actors.values()].map(a=>a.userData.clock);Junior.animationUntil=0;animateWorkers(.2);
  check([...AresRender.actors.values()].every((a,i)=>a.userData.clock===clock[i]&&a.position.distanceTo(new THREE.Vector3(...positions[i]))<1e-8),'ambient detail preserves paused travel clock and position');
  return{checks,quality:QUAL,serviceAssets:AresWorld.serviceKit,routeSegments:AresRender.routeSegments,actors:AresRender.actors.size,fixtures:'explicit visual state fixture; not a gameplay completion'};
 });
 await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'living-world-'+(process.env.ARES_LOW==='1'?'low':'high')+'.png')});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'living-world-'+result.quality+'.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors},null,2));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
