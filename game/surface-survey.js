/* Surface terrain-record console. Numeric radiation simulations are disabled.
   FieldDiscovery supplies the actual NASA dataset record and provenance. */
(function(){
 'use strict';
 if(!window.THREE||!R3)return;
 const panel=document.createElement('section');panel.id='surfaceSurvey';panel.setAttribute('aria-label','NASA terrain survey');panel.hidden=true;
 panel.innerHTML='<div class="survey-heading"><b>Terrain survey</b><span>NASA dataset</span></div><div class="survey-reading"><strong id="surveyIndex">READY</strong><span>Terrain record<br><small id="surveyCondition">Current location</small></span></div><p id="surveyModel">Scan to inspect the NASA elevation record and its source.</p><div class="survey-actions"><button id="recordSurvey" type="button">Scan terrain · E</button><button id="surveyScience" type="button">Dataset information</button></div><p id="surveyResult" role="status">Scan a location to open its dataset record.</p>';
 document.body.append(panel);
 const style=document.createElement('style');style.textContent=`
 #surfaceSurvey{position:fixed;left:18px;bottom:18px;z-index:22;width:330px;max-width:calc(100vw - 36px);padding:13px 15px;color:var(--ares-text);background:var(--ares-deep);border:1px solid var(--ares-line);box-shadow:0 5px 25px #0006;font:16px/1.35 var(--body,Arial,sans-serif)}
 #surfaceSurvey[hidden]{display:none}.survey-heading{display:flex;justify-content:space-between;gap:8px;align-items:center}.survey-heading>span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ares-deep);background:var(--ares-accent);padding:3px 5px}.survey-reading{display:flex;align-items:center;gap:15px;margin:8px 0}.survey-reading>strong{font-size:42px;line-height:1;color:var(--ares-accent)}.survey-reading>span{font-size:14px}#surfaceSurvey p{margin:7px 0;font-size:14px}#surveyResult{min-height:38px;color:var(--ares-muted)}.survey-actions{display:flex;gap:7px}.survey-actions button{font:inherit;font-size:16px;color:var(--ares-text);background:var(--ares-panel);border:1px solid var(--ares-line);padding:8px 7px;min-height:44px;cursor:pointer}.survey-actions button:focus-visible{outline:3px solid var(--ares-accent);outline-offset:2px}
 @media(max-width:600px){#surfaceSurvey{width:270px;left:10px;bottom:65px;padding:10px}.survey-reading>strong{font-size:31px}#surfaceSurvey p{font-size:13px}.survey-actions button{font-size:16px;padding:7px 5px}.survey-heading{font-size:16px}#surveyResult{min-height:26px}}
 @media(max-height:500px) and (min-width:601px){#surfaceSurvey{width:300px;left:auto;right:10px;bottom:10px;padding:8px 10px}.survey-reading{margin:4px 0}.survey-reading>strong{font-size:28px}#surveyModel{display:none}#surveyResult{margin:4px 0;min-height:0}.survey-heading{font-size:14px}}
 `;document.head.append(style);
 const SOURCE='https://pds-geosciences.wustl.edu/missions/mgs/megdr.html';
 const distance=(x,z,t)=>{let dx=wrapWorldX(x)-tx(t);dx-=Math.round(dx/PW)*PW;return Math.hypot(dx,z-tz(t));};
 let siteMesh=null,siteMission=null;
 const siteLabel=document.createElement('button');siteLabel.id='rockSurveyLabel';siteLabel.className='lab';siteLabel.textContent='Terrain survey point';siteLabel.style.cssText='position:fixed;z-index:9;min-height:30px;padding:5px 9px;font:13px var(--body,Arial);display:none';document.body.append(siteLabel);
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
  // Retain geometric conditions for navigation compatibility only. They do not
  // imply measured mineral content, radiation exposure or shelter performance.
  const shelter=S.builds.find(b=>b.type==='shield'&&b.done&&distance(f.x,f.z,b)<1.65);
  const rock=!!R3.surveySite&&distance(f.x,f.z,R3.surveySite)<1.85;
  const condition=shelter?'shelter':rock?'rock':'open';
  return {kind:'terrain',c:t.c,r:t.r,sol:S.sol,condition,source:'NASA-MOLA',
   label:'Map location '+t.c+', '+t.r,
   model:'Open the dataset record for elevation and provenance. No mineral identification or radiation dose is inferred from this scene.'};
 }
 function record(){
  if(!reading()||modalOpen)return {ok:false,recorded:false,reward:0,message:'Enter Walk on Mars before scanning terrain.'};
  const started=!!window.FieldDiscovery?.scan();
  const message=started?'Scanning the terrain record. Hold your aim.':'Aim at an available survey target, then scan.';
  document.getElementById('surveyResult').textContent=message;
  return {ok:started,recorded:false,reward:0,message};
 }
 function science(){
  clearWalkInput();
  if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
  modal({title:'NASA terrain records',keepOpen:true,html:`<p>The Mars Orbiter Laser Altimeter (MOLA), aboard Mars Global Surveyor, measured the planet’s shape and elevation. The game uses a reduced-resolution copy for its global terrain.</p><p>Scanning opens the terrain dataset record and its provenance. Rendered rocks and buildings are visual objects; their appearance is not a chemical measurement. This console does not invent mineral contents, radiation doses or shelter protection percentages.</p><p><a href="${SOURCE}" target="_blank" rel="noopener">Open the NASA Planetary Data System MOLA archive</a></p>`,buttons:[{label:'Return to survey',primary:true}]});
 }
 document.getElementById('recordSurvey').onclick=record;document.getElementById('surveyScience').onclick=science;

 // Student-selected Field Scientist view model: the detailed transparent art
 // preserves the chosen glove/materials; the screen remains live HTML data.
 // This is a 2.5D view model, not world geometry or a NASA sensor replica.
 const tool=document.createElement('div');tool.id='fieldScientist';tool.hidden=true;tool.setAttribute('aria-hidden','true');
 tool.innerHTML='<img alt="" draggable="false"><div class="field-screen"><span class="field-heading">TERRAIN</span><strong>MAP</strong><span class="field-unit">TERRAIN RECORD</span><span class="field-place">Current location</span><span class="field-simulation">NASA DATA</span></div>';
 document.body.append(tool);
 let loaded=false,lastText='',lastMission=S,scanTimer;
 const art=window.AresWorld;if(art)art.pending++;
 const toolImage=tool.querySelector('img');
 toolImage.onload=()=>{loaded=true;if(art){art.pending--;art.dosimeter='Field Scientist: selected transparent view model with live readings';}};
 toolImage.onerror=()=>{if(art){art.pending--;art.errors.push('field-scientist.png');}};
 toolImage.src=window.INLINE?.['assets/selected/field-scientist.png']||'assets/selected/field-scientist.png';
 function update(){
  if(lastMission!==S){lastMission=S;lastText='';document.getElementById('surveyResult').textContent='Scan a location to open its dataset record.';}
  const visible=!!R3.fp;panel.hidden=!visible;tool.hidden=!visible||!loaded;if(!visible)return;
  const value=reading();if(!value)return;
  const text=value.c+'|'+value.r;
  if(text!==lastText){
   lastText=text;document.getElementById('surveyIndex').textContent='READY';document.getElementById('surveyCondition').textContent=value.label;document.getElementById('surveyModel').textContent=value.model;
   tool.querySelector('strong').textContent='MAP';
   tool.querySelector('.field-place').textContent=value.c+', '+value.r;
  }
  document.getElementById('recordSurvey').disabled=!!window.FieldScan?.busy;
 }
 function render(){
  tool.hidden=!R3.fp||!loaded;if(tool.hidden)return;
  const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  tool.style.transform=reduced?'none':`translateY(${Math.sin(R3.fp.step)*2}px) rotate(${Math.sin(R3.fp.step*.5)*.35}deg)`;
 }
 window.SurfaceSurvey={reading,record,science,update,render,syncSite,get ready(){return loaded;},get site(){return R3.surveySite;},sources:{mola:SOURCE}};
})();
