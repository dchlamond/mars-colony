/* Timed scan lifecycle and real discovery rewards, with DOM/rendering stubbed.
 * The shipped FieldScan and FieldDiscovery logic run unchanged in the engine VM. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {engine}=require('./engine-harness.cjs');
const e=engine();let now=1000,checks=0;
function check(actual,expected,message){assert.deepEqual(actual,expected,message);checks++;}
e.context.performance.now=()=>now;
e.context.cancelAnimationFrame=()=>{};
e.context.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
e.context.document.hidden=false;
e.context.document.head=e.context.document.createElement('head');
e.context.document.exitPointerLock=()=>{};
e.run("R3={fp:{x:0,z:0}};modalOpen=false;");
e.run(fs.readFileSync(path.resolve(__dirname,'../game/field-scan.js'),'utf8'),'field-scan.js');
const scanner=e.context.FieldScan;
let completed=0,valid=true;
function ready(){scanner.cancel();now+=10000;valid=true;e.context.document.hidden=false;e.run('R3={fp:{x:0,z:0}};modalOpen=false;');}
function begin(){return scanner.start({label:'Test rock',valid:()=>valid,complete:()=>completed++,anchor:{x:0,y:0,z:0}});}
function finish(){now+=2400;scanner.update(now);}
ready();check(begin(),true,'A valid scan starts');check(scanner.busy,true,'The scan is busy');check(completed,0,'Starting does not grant a discovery');
check(begin(),false,'Repeated input does not queue another scan');
now+=2399;scanner.update(now);check(completed,0,'No completion before the full duration');
now++;scanner.update(now);check(completed,1,'Completes at the duration boundary');check(scanner.busy,false,'Completion clears busy state');
scanner.update(now+10000);check(completed,1,'Subsequent frames do not complete twice');
for(const [name,invalidate] of [
 ['target changed',()=>{valid=false;}],
 ['left Walk',()=>e.run('R3.fp=null;')],
 ['opened a modal',()=>e.run('modalOpen=true;')],
 ['hidden tab',()=>{e.context.document.hidden=true;}],
 ['new mission object',()=>e.run('S={...S};')]
]){
 ready();begin();invalidate();const before=completed;finish();check(scanner.busy,false,name+' cancels');check(completed,before,name+' grants nothing');
}
ready();begin();scanner.cancel();const beforeCancel=completed;finish();check(completed,beforeCancel,'Manual cancellation prevents a late completion');
ready();begin();finish();check(completed,beforeCancel+1,'A canceled scan can restart');
// Run real target selection and awards. Only geometric intersections and the
// rendering primitives are stubbed; target visibility, IDs, occlusion, timing,
// terrain checks, discovery state and reward rules all use shipped code.
let hits=[];
class SceneNode {
 constructor(){this.visible=true;this.userData={};this.children=[];this.parent=null;this.name='';this.rotation={};this.position={x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}};}
 add(...objects){for(const object of objects){object.parent=this;this.children.push(object);}}
 remove(object){this.children=this.children.filter(child=>child!==object);object.parent=null;}
 traverse(fn){fn(this);for(const child of this.children)child.traverse(fn);}
 updateMatrixWorld(){}
}
class Mesh extends SceneNode {constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
class Geometry {dispose(){}}
class Material {constructor(options){Object.assign(this,options);}dispose(){}}
class Raycaster {
 constructor(){this.ray={origin:{x:0,y:0,z:0}};}
 setFromCamera(_,camera){this.ray.origin={...camera.origin};}
 intersectObjects(objects,recursive){
  const allowed=new Set();for(const object of objects){allowed.add(object);if(recursive)object.traverse(child=>allowed.add(child));}
  return hits.filter(hit=>allowed.has(hit.object)&&hit.distance>=this.near&&hit.distance<=this.far).sort((a,b)=>a.distance-b.distance);
 }
}
e.context.THREE={Raycaster,Group:SceneNode,Mesh,TorusGeometry:Geometry,RingGeometry:Geometry,MeshBasicMaterial:Material,DoubleSide:2};
e.context.CampaignUI={show(title,html){e.context.__results=(e.context.__results||0)+1;e.context.__lastResult={title,html};}};
e.context.BlackoutAudio={cue(){}};
e.run(fs.readFileSync(path.resolve(__dirname,'../game/rock-find-rules.js'),'utf8'),'rock-find-rules.js');
e.run(fs.readFileSync(path.resolve(__dirname,'../game/field-discovery.js'),'utf8'),'field-discovery.js');
const discovery=e.context.FieldDiscovery,rules=e.context.RockFindRules;
function setupCampaign(blackout=false){
 scanner.cancel();hits=[];now+=10000;e.context.document.hidden=false;
 e.run('R3=null;'+(blackout?'Blackout.start({});':"Junior.start('junior',0,614);")+"modalOpen=false;var scanTestTile=S.tiles.find(t=>t.type==='plain'&&!t.build);R3={fp:{x:tx(scanTestTile),z:tz(scanTestTile)}};");
 const pos=e.run('({x:R3.fp.x,z:R3.fp.z,y:surfaceY(R3.fp.x,R3.fp.z)})'),scene=new SceneNode();
 const camera={origin:{x:pos.x,y:pos.y+2,z:pos.z},updateMatrixWorld(){}};
 Object.assign(e.run('R3'),{scene,cam:camera,bmeshes:new Set()});
 return {pos,scene,camera};
}
function rock(world,id,options={}){
 const object=new SceneNode();object.userData=options.instances?{scanIds:options.instances}:{scanId:id};world.scene.add(object);
 const hit={object,distance:options.distance??1.8,point:{x:world.pos.x,y:world.pos.y+.2,z:world.pos.z},instanceId:options.instanceId??0};return {object,hit};
}
function aimAt(...objects){hits=objects.map(object=>object.hit||object);now+=160;return discovery.target(true);}
const resources=()=>JSON.parse(e.run('JSON.stringify({parts:S.parts,water:S.water,o2:S.o2,fame:S.fame})'));
const ledgerCount=()=>e.run('Object.keys(S.rockEvidence?.entries||{}).length');
const expectedResource=kind=>kind==='air'?'o2':kind;

let world=setupCampaign();const ground=new SceneNode();world.scene.add(ground);
aimAt({object:ground,distance:1,point:{x:world.pos.x,y:world.pos.y,z:world.pos.z}});
const groundResources=resources();check(discovery.target(true),null,'Bare ground is never an individual rock target');check(discovery.scan(),false,'F on ground cannot start a scan');finish();check(resources(),groundResources,'Ground scanning gives no supplies or Fame');check(ledgerCount(),0,'Ground creates no ledger entry');

world=setupCampaign();const one=rock(world,'rock:3:4:0'),two=rock(world,'rock:3:4:1');
let target=aimAt(one);check(target.id,'rock:3:4:0','Real raycast selects the aimed individual ID');check(target.known,false,'Unscanned rock remains unknown');check(target.name,'Unscanned terrain target','Reward type is hidden until completion');
const beforeFirst=resources();
check(discovery.scan(),true,'Aimed rock starts a timed scan');check(resources(),beforeFirst,'No supplies or Fame before scan completion');check(ledgerCount(),0,'No premature ledger entry');
finish();const afterFirst=resources();check(afterFirst,beforeFirst,'NASA record scans never fabricate resource or Fame rewards');check(ledgerCount(),1,'First rock creates one persistent individual entry');
check(discovery.target(true).known,true,'Completed rock reveals its known status');assert.notEqual(discovery.target(true).name,'Unscanned terrain target','Completed rock reveals its type');checks++;
aimAt(two);check(discovery.target(true).known,false,'A second physical rock remains unknown');check(discovery.scan(),true,'A second physical rock can be scanned');finish();check(resources(),afterFirst,'Second record scan creates no resources');check(ledgerCount(),2,'Two physical rocks create two individual entries');
const afterTwo=resources();aimAt(one);check(discovery.scan(),true,'Known rock can be reviewed');check(scanner.busy,false,'Review does not run another rewarding scan');finish();check(resources(),afterTwo,'Review cannot farm supplies or Fame');check(ledgerCount(),2,'Review never duplicates ledger entries');
// A serialized/restored ledger is read by the actual target and scan code.
e.run('S.rockEvidence=JSON.parse(JSON.stringify(S.rockEvidence));');aimAt(one);discovery.scan();finish();check(resources(),afterTwo,'Reloaded discovery history prevents reward farming');check(discovery.target(true).known,true,'Raycast target recognizes restored history');

world=setupCampaign();const startRock=rock(world,'rock:5:5:0'),differentRock=rock(world,'rock:5:5:1');aimAt(startRock);const changedResources=resources();discovery.scan();aimAt(differentRock);finish();check(scanner.busy,false,'Changing aimed ID cancels the scan');check(ledgerCount(),0,'Changing aim records no rock');check(resources(),changedResources,'Changing aim awards no supplies');
aimAt(startRock);discovery.scan();e.run('R3.fp.x+=2;');finish();check(scanner.busy,false,'Walking away cancels the scan');check(resources(),changedResources,'Walking away awards no supplies');check(ledgerCount(),0,'Walking away records no rock');

world=setupCampaign();const invisible=rock(world,'rock:6:0'),visible=rock(world,'rock:6:1');invisible.object.visible=false;check(aimAt(invisible,visible).id,'rock:6:1','Invisible rock is ignored in favor of visible geometry');
const parent=new SceneNode();parent.visible=false;world.scene.remove(visible.object);parent.add(visible.object);world.scene.add(parent);check(aimAt(visible),null,'Invisible parent excludes its rock');
const instances=rock(world,null,{instances:['rock:7:0','rock:7:1'],instanceId:1});check(aimAt(instances).id,'rock:7:1','Instanced mesh uses the actually hit instance ID');instances.hit.instanceId=5;check(aimAt(instances),null,'Unknown instance cannot invent a rock ID');

world=setupCampaign();const occluded=rock(world,'rock:8:0'),wall=new SceneNode();world.scene.add(wall);e.run('R3').bmeshes.add(wall);
const wallHit={object:wall,distance:.8,point:{x:world.pos.x,y:world.pos.y+1.2,z:world.pos.z}};check(aimAt(occluded,wallHit),null,'Visible building blocks scanning through it');
wall.visible=false;check(aimAt(occluded,wallHit).id,'rock:8:0','Invisible building does not block scanning');wall.visible=true;wallHit.distance=3;check(aimAt(occluded,wallHit).id,'rock:8:0','Building behind target does not block it');
const wrappedWall=new SceneNode();wrappedWall.name='Visible colony longitude wrap';const wrappedMesh=new SceneNode();wrappedWall.add(wrappedMesh);world.scene.add(wrappedWall);const wrappedHit={object:wrappedMesh,distance:1,point:wallHit.point};check(aimAt(occluded,wrappedHit),null,'Visible longitude-wrapped building also blocks the ray');
world.scene.remove(wrappedWall);occluded.hit.point.y=world.pos.y-.5;check(aimAt(occluded),null,'Actual terrain sampling rejects a rock below the ground surface');

world=setupCampaign();const distant=rock(world,'rock:9:0',{distance:5.01}),near=rock(world,'rock:9:1',{distance:.01});check(aimAt(distant),null,'Ray range excludes targets beyond five metres');check(aimAt(near),null,'Ray near plane excludes a target inside the camera');distant.hit.distance=5;check(aimAt(distant).id,'rock:9:0','Five-metre target is within scan range');
aimAt(distant);discovery.scan();distant.hit.distance=5.01;now+=160;finish();check(ledgerCount(),0,'Moving a target out of range cancels before reward');

world=setupCampaign(true);const blackoutRock=rock(world,'rock:10:0');aimAt(blackoutRock);const blackoutResources=resources();check(discovery.scan(),true,'Blackout permits evidence scans');finish();check(ledgerCount(),1,'Blackout records one completed individual discovery');check(resources(),blackoutResources,'Blackout changes no supplies or Fame');check(e.run("S.rockEvidence.entries['rock:10:0'].sourceId"),'mola','Blackout ledger references the actual dataset');

// Also intersect actual Three.js meshes with its actual Raycaster. No WebGL
// renderer is needed to verify the same instance IDs and camera rays as play.
const T=require('../game/vendor/three.min.js'),real=engine();let realNow=1000;
real.context.THREE=T;real.context.performance.now=()=>realNow;real.context.cancelAnimationFrame=()=>{};real.context.matchMedia=()=>({matches:false});real.context.document.hidden=false;real.context.document.exitPointerLock=()=>{};real.context.BlackoutAudio={cue(){}};real.context.CampaignUI={show(){}};
real.run("R3=null;Junior.start('junior',0,614);modalOpen=false;var realTile=S.tiles.find(t=>t.type==='plain'&&!t.build);R3={fp:{x:tx(realTile),z:tz(realTile)}};");
const base=real.run('({x:R3.fp.x,y:surfaceY(R3.fp.x,R3.fp.z),z:R3.fp.z})'),scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.01,100);
camera.position.set(base.x,base.y+3,base.z);Object.assign(real.run('R3'),{scene,cam:camera,bmeshes:new Set()});
const actualRocks=new T.InstancedMesh(new T.DodecahedronGeometry(.18,0),new T.MeshBasicMaterial(),2),positions=[new T.Vector3(base.x-.6,base.y+3,base.z-2),new T.Vector3(base.x+.6,base.y+3,base.z-2)],matrix=new T.Matrix4();
actualRocks.userData.scanIds=['rock:actual:0','rock:actual:1'];positions.forEach((p,i)=>actualRocks.setMatrixAt(i,matrix.makeTranslation(p.x,p.y,p.z)));actualRocks.instanceMatrix.needsUpdate=true;scene.add(actualRocks);
const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshBasicMaterial({side:T.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.set(base.x,base.y,base.z);scene.add(floor);
for(const file of ['field-scan.js','rock-find-rules.js','field-discovery.js'])real.run(fs.readFileSync(path.resolve(__dirname,'../game',file),'utf8'),file);
const actual=real.context.FieldDiscovery,actualScanner=real.context.FieldScan;
function realAim(point){camera.lookAt(point);realNow+=160;return actual.target(true);}
function realFinish(){realNow+=2400;actualScanner.update(realNow);}
const actualResources=()=>real.run('JSON.stringify({parts:S.parts,water:S.water,o2:S.o2,fame:S.fame})');
realAim(new T.Vector3(base.x,base.y,base.z));check(actual.target(true),null,'Real downward camera ray at ground finds no sample');check(actual.scan(),false,'Real ground ray cannot start a supply scan');
check(realAim(positions[0]).id,'rock:actual:0','Real Three ray intersects instance zero');check(actual.target(true).known,false,'Real mesh content starts unknown');
check(actual.scan(),true,'Real ray target starts scanning');realAim(positions[1]);realFinish();check(actualScanner.busy,false,'Actual camera aim change cancels the scan');check(real.run('Object.keys(S.rockEvidence?.entries||{}).length'),0,'Actual aim cancellation gives no discoveries');
check(actual.target(true).id,'rock:actual:1','Real Three ray identifies instance one separately');
const obstruction=new T.Mesh(new T.BoxGeometry(.8,.8,.2),new T.MeshBasicMaterial());obstruction.position.copy(camera.position).lerp(positions[0],.5);scene.add(obstruction);real.run('R3').bmeshes.add(obstruction);
check(realAim(positions[0]),null,'Actual building geometry occludes the sample');obstruction.visible=false;check(realAim(positions[0]).id,'rock:actual:0','Hidden actual building is ignored');
actualRocks.visible=false;check(realAim(positions[0]),null,'Hidden actual InstancedMesh cannot be scanned');actualRocks.visible=true;
const group=new T.Group();group.visible=false;scene.remove(actualRocks);group.add(actualRocks);scene.add(group);check(realAim(positions[0]),null,'Hidden actual parent prevents scanning');group.visible=true;check(realAim(positions[0]).id,'rock:actual:0','Visible parent restores the same physical target');
const farPoint=new T.Vector3(base.x-.6,base.y+3,base.z-6);actualRocks.setMatrixAt(0,matrix.makeTranslation(farPoint.x,farPoint.y,farPoint.z));actualRocks.instanceMatrix.needsUpdate=true;check(realAim(farPoint),null,'Actual Raycaster enforces the five-metre range');actualRocks.setMatrixAt(0,matrix.makeTranslation(positions[0].x,positions[0].y,positions[0].z));actualRocks.instanceMatrix.needsUpdate=true;
const resourcesBefore=JSON.parse(actualResources());realAim(positions[0]);check(actual.scan(),true,'Actual nearby sample can scan after range change');realFinish();check(real.run('Object.keys(S.rockEvidence.entries).length'),1,'Actual first mesh scan writes one individual find');
check(JSON.parse(actualResources()),resourcesBefore,'Actual mesh scan creates no supplies or Fame');check(actual.target(true).known,true,'Actual completed target becomes known');
realAim(positions[1]);check(actual.scan(),true,'Actual second mesh instance starts its own scan');realFinish();check(real.run('Object.keys(S.rockEvidence.entries).length'),2,'Actual second instance receives a separate ledger entry');
const actualAfter=actualResources();real.run('S.rockEvidence=JSON.parse(JSON.stringify(S.rockEvidence));');realAim(positions[0]);actual.scan();realFinish();check(actualResources(),actualAfter,'Actual mesh scan after hydration cannot farm supplies');
const rec=discovery.molaRecord({c:12,r:20});check(rec.raw,e.run('DEM['+Math.max(0,Math.min(179,Math.floor((90-rec.lat)/180*180)))+'*360+'+(((Math.floor((rec.lon+180)/360*360)%360)+360)%360)+']'),'Record is exact nearest bundled raster sample');check(rec.elevationKm,e.run('elevKm('+rec.raw+')'),'Elevation uses bundled dataset conversion');discovery.ledger();assert(!/Ice-bearing|Hollow rock|\+5 Water/.test(e.context.__lastResult.html));checks++;
console.log(JSON.stringify({checks,result:'passed',coverage:'duration/cancellation lifecycle, real Three.js camera/InstancedMesh/ray intersections, unknown individual rocks, MOLA dataset records, no resource rewards, no ground rewards, visibility/obstacles/terrain/range, saved no-farming history, Blackout isolation'}));
