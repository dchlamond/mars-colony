/* Original Ares rendering integration. Blender assets + Grok surface art.
   Screen-space occlusion is a real-time approximation, not ray tracing.
   NASA measured global heights remain the simulation's owning source. */
(function(){
 'use strict';
 if(!window.THREE||!R3||!window.AresWorld)return;
 const art=AresWorld,loader=new THREE.GLTFLoader(),actors=new Map(),longitudeWraps=[],colonyWraps=new Map();
 let suit=null,rock=null,rockMaterial=null,ao=null,frameSize='',inRender=false,shuttle=null,lastPopulation=S.pop,landingUntil=0,patchSoil=null;
 const renderState=window.AresRender={version:2,technique:HQ?'PBR, soft shadows, screen-space ambient occlusion':'PBR, lightweight authored assets',actors,occlusion:HQ,render};
 const local=url=>(window.INLINE&&window.INLINE[url])||url;
 function asset(url,fn){art.pending++;loader.load(local(url),g=>{try{fn(g.scene);}catch(e){art.errors.push(url+': '+e.message);console.error(e);}finally{art.pending--;}},undefined,()=>{art.errors.push(url);art.pending--;});}
 function ownClone(source){const c=source.clone(true);c.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.castShadow=HQ;n.receiveShadow=true;}});return c;}
 function releaseActor(g){g?.traverse(n=>{if(n.isMesh)n.material.dispose();});g?.parent?.remove(g);}
 function clearActors(){for(const a of actors.values())releaseActor(a);actors.clear();}

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
    diffuseColor.rgb=mix(diffuseColor.rgb,mineral*strata,nearSurface*.88);
    diffuseColor.rgb*=.90+grit*.20;
  `);
 };
 R3.map.material.customProgramCacheKey=()=> 'ares-mineral-v2';R3.map.material.needsUpdate=true;
 patchSoil=soil.clone();patchSoil.repeat.set(17,17);patchSoil.needsUpdate=true;
 R3.patch.material.map=patchSoil;R3.patch.material.normalScale.set(.34,.34);R3.patch.material.needsUpdate=true;

 // Warm directional daylight, low ambient fill and physically rough metal.
 // Artistic grading: no claim to a measured sky/sun simulation.
 R3.renderer.toneMappingExposure=1.14;
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
  return g;
 };
 asset('assets/ares/astronaut-a02'+(HQ?'':'-low')+'.glb',scene=>{
  const bounds=new THREE.Box3().setFromObject(scene),height=bounds.max.y-bounds.min.y,scale=.54/height;
  scene.scale.setScalar(scale);scene.position.y=-bounds.min.y*scale;
  const holder=new THREE.Group();holder.add(scene);suit=holder;
  for(const name of ['shoulder_L','hip_L','shoulder_R','hip_R','elbow_L','elbow_R','knee_L','knee_R'])if(!holder.getObjectByName(name))throw Error('Missing astronaut joint '+name);
  for(const b of S.builds)if(b.astro){releaseActor(b.astro);b.astro=null;}
  clearActors();art.astronaut='Blender articulated A02';syncScene();
 });
 function vehicle(scene,size){const box=new THREE.Box3().setFromObject(scene),dims=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=size/Math.max(dims.x,dims.z);scene.scale.setScalar(scale);scene.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);const holder=new THREE.Group();holder.add(scene);holder.traverse(n=>{if(n.isMesh){n.castShadow=HQ;n.receiveShadow=true;}});return holder;}
 asset('assets/ares/rover-rv02.glb',scene=>{R3.models.perseverance=vehicle(scene,1.05);if(R3.roverMesh){R3.scene.remove(R3.roverMesh);R3.roverMesh=null;}art.rover='Blender original survey rover';});
 asset('assets/ares/shuttle-l02.glb',scene=>{shuttle=vehicle(scene,1.35);shuttle.visible=false;R3.scene.add(shuttle);art.shuttle='Blender original crew shuttle';});
 function syncCrew(){
  if(!window.Junior?.isActive()){clearActors();return;}
  const crew=S.eco?.crew||Junior.crewRoles(),ids=new Set();
  for(const person of crew.assignments){
   ids.add(person.id);let a=actors.get(person.id);
   if(!a){a=makeWorker();actors.set(person.id,a);R3.scene.add(a);}
   a.userData.person=person;a.visible=!['explorer','sheltered'].includes(person.role)&&!S.over;
  }
  for(const [id,a] of actors)if(!ids.has(id)){releaseActor(a);actors.delete(id);}
 }
 const priorSync=syncScene;
 syncScene=function(){priorSync();if(!S)return;const dust=!!S.dust?.active;R3.sun.intensity=dust?.38:1.65;R3.hemi.intensity=dust?.48:.30;if(S.pop>lastPopulation&&window.Junior?.isActive())landingUntil=performance.now()+3000;lastPopulation=S.pop;syncCrew();};
 const priorWorld=buildWorld;
 buildWorld=function(){clearActors();priorWorld();lastPopulation=S.pop;landingUntil=0;if(rock)R3.scene.traverse(n=>{if(n.isInstancedMesh&&/Artistic basalt/.test(n.name)){n.geometry=rock;n.material=rockMaterial;n.userData.blenderRock=true;}});enhanceCrags();};
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
   const target=tileAt(p.c,p.r),offset=(id%2?1:-1)*.48,workX=tx(target)+offset,workZ=tz(target)+.73;
   const x=work?restX+(workX-restX)*f:restX,z=work?restZ+(workZ-restZ)*f:restZ;
   const wrappedX=R3.fp?x+Math.round((R3.fp.x-x)/PW)*PW:x;
   a.position.set(wrappedX,surfaceY(x,z)+.018,z);
   a.rotation.y=work?(walk?Math.atan2(workX-restX,workZ-restZ)+(phase>13?Math.PI:0):Math.atan2(tx(target)-x,tz(target)-z)):-angle+Math.PI;
   const j=a.userData.joints;if(!j)continue;
   const stride=moving?Math.sin(time*6.4):0,repair=p.role==='builder'||p.role==='cleaner',garden=p.type==='green'||p.type==='dome';
   const active=work&&!walk;
   a.userData.activity=walk?'walking to '+p.role:active?(repair?'building and maintaining':garden?'tending the greenhouse':'checking instruments'):'resting near the habitat';
   j[0].rotation.x=walk?stride*.38:active?(repair?-1.0+stride*.10:-.55):-.08;
   j[2].rotation.x=walk?-stride*.38:active?(repair?-.8-stride*.10:-.20):-.04;
   j[1].rotation.x=walk?-stride*.36:repair&&active?-.15:0;j[3].rotation.x=walk?stride*.36:repair&&active?.2:0;
   if(a.userData.elbows){a.userData.elbows[0].rotation.x=active?-.55:-.12;a.userData.elbows[1].rotation.x=active?-.42:-.12;}
   if(a.userData.knees){a.userData.knees[0].rotation.x=walk?Math.max(0,stride)*.32:0;a.userData.knees[1].rotation.x=walk?Math.max(0,-stride)*.32:0;}
   if(a.userData.body)a.userData.body.rotation.x=active&&(repair||garden)?.10:0;
   if(a.userData.helmet)a.userData.helmet.rotation.y=active?Math.sin(time*.8)*.09:0;
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
