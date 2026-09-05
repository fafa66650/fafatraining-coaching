
import fs from "node:fs";
import {generateSession,generateProgram,generateGroupClass} from "./_engine-test.mjs";
const ex=JSON.parse(fs.readFileSync("../data/exercises.json","utf8"));
const cat=JSON.parse(fs.readFileSync("../data/training-catalog.json","utf8"));
const profile={id:"qa",firstName:"QA",level:"Intermédiaire",duration:45,equipment:["poids du corps","haltères","kettlebell","élastique","rameur","sac"],place:"mixed",injuries:[]};
for(const d of cat.disciplines){
 const s=generateSession({profile,daily:{sleep:3,fatigue:3,stress:3,pain:0},choice:{trainingType:d.id,targets:["full_body"],format:"circuit",duration:45,equipment:profile.equipment,place:"mixed"},exercises:ex,history:[],seed:d.id});
 if(!s.blocks.length||!s.exerciseIds.length)throw new Error("Session vide: "+d.id);
}
const p=generateProgram({profile,choice:{name:"QA Program",weeks:4,sessionsPerWeek:3,trainingType:"musculation",targets:["upper"],formats:["series","superset","pyramid_up"],duration:45,equipment:profile.equipment,place:"mixed"},exercises:ex,history:[]});
if(p.schedule.length!==4||p.schedule.some(w=>w.sessions.length!==3))throw new Error("Programme invalide");
const c=generateGroupClass({choice:{name:"QA Class",participants:15,stations:6,rounds:3,trainingType:"cross_training",targets:["full_body"],format:"stations",duration:45,equipment:["poids du corps","kettlebell","élastique"],equipmentQuantities:{kettlebell:4,"élastique":10},place:"studio"},exercises:ex,seed:"qa"});
if(c.stations.length!==6)throw new Error("Cours collectif invalide");
console.log("ENGINE QA OK",cat.disciplines.length,"disciplines",p.schedule.length,"weeks",c.stations.length,"stations");
