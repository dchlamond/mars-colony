const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let releaseLegacy;
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    if(process.env.ARES_LOW==='1')await page.addInitScript(()=>localStorage.setItem('marsq','low'));
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|GL_INVALID/i.test(m.text()))errors.push(m.text());});
    // Reproduce the real race: a slow legacy NASA script must not overwrite the
    // authored rover after the newer GLB has already loaded.
    const legacyGate=new Promise(resolve=>{releaseLegacy=resolve;});
    let delayedLegacy=false;
    await page.route('**/assets/model_perseverance.js',async route=>{delayedLegacy=true;await legacyGate;await route.continue();});
    await page.goto((process.argv[2]||'http://127.0.0.1:8765')+'/?mode=commander',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.AresRender&&AresWorld.ready&&AresWorld.pending===0&&R3.models.habitat&&R3.models.insight&&R3.models.astronaut,null,{timeout:120000});
    const authoredRover=await page.evaluate(()=>{
      const original=THREE.GLTFLoader.prototype.parse;
      THREE.GLTFLoader.prototype.parse=function(data,path,onLoad,onError){return original.call(this,data,path,result=>{try{onLoad(result);}finally{window.__legacyRoverCompleted=true;THREE.GLTFLoader.prototype.parse=original;}},onError);};
      return R3.models.perseverance.uuid;
    });
    releaseLegacy();
    await page.waitForFunction(()=>window.__legacyRoverCompleted,null,{timeout:120000});
    assert(delayedLegacy,'legacy rover load was deliberately delayed');
    assert.equal(await page.evaluate(()=>R3.models.perseverance.uuid),authoredRover,'late legacy callback preserves the authored rover');
    const results=await page.evaluate(()=>{
      let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
      check(AresWorld.errors.length===0,'all authored assets load');
      const types=['pod','solar','moxie','green','ice','shield','habitat','battery','mine','dome','reactor'];
      check(types.every(type=>AresWorld.assets[type]),'all eleven building types have authored GLB sources');
      check(AresWorld.terrain==='Blender MOLA mesh'&&AresWorld.terrainVertices>10000,'Blender terrain replaces the default map geometry');
      const terrain=R3.map.geometry;terrain.computeBoundingBox();const bounds=terrain.boundingBox;
      check(Math.abs(bounds.min.x-X0)<.001&&Math.abs(bounds.max.x-(X0+PW))<.001&&Math.abs(bounds.min.z-Z0)<.001&&Math.abs(bounds.max.z-(Z0+PH))<.001,'authored terrain covers the real map coordinates');
      check(bounds.max.y-bounds.min.y>1&&Number.isFinite(bounds.max.y),'terrain has finite relief, not an empty flat mesh');
      const uv=terrain.attributes.uv,positions=terrain.attributes.position;let uMin=1,uMax=0,vMin=1,vMax=0,finiteUV=true;
      for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);finiteUV=finiteUV&&Number.isFinite(u)&&Number.isFinite(v);uMin=Math.min(uMin,u);uMax=Math.max(uMax,u);vMin=Math.min(vMin,v);vMax=Math.max(vMax,v);}
      check(finiteUV,'all terrain UV coordinates are finite');
      check(uMin>=-.001&&uMin<.001&&uMax>.999&&uMax<=1.001&&vMin>=-.001&&vMin<.001&&vMax>.999&&vMax<=1.001,'terrain carries full equirectangular UV coverage');
      for(const i of [0,Math.floor(positions.count/3),Math.floor(positions.count/2),positions.count-1])check(Math.abs(positions.getY(i)-groundY(positions.getX(i),positions.getZ(i)))<.005,'rendered terrain samples match the gameplay height function');
      check(R3.patch.material.map.image?.width>0,'asynchronously loaded Grok texture reaches the first-person texture clone');
      check(R3.rocks.userData.blenderRock,'surface rocks use authored Blender geometry');
      modalQ=[];modalOpen=false;$('overlay').style.display='none';setSpeed(0);
      check(S.builds[0].astro?.visible,'Commander retains a visible representative at the pod');
      const originalPopulation=S.pop;S.pop=0;syncScene();check(!S.builds[0].astro.visible,'no representative when population is zero');S.pop=originalPopulation;syncScene();
      const metrics=types.map(type=>{
        const g=new THREE.Group();fillBuilding(g,type);let meshes=0,triangles=0;g.traverse(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;}});
        const box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3());
        check(Number.isFinite(size.length())&&size.x>0&&size.z>0&&Math.max(size.x,size.z)<2.1,type+' fits one colony tile');
        check(box.min.y>=-.08,type+' pivot keeps it above ground');check(meshes<=10,type+' uses bounded material batches');
        return {type,meshes,triangles,bounds:size.toArray()};
      });
      if(!HQ)check(metrics.find(m=>m.type==='habitat').triangles<10000,'Low uses the lighter authored habitat');
      const one=new THREE.Group(),two=new THREE.Group();fillBuilding(one,'habitat');fillBuilding(two,'habitat');ghost(one,true);const mats=[];two.traverse(n=>{if(n.isMesh)mats.push(n.material.opacity)});check(mats.every(n=>n===1),'construction opacity cannot leak into another building');
      S.parts=1000;S.metal=1000;const t=S.tiles.find(t=>t.seen&&!t.build&&t.type!=='rock'&&!t.owner);check(!tryBuild('solar',t),'Commander solar construction starts');syncScene();
      check(badgeFor(t.build)==='Building 0%','Commander construction badge renders without scope errors');
      check(badgeFor({type:'moxie',done:false,progress:4})==='Building 33%','Commander construction percentage uses its twelve-work requirement');
      t.build.done=true;hover=t;showTip({clientX:400,clientY:300});check($('tip').textContent.includes(DEF.solar.line)&&!$('tip').textContent.includes('[object Object]'),'Commander completed-building tooltip shows its actual benefit');t.build.done=false;hover=null;showTip({clientX:400,clientY:300});
      const worker=t.build.astro;check(worker?.userData.authoredSuit,'Commander uses the Blender pressure suit');
      check(worker.userData.joints.length===4&&worker.userData.elbows.length===2&&worker.userData.knees.length===2,'suit has shoulders, hips, elbows and knees');
      worker.userData.clock=-((t.c+t.r)%7)+.2;setSpeed(1);animateWorkers(.1);const position=worker.position.clone();animateWorkers(.1);check(worker.position.distanceTo(position)>0,'Commander worker travels to its job');
      setSpeed(0);const clock=worker.userData.clock;animateWorkers(.2);check(clock===worker.userData.clock,'Commander pause freezes animation time');
      document.body.classList.add('reduce-motion');setSpeed(1);animateWorkers(.2);check(clock===worker.userData.clock,'reduced motion freezes Commander animation');document.body.classList.remove('reduce-motion');setSpeed(0);
      Junior.start('junior',0,20261114);render();
      const actors=()=>[...AresRender.actors.values()],visible=()=>actors().filter(a=>a.visible).length;
      check(actors().length===6&&visible()===6,'Junior renders exactly the six-person starting roster');
      check(S.builds.every(b=>!b.astro?.visible),'legacy building figures do not duplicate Junior people');
      check(actors().every(a=>a.userData.authoredSuit),'every Junior figure uses the authored suit');
      const buildTile=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock');check(!tryBuild('solar',buildTile),'Junior construction starts');render();
      check(badgeFor(buildTile.build)==='Building 0%','Junior construction badge renders without scope errors');
      check(badgeFor({type:'moxie',done:false,progress:4})==='Building 50%','Junior construction percentage uses its eight-work requirement');
      buildTile.build.done=true;hover=buildTile;showTip({clientX:400,clientY:300});check($('tip').textContent.includes(Junior.info('solar').benefit)&&!$('tip').textContent.includes('[object Object]'),'Junior completed-building tooltip shows the benefit string');buildTile.build.done=false;hover=null;showTip({clientX:400,clientY:300});
      check(actors().filter(a=>a.userData.person.role==='builder').length===2,'visual builders match the two actual allocated people');
      const builder=actors().find(a=>a.userData.person.role==='builder');builder.userData.clock=0;Junior.animationUntil=performance.now()+10000;animateWorkers(.1);const first=builder.position.clone();animateWorkers(.1);check(builder.position.distanceTo(first)>0,'Junior builder travels during the next-day animation window');
      Junior.animationUntil=0;const paused=builder.userData.clock,pausedPosition=builder.position.clone();animateWorkers(.2);check(builder.userData.clock===paused&&builder.position.distanceTo(pausedPosition)<1e-8,'Junior pause freezes actor time and position');
      document.body.classList.add('reduce-motion');Junior.animationUntil=performance.now()+10000;animateWorkers(.2);check(builder.userData.clock===paused,'reduced motion freezes Junior actor time');document.body.classList.remove('reduce-motion');Junior.animationUntil=0;
      cancel(buildTile.build);S.unlocked.rover=true;const destination=S.tiles.find(t=>!t.owner&&hdist(t,S.builds[0])===4);check(!tryBuild('rover',destination),'two free explorers can depart');render();
      check(visible()===4&&actors().filter(a=>a.userData.person.role==='explorer').length===2,'away explorers do not remain visible at home');
      Strategy.saveMission();Junior.start('junior',1,20261115);render();check(actors().length===6&&visible()===6,'new mission clears the previous roster actors');
      Strategy.loadMission();render();check(actors().length===6&&visible()===4&&S.rover?.crew===2,'restored mission regenerates exact visible and away crew');
      S.storm={active:true};render();check(visible()===0,'sheltered crew and away explorers are not shown working');
      S.storm=null;S.pop=0;S.rover=null;render();check(actors().length===0,'zero-population state clears all roster figures');
      Junior.start('commander',0,20261116);render();check(AresRender.actors.size===0,'switching to Commander removes Junior actors');
      check(R3.map.geometry===terrain,'new missions preserve the authored terrain');
      return {checks,assets:Object.keys(AresWorld.assets).sort(),metrics,quality:QUAL,terrain:{vertices:positions.count,bounds:bounds.getSize(new THREE.Vector3()).toArray(),uv:[uMin,uMax,vMin,vMax]},ground:AresWorld.surface,crewLifecycle:'start, build, pause, rover, new mission, save/restore, shelter, zero population, Commander'};
    });
    await page.waitForTimeout(200);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,delayedLegacyPreserved:true,...results,errors},null,2));
  } finally {releaseLegacy?.();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
