/* Long-campaign balance probe. Bot win rate is not a human difficulty rating. */
const {engine}=require('./engine-harness.cjs'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'management-campaigns.cjs'),'utf8'),marker='const rows=await p.evaluate(()=>{',start=source.indexOf(marker)+marker.length,end=source.indexOf('});fs.writeFileSync',start);
if(start<marker.length||end<0)throw Error('Commander scenario boundary missing');
const e=engine();e.run("Junior.setModeForNewGame('commander');Junior.start('commander')");
let scenario=source.slice(start,end);
// The maintained policy plans shelter before admitting arrivals and compares
// actual production. Removed cave bonuses must not remain an implicit shortcut.
scenario=scenario.replace("const e=S.eco=compute();let type=null;",`if(policy==='maintained'){
 const minimumAir=S.pop+1;
 const extractors=S.builds.filter(b=>b.type==='moxie'&&b.done&&b.on).sort((a,b)=>tileAt(a.c,a.r).air-tileAt(b.c,b.r).air);
 for(const b of extractors){toggle(b);if(compute().o2p<minimumAir)toggle(b);}
 for(const b of S.builds.filter(b=>b.type==='mine'&&b.done))if(b.on!==Boolean(S.metal<24))toggle(b);
}const e=S.eco=compute();let type=null;`);
scenario=scenario.replace("else if(e.shelter<S.pop)type='shield'","else if(e.shelter<(policy==='maintained'?Math.max(10,S.pop+2):S.pop))type='shield'");
scenario=scenario.replace("else if(counts('green')*3<S.pop+2)type='green'","else if((policy==='maintained'?e.foodp:counts('green')*3)<S.pop+2)type='green'");
scenario=scenario.replace("t.seen&&!t.owner&&!t.build&&(DEF[type].needs!=='ice'||t.type==='ice'||type==='ice'&&policy==='maintained')","t.seen&&!t.owner&&!t.build&&t.type!=='rock'&&(!DEF[type].needs||type==='ice'||t.type===DEF[type].needs)");
scenario=scenario.replace("e.beds>=S.pop+2&&S.o2", "e.beds>=S.pop+2&&e.shelter>=S.pop+2&&S.o2");
const rows=e.run('(()=>{'+scenario+'})()');
for(const row of rows)if(!Number.isFinite(row.sol)||!Number.isFinite(row.colonists))throw Error('Invalid campaign result');
fs.mkdirSync(path.resolve(__dirname,'../dist/verification'),{recursive:true});
fs.writeFileSync(path.resolve(__dirname,'../dist/verification/audit-commander-campaigns.json'),JSON.stringify(rows,null,2));
console.log(JSON.stringify({campaigns:rows.length,wins:rows.filter(r=>r.win).length,timeouts:rows.filter(r=>r.result==='timeout').length,note:'Two deterministic policies across all sites/difficulties; bot results are not a human difficulty rating.'}));
