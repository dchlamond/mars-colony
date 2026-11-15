/* Individual target scans retrieve regional records from the bundled NASA MOLA grid. */
(function(){
'use strict';
const MOLA_URL='https://pds-geosciences.wustl.edu/missions/mgs/megdr.html';
function molaRecord(t){
 const lat=latOf(t),lon=lonOf(t),x=((Math.floor((lon+180)/360*DW)%DW)+DW)%DW,y=Math.max(0,Math.min(DH-1,Math.floor((90-lat)/180*DH))),raw=DEM[y*DW+x];
 return {sourceId:'mola',c:t.c,r:t.r,lat,lon,sampleLat:90-(y+.5)*180/DH,sampleLon:-180+(x+.5)*360/DW,raw,elevationKm:elevKm(raw),resolutionDeg:1,url:MOLA_URL};
}
function recordHtml(record){return '<div class="rock-find-reward">'+(record.elevationKm>=0?'+':'')+record.elevationKm.toFixed(1)+' km</div><p>Approximate elevation relative to the Mars reference surface.</p><p><b>NASA Mars Global Surveyor · MOLA</b><br>Nearest stored grid sample: '+record.sampleLat.toFixed(1)+'° latitude, '+record.sampleLon.toFixed(1)+'° longitude.</p><p>Our global map uses a 1° grid compressed to 8-bit heights. This is terrain context, not a measurement of this individual rock. Elevation data cannot identify minerals, water or air inside a rock.</p><p><a href="'+MOLA_URL+'" target="_blank" rel="noopener">Open the NASA PDS MOLA dataset</a></p>';}
const button=document.createElement('button');button.id='fieldDiscovery';button.hidden=true;document.body.append(button);
const aim=document.createElement('div');aim.id='rockAim';aim.hidden=true;aim.setAttribute('aria-hidden','true');aim.innerHTML='<i></i><span></span>';document.body.append(aim);
let ray=null,cached=null,cacheTime=-Infinity,cacheMission=null;
const visible=o=>{for(let n=o;n;n=n.parent)if(n.visible===false)return false;return true;};
function target(force=false){
 if(!R3?.fp||!window.THREE||!R3.cam||!R3.scene)return null;
 const now=performance.now();if(!force&&S===cacheMission&&now-cacheTime<120)return cached;
 cacheMission=S;cacheTime=now;cached=null;
 if(!ray)ray=new THREE.Raycaster();ray.near=.03;ray.far=5;
 R3.cam.updateMatrixWorld();R3.scene.updateMatrixWorld(true);
 const rocks=[];R3.scene.traverse(n=>{if(visible(n)&&(n.userData?.scanIds||n.userData?.scanId))rocks.push(n);});
 // A small aim tolerance makes tiny, individual samples usable with a mouse or touch.
 // Never infer a sample from the tile beneath the player.
 for(const [ax,ay] of [[0,0],[-.012,0],[.012,0],[0,-.012],[0,.012]]){
  ray.setFromCamera({x:ax,y:ay},R3.cam);
  const hit=ray.intersectObjects(rocks,false)[0];if(!hit)continue;
  const id=hit.object.userData.scanId||hit.object.userData.scanIds[hit.instanceId];if(!id)continue;
  // A hill or a visible building must not let us scan through its surface.
  const walls=[...(R3.bmeshes||[]),...R3.scene.children.filter(n=>n.name==='Visible colony longitude wrap')].filter(visible);
  if(ray.intersectObjects(walls,true).some(h=>visible(h.object)&&h.distance<hit.distance-.04))continue;
  const origin=ray.ray.origin,point=hit.point;let blocked=false;
  for(let i=1;i<12;i++){const f=i/12,x=origin.x+(point.x-origin.x)*f,z=origin.z+(point.z-origin.z)*f,y=origin.y+(point.y-origin.y)*f;if(surfaceY(x,z)>y+.04){blocked=true;break;}}
  if(blocked)continue;
  const t=tileNear(point.x,point.z);if(!t)continue;
  const old=S.rockEvidence?.entries?.[id];
  cached={id,t,point:{x:point.x,y:point.y,z:point.z},name:old?'Mapped terrain record':'Unscanned terrain target',known:!!old};break;
 }
 return cached;
}
function scan(){
 if(modalOpen||!R3?.fp||S.over||window.FieldScan?.busy)return false;
 const q=target(true);if(!q)return false;
 if(q.known){showFind(q,S.rockEvidence.entries[q.id],true);return true;}
 const mission=S,origin={x:R3.fp.x,z:R3.fp.z};clearWalkInput();
 return window.FieldScan.start({label:'Reading NASA terrain record',anchor:{...q.point,radius:.22,height:.35},valid:()=>{
  if(S!==mission||!R3?.fp||S.over)return false;let dx=R3.fp.x-origin.x;dx-=Math.round(dx/PW)*PW;
  return Math.hypot(dx,R3.fp.z-origin.z)<1.4&&target()?.id===q.id;
 },complete:()=>finishScan(q)});
}
function showFind(q,result,already=false){
 clearWalkInput();document.exitPointerLock?.();
 const record=molaRecord(result);
 CampaignUI.show('NASA terrain scan · MOLA','<p class="science-provenance"><b>NASA dataset record</b> · '+(already?'Saved observation':'Observation recorded')+'</p>'+recordHtml(record)+'<small>Saved to your discovery ledger. Scan another target to compare its regional terrain record. No supplies are created by scanning.</small>',[{label:'Continue exploring',primary:true}]);
}
function finishScan(q){
 const result=RockFindRules.collect(S,q.id,{c:q.t.c,r:q.t.r});
 if(!result.ok){clearWalkInput();document.exitPointerLock?.();CampaignUI.show('Survey complete','<p>Your terrain ledger is full. Review your saved NASA records.</p>');return;}
 window.Blackout?.recordFieldReading?.({kind:'elevation',source:'mola',c:q.t.c,r:q.t.r});
 if(!result.alreadyCollected)log('NASA MOLA terrain record saved to the discovery ledger.','good');
 cacheTime=-Infinity;window.BlackoutAudio?.cue('success');render();showFind(q,result,result.alreadyCollected);
}
function ledger(){
 const rows=Object.values(S.rockEvidence?.entries||{});
 CampaignUI.show('NASA discovery ledger','<p>Aim at an individual rock, then press <b>F</b> or tap Scan. Hold your aim to retrieve the NASA MOLA terrain record for its map location.</p><p><b>'+rows.length+' observations</b> · Scanning records elevation evidence; it does not identify rock contents or create supplies.</p>'+(!rows.length?'<p>No terrain records yet. Enter Walk on Mars to investigate.</p>':'')+rows.slice().reverse().map((r,i)=>'<article class="discovery-entry"><h3>Observation '+(rows.length-i)+' · Day '+r.sol+'</h3>'+recordHtml(molaRecord(r))+'</article>').join(''));
}
button.onclick=scan;document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')){e.preventDefault();scan();}});
setInterval(()=>{const on=!!R3?.fp&&!modalOpen;button.hidden=!on;aim.hidden=!on;aim.classList.toggle('rock-scanning',!!FieldScan.busy);if(!on)return;const q=target();button.disabled=!q||!!FieldScan.busy||!!S.over;button.textContent=FieldScan.busy?'Scanning · hold your aim':q?(q.known?'F · Review '+q.name:'F · Read NASA terrain record'):'Aim at a rock · F to scan';aim.classList.toggle('rock-locked',!!q);aim.querySelector('span').textContent=FieldScan.busy?'':q?(q.known?q.name:'Unscanned terrain target'):'';},160);
window.FieldDiscovery={molaRecord,target,scan,ledger};
})();
