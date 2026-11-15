/* Deterministic exploration rewards. These are game supply finds, not measurements.
 * A rock's stable ID can be collected once per mission, including after save/load. */
(function(root){
'use strict';
const VERSION=1,MAX_ROCKS=500,MAX_RESOURCE=1000000000;
const REWARDS=[{kind:'parts',amount:3},{kind:'water',amount:5},{kind:'air',amount:5}];
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const finite=(value,fallback=0)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,finite(value,min)));
function rockId(value){
 if(typeof value!=='string'&&typeof value!=='number')return null;
 if(typeof value==='number'&&!Number.isFinite(value))return null;
 const id=String(value);
 return !id||id.length>128||/[\u0000-\u001f\u007f]/.test(id)||['__proto__','constructor','prototype'].includes(id)?null:id;
}
function rewardFor(seed,id){
 id=rockId(id);if(id===null)return null;
 const text=String(finite(seed))+'|'+id;let hash=2166136261;
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
 hash=Math.imul(hash^(hash>>>16),2246822507)>>>0;hash=Math.imul(hash^(hash>>>13),3266489909)>>>0;hash=(hash^(hash>>>16))>>>0;
 return {...REWARDS[hash%REWARDS.length]};
}
function collect(state,id,options={}){
 id=rockId(id);if(!state||typeof state!=='object'||Array.isArray(state)||id===null)return {ok:false,reason:'invalid-rock'};
 options=options&&typeof options==='object'?options:{};
 if(state.rockFinds==null)state.rockFinds={version:VERSION,entries:{}};
 const ledger=state.rockFinds;
 if(ledger.version!==VERSION||!ledger.entries||typeof ledger.entries!=='object'||Array.isArray(ledger.entries))return {ok:false,reason:'invalid-ledger'};
 if(own(ledger.entries,id)){
  const entry=ledger.entries[id];
  if(!entry||!REWARDS.some(r=>r.kind===entry.kind)||!Number.isFinite(entry.amount)||entry.amount<0||!Number.isFinite(entry.sol))return {ok:false,reason:'invalid-entry',alreadyCollected:true,id};
  return {ok:true,alreadyCollected:true,id,kind:entry.kind,amount:entry.amount,sol:entry.sol,rewarded:entry.rewarded===true};
 }
 if(Object.keys(ledger.entries).length>=MAX_ROCKS)return {ok:false,reason:'ledger-full'};
 const reward=rewardFor(state.seed,id),resource=reward.kind==='air'?'o2':reward.kind;
 const sol=Math.floor(clamp(state.sol,0,Number.MAX_SAFE_INTEGER));let amount=0;
 if(options.reward!==false){
  const requestedCap=options.caps?.[reward.kind]??options.caps?.[resource];
  const cap=requestedCap===undefined?MAX_RESOURCE:clamp(requestedCap,0,MAX_RESOURCE);
  const before=clamp(state[resource],0,cap),after=Math.min(cap,before+reward.amount);
  state[resource]=after;amount=after-before;
 }
 const entry={kind:reward.kind,amount,sol,rewarded:amount>0};
 ledger.entries[id]=entry;
 return {ok:true,alreadyCollected:false,id,...entry};
}
const api={VERSION,MAX_ROCKS,MAX_RESOURCE,rewardFor,collect};
root.RockFindRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
