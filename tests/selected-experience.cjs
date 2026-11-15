/* Lifecycle regression: film completion/error/skip must never trap or double-start a mission. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;
function eq(a,b){assert.deepEqual(a,b);checks++;}
function fixture({seen=false,storageDenied=false,offline=false}={}){
  const events={},video={paused:true,currentTime:0,play:()=>{video.paused=false;return Promise.resolve()},pause:()=>{video.paused=true},addEventListener:(n,f)=>events[n]=f};
  const button={focus(){},textContent:''},status={textContent:''};
  const dialog={open:false,setAttribute(){},querySelector:s=>s==='video'?video:s==='button'?button:status,addEventListener:(n,f)=>events[n]=f,showModal(){this.open=true},close(){this.open=false}};
  let focusCount=0;
  const context={window:{INLINE:offline?{}:undefined},document:{createElement:()=>dialog,body:{append(){}},activeElement:{isConnected:true,focus(){focusCount++}},pointerLockElement:null},sessionStorage:{getItem(){if(storageDenied)throw Error('denied');return seen?'seen':null},setItem(){if(storageDenied)throw Error('denied')}},modalOpen:true,S:{speed:2},setSpeed(n){context.S.speed=n},clearWalkInput(){}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('game/selected-experience.js','utf8'),context);
  let starts=0;const begin={onclick:()=>{starts++}};
  const nodes={'h2':{},'.ares-welcome-mark':{},'.ares-welcome-intro':{},'label[for="aresColonyName"]':{},'#aresColonyName':{},'#aresLanding':{prepend(){}},'#aresMissionCode':{},'#watchSelectedFilm':{},'.btns button':begin};
  context.document.createElement=()=>({append(){}});
  context.window.SelectedExperience.decorateWelcome({querySelector:s=>nodes[s],style:{setProperty(){}}});
  return{context,events,video,button,status,dialog,begin,get starts(){return starts},get focusCount(){return focusCount}};
}
for(const via of ['ended','skip','cancel']){
  const f=fixture();f.begin.onclick();eq(f.dialog.open,true);eq(f.starts,0);eq(f.context.S.speed,0);
  if(via==='ended')f.events.ended();else if(via==='skip')f.button.onclick();else f.events.cancel({preventDefault(){}});
  eq(f.dialog.open,false);eq(f.starts,1);eq(f.video.paused,true);eq(f.context.S.speed,2);eq(f.context.modalOpen,true);
  f.events.ended();f.button.onclick();eq(f.starts,1); // stale events cannot launch twice
  f.begin.onclick();eq(f.starts,2);eq(f.dialog.open,false); // once per session
}
{
  const f=fixture({storageDenied:true});f.begin.onclick();f.video.error={message:'network'};f.events.error();
  assert.match(f.status.textContent,/still play/);checks++;f.button.onclick();eq(f.starts,1);
}
for(const opts of [{seen:true},{offline:true}]){const f=fixture(opts);f.begin.onclick();eq(f.starts,1);eq(f.dialog.open,false);}
{
  const f=fixture();f.context.window.SelectedExperience.showFilm();f.events.ended();eq(f.starts,0);eq(f.focusCount,1);
}
console.log(`${checks} selected-release lifecycle checks passed`);
