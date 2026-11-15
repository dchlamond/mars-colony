/* Long-campaign balance probe. Bot win rate is not a human difficulty rating. */
const {engine}=require('./engine-harness.cjs'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'management-campaigns.cjs'),'utf8'),marker='const rows=await p.evaluate(()=>{',start=source.indexOf(marker)+marker.length,end=source.indexOf('});fs.writeFileSync',start);
if(start<marker.length||end<0)throw Error('Commander scenario boundary missing');
const e=engine();e.run("Junior.setModeForNewGame('commander');Junior.start('commander')");
const rows=e.run('(()=>{'+source.slice(start,end)+'})()');
for(const row of rows)if(!Number.isFinite(row.sol)||!Number.isFinite(row.colonists))throw Error('Invalid campaign result');
fs.mkdirSync(path.resolve(__dirname,'../dist/verification'),{recursive:true});
fs.writeFileSync(path.resolve(__dirname,'../dist/verification/audit-commander-campaigns.json'),JSON.stringify(rows,null,2));
console.log(JSON.stringify({campaigns:rows.length,wins:rows.filter(r=>r.win).length,timeouts:rows.filter(r=>r.result==='timeout').length,note:'Two deterministic policies across all sites/difficulties; bot results are not a human difficulty rating.'}));
