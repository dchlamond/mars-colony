const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    if(process.env.ARES_LOW==='1')await page.addInitScript(()=>localStorage.setItem('marsq','low'));
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|GL_INVALID/i.test(m.text()))errors.push(m.text());});
    await page.goto((process.argv[2]||'http://127.0.0.1:8765')+'/?mode=commander');
    await page.waitForFunction(()=>window.AresWorld?.ready&&AresWorld.pending===0);
    const results=await page.evaluate(()=>{
      const check=(v,m)=>{if(!v)throw Error(m);};
      check(AresWorld.errors.length===0,'all local GLB assets load');
      check(AresWorld.assets.habitat&&AresWorld.assets.green,'authored habitat and greenhouse available');
      modalQ=[];modalOpen=false;$('overlay').style.display='none';setSpeed(0);
      check(S.builds[0].astro?.visible,'an existing crew member is visible at the initial landing pod');
      const originalPopulation=S.pop;S.pop=0;syncScene();check(!S.builds[0].astro.visible,'no representative astronaut when the colony has no crew');S.pop=originalPopulation;syncScene();
      const types=['pod','solar','moxie','green','ice','shield','habitat','battery','mine','dome','reactor'];
      const metrics=types.map(type=>{
        const g=new THREE.Group();fillBuilding(g,type);let meshes=0,triangles=0;g.traverse(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;}});
        const box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3());
        check(Number.isFinite(size.length())&&size.x>0&&size.z>0&&Math.max(size.x,size.z)<2.1,type+' fits one colony tile');
        check(box.min.y>=-.08,type+' pivot keeps it above ground');
        check(meshes<=10,type+' uses bounded material batches');
        return {type,meshes,triangles,bounds:size.toArray()};
      });
      if(!HQ)check(metrics.find(m=>m.type==='habitat').triangles<10000,'low quality uses a lighter habitat silhouette');
      const one=new THREE.Group(),two=new THREE.Group();fillBuilding(one,'habitat');fillBuilding(two,'habitat');
      ghost(one,true);const mats=[];two.traverse(n=>{if(n.isMesh)mats.push(n.material.opacity)});check(mats.every(n=>n===1),'construction opacity cannot leak into another building');
      S.parts=1000;S.metal=1000;const t=S.tiles.find(t=>t.seen&&!t.build&&t.type!=='rock'&&!t.owner);
      check(!tryBuild('solar',t),'solar construction starts');syncScene();
      const worker=t.build.astro;check(worker?.userData.aresCrew,'new articulated pressure suit is installed');
      check(worker.userData.joints.length===4&&worker.userData.elbows.length===2,'shoulders, hips and elbows articulated');
      const shoulder=worker.userData.joints[0];check(Math.abs(shoulder.rotation.z)<.2,'relaxed shoulder instead of T pose');
      worker.userData.clock=-((t.c+t.r)%7)+.2;setSpeed(1);animateWorkers(.1);const position=worker.position.clone();animateWorkers(.1);check(worker.position.distanceTo(position)>0,'worker travels to job');
      setSpeed(0);const clock=worker.userData.clock;animateWorkers(.2);check(clock===worker.userData.clock,'pause freezes animation clock');
      document.body.classList.add('reduce-motion');setSpeed(1);animateWorkers(.2);check(clock===worker.userData.clock,'reduced motion freezes animation');document.body.classList.remove('reduce-motion');setSpeed(0);
      render();return {assets:Object.keys(AresWorld.assets),metrics,quality:QUAL,ground:AresWorld.surface};
    });
    await page.waitForTimeout(200);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,...results,errors},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
