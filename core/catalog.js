(()=>{'use strict';
const PDETAIL=new Map(),EDETAIL=new Map(),loadedP=new Set(),loadedE=new Set();let meta=null,pIndex=[],eIndex=[];
const slugMap={'Musculation & Renforcement':'strength','Cardio & Endurance':'cardio','Cross & Functional':'functional','Préparation Physique':'athletic','Cours Collectifs':'collective','Boxe & Combat':'boxing','Mobilité & Prévention':'mobility','HYROX':'hyrox'};
const j=async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error(u);return r.json()};
async function init(){[meta,pIndex,eIndex]=await Promise.all([j('./data/catalog.json'),j('./data/program-index.json'),j('./data/exercise-index.json')]);return{meta,programs:pIndex,exercises:eIndex}}
async function loadProgramFamily(fam){if(loadedP.has(fam))return;const slug=slugMap[fam];if(!slug)return;const arr=await j(`./data/programs/${slug}.json`);arr.forEach(x=>PDETAIL.set(x.id,x));loadedP.add(fam)}
async function loadExerciseFamily(fam){if(loadedE.has(fam))return;const slug=slugMap[fam];if(!slug)return;const arr=await j(`./data/exercises/${slug}.json`);arr.forEach(x=>EDETAIL.set(x.id,x));loadedE.add(fam)}
async function ensureProgram(id){const p=PDETAIL.get(id)||pIndex.find(x=>x.id===id);if(p&&!PDETAIL.has(id))await loadProgramFamily(p.family);return PDETAIL.get(id)||p}
async function ensureExercise(id){const e=EDETAIL.get(id)||eIndex.find(x=>x.id===id);const fam=e?.uiFamily||e?.universe||e?.family;if(e&&!EDETAIL.has(id))await loadExerciseFamily(fam);return EDETAIL.get(id)||e}
function getProgram(id){return PDETAIL.get(id)||null}function getExercise(id){return EDETAIL.get(id)||null}
window.FTCatalog={init,ensureProgram,ensureExercise,loadProgramFamily,loadExerciseFamily,getProgram,getExercise,meta:()=>meta};})();
