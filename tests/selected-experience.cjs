/* Shipped intro lifecycle: first entry, native media, skip, errors and replay. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;function eq(a,b,message){assert.deepEqual(a,b,message);checks++;}
function fixture({offline=false,rejectPlay=false}={}){
 const events={},queued=[];let rejectPlayback;
 const video={paused:true,currentTime:0,volume:1,muted:false,play(){video.paused=false;return rejectPlay?new Promise((_,reject)=>{rejectPlayback=reject}):Promise.resolve()},pause(){video.paused=true},addEventListener:(n,f)=>events[n]=f};
 const button={focus(){},textContent:''},sound={setAttribute(){}},status={textContent:''};
 const dialog={open:false,setAttribute(){},contains:n=>n===video,querySelector:s=>s==='video'?video:s==='#skipMissionFilm'?button:s==='#missionFilmSound'?sound:status,addEventListener:(n,f)=>events[n]=f,showModal(){this.open=true},close(){this.open=false}};
 let focusCount=0,exits=0;
 const context={window:{INLINE:offline?{}:undefined},document:{createElement:()=>dialog,body:{append(){}},activeElement:{isConnected:true,focus(){focusCount++}},pointerLockElement:null,fullscreenElement:null,exitFullscreen(){exits++;this.fullscreenElement=null;return Promise.resolve()}},modalOpen:true,S:{speed:0},setSpeed(n){context.S.speed=n},clearWalkInput(){},queueMicrotask:fn=>queued.push(fn)};
 vm.createContext(context);vm.runInContext(fs.readFileSync('game/selected-experience.js','utf8'),context);
 let starts=0;const begin={onclick:()=>{starts++}};
 const nodes={'h2':{},'.ares-welcome-mark':{},'.ares-welcome-intro':{},'label[for="aresColonyName"]':{},'#aresColonyName':{},'#aresLanding':{prepend(){}},'#aresMissionCode':{},'#watchSelectedFilm':{},'.btns button':begin};
 context.document.createElement=()=>({append(){}});
 const welcome={querySelector:s=>nodes[s],style:{setProperty(){}}};
 const decorate=()=>context.window.SelectedExperience.decorateWelcome(welcome);decorate();
 return{context,events,video,button,sound,status,dialog,begin,decorate,nodes,flush(){while(queued.length)queued.shift()()},reject(){rejectPlayback(new Error('autoplay denied'))},get starts(){return starts},get focusCount(){return focusCount},get exits(){return exits}};
}
(async()=>{
 for(const via of ['ended','skip','cancel']){
  const f=fixture();eq(f.dialog.open,false,'Opening waits for welcome handlers to settle');f.flush();
  eq(f.dialog.open,true,'Film is shown before Begin is clicked');eq(f.starts,0);eq(f.video.muted,true,'Initial autoplay is muted');eq(f.video.paused,false);eq(f.button.textContent,'Skip to game');
  if(via==='ended')f.events.ended();else if(via==='skip')f.button.onclick();else f.events.cancel({preventDefault(){}});
  eq(f.dialog.open,false);eq(f.video.paused,true);eq(f.context.modalOpen,true,'Welcome modal is restored');eq(f.starts,0,'Film never starts a mission automatically');
  f.events.ended();f.button.onclick();eq(f.starts,0,'Stale closing events do not start a mission');
  f.begin.onclick();eq(f.starts,1);eq(f.dialog.open,false,'Begin is immediate');
  f.decorate();f.flush();eq(f.dialog.open,false,'New mission during same visit is not interrupted');
 }
 {
  const f=fixture();f.flush();f.sound.onclick();eq(f.video.muted,false,'Sound can be enabled');f.sound.onclick();eq(f.video.muted,true,'Sound can be muted');
  f.video.volume=0;f.sound.onclick();eq(f.video.muted,false);eq(f.video.volume,1,'Enable sound restores zero-volume player');
  f.video.muted=true;f.events.volumechange();eq(f.sound.textContent,'Turn sound on','Native mute and top sound button stay in sync');
 }
 {
  const f=fixture({rejectPlay:true});f.flush();f.reject();await new Promise(resolve=>setImmediate(resolve));
  assert.match(f.status.textContent,/Press Play/);checks++;eq(f.dialog.open,true);f.button.onclick();f.begin.onclick();eq(f.starts,1,'Blocked autoplay never blocks the game');
 }
 {
  const f=fixture({rejectPlay:true});f.flush();f.button.onclick();const previous=f.status.textContent;f.reject();await new Promise(resolve=>setImmediate(resolve));eq(f.status.textContent,previous,'Stale rejection cannot update closed intro');
 }
 {
  const f=fixture();f.flush();f.video.error={code:4};f.events.error();assert.match(f.status.textContent,/Skip to the game/);checks++;f.button.onclick();f.begin.onclick();eq(f.starts,1,'Missing media is skippable');
 }
 {
  const f=fixture();f.flush();f.button.onclick();f.context.modalOpen=false;f.context.S.speed=3;f.nodes['#watchSelectedFilm'].onclick();eq(f.dialog.open,true);eq(f.video.muted,false,'User-requested replay starts with sound');eq(f.context.S.speed,0);eq(f.context.modalOpen,true);eq(f.button.textContent,'Back to game');
  f.context.document.fullscreenElement=f.video;f.events.ended();eq(f.exits,1,'Ending exits fullscreen');eq(f.context.S.speed,3,'Replay restores prior game pace');eq(f.context.modalOpen,false);eq(f.starts,0);eq(f.focusCount,2);
 }
 {
  const f=fixture({offline:true});f.flush();eq(f.dialog.open,false,'Offline file does not automatically request remote video');f.begin.onclick();eq(f.starts,1);f.nodes['#watchSelectedFilm'].onclick();eq(f.dialog.open,true);eq(f.video.src,'https://dead-reckoning-blackout.vercel.app/assets/intro/two-futures-hades-ar.mp4');f.button.onclick();
 }
 {
  const f=fixture();f.flush();let stopped=0;f.events.keydown({key:' ',stopPropagation(){stopped++}});eq(stopped,1);f.events.keydown({key:'Tab',stopPropagation(){stopped++}});eq(stopped,1,'Tab uses the native dialog focus cycle');
  assert.match(f.dialog.innerHTML,/<video controls playsinline/);checks++;assert(!/nofullscreen|novolume/.test(f.dialog.innerHTML));checks++;
 }
 console.log(`${checks} opening-film lifecycle checks passed`);
})().catch(error=>{console.error(error);process.exitCode=1});
