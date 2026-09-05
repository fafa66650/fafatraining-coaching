import fs from 'node:fs';
import {generateSession,bmi,progressStats} from '../src/coach-engine.js';

const required=['index.html','styles/app.css','src/app.js','src/storage.js','src/coach-engine.js','data/exercises.json','data/programs.json','manifest.json','service-worker.js'];
for(const f of required){if(!fs.existsSync(f)) throw new Error('Fichier manquant: '+f)}

const ex=JSON.parse(fs.readFileSync('data/exercises.json','utf8'));
const programs=JSON.parse(fs.readFileSync('data/programs.json','utf8'));
const ids=new Set(),names=new Set();
for(const e of ex){
  if(!e.id||!e.name||!e.family||!e.group||!e.mode||!Array.isArray(e.equipment)||!Array.isArray(e.variants)) throw new Error('Exercice incomplet: '+e.name);
  if(ids.has(e.id)) throw new Error('ID doublon: '+e.id); ids.add(e.id);
  const n=e.name.toLowerCase(); if(names.has(n)) throw new Error('Nom doublon: '+e.name); names.add(n);
  if(/\b(Pro|Elite)\s*\d+\b/i.test(e.name)) throw new Error('Exercice artificiel détecté: '+e.name);
}
if(ex.length<400) throw new Error('Bibliothèque trop petite: '+ex.length);
if(programs.length<15) throw new Error('Univers insuffisants: '+programs.length);
for(const p of programs){if(!fs.existsSync('assets/visuals/'+p.visual)) throw new Error('Visuel manquant: '+p.visual)}

const allEquipment=[...new Set(ex.flatMap(e=>e.equipment))];
const athlete={id:'qa',firstName:'QA',age:34,height:178,weight:78,primaryGoal:'remise_en_forme',secondaryGoal:'progression',level:'Intermédiaire',duration:30,equipment:allEquipment,injuries:[]};
const daily={fatigue:3,stress:3,sleep:4,pain:0};
for(const p of programs){
  const session=generateSession({athlete,daily,choice:{goal:p.goal,style:'standard',duration:30,equipment:allEquipment},exercises:ex,history:[]});
  if(!session.blocks?.length || session.blocks.length!==5) throw new Error('Structure invalide: '+p.goal);
  if(session.blocks.some(b=>!b.exercises.length)) throw new Error('Bloc vide: '+p.goal);
  const sx=session.blocks.flatMap(b=>b.exercises);
  if(new Set(sx.map(e=>e.id)).size!==sx.length) throw new Error('Doublon dans séance: '+p.goal);
  if(sx.some(e=>!e.prescription?.rest || e.prescription?.rpe==null)) throw new Error('Prescription incomplète: '+p.goal);
}
const b=bmi(80,180); if(b.value!==24.7) throw new Error('IMC incorrect: '+b.value);
const stats=progressStats([]); if(stats.completed!==0) throw new Error('Stats initiales incorrectes');
console.log(`QA V80 OK — ${ex.length} exercices uniques, ${programs.length} univers, génération validée pour chaque univers.`);
