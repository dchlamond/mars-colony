/* Record the NASA MOLA terrain dataset location at an individual teaching site.
 * Scanning never creates supplies, identifies a real sample, or awards Fame.
 * Legacy rockFinds records are preserved separately for save compatibility. */
(function(root){
'use strict';
const VERSION=1,MAX_ROCKS=500;
const SOURCE_IDS=Object.freeze(['mola']),GRID_COLS=72,GRID_ROWS=41;
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const finite=(value,fallback=0)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
const record=value=>{if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return p===null||Object.getPrototypeOf(p)===null;};
const location=value=>record(value)&&Number.isInteger(value.c)&&value.c>=0&&value.c<GRID_COLS&&Number.isInteger(value.r)&&value.r>=0&&value.r<GRID_ROWS;
function rockId(value){
 if(typeof value!=='string'&&typeof value!=='number')return null;
 if(typeof value==='number'&&!Number.isFinite(value))return null;
 const id=String(value);
 return !/^[A-Za-z0-9][A-Za-z0-9:._/-]{0,127}$/.test(id)||['__proto__','constructor','prototype'].includes(id)?null:id;
}
function evidenceFor(seed,id){
 id=rockId(id);if(id===null)return null;
 return {sourceId:'mola'};
}
function collect(state,id,options){
 id=rockId(id);if(!record(state)||id===null)return {ok:false,reason:'invalid-rock'};
 if(state.rockEvidence===undefined){if(!location(options))return {ok:false,reason:'invalid-location'};state.rockEvidence={version:VERSION,entries:{}};}
 const ledger=state.rockEvidence;
 if(!record(ledger)||ledger.version!==VERSION||!record(ledger.entries))return {ok:false,reason:'invalid-ledger'};
 if(own(ledger.entries,id)){
  const entry=ledger.entries[id];
  if(!record(entry)||!location(entry)||entry.sourceId!=='mola'||!Number.isSafeInteger(entry.sol)||entry.sol<0)return {ok:false,reason:'invalid-entry',alreadyCollected:true,id};
  return {ok:true,alreadyCollected:true,id,sourceId:entry.sourceId,sol:entry.sol,c:entry.c,r:entry.r};
 }
 if(Object.keys(ledger.entries).length>=MAX_ROCKS)return {ok:false,reason:'ledger-full'};
 if(!location(options))return {ok:false,reason:'invalid-location'};
 const source=evidenceFor(state.seed,id),sol=Math.floor(Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,finite(state.sol))));
 const entry={sourceId:source.sourceId,sol,c:options.c,r:options.r};
 ledger.entries[id]=entry;
 return {ok:true,alreadyCollected:false,id,...entry};
}
const api={VERSION,MAX_ROCKS,SOURCE_IDS,GRID_COLS,GRID_ROWS,evidenceFor,collect};
root.RockFindRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
