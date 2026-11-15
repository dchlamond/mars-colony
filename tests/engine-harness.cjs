/* Run the shipped simulation in Node. Only DOM, timers and rendering are stubbed;
 * no resource, action, allocation, timing, random or progression rules are replaced.
 * Browser interaction/graphics are verified separately through real controls. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function engine(){
 const root=path.resolve(__dirname,'../game'),nodes=new Map(),events=new Map();
 class Storage {constructor(){this.values=new Map();}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}clear(){this.values.clear();}}
 class Element {
  constructor(){this.style={setProperty(){}};this.dataset={};this.children=[];this.hidden=false;this.textContent='';this.value='';this.classList={add(){},remove(){},toggle(){},contains(){return false;}};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  set innerHTML(v){this.html=v;}get innerHTML(){return this.html||'';}
  append(...els){this.children.push(...els);}appendChild(el){this.append(el);return el;}prepend(...els){this.children.unshift(...els);}remove(){}setAttribute(k,v){this[k]=String(v);}getAttribute(k){return this[k]??null;}
  querySelector(s){return node(s);}querySelectorAll(){return [];}closest(){return this;}addEventListener(){}dispatchEvent(){}focus(){}getBoundingClientRect(){return {height:50,width:900,left:0,top:0};}
 }
 const node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const document={body:node('body'),documentElement:node('html'),getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(k,f){if(!events.has(k))events.set(k,[]);events.get(k).push(f);},dispatchEvent(e){for(const f of events.get(e.type)||[])f(e);}};
 const context=vm.createContext({console,atob,btoa,DOMException,document,Storage,localStorage:new Storage(),performance:{now:()=>0},navigator:{userAgent:'Node rules audit'},location:{search:''},innerWidth:1440,innerHeight:900,URLSearchParams,URL,Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}},CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},ResizeObserver:class{observe(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},queueMicrotask(){},requestAnimationFrame(){},addEventListener(){},getComputedStyle:()=>({display:'block'}),structuredClone});
 context.window=context;
 const run=(code,name)=>vm.runInContext(code,context,{filename:name||'audit',timeout:120000});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const base=html.slice(html.indexOf("<script>\n'use strict';")+8,html.indexOf('</script>',html.indexOf("<script>\n'use strict';")));
 run(base.slice(0,base.indexOf('init3D(); newGame(); buildMenu(); render();'))+'\nrender=()=>{};syncScene=()=>{};buildMenu=()=>{};resize3D=()=>{};newGame();\n'+base.slice(base.indexOf('window.G={')),'index.html');
 for(const file of ['donki-snapshot.js','expedition.js','strategy.js','horizons-snapshot.js','operations.js','colony-systems.js','junior.js','mission-systems.js','blackout.js'])run(fs.readFileSync(path.join(root,file),'utf8'),file);
 run('render=()=>{};syncScene=()=>{};buildMenu=()=>{};modalQ=[];modalOpen=false;');
 return {run,context,nodes};
}
module.exports={engine};
if(require.main===module){const e=engine();console.log(e.run('({day:S.sol,mode:Junior.isActive(),start:Blackout.start({}).ok,resources:Blackout.view().resources})'));}
