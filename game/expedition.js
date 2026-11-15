/* Mars Colony: Junior Mission Trainer.
   AI disclosure: this file was generated with AI tools from the team's own design. See AI_USE.md. */
'use strict';
// Visual surface detail is procedural, not a measured landing-site reconstruction.
const visor=document.createElement('div');visor.id='visor';visor.setAttribute('aria-hidden','true');
visor.innerHTML=`<div class="eva-mark">MARS SURFACE / EXTRAVEHICULAR VIEW</div><div class="eva-cross"></div><svg id="suit" viewBox="0 0 1440 260" preserveAspectRatio="none"><defs><linearGradient id="fabric" x2="0.5" y2="1"><stop stop-color="#e1d9c6"/><stop offset=".45" stop-color="#aaa595"/><stop offset="1" stop-color="#4b5556"/></linearGradient><linearGradient id="seal"><stop stop-color="#111b20"/><stop offset=".5" stop-color="#536162"/><stop offset="1" stop-color="#142028"/></linearGradient></defs><path d="M0 260V155Q80 95 170 130L350 260M1440 260V155Q1360 95 1270 130L1090 260" fill="url(#fabric)" stroke="#525955" stroke-width="6"/><path d="M55 150L150 260M78 140L177 260M101 136L204 260M1385 150L1290 260M1362 140L1263 260M1339 136L1236 260" stroke="#747b73" stroke-width="5"/><path d="M300 260Q410 206 480 214Q720 288 960 214Q1030 206 1140 260" fill="url(#seal)" stroke="#a3a99e" stroke-width="8"/><path d="M140 170L210 151L260 204L190 225Z" fill="#293d43" stroke="#c6c6b6" stroke-width="6"/><path d="M164 179L207 167M176 190L218 178" stroke="#a3d9c5" stroke-width="4"/><path d="M1230 152L1290 169L1250 221L1190 203Z" fill="#ad4d31"/></svg><div class="eva-console">SUIT VIEW • MISSION SIMULATION</div>`;
document.body.append(visor);
const spaceButton=document.createElement('button');spaceButton.id='spaceButton';spaceButton.className='btn';spaceButton.textContent='Space weather';document.querySelector('header').append(spaceButton);
const panel=document.createElement('section');panel.id='spacePanel';panel.hidden=true;panel.setAttribute('aria-label','NASA space weather');document.body.append(panel);
spaceButton.onclick=()=>{if(panel.hidden)showWeather();panel.hidden=!panel.hidden;spaceButton.setAttribute('aria-expanded',String(!panel.hidden));};
let weather=window.DONKI_SNAPSHOT, weatherMode='Archived snapshot',weatherMessage='';
function eventTime(e){return e.beginTime||e.startTime||e.eventTime;}
function recentRows(data){const end=new Date(data.end+'T00:00:00Z'),start=new Date(end.getTime()-7*86400000);return Object.entries(data.raw).flatMap(([kind,rows])=>rows.map(e=>({...e,kind}))).filter(e=>{const t=new Date(eventTime(e));return t>=start&&t<end;});}
function showWeather(){
 const rows=recentRows(weather),end=new Date(weather.end+'T00:00:00Z'),days=Array.from({length:7},(_,i)=>new Date(end-((7-i)*86400000)).toISOString().slice(0,10));
 const counts=days.map(d=>rows.filter(e=>eventTime(e).startsWith(d)).length),max=Math.max(1,...counts);
 const flares=rows.filter(e=>e.kind==='FLR'),sep=rows.filter(e=>e.kind==='SEP');
 panel.innerHTML=`<button class="close" aria-label="Close space weather">Close</button><div class="source-tag">NASA / CCMC · DONKI</div><h2>The Sun this week</h2><small>${esc(weatherMode)} · ${days[0]}–${days[6]} UTC<br>Seven complete UTC days. Retrieved ${esc(weather.fetchedAt.slice(0,16).replace('T',' '))} UTC</small><div class="bars" aria-label="Daily recorded event counts">${days.map((d,i)=>`<div class="day" style="height:${counts[i]/max*70+2}px"><b>${counts[i]}</b><span>${d.slice(5)}</span></div>`).join('')}</div><p>${flares.length} solar flares · ${rows.filter(e=>e.kind==='CME').length} coronal mass ejections (clouds expelled by the Sun) · ${sep.length} energetic-particle events.</p><p>${counts.every(n=>n===0)?'No events returned for this window. This does not establish safe radiation conditions.':`Most records: ${days[counts.indexOf(Math.max(...counts))]}. These are catalog counts, not a radiation forecast.`}</p><button id="refreshWeather">Refresh NASA data</button><p role="status">${esc(weatherMessage)}</p><h3>What does this mean on Mars?</h3><p>Solar particles can increase radiation risk. A flare or an Earth-observed particle event does not prove a storm reached Mars. DONKI does not measure your suit dose, Martian temperature, wind, or dust. Zero records does not mean zero radiation.</p><h3>Investigate the terrain dataset</h3><p>In Walk on Mars, aim at a rock and press F to retrieve the NASA MOLA elevation record for its map location. A rendered rock is a visual target, not a measured chemical sample.</p><button id="terrainLedger">Open NASA terrain ledger</button> <button id="shelterReturn">Return to colony</button><p id="sampleStatus" role="status"></p><h3>Trace the observations</h3><table><thead><tr><th>UTC date</th><th>Type</th><th>Record</th></tr></thead><tbody>${rows.slice().sort((a,b)=>eventTime(b).localeCompare(eventTime(a))).slice(0,35).map(e=>`<tr><td>${esc(eventTime(e).slice(0,16))}</td><td>${e.kind}</td><td>${e.link&&e.link.startsWith('https://ccmc.gsfc.nasa.gov/')?`<a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.classType||'NASA record')}</a>`:esc(e.classType||'NASA record')}</td></tr>`).join('')}</tbody></table><p><small>Observations: <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener">NASA CCMC DONKI</a>. Catalog dates remain attached to their observations. These records are not converted into a Mars weather forecast or a radiation dose. Local ground detail and suit are artistic approximations; the global terrain uses the original MOLA data.</small></p>`;
 panel.querySelector('.close').onclick=()=>{panel.hidden=true;spaceButton.setAttribute('aria-expanded','false');spaceButton.focus();};
 panel.querySelector('#refreshWeather').onclick=refreshWeather;
 panel.querySelector('#terrainLedger').onclick=()=>{if(window.FieldDiscovery?.ledger){panel.hidden=true;spaceButton.setAttribute('aria-expanded','false');FieldDiscovery.ledger();}else panel.querySelector('#sampleStatus').textContent='The terrain ledger is still loading.';};
 panel.querySelector('#shelterReturn').onclick=()=>{if(R3?.fp)toggleWalk();panel.hidden=true;};
}
async function refreshWeather(){
 weatherMessage='Contacting NASA…';showWeather();panel.querySelector('#refreshWeather').disabled=true;
 const end=new Date().toISOString().slice(0,10),start=new Date(new Date(end+'T00:00:00Z')-7*86400000).toISOString().slice(0,10);
 try{const pairs=await Promise.all(['FLR','CME','SEP'].map(async kind=>{const url=`https://ccmc.gsfc.nasa.gov/DONKI-API/get/${kind}?startDate=${start}&endDate=${end}`;const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('NASA service unavailable');const data=await response.json();if(!Array.isArray(data))throw Error('Unexpected NASA response');return[kind,data];}));weather={start,end,fetchedAt:new Date().toISOString(),raw:Object.fromEntries(pairs)};weatherMode='Freshly fetched observations';weatherMessage='Updated. Catalog records may be revised by NASA.';}catch(e){weatherMessage='Refresh unavailable. Showing the saved records above, with their date.';weatherMode='Archived snapshot';}showWeather();
}
showWeather();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;spaceButton.focus();}});

if(R3){
 R3.renderer.setPixelRatio(HQ?Math.min(2,Math.max(1.5,devicePixelRatio||1)):1);
 R3.renderer.toneMappingExposure=1.08;
 const fill=new THREE.HemisphereLight(0xd5dfdf,0x885a3d,.5);R3.scene.add(fill);
 R3.sun.shadow.normalBias=.025;R3.sun.shadow.radius=3;
 // A high resolution, deterministic regolith material with grain and wind ripples.
 const c=document.createElement('canvas');c.width=c.height=HQ?1024:512;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);let seed=831;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const grain=rand()*26-13,ripple=Math.sin(x*.09+Math.sin(y*.015)*2)*4,patch=Math.sin(x*.014)*Math.cos(y*.019)*8,i=(y*c.width+x)*4;im.data[i]=151+grain+ripple+patch;im.data[i+1]=105+grain*.8+ripple+patch;im.data[i+2]=73+grain*.6+ripple+patch;im.data[i+3]=255;}ctx.putImageData(im,0,0);
 const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(16,16);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=R3.renderer.capabilities.getMaxAnisotropy();
 const oldMaterial=R3.patch.material;R3.patch.material=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.017,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-2});oldMaterial.dispose();
 R3.patch.geometry.dispose();R3.patch.geometry=new THREE.PlaneGeometry(70,70,HQ?180:90,HQ?180:90);R3.patch.geometry.rotateX(-Math.PI/2);
 R3.rocks.receiveShadow=true;
 const baseLayPatch=layPatch;
 layPatch=function(x,z){baseLayPatch(x,z);const p=R3.patch.geometry.attributes.position;for(let i=0;i<p.count;i++){const wx=x+p.getX(i),wz=z+p.getZ(i);p.setY(i,groundY(wx,wz)+.009+Math.sin(wx*2.8+Math.sin(wz))*Math.sin(wz*3.1)*.006);}p.needsUpdate=true;R3.patch.geometry.computeVertexNormals();};
 const baseWalk=toggleWalk;
 toggleWalk=function(){baseWalk();if(R3.fp){R3.cam.fov=70;R3.cam.updateProjectionMatrix();}R3.overlay.visible=!R3.fp;};
 window.G.toggleWalk=toggleWalk;
 const baseStep=walkStep;
 walkStep=function(dt){baseStep(dt);const moving=keys.w||keys.s||keys.a||keys.d||keys.arrowup||keys.arrowdown||R3.fpFwd;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;document.querySelector('#suit').style.transform=moving&&!reduced?`translateY(${Math.sin(performance.now()*.007)*2}px)`:'';R3.overlay.visible=false;};
 resize3D();
}
