/* Original account-free mission sound. Synthesized locally; no recording or upload. */
(function(){
 'use strict';
 const key='blackout-audio',sound=document.getElementById('soundSetting'),volume=document.getElementById('volumeSetting');
 const pref={enabled:false,volume:.12};try{Object.assign(pref,JSON.parse(localStorage.getItem(key)||'{}'));}catch(_){}
 pref.volume=Math.max(0,Math.min(.3,Number(pref.volume)||0));
 let context,master,hum,started=false,lastStage='',lastLink='',lastCue=-Infinity,lastCueKind='';
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(pref));}catch(_){}};
 function syncControls(){if(sound)sound.checked=pref.enabled;if(volume)volume.value=String(Math.round(pref.volume*100));}
 function setup(){
  if(context)return context;
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;
  try{context=new Audio();master=context.createGain();master.gain.value=pref.enabled?pref.volume:0;master.connect(context.destination);
   hum=context.createGain();hum.gain.value=.018;hum.connect(master);
   const a=context.createOscillator(),b=context.createOscillator(),filter=context.createBiquadFilter();a.type='sine';b.type='sine';a.frequency.value=72;b.frequency.value=109;filter.type='lowpass';filter.frequency.value=180;a.connect(filter);b.connect(filter);filter.connect(hum);a.start();b.start();
  }catch(_){context=null;return null;}return context;
 }
 function apply(){
  syncControls();if(!context)return;
  master.gain.setTargetAtTime(pref.enabled?pref.volume:0,context.currentTime,.08);
  if(!pref.enabled||document.hidden){context.suspend().catch(()=>{});}else if(started){context.resume().catch(()=>{});}
 }
 function unlock(){started=true;if(pref.enabled){setup();apply();}}
 function setEnabled(value){pref.enabled=!!value;persist();if(pref.enabled)unlock();apply();if(sound)sound.dispatchEvent(new Event('change',{bubbles:true}));}
 function cue(kind='confirm'){
  if(!pref.enabled||!started||document.hidden)return false;
  if(performance.now()-lastCue<90&&(kind===lastCueKind||kind==='confirm'||kind==='radio'))return false;
  const c=setup();if(!c)return false;c.resume().catch(()=>{});lastCue=performance.now();lastCueKind=kind;
  const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(master);const t=c.currentTime;
  const notes={confirm:[440,660,.13],warning:[220,180,.26],radio:[900,560,.2],recovery:[330,490,.24],success:[440,880,.35]};const [f1,f2,len]=notes[kind]||notes.confirm;
  o.type=kind==='radio'?'triangle':'sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+len);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='warning'?.15:.1,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+len);o.start(t);o.stop(t+len+.03);o.onended=()=>{o.disconnect();g.disconnect();};document.dispatchEvent(new CustomEvent('blackout:audio',{detail:{kind,startedAt:t}}));return true;
 }
 function update(){
  const active=window.Blackout?.isActive(),v=active?Blackout.view():null;
  if(context&&hum){const hasPower=!!S&&(S.eco||compute()).gen>0;hum.gain.setTargetAtTime(active&&hasPower?.018:.004,context.currentTime,.5);}
  if(!v){lastStage='';lastLink='';return;}
  const link=v.comms?.status||'';
  if(lastStage&&lastStage!==v.stage)cue(v.stage==='complete'?'success':v.stage==='prediction'?'recovery':v.stage==='outcome'&&v.recovery?'warning':v.stage==='running'?'radio':'confirm');
  if(lastLink&&lastLink!==link&&link==='blackout')cue('radio');lastStage=v.stage;lastLink=link;
 }
 if(sound){sound.checked=pref.enabled;sound.dispatchEvent(new Event('change',{bubbles:true}));sound.addEventListener('change',()=>{pref.enabled=sound.checked;persist();unlock();apply();});}
 if(volume){volume.value=String(Math.round(pref.volume*100));volume.dispatchEvent(new Event('input',{bubbles:true}));volume.addEventListener('input',()=>{pref.volume=Math.max(0,Math.min(.3,+volume.value/100));persist();apply();});}
 const note=document.createElement('p');note.className='blackout-audio-note';note.textContent='Optional habitat ambience and gentle radio cues. All mission information is also shown as text. Sound starts only after you interact.';sound?.closest('.actionlist')?.append(note);
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock,{passive:true});document.addEventListener('visibilitychange',apply);window.addEventListener('pagehide',()=>context?.suspend().catch(()=>{}));
 document.addEventListener('blackout:update',update);
 window.BlackoutAudio={cue,setEnabled,setVolume:value=>{pref.volume=Math.max(0,Math.min(.3,Number(value)||0));persist();apply();},get state(){return {enabled:pref.enabled,volume:pref.volume,started,contextState:context?.state||'not-created',available:!!(window.AudioContext||window.webkitAudioContext)};}};
 syncControls();
})();
