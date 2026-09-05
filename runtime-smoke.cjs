const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync(__dirname+'/src/fafatraining-v85.js','utf8');
const appEl={innerHTML:''};
const local={};
const context={
 console,
 document:{
   documentElement:{dataset:{}},
   getElementById:(id)=>id==='app'?appEl:null,
   querySelector:()=>null,
   querySelectorAll:()=>[],
   createElement:(tag)=>({className:'',textContent:'',style:{},click(){},remove(){},classList:{add(){},remove(){},toggle(){}}}),
   body:{appendChild(){}}
 },
 window:null,
 navigator:{},
 location:{hash:'#home',href:'http://localhost/index.html'},
 history:{length:1,back(){}},
 localStorage:{getItem:k=>local[k]??null,setItem:(k,v)=>local[k]=String(v),removeItem:k=>delete local[k]},
 URL,URLSearchParams,Blob,File:global.File,
 setTimeout:(fn)=>0,clearTimeout(){},setInterval:(fn)=>1,clearInterval(){},
 addEventListener(){}, confirm:()=>true,
 structuredClone:global.structuredClone,
 Math,Date,JSON,Number,String,Array,Object,Set,Map,Promise,encodeURIComponent,decodeURIComponent
};
context.window=context;
vm.createContext(context);
try{vm.runInContext(code,context,{filename:'fafatraining-v85.js',timeout:10000});}catch(e){console.error('BOOT FAIL',e);process.exit(1)}
if(!appEl.innerHTML.includes('Une séance claire')){console.error('HOME RENDER FAIL',appEl.innerHTML.slice(0,500));process.exit(2)}
const routes=['#studio','#build','#clients','#library','#progress','#settings','#library-public'];
for(const r of routes){context.location.hash=r;try{vm.runInContext('render()',context,{timeout:5000});}catch(e){console.error('ROUTE FAIL',r,e);process.exit(3)}if(!appEl.innerHTML||appEl.innerHTML.length<100){console.error('EMPTY ROUTE',r);process.exit(4)}console.log('OK',r,appEl.innerHTML.length)}
// Builders
for(const [mode,route] of [['session','#session-builder'],['program','#program-builder'],['class','#class-builder']]){vm.runInContext(`resetBuild('${mode}')`,context);context.location.hash=route;vm.runInContext('render()',context,{timeout:5000});if(!appEl.innerHTML.includes('Continuer')&&!appEl.innerHTML.includes('Ajoute d’abord')){console.error('BUILDER FAIL',mode);process.exit(5)}console.log('OK builder',mode,appEl.innerHTML.length)}
console.log('RUNTIME SMOKE OK');
