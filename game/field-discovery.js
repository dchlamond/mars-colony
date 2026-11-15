/* NASA evidence catalogue attached to fictional, discoverable teaching sites. */
(function(){
'use strict';
const catalog={
 regolith:{name:'Martian regolith',fact:'Mars has loose surface material made of dust and rock fragments. Curiosity studies minerals in drilled rock and scooped soil with CheMin.',why:'Loose ground is a building material in our colony, but real engineering needs site testing.',url:'https://science.nasa.gov/mission/msl-curiosity/science-highlights/'},
 hematite:{name:'Hematite · iron oxide',fact:'Curiosity confirmed hematite in rocks at Pahrump Hills, matching earlier orbital evidence from Mars Reconnaissance Orbiter.',why:'Compare orbital evidence with a ground observation. One view does not tell the whole story.',url:'https://www.jpl.nasa.gov/news/nasas-curiosity-mars-rover-finds-mineral-match/'},
 clay:{name:'Clay-bearing rock',fact:'Curiosity found clay minerals in Yellowknife Bay samples. Clays help scientists reconstruct ancient environments involving water.',why:'Past water is evidence about history; it does not mean drinking water is available here today.',url:'https://science.nasa.gov/mission/msl-curiosity/science-highlights/'},
 sulfate:{name:'Sulfate-bearing rock',fact:'NASA reports sulfate minerals and changing clay abundance in the layers of Mount Sharp.',why:'Different rock layers can preserve different environmental conditions.',url:'https://www.jpl.nasa.gov/news/nasa-finds-evidence-of-diverse-environments-in-curiosity-samples/'},
 ice:{name:'Likely buried water ice',fact:'NASA’s SWIM maps combine orbital observations to estimate shallow buried ice. Ice-exposing impacts offer independent confirmation at some locations.',why:'A likely-ice map helps choose where to investigate. It does not guarantee ice under every game tile.',url:'https://www.jpl.nasa.gov/images/pia26046-distribution-of-buried-ice-on-mars/'},
 lava:{name:'Volcanic terrain',fact:'Mars has enormous volcanoes and volcanic plains. The terrain is part of a long history of crust formation.',why:'Rock cover and terrain matter for site planning. A cave still needs a tested, sealed habitat.',url:'https://science.nasa.gov/mars/facts/'},
 shelter:{name:'Radiation shelter',fact:'Curiosity’s RAD measurements let scientists compare exposure in different terrain. NASA studies shielding to reduce astronaut radiation exposure.',why:'Shelter capacity is essential when a solar-particle alert arrives.',url:'https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/'},
 solar:{name:'Solar array',fact:'Wind-driven grains helped remove dust from an InSight panel on 22 May 2021, increasing energy by about 30 watt-hours per sol.',why:'Keep panels clean and store power before dust blocks sunlight.',url:'https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/'},
 moxie:{name:'Oxygen from carbon dioxide',fact:'MOXIE demonstrated production of oxygen from the Martian atmosphere aboard Perseverance.',why:'Making air requires energy, equipment and maintenance; a full tank alone is not a sustainable supply.',url:'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/'}
};
const finds={
 parts:{name:'Mineral-rich rock',key:'hematite',description:'Usable minerals recovered for colony repairs.',note:'Turning a sample into 3 Parts is a simplified game reward, not a measurement of its composition.'},
 water:{name:'Ice-bearing rock',key:'ice',description:'Water ice recovered and processed for your colony.',note:'This placed sample gives 5 Water in the game. NASA ice maps guide real investigations; they do not identify this fictional rock.'},
 air:{name:'Hollow rock · air cache',key:'moxie',description:'A sealed expedition air cartridge was hidden inside this hollow rock.',note:'The cartridge adds 5 Air. This is a fictional supply cache; hollow Martian rocks do not contain breathable air.'}
};
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
  const old=S.rockFinds?.entries?.[id];
  cached={id,t,point:{x:point.x,y:point.y,z:point.z},name:old?finds[old.kind]?.name||'Surveyed rock':'Unidentified rock',known:!!old};break;
 }
 return cached;
}
function scan(){
 if(modalOpen||!R3?.fp||S.over||window.FieldScan?.busy)return false;
 const q=target(true);if(!q)return false;
 if(q.known){showFind(q,S.rockFinds.entries[q.id],true);return true;}
 const mission=S,origin={x:R3.fp.x,z:R3.fp.z};clearWalkInput();
 return window.FieldScan.start({label:'Unidentified rock',anchor:{...q.point,radius:.22,height:.35},valid:()=>{
  if(S!==mission||!R3?.fp||S.over)return false;let dx=R3.fp.x-origin.x;dx-=Math.round(dx/PW)*PW;
  return Math.hypot(dx,R3.fp.z-origin.z)<1.4&&target()?.id===q.id;
 },complete:()=>finishScan(q)});
}
function showFind(q,result,already=false){
 const find=finds[result.kind];if(!find)return;const entry=catalog[find.key];
 clearWalkInput();document.exitPointerLock?.();
 const reward=already?'Already collected · no extra supplies':result.rewarded?'+'+result.amount+' '+({parts:'Parts',water:'Water',air:'Air'})[result.kind]:'Discovery recorded';
 CampaignUI.show('Rock scan · '+find.name,'<p class="science-provenance"><b>Fictional supply reward</b> · This rock and its contents are generated for the game, not identified by a NASA dataset.</p><div class="rock-find-reward">'+reward+'</div><p>'+find.description+'</p><p>'+find.note+'</p>'+(window.Blackout?.isActive()?'<p>The Blackout experiment keeps both futures’ starting supplies equal. Rock scans record evidence without changing those supplies.</p>':'')+'<h3>NASA research · background evidence</h3><p>'+entry.fact+'</p><p><a href="'+entry.url+'" target="_blank" rel="noopener">Explore the NASA source</a></p><small>Find saved in your discovery ledger. Aim at another rock to discover its contents. E records a separate dosimeter reading.</small>',[{label:'Continue exploring',primary:true}]);
}
function finishScan(q){
 const result=RockFindRules.collect(S,q.id,{reward:!window.Blackout?.isActive()});
 if(!result.ok){clearWalkInput();document.exitPointerLock?.();CampaignUI.show('Survey complete','<p>Your rock ledger is full. These supplies have not been collected.</p>');return;}
 const find=finds[result.kind],d=S.fieldDiscoveries||(S.fieldDiscoveries={version:1,entries:{}});
 if(!d.entries[find.key]){d.entries[find.key]={key:find.key,sol:S.sol,c:q.t.c,r:q.t.r};if(!window.Blackout?.isActive())addFame(3,'Field discovery: '+find.name);}
 if(!result.alreadyCollected)log('Scanned '+find.name+(result.rewarded?': +'+result.amount+' '+({air:'Air',water:'Water',parts:'Parts'})[result.kind]:'. Evidence recorded')+'.','good');
 cacheTime=-Infinity;window.BlackoutAudio?.cue('success');render();showFind(q,result,result.alreadyCollected);
}
function ledger(){
 const entries=S.rockFinds?.entries||{},lessons=S.fieldDiscoveries?.entries||{},rows=Object.values(entries),totals={parts:0,water:0,air:0};rows.forEach(r=>totals[r.kind]+=r.amount);
 CampaignUI.show('Discovery ledger','<p class="science-provenance"><b>Game discoveries, real science references.</b> Rock positions, contents and supply amounts are fictional. The linked NASA research explains the science; it does not measure these samples.</p><p>Aim the centre marker at an individual rock, then press <b>F</b> or tap Scan. Hold your aim until the scan finishes. Its contents stay hidden until then. Each rock rewards supplies once.</p><p><b>'+rows.length+' rocks scanned</b> · '+totals.parts+' Parts · '+totals.water+' Water · '+totals.air+' Air recovered</p>'+Object.entries(finds).map(([kind,f])=>{const found=rows.filter(r=>r.kind===kind),c=catalog[f.key];return '<article class="discovery-entry"><h3>'+(found.length?f.name:'Unknown rock contents')+'</h3>'+(found.length?'<p>'+found.length+' found · '+found.reduce((sum,r)=>sum+r.amount,0)+' '+({parts:'Parts',water:'Water',air:'Air'})[kind]+' recovered</p><p>'+f.note+'</p><p>'+c.fact+'</p><a href="'+c.url+'" target="_blank" rel="noopener">NASA source</a>':'<p>Scan more rocks to reveal this discovery.</p>')+'</article>';}).join('')+'<h3>Individual finds</h3>'+rows.slice().reverse().map((r,i)=>'<p>Rock '+(rows.length-i)+' · '+finds[r.kind].name+' · Day '+r.sol+' · '+(r.rewarded?'+'+r.amount+' '+({air:'Air',water:'Water',parts:'Parts'})[r.kind]:'Evidence recorded')+'</p>').join('')+Object.entries(lessons).filter(([k])=>!Object.values(finds).some(f=>f.key===k)&&catalog[k]).map(([key,e])=>'<article class="discovery-entry"><h3>'+catalog[key].name+'</h3><p>'+catalog[key].fact+'</p><small>Recorded on Day '+e.sol+'</small> · <a href="'+catalog[key].url+'" target="_blank" rel="noopener">NASA source</a></article>').join(''));
}
button.onclick=scan;document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')){e.preventDefault();scan();}});
setInterval(()=>{const on=!!R3?.fp&&!modalOpen;button.hidden=!on;aim.hidden=!on;aim.classList.toggle('rock-scanning',!!FieldScan.busy);if(!on)return;const q=target();button.disabled=!q||!!FieldScan.busy||!!S.over;button.textContent=FieldScan.busy?'Scanning · hold your aim':q?(q.known?'F · Review '+q.name:'F · Scan unidentified rock'):'Aim at a rock · F to scan';aim.classList.toggle('rock-locked',!!q);aim.querySelector('span').textContent=FieldScan.busy?'':q?(q.known?q.name:'Unidentified rock'):'';},160);
window.FieldDiscovery={catalog,target,scan,ledger};
})();
