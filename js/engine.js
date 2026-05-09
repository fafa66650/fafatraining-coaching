
const RealCoachEngine = (() => {
const GOALS = {
  musculation:["Musculation","Construire force et masse utile.",["haut_du_corps","bas_du_corps","core"],["Force","Charge","Repos","Tempo"]],
  force:["Force","Développer la force avec charges lourdes et récupération longue.",["haut_du_corps","bas_du_corps","core"],["Lourd","RPE","Repos","Technique"]],
  hypertrophie:["Prise de masse","Augmenter le volume musculaire avec séries contrôlées.",["haut_du_corps","bas_du_corps","core"],["Volume","8-12","Tempo","Charge"]],
  perte_gras:["Perte de poids","Augmenter la dépense sans casser la technique.",["cardio","bas_du_corps","haut_du_corps","core"],["Cardio","Circuit","Rythme","Calories"]],
  full:["Full Body","Travailler tout le corps en séance équilibrée.",["haut_du_corps","bas_du_corps","core","cardio"],["Complet","Énergie","Core","Mental"]],
  hiit:["HIIT","Intervalles courts, intensité et souffle.",["cardio","bas_du_corps","haut_du_corps","core"],["Intensité","Chrono","Cardio","Impact"]],
  circuit:["Circuit Training","Ateliers, tours et récupération maîtrisée.",["cardio","haut_du_corps","bas_du_corps","core"],["Tours","Ateliers","Rythme","Groupe"]],
  boxe:["Boxe","Technique, appuis, rounds, cardio et gainage.",["boxe","cardio","core","haut_du_corps","bas_du_corps"],["Rounds","Appuis","Garde","Mental"]],
  cardio_boxing:["Cardio Boxing","Boxe fitness, rythme et dépense énergétique.",["boxe","cardio","core"],["Boxing","Rythme","Cardio","Fun"]],
  crossfit:["CrossFit","WOD clair : AMRAP, EMOM, For Time ou Skill.",["cardio","bas_du_corps","haut_du_corps","core"],["WOD","AMRAP","EMOM","For Time"]],
  hyrox:["Hyrox","Stations, course, portés, ergos et transitions.",["cardio","bas_du_corps","core","haut_du_corps"],["Stations","Carries","Erg","Endurance"]],
  explosivite:["Explosivité","Vitesse, puissance, appuis et réactivité.",["cardio","bas_du_corps","haut_du_corps","core"],["Puissance","Vitesse","Appuis","Repos"]],
  mobilite:["Mobilité","Amplitude, respiration, souplesse et récupération.",["mobilite","reeducation","core"],["Souplesse","Respiration","Amplitude","Calme"]],
  prevention:["Prévention","Protéger articulations, dos, épaules, genoux.",["reeducation","mobilite","core"],["Sécurité","Contrôle","Activation","Récup"]],
  recovery:["Recovery","Récupérer, respirer, relâcher et rééquilibrer.",["mobilite","reeducation"],["Calme","Respiration","Relâchement","Douleur 0"]],
  senior:["Sport santé","Bouger en sécurité, posture, souffle, autonomie.",["reeducation","mobilite","core","bas_du_corps"],["Santé","Sécurité","Progressif","Stable"]],
  outdoor:["Outdoor","Séance terrain avec peu de matériel.",["cardio","bas_du_corps","core","haut_du_corps"],["Terrain","Simple","Course","Renfo"]]
};
const STYLES = {
  musculation:[["global","Global","haut/bas/core"],["haut","Haut du corps","push/pull"],["bas","Bas du corps","jambes"],["split","Split","muscle ciblé"]],
  force:[["force_pure","Force pure","3-6 reps"],["force_tech","Force technique","charge propre"],["lower_strength","Force jambes","squat/hinge"],["upper_strength","Force haut","push/pull"]],
  hypertrophie:[["volume","Volume","8-12 reps"],["tempo","Tempo","contrôle"],["pump","Pump","densité"],["full_muscle","Full muscle","équilibré"]],
  perte_gras:[["circuit","Circuit","densité"],["hiit_low","HIIT adapté","impact modéré"],["cardio_renfo","Cardio+renfo","mix"],["boxing_burn","Boxing burn","boxe cardio"]],
  full:[["equilibre","Équilibré","global"],["cardio_renfo","Cardio+renfo","mix"],["force_full","Force complète","charges"],["terrain","Terrain","extérieur"]],
  hiit:[["tabata","Tabata","20/10"],["interval","40/20","chrono"],["low_impact","Sans impact","débutant"],["boxing","Cardio boxing","rythme"]],
  circuit:[["tours","Tours","3-5 tours"],["stations","Stations","ateliers"],["groupe","Groupe","équipes"],["cardio","Cardio mix","alternance"]],
  boxe:[["pure","Boxe pure","rounds"],["sac","Travail sac","impact"],["renfo","Boxe + renfo","mix"],["appuis","Appuis défense","technique"],["pro","Boxeur pro","3 min"]],
  cardio_boxing:[["fitness","Fitness","rythme"],["30_30","30/30","intervalles"],["coordination","Coordination","enchaînements"],["burn","Burn","dépense"]],
  crossfit:[["wod","WOD","complet"],["amrap","AMRAP","max tours"],["emom","EMOM","minute"],["fortime","For Time","chrono"],["skill","Skill","technique"]],
  hyrox:[["stations","Stations","course+atelier"],["carries","Carries","portés"],["erg","Erg","rameur/skierg"],["simulation","Simulation","format"]],
  explosivite:[["vitesse","Vitesse","appuis"],["puissance","Puissance","sauts"],["reactivite","Réactivité","changements"],["athlete","Athlète","haut niveau"]],
  mobilite:[["bas","Bas du corps","hanches"],["haut","Haut du corps","épaules"],["colonne","Colonne","dos"],["respiration","Respiration","calme"]],
  prevention:[["epaule","Épaules","coiffe"],["genou","Genoux","contrôle"],["dos","Dos","gainage"],["cheville","Chevilles","stabilité"]],
  recovery:[["relax","Relax","calme"],["respiration","Respiration","nerveux"],["deverrouillage","Déverrouillage","global"],["douce","Douce","sans douleur"]],
  senior:[["mobilite","Mobilité","sécurité"],["renfo_doux","Renfo doux","autonomie"],["equilibre","Équilibre","prévention"],["souffle","Souffle","cardio doux"]],
  outdoor:[["terrain","Terrain","course+renfo"],["parc","Parc","banc/sol"],["groupe","Groupe","ateliers"],["endurance","Endurance","long"]]
};
const BLOCKS = [
  ["warmup","Échauffement","Préparer le corps sans fatigue.","🔥"],
  ["skill","Technique","Apprendre le geste clé du jour.","🎯"],
  ["main","Bloc principal","Travailler l’objectif central.","⚡"],
  ["support","Renfort utile","Corriger, stabiliser, protéger.","🛡️"],
  ["finish","Finisher / Retour","Finir propre ou récupérer.","🌙"]
];
function profile(){try{return JSON.parse(localStorage.getItem("fafa73_profile")||"{}")}catch(e){return{}}}
function saveProfile(p){localStorage.setItem("fafa73_profile",JSON.stringify(p||{}))}
function history(){try{return JSON.parse(localStorage.getItem("fafa73_history")||"[]")}catch(e){return[]}}
function saveSession(s){let h=history();h.unshift({id:s.id,date:s.date,title:s.title,goal:s.meta.goal,duration:s.meta.duration,bmi:s.bmi?.value||null});localStorage.setItem("fafa73_history",JSON.stringify(h.slice(0,80)))}
function bmi(weight,height){
  let w=Number(weight), h=Number(height)/100;
  if(!w||!h)return {value:null,label:"IMC non renseigné",note:"Ajoute taille et poids pour personnaliser."};
  let v=w/(h*h), label="Corpulence normale", note="À nuancer selon masse musculaire et pratique sportive.";
  if(v<18.5){label="IMC bas";note="Objectif prioritaire : force, masse utile, alimentation adaptée."}
  else if(v<25){label="IMC normal";note="Bonne base. La composition corporelle reste plus importante que le chiffre seul."}
  else if(v<30){label="Surpoids";note="À nuancer si sportif/musclé. Privilégier régularité, cardio progressif et renforcement."}
  else {label="IMC élevé";note="Progressivité, faible impact et avis médical si reprise ou douleur."}
  return {value:Math.round(v*10)/10,label,note};
}
function prescription(goal,style,level){
  let hard= level==="expert"||level==="avance";
  if(goal==="force")return {sets: hard?"5":"4", reps:"3-6", rest:"2-3 min", load:"lourd · RPE 8", tempo:"contrôlé", intensity:"haute"};
  if(goal==="hypertrophie"||goal==="musculation")return {sets:"3-4", reps:"8-12", rest:"60-90 sec", load:"modéré · RPE 7-8", tempo:"2-0-2", intensity:"moyenne+"};
  if(goal==="perte_gras"||goal==="hiit")return {sets:"3-5 tours", reps: style==="tabata"?"20/10":"30-45 sec", rest:"30-60 sec", load:"léger à modéré", tempo:"rythme propre", intensity:"progressive"};
  if(goal==="boxe")return {sets: hard?"5 rounds":"3-4 rounds", reps: hard?"3 min":"2 min", rest:"1 min", load:"poids du corps/sac", tempo:"garde + appuis", intensity:"technique puis cardio"};
  if(goal==="cardio_boxing")return {sets:"4-6 rounds", reps:"45 sec", rest:"20-30 sec", load:"poids du corps", tempo:"rythmé", intensity:"cardio"};
  if(goal==="crossfit")return {sets: style==="emom"?"EMOM 12":"AMRAP 12-16", reps:"8-15 reps", rest:"selon format", load:"adaptée technique", tempo:"constant", intensity:"haute mais propre"};
  if(goal==="hyrox")return {sets:"4 stations", reps:"500m/40-60 sec", rest:"60 sec", load:"modéré", tempo:"endurance force", intensity:"soutenue"};
  if(goal==="explosivite")return {sets:"4-6", reps:"3-6 reps", rest:"60-120 sec", load:"léger/modéré explosif", tempo:"vitesse", intensity:"nerveuse"};
  if(goal==="mobilite"||goal==="recovery")return {sets:"2-3 tours", reps:"45-60 sec", rest:"respiration", load:"sans charge", tempo:"lent", intensity:"douce"};
  if(goal==="prevention"||goal==="senior")return {sets:"2-3", reps:"8-15 reps", rest:"45-60 sec", load:"léger", tempo:"contrôle", intensity:"sécurisée"};
  return {sets:"3-4 tours", reps:"10-15 reps", rest:"45-60 sec", load:"modérée", tempo:"propre", intensity:"moyenne"};
}
function calories(duration,weight,goal){
  let w=Number(weight)||75, d=Number(duration)||30;
  let met={mobilite:2.5,recovery:2.2,prevention:3,senior:3.2,force:5,musculation:5.5,hypertrophie:5.5,boxe:8,cardio_boxing:8.5,hiit:9,crossfit:9,hyrox:8.5,perte_gras:7,circuit:7,full:6,outdoor:6,explosivite:6.5}[goal]||6;
  return Math.round((met*3.5*w/200)*d);
}
function allowed(goal,block){
  if(block==="warmup")return ["mobilite","reeducation","cardio","boxe"];
  if(block==="skill"){
    if(goal==="boxe"||goal==="cardio_boxing")return ["boxe"];
    if(goal==="mobilite"||goal==="recovery")return ["mobilite"];
    if(goal==="prevention"||goal==="senior")return ["reeducation","mobilite"];
    return ["core","mobilite","haut_du_corps","bas_du_corps"];
  }
  if(goal==="mobilite"||goal==="recovery")return ["mobilite","reeducation"];
  if(goal==="prevention"||goal==="senior")return ["reeducation","mobilite","core","bas_du_corps"];
  if(goal==="boxe"||goal==="cardio_boxing")return block==="main"?["boxe","cardio"]:["boxe","cardio","core","reeducation"];
  if(block==="support")return ["core","reeducation","mobilite","haut_du_corps","bas_du_corps"];
  if(block==="finish")return goal==="force"||goal==="hypertrophie"?["core","mobilite"]:["cardio","boxe","core","mobilite"];
  return GOALS[goal]?.[2]||GOALS.full[2];
}
function eqOk(e,eq){
  if(!eq||!eq.length)return true;
  let q=e.equipment||[];
  if(q.includes("poids du corps"))return true;
  return eq.some(x=>q.includes(x));
}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function score(e,cfg,block,used){
  let s=0, groups=allowed(cfg.goal,block), obj=e.objectives||[];
  if(groups.includes(e.group))s+=45;
  if(used.has(e.id))s-=140;
  if(!eqOk(e,cfg.equipment))s-=20;
  if(cfg.injury && (e.contraindications||[]).includes(cfg.injury))s-=120;
  if(obj.includes(cfg.goal))s+=20;
  if(cfg.style && obj.includes(cfg.style))s+=10;
  if(Number(cfg.age)>60 && ["reeducation","mobilite","core"].includes(e.group))s+=12;
  if(Number(cfg.age)<15 && ["reeducation","mobilite","core","boxe"].includes(e.group))s+=8;
  if(Number(cfg.fatigue)>=4 && e.group==="cardio")s-=10;
  if(Number(cfg.stress)>=4 && ["mobilite","reeducation"].includes(e.group))s+=12;
  if(cfg.place==="salle" && (e.equipment||[]).some(x=>["machine","poulie","barre","haltères"].includes(x)))s+=8;
  if(cfg.place==="exterieur" && (e.equipment||[]).some(x=>["poids du corps","cônes","extérieur"].includes(x)))s+=8;
  return s;
}
function blockCount(block,duration,goal,fatigue){
  let d=Number(duration)||30;
  let c=block==="main"?(d<=20?3:4):block==="warmup"?(d<=20?2:3):block==="skill"?(d<=20?1:2):block==="support"?(d<=20?2:3):2;
  if(goal==="mobilite"||goal==="recovery"){ if(block==="skill")c=1; if(block==="main")c=4; if(block==="finish")c=1; }
  if(Number(fatigue)>=4 && c>2)c-=1;
  return c;
}
function pick(exs,cfg,block,used,pres){
  let n=blockCount(block,cfg.duration,cfg.goal,cfg.fatigue);
  let list=shuffle(exs).map(e=>({e,s:score(e,cfg,block,used)})).filter(x=>x.s>-40).sort((a,b)=>b.s-a.s).map(x=>x.e);
  if(list.length<n)list=shuffle(exs).filter(e=>!used.has(e.id));
  let out=list.slice(0,n); out.forEach(e=>used.add(e.id));
  return out.map((e,i)=>adapt(e,cfg,block,i,pres));
}
function adapt(e,cfg,block,i,pres){
  let lvl=cfg.level==="auto"?"intermediaire":cfg.level;
  let rx = block==="warmup" ? "30-45 sec" : block==="skill" ? "2 séries techniques" : block==="main" ? `${pres.sets} · ${pres.reps}` : block==="support" ? "2-3 séries · contrôle" : (cfg.goal==="mobilite"||cfg.goal==="recovery"?"45-60 sec":"30-45 sec");
  return {...e, displayName:e.name, instruction:e.levels?.[lvl]||e.levels?.intermediaire||e.name, prescription:rx, load:pres.load, rest:pres.rest, tempo:pres.tempo};
}
function info(cfg,block,items,pres){
  let d=Number(cfg.duration)||30, map={warmup:0.16,skill:0.12,main:0.42,support:0.20,finish:0.10}, mins=Math.max(2,Math.round(d*(map[block]||0.2)));
  if(block==="main")return {format:pres.sets, structure:`${mins} min`, work:pres.reps, rest:pres.rest, load:pres.load, tempo:pres.tempo};
  if(block==="warmup")return {format:"Activation", structure:`${mins} min`, work:"30-45 sec", rest:"court", load:"sans ego", tempo:"progressif"};
  if(block==="skill")return {format:"Technique", structure:`${mins} min`, work:"2 passages", rest:"qualité", load:"léger", tempo:"apprentissage"};
  if(block==="support")return {format:"Renfort", structure:`${mins} min`, work:"contrôle", rest:"45 sec", load:"léger/modéré", tempo:"propre"};
  return {format:"Final", structure:`${mins} min`, work:"court", rest:"adapté", load:"adapté", tempo:"fin propre"};
}
function adaptation(cfg,b){
  let a=[];
  if(cfg.age)a.push(`${cfg.age} ans`);
  if(b.value)a.push(`IMC ${b.value} : ${b.label}`);
  if(cfg.injury)a.push(`zone à protéger : ${cfg.injury}`);
  if(Number(cfg.fatigue)>=4)a.push("fatigue élevée : volume réduit");
  if(Number(cfg.stress)>=4)a.push("stress élevé : respiration renforcée");
  if(!a.length)a.push("profil standard : séance équilibrée");
  return a.join(" · ");
}
function generate(cfg,exs){
  cfg={goal:"full",style:"equilibre",level:"auto",duration:30,equipment:["poids du corps"],age:"",height:"",weight:"",sex:"",fatigue:3,stress:3,recovery:3,injury:"",place:"choisir",people:1,...cfg};
  let b=bmi(cfg.weight,cfg.height), pres=prescription(cfg.goal,cfg.style,cfg.level), g=GOALS[cfg.goal]||GOALS.full;
  let s={id:Date.now(),date:new Date().toISOString(),title:g[0],objective:g[1],badges:g[3],bmi:b,prescription:pres,calories:calories(cfg.duration,cfg.weight,cfg.goal),adaptation:adaptation(cfg,b),meta:cfg,blocks:{},infos:{}};
  let used=new Set();
  BLOCKS.forEach(bl=>{s.blocks[bl[0]]=pick(exs,cfg,bl[0],used,pres);s.infos[bl[0]]=info(cfg,bl[0],s.blocks[bl[0]],pres)});
  return s;
}
return {GOALS,STYLES,BLOCKS,profile,saveProfile,history,saveSession,bmi,prescription,generate};
})();
