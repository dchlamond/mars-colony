/* Grounding against actual authored rock vertices and the rendered terrain. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const THREE=require('../game/vendor/three.min.js'),{engine}=require('./engine-harness.cjs');
const bytes=fs.readFileSync(path.resolve(__dirname,'../game/assets/ares/outcrop-r02-low.glb'));
const jsonSize=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.toString('utf8',20,20+jsonSize)),binStart=28+jsonSize;
const accessor=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION],view=gltf.bufferViews[accessor.bufferView];
assert.equal(accessor.componentType,5126);assert.equal(accessor.type,'VEC3');assert.ok(!view.byteStride);
const start=binStart+(view.byteOffset||0)+(accessor.byteOffset||0),data=bytes.subarray(start,start+accessor.count*12);
const authored=new THREE.BufferGeometry();authored.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)),3));
authored.computeBoundingBox();const size=authored.boundingBox.getSize(new THREE.Vector3()),center=authored.boundingBox.getCenter(new THREE.Vector3());authored.translate(-center.x,-center.y,-center.z);authored.scale(1/size.x,1/size.x,1/size.x);
const e=engine();e.context.THREE=THREE;e.context.authored=authored;
e.run(`Junior.start('junior',0,614);R3={surfaceGrid:{nx:360,ny:180},patch:new THREE.Mesh(new THREE.PlaneGeometry(26,26,4,4)),rocks:new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshBasicMaterial(),700)};
 const state={};let scatter=new THREE.InstancedMesh(authored,new THREE.MeshBasicMaterial(),180),scatterSignature='';
 function groundReport(mesh,step){const m=new THREE.Matrix4(),point=new THREE.Vector3(),vertices=mesh.geometry.attributes.position;let checked=0,worstGap=-Infinity,buried=0;for(let i=0;i<mesh.count;i+=step){mesh.getMatrixAt(i,m);let min=Infinity,max=-Infinity;for(let j=0;j<vertices.count;j++){point.fromBufferAttribute(vertices,j).applyMatrix4(m);const gap=point.y-surfaceY(point.x,point.z);min=Math.min(min,gap);max=Math.max(max,gap);}checked++;worstGap=Math.max(worstGap,min);if(max<=0)buried++;}return {checked,worstGap,buried};}
 layPatch(tx(S.builds[0]),tz(S.builds[0]));`);
const idsBefore=e.run('JSON.stringify(R3.rocks.userData.scanIds)');
e.run('R3.rocks.geometry=authored;layPatch(tx(S.builds[0]),tz(S.builds[0]));');
assert.equal(e.run('JSON.stringify(R3.rocks.userData.scanIds)'),idsBefore,'Authored geometry loading preserves rock identities');
const patch=e.run('groundReport(R3.rocks,4)');assert.ok(patch.checked>100);assert.ok(patch.worstGap<0,'Every sampled authored patch rock touches the ground');assert.equal(patch.buried,0,'Authored patch rocks remain visible');
const source=fs.readFileSync(path.resolve(__dirname,'../game/ares-world.js'),'utf8');
e.run(source.slice(source.indexOf('  function scatterRocks(){'),source.indexOf('  function addOutcrops(){')),'ares-world-scatter');
e.run('state.refreshRockScatter();');const scatter=e.run('groundReport(scatter,2)');assert.ok(scatter.checked>50);assert.ok(scatter.worstGap<0,'Every sampled authored fragment touches the ground');assert.equal(scatter.buried,0,'Authored fragments remain visible');
// Execute the actual renderer asset callbacks in both completion orders. Texture
// rendering/services are irrelevant here; placement and terrain sampling are real.
const renderer=fs.readFileSync(path.resolve(__dirname,'../game/ares-render.js'),'utf8');
function callbackBody(marker,endMarker){const begin=renderer.indexOf(marker)+marker.length,end=renderer.indexOf(endMarker,begin);assert.ok(begin>=marker.length&&end>begin);return renderer.slice(begin,end);}
const terrainBody=callbackBody("asset('assets/ares/mars-mola-'+(HQ?'terrain':'low')+'.glb',scene=>{",'\n });\n function visualCopy');
const rocksBody=callbackBody("asset('assets/ares/outcrop-r02-low.glb',scene=>{",'\n });\n // A close-up');
e.run(`const art=state,longitudeWraps=[],renderState={};let rock,rockMaterial;
 function syncLongitudeWraps(){}function syncServices(){}walkStep=()=>{};
 function terrainArrives(scene){${terrainBody}}
 function rocksArrive(scene){${rocksBody}}
 function resetAssetOrder(){R3.surfaceGrid={nx:640,ny:320};R3.map=new THREE.Mesh(new THREE.PlaneGeometry(2,2));R3.scene=new THREE.Scene();R3.scene.add(R3.rocks,scatter);scatter.name='Artistic basalt fragments';R3.fp={x:tx(S.builds[0]),z:tz(S.builds[0])};R3.rocks.geometry=new THREE.DodecahedronGeometry(1,0);scatter.geometry=new THREE.IcosahedronGeometry(1,0);layPatch(R3.fp.x,R3.fp.z);state.refreshRockScatter();}
 function terrainFixture(){const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2));mesh.name='NASA_MOLA_relief_test';scene.add(mesh);return scene;}
 function rockFixture(){const scene=new THREE.Scene();scene.add(new THREE.Mesh(authored,new THREE.MeshBasicMaterial()));return scene;}
`);
const orders=[];
for(const order of ['rocks-first','terrain-first']){
 e.run('resetAssetOrder();'+(order==='rocks-first'?'rocksArrive(rockFixture());terrainArrives(terrainFixture());':'terrainArrives(terrainFixture());rocksArrive(rockFixture());'));
 const result=e.run('({patch:groundReport(R3.rocks,8),scatter:groundReport(scatter,4)})');
 assert.ok(result.patch.worstGap<0&&result.scatter.worstGap<0,order+' regrounds both instance meshes');assert.equal(result.patch.buried+result.scatter.buried,0,order+' leaves both rock types visible');
 orders.push({order,...result});
}
console.log(JSON.stringify({result:'passed',patch,scatter,orders,coverage:'actual asset callbacks in both completion orders, unchanged identities, authored ground contact, visible above terrain'}));
