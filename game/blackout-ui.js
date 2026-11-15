/* Original BLACKOUT mission presentation. Rules live in blackout.js; UI never edits resources. */
(function () {
  'use strict';
  if (!window.AresUI || !window.Blackout) return;
  const byId = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined,{maximumFractionDigits:1}) : '—';
  const icon = name => AresUI.icon(name);
  const ui = {tab:'mission', signature:'', stage:'', secondary:false, message:'', system:'air', wasActive:false};
  const phases = ['prediction','preparation','field','request','running','outcome','compare','explain','transfer','complete'];
  const stageNames = {prediction:'Think ahead',preparation:'Prepare the colony',field:'Investigate',request:'Contact Earth',running:'Lead the crew',outcome:'Review your result',compare:'Try another choice',explain:'Explain your discovery',transfer:'Use what you learned',complete:'Mission record'};
  const answerLabels = {store:'Stored energy will help the colony most.',generate:'Making more energy will help the colony most.',same:'Both plans will have the same result.','stored-energy':'A battery keeps spare energy for later.','more-sunlight':'Alignment increases generation for a limited time.','radio-power':'Radio silence switches off sunlight.',reserve:'Check spare power and reserves.','ask-earth':'Wait for Earth to decide everything.','more-machines':'Add a machine without checking.'};
  const answerText = answer => answerLabels[answer?.answer??answer?.value??answer]||answer?.label||answer?.answer||answer||'Not recorded';
  const panel = document.createElement('section'); panel.id='blackoutPanel'; panel.hidden=true; panel.setAttribute('aria-label','Blackout mission');
  const nav = document.createElement('nav'); nav.id='blackoutDock'; nav.hidden=true; nav.setAttribute('aria-label','Mission actions');
  nav.innerHTML=[['mission','Mission','compass'],['build','Build','build'],['systems','Systems','home'],['explore','Explore','rover'],['crew','Crew','crew']].map(([key,label,glyph])=>`<button data-blackout-tab="${key}" aria-pressed="${key==='mission'}">${icon(glyph)}<span>${label}</span></button>`).join('');
  const announce=document.createElement('div');announce.id='blackoutAnnounce';announce.className='blackout-sr-only';announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
  const watermark=document.createElement('div');watermark.id='blackoutArtCredit';watermark.textContent='Includes AI-generated artwork';watermark.title='Terrain colour and fictional adviser use AI-generated imagery. 3D structures and game systems are original authored work. See Credits.';
  const status=document.createElement('div');status.id='blackoutRadio';status.hidden=true;status.setAttribute('aria-label','Earth communication status');
  document.body.append(panel,nav,announce,watermark,status);
  const resourceToggle=document.createElement('button');resourceToggle.id='blackoutMoreResources';resourceToggle.type='button';resourceToggle.textContent='Supplies & crew';resourceToggle.setAttribute('aria-expanded','false');byId('strategyTop').append(resourceToggle);
  const assetStatus=document.createElement('div');assetStatus.id='blackoutAssetStatus';assetStatus.setAttribute('role','status');assetStatus.setAttribute('aria-live','polite');byId('strategyTop').append(assetStatus);
  let assetPhase='',assetTimer;
  function updateAssetStatus(){
    const art=window.AresWorld;
    const phase=!R3?'map':!art?'fallback':art.pending>0?'loading':art.errors?.length?'fallback':'ready';
    if(phase===assetPhase)return;assetPhase=phase;assetStatus.dataset.phase=phase;
    assetStatus.textContent=phase==='loading'?'Loading colony detail. You can begin while the models arrive.':phase==='fallback'?'Some colony art is unavailable. Simplified visuals and map controls remain available.':phase==='map'?'2D map ready. Mission controls are available.':'Colony models ready.';
    assetStatus.hidden=false;
    if(phase!=='loading'){clearInterval(assetTimer);if(phase!=='fallback')setTimeout(()=>{assetStatus.hidden=true;},3000);}
  }
  assetTimer=setInterval(updateAssetStatus,250);updateAssetStatus();
  resourceToggle.onclick=()=>{ui.secondary=!ui.secondary;document.body.classList.toggle('blackout-more-resources',ui.secondary);resourceToggle.setAttribute('aria-expanded',String(ui.secondary));resourceToggle.textContent=ui.secondary?'Hide extra supplies':'Supplies & crew';};
  function showMessage(text){ui.message=String(text||'');announce.textContent=ui.message;update(true);}
  function action(type,value){
    const oldStage=Blackout.view()?.stage;
    const result=Blackout.action(type,value===undefined?{}:{value});
    ui.message=result?.ok===false?(result.error||'That action is not ready yet.'):(result?.message||'');
    update(true);
    if(Blackout.view()?.stage!==oldStage){panel.scrollTop=0;panel.querySelector('h2')?.focus({preventScroll:true});}
    if(ui.message)announce.textContent=ui.message;
    window.BlackoutAudio?.cue(result?.ok===false?'warning':'confirm');
    return result;
  }
  function choiceHtml(c,i){if(c.action==='next')return '';
    const cost=c.cost==null?'':typeof c.cost==='object'?Object.entries(c.cost).map(([k,v])=>num(v)+' '+k).join(' · '):typeof c.cost==='number'?`${c.cost} Parts`:String(c.cost);
    return `<button type="button" class="blackout-choice ${c.primary||c.action==='next'?'blackout-primary':''}" data-blackout-action="${esc(c.action)}" data-value="${esc(c.value??'')}" ${c.disabled?'disabled':''} ${c.selected?'aria-pressed="true"':''}><span><strong>${esc(c.label||c.value||c.action)}</strong>${c.detail?`<span>${esc(c.detail)}</span>`:''}</span>${cost?`<b class="blackout-cost">${esc(cost)}</b>`:''}</button>`;
  }
  function sourcesHtml(sources){
    const list=Array.isArray(sources)?sources:Object.entries(sources||{}).map(([id,s])=>typeof s==='string'?{id,title:id,url:s}:{id,...s});
    if(!list.length)return '';
    return `<details class="blackout-sources"><summary>NASA evidence &amp; model limits</summary><p>Recorded NASA evidence informs this mission. Choices and resource amounts use a simplified training model.</p>${list.map(s=>`<article><h4>${esc(s.title||s.label||s.id||'NASA source')}</h4>${s.text||s.note||s.detail?`<p>${esc(s.text||s.note||s.detail)}</p>`:''}${s.date||s.kind?`<small>${esc([s.date,s.kind].filter(Boolean).join(' · '))}</small>`:''}${/^https:\/\//.test(s.url||'')?`<a href="${esc(s.url)}" target="_blank" rel="noopener">Read the source<span class="blackout-sr-only"> (opens a new tab)</span></a>`:''}</article>`).join('')}<p class="blackout-fine">Source descriptions are included offline. External NASA pages need a connection.</p></details>`;
  }
  function fieldHtml(field){
    if(!field)return '';
    const readings=Array.isArray(field.readings)?field.readings:[],open=readings.find(r=>r.condition==='open'),shelter=readings.find(r=>r.condition==='shelter');
    let feedback='';
    if(open&&shelter){
      const equal=open.raw===shelter.raw,lower=open.elevationKm<shelter.elevationKm?'open':'shelter',name=lower==='open'?'open plain':'shelter site';
      feedback=field.legacyModelReplaced?'Your saved comparison has been rechecked against the imported MOLA dataset. Earlier simulated sensor values are no longer used.':equal?(field.prediction==='same'?'Your prediction matches the imported terrain data. Both nearest grid samples have the same encoded elevation.':'Both nearest grid samples have the same encoded elevation, so the data does not support your prediction that one is lower.')+' At this dataset resolution, neither location is lower.':field.prediction===lower?'Your prediction matches the imported terrain data: the '+name+' is lower.':field.prediction==='same'?'The imported samples differ: the '+name+' is lower. The data does not support your prediction of the same encoded elevation.':'The data showed the opposite of your prediction: the '+name+' is lower. Use the record to revise your explanation.';
    }
    return `<section class="blackout-field"><h3>Compare NASA terrain records</h3><p>The Mars Orbiter Laser Altimeter measured the planet’s elevation. Compare the nearest samples in the imported grid.</p><div class="blackout-readings">${['open','shelter'].map(k=>{const r=readings.find(x=>x.condition===k);return `<div data-reading="${k}"><span>${k==='open'?'Open plain terrain':'Shelter-site terrain'}</span><strong>${r?Number(r.elevationKm).toFixed(2)+' km':'—'}</strong><small>${r?'Grid sample '+r.raw+' · '+num(r.sampleLat)+'° latitude, '+num(r.sampleLon)+'° longitude':'Open the dataset record'}</small></div>`;}).join('')}</div>${feedback?`<p class="blackout-field-feedback">${esc(feedback)}</p>`:''}<p class="blackout-fine">These are approximate elevations from the bundled one-degree, 8-bit grid. Elevation does not identify minerals, water ice, radiation dose or shelter protection.</p><button type="button" data-blackout-ui="walk">${icon('rover')}Walk with the terrain scanner</button><p class="blackout-fine">The map buttons below open the same imported dataset directly. Your crew plan is a separate gameplay decision.</p></section>`;
  }
  function commsHtml(c){
    if(!c)return '';
    const one=c.oneWayMinutes??c.oneWay,round=c.roundTripMinutes??c.roundTrip,remaining=c.trainingRemaining??c.remaining??c.remainingSteps;
    return `<section class="blackout-comms" data-link-state="${esc(c.status||'ready')}"><div><span class="blackout-signal" aria-hidden="true"></span><h3>${esc(c.label||c.title||'Earth link')}</h3></div>${c.detail||c.message?`<p>${esc(c.detail||c.message)}</p>`:''}<dl>${one!=null?`<div><dt>One-way light time</dt><dd>${num(one)} min</dd></div>`:''}${round!=null?`<div><dt>Round trip</dt><dd>${num(round)} min</dd></div>`:''}${remaining!=null?`<div><dt>Training countdown</dt><dd>${num(remaining)} ${esc(c.trainingUnit||'steps')}</dd></div>`:''}</dl>${c.sourceDate||c.date?`<small>NASA/JPL record: ${esc(c.sourceDate||c.date)}</small>`:''}<p class="blackout-fine">The training clock is compressed. A quiet radio does not turn off sunlight or power.</p></section>`;
  }
  function outcomeHtml(out,label){
    if(!out)return '';
    const r=out.resources||out.reserves||out;
    const values=[['Air',r.air??r.o2],['Water',r.water],['Food',r.food],['Stored power',r.battery??r.storedPower],['Parts',r.parts]];
    const success=out.success??out.safe??out.completed;
    return `<article class="blackout-outcome"><h3>${esc(label)}</h3><p class="blackout-outcome-plan">${esc(out.preparationLabel||({battery:'Battery built',align:'Arrays aligned',wait:'Parts saved'})[out.preparation]||out.preparation||out.choice||'Mission outcome')}${out.day!=null?' · day '+esc(out.day):''}</p>${success!=null?`<p class="blackout-result ${success?'is-safe':'is-setback'}">${success?'Crew safe · mission completed':'A setback to learn from'}</p>`:''}<dl>${values.filter(([,v])=>v!=null).map(([k,v])=>`<div><dt>${k}</dt><dd>${num(v)}</dd></div>`).join('')}</dl>${out.summary||out.message?`<p>${esc(out.summary||out.message)}</p>`:''}</article>`;
  }
  function resultsHtml(v){
    if(!v.firstOutcome&&!v.alternateOutcome&&!v.comparison)return '';
    const comp=v.comparison||{};
    const explanations=Array.isArray(comp.reasons)?comp.reasons:Array.isArray(comp.explanations)?comp.explanations:[];
    return `<section class="blackout-comparison"><h3>One mission, two futures</h3><p>The same colony and outside events. One preparation changes.</p><div class="blackout-futures">${outcomeHtml(v.firstOutcome,'Your plan')}${outcomeHtml(v.alternateOutcome,'Alternate choice')}</div>${comp.caveat?`<p class="blackout-fine">${esc(comp.caveat)}</p>`:''}${v.learning?.explanation&&(comp.summary||comp.explanation)?`<p class="blackout-cause">${esc(comp.summary||comp.explanation)}</p>`:''}${v.learning?.explanation&&explanations.length?`<ul>${explanations.map(x=>`<li>${esc(typeof x==='string'?x:x.text||x.reason||x.label)}</li>`).join('')}</ul>`:''}${comp.rejections?.length?`<details><summary>Actions that could not be repeated</summary><ul>${comp.rejections.map(x=>`<li>${esc(typeof x==='string'?x:x.error||x.reason||x.action)}</li>`).join('')}</ul></details>`:''}</section>`;
  }
  function learningHtml(v){
    if(v.stage!=='complete')return '';
    const l=v.learning||{},score=v.firstAttempt?.outcome?.score||v.firstAttempt?.score||v.score;
    const feedback=(answer,kind)=>answer?`<div class="blackout-answer"><strong>${kind}</strong><p>${esc(answerText(answer))}</p><p class="blackout-fine">${answer.correct?'Your explanation matches the model evidence.':kind==='Your explanation'?'Look again at the two futures. Compare the stored energy and generation. Radio silence does not remove sunlight.':'A new machine shares the available supply. Check spare power and reserves before adding its demand.'}</p></div>`:'';
    return `<section class="blackout-record"><h3>Your mission record</h3><p>You predicted, prepared, observed and compared. Keep your record to discuss what changed.</p>${l.feedback||l.summary?`<p>${esc(l.feedback||l.summary)}</p>`:''}${feedback(l.explanation,'Your explanation')}${feedback(l.transfer,'Your next-mission choice')}${score!=null?`<div class="blackout-score"><span>First attempt</span><strong>${esc(typeof score==='object'?score.label??score.total??score.value??'Recorded':score)}</strong><small>Practice helps you learn. It does not replace your first result.</small></div>`:''}<div class="blackout-export"><button type="button" data-blackout-ui="export">Download mission record</button><button type="button" data-blackout-ui="print">Print learning card</button></div><p class="blackout-fine">No name or account is needed. Your record stays on this device unless you share the downloaded file.</p></section>`;
  }
  function missionHtml(v){
    const i=Math.max(0,phases.indexOf(v.stage));
    return `<div class="blackout-panel-head"><div><span>${esc(stageNames[v.stage]||'Mission')}</span><h2 tabindex="-1">${esc(v.title||'One mission, two futures')}</h2></div><button type="button" data-blackout-ui="collapse" aria-label="Close mission panel">${icon('close')}</button></div><div class="blackout-progress" role="progressbar" aria-label="Mission progress" aria-valuemin="0" aria-valuemax="${phases.length-1}" aria-valuenow="${i}"><span style="width:${i/(phases.length-1)*100}%"></span></div><p class="blackout-lead">${esc(v.detail||'Choose a plan for your crew.')}</p>${v.tour?'<p class="blackout-tour-label">Judge tour · prepared demonstration</p>':''}${ui.message||v.error?`<p class="blackout-error" role="alert">${esc(ui.message||v.error)}</p>`:''}${v.storageWarning?`<p class="blackout-error" role="status">${esc(v.storageWarning)}</p>`:''}${v.stage==='field'?fieldHtml(v.field||{}):''}${['request','running'].includes(v.stage)?commsHtml(v.comms):''}${['outcome','compare','explain','transfer','complete'].includes(v.stage)?resultsHtml(v):''}<div class="blackout-choices" aria-label="Mission choices">${(v.choices||[]).map(choiceHtml).join('')}${v.canAdvance&&!(v.choices||[]).some(c=>c.action==='next')?choiceHtml({action:'next',label:'Advance one day',detail:'Your crew carries out the plan.',primary:true}):''}</div>${learningHtml(v)}${v.stage==='running'?`<button class="blackout-text-button" type="button" data-blackout-ui="systems">Inspect life support</button>`:''}${sourcesHtml(v.sources)}<footer class="blackout-mission-footer"><span>Mission code</span><code>${esc(v.code||'Shared challenge')}</code><small>${v.day!=null?'Day '+esc(v.day):''}${v.horizon!=null?' / '+esc(v.horizon):''} · Game units and compressed time</small></footer>`;
  }
  function systemsData(){
    const e=S.eco||compute(),machines=type=>S.builds.filter(b=>b.type===type&&b.done&&b.on),powered=type=>machines(type).filter(b=>b.powered),workers=type=>machines(type).filter(b=>b.staffed).length;
    const why=type=>!machines(type).length?'No working machine is built.':!workers(type)?'Waiting for a worker.':!powered(type).length?'Waiting for power.':'Operating with power and a worker.';
    return {
      air:{title:'Air loop',glyph:'air',from:'Mars atmosphere',machine:'Oxygen extractor',to:'Crew & air reserve',status:why('moxie'),active:e.o2p>0,inLabel:'Crew need',input:S.pop,outLabel:'Made per day',output:e.o2p,reserve:S.o2,unit:'air units',fact:'The imported MOLA grid provides terrain elevation. It does not measure oxygen production. Air quantities and machine output above are colony game accounting, separate from dataset observations.',url:'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'},
      water:{title:'Water loop',glyph:'water',from:'Used water',machine:powered('ice').length?'Water processor':'Lander recovery pod',to:'Clean water tank',status:powered('ice').length?why('ice'):'The lander recovers some used water. The advanced processor is not operating.',active:(e.waterRecovered||0)>0,inLabel:'Used per day',input:e.waterUse,outLabel:'Recovered per day',output:e.waterRecovered,reserve:S.water,unit:'water units',extra:`Processor supply (game units): ${num(e.waterSupplied||0)} / day. Tank change: ${num(e.waterNet||0)} / day.`,fact:'MOLA records elevation, not water deposits or recovery rates. None of the imported datasets measures this fictional colony’s water tank. Water figures above are game accounting.',url:'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'},
      power:{title:'Power network',glyph:'power',from:'Sunlight & lander power',machine:'Solar arrays & battery',to:'Life-support machines',status:e.shut?`${e.shut} machine${e.shut===1?' is':'s are'} waiting for power.`:S.dust?.active?'Dust blocks some sunlight; stored energy can help.':'Generation and stored energy supply the machines.',active:e.gen>0,inLabel:'Machines need',input:e.demand,outLabel:'Generated per day',output:e.gen,reserve:S.battery,unit:'stored power units',extra:`Battery capacity: ${num(e.store)}. Panel cleanliness: ${num(S.panelClean*100)}%.`,fact:'The imported DONKI catalogue records solar events. It does not measure this colony’s electricity output. The power figures above are game accounting, not NASA instrument readings.',url:'https://ccmc.gsfc.nasa.gov/tools/DONKI/'}
    };
  }
  function systemsHtml(){
    const systems=systemsData(),d=systems[ui.system]||systems.air;
    return `<div class="blackout-panel-head"><div><span>Inside the habitat</span><h2 tabindex="-1">Life support, connected</h2></div><button type="button" data-blackout-ui="mission" aria-label="Return to mission">${icon('close')}</button></div><p class="blackout-lead">Follow air, water and power through your habitat. These are your colony’s actual game values.</p><div class="blackout-system-tabs" role="group" aria-label="Inspect a system">${Object.entries(systems).map(([key,x])=>`<button data-blackout-system="${key}" aria-pressed="${key===ui.system}">${icon(x.glyph)}${esc(key==='air'?'Air':key==='water'?'Water':'Power')}</button>`).join('')}</div><section class="blackout-system" data-system="${ui.system}" data-operating="${d.active}"><h3>${esc(d.title)}</h3><ol class="blackout-flow" aria-label="System flow"><li><span>${esc(d.from)}</span></li><li>${icon(d.glyph)}<strong>${esc(d.machine)}</strong><small>${d.active?'Flow in the game model':'Flow stopped'}</small></li><li><span>${esc(d.to)}</span></li></ol><p class="blackout-system-state">${esc(d.status)}</p><dl class="blackout-system-ledger"><div><dt>${d.inLabel}</dt><dd>${num(d.input)}</dd></div><div><dt>${d.outLabel}</dt><dd>${num(d.output)}</dd></div><div><dt>Reserve</dt><dd>${num(d.reserve)}<small>${d.unit}</small></dd></div></dl>${d.extra?`<p>${esc(d.extra)}</p>`:''}<details class="blackout-sources"><summary>Dataset provenance and game accounting</summary><p>${esc(d.fact)}</p><a href="${esc(d.url)}" target="_blank" rel="noopener">Open the NASA dataset</a><p class="blackout-fine">The diagram is schematic. The numbers come from your current game state, not a live spacecraft feed.</p></details></section><button type="button" class="blackout-primary" data-blackout-ui="mission">Return to mission</button>`;
  }
  function openMission(){AresUI.close();ui.tab='mission';ui.message='';update(true);panel.querySelector('h2')?.focus({preventScroll:true});}
  function openSystems(system){AresUI.close();ui.tab='systems';if(['air','water','power'].includes(system))ui.system=system;update(true);panel.querySelector('h2')?.focus({preventScroll:true});}
  function openTab(tab){
    if(tab==='mission')return openMission();if(tab==='systems')return openSystems();
    ui.tab='external';ui.externalTab=tab;panel.hidden=true;AresUI.close();AresUI.open(tab);nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.blackoutTab===tab)));
  }
  function downloadRecord(){
    const record=Blackout.exportRecord();if(!record){showMessage('Complete a mission to make a record.');return;}
    const blob=new Blob([typeof record==='string'?record:JSON.stringify(record,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='BLACKOUT-mission-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce.textContent='Mission record downloaded as JSON.';
  }
  function printRecord(){
    const v=Blackout.view(),record=Blackout.exportRecord();if(!record){showMessage('Complete a mission to make a record.');return;}
    const old=byId('blackoutPrint');if(old)old.remove();
    const printable=document.createElement('section');printable.id='blackoutPrint';printable.innerHTML=`<h1>DEAD RECKONING: BLACKOUT</h1><h2>My mission evidence</h2><p>Mission code: ${esc(v.code)}. No personal information is required.</p>${resultsHtml(v)}<h3>My prediction</h3><p>${esc(answerText(v.prediction))}</p><h3>My explanation after comparing</h3><p>${esc(answerText(v.learning?.explanation))}</p><h3>Try a new situation</h3><p>Another machine needs power. What else should the colony prepare?</p><p>My choice: ${esc(answerText(v.learning?.transfer))}</p>${sourcesHtml(v.sources)}<p>Recorded observations and simplified game outcomes are different. Child learning has not been independently validated.</p>`;document.body.append(printable);printable.querySelectorAll('details').forEach(el=>el.open=true);window.print();
  }
  function walk(){AresUI.close();ui.tab='mission';if(!R3?.fp)toggleWalk();update(true);announce.textContent='Walk with the terrain scanner. Compare the two MOLA locations, or open their records in the mission card; Back to map stays at the top.';}
  panel.addEventListener('click',e=>{
    const a=e.target.closest('[data-blackout-action]');if(a){action(a.dataset.blackoutAction,a.dataset.value||undefined);return;}
    const system=e.target.closest('[data-blackout-system]');if(system){ui.system=system.dataset.blackoutSystem;update(true);return;}
    const b=e.target.closest('[data-blackout-ui]');if(!b)return;
    switch(b.dataset.blackoutUi){case 'mission':openMission();break;case 'systems':openSystems();break;case 'collapse':ui.tab='closed';update(true);break;case 'walk':walk();break;case 'export':downloadRecord();break;case 'print':printRecord();break;}
  });
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-blackout-tab]');if(b)openTab(b.dataset.blackoutTab);});
  document.addEventListener('click',e=>{
    if(!Blackout.isActive())return;
    const r=e.target.closest('[data-ares-resource]');
    if(r&&['air','water','power'].includes(r.dataset.aresResource)){e.preventDefault();e.stopImmediatePropagation();openSystems(r.dataset.aresResource);return;}
    if(e.target.closest('#aresSettings,#aresAppeal,#aresFame,[data-ares-resource]')){ui.tab='external';panel.hidden=true;}
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&Blackout.isActive()&&!modalOpen&&!R3?.fp){ui.tab=ui.tab==='closed'?'mission':'closed';update(true);}});
  const originalBuildingPanel=buildingPanel;buildingPanel=function(b){if(Blackout.isActive()){openSystems(b.type==='ice'?'water':b.type==='solar'||b.type==='battery'?'power':'air');return;}originalBuildingPanel(b);};
  function update(force=false){
    const active=Blackout.isActive();document.body.classList.toggle('blackout-mode',active);resourceToggle.hidden=!active;nav.hidden=!active;status.hidden=!active;panel.hidden=!active||ui.tab==='external'||ui.tab==='closed'||!!R3?.fp;
    if(!active){ui.wasActive=false;ui.signature='';return;}
    const v=Blackout.view();if(!ui.wasActive){ui.tab='mission';ui.signature='';ui.wasActive=true;panel.hidden=!!R3?.fp;}
    byId('aresMode').textContent='Blackout mission';
    const c=v.comms||{};status.dataset.linkState=c.status||'ready';status.innerHTML=`<span class="blackout-signal" aria-hidden="true"></span><div><b>${esc(c.label||c.title||'Earth link')}</b><span>${esc(c.status==='blackout'?'Local decisions keep the crew working.':c.detail||'Plan ahead. Radio replies take time.')}</span></div>`;
    const signature=JSON.stringify([v,ui.tab,ui.system,ui.message,ui.tab==='systems'?systemsData():null]);
    if(force||signature!==ui.signature){const scroll=panel.scrollTop;panel.innerHTML=ui.tab==='systems'?systemsHtml():missionHtml(v);ui.signature=signature;if(ui.stage===v.stage)panel.scrollTop=scroll;else{panel.scrollTop=0;announce.textContent=(v.title||'Mission updated')+'. '+(v.detail||'');ui.stage=v.stage;}}
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.blackoutTab===(ui.tab==='external'?ui.externalTab:ui.tab))));
    if(ui.tab==='mission'||ui.tab==='systems'){byId('commandPanel').hidden=true;byId('aresDrawer').hidden=true;}
    byId('aresResources').querySelectorAll('[data-ares-resource]').forEach(el=>el.classList.toggle('blackout-focus-resource',['air','water','power'].includes(el.dataset.aresResource)));
  }
  const priorRender=render;render=function(){priorRender();update();};
  document.addEventListener('blackout:systems',event=>openSystems(event.detail?.type==='ice'?'water':['solar','battery','reactor'].includes(event.detail?.type)?'power':'air'));
  document.addEventListener('blackout:update',()=>update());document.addEventListener('junior:update',()=>update());
  const prefKey='blackout-accessibility';let prefs={};try{const saved=JSON.parse(localStorage.getItem(prefKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved)){for(const key of ['motion','contrast'])if(typeof saved[key]==='boolean')prefs[key]=saved[key];if(['16','18','20'].includes(saved.text))prefs.text=saved.text;}}catch(_){}
  const prefControls={motionSetting:'motion',contrastSetting:'contrast',textSetting:'text'};
  Object.entries(prefControls).forEach(([id,key])=>{const input=byId(id);if(!input)return;if(prefs[key]!=null){if(input.type==='checkbox')input.checked=!!prefs[key];else input.value=prefs[key];input.dispatchEvent(new Event('change',{bubbles:true}));}input.addEventListener('change',()=>{prefs[key]=input.type==='checkbox'?input.checked:input.value;try{localStorage.setItem(prefKey,JSON.stringify(prefs));}catch(_){};});});
  window.BlackoutUI={update,openMission,openSystems,showMessage,downloadRecord,printRecord,action,get tab(){return ui.tab;}};
  update();
})();
