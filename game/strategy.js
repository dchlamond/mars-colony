(function(){
/* Original strategy interface. AI-assisted implementation; see AI_USE.md. */
'use strict';
const strategy={tab:'colony',lens:'territory',selected:null,sound:false,volume:.15,history:[]};
const oldHeader=document.querySelector('header'), oldAside=document.querySelector('aside');
const rail=document.createElement('nav'); rail.id='rail';rail.setAttribute('aria-label','Mission panels');
const shell=document.createElement('section');shell.id='commandPanel';shell.setAttribute('aria-label','Mission control');
const out=document.createElement('section');out.id='outliner';out.setAttribute('aria-label','Mission outlook');
const top=document.createElement('header');top.id='strategyTop';
const resources=document.createElement('div');resources.id='resources';
const controls=document.createElement('div');controls.id='missionTime';
controls.append($('clock'),$('speed'));
top.innerHTML='<div class="brand">Mars Colony<small>Junior Mission Trainer</small></div>';top.append(resources,controls);
const tabs=['colony','buildings','people','council','rivals','Earth','science','chronicle','settings'];
const icons=['◇','⌂','♙','◎','⚑','↗','⊙','≡','⚙'];
rail.innerHTML=tabs.map((t,i)=>`<button data-tab="${t}" aria-label="${t}"><span aria-hidden="true">${icons[i]}</span>${t[0].toUpperCase()+t.slice(1)}</button>`).join('');
const panels={};tabs.forEach(t=>{const d=document.createElement('section');d.dataset.panel=t;d.innerHTML=`<h2>${t==='Earth'?'Earth link':t[0].toUpperCase()+t.slice(1)}</h2>`;shell.append(d);panels[t]=d;});
function move(id,tab,card=true){const el=$(id);if(el)panels[tab].append(card?el.closest('.card')||el:el);}
move('advisor','colony');move('meters','colony');move('indepcard','colony');move('build','buildings');move('pop','people');move('earthcard','Earth');move('log','chronicle');
panels.Earth.append($('signal'),$('timewrap'));
const scienceLinks=document.createElement('div');scienceLinks.className='actionlist';scienceLinks.append($('btnScience'),$('btnData'),$('spaceButton'),$('btnCredits'));panels.science.append(scienceLinks);
panels.chronicle.append($('btnJournal'));
oldHeader.remove();oldAside.remove();document.body.append(top,rail,shell,out,$('camctl'),$('fphud'));
const lenses=document.createElement('nav');lenses.id='lenses';lenses.setAttribute('aria-label','Map lenses');lenses.innerHTML='<span>Read the map</span>'+['territory','sunlight','air','ice','caves'].map(t=>`<button data-lens="${t}">${t}</button>`).join('')+'<small id="lensNote">Colony boundaries</small>';document.body.append(lenses);
const toast=document.createElement('div');toast.id='notice';toast.setAttribute('role','status');document.body.append(toast);
function notice(msg){toast.textContent=msg;toast.classList.add('visible');clearTimeout(strategy.noticeTimer);strategy.noticeTimer=setTimeout(()=>toast.classList.remove('visible'),5500);}
function sound(){if(!strategy.sound)return;try{const a=strategy.audio||(strategy.audio=new AudioContext()),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.setValueAtTime(420,a.currentTime);g.gain.setValueAtTime(strategy.volume,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.12);o.start();o.stop(a.currentTime+.12);}catch{}}
function openTab(t){shell.hidden=false;if(strategy.tab!==t)shell.scrollTop=0;strategy.tab=t;Object.entries(panels).forEach(([k,d])=>d.hidden=k!==t);rail.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===t)));updateStrategy();}
rail.onclick=e=>{const b=e.target.closest('[data-tab]');if(b){if(strategy.tab===b.dataset.tab&&!shell.hidden){shell.hidden=true;}else{shell.hidden=false;openTab(b.dataset.tab);}sound();}};
function setLens(name){strategy.lens=name;lenses.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lens===name)));if(!R3)return;if(strategy.lensMesh){R3.scene.remove(strategy.lensMesh);strategy.lensMesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}const g=new THREE.Group();strategy.lensMesh=g;R3.scene.add(g);if(name!=='territory'){for(let i=0;i<8;i++){const ts=S.tiles.filter(t=>name==='sunlight'?Math.min(7,Math.floor(t.sun*8))===i:name==='air'?Math.min(7,Math.floor((t.air-.5)/1.1*8))===i:name==='ice'?i===0&&t.type==='ice':i===0&&t.type==='lava');if(ts.length)g.add(hexFill(ts,name==='ice'?0x9ddbeb:name==='caves'?0xe9b589:new THREE.Color().setHSL(.58-i*.065,.65,.50).getHex(),.50,.15));}}$('lensNote').textContent=({territory:'Colony boundaries',sunlight:'30–100% · simplified latitude model',air:'50–160% · simplified height model',ice:'Likely ice · latitude rule, not a surveyed deposit',caves:'Volcano regions · not mapped cave entrances'})[name];}
lenses.onclick=e=>{const b=e.target.closest('[data-lens]');if(b)setLens(b.dataset.lens);};
const originalRender=render;render=function(){originalRender();updateStrategy();};
function stat(label,value,net,detail){return `<button class="resource" data-resource="${label}" title="${esc(detail)}"><span>${label}</span><b>${value}</b><small>${net}</small></button>`;}
function updateStrategy(){if(!S)return;const e=S.eco||compute();resources.innerHTML=stat('Power',fmt(e.gen),arrow(e.gen-e.demand)+'/sol',`Makes ${fmt(e.gen)}; uses ${fmt(e.demand)}. Stored: ${fmt(S.battery)} / ${e.store}.`)+stat('Air',Math.round(S.o2),arrow(e.o2p-S.pop)+'/sol',`Makes ${fmt(e.o2p)}; crew use ${S.pop} each sol.`)+stat('Food',Math.round(S.food),arrow(e.foodp-S.pop)+'/sol',`Grows ${fmt(e.foodp)}; crew use ${S.pop} each sol.`)+stat('Parts',S.parts,'Earth supplies',`Next ship: ${30-S.sol%30} sols; ${DF.ship} parts.`)+stat('Metal',Math.floor(S.metal),'+'+fmt(e.metalp)+'/sol','Made by staffed, powered mines.');
const jobs=S.builds.filter(b=>!b.done);out.innerHTML=`<div class="outhead"><b>${esc(ME.name)}</b><span>${S.speed?'Time running':'Paused · plan freely'}</span></div><button id="attention">${S.storm?'Storm: check shelter':e.o2p<S.pop?'Air is falling':e.foodp<S.pop?'Food is falling':'Review your next goal'}</button><h3>Next objective</h3><p>${esc(GOALS[S.goal].text)}</p><h3>Building queue · ${jobs.length}/4</h3>${jobs.map((b,i)=>`<button class="queuejob" data-job="${S.builds.indexOf(b)}">${i+1}. ${DEF[b.type].name}<progress max="${DEF[b.type].work}" value="${b.progress}"></progress><small>${i?'Waiting for builders':e.idle+' free builders'} · ${Math.floor(b.progress)}/${DEF[b.type].work}</small></button>`).join('')||'<p>No work queued. Choose Buildings to start.</p>'}<h3>Conditions</h3><p>${Math.round(S.panelClean*100)}% panel cleanliness${S.cleaning?' · cleaning '+S.cleaning+' sols':''}</p>${S.dust?'<p>Dust '+(S.dust.active?'ends in '+(S.dust.end-S.sol):'arrives in '+(S.dust.arrive-S.sol))+' sols</p>':''}${S.storm?'<p>Solar storm '+(S.storm.active?'active':'in '+(S.storm.arrive-S.sol)+' sols')+'</p>':''}<p>Next crew shuttle: ${10-S.sol%10} sols</p><p>Supply ship: ${30-S.sol%30} sols</p><p>${S.pop} crew · ${e.shelter} shelter spaces · ${e.beds} beds</p>`;
$('attention').onclick=()=>openTab('colony');out.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>buildingPanel(S.builds[+b.dataset.job]));
resources.querySelectorAll('button').forEach(b=>b.onclick=()=>{openTab('colony');notice(b.title);});
if(strategy.tab==='buildings')updateBuildings();if(strategy.tab==='council')panels.council.innerHTML='<h2>Council</h2><h3>Rova · mission advisor</h3><p>'+esc(S.say||GOALS[S.goal].say)+'</p><p>Predict the next sol before pressing Play. Which reserve will fall first?</p>';
if(strategy.tab==='rivals')panels.rivals.innerHTML='<h2>Colony ledger</h2><p>Every new arrival needs air, food and a bed. Other colonies compete for the same ships.</p><table><tr><th>Colony</th><th>People</th><th>Appeal</th></tr>'+[{name:ME.name,pop:S.pop,appeal:S.appeal},...S.rivals].map(r=>`<tr><td>${esc(r.name)}</td><td>${r.pop}</td><td>${Math.round(r.appeal)}%</td></tr>`).join('')+'</table><h3>Arrivals</h3><p>'+esc($('splittxt').textContent)+'</p>';
}
function updateBuildings(){let list=$('buildingList');if(!list){list=document.createElement('div');list.id='buildingList';panels.buildings.append(list);}list.innerHTML='<h3>Your buildings</h3>'+S.builds.map((b,i)=>`<button class="buildingrow" data-b="${i}">${DEF[b.type].name}<small>${b.done?'Level '+(b.lvl||1)+(b.on?' · on':' · off'):'Under construction'}${S.sol<(b.offUntil||0)?' · upgrade '+(b.offUntil-S.sol)+' sols':''}</small></button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=()=>buildingPanel(S.builds[+b.dataset.b]));}
buildingPanel=function(b){strategy.selected=b;openTab('buildings');let d=$('selection');if(!d){d=document.createElement('section');d.id='selection';panels.buildings.prepend(d);}const def=DEF[b.type],u=UPG[b.type],f=FACTS[b.type];d.innerHTML=`<h2>${def.name}</h2><p>${def.desc}</p><p>${b.done?'Level '+(b.lvl||1):'Building: '+Math.floor(b.progress)+' / '+def.work+' work'}</p>${f?`<details><summary>Why this matters on Mars</summary><p>${f.t}</p>${link(f.s,f.u)}</details>`:''}<div class="actionlist">${!b.done?'<button id="cancelJob">Cancel · refund materials</button>':def.worker?'<button id="switchBuilding">'+(b.on?'Switch off':'Switch on')+'</button>':''}${b.done&&u&&(b.lvl||1)===1?`<p>Upgrade: ${u.txt}. Costs ${upCost(b).parts} parts + 6 metal. Off for 4 sols.</p><button id="upgradeBuilding">Confirm upgrade</button>`:''}</div>`;if($('cancelJob'))$('cancelJob').onclick=()=>{cancel(b);d.remove();render();};if($('switchBuilding'))$('switchBuilding').onclick=()=>{toggle(b);render();buildingPanel(b);};if($('upgradeBuilding'))$('upgradeBuilding').onclick=()=>{const err=upgrade(b);notice(err||'Upgrade started. Building offline for 4 sols.');render();buildingPanel(b);};};
const baseTryBuild=tryBuild;tryBuild=function(type,t){const result=baseTryBuild(type,t);if(result)notice(result);else{notice(DEF[type].name+' placed. See the building queue.');sound();S.eco=compute();syncScene();}return result;};window.G.tryBuild=tryBuild;
const baseModal=modal;modal=function(m){if(!m.keepOpen&&m.buttons?.length===1&&!/Mission|Mars Colony|site|Correct|Not quite|School|Science|Data sources|Credits/i.test(m.title)){notice(m.title);S.journal.push({title:m.title,why:m.html.replace(/<[^>]*>/g,' '),src:'Mission record',u:''});return;}baseModal(m);};
const baseTick=tickSol;tickSol=function(){baseTick();if(S.sol%10===0){strategy.history.push({sol:S.sol,pop:S.pop,rivals:S.rivals.map(r=>r.pop)});if(strategy.history.length>200)strategy.history.shift();}};window.G.tickSol=tickSol;
const SAVE_KEY='mars-colony-save',SAVE_VERSION=2;
function savedMissionStatus(){
 try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return {available:false,message:'No saved mission in this browser yet. Choose Begin mission.'};validateMission(JSON.parse(raw));return {available:true,message:'A saved mission is available on this device.'};}
 catch(e){return {available:false,message:e.name==='SecurityError'?'This browser cannot save progress. You can still begin and play.':'The saved mission could not be read. You can begin a new mission.'};}
}
function captureMission(){
 const clean=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!['mesh','astro','decor','solid','build'].includes(k)));
 const captured=window.Junior?.capture?Junior.capture():{state:{...S,tiles:S.tiles.map(clean),builds:S.builds.map(clean)},rngState:rng.state};
 if(captured.state.junior&&S.junior.checkpoint)captured.state.junior.checkpoint=JSON.parse(JSON.stringify(S.junior.checkpoint));
 return {version:SAVE_VERSION,state:captured.state,rngState:captured.rngState,me:{...ME},diff:DIFFS.indexOf(DF),history:strategy.history.slice(-200)};
}
function validateRockFinds(state){
 if(state.rockFinds===undefined)return;
 const fail=()=>{throw Error('This save has invalid rock discoveries.');};
 const record=value=>{if(!value||typeof value!=='object'||Array.isArray(value))return false;const prototype=Object.getPrototypeOf(value);return prototype===null||Object.getPrototypeOf(prototype)===null;};
 const fields=(value,keys)=>Reflect.ownKeys(value).length===keys.length&&keys.every(key=>Object.prototype.hasOwnProperty.call(value,key));
 const ledger=state.rockFinds;
 if(!record(ledger)||!fields(ledger,['version','entries'])||ledger.version!==1||!record(ledger.entries)||Reflect.ownKeys(ledger.entries).length>500)fail();
 for(const id of Reflect.ownKeys(ledger.entries)){
  if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9:._/-]{0,127}$/.test(id)||['__proto__','constructor','prototype'].includes(id))fail();
  const entry=ledger.entries[id],limit=entry?.kind==='parts'?3:entry?.kind==='water'||entry?.kind==='air'?5:null;
  if(!record(entry)||!fields(entry,['kind','amount','sol','rewarded'])||limit===null||!Number.isFinite(entry.amount)||entry.amount<0||entry.amount>limit||!Number.isSafeInteger(entry.sol)||entry.sol<0||entry.sol>state.sol||typeof entry.rewarded!=='boolean'||entry.rewarded!==(entry.amount>0))fail();
 }
}
function validateMission(data){
 if(!data||![1,SAVE_VERSION].includes(data.version))throw Error('This save version is not supported. Your current mission is unchanged.');
 const s=data.state;
 if(!s||!Array.isArray(s.tiles)||s.tiles.length!==COLS*ROWS||!Array.isArray(s.builds)||!s.builds.length||s.builds.length>COLS*ROWS)throw Error('This save has an incomplete map.');
 for(const key of ['seed','sol','pop','o2','food','parts','metal','battery','fame'])if(!Number.isFinite(s[key]))throw Error('This save has an invalid '+key+' value.');
 if(s.sol<1||!Number.isInteger(s.pop)||s.pop<0||s.o2<0||s.food<0||s.parts<0||s.battery<0)throw Error('This save has invalid resource values.');
 for(const [i,t] of s.tiles.entries())if(!t||t.c!==i%COLS||t.r!==Math.floor(i/COLS)||!['plain','ice','lava','rock'].includes(t.type)||!['sun','air','elev'].every(k=>Number.isFinite(t[k])))throw Error('This save has invalid terrain.');
 const occupied=new Set();
 for(const b of s.builds){const k=b?.c+','+b?.r;if(!b||!DEF[b.type]||!Number.isInteger(b.c)||!Number.isInteger(b.r)||b.c<0||b.c>=COLS||b.r<0||b.r>=ROWS||occupied.has(k))throw Error('This save has invalid buildings.');occupied.add(k);}
 if(s.builds[0].type!=='pod'||!s.site||typeof s.site.name!=='string'||!Array.isArray(s.rivals)||!Array.isArray(s.orders)||!Array.isArray(s.log)||!Array.isArray(s.journal)||!s.tech||!s.unlocked||!s.seenFacts||!s.answers)throw Error('This save is incomplete.');
 if(!data.me||typeof data.me.name!=='string'||data.me.name.length>100||!/^#[0-9a-f]{6}$/i.test(data.me.css)||!Number.isInteger(data.me.color)||!Number.isInteger(data.diff)||!DIFFS[data.diff])throw Error('This save has invalid mission settings.');
 if(data.rngState!==undefined&&!Number.isFinite(data.rngState))throw Error('This save has invalid random state.');
 if(s.junior){if(!Number.isFinite(s.water))s.water=64;Junior.validateCapture({version:1,state:s,rngState:data.rngState});if(s.junior.checkpoint)Junior.validateCapture({version:1,state:s.junior.checkpoint,rngState:s.junior.checkpoint._rngState});}
 else if(s.blackout)throw Error('A blackout mission requires Junior rules.');
 if(s.water!==undefined&&(!Number.isFinite(s.water)||s.water<0))throw Error('This save has invalid water.');
 if(s.campaign){const c=s.campaign;if(c.version!==1||!Array.isArray(c.arrivals)||c.arrivals.length>12||!Array.isArray(c.districts)||c.districts.length>COLS*ROWS||!['dryDays','unsafeDays','warningDay'].every(k=>Number.isFinite(c[k])&&c[k]>=0))throw Error('This save has invalid campaign progress.');
  if(c.pending&&(!Number.isFinite(c.pending.deadline)||!Number.isInteger(c.pending.pool)||c.pending.pool<0||c.pending.pool>100))throw Error('This save has an invalid shuttle countdown.');
  for(const a of c.arrivals)if(!Array.isArray(a.names)||!Array.isArray(a.seats)||a.names.length!==a.seats.length||!a.names.every(n=>typeof n==='string')||!a.seats.every(n=>Number.isInteger(n)&&n>=0&&n<=100)||!Number.isFinite(a.waiting))throw Error('This save has invalid arrival records.');
 }
 if(s.fieldDiscoveries&&(s.fieldDiscoveries.version!==1||!s.fieldDiscoveries.entries||typeof s.fieldDiscoveries.entries!=='object'||Object.keys(s.fieldDiscoveries.entries).length>20))throw Error('This save has invalid discoveries.');
 validateRockFinds(s);if(s.junior?.checkpoint)validateRockFinds(s.junior.checkpoint);
 return data;
}
function saveMission(){
 if(window.Classroom?.connected){notice('Room progress is saved automatically in this tab. Leave the room to save a solo mission.');return false;}
 try{
  const data=validateMission(captureMission()),encoded=JSON.stringify(data),previous=localStorage.getItem(SAVE_KEY);
  // Keep the last readable save before replacing it; a quota/storage failure
  // leaves the previous main save intact and is explained to the player.
  if(previous){try{validateMission(JSON.parse(previous));localStorage.setItem(SAVE_KEY+'-backup',previous);}catch(e){if(e.name==='QuotaExceededError'||e.name==='SecurityError')throw e;}}
  localStorage.setItem(SAVE_KEY,encoded);notice('Mission saved on this device.');document.dispatchEvent(new CustomEvent('strategy:saved'));return true;
 }catch(e){notice('Save failed. '+(/quota|storage|denied/i.test(e.message||'')?'Device storage is unavailable or full. Keep this tab open and export your mission evidence.':e.message));return false;}
}
function applyMission(data){
 if(R3?.fp)toggleWalk();
 ME={...data.me};DF=DIFFS[data.diff];
 if(data.state.junior){const checkpoint=data.state.junior.checkpoint;Junior.restore({version:1,state:data.state,rngState:data.rngState},{render:false,checkpoint:false});if(checkpoint)S.junior.checkpoint=checkpoint;else Junior.checkpoint();}
 else{S=JSON.parse(JSON.stringify(data.state));rng=mulberry(data.rngState??S.seed);S.tiles.forEach(t=>delete t.build);S.builds.forEach(b=>{tileAt(b.c,b.r).build=b;});}
 DEF.reactor.cost=S.tech.reactor?14:24;strategy.history=Array.isArray(data.history)?data.history.slice(-200):[];
 S.speed=0;buildSel=null;modalQ=[];modalOpen=false;$('overlay').style.display='none';S.eco=compute();
 if(R3)buildWorld();buildMenu();render();setLens(strategy.lens);document.dispatchEvent(new CustomEvent('blackout:update'));document.dispatchEvent(new CustomEvent('strategy:loaded'));
}
function loadMission(){
 if(window.Classroom?.connected){notice('Leave the classroom room before loading a solo mission.');return false;}
 let previous=null,mutating=false;
 try{
  const raw=localStorage.getItem(SAVE_KEY);if(!raw)throw Error('No saved mission on this device yet.');
  const data=validateMission(JSON.parse(raw));previous=captureMission();
  if(data.version===1)localStorage.setItem(SAVE_KEY+'-backup',raw);
  mutating=true;applyMission(data);notice('Saved mission restored, paused.');return true;
 }catch(e){if(mutating&&previous){try{applyMission(previous);}catch{}}notice('Could not load mission. '+(e instanceof SyntaxError?'The save is damaged; your current mission is unchanged.':e.message));return false;}
}
panels.settings.innerHTML='<h2>Mission settings</h2><div class="actionlist"><button id="saveMission">Save on this device</button><button id="loadMission">Continue saved mission</button><label><input type="checkbox" id="soundSetting"> Sound</label><label>Volume <input type="range" id="volumeSetting" min="0" max="30" value="15"></label><label><input type="checkbox" id="motionSetting"> Reduce motion</label><label><input type="checkbox" id="contrastSetting"> High contrast</label><label>Text size <select id="textSetting"><option value="16">Standard</option><option value="18">Large</option><option value="20">Largest</option></select></label></div><h3>Game rules</h3><p id="ruleSummary"></p><p>No accounts, uploads or tracking. A saved mission stays in this browser on this device.</p>';
const teacherButton=document.createElement('button');teacherButton.id='teacherKit';teacherButton.textContent='Teacher & playtest kit';teacherButton.onclick=()=>{const src=window.INLINE?.['teacher-kit.html']||'teacher-kit.html';modal({title:'Teacher & playtest kit',keepOpen:true,html:'<iframe title="Teacher and playtest kit" src="'+src+'" style="width:100%;height:min(65vh,650px);border:0;background:#fff"></iframe>',buttons:[{label:'Back to my colony',primary:true,fn:()=>{}}]});};panels.settings.append(teacherButton);
$('saveMission').onclick=saveMission;$('loadMission').onclick=loadMission;$('soundSetting').onchange=e=>strategy.sound=e.target.checked;$('volumeSetting').oninput=e=>strategy.volume=+e.target.value/100;$('motionSetting').onchange=e=>document.body.classList.toggle('reduce-motion',e.target.checked);$('contrastSetting').onchange=e=>document.body.classList.toggle('high-contrast',e.target.checked);$('textSetting').onchange=e=>document.documentElement.style.setProperty('--game-text',e.target.value+'px');
const originalOpen=openTab;openTab=function(t){originalOpen(t);if(t==='settings')$('ruleSummary').textContent=(window.Blackout?.isActive()?'Blackout · six crew, nine days, one changed decision and two futures':window.Junior?.isActive()?'Junior · one goal at a time, automatic jobs, Parts costs, checkpoint retries':DF.key)+' · '+S.site.name+' · Seed '+S.seed+' · all quantities are simplified game units.';};
const camera=document.createElement('button');camera.className='btn';camera.id='takePhoto';camera.textContent='Take photo · P';$('camctl').append(camera);
function takePhoto(){if(!R3?.fp){notice('Enter Walk on Mars first.');return;}try{if(window.AresRender)AresRender.render();else R3.renderer.render(R3.scene,R3.cam);const c=document.createElement('canvas');c.width=960;c.height=540;const ctx=c.getContext('2d');ctx.drawImage(R3.renderer.domElement,0,0,960,540);ctx.fillStyle='#101d29';ctx.fillRect(0,492,960,48);ctx.fillStyle='#fff';ctx.font='15px sans-serif';const t=tileNear(R3.fp.x,R3.fp.z);ctx.fillText(ME.name+' · Sol '+S.sol+' · '+S.site.name+' · '+(t?coord(t):''),14,512);ctx.fillText('Game render · includes AI-generated textures · not a NASA photograph',14,532);const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='Mars-Colony-sol-'+S.sol+'.png';a.click();sound();notice('Photo prepared as a PNG.');}catch{notice('This browser could not save the picture.');}}camera.onclick=takePhoto;
document.addEventListener('keydown',e=>{if(/input|textarea|select/i.test(e.target.tagName))return;if(e.key.toLowerCase()==='p'&&R3?.fp)takePhoto();});
const baseWalkStep=walkStep;walkStep=function(dt){if(modalOpen)return;baseWalkStep(dt);R3.overlay.visible=true;const t=tileNear(R3.fp.x,R3.fp.z);if(t?.owner)$('fphud').textContent=S.rivals[t.owner-1].name+' territory · visiting only, no building';};window.G.walkStep=walkStep;
// Preserve all existing science and facts. Rendering remains separate from the base economy.
window.Strategy={openTab,setLens,saveMission,loadMission,savedMissionStatus,captureMission,validateMission,restoreMission:data=>applyMission(validateMission(data)),update:updateStrategy};
const closePanel=document.createElement('button');closePanel.id='closePanel';closePanel.textContent='Close panel';closePanel.onclick=()=>shell.hidden=true;shell.prepend(closePanel);
const continueBtn=document.createElement('button');continueBtn.className='btn';continueBtn.textContent='Continue saved mission';continueBtn.onclick=loadMission;$('modal').querySelector('.btns')?.append(continueBtn);
openTab('colony');setLens('territory');setSpeed(0);render();resize3D();
const fit=()=>{document.documentElement.style.setProperty('--shell-height',top.getBoundingClientRect().height+'px');document.documentElement.style.setProperty('--dock-height',lenses.getBoundingClientRect().height+'px');document.documentElement.style.setProperty('--camera-height',$('camctl').getBoundingClientRect().height+'px');};new ResizeObserver(fit).observe(top);new ResizeObserver(fit).observe(lenses);new ResizeObserver(fit).observe($('camctl'));fit();

})();
