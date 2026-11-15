/* Decorative airborne dust in the first-person view. No world, lighting,
 * collision, weather or instrument values are changed by this atmosphere. */
(function(){
'use strict';
if(document.getElementById('walkDust'))return;
const dust=document.createElement('div');dust.id='walkDust';dust.hidden=true;dust.setAttribute('aria-hidden','true');
const veil=document.createElement('div');veil.className='walk-dust-veil';dust.append(veil);
const motes=document.createElement('div');motes.className='walk-dust-motes';
// A fixed small set avoids per-frame JavaScript and particle allocations.
for(let i=0;i<18;i++){
 const mote=document.createElement('i');
 mote.style.setProperty('--dust-x',((i*37+11)%100)+'%');
 mote.style.setProperty('--dust-y',(18+(i*23)%76)+'%');
 mote.style.setProperty('--dust-size',(1+(i%3)*.6)+'px');
 mote.style.setProperty('--dust-time',(18+(i*7)%15)+'s');
 mote.style.setProperty('--dust-delay',(-i*2.9)+'s');
 mote.style.setProperty('--dust-opacity',String(.12+(i%4)*.035));
 motes.append(mote);
}
dust.append(motes);document.body.append(dust);
function update(){const hidden=document.hidden||!document.body.classList.contains('fp');if(dust.hidden!==hidden)dust.hidden=hidden;}
new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',update);update();
})();
