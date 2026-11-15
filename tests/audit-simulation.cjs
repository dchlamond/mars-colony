/* Reuse the existing authoritative-engine regression scenarios without a browser.
 * This is a rules/storage suite, not a replacement for visible-control playtests. */
const {engine}=require('./engine-harness.cjs');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const directSuites=new Set(['blackout-systems.cjs','junior.cjs','mission-systems.cjs']);
const report={startedAt:new Date().toISOString(),method:'Shipped JavaScript rules in Node VM; presentation stubs only. Existing scenario assertions reused verbatim.',suites:[],failures:[]};
for(const file of ['blackout-systems.cjs','junior.cjs','persistence.cjs','mission-systems.cjs','colony-systems.cjs']){
 try{
  if(directSuites.has(file)){
   const child=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
   if(child.error)throw child.error;
   if(child.status!==0)throw Error('Node scenario failed ('+child.status+'): '+child.stderr+'\n'+child.stdout);
   const result=JSON.parse(child.stdout);
   if(!Number.isInteger(result.checks)||result.checks<1)throw Error('Missing check count: '+file);
   report.suites.push({file,execution:'node-entrypoint',result});console.log(file+': '+result.checks+' checks passed');continue;
  }
  // These two legacy suites still wrap their scenarios in browser tests. Execute
  // only the scenario body in the real-engine harness; never launch Playwright.
  const source=fs.readFileSync(path.join(__dirname,file),'utf8');
  const marker='const result=await page.evaluate(()=>{',start=source.indexOf(marker)+marker.length,end=source.indexOf('\n  });',start);
  if(start<marker.length||end<0)throw Error('Scenario boundary missing: '+file);
  const e=engine();if(file==='colony-systems.cjs')e.run("Junior.start('commander',0,614)");
  const result=e.run('(()=>{'+source.slice(start,end)+'\n})()',file);
  report.suites.push({file,result});console.log(file+': '+result.checks+' checks passed');
 }catch(error){report.failures.push({file,error:error.stack});console.error(file+': '+error.stack);}
}
report.completedAt=new Date().toISOString();
fs.mkdirSync(path.resolve(__dirname,'../dist/verification'),{recursive:true});
fs.writeFileSync(path.resolve(__dirname,'../dist/verification/audit-simulation.json'),JSON.stringify(report,null,2));
if(report.failures.length)process.exitCode=1;
