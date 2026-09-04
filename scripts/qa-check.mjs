import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const required=['index.html','styles/app.css','src/app.js','src/core/storage.js','src/services/coach-engine.js','src/components/ui.js','data/exercises.json','data/programs.json','manifest.json','service-worker.js','assets/logo/logo-fafatraining.jpg'];
let errors=[];
for(const f of required){if(!fs.existsSync(path.join(root,f)))errors.push(`Fichier manquant: ${f}`)}
const ex=JSON.parse(fs.readFileSync(path.join(root,'data/exercises.json'),'utf8'));
const pr=JSON.parse(fs.readFileSync(path.join(root,'data/programs.json'),'utf8'));
if(ex.length<250)errors.push(`Bibliothèque trop petite: ${ex.length}`);
const ids=new Set(),names=new Set();
for(const [i,e] of ex.entries()){
  for(const k of ['id','name','group','pattern','equipment','cues','error','variants','goals']) if(e[k]===undefined)errors.push(`Exercice ${i} champ manquant: ${k}`);
  if(ids.has(e.id))errors.push(`ID exercice dupliqué: ${e.id}`); ids.add(e.id);
  const n=e.name.toLowerCase(); if(names.has(n))errors.push(`Nom exercice dupliqué: ${e.name}`); names.add(n);
  if(/\bPro\s*\d+\b/i.test(e.name))errors.push(`Nom générique interdit: ${e.name}`);
}
if(pr.length<10)errors.push('Programmes insuffisants');
if(errors.length){console.error('\nQA FAILED\n'+errors.join('\n'));process.exit(1)}
console.log(`QA OK — ${ex.length} exercices uniques, ${pr.length} programmes, fichiers critiques présents.`);
