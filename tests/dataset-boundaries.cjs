/* Keep dataset inspection separate from invented samples and colony tuning. */
const assert=require('node:assert/strict');
const {engine}=require('./engine-harness.cjs');
const e=engine();let checks=0;
const check=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const html=e.nodes.get('spacePanel').innerHTML;
check(html.includes('catalog counts, not a radiation forecast'),true,'DONKI records retain their catalog meaning');
check(html.includes('does not prove a storm reached Mars'),true,'Earth records do not imply a Martian event');
check(html.includes('not converted into a Mars weather forecast or a radiation dose'),true,'No fabricated dose is attributed to DONKI');
check(html.includes('Collect sample'),false,'The unsupported sample economy is absent');
check(html.includes('dosimeter'),false,'The panel no longer sends players to fabricated dose measurements');
check(html.includes('NASA MOLA elevation record'),true,'Exploration points to the available terrain dataset');
e.context.FieldDiscovery={ledger(){e.context.openedLedger=(e.context.openedLedger||0)+1;}};
e.nodes.get('#terrainLedger').onclick();check(e.context.openedLedger,1,'Dataset ledger button opens the real discovery ledger');
const result=e.run(`(function(){
 Junior.start('junior',0,100);let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
 const t=S.tiles.find(t=>!t.owner&&!t.build);t.type='plain';const b={type:'shield',c:t.c,r:t.r,done:true,on:true,lvl:1};t.build=b;S.builds.push(b);
 const ordinary=compute().shelter;t.type='lava';check(compute().shelter===ordinary,'Legacy lava never grants extra shelter capacity');
 b.lvl=2;check(compute().shelter===ordinary+4,'Explicit game upgrade remains available');
 for(const type of ['solar','moxie','green','ice','shield']){const i=Junior.info(type);check(i.source==='Game rule'&&!i.url,'Authored outputs have no unrelated NASA article citation');}
 check(!/98%|cave shelters|likely ice/.test(JSON.stringify(['green','ice','shield'].map(t=>Junior.info(t)))),'Building help contains no unsupported water or cave measurement');
 return {checks};
})()`);
checks+=result.checks;
const migration=e.run(`(function(){
 let checks=0;const check=(v,m)=>{if(!v)throw Error(m);checks++;};
 for(const mode of ['junior','commander']){
  Junior.start(mode,0,329);check(!S.tiles.some(t=>t.type==='ice'||t.type==='lava'),'Fresh '+mode+' map has no invented deposits or caves');
  const save=Strategy.captureMission();save.state.tiles[0].type='ice';save.state.tiles[1].type='lava';Strategy.restoreMission(save);
  check(S.tiles[0].type==='plain'&&S.tiles[1].type==='plain','Legacy '+mode+' save drops unsupported terrain classifications');
 }
 Junior.start('junior',0,329);const legacy=Junior.capture();legacy.state.tiles[0].type='ice';legacy.state.tiles[1].type='lava';
 Junior.restore(legacy,{render:false});check(S.tiles[0].type==='plain'&&S.tiles[1].type==='plain','Direct checkpoint restore removes unsupported terrain');
 check(!S.junior.checkpoint.tiles.some(t=>t.type==='ice'||t.type==='lava'),'Restored checkpoint baseline is clean');
 const oldCheckpoint=JSON.parse(JSON.stringify(S.junior.checkpoint));oldCheckpoint.tiles[0].type='ice';oldCheckpoint.tiles[1].type='lava';S.junior.checkpoint=oldCheckpoint;S.junior.recovery='Retry test';
 check(Junior.recover()&&!S.tiles.some(t=>t.type==='ice'||t.type==='lava'),'Retry cannot resurrect legacy ice or cave tiles');
 check(!S.junior.checkpoint.tiles.some(t=>t.type==='ice'||t.type==='lava'),'Retry also migrates its retained checkpoint for future saves');
 for(const bad of ['ocean',null,{},42]){const invalid=Junior.capture(),before=S;invalid.state.tiles[0].type=bad;let rejected=false;try{Junior.restore(invalid,{render:false});}catch{rejected=true;}check(rejected&&S===before,'Invalid tile classification is rejected before changing mission state');}
 return {checks};
})()`);checks+=migration.checks;
console.log(JSON.stringify({checks,result:'passed'}));
