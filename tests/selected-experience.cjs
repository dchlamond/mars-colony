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
for(const opts of [{},{storageDenied:true},{offline:true},{seen:true}]){
 const f=fixture(opts);f.begin.onclick();eq(f.starts,1);eq(f.dialog.open,false);eq(f.video.paused,true);
 f.context.window.SelectedExperience.showFilm();eq(f.dialog.open,false);
 eq(f.context.window.SelectedExperience.available,false);
}
console.log(`${checks} selected-release immediate-play checks passed`);
