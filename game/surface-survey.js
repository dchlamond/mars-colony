/* Original surface survey instrument. All readings below are a deterministic
   teaching model, never live NASA measurements or personal radiation advice. */
(function(){
 'use strict';
 if(!window.THREE||!R3)return;
 const panel=document.createElement('section');panel.id='surfaceSurvey';panel.setAttribute('aria-label','Surface dosimeter');panel.hidden=true;
 panel.innerHTML='<div class="survey-heading"><b>Surface dosimeter</b><span>Simulation</span></div><div class="survey-reading"><strong id="surveyIndex">100</strong><span>relative exposure index<br><small id="surveyCondition">Open ground</small></span></div><p id="surveyModel">100 is our outdoor reference, not a dose in grays.</p><div class="survey-actions"><button id="recordSurvey" type="button">Record reading · E</button><button id="surveyScience" type="button">NASA evidence</button></div><p id="surveyResult" role="status">Compare open ground, rock and a built shelter.</p>';
 document.body.append(panel);
 const style=document.createElement('style');style.textContent=`
 #surfaceSurvey{position:fixed;left:18px;bottom:18px;z-index:22;width:330px;max-width:calc(100vw - 36px);padding:13px 15px;color:var(--ares-text);background:var(--ares-deep);border:1px solid var(--ares-line);box-shadow:0 5px 25px #0006;font:16px/1.35 var(--body,Arial,sans-serif)}
 #surfaceSurvey[hidden]{display:none}.survey-heading{display:flex;justify-content:space-between;gap:8px;align-items:center}.survey-heading>span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ares-deep);background:var(--ares-accent);padding:3px 5px}.survey-reading{display:flex;align-items:center;gap:15px;margin:8px 0}.survey-reading>strong{font-size:42px;line-height:1;color:var(--ares-accent)}.survey-reading>span{font-size:14px}#surfaceSurvey p{margin:7px 0;font-size:14px}#surveyResult{min-height:38px;color:var(--ares-muted)}.survey-actions{display:flex;gap:7px}.survey-actions button{font:inherit;font-size:16px;color:var(--ares-text);background:var(--ares-panel);border:1px solid var(--ares-line);padding:8px 7px;min-height:44px;cursor:pointer}.survey-actions button:focus-visible{outline:3px solid var(--ares-accent);outline-offset:2px}
 @media(max-width:600px){#surfaceSurvey{width:270px;left:10px;bottom:65px;padding:10px}.survey-reading>strong{font-size:31px}#surfaceSurvey p{font-size:13px}.survey-actions button{font-size:16px;padding:7px 5px}.survey-heading{font-size:16px}#surveyResult{min-height:26px}}
 @media(max-height:500px) and (min-width:601px){#surfaceSurvey{width:300px;left:auto;right:10px;bottom:10px;padding:8px 10px}.survey-reading{margin:4px 0}.survey-reading>strong{font-size:28px}#surveyModel{display:none}#surveyResult{margin:4px 0;min-height:0}.survey-heading{font-size:14px}}
 `;document.head.append(style);
 const SOURCE='https://science.nasa.gov/resource/radiation-measurements-on-mars/';
 const CLIFF='https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/';
 const STORM='https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/';
 const distance=(x,z,t)=>{let dx=wrapWorldX(x)-tx(t);dx-=Math.round(dx/PW)*PW;return Math.hypot(dx,z-tz(t));};
 let siteMesh=null,siteMission=null;
 const siteLabel=document.createElement('button');siteLabel.id='rockSurveyLabel';siteLabel.className='lab';siteLabel.textContent='Rock survey · teaching site';siteLabel.style.cssText='position:fixed;z-index:9;min-height:30px;padding:5px 9px;font:13px var(--body,Arial);display:none';document.body.append(siteLabel);
 siteLabel.onclick=()=>{const site=R3.surveySite;if(!site)return;R3.target.set(site.x,0,site.z);R3.dist=7;render();};
 function syncSite(){
  if(!window.AresRender?.surveyRockGeometry)return;
  if(!siteMesh){siteMesh=new THREE.Mesh(AresRender.surveyRockGeometry,AresRender.surveyRockMaterial);siteMesh.name='Authored rock survey teaching site';siteMesh.scale.set(2.2,3.0,1.6);siteMesh.castShadow=HQ;siteMesh.receiveShadow=true;R3.scene.add(siteMesh);}
  const old=R3.surveySite;
  if(siteMission!==S||!old||tileAt(old.c,old.r)?.build){
   siteMission=S;const pod=S.builds[0],t=S.tiles.find(t=>hdist(t,pod)===3&&!t.build&&!t.owner&&t.r>0&&t.r<ROWS-1);
   R3.surveySite=t?{c:t.c,r:t.r,x:tx(t),z:tz(t),sampleX:tx(t),sampleZ:tz(t)+1.08,artistic:true}:null;
  }
  const site=R3.surveySite;siteMesh.visible=!!site;if(!site){siteLabel.style.display='none';return;}
  siteMesh.userData.scanId='survey:'+site.c+':'+site.r;
  const x=site.x+(R3.fp?Math.round((R3.fp.x-site.x)/PW)*PW:0);
  const bottom=AresRender.surveyRockGeometry.boundingBox.min.y*siteMesh.scale.y;
  siteMesh.position.set(x,surfaceY(site.x,site.z)-bottom-.03,site.z);
  const anchor=new THREE.Vector3(x,siteMesh.position.y+.65,site.z).project(R3.cam),rect=R3.renderer.domElement.getBoundingClientRect();
  siteLabel.style.display=!R3.fp&&anchor.z<1&&Math.abs(anchor.x)<.95&&Math.abs(anchor.y)<.9?'block':'none';
  siteLabel.style.left=rect.left+(anchor.x+1)*rect.width/2+'px';siteLabel.style.top=rect.top+(1-anchor.y)*rect.height/2+'px';siteLabel.style.transform='translate(-50%,-100%)';
 }
 function reading(){
  if(!R3.fp)return null;const f=R3.fp,t=tileNear(f.x,f.z);if(!t)return null;
  const shelter=S.builds.find(b=>b.type==='shield'&&b.done&&distance(f.x,f.z,b)<1.65);
  const rock=!!R3.surveySite&&distance(f.x,f.z,R3.surveySite)<1.85;
  const condition=shelter?'shelter':rock?'rock':'open',exposureIndex=condition==='shelter'?30:condition==='rock'?96:100;
  return {kind:'radiation',c:t.c,r:t.r,sol:S.sol,condition,exposureIndex,sheltered:!!shelter,source:'simulation',
   label:condition==='shelter'?'Shelter comparison marker':condition==='rock'?'Rock comparison marker':'Open ground',
   model:condition==='shelter'?'Near-shelter marker: 30 is a game assumption, not an indoor measurement or protection rating.':condition==='rock'?'96 illustrates one NASA cliff result: about 4% less total radiation.':'100 is our outdoor reference, not a dose in grays.'};
 }
 function record(){
  const data=reading();if(!data||modalOpen)return {ok:false,message:'Enter Walk on Mars before recording a reading.'};
  if(S.storm?.active){const result={ok:false,recorded:false,reward:0,message:'A radiation alert is active. Return to the map and keep the crew sheltered; outdoor surveys can wait.'};document.getElementById('surveyResult').textContent=result.message;return result;}
  const result=window.MissionSystems?.recordSurvey(data)||{ok:false,message:'Survey records are not ready yet.'};
  document.getElementById('surveyResult').textContent=result.message;
  if(result.ok){tool.classList.add('scanning');clearTimeout(scanTimer);scanTimer=setTimeout(()=>tool.classList.remove('scanning'),650);}
  update();return result;
 }
 function science(){
  clearWalkInput();
  if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
  modal({title:'Radiation is not temperature',keepOpen:true,html:`<p>A <b>dosimeter</b> detects ionizing radiation. A thermometer measures temperature. Our handheld model is an original game design, inspired by scientific surveying.</p><p>Curiosity carries NASA's <b>Radiation Assessment Detector (RAD)</b>. RAD measured radiation while the rover travelled to Mars and on the surface. <a href="${SOURCE}" target="_blank" rel="noopener">Read NASA's RAD evidence</a>.</p><p><b>Our relative index is simulated:</b> open ground is 100; beside a rock it is 96. That comparison illustrates one real Curiosity observation near a cliff, where total radiation fell by about 4%. It does not prove every rock offers that protection. A built shelter reads 30 by a game assumption, not a NASA engineering rating. <a href="${CLIFF}" target="_blank" rel="noopener">Read the cliff observation</a>.</p><p><b>Historical event, not today's reading:</b> during the May 20, 2024 storm, Curiosity measured an event dose of <b>8,100 micrograys</b>. That is an accumulated absorbed dose, not a temperature, hourly rate or live forecast for your tile. <a href="${STORM}" target="_blank" rel="noopener">Read the event report</a>.</p><p>Record different conditions, then compare them. Evidence earns Fame once; repeating the same condition does not add more.</p>`,buttons:[{label:'Return to survey',primary:true}]});
 }
 document.getElementById('recordSurvey').onclick=record;document.getElementById('surveyScience').onclick=science;

 // Student-selected Field Scientist view model: the detailed transparent art
 // preserves the chosen glove/materials; the screen remains live HTML data.
 // This is a 2.5D view model, not world geometry or a NASA sensor replica.
 const tool=document.createElement('div');tool.id='fieldScientist';tool.hidden=true;tool.setAttribute('aria-hidden','true');
 tool.innerHTML='<img alt="" draggable="false"><div class="field-screen"><span class="field-heading">SURVEY</span><strong>100</strong><span class="field-unit">RELATIVE INDEX</span><span class="field-place">Open ground</span><span class="field-simulation">SIMULATION</span></div>';
 document.body.append(tool);
 let loaded=false,lastText='',lastMission=S,scanTimer;
 const art=window.AresWorld;if(art)art.pending++;
 const toolImage=tool.querySelector('img');
 toolImage.onload=()=>{loaded=true;if(art){art.pending--;art.dosimeter='Field Scientist: selected transparent view model with live readings';}};
 toolImage.onerror=()=>{if(art){art.pending--;art.errors.push('field-scientist.png');}};
 toolImage.src=window.INLINE?.['assets/selected/field-scientist.png']||'assets/selected/field-scientist.png';
 function update(){
  if(lastMission!==S){lastMission=S;lastText='';document.getElementById('surveyResult').textContent='Compare open ground, rock and a built shelter.';}
  const visible=!!R3.fp;panel.hidden=!visible;tool.hidden=!visible||!loaded;if(!visible)return;
  const value=reading();if(!value)return;
  const text=value.exposureIndex+'|'+value.condition;
  if(text!==lastText){
   lastText=text;document.getElementById('surveyIndex').textContent=value.exposureIndex;document.getElementById('surveyCondition').textContent=value.label;document.getElementById('surveyModel').textContent=value.model;
   tool.querySelector('strong').textContent=value.exposureIndex;
   tool.querySelector('.field-place').textContent=({open:'Open ground',rock:'Rock cover',shelter:'Shelter'})[value.condition];
  }
  document.getElementById('recordSurvey').disabled=!!S.storm?.active;
 }
 function render(){
  tool.hidden=!R3.fp||!loaded;if(tool.hidden)return;
  const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  tool.style.transform=reduced?'none':`translateY(${Math.sin(R3.fp.step)*2}px) rotate(${Math.sin(R3.fp.step*.5)*.35}deg)`;
 }
 window.SurfaceSurvey={reading,record,science,update,render,syncSite,get ready(){return loaded;},get site(){return R3.surveySite;},sources:{rad:SOURCE,cliff:CLIFF,storm:STORM}};
})();
