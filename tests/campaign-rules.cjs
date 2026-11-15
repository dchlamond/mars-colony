const assert=require('node:assert/strict'),R=require('../game/campaign-rules.js'),{engine}=require('./engine-harness.cjs');
let checks=0;function check(v,m){assert.ok(v,m);checks++;}
for(let pool=0;pool<=30;pool++)for(let fame=0;fame<=250;fame+=25)for(let beds=0;beds<=20;beds+=2){
 const rows=[{pop:6,beds,appeal:90,fame},{pop:2,beds:20,appeal:60,fame:100},{pop:2,beds:2,appeal:100,fame:500}];
 const a=R.allocate(pool,rows);check(a.seats.reduce((a,b)=>a+b,0)+a.waiting===pool,'Arrival conservation');check(a.seats[0]<=Math.max(0,beds-6),'Beds constrain arrivals');check(a.seats[0]<=Math.ceil(pool*R.awareness(fame)),'Fame constrains awareness');check(a.seats[2]===0,'A full colony accepts nobody');
}
check(R.awareness(0)<R.awareness(100),'Fame expands awareness');check(R.allocate(10,[{pop:0,beds:20,appeal:100,fame:500},{pop:0,beds:20,appeal:50,fame:500}]).seats[0]>5,'Better Appeal earns a larger share');
check(R.weather(299)===null,'No extreme weather before day 300');check(R.weather(330).solar<R.weather(300).solar,'Later dust reduces solar further');check(R.weather(390).duration>R.weather(300).duration,'Later storms last longer');
const e=engine();e.run("Junior.start('commander',0,614);modal=()=>{};modalOpen=false;S.water=120;S.unlocked.habitat=true;S.parts=100;S.metal=100;");
e.run("Campaign.queueWave();");check(e.run('S.speed===0'),'Approach pauses campaign');check(e.run('!Campaign.settle(Campaign.data().pending.deadline-1)'),'Cannot land before countdown');check(e.run('Campaign.settle(Campaign.data().pending.deadline)'),'Lands at countdown end');const pop=e.run('S.pop');e.run('Campaign.settle(Date.now()+100000)');check(e.run('S.pop')===pop,'Polling cannot duplicate passengers');
e.run("S.sol=300;const tile=S.tiles.find(t=>!t.build&&t.type!=='rock'&&!t.owner&&t.seen);G.tryBuild('solar',tile);S.builds.at(-1).done=true;S.builds.at(-1).on=true;");const terrain=e.run('JSON.stringify(S.tiles.map(t=>t.sun))');e.run('compute();compute();');check(e.run('JSON.stringify(S.tiles.map(t=>t.sun))')===terrain,'Weather compute never mutates terrain permanently');
e.run('S.sol=1;S.over=null;S.campaign.pending=null;');const saved=e.run('Strategy.captureMission()');check(!!e.context.Strategy.validateMission(saved),'Extended Commander save validates');
const sample=e.run('(()=>{const s={pop:6,o2:60,food:60,water:60},x={beds:6,shelter:6,cover:6,shut:0,gen:10,demand:5,noise:0};return [CampaignRules.quality(s,x).score,CampaignRules.quality({...s,water:0},x).score]})()');check(sample[0]>sample[1],'Water improves internal QOL');
console.log(JSON.stringify({checks,result:'passed',coverage:'population conservation, capacity, awareness, countdown, duplicate delivery, escalation, pure terrain computation, saves and QOL'}));
