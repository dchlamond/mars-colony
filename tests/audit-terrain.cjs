/* CPU geometry checks against the exact shipped GLBs; no alternate terrain model. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const THREE=require('../game/vendor/three.min.js'),{engine}=require('./engine-harness.cjs');
const e=engine();e.context.THREE=THREE;e.context.matchMedia=()=>({matches:false});
e.run(`Junior.start('junior',0,20261114);R3={surfaceGrid:{nx:360,ny:180},surveySite:null,overlay:{},patch:{userData:{c:[0,0]}},cam:{position:new THREE.Vector3(),lookAt(){}},target:new THREE.Vector3()};layPatch=()=>{};`);
const report={time:new Date().toISOString(),meshes:[],movement:null};
for(const [name,nx,ny] of [['terrain',360,180],['low',180,90]]){
 const bytes=fs.readFileSync(path.resolve(__dirname,`../game/assets/ares/mars-mola-${name}.glb`)),jsonSize=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.toString('utf8',20,20+jsonSize)),binStart=20+jsonSize+8;
 const read=index=>{const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],components={SCALAR:1,VEC3:3}[a.type],T={5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];assert(T&&components&&!v.byteStride,'Supported non-interleaved geometry');const start=binStart+(v.byteOffset||0)+(a.byteOffset||0),data=bytes.subarray(start,start+a.count*components*T.BYTES_PER_ELEMENT);return new T(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));};
 const p=gltf.meshes[0].primitives[0],geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(read(p.attributes.POSITION),3));geometry.setIndex(new THREE.BufferAttribute(read(p.indices),1));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld(true);e.run(`R3.surfaceGrid={nx:${nx},ny:${ny}}`);
 const points=e.run(`Array.from({length:160},(_,i)=>{const x=X0+PW*((i*.371+.0021)%1),z=Z0+PH*((i*.173+.0013)%1);return {x,z,height:surfaceY(x,z)};})`);
 let error=0;const ray=new THREE.Raycaster();for(const q of points){ray.set(new THREE.Vector3(q.x,30,q.z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];assert(hit,'No terrain hole');error=Math.max(error,Math.abs(hit.point.y-q.height));assert(Math.abs(hit.point.y-q.height)<.00003,'Collision follows rendered triangles');}
 report.meshes.push({name,sampledPositions:points.length,largestHeightError:error});geometry.dispose();mesh.material.dispose();
}
report.movement=e.run(`(()=>{
 let checks=0,maxStep=0,minClearance=Infinity;const check=(v,m)=>{checks++;if(!v)throw Error(m);};
 R3.surfaceGrid={nx:360,ny:180};R3.fp={x:X0+PW-.3,z:Z0+PH*.78,yaw:-Math.PI/2,pitch:0,vx:0,vz:0,step:0};keys.w=true;keys.shift=true;const start=R3.fp.x;
 for(let i=0;i<1200;i++){const before=R3.fp.x;walkStep(.1);const delta=R3.fp.x-before,clearance=R3.cam.position.y-surfaceY(R3.fp.x,R3.fp.z);maxStep=Math.max(maxStep,delta);minClearance=Math.min(minClearance,clearance);check(delta>=0&&delta<=.385,'No teleport at longitude seam');check(clearance>=WALK_EYE-.00001,'Above rendered terrain');}
 check(R3.fp.x-start>PW*3,'Traverse three map widths');clearWalkInput();
 for(const t of S.tiles.filter((_,i)=>i%137===0)){const spawn=safeWalkEntry(tx(t),tz(t));check(!walkBlocked(spawn.x,spawn.z),'Clear entry point');}
 R3.fp.x=X0+PW*.55;R3.fp.z=Z0+.03;R3.fp.yaw=0;keys.w=true;for(let i=0;i<20;i++)walkStep(.1);check(/North polar edge/.test(R3.fp.boundary),'Named visible map boundary');keys.w=false;keys.s=true;const pole=R3.fp.z;for(let i=0;i<10;i++)walkStep(.1);check(R3.fp.z>pole+.5,'Reverse escapes the boundary');clearWalkInput();
 return {checks,maxStep,minClearance};
})()`);
fs.writeFileSync(path.resolve(__dirname,'../dist/verification/audit-terrain.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
