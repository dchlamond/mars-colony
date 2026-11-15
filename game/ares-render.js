/* Original Ares rendering integration. Blender assets + Grok surface art.
   Screen-space occlusion is a real-time approximation, not ray tracing.
   NASA measured global heights remain the simulation's owning source. */
(function(){
 'use strict';
 if(!window.THREE||!R3||!window.AresWorld)return;
 const art=AresWorld,loader=new THREE.GLTFLoader(),actors=new Map(),longitudeWraps=[],colonyWraps=new Map();
 let suit=null,rock=null,rockMaterial=null,ao=null,frameSize='',inRender=false,shuttle=null,lastPopulation=S.pop,landingUntil=0,patchSoil=null;
 const serviceAssets={},serviceBuildings=new Map();
 let routeSignature='',routes=null,cosmeticClock=0,cosmeticLast=0;
 const renderState=window.AresRender={version:3,technique:HQ?'PBR, soft shadows, screen-space ambient occlusion':'PBR, lightweight authored assets',actors,occlusion:HQ,render,serviceBuildings};
 const local=url=>(window.INLINE&&window.INLINE[url])||url;
 function asset(url,fn){art.pending++;loader.load(local(url),g=>{try{fn(g.scene);}catch(e){art.errors.push(url+': '+e.message);console.error(e);}finally{art.pending--;}},undefined,()=>{art.errors.push(url);art.pending--;});}
 function ownClone(source){const c=source.clone(true);c.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.castShadow=HQ;n.receiveShadow=true;}});return c;}
 function releaseActor(g){g?.traverse(n=>{if(n.isMesh)n.material.dispose();});g?.parent?.remove(g);}
 function clearActors(){for(const a of actors.values())releaseActor(a);actors.clear();}

 // Small original Blender props make work legible at both camera scales. The
 // equipment contains no simulation: its lights read the owning building flags.
 for(const [key,file] of Object.entries({controller:'service-controller-b03',water:'water-witness-b03',case:'crew-field-case-b03',tablet:'crew-tablet-b03'})){
  asset('assets/ares/'+file+'.glb',scene=>{serviceAssets[key]=scene;art.serviceKit=Object.keys(serviceAssets).length;syncServices();});
 }
 function emitters(group){const list=[];group.traverse(n=>{if(n.isMesh&&n.material.emissive&&n.material.emissive.getHex()!==0){n.userData.aresEmission=n.material.emissiveIntensity;list.push(n.material);}});return list;}
 function operating(b){
  if(!b.done||!b.on||S.sol<(b.offUntil||0)||S.over)return false;
  if(DEF[b.type]?.worker)return !!b.staffed&&(!DEF[b.type].use||!!b.powered);
  return true;
 }
 function servicePoint(b,back=false){
  const angle=b.mesh?.rotation.y||0,scale=b.mesh?.scale.x||1,x=.50*scale,z=(back?.93:.66)*scale;
  return {x:tx(b)+x*Math.cos(angle)+z*Math.sin(angle),z:tz(b)-x*Math.sin(angle)+z*Math.cos(angle),angle};
 }
 function visualBlocked(x,z){
  if(walkBlocked(x,z))return true;
  return S.builds.some(b=>{if(!b.done||b.type!=='solar')return false;let dx=x-tx(b);dx-=Math.round(dx/PW)*PW;return dx*dx+(z-tz(b))**2<.68*.68;});
 }
 function clearPoint(point){
  if(!visualBlocked(point.x,point.z))return point;
  for(let r=.18;r<1.5;r+=.18)for(let i=0;i<16;i++){const a=i*Math.PI/8,x=point.x+Math.cos(a)*r,z=point.z+Math.sin(a)*r;if(!visualBlocked(x,z))return{x,z};}
  return point;
 }
 function clearSegment(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16));for(let i=1;i<=n;i++){const t=i/n;if(visualBlocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
 function crewPath(start,end){
  start=clearPoint(start);end=clearPoint(end);end.x+=Math.round((start.x-end.x)/PW)*PW;
  if(clearSegment(start,end))return[start,end];
  const step=.28,minX=Math.min(start.x,end.x)-2.5,maxX=Math.max(start.x,end.x)+2.5,minZ=Math.min(start.z,end.z)-2.5,maxZ=Math.max(start.z,end.z)+2.5;
  const key=(x,z)=>x+','+z,origin={x:start.x,z:start.z,g:0,f:Math.hypot(end.x-start.x,end.z-start.z),ix:0,iz:0,parent:null},open=[origin],best=new Map([[key(0,0),origin]]),closed=new Set();let found=null;
  for(let count=0;open.length&&count<1800;count++){
   let at=0;for(let i=1;i<open.length;i++)if(open[i].f<open[at].f)at=i;const node=open.splice(at,1)[0],id=key(node.ix,node.iz);if(closed.has(id))continue;closed.add(id);
   if(Math.hypot(node.x-end.x,node.z-end.z)<step*1.5&&clearSegment(node,end)){found=node;break;}
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    if(!dx&&!dz)continue;const ix=node.ix+dx,iz=node.iz+dz,id=key(ix,iz),x=start.x+ix*step,z=start.z+iz*step,g=node.g+step*Math.hypot(dx,dz);
    if(closed.has(id)||x<minX||x>maxX||z<minZ||z>maxZ||(best.has(id)&&best.get(id).g<=g)||!clearSegment(node,{x,z}))continue;
    const next={x,z,ix,iz,g,f:g+Math.hypot(x-end.x,z-end.z),parent:node};best.set(id,next);open.push(next);
   }
  }
  if(!found)return[start];
  const points=[end];for(let n=found;n;n=n.parent)points.unshift({x:n.x,z:n.z});
  // Remove unnecessary grid corners, retaining obstacle clearance.
  const smooth=[points[0]];for(let i=0;i<points.length-1;){let j=points.length-1;while(j>i+1&&!clearSegment(points[i],points[j]))j--;smooth.push(points[j]);i=j;}return smooth;
 }
 function alongPath(points,f){
  if(points.length<2)return{...points[0],yaw:0};
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),total=lengths.reduce((a,b)=>a+b,0);let distance=f*total;
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],t=Math.min(1,distance/Math.max(.001,lengths[i]));return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}distance-=lengths[i];}
 }
 function syncServices(){
  if(!S||!R3)return;
  const live=new Set();
  for(const b of S.builds){
   if(!b.mesh)continue;
   const key=b.c+','+b.r,body=b.mesh.children[0];live.add(key);if(!body)continue;
   let item=serviceBuildings.get(key);
   if(!item||item.owner!==b.mesh||item.body!==body){
    if(item?.device){item.device.traverse(n=>{if(n.isMesh)n.material.dispose();});item.device.parent?.remove(item.device);}
    item={owner:b.mesh,body,lights:emitters(body),device:null,deviceLights:[],solar:[],b};
    if(b.type==='solar')body.traverse(n=>{if(n.isMesh&&/photovoltaic|navy/i.test(n.material.name)){item.solar.push({material:n.material,colour:n.material.color.clone()});}});
    serviceBuildings.set(key,item);
   }
   item.b=b;
   if(!item.device&&serviceAssets.controller&&['moxie','ice','green','reactor','mine'].includes(b.type)){
    const device=new THREE.Group();device.name='Authored service station';
    const control=ownClone(serviceAssets.controller);control.scale.setScalar(.55);device.add(control);
    device.position.set(.50,.12,.55);b.mesh.add(device);item.device=device;item.deviceLights=emitters(device);
   }
   if(item.device&&b.type==='ice'&&serviceAssets.water&&!item.witness){const witness=ownClone(serviceAssets.water);witness.scale.setScalar(.8);witness.position.set(-.23,0,.03);item.device.add(witness);item.witness=witness;item.deviceLights=emitters(item.device);}
   const running=operating(b),poweredRoom=b.type==='pod'||b.type==='habitat'?b.done&&b.on&&!S.over:running;
   item.running=running;item.reason=!b.done?'construction':!b.on?'switched off':S.sol<(b.offUntil||0)?'maintenance':DEF[b.type]?.worker&&!b.staffed?'no operator':DEF[b.type]?.use&&!b.powered?'no power':'operating';
   item.lights.forEach(m=>{m.emissiveIntensity=poweredRoom?.65:0;});
   const dustAmount=Math.min(.72,Math.max(0,1-S.panelClean)+(S.dust?.active?.28:0));
   item.solar.forEach(({material,colour})=>{material.color.copy(colour).lerp(new THREE.Color(0x986447).convertSRGBToLinear(),dustAmount);material.roughness=.28+dustAmount*.65;});
   if(item.device){item.device.visible=!!b.done;item.deviceLights.forEach(m=>{m.emissiveIntensity=running?.55:0;});}
  }
  for(const [key,item] of serviceBuildings)if(!live.has(key)){item.device?.traverse(n=>{if(n.isMesh)n.material.dispose();});item.device?.parent?.remove(item.device);serviceBuildings.delete(key);}
  rebuildRoutes();
 }
 function rebuildRoutes(){
  const buildings=S.builds.filter(b=>b.done),signature=S.seed+':'+buildings.map(b=>b.c+','+b.r+','+(b.lvl||1)).join(';')+':'+art.terrain;
  if(signature===routeSignature)return;routeSignature=signature;
  if(routes){routes.traverse(n=>{n.geometry?.dispose();if(n.material)n.material.dispose();});R3.scene.remove(routes);}
  routes=new THREE.Group();routes.name='Colony service routes';R3.scene.add(routes);renderState.routes=routes;
  if(buildings.length<2)return;
  // A minimum-length network avoids a star of overlapping roads. These shallow
  // tracks follow the same surface triangles as walking and add no collision.
  const linked=[buildings[0]],remaining=buildings.slice(1),points=[],uvs=[];
  while(remaining.length){let best={length:Infinity};for(const a of linked)for(let i=0;i<remaining.length;i++){const b=remaining[i],length=Math.hypot(tx(a)-tx(b),tz(a)-tz(b));if(length<best.length)best={a,b,i,length};}
   remaining.splice(best.i,1);linked.push(best.b);if(best.length>12)continue;
   const path=crewPath(servicePoint(best.a,true),servicePoint(best.b,true));
   for(let segment=1;segment<path.length;segment++){
    const a=path[segment-1],b=path[segment],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)continue;
    const nx=-dz/len*.12,nz=dx/len*.12,steps=Math.max(2,Math.ceil(len/.22));
    for(let i=0;i<steps;i++){
     const q=t=>({x:a.x+dx*t,z:a.z+dz*t}),u=q(i/steps),v=q((i+1)/steps);
     const vertex=(p,s)=>{const x=p.x+nx*s,z=p.z+nz*s;return[x,surfaceY(x,z)+.022,z];};
     points.push(...vertex(u,-1),...vertex(v,-1),...vertex(v,1),...vertex(u,-1),...vertex(v,1),...vertex(u,1));
     uvs.push(0,i/steps,0,(i+1)/steps,1,(i+1)/steps,0,i/steps,1,(i+1)/steps,1,i/steps);
    }
   }
  }
  if(points.length){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
   const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(0xa97855).convertSRGBToLinear(),roughness:1,metalness:0,transparent:true,opacity:.30,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide});
   mat.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vTrackEdge;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTrackEdge=uv.x;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTrackEdge;').replace('#include <alphatest_fragment>','diffuseColor.a*=smoothstep(0.0,.24,vTrackEdge)*(1.0-smoothstep(.76,1.0,vTrackEdge));\n#include <alphatest_fragment>');};
   mat.customProgramCacheKey=()=> 'blackout-soft-track-v1';
   const path=new THREE.Mesh(geometry,mat);path.name='Compacted service track';path.receiveShadow=true;routes.add(path);}
  renderState.routeSegments=points.length/18;
 }

 // The entire world relief is exported by Blender from the existing MOLA bytes.
 // No visual displacement changes coordinates, production or movement rules.
 for(let i=0;i<3;i++){const wrap=new THREE.Mesh(R3.map.geometry,R3.map.material);wrap.receiveShadow=true;wrap.name='Mars longitude wrap';R3.scene.add(wrap);longitudeWraps.push(wrap);}
 asset('assets/ares/mars-mola-'+(HQ?'terrain':'low')+'.glb',scene=>{
  let source;scene.traverse(n=>{if(n.isMesh&&n.name.startsWith('NASA_MOLA_relief'))source=n;});
  if(!source?.isMesh)throw Error('MOLA mesh missing');
  scene.updateMatrixWorld(true);
  const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
  // glTF's texture convention flips V; the existing NASA map material uses the
  // original Three.js plane convention, so restore it for these shared maps.
  const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));uv.needsUpdate=true;
  R3.map.geometry.dispose();R3.map.geometry=geometry;art.terrain='Blender MOLA mesh';
  R3.surfaceGrid={nx:HQ?360:180,ny:HQ?180:90};
  art.terrainVertices=geometry.attributes.position.count;
  // The equirectangular NASA map wraps at the date line; avoid a visible table
  // edge beside Arcadia without adding invented playable land.
  longitudeWraps.forEach(wrap=>{wrap.geometry=geometry;});
  syncLongitudeWraps();
  syncServices();
  // A player may enter before the asynchronous terrain GLB arrives. Resample
  // immediately against its triangles so asset replacement cannot bury them.
  if(R3.fp){R3.fp.y=surfaceY(R3.fp.x,R3.fp.z)+WALK_EYE;walkStep(0);}
 });
 function visualCopy(source){
  // Live building userData holds its owning game record, which points back to
  // the mesh. Object3D.clone JSON-serializes that cycle. Copy only visual state.
  const copy=source.isMesh?new THREE.Mesh(source.geometry,source.material):source.isLine?new THREE.Line(source.geometry,source.material):source.isSprite?new THREE.Sprite(source.material):new THREE.Group();
  copy.name=source.name;copy.position.copy(source.position);copy.quaternion.copy(source.quaternion);copy.scale.copy(source.scale);
  copy.visible=source.visible;copy.castShadow=source.castShadow;copy.receiveShadow=source.receiveShadow;copy.renderOrder=source.renderOrder;copy.frustumCulled=source.frustumCulled;
  source.children.forEach(child=>copy.add(visualCopy(child)));return copy;
 }
 function syncLongitudeWraps(){
  const cycle=R3.fp?Math.floor((R3.fp.x-X0)/PW):0;
  const offsets=[cycle-1,cycle,cycle+1].filter(n=>n!==0);
  longitudeWraps.forEach((mesh,i)=>{mesh.visible=i<offsets.length;if(mesh.visible)mesh.position.x=offsets[i]*PW;});
  // Wrapped physical footprints must also have visible models. Shared geometry
  // copies retain canonical gameplay coordinates; no extra colonists are created.
  const wanted=R3.fp?offsets:[],sources=[...S.builds.map(b=>b.mesh),...(R3.rmesh||[])].filter(Boolean),signature=sources.map(m=>m.uuid+':'+m.children.map(c=>c.uuid).join(',')).join('|');
  for(const [offset,entry] of colonyWraps)if(!wanted.includes(offset)){R3.scene.remove(entry.group);colonyWraps.delete(offset);}
  for(const offset of wanted){
   let entry=colonyWraps.get(offset);
   if(!entry||entry.signature!==signature){if(entry)R3.scene.remove(entry.group);const group=new THREE.Group();group.name='Visible colony longitude wrap';group.position.x=offset*PW;sources.forEach(m=>group.add(visualCopy(m)));R3.scene.add(group);entry={group,signature};colonyWraps.set(offset,entry);}
   entry.group.children.forEach((copy,i)=>{const source=sources[i];copy.position.copy(source.position);copy.quaternion.copy(source.quaternion);copy.scale.copy(source.scale);copy.visible=source.visible;});
  }
  renderState.longitudeCopies=offsets.slice();renderState.colonyLongitudeCopies=[...colonyWraps.keys()];
 }
 art.pending++;
 const soil=new THREE.TextureLoader().load(local('assets/ares/grok-regolith.jpg'),loaded=>{if(patchSoil){patchSoil.image=loaded.image;patchSoil.needsUpdate=true;}art.pending--;},undefined,()=>{art.errors.push('grok-regolith.jpg');art.pending--;});
 soil.encoding=THREE.sRGBEncoding;soil.wrapS=soil.wrapT=THREE.RepeatWrapping;soil.anisotropy=Math.min(8,R3.renderer.capabilities.getMaxAnisotropy());
 const previousCompile=R3.map.material.onBeforeCompile;
 R3.map.material.color.set(0xffffff);R3.map.material.roughness=.94;
 R3.map.material.onBeforeCompile=function(shader){
  previousCompile(shader);
  shader.uniforms.aresMineral={value:soil};
  shader.fragmentShader=shader.fragmentShader.replace('uniform sampler2D aresHeight;', 'uniform sampler2D aresHeight; uniform sampler2D aresMineral;');
  shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.rgb*=.83+grit*.32;',`
    vec3 mineral=mapTexelToLinear(texture2D(aresMineral,vAresGround.xz*.65)).rgb;
    float nearSurface=1.0-smoothstep(16.0,55.0,length(vViewPosition));
    float strata=.82+aNoise(vAresGround.xz*.9)*.30;
    diffuseColor.rgb=mix(diffuseColor.rgb,mineral*strata,nearSurface*.78);
    diffuseColor.rgb*=.95+grit*.10;
  `);
 };
 R3.map.material.customProgramCacheKey=()=> 'ares-mineral-v3';R3.map.material.needsUpdate=true;
 patchSoil=soil.clone();patchSoil.repeat.set(17,17);patchSoil.needsUpdate=true;
 R3.patch.material.map=patchSoil;R3.patch.material.normalScale.set(.34,.34);R3.patch.material.needsUpdate=true;

 // Warm directional daylight, low ambient fill and physically rough metal.
 // Artistic grading: no claim to a measured sky/sun simulation.
 R3.renderer.toneMappingExposure=1.06;
 R3.sun.color.setHex(0xffdeb1);R3.sun.shadow.radius=3;
 R3.sun.shadow.normalBias=.035;R3.sun.shadow.bias=-.0005;
 const shadow=R3.sun.shadow.camera;shadow.left=shadow.bottom=-18;shadow.right=shadow.top=18;shadow.updateProjectionMatrix();
 R3.hemi.color.setHex(0xb8c5ce);R3.hemi.groundColor.setHex(0x85432a);
 R3.scene.traverse(n=>{if(n.isHemisphereLight&&n!==R3.hemi)n.intensity=.05;});

 // Reuse the authored rock geometry for both strategy and surface views.
 asset('assets/ares/outcrop-r02-low.glb',scene=>{
  scene.updateMatrixWorld(true);let source;scene.traverse(n=>{if(n.isMesh&&!source)source=n;});
  if(!source)throw Error('Outcrop mesh missing');
  rock=source.geometry.clone().applyMatrix4(source.matrixWorld);rock.computeBoundingBox();
  const size=rock.boundingBox.getSize(new THREE.Vector3()),center=rock.boundingBox.getCenter(new THREE.Vector3());
  rock.translate(-center.x,-center.y,-center.z);rock.scale(1/size.x,1/size.x,1/size.x);
  const mat=rockMaterial=source.material.clone();mat.roughness=.97;mat.envMapIntensity=.12;
  renderState.rockGeometry=rock;renderState.rockMaterial=mat;
  function replace(n){if(!n?.isInstancedMesh)return;n.geometry.dispose();n.geometry=rock;n.material=mat;n.castShadow=HQ;n.receiveShadow=true;n.userData.blenderRock=true;}
  replace(R3.rocks);
  R3.scene.traverse(n=>{if(/Artistic basalt/.test(n.name))replace(n);});
  art.rocks='Blender stratified basalt';
 });
 // A close-up study formation deserves the complete stratified silhouette.
 // The single site stays detailed even when repeated scatter uses the Low mesh.
 asset('assets/ares/outcrop-r02.glb',scene=>{
  scene.updateMatrixWorld(true);let source;scene.traverse(n=>{if(n.isMesh&&!source)source=n;});
  if(!source)throw Error('Survey outcrop mesh missing');
  const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);geometry.computeBoundingBox();
  const size=geometry.boundingBox.getSize(new THREE.Vector3()),center=geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-center.x,-center.y,-center.z);geometry.scale(1/size.x,1/size.x,1/size.x);
  renderState.surveyRockGeometry=geometry;renderState.surveyRockMaterial=source.material.clone();renderState.surveyRockMaterial.roughness=.97;renderState.surveyRockMaterial.envMapIntensity=.12;
 });
 function enhanceCrags(){R3.scene.traverse(n=>{if(n.isInstancedMesh&&n.name==='Artistic basalt outcrops'&&!n.userData.aresCrags){n.userData.aresCrags=true;const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();for(let i=0;i<n.count;i++){n.getMatrixAt(i,m);m.decompose(p,q,s);s.multiplyScalar(1.7);p.y=groundY(p.x,p.z)+s.y*.30;m.compose(p,q,s);n.setMatrixAt(i,m);}n.instanceMatrix.needsUpdate=true;}});}

 // Hierarchical authored suit: no T pose and no single rigid astronaut mesh.
 const fallbackWorker=makeWorker;
 makeWorker=function(){
  if(!suit)return fallbackWorker();
  const g=ownClone(suit);g.userData.aresCrew=true;g.userData.authoredSuit=true;
  const get=name=>g.getObjectByName(name);
  g.userData.joints=[get('shoulder_L'),get('hip_L'),get('shoulder_R'),get('hip_R')];
  g.userData.elbows=[get('elbow_L'),get('elbow_R')];g.userData.knees=[get('knee_L'),get('knee_R')];g.userData.body=get('torso');g.userData.helmet=get('helmet');
  g.userData.pelvis=get('pelvis');
  return g;
 };
 // Match the selected intro's off-white EVA suit, graphite seals and blue accents.
 // Reuse the articulated mesh: no extra draw calls or heavier character rig.
 function styleExpeditionSuit(scene){
  const visited=new Set();scene.traverse(n=>{if(!n.isMesh)return;
   const m=n.material;
   if(/visor/i.test(m.name||'')){m.color.setHex(0x14232b);m.metalness=.65;m.roughness=.22;n.scale.x*=1.08;return;}
   m.metalness=.04;m.roughness=.82;
   const colors=n.geometry.getAttribute('color');if(!colors||visited.has(colors))return;visited.add(colors);
   for(let i=0;i<colors.count;i++){
    const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
    if(r>.68&&g>.64&&b>.5)colors.setXYZ(i,.78,.76,.69);
    else if(r>.6&&g>.5&&b>.4)colors.setXYZ(i,.50,.52,.50);
    else if(r>.43&&g<.3&&b<.08)colors.setXYZ(i,.12,.24,.34);
    else if(r>.3&&g<.32&&b<.15)colors.setXYZ(i,.055,.075,.09);
   }
   colors.needsUpdate=true;
  });
 }
 asset('assets/ares/astronaut-a02'+(HQ?'':'-low')+'.glb',scene=>{
  styleExpeditionSuit(scene);
  const bounds=new THREE.Box3().setFromObject(scene),height=bounds.max.y-bounds.min.y,scale=.54/height;
  scene.scale.setScalar(scale);scene.position.y=-bounds.min.y*scale;
  const holder=new THREE.Group();holder.add(scene);suit=holder;
  for(const name of ['shoulder_L','hip_L','shoulder_R','hip_R','elbow_L','elbow_R','knee_L','knee_R'])if(!holder.getObjectByName(name))throw Error('Missing astronaut joint '+name);
  for(const b of S.builds)if(b.astro){releaseActor(b.astro);b.astro=null;}
  clearActors();art.astronaut='Blender articulated A02 · intro expedition palette';syncScene();
 });
 function vehicle(scene,size){const box=new THREE.Box3().setFromObject(scene),dims=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=size/Math.max(dims.x,dims.z);scene.scale.setScalar(scale);scene.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);const holder=new THREE.Group();holder.add(scene);holder.traverse(n=>{if(n.isMesh){n.castShadow=HQ;n.receiveShadow=true;}});return holder;}
 asset('assets/ares/rover-rv02.glb',scene=>{R3.models.perseverance=vehicle(scene,1.05);if(R3.roverMesh){R3.scene.remove(R3.roverMesh);R3.roverMesh=null;}art.rover='Blender original survey rover';});
 asset('assets/ares/shuttle-l02.glb',scene=>{shuttle=vehicle(scene,1.35);shuttle.visible=false;R3.scene.add(shuttle);art.shuttle='Blender original crew shuttle';});
 function syncCrew(){
  if(!window.Junior?.isActive()){clearActors();return;}
  const crew=S.eco?.crew||Junior.crewRoles(),ids=new Set();
  for(const person of crew.assignments){
   ids.add(person.id);let a=actors.get(person.id);
   if(!a){a=makeWorker();a.userData.clock=person.role==='operator'?7-person.id*.7:0;actors.set(person.id,a);R3.scene.add(a);}
   a.userData.person=person;a.visible=!['explorer','sheltered'].includes(person.role)&&!S.over;
   if(a.userData.authoredSuit&&!a.userData.fieldCase&&serviceAssets.case){const prop=ownClone(serviceAssets.case);prop.position.set(0,-.55,.03);prop.visible=false;a.userData.elbows[1].add(prop);a.userData.fieldCase=prop;}
   if(a.userData.authoredSuit&&!a.userData.tablet&&serviceAssets.tablet){const prop=ownClone(serviceAssets.tablet);prop.position.set(0,-.34,.055);prop.rotation.set(-.35,Math.PI,0);prop.visible=false;a.userData.elbows[0].add(prop);a.userData.tablet=prop;}
  }
  for(const [id,a] of actors)if(!ids.has(id)){releaseActor(a);actors.delete(id);}
 }
 const priorSync=syncScene;
 syncScene=function(){priorSync();if(!S)return;const dust=!!S.dust?.active;R3.sun.intensity=dust?.38:1.55;R3.hemi.intensity=dust?.48:.30;if(S.pop>lastPopulation&&window.Junior?.isActive())landingUntil=performance.now()+3000;lastPopulation=S.pop;syncCrew();syncServices();};
 const priorWorld=buildWorld;
 buildWorld=function(){clearActors();routeSignature='';priorWorld();lastPopulation=S.pop;landingUntil=0;if(rock)R3.scene.traverse(n=>{if(n.isInstancedMesh&&/Artistic basalt/.test(n.name)){n.geometry=rock;n.material=rockMaterial;n.userData.blenderRock=true;}});enhanceCrags();syncServices();};
 const previousAnimation=animateWorkers;
 animateWorkers=function(dt){
  previousAnimation(dt);
  if(!window.Junior?.isActive())return;
  const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moving=!reduced&&!modalOpen&&!S.over&&(S.speed>0||performance.now()<(Junior.animationUntil||0));
  const pod=S.builds[0],homeX=tx(pod),homeZ=tz(pod);
  for(const [id,a] of actors){
   if(!a.visible)continue;const p=a.userData.person,work=p.role!=='resting';
   a.userData.clock=(a.userData.clock||0)+(moving?dt:0);
   const time=a.userData.clock,phase=(time+id*.7)%16,walk=work&&(phase<3.5||phase>13),f=phase<3.5?phase/3.5:phase>13?(16-phase)/3:1;
   const angle=id*2.39996,restX=homeX+Math.cos(angle)*(1.06+(id%2)*.22),restZ=homeZ+Math.sin(angle)*(1.06+(id%2)*.22);
   const target=tileAt(p.c,p.r),building=target.build,station=building&&servicePoint(building,true),offset=(id%2?1:-1)*.48,workX=station?station.x:tx(target)+offset,workZ=station?station.z:tz(target)+.73;
   const pathKey=routeSignature+':'+p.role+':'+p.c+','+p.r+':'+(R3.surveySite?R3.surveySite.x+','+R3.surveySite.z:'none');
   if(a.userData.pathKey!==pathKey){a.userData.pathKey=pathKey;a.userData.path=crewPath({x:restX,z:restZ},{x:workX,z:workZ});}
   const position=work?alongPath(a.userData.path,f):clearPoint({x:restX,z:restZ}),x=position.x,z=position.z;
   const wrappedX=R3.fp?x+Math.round((R3.fp.x-x)/PW)*PW:x;
   a.position.set(wrappedX,surfaceY(x,z)+.018,z);
   const targetYaw=work?(walk?position.yaw+(phase>13?Math.PI:0):Math.atan2(tx(target)-x,tz(target)-z)):-angle+Math.PI;
   if(moving){const turn=Math.atan2(Math.sin(targetYaw-a.rotation.y),Math.cos(targetYaw-a.rotation.y));a.rotation.y+=turn*Math.min(1,dt*8);}else a.rotation.y=targetYaw;
   const j=a.userData.joints;if(!j)continue;
   const stride=moving?Math.sin(time*6.4):0,repair=p.role==='builder'||p.role==='cleaner',garden=p.type==='green'||p.type==='dome';
   const active=work&&!walk;
   const actuallyWorking=active&&a.userData.path.length>1&&(!building||p.role!=='operator'||operating(building)),carry=walk&&p.role==='builder',inspect=actuallyWorking&&!repair&&!garden;
   a.userData.activity=walk?'walking to '+p.role:active?(p.role==='operator'&&!actuallyWorking?'waiting for machine power':repair?'building and maintaining':garden?'tending the greenhouse':'checking instruments'):'resting near the habitat';
   j[0].rotation.x=walk?stride*.38:actuallyWorking?(repair?-1.0+stride*.10:-.55):-.08;
   j[2].rotation.x=walk?-stride*.38:actuallyWorking?(repair?-.8-stride*.10:-.20):-.04;
   j[1].rotation.x=walk?-stride*.36:repair&&actuallyWorking?-.15:0;j[3].rotation.x=walk?stride*.36:repair&&actuallyWorking?.2:0;
   if(a.userData.elbows){a.userData.elbows[0].rotation.x=actuallyWorking?-.55:-.12;a.userData.elbows[1].rotation.x=actuallyWorking?-.42:-.12;}
   if(a.userData.knees){a.userData.knees[0].rotation.x=walk?Math.max(0,stride)*.32:0;a.userData.knees[1].rotation.x=walk?Math.max(0,-stride)*.32:0;}
   if(a.userData.body)a.userData.body.rotation.x=actuallyWorking&&(repair||garden)?.10:0;
   if(a.userData.helmet)a.userData.helmet.rotation.y=actuallyWorking?Math.sin(time*.8)*.09:0;
   // A quiet breathing/inspection layer can continue between turns, while the
   // travel clock, positions and all simulation progress remain paused.
   const ambient=reduced||modalOpen?0:Math.sin(cosmeticClock*1.1+id*1.7);
   if(a.userData.body)a.userData.body.rotation.z=ambient*.012;
   if(a.userData.helmet){a.userData.helmet.rotation.y+=ambient*.035;a.userData.helmet.rotation.x=inspect?.12:0;}
   if(a.userData.fieldCase){a.userData.fieldCase.visible=carry;if(carry){j[2].rotation.x=-.08;a.userData.elbows[1].rotation.x=-.08;}}
   if(a.userData.tablet){a.userData.tablet.visible=inspect;if(inspect){j[0].rotation.x=-.78;a.userData.elbows[0].rotation.x=-.62;j[2].rotation.x=-.46;a.userData.elbows[1].rotation.x=-.52+ambient*.035;}}
   // Kneel beside a low service point, with the thigh/knee chain bringing the
   // boot back to the surface rather than tipping a rigid body through it.
   if(actuallyWorking&&repair&&a.userData.knees){j[1].rotation.x=-.85;j[3].rotation.x=-.30;a.userData.knees[0].rotation.x=1.05;a.userData.knees[1].rotation.x=.70;a.position.y-=.028;if(a.userData.body)a.userData.body.rotation.x=.18;}
  }
 };

 // Contact occlusion complements the directional shadow map. It is disabled in
 // Low quality; all paths use the same game state and authored silhouettes.
 if(HQ&&THREE.SSAOPass){
  ao=new THREE.SSAOPass(R3.scene,R3.cam,800,600);ao.renderToScreen=true;
  ao.kernelRadius=.28;ao.minDistance=.00004;ao.maxDistance=.0012;
  ao.normalRenderTarget.depthTexture.type=THREE.UnsignedIntType;
  ao.normalRenderTarget.depthTexture.needsUpdate=true;
  ao.ssaoMaterial.fragmentShader=ao.ssaoMaterial.fragmentShader
   .replace('float depth = getDepth( vUv );','float depth = getDepth( vUv ); if(depth >= .999999){gl_FragColor=vec4(1.0);return;}')
   .replace('1.0 - occlusion','1.0 - occlusion * .55');
  ao.beautyRenderTarget.texture.encoding=THREE.sRGBEncoding;
  const priorVisibility=ao.overrideVisibility.bind(ao);
  ao.overrideVisibility=function(){priorVisibility();R3.scene.traverse(n=>{if(n.isMesh&&(n.material?.transparent||n===R3.scene.userData.sky)){if(!this._visibilityCache.has(n))this._visibilityCache.set(n,n.visible);n.visible=false;}});};
 }
 function render(){
  if(inRender)return;inRender=true;
  try{
   const now=performance.now(),reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
   // UI-driven renders can happen between animation frames. Update the atlas
   // label fade before rendering as well, avoiding a giant name over the base.
   for(const label of R3.names||[])label.material.opacity=R3.fp?0:Math.max(0,Math.min(.55,(R3.dist-17)/18));
   if(!reduced&&!document.hidden)cosmeticClock+=Math.min(.1,(now-(cosmeticLast||now))/1000);cosmeticLast=now;
   for(const item of serviceBuildings.values())item.deviceLights.forEach((m,i)=>{m.emissiveIntensity=item.running?(reduced?.55:.48+Math.max(0,Math.sin(cosmeticClock*2+i*1.3))*.12):0;});
   if(routes&&S.builds[0])routes.position.x=R3.fp?Math.round((R3.fp.x-tx(S.builds[0]))/PW)*PW:0;
   syncLongitudeWraps();
   R3.overlay.visible=!R3.fp;
   if(window.SurfaceSurvey)SurfaceSurvey.syncSite();
   if(window.SurfaceSurvey)SurfaceSurvey.update();
   if(shuttle){const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;shuttle.visible=!!S.junior&&performance.now()<landingUntil;if(shuttle.visible){const p=S.builds[0],x=tx(p)+1.6,z=tz(p)-1.6,wx=R3.fp?x+Math.round((R3.fp.x-x)/PW)*PW:x;shuttle.position.set(wx,surfaceY(x,z)+.04+(reduced?0:Math.max(0,(landingUntil-performance.now())/1000)*.5),z);}}
   if(R3.fp&&R3.roverMesh?.visible)R3.roverMesh.position.x+=Math.round((R3.fp.x-R3.roverMesh.position.x)/PW)*PW;
   if(!ao||!renderState.occlusion){R3.renderer.render(R3.scene,R3.cam);return;}
   const width=Math.min(1600,view.clientWidth),height=Math.round(width*view.clientHeight/view.clientWidth),key=width+'x'+height;
   if(key!==frameSize){ao.setSize(width,height);frameSize=key;}
   for(const material of [ao.ssaoMaterial,ao.depthRenderMaterial]){material.uniforms.cameraNear.value=R3.cam.near;material.uniforms.cameraFar.value=R3.cam.far;}
   ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(R3.cam.projectionMatrix);
   ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(R3.cam.projectionMatrixInverse);
   ao.render(R3.renderer,null);
  }finally{if(window.SurfaceSurvey)SurfaceSurvey.render(R3.renderer);inRender=false;}
 }
 enhanceCrags();syncScene();
})();
