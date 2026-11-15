/* Real room client with deferred HTTP responses. Simulation/restore logic is real;
 * DOM and network are isolated so a late response can be reproduced reliably. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {engine}=require('./engine-harness.cjs');
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks++;};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data});
function setup(host=true,slot=0,roster=null){
 const e=engine();e.context.sessionStorage=new e.context.Storage();e.context.AbortSignal=AbortSignal;e.context.BlackoutAudio={cue(){}};
 e.run("Junior.start('junior');S.parts=111;R3=null;window.CampaignUI={esc:String,show(){modalOpen=true;}};");
 const players=roster?JSON.parse(JSON.stringify(roster)):[{id:'a'.repeat(32),name:'Alpha',slot,pop:6,beds:8,appeal:75,fame:0,online:true}];
 const room={code:'TESTROOM',you:players.find(p=>p.slot===slot).id,slot,host,seed:614,day:1,speed:0,started:false,pending:null,grants:0,lastArrival:null,players,waitingFor:[]};
 const routes={};
 e.context.fetch=async(path,options)=>{const key=path.split('/').at(-1);if(routes[key])return routes[key](JSON.parse(options.body));return response(key==='create'?room:{ok:true});};
 const callbacks=[],timers=[];e.context.setInterval=(fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;};e.context.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
 e.run(fs.readFileSync('game/classroom.js','utf8'),'classroom.js');
 return {e,room,routes,callbacks,timers,async enter(){e.run('Classroom.open()');await e.nodes.get('createRoom').onclick();e.run('modalOpen=false');}};
}
async function staleResponse(kind,status=200){
 const h=setup();await h.enter();const d=deferred(),leaving=deferred();h.routes[kind]=()=>d.promise;h.routes.leave=()=>leaving.promise;
 const operation=kind==='control'?h.e.context.Classroom.speed(5):h.e.context.Classroom.poll();await Promise.resolve();
 const exit=h.e.context.Classroom.leave();
 check(!h.e.context.Classroom.connected,'Leave detaches before network cleanup returns');check(h.e.run('S.parts===111&&S.pop===6'),'Solo state restores immediately');
 h.e.run('S.speed=3');d.resolve(response(status===200?{...h.room,speed:5,grants:2}:{error:'Expired room'},status));await operation;
 check(!h.e.context.Classroom.connected,'Late response cannot reconnect');check(h.e.run('S.parts===111&&S.pop===6&&S.speed===3'),'Late response cannot mutate restored solo economy or clock');
 check(h.e.context.sessionStorage.getItem('mars-classroom-v1')===null,'Late response cannot recreate room recovery');leaving.resolve(response({ok:true}));await exit;
}
function attachClock(h){
 const buttons=[{disabled:false,dataset:{},setAttribute(){}},{disabled:false,dataset:{timePace:'3'},setAttribute(){}}];
 const create=h.e.context.document.createElement;
 h.e.context.document.createElement=tag=>{const el=create(tag);el.querySelectorAll=selector=>selector==='button'?buttons:[];return el;};
 h.e.run(fs.readFileSync('game/time-controls.js','utf8'),'time-controls.js');return {buttons,update:h.callbacks.at(-1).fn};
}
function attachMissionUI(h){
 const e=h.e,queued=[];e.context.document.createElementNS=(_,tag)=>e.context.document.createElement(tag);
 Object.getPrototypeOf(e.context.document.body).insertBefore=function(el){this.append(el);};e.context.MutationObserver=class{observe(){}};
 e.context.queueMicrotask=fn=>queued.push(fn);e.run("window.__MARS_MODE__='commander';");
 e.run(fs.readFileSync('game/ares-ui.js','utf8'),'ares-ui.js');
 e.run('window.__auditModal=null;modal=options=>{window.__auditModal=options;modalOpen=true;};');
 return queued;
}
(async()=>{
 await staleResponse('state');await staleResponse('control');await staleResponse('state',401);
 const h=setup();await h.enter();h.routes.state=()=>response({...h.room,grants:2});await h.e.context.Classroom.poll();check(h.e.run('S.pop===8'),'Normal grants applied');await h.e.context.Classroom.poll();check(h.e.run('S.pop===8'),'Repeated grants stay idempotent');
 const saved=h.e.context.sessionStorage.getItem('mars-classroom-v1');check(JSON.parse(saved).applied===2,'Grant receipt is saved immediately');
 const resumed=setup();resumed.e.context.sessionStorage.setItem('mars-classroom-v1',saved);resumed.routes.state=()=>response({...resumed.room,grants:2});resumed.timers.find(t=>t.ms===800).fn();await new Promise(setImmediate);
 check(resumed.e.context.Classroom.connected&&resumed.e.run('S.pop===8'),'Refresh restores the room colony without duplicating grants');await resumed.e.context.Classroom.leave();check(resumed.e.run('S.parts===111&&S.pop===6'),'Recovered room retains the original solo backup');
 const joining=setup(),pendingJoin=deferred();joining.routes.create=()=>pendingJoin.promise;joining.e.context.sessionStorage.setItem('mars-classroom-v1',saved);const join=joining.enter();joining.timers.find(t=>t.ms===800).fn();check(!joining.e.context.Classroom.connected,'Scheduled recovery cannot replace a new join in progress');pendingJoin.resolve(response(joining.room));await join;check(joining.e.context.Classroom.connected&&joining.e.run('S.pop===6'),'Newly requested room wins over old recovery data');
 check(h.callbacks[0].ms===500,'Room polling stays within two-room school NAT budget');
 const hostClock=attachClock(h);h.e.run("S.over='lose'");hostClock.update();check(hostClock.buttons.every(b=>!b.disabled),'Eliminated host retains shared-clock controls');
 const g=setup(false);await g.enter();const guestClock=attachClock(g);guestClock.update();check(guestClock.buttons.every(b=>b.disabled),'Guest cannot change host clock');g.e.run("S.over='lose'");guestClock.update();check(guestClock.buttons.every(b=>b.disabled),'Eliminated guest still cannot change host clock');
 const s=setup();const soloClock=attachClock(s);s.e.run("S.over='lose'");soloClock.update();check(soloClock.buttons.every(b=>b.disabled),'Ended solo game does not resume');
 // The real settings/welcome handlers may never replace an active room mission.
 const restart=setup();await restart.enter();const queued=attachMissionUI(restart),roomBefore=restart.e.run('JSON.stringify(Strategy.captureMission())');let roomDialogs=0;
 restart.e.context.CampaignUI.show=()=>{roomDialogs++;restart.e.run('modalOpen=true');};
 restart.e.nodes.get('aresNewMission').onclick();check(roomDialogs===1&&!restart.e.context.__auditModal,'Room restart opens room controls instead of replace-mission confirmation');
 restart.e.context.AresUI.showWelcome();check(roomDialogs===2&&queued.length===0,'Direct welcome entry cannot escape an active room');
 check(restart.e.run('JSON.stringify(Strategy.captureMission())')===roomBefore&&restart.e.context.Classroom.connected,'Attempted restart preserves room day, site, supplies and membership');
 await restart.e.context.Classroom.leave();restart.e.nodes.get('aresNewMission').onclick();check(restart.e.context.__auditModal.title==='Start a new mission?','Normal mission restart becomes available after leaving');
 restart.e.context.__auditModal.buttons.find(b=>b.label==='Choose without saving').fn();check(queued.length===1,'Solo restart still queues the real mission selection');
 queued.shift()();check(restart.e.context.__auditModal.title==='DEAD RECKONING: BLACKOUT','Solo player can still reach mission selection');
 const pendingWelcome=setup(),pendingWelcomeQueue=attachMissionUI(pendingWelcome);pendingWelcome.e.context.AresUI.showWelcome();await pendingWelcome.enter();pendingWelcomeQueue.shift()();
 check(!pendingWelcome.e.context.__auditModal&&pendingWelcome.e.context.Classroom.connected,'Welcome queued before a join rechecks room membership before opening');
 // Host transfer updates the action group in the already-open room dialog.
 const promoted=setup(false);await promoted.enter();check(promoted.e.nodes.get('roomHostControls').innerHTML==='','Guest room dialog has no host actions');
 let dialogReopens=0,controlRequest=null;promoted.e.context.CampaignUI.show=()=>dialogReopens++;const retainedFocus={id:'unchanged-input'};promoted.e.context.document.activeElement=retainedFocus;
 const promotedRoom={...promoted.room,host:true,started:true};promoted.routes.state=()=>response(promotedRoom);await promoted.e.context.Classroom.poll();
 check(promoted.e.nodes.get('roomHostControls').innerHTML.includes('Resume at speed 1'),'New host immediately sees Resume in the existing room dialog');
 check(dialogReopens===0&&promoted.e.context.document.activeElement===retainedFocus,'Host transfer preserves the open dialog and unrelated input focus');
 promoted.routes.control=body=>{controlRequest=body;return response({...promotedRoom,speed:1});};await promoted.e.nodes.get('roomStart').onclick();
 check(controlRequest?.start===true&&controlRequest.speed===1,'Newly displayed Resume is wired to the shared host clock');
 // Eight real simulations share a room seed, but never an owned colony object.
 const roster=Array.from({length:8},(_,slot)=>({id:slot.toString(16).padStart(32,'a'),slot,name:'Colony '+slot,pop:6,beds:8,appeal:75,fame:0,online:true})),party=[];
 for(let slot=0;slot<8;slot++){const c=setup(slot===0,slot,roster);c.e.run('ACAD.right='+slot);await c.enter();party.push(c);}
 const sites=party.map(c=>c.e.run('S.builds[0].c+":"+S.builds[0].r'));check(new Set(sites).size===8,'Eight players land at eight distinct colony sites');
 const starts=party.map(c=>c.e.run('JSON.stringify([S.pop,S.parts,S.water,S.o2,S.food,S.metal])'));check(starts.every(start=>start===starts[0]),'Every player starts with equal difficulty and supplies, regardless of solo Academy answers');
 for(let slot=0;slot<8;slot++){
  const c=party[slot];check(c.e.run('S.classroom.slot')===slot,'Player retains their assigned colony slot');check(c.e.run('ME.name')===roster[slot].name,'Owned colony keeps its own nickname');
  check(c.e.run('S.rivals.length')===7,'Only the seven classmates appear as rivals');check(c.e.run('S.rivals.every(r=>r.partyId&&r.name.startsWith("Colony "))'),'AI colonies are replaced by classmate markers');
  for(const other of c.e.run('S.rivals'))check(other.c+':'+other.r===sites[other.slot],'Every client agrees on each classmate map position');
 }
 const a=party[0],b=party[1],bBefore=b.e.run('JSON.stringify(Strategy.captureMission())');
 a.e.run(fs.readFileSync('game/rock-find-rules.js','utf8'),'rock-find-rules.js');
 a.e.run("S.parts=100;S.metal=100;var buildingTarget=S.tiles.find(t=>t.seen&&!t.owner&&!t.build&&t.type==='plain');G.tryBuild('solar',buildingTarget);ColonySystems.assign(0,'training');RockFindRules.collect(S,'rock:private:0');");
 check(a.e.run('S.builds.length')===2,'Owner can construct a building in their colony');check(b.e.run('JSON.stringify(Strategy.captureMission())')===bBefore,'Other player building/resources/crew/discoveries are untouched');
 const ownBuildings=b.e.run('S.builds'),ownTiles=b.e.run('S.tiles'),ownResources=b.e.run('JSON.stringify([S.parts,S.water,S.o2,S.food,S.pop,S.management])');b.e.run('R3={fp:{x:12,z:34},target:{x:7,z:8},dist:22};');
 const changedRoster=roster.map(p=>p.slot===0?{...p,pop:9,appeal:88,fame:24}:p);b.routes.state=()=>response({...b.room,players:changedRoster,grants:0});await b.e.context.Classroom.poll();
 check(b.e.run('S.rivals.find(r=>r.slot===0).pop')===9,'Classmate marker receives its own live population');check(b.e.run('S.builds')===ownBuildings&&b.e.run('S.tiles')===ownTiles,'Room metrics never replace owned buildings or map');check(b.e.run('JSON.stringify([S.parts,S.water,S.o2,S.food,S.pop,S.management])')===ownResources,'Remote metrics do not overwrite local supplies or crew');check(b.e.run('R3.fp.x===12&&R3.fp.z===34&&R3.target.x===7&&R3.dist===22'),'Remote poll never teleports walker or camera');
 const player3=party[3],position3=sites[3];player3.routes.state=()=>response({...player3.room,host:true,players:changedRoster.filter(p=>p.slot!==0),grants:0});await player3.e.context.Classroom.poll();check(player3.e.run('S.builds[0].c+":"+S.builds[0].r')===position3,'Host transfer does not move existing colony');check(player3.e.run('S.rivals.every(r=>r.slot!==0)'),'Departed colony marker is removed');
 const visual=party[6],T=require('../game/vendor/three.min.js'),overlay=new T.Group(),oldMarker=new T.Group(),ownedActor=new T.Group();overlay.add(oldMarker,ownedActor);visual.e.context.THREE=T;visual.e.run('R3={fp:{x:12,z:34},target:{x:7,z:8},dist:22};fillBuilding=(g,type)=>{g.userData.kind=type;};');Object.assign(visual.e.run('R3'),{overlay,rmesh:[oldMarker],cflags:[]});visual.routes.state=()=>response({...visual.room,players:changedRoster});await visual.e.context.Classroom.poll();check(oldMarker.parent===null&&ownedActor.parent===overlay,'Remote marker update removes only remote graphics');check(visual.e.run('R3.rmesh.length')===7,'Seven classmates have seven read-only map pods');check(visual.e.run('R3.rmesh.every((g,i)=>g.position.x===tx(tileAt(S.rivals[i].c,S.rivals[i].r))&&g.position.z===tz(tileAt(S.rivals[i].c,S.rivals[i].r)))'),'Rendered markers match assigned landing coordinates');check(visual.e.run('R3.fp.x===12&&R3.fp.z===34&&R3.target.x===7&&R3.dist===22'),'Rendering party markers never moves the player');
 const remoteBudget=a.e.run('JSON.stringify(S.rivals.map(r=>r.development))');a.e.run('S.sol=30;ColonySystems.endSol();');check(a.e.run('JSON.stringify(S.rivals.map(r=>r.development))')===remoteBudget,'Local simulation never develops classmate colonies as AI');check(a.e.context.ColonySystems.trade(0)===false,'No fake trade spends classmate resources');
 const remoteAppeal=a.e.run('JSON.stringify(S.rivals.map(r=>r.appeal))');a.e.run('Campaign.afterDay();');check(a.e.run('JSON.stringify(S.rivals.map(r=>r.appeal))')===remoteAppeal,'Day-ten campaign logic never changes classmates’ Appeal');
 const singleton=setup();await singleton.enter();singleton.e.run('Operations.accept(Object.keys(Operations.contracts)[0]);S.sol=Operations.state().active.deadline;Operations.step();');check(singleton.e.run('Operations.state().active===null&&Operations.state().rivalBoost===null'),'Solo host can miss a council promise without an absent-rival crash');
 const retained=party[2].e.context.sessionStorage.getItem('mars-classroom-v1'),recovered=setup(false,2,roster);recovered.e.context.sessionStorage.setItem('mars-classroom-v1',retained);recovered.routes.state=()=>response(recovered.room);recovered.timers.find(t=>t.ms===800).fn();await new Promise(setImmediate);check(recovered.e.run('S.builds[0].c+":"+S.builds[0].r')===sites[2],'Refreshing resumes the same owned landing site');
 await recovered.e.context.Classroom.leave();check(recovered.e.run('S.parts===111&&S.rivals.some(r=>r.name==="Colony Ares")'),'Leaving restores solo resources and computer rivals');
 const expired=party[4],ownedBeforeExpiry=expired.e.run('JSON.stringify([S.builds,S.parts,S.water,S.o2,S.pop,S.site])');expired.routes.state=()=>response({error:'Room expired'},401);await expired.e.context.Classroom.poll();check(!expired.e.context.Classroom.connected,'Expired room disconnects');check(expired.e.run('S.rivals.length===0&&!S.classroom&&!S.tiles.some(t=>t.owner)'),'Expiry removes classmate markers and remote ownership');check(expired.e.run('JSON.stringify([S.builds,S.parts,S.water,S.o2,S.pop,S.site])')===ownedBeforeExpiry,'Expiry keeps owned colony, resources and landing site');expired.e.run('S.sol=30;ColonySystems.endSol();');check(expired.e.run('S.rivals.length===0'),'Expired classmates never restart as computer colonies');expired.e.run('S.sol=4;S.appeal=0;modal=()=>{};modalOpen=false;tickSol();');check(expired.e.run('S.sol===5&&S.rivals.length===0'),'Low-Appeal solo time continues safely after room expiry');
 console.log(JSON.stringify({checks,result:'passed',coverage:'late-response/recovery isolation, per-player resources/builds/crew/discoveries, eight distinct stable colony sites, live remote markers, no camera teleport, no AI classmate simulation, shared grants/clock permissions'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
