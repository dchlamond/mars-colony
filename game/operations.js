/* AI-assisted implementation from the team's design. See AI_USE.md.
   Evidence -> decision -> consequence. All contract rules are fictional game rules. */
(function () {
'use strict';
const SOURCES={
  mola:'https://pds-geosciences.wustl.edu/missions/mgs/mola.html',
  horizons:'https://ssd.jpl.nasa.gov/horizons/manual.html',
  moxie:'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/',
  storm:'https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/',
  food:'https://www.nasa.gov/missions/station/veggie-plant-growth-system-activated-on-international-space-station/'
};
const CONTRACTS={
  air:{name:'Make every breath here',speaker:'Nara · life-support engineer',days:65,
    aim:'Make at least as much air as your crew use, with 3 sols of air stored, for 3 sols in a row.',
    lesson:'Low ground has thicker air in our model. An extractor still needs power and a worker. A full tank is not the same as a sustainable supply.',source:'moxie',
    passes:e=>e.o2p>=S.pop&&S.o2>=3*S.pop&&e.shut===0},
  shelter:{name:'Two sols without machines',speaker:'Rova · mission advisor',days:75,
    aim:'Provide shelter for everyone and store 2 sols of air and food. Keep this reserve for 3 sols in a row.',
    lesson:'Sheltering stops production. Stored supplies keep the crew going. Curiosity measured 8,100 micrograys during the May 20, 2024 event on Mars; our shelter capacities are game numbers, not dose predictions.',source:'storm',
    passes:e=>e.shelter>=S.pop&&S.o2>=2*S.pop&&S.food>=2*S.pop},
  food:{name:'A harvest we can live on',speaker:'Tavi · crop scientist',days:85,
    aim:'Grow at least as much food as the crew eat, with 3 sols of food stored, for 3 sols in a row.',
    lesson:'A greenhouse needs time, power and people. Water increases this game’s crop yield. NASA’s space gardens study how to grow food away from Earth; these yields are not measured Martian harvests.',source:'food',
    passes:e=>e.foodp>=S.pop&&S.food>=3*S.pop&&e.shut===0}
};
const state=()=>S.operations||(S.operations={version:1,active:null,history:[],completed:[],rivalBoost:null});
function ephemeris(){const rows=window.MARS_EPHEMERIS.rows;return {...rows[Math.min(Math.max(0,S.sol-1),rows.length-1)],held:S.sol>rows.length};}
// The existing game assigns one calendar day to each sol. This is an explicit training clock.
signalDelay=()=>ephemeris().minutes;
function replySols(){return Math.ceil(2*signalDelay()/(SOL_MS/1000));}
function forecast(type,t){
  // compute mutates building power/staff flags, so preview on isolated building records.
  const current=S;
  try {
    S={...current,builds:current.builds.map(b=>({...b}))};
    const before=compute();
    S.builds.push({type,c:t.c,r:t.r,done:true,on:true,lvl:1,age:growT()});
    const after=compute();
    return {before,after,air:after.o2p-before.o2p,power:after.gen-after.demand-(before.gen-before.demand),shelter:after.shelter-before.shelter};
  } finally {S=current;}
}
function candidates(type){
  const list=S.tiles.filter(t=>t.seen&&!t.owner&&!t.build&&t.type!=='rock'&&(!DEF[type].needs||t.type===DEF[type].needs));
  const rank=type==='moxie'?'air':type==='solar'?'sun':'elev';
  list.sort((a,b)=>b[rank]-a[rank]||a.r-b.r||a.c-b.c);
  return [...new Set([list[0],list[Math.floor(list.length/2)],list[list.length-1]])].filter(Boolean);
}
function fail(reason){
  const o=state(),a=o.active;if(!a)return;
  S.fame=Math.max(0,S.fame-5);o.rivalBoost={index:o.history.length%S.rivals.length,until:S.sol+30,amount:8};
  const rival=S.rivals[o.rivalBoost.index].name;
  o.history.unshift({id:a.id,sol:S.sol,outcome:'Missed',detail:reason+' The 2-part bond was spent; −5 Fame. '+rival+' gains +8 appeal for 30 sols.'});
  o.history=o.history.slice(0,12);o.active=null;
  log('Project missed: '+CONTRACTS[a.id].name+'. '+reason+' '+rival+' gains a temporary recruitment advantage.','bad');
}
function accept(id){
  const o=state();if(S.over||o.active||o.completed.includes(id)||!CONTRACTS[id]||S.parts<2)return false;
  S.parts-=2;o.active={id,start:S.sol,deadline:S.sol+CONTRACTS[id].days,streak:0,ready:false,packet:null};
  log('Council promise: '+CONTRACTS[id].name+'. Evidence must be confirmed by sol '+o.active.deadline+'. 2 parts committed.','info');render();return true;
}
function transmit(){
  const a=state().active;if(S.over||!a||!a.ready||a.packet||inBlackout())return false;
  const row=ephemeris(),duration=replySols();
  a.packet={left:duration,total:duration,sent:S.sol,date:row.date,minutes:row.minutes,au:row.au};
  log('Evidence sent. Round-trip signal: '+(2*row.minutes).toFixed(1)+' minutes, compressed to '+duration+' game sols. The grant is not here yet.','info');render();return true;
}
function step(){
  const o=state();if(o.lastStepSol===S.sol)return;o.lastStepSol=S.sol;if(o.rivalBoost&&S.sol>=o.rivalBoost.until)o.rivalBoost=null;
  const a=o.active;if(!a||S.over)return;
  if(a.packet){
    if(!inBlackout())a.packet.left=Math.max(0,a.packet.left-1);
    if(a.packet.left===0&&S.sol<=a.deadline){
      S.parts+=8;addFame(6,'Evidence-backed colony project completed.');o.completed.push(a.id);
      o.history.unshift({id:a.id,sol:S.sol,outcome:'Confirmed',detail:'3 successful sols demonstrated. Earth confirmed the evidence; +6 grant parts, 2-part bond returned, +6 Fame. '+CONTRACTS[a.id].lesson});
      o.history=o.history.slice(0,12);o.active=null;log('Earth confirmed '+CONTRACTS[a.id].name+': +8 parts (including bond) and +6 Fame.','good');return;
    }
  } else if(!a.ready){
    a.streak=CONTRACTS[a.id].passes(S.eco||compute())?a.streak+1:0;
    if(a.streak>=3){a.ready=true;log('Project evidence is ready. Open Council and send it before the deadline.','good');}
  }
  if(S.sol>=a.deadline)fail('Earth did not confirm the evidence before the deadline.');
}
const baseTick=tickSol;tickSol=function(){const before=S.sol;baseTick();if(S.sol!==before)step();};G.tickSol=tickSol;
// Temporary recruiting advantage affects actual passenger allocation, not just a ledger label.
const baseSplit=splitPool;splitPool=function(pool,appeals){const b=state().rivalBoost;if(b&&S.sol<b.until){appeals=appeals.slice();appeals[b.index+1]+=b.amount;}return baseSplit(pool,appeals);};G.splitPool=splitPool;
const button=(label,action,disabled=false)=>`<button type="button" data-op="${action}" ${disabled?'disabled':''}>${label}</button>`;
const source=(key,label='Science source')=>`<a href="${SOURCES[key]}" target="_blank" rel="noopener">${label}</a>`;
let siteType='moxie',siteChoice=0;
function section(tab,id){const host=document.querySelector(`[data-panel="${tab}"]`);let el=$(id);if(!el){el=document.createElement('section');el.id=id;el.className='operations';host.insertBefore(el,host.querySelector('h2')?.nextSibling||host.firstChild);}return el;}
function councilHTML(){
 const o=state(),a=o.active;
 const rules='<details><summary>What is at stake?</summary><p>One project at a time. Commit 2 parts. Success returns the bond and grants 6 parts and 6 Fame. Missing or cancelling costs the bond and 5 Fame; one rival gets +8 appeal for 30 sols, competing harder for newcomers. Each project pays out once. These are fictional training contracts.</p></details>';
 if(!a)return `<h3>Choose a council promise</h3><p>What can your colony prove? Choose a project you can afford to finish. You may keep building without taking one.</p>${rules}`+Object.entries(CONTRACTS).map(([id,c])=>`<article class="op-card"><small>${c.speaker}</small><h3>${c.name}</h3><p>${c.aim}</p><p><b>${c.days} sols</b> including Earth’s reply. Reply now: about ${replySols()} sols.</p>${button(o.completed.includes(id)?'Completed':'Review promise · 2 parts','review:'+id,o.completed.includes(id)||S.parts<2||S.over)}</article>`).join('');
 const c=CONTRACTS[a.id],eta=a.packet?a.packet.left:replySols();
 return `<h3>${c.name}</h3><p>${c.aim}</p><p class="op-deadline">${Math.max(0,a.deadline-S.sol)} sols left · deadline ${a.deadline}</p><ol class="op-stages"><li>Promise made · 2 parts committed</li><li>${a.ready?'Evidence collected':a.streak+' / 3 successful sols in a row'}</li><li>${a.packet?'Earth reply: '+a.packet.left+' sols'+(inBlackout()?' · on hold during blackout':''):'Send evidence · allow about '+eta+' sols'}</li></ol><progress max="3" value="${a.packet?2:a.ready?1.8:a.streak/3}"></progress><p>${explain(c,a)}</p>${button(a.packet?'Evidence in transit':a.ready?'Send evidence to Earth':'Collect evidence first','transmit',!!a.packet||!a.ready||inBlackout()||S.over)}${!a.packet&&inBlackout()?'<p>Radio blackout: no messages can leave.</p>':''}${button('Review cancellation','cancel',S.over)}${rules}<details><summary>What this project teaches</summary><p>${c.lesson}</p>${source(c.source)}</details>`;
}
function explain(c,a){
 if(a.packet)return `Sent using the ${a.packet.date} Horizons sample: ${a.packet.au.toFixed(3)} au between planet centres. One-way light time ${a.packet.minutes.toFixed(1)} min. Delivery waits if the scripted blackout starts.`;
 const e=S.eco||compute();
 if(a.id==='air')return `Air made ${fmt(e.o2p)} / crew use ${S.pop} each sol. Stored ${fmt(S.o2)} / need ${3*S.pop}. Machines without power: ${e.shut}.`;
 if(a.id==='food')return `Food grown ${fmt(e.foodp)} / crew eat ${S.pop} each sol. Stored ${fmt(S.food)} / need ${3*S.pop}. Seedling greenhouses: ${e.seedlings}.`;
 return `Shelter ${e.shelter} / crew ${S.pop}. Air ${fmt(S.o2)} and food ${fmt(S.food)}: need ${2*S.pop} of each to stop production for two sols.`;
}
function renderSites(){
 const host=section('science','siteLab'),list=candidates(siteType),forecasts=list.map(t=>forecast(siteType,t));
 const potential=t=>siteType==='moxie'?DEF.moxie.o2*t.air*(S.tech.moxie?1.3:1):siteType==='solar'?DEF.solar.power*t.sun:t.type==='lava'?14:6;
 const rows=[['Height · km',list.map(t=>t.elev.toFixed(1))],['Model air · %',list.map(t=>Math.round(t.air*100))],['Model sun · %',list.map(t=>Math.round(t.sun*100))],['Site potential',list.map(t=>fmt(potential(t)))],['Added now',forecasts.map(f=>fmt(siteType==='moxie'?f.air:siteType==='solar'?f.power:f.shelter))],['Power balance',forecasts.map(f=>fmt(f.after.gen-f.after.demand))]];
 const selected=Math.min(siteChoice,Math.max(0,list.length-1)),t=list[selected],f=forecasts[selected];
 host.innerHTML=`<h3>Which site earns its cost?</h3><label>Compare <select id="opSiteType"><option value="moxie">Oxygen extractors</option><option value="solar">Solar panels</option><option value="shield">Radiation shelters</option></select></label><p>Height comes from NASA’s map. Air and sunlight are modeled. ${siteType==='shield'?'Outputs are shelter spaces.':'Outputs are game '+(siteType==='solar'?'power':'air')+' per sol.'}</p><table class="site-comparison"><caption>Three available sites</caption><thead><tr><th scope="col">Compare</th>${list.map((t,i)=>'<th scope="col">'+String.fromCharCode(65+i)+'</th>').join('')}</tr></thead><tbody>${rows.map(([label,values])=>'<tr><th scope="row">'+label+'</th>'+values.map((v,i)=>'<td'+(i===selected?' class="chosen"':'')+'>'+v+'</td>').join('')+'</tr>').join('')}</tbody></table>`+
 (t?`<article class="op-card"><label>Your choice <select id="opSiteChoice">${list.map((t,i)=>'<option value="'+i+'">Site '+String.fromCharCode(65+i)+' · '+coord(t)+'</option>').join('')}</select></label><p><b>${f.after.idle} free workers</b> after completion. ${f.after.shut?f.after.shut+' machines would lose power.':'No machines lose power.'}</p>${siteType==='moxie'&&f.air<=0?'<p class="op-warning">This extractor cannot add air with the current power or staffing. Build its support first.</p>':''}<div class="op-actions">${button('Show chosen site on map','focus:'+t.c+','+t.r)}${button('Build here · '+DEF[siteType].cost+' parts + '+DEF[siteType].metal+' metal','build:'+t.c+','+t.r,!S.unlocked[siteType]||S.parts<DEF[siteType].cost||S.metal<DEF[siteType].metal||S.over)}</div>${!S.unlocked[siteType]?'<small>Finish the current colony objective to unlock this building.</small>':''}</article>`:'<p>No clear sites in your land. Explore with the rover.</p>')+
 `<details><summary>Where do these numbers come from?</summary><p>${source('mola','MOLA terrain')} supplies the existing coarse height sample. Air thickness uses a simplified height model; sunlight uses latitude. Potential assumes power and staffing; Added now uses the current economy. Solar potential assumes clean panels and no dust storm. Production and shelter values are game rules.</p><p>Preview assumes construction is complete and holds weather, crew and technology constant. Arrivals, dust and storms can change the result. Ice and caves are game map rules, not surveyed deposits.</p></details>`;
 $('opSiteType').value=siteType;$('opSiteType').onchange=e=>{siteType=e.target.value;siteChoice=0;renderSites();};
 if(t){$('opSiteChoice').value=selected;$('opSiteChoice').onchange=e=>{siteChoice=Number(e.target.value);renderSites();};}
}
function update(){
 if(!S)return;const o=state(),a=o.active,e=S.eco||compute(),tab=document.querySelector('#rail [aria-pressed="true"]')?.dataset.tab;
 if(tab==='council')section('council','projectCouncil').innerHTML=councilHTML();
 if(tab==='science')renderSites();
 if(tab==='Earth'){
  const h=ephemeris();section('Earth','earthEvidence').innerHTML=`<h3>A signal cannot arrive instantly</h3><p><b>${h.minutes.toFixed(1)} minutes one way</b><br>${(h.minutes*2).toFixed(1)} minutes for a question and reply.</p><p>${h.date} · ${h.au.toFixed(3)} au · ${h.held?'last saved date held':'saved NASA/JPL Horizons calculation'}.</p><p>Project evidence takes about <b>${replySols()} game sols</b> for a reply. One playing second stands for one signal minute; rounded up to whole game sols. Pause freezes transit; faster speeds advance it.</p>${a?.packet?`<progress max="${a.packet.total}" value="${a.packet.total-a.packet.left}"></progress><p>${a.packet.left} sols of travel left${inBlackout()?' · paused by blackout':''}. Deadline: sol ${a.deadline}.</p>`:'<p>Prove a council project, then send your evidence here through the Council.</p>'}<small>Planet-centre down-leg light time; round trip approximated as twice one way. Game sol 1 uses 2023-11-20, one date per game sol. The 14-sol blackout timetable is scripted, not derived from these distances. Cargo still uses the separate six-sol orbital-crate rule.</small><p>${source('horizons','Read the JPL source')}</p>`;
 }
 if(tab==='buildings'){const host=section('buildings','buildEvidence');host.innerHTML='<h3>Predict before you spend</h3><p>Compare three available sites using terrain height, air and sunlight.</p>'+button('Compare sites in Science','sites');}
 if(tab==='chronicle')section('chronicle','projectHistory').innerHTML='<h3>Evidence and consequences</h3>'+(o.history.map(h=>`<article class="op-card"><b>${CONTRACTS[h.id].name} · ${h.outcome}</b><p>Sol ${h.sol}. ${esc(h.detail)}</p></article>`).join('')||'<p>Project outcomes will appear here, including what the colony demonstrated.</p>');
 if(tab==='rivals'&&o.rivalBoost)section('rivals','projectRival').innerHTML=`<h3>Recruitment advantage</h3><p>${esc(S.rivals[o.rivalBoost.index].name)}: +8 appeal when shuttles split their passengers, for ${o.rivalBoost.until-S.sol} more sols. Cause: a missed council promise.</p>`;
 const councilButton=document.querySelector('[data-tab=council]');councilButton.title=a?CONTRACTS[a.id].name+' · '+(a.deadline-S.sol)+' sols left':'Choose a timed colony project';let badge=$('councilDeadline');if(!badge){badge=document.createElement('small');badge.id='councilDeadline';councilButton.append(badge);}badge.textContent=a?(a.deadline-S.sol)+' sols':'';
 const out=$('outliner');let status=$('projectStatus');if(!status){status=document.createElement('section');status.id='projectStatus';status.className='operations';out.prepend(status);}
 status.innerHTML=`<h3>${a?'Council promise':'Choose your next commitment'}</h3>${a?`<p>${CONTRACTS[a.id].name}</p><p><b>${a.deadline-S.sol} sols left</b> · ${a.packet?'reply '+a.packet.left+' sols':a.ready?'evidence ready':a.streak+'/3 steady sols'}</p>`:'<p>Three projects. A deadline, a reward, and a cost if you miss it.</p>'}${button(a?'Review project':'Open Council','council')}<h3>What if production stops?</h3><p>Air: ${(S.o2/Math.max(1,S.pop)).toFixed(1)} sols · Food: ${(S.food/Math.max(1,S.pop)).toFixed(1)} sols<br>Shelter: ${e.shelter} / ${S.pop}</p>`;
}
function action(e){const el=e.target.closest('[data-op]');if(!el||el.disabled)return;const [name,arg]=el.dataset.op.split(':');
 if(name==='council'){Strategy.openTab('council');update();}
 if(name==='sites'){Strategy.openTab('science');update();$('siteLab').scrollIntoView({block:'start'});}
 if(name==='review'){
  const c=CONTRACTS[arg];modal({title:'Make a council promise?',html:`<p><b>${c.name}</b> · ${c.speaker}</p><p>${c.aim}</p><p>Pay 2 parts now. Confirm the evidence by sol ${S.sol+c.days}. Allow about ${replySols()} sols for Earth’s reply, plus any blackout.</p><p><b>Success:</b> +6 grant parts, bond returned, +6 Fame.<br><b>Miss or cancel:</b> bond lost, −5 Fame, a rival gets +8 recruitment appeal for 30 sols.</p><p>${c.lesson}</p>${source(c.source)}`,buttons:[{label:'Commit 2 parts',primary:true,fn:()=>accept(arg)},{label:'Keep planning'}]});
 }
 if(name==='transmit')transmit();
 if(name==='cancel')modal({title:'Cancel this promise?',html:'<p>The 2-part bond will be lost. Lose 5 Fame; a rival gains +8 recruitment appeal for 30 sols. You can attempt the project again.</p>',buttons:[{label:'Cancel promise',fn:()=>{fail('The commander cancelled the project.');render();}},{label:'Keep working',primary:true}]});
 if(name==='focus'||name==='build'){
  const [c,r]=arg.split(',').map(Number),t=tileAt(c,r);if(!t)return;
  if(name==='focus'){R3.target.set(tx(t),0,tz(t));R3.dist=10;$('commandPanel').hidden=true;}
  else {const err=tryBuild(siteType,t);if(!err){render();Strategy.openTab('buildings');buildingPanel(t.build);}}
 }
}
document.addEventListener('click',action);
const baseRender=render;render=function(){baseRender();update();};
const baseOpen=Strategy.openTab;Strategy.openTab=function(t){baseOpen(t);update();};
// Rail handlers keep a private reference to openTab; refresh after their click finishes.
$('rail').addEventListener('click',()=>update());
window.Operations={accept,transmit,step,ephemeris,replySols,forecast,candidates,state,update,contracts:CONTRACTS};
render();
})();
