/* Verify the shipped historical references against the archived NASA API payload. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {engine}=require('./engine-harness.cjs');
const raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../research/donki-sep-may-2024.json'),'utf8'));
const e=engine(),storms=e.run('STORMS');let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
check(storms.length===7,'The balanced campaign retains seven training encounters');
for(const event of storms){
 const id=event.src.replace('NASA DONKI, ',''),record=raw.records.find(row=>row.sepID===id);
 check(!!record,'Every event is traceable to an imported NASA record: '+id);
 check(event.date===record.eventTime,'Reference timestamp is the exact NASA timestamp');
 check(event.url===record.link,'Source link comes from the archived record');
 check(record.instruments.every(instrument=>event.meas.includes(instrument.displayName)),'Instrument and energy channel are preserved');
 check(event.meas.includes('not a Mars dose'),'An Earth observation is not presented as a Mars dose');
 check(event.text.includes('game rules'),'Training timing and consequences remain separate');
}
const learning=e.run('({facts:Object.values(FACTS),lessons:ACADEMY,questions:PROBLEMS,upgrades:Object.values(RESEARCH)})');
const datasetUrl=url=>/^https:\/\/(?:trek\.nasa\.gov\/mars\/|ssd\.jpl\.nasa\.gov\/horizons\/|ccmc\.gsfc\.nasa\.gov\/tools\/DONKI\/)$/.test(url);
check(learning.facts.every(f=>datasetUrl(f.u)),'Building notes cite the dataset interfaces, not articles as measurements');
check(learning.lessons.length===6&&learning.questions.length===10,'All lessons and interactive questions remain available');
check(learning.questions.every(q=>datasetUrl(q.u)),'Interactive science questions cite the imported dataset families');
check(learning.upgrades.every(r=>r.src==='Game rule'&&!r.u),'Authored upgrades do not cite unrelated NASA measurements');
const horizon=e.run('MARS_EPHEMERIS.rows[0]');
check(horizon.date==='2023-11-20'&&horizon.minutes===20.98606,'The lesson’s dated Horizons example matches the imported row');
console.log(JSON.stringify({checks,result:'passed',coverage:'Historical NASA SEP source IDs, UTC timestamps, instruments, source links, dataset-only learning references and explicit game upgrades'}));
