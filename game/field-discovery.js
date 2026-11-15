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
const button=document.createElement('button');button.id='fieldDiscovery';button.hidden=true;document.body.append(button);
function target(){if(!R3?.fp)return null;const t=tileNear(R3.fp.x,R3.fp.z);if(!t)return null;let key=t.type==='ice'?'ice':t.type==='lava'?'lava':t.type==='rock'?['hematite','clay','sulfate'][Math.abs(t.c+t.r)%3]:'regolith';
 let nearby=null,best=3;for(const b of S.builds){const dist=Math.hypot(tx(b)-R3.fp.x,tz(b)-R3.fp.z);if(b.done&&dist<best){best=dist;nearby=b;}}
 if(nearby)key=nearby.type==='shield'?'shelter':catalog[nearby.type]?nearby.type:key;
 if(window.SurfaceSurvey?.reading?.()?.condition==='rock')key=['hematite','clay','sulfate'][Math.abs(t.c+t.r)%3];
 return {key,t};}
function scan(){
 if(modalOpen||!R3?.fp||S.over||window.FieldScan?.busy)return false;
 const q=target();if(!q)return false;
 const mission=S,origin={x:R3.fp.x,z:R3.fp.z};
 const rock=window.SurfaceSurvey?.reading?.()?.condition==='rock'?SurfaceSurvey.site:null;
 const site=rock||q.t,rawX=rock?rock.x:tx(site),z=rock?rock.z:tz(site),x=rawX+Math.round((origin.x-rawX)/PW)*PW;
 clearWalkInput();
 return window.FieldScan.start({label:catalog[q.key].name,anchor:{x,y:surfaceY(x,z),z,radius:rock ? 0.8 : 0.65,height:rock ? 1.5 : 0.65},valid:()=>{
  if(S!==mission||!R3?.fp||S.over)return false;let dx=R3.fp.x-origin.x;dx-=Math.round(dx/PW)*PW;
  return Math.hypot(dx,R3.fp.z-origin.z)<1.4;
 },complete:()=>finishScan(q)});
}
function finishScan(q){const d=S.fieldDiscoveries||(S.fieldDiscoveries={version:1,entries:{}}),entry=catalog[q.key];
 if(!d.entries[q.key]){d.entries[q.key]={key:q.key,sol:S.sol,c:q.t.c,r:q.t.r};if(!window.Blackout?.isActive()){addFame(3,'Field discovery: '+entry.name);S.parts+=1;}log('Discovered '+entry.name+'. NASA evidence added to the discovery ledger.','good');}
 clearWalkInput();document.exitPointerLock?.();window.BlackoutAudio?.cue('success');
 window.CampaignUI.show('Field discovery · '+entry.name,'<p>'+entry.fact+'</p><p><b>Use the evidence:</b> '+entry.why+'</p><p><a href="'+entry.url+'" target="_blank" rel="noopener">Open NASA evidence</a></p><small>This is a placed teaching sample. Pressing F records its lesson, not a measured mineral identification. The dosimeter uses E for exposure readings.</small>');
}
function ledger(){const entries=S.fieldDiscoveries?.entries||{};CampaignUI.show('Discovery ledger','<p>Walk on Mars and press <b>F</b> near rocks, ice terrain and colony equipment. Each new type earns 3 Fame and 1 Part once in a campaign.</p><p>'+Object.keys(entries).length+' / '+Object.keys(catalog).length+' discoveries</p>'+Object.entries(catalog).map(([key,c])=>'<article class="discovery-entry"><h3>'+c.name+'</h3>'+(entries[key]?'<p>'+c.fact+'</p><p>'+c.why+'</p><small>Day '+entries[key].sol+' · teaching site '+entries[key].c+', '+entries[key].r+'</small> · <a href="'+c.url+'" target="_blank" rel="noopener">NASA source</a>':'<p>Not recorded yet. Explore to unlock this entry.</p>')+'</article>').join(''));}
button.onclick=scan;document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')){e.preventDefault();scan();}});
setInterval(()=>{const q=target();button.hidden=!q||modalOpen;button.disabled=!!window.FieldScan?.busy||!!S.over;if(q)button.textContent=window.FieldScan?.busy?'Scanning · hold position':'F · Scan '+catalog[q.key].name;},200);
window.FieldDiscovery={catalog,target,scan,ledger};
})();
