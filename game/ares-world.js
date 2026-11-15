/* Ares Atlas visual assets. Original authored models and materials.
   Global relief remains NASA MOLA. Local grain, rocks and colony architecture are artistic.
   This file changes presentation, never production, resource, terrain or movement rules. */
(function () {
  'use strict';
  if (!window.THREE || !R3) return;
  const C = { ivory:0xd8c7a5, brass:0xbc9150, dark:0x25353b, navy:0x102e43,
    glass:0x8aa6a1, lamp:0xffd48b, rust:0x80503b, green:0x517c3f };
  const state = { version:'ares-atlas-2', assets:{}, pending:0, errors:[], surface:'NASA MOLA relief authored in Blender, with artistic mineral detail' };
  window.AresWorld = state;
  const textureLoader=new THREE.TextureLoader();
  function surfaceTexture(name,colour=false){const url='assets/ares/'+name+'.png';state.pending++;const tex=textureLoader.load((window.INLINE&&window.INLINE[url])||url,()=>state.pending--,undefined,()=>{state.errors.push(url);state.pending--;});tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,R3.renderer.capabilities.getMaxAnisotropy());if(colour)tex.encoding=THREE.sRGBEncoding;return tex;}
  const groundHeight=surfaceTexture('regolith-height'),groundNormal=surfaceTexture('regolith-normal'),groundColour=surfaceTexture('regolith-colour',true);
  const prototypeCache = new Map();
  const mesh = (group, geo, mat, x=0,y=0,z=0) => {
    const m = new THREE.Mesh(geo,mat); m.position.set(x,y,z); group.add(m); return m;
  };
  const material = (color, options={}) => new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness:.62,metalness:.12,envMapIntensity:.35,...options});
  const palette = {
    ivory:material(C.ivory,{roughness:.48}), brass:material(C.brass,{metalness:.58,roughness:.37}),
    dark:material(C.dark), navy:material(C.navy,{roughness:.35,metalness:.3}),
    glass:material(C.glass,{transparent:true,opacity:.25,roughness:.2,metalness:.1,depthWrite:false,side:THREE.DoubleSide}),
    lamp:material(C.lamp,{emissive:C.lamp,emissiveIntensity:.7,roughness:.5}),
    green:material(C.green,{roughness:.9}), soil:material(0x564436,{roughness:1}),
    rust:material(C.rust,{roughness:1}), steel:material(0x778482,{roughness:.45,metalness:.42})
  };
  function box(g,w,h,d,key,x=0,y=0,z=0) { return mesh(g,new THREE.BoxGeometry(w,h,d),palette[key],x,y,z); }
  function cylinder(g,r,h,key,x=0,y=0,z=0,n=24) { return mesh(g,new THREE.CylinderGeometry(r,r,h,n),palette[key],x,y,z); }
  function ring(g,r,t,key,x=0,y=0,z=0) { const m=mesh(g,new THREE.TorusGeometry(r,t,6,32),palette[key],x,y,z);m.rotation.x=Math.PI/2;return m; }
  function pipe(g,a,b,r,key='brass') {
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);
    const m=mesh(g,new THREE.CylinderGeometry(r,r,d.length(),8),palette[key]);m.position.copy(p.add(q).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;
  }
  // Merge static geometry by material. Every cloned building owns its materials so
  // construction ghosts cannot make another building transparent.
  function batch(g) {
    g.updateMatrixWorld(true); const groups=new Map();
    g.traverse(n=>{if(!n.isMesh)return;const source=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();source.applyMatrix4(n.matrixWorld);
      let bucket=groups.get(n.material);if(!bucket){bucket=[];groups.set(n.material,bucket);}bucket.push(source);
    });
    const out=new THREE.Group();
    for(const [mat,parts] of groups){const geo=new THREE.BufferGeometry();
      for(const name of ['position','normal','uv']){const width=name==='uv'?2:3,total=parts.reduce((n,p)=>n+p.attributes.position.count,0),array=new Float32Array(total*width);let offset=0;
        for(const p of parts){const a=p.attributes[name];if(a)array.set(a.array,offset);offset+=p.attributes.position.count*width;}geo.setAttribute(name,new THREE.BufferAttribute(array,width));}
      geo.computeBoundingSphere();mesh(out,geo,mat);parts.forEach(p=>p.dispose());
    }
    g.traverse(n=>{if(n.isMesh)n.geometry.dispose();});return out;
  }
  function clone(g) { const result=g.clone(true);result.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.castShadow=HQ;n.receiveShadow=true;}});return result; }
  function plinth(g,w=1.45,d=1.4) {
    box(g,w,.08,d,'dark',0,.05,0);box(g,w-.08,.04,d-.08,'brass',0,.11,0);
    for(const x of [-1,1])for(const z of [-1,1])cylinder(g,.055,.15,'steel',x*(w*.5-.12),.07,z*(d*.5-.12),8);
  }
  function airlock(g,x=0,z=.65) {
    box(g,.4,.42,.34,'ivory',x,.3,z);box(g,.29,.33,.025,'brass',x,.29,z+.18);
    box(g,.22,.28,.026,'dark',x,.27,z+.2);box(g,.13,.08,.027,'lamp',x,.34,z+.22);
    for(let i=0;i<3;i++)box(g,.43,.045,.13,'steel',x,.045+i*.035,z+.43-i*.11);
    for(const side of [-1,1])pipe(g,[x+side*.25,.12,z+.4],[x+side*.25,.35,z+.1],.012);
  }
  function fallbackHabitat() {
    const g=new THREE.Group();plinth(g,1.6,1.7);
    cylinder(g,.59,.4,'ivory',0,.32,0,40);
    mesh(g,new THREE.SphereGeometry(.59,40,16,0,Math.PI*2,0,Math.PI/2),palette.ivory,0,.52,0).scale.y=.72;
    ring(g,.6,.026,'brass',0,.14,0);ring(g,.6,.022,'brass',0,.5,0);ring(g,.24,.02,'brass',0,.91,0);
    for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a)*.598,z=Math.cos(a)*.598;
      box(g,.12,.13,.018,'lamp',x,.34,z).rotation.y=a;
      const rib=mesh(g,new THREE.TorusGeometry(.594,.009,4,24,Math.PI/2),palette.brass,0,.52,0);rib.rotation.y=a;rib.scale.y=.72;
    }
    airlock(g);return g;
  }
  function solar() {
    const g=new THREE.Group();
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){
      const x=(c-1)*.49,z=(r-1)*.47,hold=new THREE.Group();hold.position.set(x,.24,z);hold.rotation.x=-.3;g.add(hold);
      box(hold,.46,.035,.42,'brass');box(hold,.426,.01,.385,'navy',0,.023,0);
      for(let j=-2;j<=2;j++)box(hold,.0018,.003,.385,'steel',j*.071,.03,0);
      for(let j=-2;j<=2;j++)box(hold,.426,.003,.002,'steel',0,.03,j*.065);
      pipe(g,[x-.13,.035,z+.1],[x-.13,.24,z],.014,'steel');pipe(g,[x+.13,.035,z-.1],[x+.13,.24,z],.014,'steel');
    }
    box(g,.31,.15,.24,'ivory',.62,.11,.72);box(g,.24,.06,.025,'navy',.62,.13,.85);
    pipe(g,[-.5,.03,.7],[.6,.03,.7],.013,'dark');return g;
  }
  function oxygen() {
    const g=new THREE.Group();plinth(g,1.5,1.45);
    cylinder(g,.36,.83,'ivory',0,.56,0,32);mesh(g,new THREE.SphereGeometry(.36,32,12,0,Math.PI*2,0,Math.PI/2),palette.ivory,0,.975,0).scale.y=.55;
    for(const y of [.2,.36,.9])ring(g,.369,.019,'brass',0,y,0);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;pipe(g,[Math.sin(a)*.365,.3,Math.cos(a)*.365],[Math.sin(a)*.365,.86,Math.cos(a)*.365],.015);}
    for(const side of [-1,1]){cylinder(g,.13,.52,'ivory',side*.5,.39,.08,20);ring(g,.135,.015,'brass',side*.5,.2,.08);pipe(g,[side*.5,.62,.08],[side*.28,.75,.08],.03);}
    box(g,.25,.22,.08,'navy',0,.48,.36);box(g,.16,.06,.012,'lamp',0,.51,.407);
    for(const x of [-.18,0,.18]){pipe(g,[x,1.02,0],[x,1.23,0],.019);cylinder(g,.034,.025,'brass',x,1.23,0,12);}
    return g;
  }
  function greenhouse() {
    const g=new THREE.Group();plinth(g,1.65,1.3);
    const arch=(x,key,r=.5)=>{const m=mesh(g,new THREE.TorusGeometry(r,.014,6,24,Math.PI),palette[key],x,.15,0);m.rotation.y=Math.PI/2;return m;};
    // An enclosed half-cylinder with glazed end caps and an airlock.
    const shell=mesh(g,new THREE.CylinderGeometry(.5,.5,1.5,32,1,false,0,Math.PI),palette.glass,0,.15,0);shell.rotation.set(Math.PI/2,0,Math.PI/2);
    for(const x of [-.76,-.5,-.25,0,.25,.5,.76])arch(x,'brass');
    for(const z of [-.5,.5])pipe(g,[-.76,.15,z],[.76,.15,z],.019);
    pipe(g,[-.76,.65,0],[.76,.65,0],.012);
    for(const z of [-.26,.26])for(let c=0;c<6;c++){
      const x=-.6+c*.24;box(g,.21,.075,.24,'soil',x,.19,z);
      for(const side of [-1,1]){const leaf=mesh(g,new THREE.SphereGeometry(.055,8,6),palette.green,x+side*.035,.27,z);leaf.scale.set(.5,1.3,1);leaf.rotation.z=side*.5;}
    }
    airlock(g,0,.54);return g;
  }
  function battery() {const g=new THREE.Group();plinth(g,1.15,1.05);for(const x of [-.31,0,.31]){box(g,.27,.55,.65,'ivory',x,.4,0);box(g,.21,.07,.67,'brass',x,.18,0);box(g,.2,.3,.02,'navy',x,.43,.335);for(let y=0;y<4;y++)box(g,.12,.025,.025,'lamp',x,.32+y*.065,.35);}pipe(g,[-.4,.76,0],[.4,.76,0],.025);return g;}
  function drill(type) {const g=new THREE.Group();plinth(g,1.5,1.35);for(const s of [-1,1])pipe(g,[s*.27,.15,-.3],[0,1.18,-.3],.027,'steel');pipe(g,[0,.14,-.3],[0,1.18,-.3],.036);box(g,.38,.2,.35,'ivory',0,.87,-.3);for(let i=0;i<5;i++)ring(g,.06,.012,'brass',0,.24+i*.1,-.3);for(const z of [.05,.4]){cylinder(g,.2,.44,type==='ice'?'ivory':'dark',.45,.37,z);ring(g,.207,.015,'brass',.45,.2,z);}box(g,.38,.4,.4,'ivory',-.48,.34,.28);box(g,.22,.13,.02,'navy',-.48,.4,.49);return g;}
  function shield() {const g=new THREE.Group();mesh(g,new THREE.SphereGeometry(.76,32,16,0,Math.PI*2,0,Math.PI/2),palette.rust,0,0,0).scale.y=.58;for(let i=0;i<5;i++)ring(g,.2+i*.13,.024,'rust',0,.43-i*.072,0);airlock(g,0,.6);return g;}
  function garden() {const g=new THREE.Group();plinth(g,1.6,1.6);mesh(g,new THREE.SphereGeometry(.71,32,16,0,Math.PI*2,0,Math.PI/2),palette.glass,0,.15,0);for(let i=0;i<6;i++){const r=mesh(g,new THREE.TorusGeometry(.72,.013,5,32,Math.PI),palette.brass,0,.15,0);r.rotation.y=i*Math.PI/6;}ring(g,.72,.022,'brass',0,.15,0);for(const x of [-.3,.3]){box(g,.35,.08,.65,'soil',x,.18,0);for(const z of [-.2,0,.2])mesh(g,new THREE.SphereGeometry(.11,10,6),palette.green,x,.32,z);}airlock(g,0,.55);return g;}
  function reactor() {const g=new THREE.Group();plinth(g,1.4,1.4);cylinder(g,.22,.54,'ivory',0,.42,0);for(const y of [.2,.65])ring(g,.23,.024,'brass',0,y,0);pipe(g,[0,.6,0],[0,1.1,0],.035);const m=mesh(g,new THREE.ConeGeometry(.63,.21,32,1,true),palette.navy,0,1.06,0);m.material=palette.navy;for(let i=0;i<12;i++){const a=i*Math.PI/6;pipe(g,[0,1.16,0],[Math.sin(a)*.63,.955,Math.cos(a)*.63],.012);}return g;}
  function prototype(type) {
    if(state.assets[type])return state.assets[type];
    if(prototypeCache.has(type))return prototypeCache.get(type);
    const makers={pod:fallbackHabitat,habitat:fallbackHabitat,solar,moxie:oxygen,green:greenhouse,battery,ice:()=>drill('ice'),mine:()=>drill('mine'),shield,dome:garden,reactor};
    const g=batch((makers[type]||fallbackHabitat)());g.name='ARES '+type;g.userData.aresType=type;prototypeCache.set(type,g);return g;
  }
  const previousFill=fillBuilding;
  fillBuilding=function(g,type,keep){
    if(!DEF[type])return previousFill(g,type,keep);
    g.traverse(n=>{if(n.isMesh&&n.material&&n.userData.aresOwned)n.material.dispose();});
    while(g.children.length)g.remove(g.children[0]);
    g.userData.type=type;g.userData.want=null;g.userData.ares=true;
    const body=clone(prototype(type));g.add(body);
    body.traverse(n=>{if(n.isMesh){n.userData.aresOwned=true;n.userData.op=n.material.opacity;n.userData.tr=n.material.transparent;}});
    if(g.userData.b)g.userData.b.solid=null;
  };
  function refreshModels() {
    if(!S||!R3)return;
    for(const m of R3.bmeshes)fillBuilding(m,m.userData.type,true);
    for(const m of R3.rmesh||[])fillBuilding(m,'pod',true);
    syncScene();
  }
  function loadAsset(url,types,size) {
    state.pending++;
    new THREE.GLTFLoader().load((window.INLINE&&window.INLINE[url])||url,g=>{
      const o=g.scene,box3=new THREE.Box3().setFromObject(o),dims=box3.getSize(new THREE.Vector3()),center=box3.getCenter(new THREE.Vector3()),scale=size/Math.max(dims.x,dims.z);
      o.scale.setScalar(scale);o.position.set(-center.x*scale,-box3.min.y*scale,-center.z*scale);
      o.traverse(n=>{if(n.isMesh){n.castShadow=HQ;n.receiveShadow=true;for(const mat of [].concat(n.material)){mat.envMapIntensity=.35;mat.metalness=Math.min(.65,mat.metalness||0);if(/warm occupied windows/.test(mat.name)){mat.emissive.setHex(0xd67d26).convertSRGBToLinear();mat.emissiveIntensity=.8;}}}});
      const holder=new THREE.Group();holder.add(o);holder.name='Ares authored '+types[0];
      types.forEach(t=>state.assets[t]=holder);state.pending--;refreshModels();
    },undefined,e=>{state.errors.push(url);state.pending--;console.warn('Ares asset unavailable; retaining authored fallback:',url);});
  }
  state.loadAsset=loadAsset;
  state.refreshModels=refreshModels;

  // Rounded pressure suit and articulated limbs; all arms rest downward.
  makeWorker=function(){
    const g=new THREE.Group(),body=new THREE.Group();g.add(body);
    const torso=mesh(body,new THREE.SphereGeometry(.096,14,10),palette.ivory,0,.295,0);torso.scale.set(1,1.22,.7);
    box(body,.12,.15,.065,'dark',0,.30,-.085);box(body,.108,.12,.07,'ivory',0,.31,-.10);
    for(const x of [-.045,.045])cylinder(body,.024,.11,'brass',x,.31,-.15,10);
    cylinder(body,.06,.045,'dark',0,.39,0,16);mesh(body,new THREE.SphereGeometry(.089,18,12),palette.ivory,0,.46,0);
    const visor=mesh(body,new THREE.SphereGeometry(.074,18,12,0,Math.PI*2,0,Math.PI),palette.brass,0,.465,.026);visor.scale.set(.92,.83,.83);
    box(body,.065,.043,.02,'navy',0,.32,.072);box(body,.029,.014,.024,'lamp',.04,.35,.069);
    const statics=batch(body);g.remove(body);g.add(statics);
    const joints=[],elbows=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.105,.37,0);g.add(arm);
      const upper=new THREE.Group();cylinder(upper,.028,.085,'ivory',0,-.043,0,10);mesh(upper,new THREE.SphereGeometry(.032,10,6),palette.ivory,0,0,0);arm.add(batch(upper));
      const elbow=new THREE.Group();elbow.position.y=-.09;arm.add(elbow);const lower=new THREE.Group();cylinder(lower,.025,.075,'ivory',0,-.037,0,10);cylinder(lower,.027,.018,'brass',0,-.063,0,10);mesh(lower,new THREE.SphereGeometry(.028,10,6),palette.dark,0,-.088,.003);elbow.add(batch(lower));elbows.push(elbow);
      arm.rotation.z=side*.07;joints.push(arm);
      const leg=new THREE.Group();leg.position.set(side*.047,.215,0);g.add(leg);const lowerBody=new THREE.Group();cylinder(lowerBody,.034,.15,'ivory',0,-.075,0,10);cylinder(lowerBody,.036,.024,'dark',0,-.085,0,10);box(lowerBody,.069,.045,.103,'dark',0,-.17,.014);leg.add(batch(lowerBody));joints.push(leg);
    }
    g.userData.joints=joints;g.userData.elbows=elbows;g.userData.body=statics;g.userData.aresCrew=true;
    g.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.castShadow=HQ;n.receiveShadow=true;}});
    return g;
  };
  animateWorkers=function(dt){
    const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(const b of S.builds){const a=b.astro;if(!a||!a.visible)continue;const j=a.userData.joints;if(!j)continue;
      const moving=(S.speed>0||performance.now()<(S.juniorAnimationUntil||0)||performance.now()<(window.Junior?.animationUntil||0))&&!modalOpen&&!S.over&&!reduced;
      a.userData.clock=(a.userData.clock||0)+(moving?dt:0);
      if(b.type==='pod'){
        const x=tx(b)+.94,z=tz(b)+.72;a.position.set(x,groundY(x,z)+.02,z);a.rotation.y=-.3;
        const idle=moving?Math.sin(a.userData.clock*1.5)*.025:0;
        j[0].rotation.x=-.12+idle;j[2].rotation.x=-.35-idle;j[1].rotation.x=j[3].rotation.x=0;
        if(a.userData.elbows){a.userData.elbows[0].rotation.x=-.14;a.userData.elbows[1].rotation.x=-.45;}
        a.userData.activity='watching the colony';continue;
      }
      const time=a.userData.clock,phase=(time+(b.c+b.r)%7)%18,travel=phase<5||phase>14,pod=S.builds[0],target=tileAt(b.c,b.r),start=tileAt(pod.c,pod.r);
      const blend=phase<5?phase/5:phase>14?(18-phase)/4:1;
      const x=tx(start)+(tx(target)-tx(start))*blend+.48,z=tz(start)+(tz(target)-tz(start))*blend+.55;
      if(!reduced){a.position.set(x,groundY(x,z)+.02,z);a.rotation.y=travel?Math.atan2(tx(target)-tx(start),tz(target)-tz(start))+(phase>14?Math.PI:0):Math.atan2(tx(target)-x,tz(target)-z);}
      const swing=moving?Math.sin(time*7):0,repair=!b.done||window.ColonySystems?.repairing(b),garden=b.type==='green'||b.type==='dome';
      a.userData.activity=travel?'walking':repair?'repairing':garden?'gardening':'checking instruments';
      j[0].rotation.x=travel?swing*.43:repair?-1.08+swing*.12:garden?-.85+swing*.08:-.65;
      j[2].rotation.x=travel?-swing*.43:repair?-.76-swing*.1:garden?-.9-swing*.08:-.18;
      j[1].rotation.x=travel?-swing*.4:repair?-.25:0;j[3].rotation.x=travel?swing*.4:repair?.35:0;
      if(a.userData.elbows){a.userData.elbows[0].rotation.x=travel?-.18:-.45;a.userData.elbows[1].rotation.x=travel?-.18:-.6;}
      if(a.userData.body)a.userData.body.rotation.x=!travel&&(repair||garden)?.18:0;
    }
  };

  function lighting() {
    R3.renderer.toneMappingExposure=1;R3.scene.fog.color.setHex(0xc59b7e);
    R3.sun.color.setHex(0xffe0b7);R3.hemi.color.setHex(0xe8dfc9);R3.hemi.groundColor.setHex(0x74432f);
    R3.scene.traverse(n=>{if(n.isHemisphereLight&&n!==R3.hemi){n.intensity=.14;n.color.setHex(0xc4bbb0);}});
    R3.sun.shadow.normalBias=.015;R3.sun.shadow.bias=-.0003;
    // A small original environment provides coherent metal reflections without external files.
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d'),gr=ctx.createLinearGradient(0,0,0,128);
    gr.addColorStop(0,'#c6b6a0');gr.addColorStop(.46,'#f0d4ac');gr.addColorStop(.52,'#73523d');gr.addColorStop(1,'#3c2b23');ctx.fillStyle=gr;ctx.fillRect(0,0,256,128);
    ctx.fillStyle='#ffecc8';ctx.fillRect(36,28,30,10);
    const tex=new THREE.CanvasTexture(canvas);tex.encoding=THREE.sRGBEncoding;tex.mapping=THREE.EquirectangularReflectionMapping;
    const pmrem=new THREE.PMREMGenerator(R3.renderer),env=pmrem.fromEquirectangular(tex);R3.scene.environment=env.texture;state.environment=env;tex.dispose();pmrem.dispose();
    const sky=R3.scene.userData.sky;
    if(sky){const previous=sky.material;sky.material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
      uniforms:{zenith:{value:new THREE.Color(0x92705b)},horizon:{value:new THREE.Color(0xe6bb93)},soil:{value:new THREE.Color(0x9f7252)}},
      vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vDirection;uniform vec3 zenith;uniform vec3 horizon;uniform vec3 soil;void main(){vec3 d=normalize(vDirection);vec3 color=mix(horizon,zenith,smoothstep(0.0,0.8,d.y));color=mix(color,soil,1.0-smoothstep(-0.35,0.0,d.y));float glow=pow(max(0.0,dot(d,normalize(vec3(-26.0,30.0,18.0)))),42.0);color+=vec3(.08,.055,.025)*glow;gl_FragColor=vec4(color,1.0);}'
    });previous.map?.dispose();previous.dispose();}
    R3.map.material.color.setHex(0xb97753);R3.map.material.roughness=.96;R3.map.material.envMapIntensity=.12;
    // Detail is evaluated in world space, leaving the NASA photo and MOLA geometry intact.
    R3.map.material.onBeforeCompile=shader=>{
      shader.uniforms.aresHeight={value:groundHeight};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vAresGround;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvAresGround=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vAresGround;
        uniform sampler2D aresHeight;
        float aHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float aNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(aHash(i),aHash(i+vec2(1.,0.)),f.x),mix(aHash(i+vec2(0.,1.)),aHash(i+vec2(1.,1.)),f.x),f.y);}
      `).replace('#include <map_fragment>',`#include <map_fragment>
        float grit=aNoise(vAresGround.xz*18.0)*.55+aNoise(vAresGround.xz*42.0)*.25+aNoise(vAresGround.xz*3.0)*.2;
        diffuseColor.rgb*=.83+grit*.32;
      `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float aresH=texture2D(aresHeight,vAresGround.xz*1.2).r;
        float aresClose=1.0-smoothstep(22.0,45.0,length(vViewPosition));
        vec3 aresDX=dFdx(-vViewPosition),aresDY=dFdy(-vViewPosition);
        vec3 aresR1=cross(aresDY,normal),aresR2=cross(normal,aresDX);
        float aresDet=dot(aresDX,aresR1);
        // The grain is a surface finish, not ankle-high geometry. A restrained
        // amplitude prevents 8-bit height texels becoming square-looking crags.
        vec3 aresGrad=sign(aresDet)*(dFdx(aresH)*aresR1+dFdy(aresH)*aresR2)*.008*aresClose;
        normal=normalize(abs(aresDet)*normal-aresGrad);
      `);
    };R3.map.material.needsUpdate=true;
    groundColour.repeat.set(42,42);groundNormal.repeat.set(42,42);
    const oldPatch=R3.patch.material;R3.patch.material=material(0xffffff,{map:groundColour,normalMap:groundNormal,normalScale:new THREE.Vector2(.55,.55),roughness:.98,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,envMapIntensity:.08});oldPatch.dispose();
    R3.ring.material.color.setHex(0x85c2b6);
    R3.rocks.material.color.setHex(0x7c4632).convertSRGBToLinear();
  }
  function mapStyle() {
    if(R3.grid)R3.grid.material.color.setHex(0x679b96);
    if(R3.terr)R3.terr.traverse(n=>{if(n.isLineSegments&&n.material)n.material.color.setHex(0x77b7ae);});
  }
  const outcropGeometry=new THREE.CylinderGeometry(.65,.88,.65,7,4);
  {const p=outcropGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),angle=Math.atan2(z,x),fold=1+Math.sin(angle*3+.7)*.13+Math.cos(y*21)*.045;p.setXYZ(i,x*fold,y,z*fold);}outcropGeometry.computeVertexNormals();}
  let outcrops=null;
  const scatterGeometry=new THREE.IcosahedronGeometry(1,0);
  {const p=scatterGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=1+.18*Math.sin(x*13+y*9+z*7);p.setXYZ(i,x*v,y*.65*v,z*v);}scatterGeometry.computeVertexNormals();}
  const scatter=new THREE.InstancedMesh(scatterGeometry,material(0x633722,{roughness:1,metalness:0,envMapIntensity:.05}),HQ?180:64);
  scatter.name='Artistic basalt fragments';scatter.castShadow=HQ;scatter.receiveShadow=true;R3.scene.add(scatter);let scatterSignature='';
  function scatterRocks(){
    const pod=S.builds[0],signature=S.seed+':'+S.builds.map(b=>b.c+','+b.r).join(';');if(signature===scatterSignature)return;scatterSignature=signature;
    // Each tile owns fixed slots. Occupying one tile removes only its fragments,
    // rather than reseeding the positions and discovery IDs of every survivor.
    const tiles=S.tiles.filter(t=>t.type!=='ice'&&hdist(t,pod)<7),candidates=[];
    for(const t of tiles)for(let slot=0;slot<2;slot++){
      let seed=(Math.imul(t.c+1,73856093)^Math.imul(t.r+1,19349663)^Math.imul(slot+1,1640531535)^Math.imul((S.seed||0)|0,83492791))>>>0;
      const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const priority=rand(),a=rand()*6.28,d=.25+rand()*.46,x=tx(t)+Math.cos(a)*d,z=tz(t)+Math.sin(a)*d,k=.035+Math.pow(rand(),3)*.19;
      candidates.push({id:'fragment:'+t.c+':'+t.r+':'+slot,t,priority,x,z,k,rx:rand()*.6,ry:rand()*6.28,rz:rand()*.5,sz:.8+rand()*.6});
    }
    candidates.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
    // Select the shared quality subset before removing occupied tiles. Building
    // cannot cause unrelated fragments to appear, disappear, or change location.
    const visible=candidates.slice(0,scatter.instanceMatrix.count).filter(c=>!c.t.build);
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3();
    const attribute=scatter.geometry.attributes.position;let support=scatter.geometry.userData.walkSupport;
    if(!support||support.attribute!==attribute||support.version!==attribute.version){const points=new Float32Array(attribute.count*3);for(let i=0;i<attribute.count;i++){points[i*3]=attribute.getX(i);points[i*3+1]=attribute.getY(i);points[i*3+2]=attribute.getZ(i);}support=scatter.geometry.userData.walkSupport={attribute,version:attribute.version,points};}
    scatter.count=visible.length;scatter.visible=scatter.count>0;scatter.userData.scanIds=visible.map(c=>c.id);
    for(let i=0;i<visible.length;i++){
      const c=visible[i];e.set(c.rx,c.ry,c.rz);q.setFromEuler(e);p.set(0,0,0);s.set(c.k,c.k,c.k*c.sz);m.compose(p,q,s);
      const a=m.elements,points=support.points;let minY=Infinity,lowest=0;
      for(let j=0;j<points.length;j+=3){const y=a[1]*points[j]+a[5]*points[j+1]+a[9]*points[j+2];if(y<minY){minY=y;lowest=j;}}
      const px=points[lowest],py=points[lowest+1],pz=points[lowest+2],supportX=a[0]*px+a[4]*py+a[8]*pz,supportZ=a[2]*px+a[6]*py+a[10]*pz;
      const y=surfaceY(c.x+supportX,c.z+supportZ)-minY-Math.max(.003,c.k*.035);m.setPosition(c.x,y,c.z);scatter.setMatrixAt(i,m);
    }
    scatter.instanceMatrix.needsUpdate=true;
  }
  state.refreshRockScatter=()=>{scatterSignature='';scatterRocks();};
  function addOutcrops(){
    if(outcrops)R3.scene.remove(outcrops);
    const pod=S.builds[0],tiles=S.tiles.filter(t=>t.type==='rock'&&hdist(t,pod)<10&&!t.build);
    if(!tiles.length)return;
    outcrops=new THREE.InstancedMesh(outcropGeometry,palette.rust,tiles.length);outcrops.name='Artistic basalt outcrops';outcrops.castShadow=HQ;outcrops.receiveShadow=true;outcrops.userData.scanIds=tiles.map(t=>'outcrop:'+t.c+':'+t.r);
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3();
    tiles.forEach((t,i)=>{const height=.45+t.shade*.8;e.set(0,t.shade*6.28,0);q.setFromEuler(e);s.set(.7+t.shade*.22,height,.7);p.set(tx(t),tileY(t)+height*.3,tz(t));m.compose(p,q,s);outcrops.setMatrixAt(i,m);});
    outcrops.instanceMatrix.needsUpdate=true;R3.scene.add(outcrops);
  }
  const priorBuildWorld=buildWorld;
  buildWorld=function(){priorBuildWorld();R3.dist=11.5;mapStyle();addOutcrops();scatterSignature='';scatterRocks();};
  const priorTerritory=rebuildTerritory;
  rebuildTerritory=function(){priorTerritory();mapStyle();
    // Refine existing territory bands to a narrow inlay instead of a broad paint stripe.
    for(const n of R3.terr.children){if(!n.isMesh||!n.geometry?.attributes.position||n.material.map||n.material.opacity!==.9)continue;
      const p=n.geometry.attributes.position;
      for(let i=0;i+5<p.count;i+=6){for(const [inner,outer] of [[2,1],[4,1],[5,0]]){const j=i+inner,k=i+outer,x=p.getX(k)+(p.getX(j)-p.getX(k))*.2,z=p.getZ(k)+(p.getZ(j)-p.getZ(k))*.2;p.setXYZ(j,x,groundY(x,z)+.1,z);}}
      p.needsUpdate=true;n.material.opacity=.7;
    }
  };
  const priorSync=syncScene;
  syncScene=function(){priorSync();if(!R3||!S)return;const dust=S.dust&&S.dust.active;R3.sun.intensity=dust?.35:1;R3.hemi.intensity=dust?.4:.5;scatterRocks();
    // One representative person beside the landing pod gives a new colony life.
    // It represents existing available crew, not an extra simulated colonist.
    const pod=S.builds[0],available=S.pop-(S.rover?.crew||0)>0&&!S.eco?.sheltering&&!S.over;
    if(!window.Junior?.isActive()){
      if(pod&&available&&!pod.astro){pod.astro=makeWorker();pod.astro.userData.b=pod;R3.world.add(pod.astro);}
      if(pod?.astro)pod.astro.visible=available;
    }
  };
  lighting();mapStyle();
  // Replace the current world's models and crew as well as future missions.
  if(S){for(const b of S.builds)if(b.astro){R3.world.remove(b.astro);b.astro=null;}refreshModels();R3.dist=11.5;R3.terrSig='';addOutcrops();}
  loadAsset('assets/ares/habitat-h01'+(HQ?'':'-low')+'.glb',['pod','habitat'],1.72);
  loadAsset('assets/ares/greenhouse-g01.glb',['green'],1.85);
  for(const [type,file] of Object.entries({solar:'solar-s02',moxie:'moxie-o02',ice:'ice-w02',shield:'shield-r02',battery:'battery-b02',mine:'mine-m02',dome:'dome-d02',reactor:'reactor-p02'}))loadAsset('assets/ares/'+file+'.glb',[type],type==='solar'?1.78:1.72);
  state.ready=true;
})();
