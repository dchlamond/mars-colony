/* Exercise the shipped detail placement with real Three instance matrices. */
const assert=require('node:assert/strict');
const THREE=require('../game/vendor/three.min.js');
const {engine}=require('./engine-harness.cjs');
const e=engine();e.context.THREE=THREE;
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
e.run(`Junior.start('junior',0,614);
 function makeRockPatch(capacity){const geometry=new THREE.PlaneGeometry(26,26,4,4);geometry.rotateX(-Math.PI/2);R3={surfaceGrid:{nx:360,ny:180},patch:new THREE.Mesh(geometry),rocks:new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshBasicMaterial(),capacity)};}
 function rockSnapshot(x,z){layPatch(x,z);const matrix=new THREE.Matrix4();return R3.rocks.userData.scanIds.map((id,i)=>{R3.rocks.getMatrixAt(i,matrix);return {id,m:Array.from(matrix.elements),position:R3.rocks.userData.scanPositions[i]};});}
 makeRockPatch(700);`);
const dims=e.run('({x:X0+PW*.48,z:Z0+PH*.48,PW,Z0,PH})');
function sample(x=dims.x,z=dims.z){return e.run(`rockSnapshot(${x},${z})`);}
const base=sample(),original=new Map(base.map(r=>[r.id,r]));
check(base.length>500&&base.length<=700,'High quality fills the 24m detail window');
check(original.size===base.length,'Every visible rock has a unique stable ID');
check(base.some(r=>Math.hypot(r.m[0],r.m[1],r.m[2])>.10),'Medium rocks are available to scan');
let shared=0;
for(const rock of sample(dims.x+6,dims.z+2)){
 const before=original.get(rock.id);if(!before)continue;shared++;
 check(rock.m.every((v,i)=>Math.abs(v-before.m[i])<1e-6),'Overlapping rock keeps its position, size and rotation');
}
check(shared>250,'A meaningful overlapping window was compared');
const wrapped=sample(dims.x+dims.PW,dims.z);
check(wrapped.length===base.length,'Longitude wrap preserves the visible rock set size');
for(const rock of wrapped){
 const before=original.get(rock.id);check(!!before,'Longitude wrap preserves rock identity');
 check(rock.m.every((v,i)=>Math.abs(v-before.m[i]-(i===12?dims.PW:0))<.00002),'Wrapped rock changes only its rendered longitude');
}
e.run('makeRockPatch(220)');
const low=sample();check(low.length===220,'Low quality honors the 220-instance budget');
for(const rock of low){const before=original.get(rock.id);check(!!before&&rock.m.every((v,i)=>Math.abs(v-before.m[i])<1e-6),'Low and high quality share identical rock placements');}
e.run('makeRockPatch(700)');
for(const z of [dims.Z0+.025,dims.Z0+dims.PH-.025]){
 const edge=sample(dims.x,z);check(edge.every(r=>r.position.z>dims.Z0&&r.position.z<dims.Z0+dims.PH),'No rocks are placed beyond a pole');
 check(edge.length<base.length,'Pole window contains only real surface cells');
}
check(sample().length===base.length,'Moving away from a pole restores full capacity');
check(JSON.stringify(sample())===JSON.stringify(base),'Returning to a location exactly restores its rocks');
console.log(JSON.stringify({checks,result:'passed',coverage:'stable overlapping windows, wrapped identities, shared quality placements, medium scan targets, polar bounds and capacity recovery'}));
