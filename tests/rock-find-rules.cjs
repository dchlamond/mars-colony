const assert=require('node:assert/strict');
const R=require('../game/rock-find-rules.js');
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const state=(seed=614)=>({seed,sol:7,parts:10,water:20,o2:30,fame:9});
const location={c:0,r:0},ids=Array.from({length:100},(_,i)=>'rock:3:4:'+i);
const supplies=s=>({parts:s.parts,water:s.water,o2:s.o2,fame:s.fame});
equal(R.SOURCE_IDS,['mola'],'Only the NASA MOLA dataset is selectable');
for(const id of ids){
 equal(R.evidenceFor(614,id),{sourceId:'mola'},'Every ID links to MOLA, never an invented composition');
 equal(R.evidenceFor(999,id),{sourceId:'mola'},'Changing the seed cannot invent another observation');
}
const s=state(),before=supplies(s);
const first=R.collect(s,ids[0],{c:71,r:40,reward:true,caps:{water:100}});
check(first.ok&&!first.alreadyCollected,'First evidence recording succeeds');
equal(s.rockEvidence.entries[ids[0]],{sourceId:'mola',sol:7,c:71,r:40},'Stores the actual supplied grid location');
equal(supplies(s),before,'Recording does not change supplies or Fame even with obsolete reward options');
check(!('rockFinds' in s),'Recording never creates an old reward ledger');
const serialized=JSON.stringify(s);check(R.collect(s,ids[0]).alreadyCollected,'Repeated review recognizes the recorded ID');equal(JSON.stringify(s),serialized,'Repeated review changes no state');
const restored=JSON.parse(serialized);check(R.collect(restored,ids[0],location).alreadyCollected,'Reloaded evidence retains scan history');equal(restored,s,'Reload and rescan cannot mutate supplies');
const forward=state(),reverse=state();ids.forEach(id=>R.collect(forward,id,location));ids.slice().reverse().forEach(id=>R.collect(reverse,id,location));
for(const id of ids)equal(forward.rockEvidence.entries[id],reverse.rockEvidence.entries[id],'Scan order does not affect evidence');
equal(supplies(forward),supplies(state()),'Scanning one hundred rocks changes no resources or Fame');
const legacy=state();legacy.rockFinds={version:1,entries:{'rock:old':{kind:'air',amount:5,sol:3,rewarded:true}}};const legacyBefore=JSON.stringify(legacy.rockFinds);
check(R.collect(legacy,'rock:old',location).ok,'Archived reward IDs can have a new evidence-only record');equal(JSON.stringify(legacy.rockFinds),legacyBefore,'Archived rewards remain untouched');equal(supplies(legacy),supplies(state()),'Archived entries are never paid again');
const full=state();for(let i=0;i<R.MAX_ROCKS;i++)check(R.collect(full,'rock:'+i,location).ok,'Ledger accepts supported evidence');
equal(Object.keys(full.rockEvidence.entries).length,500,'Evidence ledger is bounded');const fullBefore=JSON.stringify(full);equal(R.collect(full,'rock:501',location),{ok:false,reason:'ledger-full'},'No evidence eviction at capacity');equal(JSON.stringify(full),fullBefore,'A full ledger changes no state');check(R.collect(full,'rock:0').alreadyCollected,'Review still works at capacity');
for(const id of ['',null,{},'__proto__','constructor','prototype','bad\nrock','<img>','x'.repeat(129),NaN,Infinity]){const current=state();check(!R.collect(current,id,location).ok,'Unsafe ID rejected');equal(current,state(),'Unsafe ID does not mutate state');equal(R.evidenceFor(614,id),null,'Preview rejects unsafe ID');}
for(const coords of [undefined,null,{},[],{c:-1,r:0},{c:72,r:0},{c:0,r:41},{c:0,r:-1},{c:.1,r:0},{c:0,r:NaN},{c:'0',r:0}]){const current=state();check(!R.collect(current,'rock:1',coords).ok,'Missing or out-of-bounds location rejected');equal(current,state(),'Invalid location leaves state unchanged');}
const malformed=state();malformed.rockEvidence={version:2,entries:{}};check(!R.collect(malformed,'rock:1',location).ok,'Unknown evidence version rejected');
const bad=state();bad.rockEvidence={version:1,entries:{r:{sourceId:'fictional-mineral',sol:7,c:0,r:0}}};check(!R.collect(bad,'r',location).ok,'Unapproved dataset rejected');
console.log(JSON.stringify({checks,result:'passed',coverage:'MOLA-only references, supplied locations, zero resources/Fame, order independence, repeat/reload protection, archived reward compatibility, capacity and safe IDs'}));
