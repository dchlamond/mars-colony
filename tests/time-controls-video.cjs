/* Execute the shipped capture handler: native video keys must survive before
 * the film's bubbling handlers and must never toggle the colony clock. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {engine}=require('./engine-harness.cjs');
const e=engine();let checks=0,handler,interval,now=0;
function eq(actual,expected,message){assert.equal(actual,expected,message);checks++;}
const add=e.context.document.addEventListener;
e.context.document.addEventListener=(type,fn,capture)=>{if(type==='keydown'&&capture)handler=fn;else add(type,fn,capture);};
e.context.setInterval=fn=>{interval=fn;};e.context.performance.now=()=>now;
e.run(fs.readFileSync('game/time-controls.js','utf8'),'time-controls.js');
interval();
const film=e.context.document.getElementById('missionFilm');
function space(tagName='VIDEO',props={}){
 const event={code:'Space',key:' ',repeat:false,target:{tagName},prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};
 handler(event);return event;
}
for(const tag of ['VIDEO','BUTTON','BODY']){
 film.open=true;e.run('modalOpen=true;S.speed=0;');
 const beforeDay=e.run('S.sol'),event=space(tag);
 eq(event.prevented,false,tag+': native Space behavior is not cancelled');
 eq(event.stopped,false,tag+': Space reaches the film or native control');
 eq(e.run('S.speed'),0,tag+': Space does not resume the game');
 for(let i=0;i<20;i++){now+=100;interval();}
 eq(e.run('S.sol'),beforeDay,tag+': film-open clock remains on same day');
 eq(e.nodes.get('realTimeControls').hidden,true,tag+': game time controls remain hidden');
}
film.open=false;e.run('modalOpen=false;S.speed=0;');
let event=space('BODY');eq(event.prevented,true,'Game Space consumes the shortcut after film closes');eq(event.stopped,true,'Game Space does not trigger other pause handlers');eq(e.run('S.speed'),1,'Game Space resumes the selected pace');
event=space('BODY');eq(e.run('S.speed'),0,'Game Space pauses normally');
event=space('INPUT');eq(event.prevented,false,'Text fields keep Space');eq(e.run('S.speed'),0,'Typing Space does not resume the game');
event=space('BODY',{repeat:true});eq(event.prevented,false,'Held Space does not repeatedly toggle the clock');eq(e.run('S.speed'),0,'Held Space leaves game paused');
console.log(JSON.stringify({checks,result:'passed',coverage:'native video/Skip Space, no game resume during film, hidden time controls, restored game shortcut, input/repeat guards'}));
