const assert=require('node:assert/strict');
const R=require('../game/rock-find-rules.js');
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const state=(seed=614)=>({seed,sol:7,parts:10,water:20,o2:30});
const ids=Array.from({length:100},(_,i)=>'rock:3:4:'+i);
const first=ids.map(id=>R.rewardFor(614,id));
equal(ids.map(id=>R.rewardFor(614,id)),first,'Same seed and ID always yield the same find');
equal(ids.slice().reverse().map(id=>R.rewardFor(614,id)).reverse(),first,'Results do not depend on scanning order');
equal([...new Set(first.map(r=>r.kind))].sort(),['air','parts','water'],'All three reward categories are reachable');
check(ids.some((id,i)=>JSON.stringify(R.rewardFor(615,id))!==JSON.stringify(first[i])),'Different mission seeds vary finds');
const kindIds=Object.fromEntries(['parts','water','air'].map(kind=>[kind,ids.find(id=>R.rewardFor(614,id).kind===kind)]));
for(const [kind,id] of Object.entries(kindIds)){
 const s=state(),key=kind==='air'?'o2':kind,before=s[key],expected=kind==='parts'?3:5;
 const result=R.collect(s,id);check(result.ok&&!result.alreadyCollected&&result.rewarded,'First collection succeeds');equal(s[key],before+expected,'Correct resource and fixed reward');equal(result.amount,expected,'Ledger reports applied amount');
 const after=JSON.stringify(s);check(R.collect(s,id).alreadyCollected,'Duplicate collection is recognized');equal(JSON.stringify(s),after,'Duplicate collection changes nothing');
 const restored=JSON.parse(JSON.stringify(s));check(R.collect(restored,id).alreadyCollected,'Save/load preserves collected IDs');equal(restored,s,'Save/load cannot duplicate supplies');
}
const forward=state(),reverse=state();ids.forEach(id=>R.collect(forward,id));ids.slice().reverse().forEach(id=>R.collect(reverse,id));
for(const key of ['parts','water','o2'])equal(forward[key],reverse[key],'Collection order leaves totals unchanged');
for(const id of ids)equal(forward.rockFinds.entries[id],reverse.rockFinds.entries[id],'Per-rock ledger is independent of collection order');
const blackout=state(),before={parts:blackout.parts,water:blackout.water,o2:blackout.o2};
const blocked=R.collect(blackout,kindIds.air,{reward:false});check(blocked.ok&&!blocked.rewarded&&blocked.amount===0,'Discovery-only mode records a zero-reward find');
equal({parts:blackout.parts,water:blackout.water,o2:blackout.o2},before,'Discovery-only mode preserves mission supplies');
check(R.collect(blackout,kindIds.air).alreadyCollected,'Discovery-only rock cannot later be cashed in');equal(blackout.o2,before.o2,'Changing mode does not replay a reward');
const full=state();for(let i=0;i<R.MAX_ROCKS;i++)check(R.collect(full,'rock:'+i).ok,'Ledger accepts each supported rock');
equal(Object.keys(full.rockFinds.entries).length,500,'Ledger is bounded to 500 rocks');
const fullBefore=JSON.stringify(full);equal(R.collect(full,'rock:501'),{ok:false,reason:'ledger-full'},'No eviction allows reward farming after the cap');equal(JSON.stringify(full),fullBefore,'Full ledger changes no supplies');check(R.collect(full,'rock:0').alreadyCollected,'Previously collected rocks remain recognized at capacity');
for(const initial of [NaN,Infinity,-Infinity,-100,Number.MAX_VALUE]){
 const s=state();s.parts=initial;s.sol=NaN;const result=R.collect(s,kindIds.parts);
 check(Number.isFinite(s.parts)&&s.parts>=0&&s.parts<=R.MAX_RESOURCE,'Corrupt resources remain finite and bounded');check(Number.isFinite(result.sol)&&result.sol>=0,'Recorded day remains finite');
}
const capped=state();capped.water=24;const limited=R.collect(capped,kindIds.water,{caps:{water:25}});equal(capped.water,25,'Caller can enforce resource capacity');equal(limited.amount,1,'Ledger records only actual capacity-limited reward');
const airCapped=state();R.collect(airCapped,kindIds.air,{caps:{o2:32}});equal(airCapped.o2,32,'Air cap accepts actual o2 resource key');
for(const id of ['',null,{},'__proto__','constructor','prototype','bad\nrock','x'.repeat(129),NaN,Infinity]){
 const s=state();check(!R.collect(s,id).ok,'Invalid or prototype-sensitive IDs are rejected');equal(s,state(),'Rejected ID does not mutate the mission');equal(R.rewardFor(614,id),null,'Reward preview rejects the same invalid IDs');
}
equal(R.rewardFor(NaN,'rock:1'),R.rewardFor(0,'rock:1'),'Invalid seeds normalize deterministically');
const malformed=state();malformed.rockFinds={version:2,entries:{}};check(!R.collect(malformed,'rock:1').ok,'Unknown ledger version is preserved instead of resetting history');
const badEntry=state();badEntry.rockFinds={version:1,entries:{x:{kind:'air',amount:NaN,sol:7}}};const rejected=R.collect(badEntry,'x');check(!rejected.ok&&rejected.alreadyCollected,'Malformed saved entry is not paid out a second time');
console.log(JSON.stringify({checks,result:'passed',coverage:'deterministic individual rewards, order independence, exact supplies, repeat/save/load protection, Blackout discovery-only, 500-rock cap, finite capacities, safe IDs'}));
