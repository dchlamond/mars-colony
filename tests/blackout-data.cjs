/* Complete both Blackout futures using imported MOLA records, not model doses. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{engine}=require('./engine-harness.cjs');
const e=engine();let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const B=e.context.Blackout,act=(action,value)=>{const result=B.action(action,value);check(result.ok,action+': '+(result.error||result.message||''));return result;};
function setup(seed=614,site=0){e.run('R3=null;modalOpen=false;');check(B.start({seed,site}).ok,'Mission starts');act('predict','store');act('prepare','battery');}
setup();act('predictField','shelter');
const before=e.run('JSON.stringify({parts:S.parts,water:S.water,o2:S.o2,fame:S.fame})');
check(!B.recordFieldReading({kind:'radiation',source:'simulation',condition:'open',exposureIndex:100}).ok,'Fabricated radiation index cannot complete investigation');
equal(B.view().field.readings.length,0,'Rejected model reading creates no observation');
const sites=B.fieldSites();
const elsewhere=e.run(`S.tiles.find(t=>!(t.c===${sites.open.c}&&t.r===${sites.open.r})&&!(t.c===${sites.shelter.c}&&t.r===${sites.shelter.r}))`);
check(!B.recordFieldReading({kind:'elevation',source:'mola',c:elsewhere.c,r:elsewhere.r}).ok,'Only the two mission comparison locations satisfy this stage');
for(const condition of ['open','shelter']){
 const t=sites[condition];check(B.recordFieldReading({kind:'elevation',source:'mola',c:t.c,r:t.r,exposureIndex:99999,elevationKm:99999}).recorded,'Actual location records a derived sample');
 const actual=B.view().field.readings.find(r=>r.condition===condition);
 const expected=e.run(`(()=>{const t=tileAt(${t.c},${t.r}),lon=lonOf(t),lat=latOf(t),x=((Math.floor((lon+180)/360*DW)%DW)+DW)%DW,y=Math.max(0,Math.min(DH-1,Math.floor((90-lat)/180*DH)));return {raw:DEM[y*DW+x],km:elevKm(DEM[y*DW+x])};})()`);
 equal(actual.raw,expected.raw,'Recorded raw value comes from bundled DEM bytes');equal(actual.elevationKm,expected.km,'Elevation conversion uses the actual raw value');check(!Object.hasOwn(actual,'exposureIndex'),'No fabricated radiation survives in observation');
 check(!B.recordFieldReading({kind:'elevation',source:'mola',c:t.c,r:t.r}).recorded,'Repeated sample is not counted twice');
}
equal(e.run('JSON.stringify({parts:S.parts,water:S.water,o2:S.o2,fame:S.fame})'),before,'Dataset observations award no supplies or Fame');
const saved=B.snapshot();check(B.validateState(saved.state.blackout),'Dataset observations pass real save validation');
const tampered=JSON.parse(JSON.stringify(saved));tampered.state.blackout.field.readings[0].raw++;assert.throws(()=>B.validateState(tampered.state.blackout),/terrain reading/);checks++;
const forged=JSON.parse(JSON.stringify(saved));forged.state.blackout.field.readings[0].elevationKm=NaN;assert.throws(()=>B.validateState(forged.state.blackout),/terrain reading/);checks++;
const legacy=JSON.parse(JSON.stringify(saved));delete legacy.state.blackout.field.dataset;legacy.state.blackout.field.readings=['open','shelter'].map(condition=>({condition,exposureIndex:condition==='open'?100:30,source:'simulation',day:1}));
check(B.restore(legacy),'Existing prototype save remains playable');const migrated=B.view().field;
check(migrated.legacyModelReplaced&&migrated.dataset==='mola','Legacy comparison is explicitly rechecked against dataset');check(migrated.readings.every(r=>r.source==='mola'&&!Object.hasOwn(r,'exposureIndex')),'Legacy sensor values are replaced, not presented as NASA data');
act('shelter','shelter');act('request');while(B.view().stage==='running')act('next');check(B.view().firstOutcome.safe,'Data-only investigation still permits a safe day-nine outcome');
const firstCoordinates=B.view().field.readings.map(r=>[r.condition,r.c,r.r,r.raw]);act('compare','align');let steps=0;while(B.view().branch==='comparison'&&steps++<20)act('next');check(B.view().stage==='explain','Alternate replay completes with the same action keys');equal(B.view().field.readings.map(r=>[r.condition,r.c,r.r,r.raw]),firstCoordinates,'Comparison preserves the same imported terrain records');
act('explain','stored-energy');act('transfer','reserve');check(B.view().completed,'Full Blackout learning loop remains completable');
equal(Array.from(B.view().sources,s=>s.id),['mola','horizons','donki'],'Only the three imported NASA datasets are cited');check(B.exportRecord().field.readings.every(r=>r.source==='mola'),'Export contains dataset records');
for(const site of [1,2,3]){setup(717,site);act('predictField','open');act('observe','open');act('observe','shelter');check(B.view().field.readings.length===2,'Map controls work at each landing site');act('shelter','ship');act('request');while(B.view().stage==='running')act('next');check(B.view().stage==='outcome','Each landing site reaches an outcome without a field-stage blocker');}
// Equal imported samples are a valid prediction, preserved through saves/replay.
setup(20261114,0);check(B.view().choices.some(c=>c.action==='predictField'&&c.value==='same'),'Equal-at-resolution prediction is offered by the actual mission');act('predictField','same');act('observe','open');act('observe','shelter');
const tied=B.view().field;equal(tied.readings[0].raw,tied.readings[1].raw,'Default mission locations share a real imported raw value');equal(tied.prediction,'same','Equal prediction is recorded');
const sameSave=B.snapshot();check(B.restore(sameSave),'Same prediction passes save/load validation');equal(B.view().field.prediction,'same','Saved equal prediction survives restore');
const ui=fs.readFileSync(path.resolve(__dirname,'../game/blackout-ui.js'),'utf8'),fieldStart=ui.indexOf('  function fieldHtml(field){'),fieldEnd=ui.indexOf('  function commsHtml(',fieldStart);
const fieldHtml=e.run('(()=>{const esc=String,num=String,icon=()=>"";'+ui.slice(fieldStart,fieldEnd)+';return fieldHtml;})()');
check(/prediction matches/.test(fieldHtml(tied)),'Equal-data feedback affirms the equal prediction');
check(/does not support your prediction/.test(fieldHtml({...tied,prediction:'open'})),'Equal-data feedback corrects a lower-site prediction');
setup(717,1);act('predictField','same');act('observe','open');act('observe','shelter');const different=B.view().field;
check(different.readings[0].raw!==different.readings[1].raw,'Second real landing site supplies unequal samples');check(/samples differ/.test(fieldHtml(different)),'Unequal-data feedback corrects an equal prediction');
B.restore(sameSave);act('shelter','shelter');act('request');while(B.view().stage==='running')act('next');act('compare','align');let sameSteps=0;while(B.view().branch==='comparison'&&sameSteps++<20)act('next');equal(B.view().field.prediction,'same','Alternative replay preserves the equal prediction');check(B.view().stage==='explain','Equal prediction never blocks mission/replay completion');
console.log(JSON.stringify({checks,result:'passed',coverage:'actual MOLA bytes/location/units, fake-reading rejection, zero observation rewards, save migration/tamper rejection, complete two-futures mission, every landing site'}));
