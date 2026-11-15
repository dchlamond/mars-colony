/* Live private rooms: browser economy, server clock, server-distributed arrivals.
 * Session credentials stay in HttpOnly cookies. sessionStorage holds no tokens. */
(function(){
'use strict';
const key='mars-classroom-v1';let room=null,member=null,applied=0,seenWave=0,busy=false,error='',backup=null,lastSave=0,joining=false,advancing=false,generation=0;
const api=async(path,body={})=>{const result=await fetch('/room-api/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),body:JSON.stringify({...body,member})});let data;try{data=await result.json();}catch{throw Error('Room service is unavailable. Single-player remains available.');}if(!result.ok)throw Object.assign(Error(data.error||'Room request failed.'),{status:result.status});return data;};
const esc=s=>window.CampaignUI?.esc(s)||String(s).replace(/[<>&]/g,'');
function save(){if(!room)return;try{sessionStorage.setItem(key,JSON.stringify({room,member,applied,seenWave,mission:Strategy.captureMission(),backup}));}catch(_){error='This browser cannot save room recovery. Keep this tab open.';}}
function closeDialog(){modalQ=[];modalOpen=false;document.getElementById('overlay').style.display='none';render();}
const colonyColors=['#7bc9ff','#ff9f79','#9bddbd','#c7a5ff','#f2c96d','#ed9ac4','#a9d2db','#bbc9f1'];
const slotOf=(p,next)=>Number.isInteger(p?.slot)&&p.slot>=0&&p.slot<8?p.slot:Math.max(0,next.players.findIndex(x=>x.id===p?.id));
const siteFor=slot=>({c:Math.floor(COLS*(.125+.25*(slot%4))),r:Math.floor(ROWS*(slot<4?.32:.68))});
function placeOwnColony(next){
 const self=next.players.find(p=>p.id===member),slot=slotOf(self,next),site=siteFor(slot),pod=S.builds[0];
 // This happens once on entry, never while polling. Every player owns a
 // separate lander, resource inventory, construction list and discovery ledger.
 for(const t of S.tiles){t.seen=false;delete t.owner;delete t.build;}
 pod.c=site.c;pod.r=site.r;const tile=tileAt(site.c,site.r);tile.type='plain';tile.build=pod;
 for(const t of S.tiles)if(hdist(t,pod)<=3)t.seen=true;
 ME.name=self.name;ME.css=colonyColors[slot];ME.color=parseInt(ME.css.slice(1),16);
 S.site={name:'Party landing sector '+(slot+1),lat:latOf(tile),lon:lonOf(tile),blurb:'Your own colony on the shared Mars map. Classmates manage their own colonies.'};
 S.classroom={version:1,code:next.code,member,slot};S.rivals=[];S.claimN=0;S.lastSplit=null;
 if(S.operations)S.operations.rivalBoost=null;
 syncParty(next);
}
function syncParty(next){
 const before=S.rivals.map(r=>[r.partyId,r.c,r.r,r.pop,r.name]).join('|');
 S.rivals=next.players.filter(p=>p.id!==member).map(p=>{
  const slot=slotOf(p,next),site=siteFor(slot),css=colonyColors[slot];
  return {partyId:p.id,slot,name:p.name,av:'star',css,color:parseInt(css.slice(1),16),...site,pop:p.pop,beds:p.beds,appeal:p.appeal,fame:p.fame,online:p.online,development:{parts:0,metal:0,builds:[],job:null,tradeUntil:0,agenda:'Managed by your classmate'}};
 });
 const changed=before!==S.rivals.map(r=>[r.partyId,r.c,r.r,r.pop,r.name]).join('|');
 if(changed){
  // Update only remote ownership/markers. Own buildings, explored ground and
  // the player's camera/walking position must survive every room response.
  for(const t of S.tiles)if(t.owner)delete t.owner;
  S.claimN=0;claimAll();
  if(R3?.overlay&&window.THREE){
   for(const g of R3.rmesh||[])g.parent?.remove(g);
   R3.rmesh=S.rivals.map(r=>{const g=new THREE.Group();fillBuilding(g,'pod');const t=tileAt(r.c,r.r);g.position.set(tx(t),tileY(t)+.03,tz(t));R3.overlay.add(g);return g;});
   for(const f of R3.cflags||[])f.remove();R3.cflags=[];R3.terrSig='';
  }
 }
 return changed;
}
async function enter(path){
 if(joining)return;joining=true;const ticket=++generation;
 const name=document.getElementById('roomName')?.value||ME.name,code=document.getElementById('roomCode')?.value||'';
 try{
  const solo=Strategy.captureMission();const next=await api(path,{name,code});if(ticket!==generation)return;backup=solo;member=next.you;room=next;applied=0;seenWave=0;error='';
  DF=DIFFS[1];Junior.setModeForNewGame('commander');newGame(next.seed,0);DF=DIFFS[1];S.parts=DF.parts;S.water=120;S.speed=0;placeOwnColony(next);S.eco=compute();
  // Same terrain seed, distinct colony sites. Solo state is restored on leave.
  modalQ=[];modalOpen=false;if(R3){if(R3.fp)toggleWalk();buildWorld();}buildMenu();render();save();open();
 }catch(e){if(ticket===generation){error=e.message;const el=document.getElementById('roomError');if(el)el.textContent=error;}}
 finally{if(ticket===generation)joining=false;}
}
function report(){const c=Campaign.colonies()[0];return {...c,day:S.over?room.day:S.sol,blocked:!S.over&&(modalOpen||!!R3?.fp),over:!!S.over};}
function accept(next){
 const previousControls=hostControlsKey(room);room=next;error='';
 let changed=syncParty(next);
 if(next.grants>applied){Campaign.applyArrival(next.grants-applied);applied=next.grants;save();}
 if(next.lastArrival&&next.lastArrival.wave>seenWave){seenWave=next.lastArrival.wave;const a=next.lastArrival;Campaign.data().arrivals.unshift({...a,sol:a.day});Campaign.data().arrivals=Campaign.data().arrivals.slice(0,12);BlackoutAudio?.cue('success');log('Room shuttle: '+a.names.map((n,i)=>n+' +'+a.seats[i]).join(', ')+'.','good');}
 S.speed=next.speed;
 // Synchronize one day at a time; the server waits until every client catches up.
 if(!modalOpen&&!R3?.fp&&!S.over&&S.sol<next.day){advancing=true;try{tickSol();}finally{advancing=false;}S.speed=next.speed;syncParty(next);render();save();changed=false;}
 if(changed)render();
 if(Date.now()-lastSave>3000){lastSave=Date.now();save();}
 const list=document.getElementById('roomPlayers');if(list)list.innerHTML=next.players.map(p=>'<li>'+esc(p.name)+(p.id===next.you?' · your colony':' · classmate colony')+' · sector '+(slotOf(p,next)+1)+(p.online?'':' · disconnected')+'</li>').join('');
 const state=document.getElementById('roomStatus');if(state)state.textContent=clockLabel();
 if(previousControls!==hostControlsKey(next))updateHostControls();
}
async function poll(){
 if(!room||busy||joining)return;const ticket=generation;busy=true;
 try{const next=await api('state',{report:report()});if(ticket!==generation||!room)return;accept(next);}
 catch(e){if(ticket!==generation)return;error=e.message;S.speed=0;if(e.status===401){generation++;room=null;member=null;busy=false;syncParty({players:[]});delete S.classroom;S.lastSplit=null;if(S.operations)S.operations.rivalBoost=null;try{sessionStorage.removeItem(key);}catch(_){}render();document.dispatchEvent(new CustomEvent('campaign:alert',{detail:{title:'Room ended',text:error+' Your colony is intact and paused. Classmates have been disconnected; you can continue this colony alone.'}}));}}
 finally{if(ticket===generation)busy=false;}
}
async function control(body){
 if(!room?.host)return;const ticket=generation;
 try{const next=await api('control',body);if(ticket!==generation||!room)return;accept(next);if(body.start){closeDialog();poll();}}
 catch(e){if(ticket===generation){error=e.message;open();}}
}
async function leave(){
 // Invalidate outstanding polls before restoring solo state. A delayed response
 // must never reconnect this tab or apply room passengers to the solo colony.
 generation++;const leaving=room?api('leave'):Promise.resolve();
 room=null;member=null;busy=false;joining=false;const solo=backup;backup=null;
 try{sessionStorage.removeItem(key);}catch(_){}S.speed=0;closeDialog();if(solo)Strategy.restoreMission(solo);render();
 try{await leaving;}catch(_){}
}
function clockLabel(){return error?'Connection paused':!room?.started?'Waiting for host':room.pending?'Shuttle countdown':room.waitingFor?.length?'Waiting: '+room.waitingFor.join(', '):room.speed?'Room day '+room.day+' · speed '+room.speed:'Room paused';}
function hostControlsKey(value){return value?JSON.stringify([value.host,value.started,value.players.filter(p=>p.id!==member&&!p.online).map(p=>[p.id,p.name])]):'';}
function updateHostControls(){
 const controls=document.getElementById('roomHostControls');if(!controls||!room)return;
 const focused=document.activeElement,focusId=controls.contains?.(focused)?focused?.id:null;
 controls.innerHTML=room.host?'<button id="roomStart">'+(room.started?'Resume at speed 1':'Launch mission')+'</button>'+room.players.filter(p=>p.id!==member&&!p.online).map(p=>'<button data-remove-player="'+p.id+'">Remove disconnected '+esc(p.name)+'</button>').join(''):'';
 const start=document.getElementById('roomStart');if(start)start.onclick=()=>control({start:true,speed:1});controls.querySelectorAll('[data-remove-player]').forEach(b=>b.onclick=()=>control({remove:b.dataset.removePlayer}));
 // Replace only the action group, keeping the dialog and any other focused input.
 if(focusId)document.getElementById(focusId)?.focus();
}
function open(){
 if(!window.CampaignUI)return;
 if(!room){CampaignUI.show('Play together · private room','<p>Compete with up to eight classmates in Commander. Each player gets their own colony and landing sector on the Mars map. Your buildings, supplies, crew and discoveries are yours. Only the clock and ten-person arrival waves are shared. Your current solo colony will be restored when you leave.</p><div class="campaign-room-form"><label for="roomName">Colony nickname</label><input id="roomName" maxlength="24" value="'+esc(ME.name)+'"><label for="roomCode">Room code (to join)</label><input id="roomCode" maxlength="8" autocomplete="off" placeholder="Eight characters"><div class="campaign-room-actions"><button id="createRoom">Create private room</button><button id="joinRoom">Join room</button></div><p id="roomError" role="status">'+esc(error)+'</p></div><p>Use colony nicknames, not student names. Rooms last four hours and may end if the service restarts. No account or sign-in.</p>');document.getElementById('createRoom').onclick=()=>enter('create');document.getElementById('joinRoom').onclick=()=>enter('join');return;}
 CampaignUI.show('Classroom · '+room.code,'<p><b>Your colony: '+esc(ME.name)+'</b> · landing sector '+((S.classroom?.slot??0)+1)+'. You manage only your own buildings, supplies and crew.</p><p>Share code <strong>'+room.code+'</strong> with classmates. Join before the host launches.</p><p id="roomStatus" role="status">'+esc(clockLabel())+'</p><ul id="roomPlayers">'+room.players.map(p=>'<li>'+esc(p.name)+(p.id===member?' · your colony':' · classmate colony')+' · sector '+(slotOf(p,room)+1)+'</li>').join('')+'</ul><p>The host controls speeds 1–5. Time waits if a player disconnects, opens a decision popup or walks on Mars. Close popups to continue. Classmate names and crew counts appear on their own map markers. The leaderboard updates live.</p>'+'<p>Leave this room before starting a different mission.</p><div id="roomHostControls" class="campaign-room-actions"></div>'+'<p>'+esc(error)+'</p><p>Classroom competition uses locally calculated colony statistics. It is not a ranked anti-cheat service. Room state is temporary.</p>',[{label:'Return to colony',primary:true},{label:'Leave room · restore solo colony',fn:()=>{leave();return false;}}]);
 updateHostControls();
}
window.Classroom={open,leave,poll,speed:s=>control({speed:s}),rows:()=>room?.players||[],pending:()=>room?.pending,clockLabel,get advancing(){return advancing;},get connected(){return !!room;},get host(){return !!room?.host;}};
// Two full eight-player rooms fit beneath the shared school-network request cap.
setInterval(poll,500);
// Resume this tab's room only after recovering and validating its colony snapshot.
setTimeout(()=>{if(room||joining)return;try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.member&&saved.room&&saved.mission){Strategy.validateMission(saved.mission);generation++;member=saved.member;backup=saved.backup;applied=saved.applied||0;seenWave=saved.seenWave||0;room=saved.room;Strategy.restoreMission(saved.mission);poll();}}catch(_){try{sessionStorage.removeItem(key);}catch(_){}}},800);
})();
