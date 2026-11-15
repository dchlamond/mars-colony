/* Shared browser/server rules. Allocation conserves people; Fame limits awareness,
   Appeal weights choices, and beds cap arrivals. All constants are game tuning. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a));
function awareness(fame){return clamp(.25+Math.sqrt(clamp(fame,0,10000))/20,.25,1);}
function allocate(pool,colonies){
 pool=Math.floor(clamp(pool,0,100));
 const weights=colonies.map(c=>c.open===false||c.appeal<35?0:Math.pow(clamp(c.appeal,0,100)/100,2));
 const caps=colonies.map((c,i)=>weights[i]?Math.min(Math.floor(clamp(c.beds-c.pop,0,100)),Math.ceil(pool*awareness(c.fame))):0);
 const seats=colonies.map(()=>0);let remaining=pool;
 // Highest averages produces a deterministic, capacity-aware proportional split.
 while(remaining>0){let best=-1,priority=-1;for(let i=0;i<colonies.length;i++)if(seats[i]<caps[i]){const q=weights[i]/(seats[i]+1);if(q>priority){priority=q;best=i;}}
  if(best<0)break;seats[best]++;remaining--;}
 return {pool,seats,waiting:remaining,aware:colonies.map(c=>Math.ceil(pool*awareness(c.fame)))};
}
function quality(s,e){
 const pop=Math.max(1,s.pop),water=Number.isFinite(s.water)?s.water:0;
 const reasons=[
  ['Air reserve',20,s.o2>=pop*3],['Food reserve',20,s.food>=pop*3],
  ['Water reserve',15,water>=pop*2],['A bed for everyone',10,e.beds>=pop],
  ['Storm shelter',15,e.shelter>=pop],['Recreation',10,e.cover>=pop],
  ['Reliable power',10,!e.shut&&e.gen>=e.demand]];
 const noise=Math.min(15,(e.noise||0)*3);
 const score=clamp(reasons.reduce((n,r)=>n+(r[2]?r[1]:0),0)-noise,0,100);
 return {score,label:score>=80?'Thriving':score>=55?'Settling in':'Needs care',reasons:reasons.map(([label,points,ready])=>({label,points:ready?points:0,ready})).concat(noise?[{label:'Industry near homes',points:-noise,ready:false}]:[])};
}
// No NASA observation supports an automatic, endlessly intensifying weather
// regime after game day 300. Separately labelled reference scenarios remain.
// Keep this query for existing UI callers and older saves.
function weather(){return null;}
const api={clamp,awareness,allocate,quality,weather};root.CampaignRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
