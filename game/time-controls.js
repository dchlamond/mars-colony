/* One visible real-time clock in every mode. Space preserves the chosen pace. */
(function(){
'use strict';
let mission=null,pace=1,last=performance.now(),elapsed=0;
const intervals=[0,8000,4000,2000,1000,500];
const clock=document.createElement('section');clock.id='realTimeControls';clock.setAttribute('aria-label','Time controls');
clock.innerHTML='<strong>TIME CONTROL <span id="timeDay"></span></strong><div><button id="timePause" aria-keyshortcuts="Space">Pause · Space</button>'+[1,2,3,4,5].map(n=>'<button data-time-pace="'+n+'" aria-label="Time speed '+n+'">'+n+'×</button>').join('')+'</div><small id="timeState"></small>';
document.body.append(clock);
function running(){return S.speed>0;}
function set(n){if(n)pace=n;setSpeed(n);update();}
function toggle(){if(window.Classroom?.connected&&!Classroom.host)return;set(running()?0:pace);}
clock.querySelector('#timePause').onclick=toggle;clock.querySelectorAll('[data-time-pace]').forEach(b=>b.onclick=()=>set(+b.dataset.timePace));
document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)||e.target?.isContentEditable)return;e.preventDefault();e.stopImmediatePropagation();if(!modalOpen)toggle();},true);
const previousSpeed=setSpeed;setSpeed=function(n){if(window.Blackout?.isActive()){S.speed=Math.max(0,Math.min(5,n));return;}return previousSpeed(n);};
function update(){
 if(!S)return;const room=window.Classroom?.connected;
 clock.hidden=!!R3?.fp||modalOpen;
 document.getElementById('timeDay').textContent='· DAY '+S.sol;
 document.getElementById('timePause').textContent=running()?'Pause · Space':'Resume · Space';
 clock.querySelectorAll('button').forEach(b=>b.disabled=!!S.over||(room&&!Classroom.host));
 clock.querySelectorAll('[data-time-pace]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.timePace===S.speed)));
 const waiting=window.Blackout?.isActive()&&!Blackout.view().canAdvance;
 document.getElementById('timeState').textContent=room?Classroom.clockLabel():modalOpen?'Paused for briefing':waiting?'Choose your mission plan to continue':S.junior?.recovery?'Paused · retry your checkpoint':running()?'Automatic time · '+intervals[S.speed]/1000+' seconds per day':'Paused · press Space to resume';
}
setInterval(()=>{
 const now=performance.now(),dt=Math.min(250,now-last);last=now;
 if(!S)return;
 if(mission!==S){mission=S;pace=1;elapsed=0;if(!window.Classroom?.connected)S.speed=1;}
 if(window.Blackout?.isActive()){
  if(!S.speed||modalOpen||document.hidden||R3?.fp||!Blackout.view().canAdvance){elapsed=0;}else{elapsed+=dt;if(elapsed>=intervals[S.speed]){elapsed=0;const speed=S.speed;Blackout.action('next');S.speed=speed;render();}}
 }
 update();
},100);
})();
