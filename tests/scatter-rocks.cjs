/* Run the shipped scatter function, with Three instance matrices and real tiles. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const THREE=require('../game/vendor/three.min.js'),{engine}=require('./engine-harness.cjs');
const e=engine();e.context.THREE=THREE;
const source=fs.readFileSync(require.resolve('../game/ares-world.js'),'utf8');
e.run(`Junior.start('junior',0,614);R3={surfaceGrid:{nx:360,ny:180}};
 const state={};let scatter,scatterSignature='';
 function setupScatter(capacity){scatter=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial(),capacity);scatterSignature='';}
 function scatterSnapshot(){scatterRocks();const matrix=new THREE.Matrix4();return scatter.userData.scanIds.map((id,i)=>{scatter.getMatrixAt(i,matrix);return {id,m:Array.from(matrix.elements)};});}
 setupScatter(180);`);
e.run(source.slice(source.indexOf('  function scatterRocks(){'),source.indexOf('  function addOutcrops(){')),'ares-world-scatter');
let checks=0;function check(v,m){assert.ok(v,m);checks++;}
const base=e.run('scatterSnapshot()'),original=new Map(base.map(r=>[r.id,r]));
check(base.length>100&&base.length<=180,'HQ scatter fits its rendering budget');
check(original.size===base.length,'Every fragment has a unique identity');
const [,c,r]=base[0].id.split(':').map((v,i)=>i?Number(v):v);
e.run(`var occupied=tileAt(${c},${r});var testBuild={c:${c},r:${r},type:'solar',done:true};occupied.build=testBuild;S.builds.push(testBuild);`);
const after=e.run('scatterSnapshot()');
check(after.length<base.length,'Constructing removes fragments on its occupied tile');
check(after.every(rock=>!rock.id.startsWith('fragment:'+c+':'+r+':')),'No fragment remains inside the new building');
for(const rock of after){const before=original.get(rock.id);check(!!before&&JSON.stringify(rock.m)===JSON.stringify(before.m),'Building does not move or reseed surviving fragments');}
e.run('occupied.build=null;S.builds.pop();');
check(JSON.stringify(e.run('scatterSnapshot()'))===JSON.stringify(base),'Removing a building restores exactly the original fragment set');
e.run('setupScatter(64)');
const low=e.run('scatterSnapshot()');check(low.length>0&&low.length<=64,'Low quality fits its rendering budget');
for(const rock of low){const before=original.get(rock.id);check(!!before&&JSON.stringify(rock.m)===JSON.stringify(before.m),'Low quality preserves shared HQ fragment placement and identity');}
check(JSON.stringify(e.run('scatterSnapshot()'))===JSON.stringify(low),'Unchanged sync is stable');
console.log(JSON.stringify({checks,result:'passed',coverage:'unique fragment identities, stable construction/removal, unchanged sync, shared quality placement'}));
