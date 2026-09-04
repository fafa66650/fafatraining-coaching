
import fs from "node:fs";
const req=["index.html","styles/app.css","src/app.js","src/storage.js","src/coach-engine.js","data/exercises.json","data/programs.json","manifest.json","service-worker.js"];
for(const f of req){if(!fs.existsSync(f))throw new Error("Fichier manquant: "+f)}
const ex=JSON.parse(fs.readFileSync("data/exercises.json","utf8"));
const ids=new Set(),names=new Set();
for(const e of ex){
  if(!e.id||!e.name||!e.family||!e.group||!e.mode)throw new Error("Exercice incomplet: "+JSON.stringify(e));
  if(ids.has(e.id))throw new Error("ID doublon: "+e.id);ids.add(e.id);
  const n=e.name.toLowerCase();if(names.has(n))throw new Error("Nom doublon: "+e.name);names.add(n);
}
if(ex.length<400)throw new Error("Bibliothèque trop petite: "+ex.length);
const programs=JSON.parse(fs.readFileSync("data/programs.json","utf8"));
if(programs.length<12)throw new Error("Programmes insuffisants");
console.log(`QA OK — ${ex.length} exercices uniques, ${programs.length} univers.`);
