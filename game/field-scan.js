/* Short illustrative survey animation; does not claim to measure mineral chemistry. */
(function(){
'use strict';
const duration=2400;
let job=null,frame=null,world=null;
const hud=document.createElement('section');hud.id='fieldScan';hud.hidden=true;hud.setAttribute('aria-label','Field scan');
hud.innerHTML='<div class="scan-reticle" aria-hidden="true"><i></i><span></span></div><div class="scan-readout"><span class="scan-kicker">FIELD ANALYSIS</span><strong id="scanTarget"></strong><div class="scan-track" role="progressbar" aria-label="Scanning progress" aria-valuemin="0" aria-valuemax="100"><span id="scanFill"></span></div><div class="scan-meta"><span id="scanPhase" role="status">Acquiring sample</span><b id="scanPercent">0%</b></div><small>Hold your aim · Esc cancels</small></div>';
document.body.append(hud);
const node=id=>document.getElementById(id);
function reduced(){return document.body.classList.contains('reduce-motion')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function clear(){
 if(frame!==null){cancelAnimationFrame(frame);frame=null;}
 job=null;hud.hidden=true;document.getElementById('fieldScientist')?.classList.remove('field-analyzing');
 if(world){world.group.parent?.remove(world.group);for(const mesh of world.group.children){mesh.geometry.dispose();mesh.material.dispose();}world=null;}
}
function cancel(){if(!job)return false;clear();return true;}
function makeWorld(anchor){
 if(!anchor||!window.THREE||!R3?.scene)return;
 const T=window.THREE,r=anchor.radius||.85,h=anchor.height||1.3,group=new T.Group();group.name='Field scan visual only';
 const ring=new T.Mesh(new T.TorusGeometry(r,.014,6,64),new T.MeshBasicMaterial({color:0x8cecff,transparent:true,opacity:.85,depthWrite:false}));ring.rotation.x=Math.PI/2;
 const base=new T.Mesh(new T.RingGeometry(r*.95,r,64),new T.MeshBasicMaterial({color:0x8cecff,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;
 group.add(ring,base);group.position.set(anchor.x,anchor.y+.03,anchor.z);R3.scene.add(group);world={group,ring,base,height:h};
}
function start(options){
 if(job||!R3?.fp||modalOpen||document.hidden||options.valid?.()===false)return false;
 job={...options,mission:S,started:performance.now()};hud.hidden=false;
 hud.classList.toggle('scan-reduced',!!reduced());node('scanTarget').textContent=options.label;
 document.getElementById('fieldScientist')?.classList.add('field-analyzing');makeWorld(options.anchor);
 window.BlackoutAudio?.cue('radio');update(job.started);return true;
}
function update(now=performance.now()){
 if(frame!==null){cancelAnimationFrame(frame);frame=null;}
 if(!job)return;
 if(!R3?.fp||S!==job.mission||modalOpen||document.hidden||job.valid?.()===false){cancel();return;}
 const p=Math.max(0,Math.min(1,(now-job.started)/duration)),percent=Math.floor(p*100);
 node('scanFill').style.width=percent+'%';hud.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(percent));node('scanPercent').textContent=percent+'%';
 const phase=p<.25?'Acquiring sample':p<.78?'Scanning surface':'Preparing discovery';if(node('scanPhase').textContent!==phase)node('scanPhase').textContent=phase;
 if(world){world.ring.position.y=reduced()?.1:(.08+Math.sin(p*Math.PI)*world.height);world.ring.material.opacity=.5+.35*Math.sin(p*Math.PI);}
 if(p>=1){const complete=job.complete;clear();complete?.();return;}
 frame=requestAnimationFrame(update);
}
// Cancel synchronously so a hidden tab cannot complete a stale scan on return.
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
window.FieldScan={start,cancel,update,duration,get busy(){return !!job;}};
})();
