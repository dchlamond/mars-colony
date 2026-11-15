/* Decorative airborne dust in the first-person view. No world, lighting,
 * collision, weather or instrument values are changed by this atmosphere. */
(function(){
'use strict';
if(document.getElementById('walkDust'))return;
const dust=document.createElement('div');dust.id='walkDust';dust.hidden=true;dust.setAttribute('aria-hidden','true');
const veil=document.createElement('div');veil.className='walk-dust-veil';dust.append(veil);
const motes=document.createElement('div');motes.className='walk-dust-motes';
// A fixed, staggered set gives visible depth without per-frame JS or allocations.
// The upper/middle view carries most grains, leaving equipment and controls clear.
for(let i=0;i<40;i++){
 const mote=document.createElement('i');
 mote.style.setProperty('--dust-x',((i*37+11)%100)+'%');
 mote.style.setProperty('--dust-y',(9+(i*23)%68)+'%');
 mote.style.setProperty('--dust-size',(1.8+(i%5)*.85)+'px');
 mote.style.setProperty('--dust-color',['#c57546','#b96a3e','#d19a72'][i%3]);
 mote.style.setProperty('--dust-rise',(-2-(i%4)*1.2)+'vh');
 mote.style.setProperty('--dust-time',(14+(i*7)%13)+'s');
 mote.style.setProperty('--dust-delay',(-1-i*2.9)+'s');
 mote.style.setProperty('--dust-opacity',String(.30+(i%4)*.07));
 motes.append(mote);
}
dust.append(motes);document.body.append(dust);
function update(){const hidden=document.hidden||!document.body.classList.contains('fp');if(dust.hidden!==hidden)dust.hidden=hidden;}
new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',update);update();
})();
