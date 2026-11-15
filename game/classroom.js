/* Live private rooms: browser economy, server clock, server-distributed arrivals.
 * Session credentials stay in HttpOnly cookies. sessionStorage holds no tokens. */
(function(){
'use strict';
const key='mars-classroom-v1';let room=null,member=null,applied=0,seenWave=0,busy=false,error='',backup=null,lastSave=0,joining=false,advancing=false;
const api=async(path,body={})=>{const result=await fetch('/room-api/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),body:JSON.stringify({...body,member})});let data;try{data=await result.json();}catch{throw Error('Room service is unavailable. Single-player remains available.');}if(!result.ok)throw Object.assign(Error(data.error||'Room request failed.'),{status:result.status});return data;};
const esc=s=>window.CampaignUI?.esc(s)||String(s).replace(/[<>&]/g,'');
function save(){if(!room)return;try{sessionStorage.setItem(key,JSON.stringify({room,member,applied,seenWave,mission:Strategy.captureMission(),backup}));}catch(_){error='This browser cannot save room recovery. Keep this tab open.';}}
function closeDialog(){modalQ=[];modalOpen=false;document.getElementById('overlay').style.display='none';render();}
async function enter(path){
 if(joining)return;joining=true;
 const name=document.getElementById('roomName')?.value||ME.name,code=document.getElementById('roomCode')?.value||'';
 try{
  backup=Strategy.captureMission();const next=await api(path,{name,code});member=next.you;room=next;applied=0;seenWave=0;error='';
  DF=DIFFS[1];Junior.setModeForNewGame('commander');newGame(next.seed,0);ME.name=next.players.find(p=>p.id===member).name;DF=DIFFS[1];S.water=120;S.speed=0;
  // Joining is a fresh, same-seed Commander campaign; solo state is restored on leave.
  modalQ=[];modalOpen=false;if(R3){if(R3.fp)toggleWalk();buildWorld();}buildMenu();render();save();open();
 }catch(e){error=e.message;const el=document.getElementById('roomError');if(el)el.textContent=error;}
 finally{joining=false;}
}
function report(){const c=Campaign.colonies()[0];return {...c,day:S.over?room.day:S.sol,blocked:!S.over&&(modalOpen||!!R3?.fp),over:!!S.over};}
function accept(next){
 room=next;error='';
 if(next.grants>applied){Campaign.applyArrival(next.grants-applied);applied=next.grants;save();}
 if(next.lastArrival&&next.lastArrival.wave>seenWave){seenWave=next.lastArrival.wave;const a=next.lastArrival;Campaign.data().arrivals.unshift({...a,sol:a.day});Campaign.data().arrivals=Campaign.data().arrivals.slice(0,12);BlackoutAudio?.cue('success');log('Room shuttle: '+a.names.map((n,i)=>n+' +'+a.seats[i]).join(', ')+'.','good');}
 S.speed=next.speed;
 // Synchronize one day at a time; the server waits until every client catches up.
 if(!modalOpen&&!R3?.fp&&!S.over&&S.sol<next.day){advancing=true;try{tickSol();}finally{advancing=false;}S.speed=next.speed;render();save();}
 if(Date.now()-lastSave>3000){lastSave=Date.now();save();}
 const list=document.getElementById('roomPlayers');if(list)list.innerHTML=next.players.map(p=>'<li>'+esc(p.name)+(p.id===next.you?' · you':'')+(p.online?'':' · disconnected')+'</li>').join('');
 const state=document.getElementById('roomStatus');if(state)state.textContent=clockLabel();
}
async function poll(){if(!room||busy||joining)return;busy=true;try{accept(await api('state',{report:report()}));}catch(e){error=e.message;S.speed=0;if(e.status===401){room=null;try{sessionStorage.removeItem(key);}catch(_){}document.dispatchEvent(new CustomEvent('campaign:alert',{detail:{title:'Room ended',text:error+' You can keep playing this colony alone, or restore your saved mission.'}}));}}finally{busy=false;}}
async function control(body){if(!room?.host)return;try{accept(await api('control',body));if(body.start){closeDialog();poll();}}catch(e){error=e.message;open();}}
async function leave(){
 try{await api('leave');}catch(_){}
 room=null;member=null;try{sessionStorage.removeItem(key);}catch(_){}S.speed=0;closeDialog();if(backup){Strategy.restoreMission(backup);backup=null;}render();
}
function clockLabel(){return error?'Connection paused':!room?.started?'Waiting for host':room.pending?'Shuttle countdown':room.waitingFor?.length?'Waiting: '+room.waitingFor.join(', '):room.speed?'Room day '+room.day+' · speed '+room.speed:'Room paused';}
function open(){
 if(!window.CampaignUI)return;
 if(!room){CampaignUI.show('Play together · private room','<p>Compete with up to eight classmates in Commander. Everyone begins on the same map, with a shared clock and ten-person arrival waves. Your current solo colony will be restored when you leave.</p><div class="campaign-room-form"><label for="roomName">Colony nickname</label><input id="roomName" maxlength="24" value="'+esc(ME.name)+'"><label for="roomCode">Room code (to join)</label><input id="roomCode" maxlength="8" autocomplete="off" placeholder="Eight characters"><div class="campaign-room-actions"><button id="createRoom">Create private room</button><button id="joinRoom">Join room</button></div><p id="roomError" role="status">'+esc(error)+'</p></div><p>Use colony nicknames, not student names. Rooms last four hours and may end if the service restarts. No account or sign-in.</p>');document.getElementById('createRoom').onclick=()=>enter('create');document.getElementById('joinRoom').onclick=()=>enter('join');return;}
 CampaignUI.show('Classroom · '+room.code,'<p>Share code <strong>'+room.code+'</strong> with classmates. Join before the host launches.</p><p id="roomStatus" role="status">'+esc(clockLabel())+'</p><ul id="roomPlayers">'+room.players.map(p=>'<li>'+esc(p.name)+(p.id===member?' · you':'')+'</li>').join('')+'</ul><p>The host controls speeds 1–5. Time waits if a player disconnects, opens a decision popup or walks on Mars. Close popups to continue. The leaderboard updates live.</p>'+(room.host?'<div class="campaign-room-actions"><button id="roomStart">'+(room.started?'Resume at speed 1':'Launch mission')+'</button>'+room.players.filter(p=>p.id!==member&&!p.online).map(p=>'<button data-remove-player="'+p.id+'">Remove disconnected '+esc(p.name)+'</button>').join('')+'</div>':'')+'<p>'+esc(error)+'</p><p>Classroom competition uses locally calculated colony statistics. It is not a ranked anti-cheat service. Room state is temporary.</p>',[{label:'Return to colony',primary:true},{label:'Leave room · restore solo colony',fn:()=>{leave();return false;}}]);
 const start=document.getElementById('roomStart');if(start)start.onclick=()=>control({start:true,speed:1});document.querySelectorAll('[data-remove-player]').forEach(b=>b.onclick=()=>control({remove:b.dataset.removePlayer}));
}
window.Classroom={open,leave,poll,speed:s=>control({speed:s}),rows:()=>room?.players||[],pending:()=>room?.pending,clockLabel,get advancing(){return advancing;},get connected(){return !!room;},get host(){return !!room?.host;}};
setInterval(poll,250);
// Resume this tab's room only after recovering and validating its colony snapshot.
setTimeout(()=>{try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.member&&saved.room&&saved.mission){Strategy.validateMission(saved.mission);member=saved.member;backup=saved.backup;applied=saved.applied||0;seenWave=saved.seenWave||0;room=saved.room;Strategy.restoreMission(saved.mission);poll();}}catch(_){try{sessionStorage.removeItem(key);}catch(_){}}},800);
})();
