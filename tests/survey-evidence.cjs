const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765');
  await page.waitForFunction(()=>window.SurfaceSurvey?.ready&&AresWorld.pending===0&&SurfaceSurvey.site);
  const result=await page.evaluate(()=>{
   let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
   Junior.start('junior',0,812);SurfaceSurvey.syncSite();if(!R3.fp)toggleWalk();
   check(S.speed===0,'Junior Walk keeps deliberate turns');
   let open;
   for(const t of S.tiles){
    if(t.owner)continue;R3.fp.x=tx(t);R3.fp.z=tz(t);
    if(SurfaceSurvey.reading()?.condition==='open'&&!walkBlocked(R3.fp.x,R3.fp.z)){open=t;break;}
   }
   check(!!open,'Actual map contains accessible open condition');
   check(SurfaceSurvey.record().reward===3&&S.fame===3&&S.missionSystems.surveys.open.c===open.c,'Current open position records actual tile');
   check(SurfaceSurvey.record().reward===0&&S.fame===3,'Repeated record cannot farm');
   const rock=SurfaceSurvey.site;R3.fp.x=rock.sampleX;R3.fp.z=rock.sampleZ;
   check(!walkBlocked(R3.fp.x,R3.fp.z),'Authored outcrop sample position is physically accessible');
   check(SurfaceSurvey.reading().condition==='rock'&&SurfaceSurvey.reading().exposureIndex===96,'Actual authored marker drives rock96');
   check(SurfaceSurvey.record().reward===7&&S.fame===10,'Rock observation and comparison reward once');
   const t=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock'&&hdist(t,rock)>1);
   const b={type:'shield',c:t.c,r:t.r,done:true,on:true};S.builds.push(b);t.build=b;R3.fp.x=tx(t)+1;R3.fp.z=tz(t);
   check(!walkBlocked(R3.fp.x,R3.fp.z)&&SurfaceSurvey.reading().condition==='shelter','Shelter marker accessible outside collision wall');
   check(/not an indoor measurement/.test(SurfaceSurvey.reading().model),'Shelter marker explicitly not an indoor measurement');
   check(SurfaceSurvey.record().reward===7&&S.fame===17,'Three conditions plus comparisons total17');
   check(MissionSystems.fameInfo().fieldReadings.length===3,'Field notes expose actual stored readings');
   S.storm={active:true};check(!SurfaceSurvey.record().ok&&S.fame===17,'Radiation alert blocks outdoor evidence');S.storm=null;
   Strategy.saveMission();
   check(JSON.parse(localStorage.getItem('mars-colony-save')).state.missionSystems.surveys.rock.exposureIndex===96,'Real local save includes reading');
   Junior.start('junior',0,813);SurfaceSurvey.update();
   check(S.fame===0&&/Compare open ground/.test(document.getElementById('surveyResult').textContent),'New mission clears previous reward text');
   Strategy.loadMission();
   check(S.fame===17&&MissionSystems.fameInfo().fieldReadings.length===3,'Real local load restores score and ledger');
   if(!R3.fp)toggleWalk();R3.fp.x=tx(open);R3.fp.z=tz(open);
   check(SurfaceSurvey.record().reward===0&&S.fame===17,'Real save-load cannot repay condition');
   toggleWalk();return{checks,readingScore:S.fame,notes:MissionSystems.fameInfo().fieldReadings};
  });
  await page.waitForTimeout(300);assert.deepEqual(errors,[],'No browser runtime errors');
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
