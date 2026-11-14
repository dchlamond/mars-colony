/* AI-assisted original simulation. Rates, people and rival budgets are fictional teaching models. */
(function(){
'use strict';
const MACHINES=['solar','moxie','green','ice','mine','battery','reactor'];
const METHODS={balanced:{name:'Steady',out:1,input:1,wear:1},conserve:{name:'Economy',out:.7,input:.7,wear:.6},push:{name:'Intensive',out:1.2,input:1.3,wear:2.4}};
const DUTIES={general:'Colony work',maintenance:'Repairs',crops:'Crop research',power:'Power tuning',training:'Skill training'};
const founders=()=>[['Nara','engineering'],['Tavi','growing'],['Ivo','power'],['Mina','engineering'],['Sol','growing'],['Ada','power']].map(([name,skill],id)=>({id,name,skill,level:1,duty:'general',training:0,home:false}));
function ensure(){
 if(!S.management)S.management={version:1,crew:founders(),repairs:[],lastStep:-1};
 S.rivals.forEach((r,i)=>{if(!r.development)r.development={parts:18,metal:12,builds:[],job:null,tradeUntil:0,agenda:i?'Harvest and homes':'Power and protection'};});
 return S.management;
}
function allocation(){
 const m=S.management;if(!m||S.storm?.active&&S.storm.choice==='shelter')return {reserved:0,power:1,food:1,repair:0,active:[]};
 let available=Math.max(0,S.pop-(S.rover?.crew||0)),reserved=0,power=1,food=1,repair=0,active=[];
 for(const p of m.crew){
  if(p.home||p.duty==='general'||p.duty==='maintenance'&&!m.repairs.length||available<=0)continue;
  available--;reserved++;active.push(p.id);const match=p.skill===({maintenance:'engineering',crops:'growing',power:'power'})[p.duty];
  if(p.duty==='maintenance')repair+=match?1+p.level*.5:1;
  if(p.duty==='crops')food+=match?.08*p.level:.03;
  if(p.duty==='power')power-=match?.05*p.level:.02;
 }
 return {reserved,power:Math.max(.8,power),food:Math.min(1.4,food),repair,active};
}
const method=b=>METHODS[b.method]||METHODS.balanced;
const health=b=>!MACHINES.includes(b.type)?1:(b.condition??100)<=0?0:(b.condition??100)>=70?1:Math.max(0,(b.condition??100)/140+.5);
const output=b=>health(b)*(DEF[b.type].worker&&MACHINES.includes(b.type)?method(b).out:1);
const input=b=>MACHINES.includes(b.type)?method(b).input:1;
const same=(a,b)=>a.c===b.c&&a.r===b.r;
const repairFor=b=>S.management?.repairs.find(j=>same(j,b));
const offline=b=>MACHINES.includes(b.type)&&((b.condition??100)<=0||!!repairFor(b)?.started);
function serviceWork(b){const pod=S.builds.find(x=>x.type==='pod');if(!pod)return 6;return 6+Math.max(0,hdist(pod,b)-1)+Math.min(4,Math.ceil(Math.abs(tileAt(pod.c,pod.r).elev-tileAt(b.c,b.r).elev)));}
function repair(b){
 const m=ensure();if(S.over||!S.builds.includes(b)||!b.done||!MACHINES.includes(b.type)||repairFor(b)||S.parts<2||S.metal<1||S.sol<(b.offUntil||0))return false;
 S.parts-=2;S.metal-=1;m.repairs.push({c:b.c,r:b.r,work:serviceWork(b),progress:0,started:false});
 log('Repair queued: '+DEF[b.type].name+'. 2 parts and 1 metal committed. Assign a repair specialist in People.','info');render();return true;
}
function cancelRepair(b){const m=ensure(),j=repairFor(b);if(S.over||!j)return false;if(!j.started){S.parts+=2;S.metal+=1;}m.repairs=m.repairs.filter(x=>x!==j);render();return true;}
function setMethod(b,id){if(S.over||!S.builds.includes(b)||!b.done||!MACHINES.includes(b.type)||!DEF[b.type].worker||!METHODS[id])return false;b.method=id;render();return true;}
function assign(id,duty){const p=ensure().crew.find(p=>p.id===id);if(S.over||!p||p.home||!DUTIES[duty]||duty==='training'&&p.level>=3)return false;p.duty=duty;p.training=0;render();return true;}
function beginSol(){
 const m=ensure();if(m.lastStep===S.sol)return;
 // Departures are permanent for the named founders. Later arrivals join the general crew.
 const present=m.crew.filter(p=>!p.home);while(present.length>S.pop){const p=present.pop();p.home=true;p.duty='general';log(p.name+' went home with the departing crew.','info');}
 const j=m.repairs[0];if(j&&allocation().repair>0){const b=S.builds.find(b=>same(b,j));if(b&&S.sol>=(b.offUntil||0))j.started=true;}
}
function endSol(){
 const m=ensure();if(m.lastStep===S.sol)return;m.lastStep=S.sol;const a=allocation();
 for(const b of S.builds){if(!b.done||!MACHINES.includes(b.type)||offline(b)||S.sol<(b.offUntil||0))continue;
  const working=DEF[b.type].worker?b.on&&b.staffed&&b.powered:true;
  if(working){const before=b.condition??100;b.condition=Math.max(0,before-.10*(DEF[b.type].worker?method(b).wear:.5));if(before>=70&&b.condition<70)log(DEF[b.type].name+' is worn: output is falling. Schedule a repair.','bad');if(before>0&&b.condition===0)log(DEF[b.type].name+' stopped: repairs needed.','bad');}
 }
 const j=m.repairs[0];if(j?.started&&a.repair>0){j.progress+=a.repair;if(j.progress>=j.work){const b=S.builds.find(b=>same(b,j));if(b)b.condition=100;m.repairs.shift();log('Repair finished. Machine restored to full condition.','good');}}
 for(const p of m.crew)if(p.duty==='training'&&a.active.includes(p.id)){p.training++;if(p.training>=12){p.level=Math.min(3,p.level+1);p.duty='general';p.training=0;log(p.name+' completed skill training: level '+p.level+'.','good');}}
 developRivals();
}
function rivalAppeal(r){const d=r.development;if(!d)return 0;return Math.min(12,d.builds.reduce((n,b)=>n+({habitat:3,green:3,shield:2,solar:1,mine:1}[b.type]||0),0));}
function developRivals(){
 S.rivals.forEach((r,i)=>{
  const d=r.development;if(S.sol%30===0&&!inBlackout()){d.parts=Math.min(60,d.parts+8);d.metal=Math.min(60,d.metal+3);}
  if(S.storm?.active)return;
  d.metal=Math.min(60,d.metal+d.builds.filter(b=>b.type==='mine').length*.25);
  if(d.job){d.job.progress+=Math.max(1,Math.min(3,Math.floor(r.pop/4)));if(d.job.progress>=DEF[d.job.type].work){d.builds.push({...d.job});log(r.name+' completed '+DEF[d.job.type].name+'. Its recruitment appeal increased.','info');d.job=null;}return;}
  const plan=i?['green','habitat','solar','mine','shield','habitat']:['solar','shield','mine','habitat','green','solar'];
  if(d.builds.length>=plan.length)return;const type=plan[d.builds.length],def=DEF[type];
  const t=S.tiles.filter(t=>t.owner===i+1&&!t.build&&t.type!=='rock'&&!same(t,r)&&!d.builds.some(b=>same(b,t))).sort((a,b)=>hdist(a,r)-hdist(b,r)||a.r-b.r||a.c-b.c)[0];
  if(!t||d.parts<def.cost||d.metal<def.metal)return;
  d.parts-=def.cost;d.metal-=def.metal;d.job={type,c:t.c,r:t.r,progress:0};
 });
}
function trade(i){const r=S.rivals[i],d=r?.development;if(S.over||!d||S.metal<6||d.parts<3||d.metal>54||S.sol<d.tradeUntil||S.storm?.active)return false;S.metal-=6;S.parts+=3;d.parts-=3;d.metal+=6;d.tradeUntil=S.sol+30;log('Trade with '+r.name+': 6 metal for 3 parts. Their construction budget now has fewer parts.','info');render();return true;}
function preview(change){const real=S;try{S={...S,builds:S.builds.map(b=>({...b})),management:JSON.parse(JSON.stringify(ensure()))};const before=compute();change(S);const next=S.management.repairs[0];if(next&&allocation().repair>0)next.started=true;return {before,after:compute()};}finally{S=real;}}
const delta=(a,b)=>`${fmt(a)} → ${fmt(b)}`;
function forecastText(f){return `<p>Air / sol <b>${delta(f.before.o2p,f.after.o2p)}</b><br>Food / sol <b>${delta(f.before.foodp,f.after.foodp)}</b><br>Power balance <b>${delta(f.before.gen-f.before.demand,f.after.gen-f.after.demand)}</b><br>Builders available <b>${delta(f.before.idle,f.after.idle)}</b></p><p>Your ${S.pop} crew use ${S.pop} air and ${S.pop} food each sol.</p>`;}
const btn=(label,action,disabled=false)=>`<button type="button" data-system="${action}" ${disabled?'disabled':''}>${label}</button>`;
function section(tab,id){const host=document.querySelector(`[data-panel="${tab}"]`);let el=$(id);if(!el){el=document.createElement('section');el.id=id;el.className='operations';if(id==='machineCare')$('selection').after(el);else host.append(el);}return el;}
function peopleHTML(){const m=ensure(),a=allocation();return `<h3>One person, one job</h3><p>${a.reserved} crew on specialist duties · ${compute().idle} available builders. New arrivals join colony work. Specialists leave machine operation and construction.</p><details><summary>What does each duty do?</summary><p>Matching skills improve results. Crop specialists add 8% yield per skill level (40% colony cap); power specialists reduce machine power use 5% per level (20% cap). Other skills add 3% crops or save 2% power. Repairs use 1.5 work per sol at engineering level 1, +0.5 per level; other skills use 1. Training takes 12 working sols and raises a skill to level 3.</p></details>`+m.crew.map(p=>`<article class="op-card"><h3>${p.name} <small>${p.skill} · level ${p.level}</small></h3>${p.home?'<p>Returned home</p>':`<label>Duty <select data-duty="${p.id}" ${S.over?'disabled':''} aria-label="${p.name} duty">${Object.entries(DUTIES).map(([id,label])=>`<option value="${id}" ${p.duty===id?'selected':''} ${id==='training'&&p.level>=3?'disabled':''}>${label}</option>`).join('')}</select></label><p>${p.duty==='training'?p.training+' / 12 training sols. Changing duties loses this course’s progress.':p.duty==='maintenance'&&!m.repairs.length?'No repairs queued: helping with colony work.':p.duty!=='general'&&!a.active.includes(p.id)?'Waiting: crew away or sheltering.':'Working with the colony.'}</p>`}</article>`).join('')+'<small>Fictional adult crew. No personal data collected.</small>';}
let selected=null;
function buildingHTML(b){const j=repairFor(b),key=b.c+','+b.r;return `<h3>Keep it working</h3><p>Condition <b>${Math.round(b.condition??100)}%</b> · output factor ${Math.round(health(b)*100)}%. Output starts falling below 70%; at 0% the machine stops.</p>${DEF[b.type].worker?`<label>Production method <select data-method="${key}" ${S.over?'disabled':''}>${Object.entries(METHODS).map(([id,m])=>`<option value="${id}" ${(b.method||'balanced')===id?'selected':''}>${m.name}</option>`).join('')}</select></label><p>Economy: 70% output, 70% power, 60% wear.<br>Steady: 100% of each.<br>Intensive: 120% output, 130% power, 240% wear.</p>`:''}${j?`<p>${j.started?'Offline for repair':'Queued · still operating'}: ${fmt(j.progress)} / ${j.work} work. ${allocation().repair>0?'Crew assigned.':'Assign someone to Repairs in People.'}</p>${btn(j.started?'Cancel · no materials returned':'Cancel · refund materials','cancel:'+key,S.over)}`:`<p>Service route: <b>${serviceWork(b)} work</b> (6 base, distance from lander, and up to 4 extra work from NASA map height differences). These are game work units, not a real travel-time estimate.</p>${btn('Review repair · 2 parts + 1 metal','repair:'+key,S.over||S.parts<2||S.metal<1||S.sol<(b.offUntil||0))}`}<details><summary>Why does this matter?</summary><p>A repair takes a machine offline. Save air, food and power first. Repairing a battery also lowers storage capacity; charge beyond the remaining capacity is lost next sol. Spare parts spent here cannot build a new greenhouse. NASA studies both maintenance time and crew availability; our wear rates are invented for play. Panel dust is separate: cleaning restores sunlight, repairs restore equipment.</p><a href="https://www.nasa.gov/general/establishing-a-maintenance-timeline-in-space-featuring-chase-lynch/" target="_blank" rel="noopener">NASA: planning maintenance time</a></details>`;}
function rivalsHTML(){return '<h3>Their next moves</h3><p>Each colony has a limited development budget and one construction crew. Finished facilities raise recruitment appeal, competing for the same shuttles. This is a simplified development model; rivals do not simulate your full air and food economy.</p>'+S.rivals.map((r,i)=>{const d=r.development,j=d.job;return `<article class="op-card"><h3>${r.name}</h3><p>Agenda: <b>${d.agenda}</b><br>Budget: ${fmt(d.parts)} parts · ${fmt(d.metal)} metal<br>Facilities: ${d.builds.length} · recruitment bonus +${rivalAppeal(r)}</p><p>${j?'Building '+DEF[j.type].name+': '+fmt(j.progress)+' / '+DEF[j.type].work+' work.':d.builds.length>=6?'Development plan complete.':'Saving resources for the next facility.'} ${S.storm?.active?'Construction paused for the storm.':''}</p><p>Trade 6 of your metal for 3 of their parts. This reduces their building budget. One trade per 30 sols per colony; storm travel pauses trade. Their metal store holds 60.</p>${btn(S.sol<d.tradeUntil?'Trade ready in '+(d.tradeUntil-S.sol)+' sols':'Trade · 6 metal for 3 parts','trade:'+i,S.over||S.metal<6||d.parts<3||d.metal>54||S.sol<d.tradeUntil||S.storm?.active)}</article>`;}).join('');}
let rivalGroup=null,rivalSignature='';
function drawRivals(){
 if(!R3)return;const sig=S.seed+JSON.stringify(S.rivals.map(r=>[r.development.builds,r.development.job?.type,r.development.job?.c,r.development.job?.r]));
 if(rivalGroup?.parent===R3.overlay&&sig===rivalSignature)return;
 if(rivalGroup)rivalGroup.parent?.remove(rivalGroup);
 rivalGroup=new THREE.Group();R3.overlay.add(rivalGroup);rivalSignature=sig;
 for(const r of S.rivals){const d=r.development;for(const b of [...d.builds,...(d.job?[d.job]:[])]){const t=tileAt(b.c,b.r),g=new THREE.Group();fillBuilding(g,b.type);g.position.set(tx(t),tileY(t)+.03,tz(t));if(b===d.job)g.scale.setScalar(.65);rivalGroup.add(g);}}
}
function update(){ensure();const tab=document.querySelector('#rail [aria-pressed="true"]')?.dataset.tab;if(tab==='people')section('people','crewDuties').innerHTML=peopleHTML();if(tab==='rivals')section('rivals','rivalPlans').innerHTML=rivalsHTML();
 if(tab==='buildings'&&selected){const b=S.builds.find(b=>same(b,selected));if(b?.done&&MACHINES.includes(b.type))section('buildings','machineCare').innerHTML=buildingHTML(b);else $('machineCare')?.remove();}
 drawRivals();
 $('wornMachines')?.remove();const low=S.builds.filter(b=>b.done&&MACHINES.includes(b.type)&&(b.condition??100)<70);if(low.length){const n=document.createElement('p');n.className='op-warning';n.textContent=low.length+' worn machines · inspect Buildings';n.id='wornMachines';$('wornMachines')?.remove();$('outliner').append(n);}
}
const oldBuilding=buildingPanel;buildingPanel=function(b){oldBuilding(b);selected={c:b.c,r:b.r};update();};
const oldBadge=badgeFor;badgeFor=function(b){if(b.done&&repairFor(b)?.started)return 'REPAIR';if(b.done&&(b.condition??100)<=0)return 'NEEDS REPAIR';if(b.done&&(b.condition??100)<70)return 'WORN '+Math.round(b.condition)+'%';return oldBadge(b);};
document.addEventListener('change',e=>{
 const duty=e.target.dataset.duty,methodKey=e.target.dataset.method;
 if(duty!==undefined){const id=Number(duty),value=e.target.value,p=ensure().crew.find(p=>p.id===id);e.target.value=p.duty;const f=preview(s=>{s.management.crew.find(p=>p.id===id).duty=value;});modal({title:'Change '+p.name+'’s duty?',html:`<p>${DUTIES[p.duty]} → ${DUTIES[value]}. This reserves one person when the task has work. Changing duty resets unfinished training.</p>${forecastText(f)}`,buttons:[{label:'Assign duty',primary:true,fn:()=>assign(id,value)},{label:'Keep current duty'}]});}
 if(methodKey){const [c,r]=methodKey.split(',').map(Number),b=S.builds.find(b=>b.c===c&&b.r===r),value=e.target.value;e.target.value=b.method||'balanced';const f=preview(s=>{s.builds.find(x=>same(x,b)).method=value;});modal({title:'Change production method?',html:`<p>${METHODS[value].name}: ${Math.round(METHODS[value].out*100)}% output, ${Math.round(METHODS[value].input*100)}% power, ${Math.round(METHODS[value].wear*100)}% wear.</p>${forecastText(f)}<p>Preview uses the current crew and grid. Other machines may lose power.</p>`,buttons:[{label:'Use method',primary:true,fn:()=>setMethod(b,value)},{label:'Keep current method'}]});}
});
document.addEventListener('click',e=>{const el=e.target.closest('[data-system]');if(!el||el.disabled)return;const [action,arg]=el.dataset.system.split(':');if(action==='trade'){trade(Number(arg));return;}const [c,r]=arg.split(',').map(Number),b=S.builds.find(b=>b.c===c&&b.r===r);if(!b)return;
 if(action==='cancel')cancelRepair(b);
 if(action==='repair'){const f=preview(s=>s.management.repairs.push({c,r,started:true}));modal({title:'Take this machine offline?',html:`<p>Pay 2 parts and 1 metal now. ${serviceWork(b)} crew work needed. Assign repair duty in People. The machine stops when the crew starts and stays offline until repaired or cancelled. This offline forecast uses current duties; assigning a repair worker can change it again.</p>${forecastText(f)}<p>Queued repairs refund materials if cancelled before work starts. Started repairs do not.</p>`,buttons:[{label:'Queue repair',primary:true,fn:()=>repair(b)},{label:'Keep operating'}]});}
});
const oldRender=render;render=function(){oldRender();update();};const oldOpen=Strategy.openTab;Strategy.openTab=function(t){oldOpen(t);update();};$('rail').addEventListener('click',update);
window.ColonySystems={hasRepair:b=>!!repairFor(b),repairing:b=>!!repairFor(b)?.started&&allocation().repair>0,ensure,allocation,output,input,offline,serviceWork,repair,cancelRepair,setMethod,assign,beginSol,endSol,rivalAppeal,trade,preview,update};
render();
})();
