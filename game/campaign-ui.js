/* White/blue campaign command strip; real buttons and live text remain accessible. */
(function(){
'use strict';
const C=window.Campaign,R=window.CampaignRules,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bar=document.createElement('section');bar.id='campaignControls';bar.setAttribute('aria-label','Campaign controls');
bar.innerHTML='<div class="campaign-tools"><button id="campaignRanking">'+AresUI.icon('fame')+'Leaderboard</button><button id="campaignRoom">'+AresUI.icon('crew')+'Play together</button><button id="campaignLedger">'+AresUI.icon('book')+'Discoveries</button></div><div class="campaign-clock" role="group" aria-label="Time speed"><button data-campaign-speed="0" aria-label="Pause time">Ⅱ</button>'+[1,2,3,4,5].map(n=>'<button data-campaign-speed="'+n+'" aria-label="Speed '+n+'">'+n+'</button>').join('')+'<span id="campaignClockLabel">Paused</span><button id="campaignSound" aria-label="Toggle alert sounds">Sound off</button></div><div id="campaignApproach" hidden role="status"></div><div id="campaignWeather" hidden></div>';
document.body.append(bar);
function show(title,html,buttons){S.speed=0;modal({keepOpen:true,title,html,buttons:buttons||[{label:'Back to colony',primary:true}]});}
function ranking(){
 const rows=window.Classroom?.connected?Classroom.rows().slice():C.colonies();
 rows.sort((a,b)=>b.pop-a.pop||b.fame-a.fame||b.appeal-a.appeal);
 show('Colony leaderboard','<p>People first. Fame breaks ties, then Appeal. '+(window.Classroom?.connected?'Live classmates in your private room.':'Your colony and two computer colonies.')+'</p><table class="campaign-table"><thead><tr><th>Colony</th><th>Crew</th><th>Appeal</th><th>Fame</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+ (i+1)+'. '+esc(r.name)+'</td><td>'+r.pop+'</td><td>'+Math.round(r.appeal)+'%</td><td>'+Math.round(r.fame)+'</td></tr>').join('')+'</tbody></table><h3>How arrivals choose</h3><p>Better air, water, food, beds, shelter, recreation and power raise Appeal. Fame lets more people hear about you. Neither can replace empty beds.</p><p>Of a ten-person wave, about <b>'+Math.ceil(10*R.awareness(S.fame))+'</b> currently know your colony. Those who know it compete for its available beds according to Appeal. Unplaced explorers wait in orbit.</p><h3>Recent arrivals</h3>'+C.data().arrivals.map(a=>'<p>Day '+a.sol+': '+a.names.map((n,i)=>esc(n)+' +'+a.seats[i]).join(' · ')+'. In orbit: '+a.waiting+'.</p>').join(''),[{label:S.padOpen?'Close arrivals':'Open arrivals',primary:true,fn:()=>{S.padOpen=!S.padOpen;}},{label:'Back to colony'}]);
}
function showAppeal(){const a=C.appeal();show('Quality of life · Appeal','<p class="campaign-score">'+Math.round(a.score)+'% <small>'+esc(a.label)+'</small></p><p>Improve conditions inside your colony to attract explorers. Fame expands awareness; Appeal influences their choice.</p><table class="campaign-table">'+a.reasons.map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+(r.ready?'+'+r.points:r.points<0?r.points:'Needs work')+'</td></tr>').join('')+'</table><p>Air, food and water are reserve checks. Housing, shielding, recreation and reliable power complete the score. Industry close to homes reduces comfort.</p>');}
function update(){
 bar.hidden=!C.active()||!!R3?.fp;document.body.classList.toggle('campaign-mode',C.active());if(!C.active())return;
 const room=window.Classroom?.connected,p=room?Classroom.pending():C.data().pending;
 bar.querySelectorAll('[data-campaign-speed]').forEach(b=>{b.setAttribute('aria-pressed',String(+b.dataset.campaignSpeed===S.speed));b.disabled=(!room&&!!S.over)||!!p||(room&&!Classroom.host);});
 $('campaignClockLabel').textContent=room?Classroom.clockLabel():S.speed?'1 day / '+C.speeds[S.speed]/1000+'s':'Paused';
 $('campaignSound').textContent=window.BlackoutAudio?.state.enabled?'Sound on':'Sound off';
 const arrival=$('campaignApproach');arrival.hidden=!p;if(p){const seconds=Math.max(0,Math.ceil((p.deadline-Date.now())/1000));arrival.textContent='SHUTTLE APPROACH · '+seconds+'s · '+p.pool+' explorers';if(seconds>0&&seconds<=3&&arrival.dataset.second!==String(seconds))BlackoutAudio?.cue('radio');arrival.dataset.second=String(seconds);}
 bar.classList.toggle('has-approach',!!p);
 const w=C.weather;$('campaignWeather').hidden=!w;$('campaignWeather').textContent=w?(w.active?'Extreme dust '+w.cycle+' · '+w.daysLeft+' days left':'Next extreme dust · day '+w.next)+(w?.radiation?' · Radiation: check shelter':'')+(w?.cold?' · Heater demand':''):'';
 if(window.Blackout?.isActive())return;
 $('aresAppealValue').textContent=Math.round(C.appeal().score)+'%';
}
bar.addEventListener('click',e=>{const b=e.target.closest('[data-campaign-speed]');if(b){setSpeed(+b.dataset.campaignSpeed);update();}});
$('campaignRanking').onclick=ranking;$('campaignRoom').onclick=()=>window.Classroom?.open();$('campaignLedger').onclick=()=>window.FieldDiscovery?.ledger();
$('campaignSound').onclick=()=>{BlackoutAudio.setEnabled(!BlackoutAudio.state.enabled);BlackoutAudio.cue();update();};
$('aresAppeal').addEventListener('click',e=>{if(C.active()){e.preventDefault();e.stopImmediatePropagation();showAppeal();}},true);
document.addEventListener('campaign:alert',e=>{S.speed=0;BlackoutAudio?.cue('warning');show(e.detail.title,'<p>'+esc(e.detail.text)+'</p>');});
document.addEventListener('campaign:landed',()=>{BlackoutAudio?.cue('success');ranking();});
document.addEventListener('campaign:arrival',()=>{BlackoutAudio?.cue('radio');update();});
document.addEventListener('campaign:update',update);setInterval(update,200);
window.CampaignUI={show,ranking,showAppeal,update,esc};update();
})();
