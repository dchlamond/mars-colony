/* Timed scan lifecycle and real discovery rewards, with DOM/rendering stubbed.
 * The shipped FieldScan and FieldDiscovery logic run unchanged in the engine VM. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {engine}=require('./engine-harness.cjs');
const e=engine();let now=1000,checks=0;
function check(actual,expected,message){assert.deepEqual(actual,expected,message);checks++;}
e.context.performance.now=()=>now;
e.context.cancelAnimationFrame=()=>{};
e.context.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
e.context.document.hidden=false;
e.context.document.head=e.context.document.createElement('head');
e.context.document.exitPointerLock=()=>{};
e.run("R3={fp:{x:0,z:0}};modalOpen=false;");
e.run(fs.readFileSync(path.resolve(__dirname,'../game/field-scan.js'),'utf8'),'field-scan.js');
const scanner=e.context.FieldScan;
let completed=0,valid=true;
function ready(){scanner.cancel();now+=10000;valid=true;e.context.document.hidden=false;e.run('R3={fp:{x:0,z:0}};modalOpen=false;');}
function begin(){return scanner.start({label:'Test rock',valid:()=>valid,complete:()=>completed++,anchor:{x:0,y:0,z:0}});}
function finish(){now+=2400;scanner.update(now);}
ready();check(begin(),true,'A valid scan starts');check(scanner.busy,true,'The scan is busy');check(completed,0,'Starting does not grant a discovery');
check(begin(),false,'Repeated input does not queue another scan');
now+=2399;scanner.update(now);check(completed,0,'No completion before the full duration');
now++;scanner.update(now);check(completed,1,'Completes at the duration boundary');check(scanner.busy,false,'Completion clears busy state');
scanner.update(now+10000);check(completed,1,'Subsequent frames do not complete twice');
for(const [name,invalidate] of [
 ['target changed',()=>{valid=false;}],
 ['left Walk',()=>e.run('R3.fp=null;')],
 ['opened a modal',()=>e.run('modalOpen=true;')],
 ['hidden tab',()=>{e.context.document.hidden=true;}],
 ['new mission object',()=>e.run('S={...S};')]
]){
 ready();begin();invalidate();const before=completed;finish();check(scanner.busy,false,name+' cancels');check(completed,before,name+' grants nothing');
}
ready();begin();scanner.cancel();const beforeCancel=completed;finish();check(completed,beforeCancel,'Manual cancellation prevents a late completion');
ready();begin();finish();check(completed,beforeCancel+1,'A canceled scan can restart');
// Integrate the actual ledger/reward implementation, rather than mocking awards.
e.context.CampaignUI={show(){e.context.__results=(e.context.__results||0)+1;}};
e.context.BlackoutAudio={cue(){}};
e.run(fs.readFileSync(path.resolve(__dirname,'../game/field-discovery.js'),'utf8'),'field-discovery.js');
function setupCampaign(){
 scanner.cancel();e.run("R3=null;Junior.start('junior',0,614);modalOpen=false;var scanTestTile=S.tiles.find(t=>t.type==='plain'&&!t.build);R3={fp:{x:tx(scanTestTile),z:tz(scanTestTile)}};");
 now+=10000;e.context.document.hidden=false;
}
setupCampaign();const parts=e.run('S.parts'),fame=e.run('S.fame');
e.context.FieldDiscovery.scan();check(e.run('S.parts'),parts,'F does not award Parts before scanning');check(e.run('S.fame'),fame,'F does not award Fame before scanning');
finish();check(e.run('S.parts'),parts+1,'Completed discovery grants one Part');check(e.run('S.fame'),fame+3,'Completed discovery grants three Fame');check(e.run('Object.keys(S.fieldDiscoveries.entries).length'),1,'Completed discovery adds one ledger entry');
e.context.FieldDiscovery.scan();finish();check(e.run('S.parts'),parts+1,'Rescanning cannot farm Parts');check(e.run('S.fame'),fame+3,'Rescanning cannot farm Fame');
setupCampaign();const walkingParts=e.run('S.parts');e.context.FieldDiscovery.scan();e.run('R3.fp.x+=2;');finish();check(e.run('S.parts'),walkingParts,'Walking away cancels before rewards');check(e.run('Object.keys(S.fieldDiscoveries?.entries||{}).length'),0,'Walking away records no entry');
scanner.cancel();e.run("R3=null;Blackout.start({});modalOpen=false;const blackoutTile=S.tiles.find(t=>t.type==='plain'&&!t.build);R3={fp:{x:tx(blackoutTile),z:tz(blackoutTile)}};");now+=10000;
const blackoutParts=e.run('S.parts'),blackoutFame=e.run('S.fame');e.context.FieldDiscovery.scan();finish();check(e.run('Object.keys(S.fieldDiscoveries.entries).length'),1,'Blackout still records a completed discovery');check(e.run('S.parts'),blackoutParts,'Blackout grants no campaign Parts');check(e.run('S.fame'),blackoutFame,'Blackout grants no campaign Fame');
console.log(JSON.stringify({checks,result:'passed',coverage:'duration boundary, repeated input, completion idempotence, cancellation, restart, real ledger/rewards, movement cancellation, Blackout isolation'}));
