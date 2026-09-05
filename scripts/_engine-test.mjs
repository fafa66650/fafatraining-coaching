
const GOAL_MUSCLES={
  full_body:[],upper:["pectoraux","dos","épaules","biceps","triceps","haut du dos","grand dorsal"],
  lower:["quadriceps","fessiers","ischios","mollets","adducteurs"],chest:["pectoraux","haut pectoraux","bas pectoraux"],
  back:["dos","grand dorsal","haut du dos","trapèzes"],shoulders:["épaules","deltoïde moyen","arrière épaule"],
  arms:["biceps","triceps","avant-bras"],biceps:["biceps","brachial"],triceps:["triceps"],
  glutes:["fessiers","moyen fessier"],abs:["abdos","obliques","core"],legs:["quadriceps","fessiers","ischios","mollets"],
  quads:["quadriceps"],hamstrings:["ischios"],calves:["mollets","soléaire"]
};
const LEVEL_RANK={Débutant:0,Intermédiaire:1,Avancé:2};

function bmi(weightKg,heightCm){
 const w=Number(weightKg),h=Number(heightCm)/100;
 if(!w||!h)return{value:null,label:"Non calculé"};
 const v=Math.round((w/(h*h))*10)/10;
 return{value:v,label:v<18.5?"IMC bas":v<25?"Zone habituelle":v<30?"IMC élevé":"IMC très élevé"};
}
function readiness(profile,daily={}){
 let s=78;
 s+=(Number(daily.sleep??3)-3)*7;
 s-=(Number(daily.fatigue??3)-3)*8;
 s-=(Number(daily.stress??3)-3)*5;
 s-=Number(daily.pain??0)*8;
 return Math.max(25,Math.min(100,Math.round(s)));
}
function e1rm(weight,reps){weight=Number(weight);reps=Number(reps);return weight&&reps?Math.round(weight*(1+reps/30)*10)/10:null}
function progressStats(history){
 const done=(history||[]).filter(x=>x.completedAt);
 const logs=done.flatMap(x=>x.logs||[]);
 return{
  completed:done.length,
  totalMinutes:done.reduce((a,x)=>a+Number(x.duration||0),0),
  volume:Math.round(logs.reduce((a,x)=>a+(Number(x.weight)||0)*(Number(x.reps)||0)*(Number(x.sets)||1),0)),
  best1rm:Math.round(logs.reduce((m,x)=>Math.max(m,e1rm(x.weight,x.reps)||0),0)*10)/10
 };
}
function lastLoad(history,id){
 const logs=(history||[]).flatMap(s=>s.logs||[]).filter(l=>l.exerciseId===id&&Number(l.weight)>0);
 if(!logs.length)return null;
 const x=logs[0],w=Number(x.weight),rpe=Number(x.rpe||7);
 return Math.max(0,Math.round((rpe<=6.5?w*1.025:rpe>=9?w*.975:w)*2)/2);
}
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededSort(items,seed){return [...items].sort((a,b)=>(hash(seed+a.id)%100000)-(hash(seed+b.id)%100000))}
function equipmentOK(e,selected=[]){
 if(!selected.length)return true;
 const eq=e.equipment||[];
 if(eq.includes("poids du corps"))return true;
 return eq.some(x=>selected.includes(x));
}
function placeOK(e,place){
 if(!place||place==="mixed"||place==="Mixte / Peu importe")return true;
 const map={home:"Maison",gym:"Salle de musculation",outdoor:"Extérieur / Parc",track:"Piste / Terrain",studio:"Gymnase / Studio",boxing:"Espace boxe / Dojo"};
 const p=map[place]||place;
 return (e.places||[]).includes(p)||(e.places||[]).includes("Mixte / Peu importe");
}
function typeOK(e,type){
 if(!type)return true;
 return (e.trainingTypes||[]).includes(type) ||
   ({musculation:"Musculation",boxe:"Boxe",running:"Course / Trail",trail:"Course / Trail",aerobic:"Aérobic",hyrox:"Hyrox",cross_training:"Cross training"}[type]===e.family);
}
function targetScore(e,targets=[]){
 if(!targets.length||targets.includes("full_body"))return 8;
 const desired=targets.flatMap(t=>GOAL_MUSCLES[t]||[t]);
 const text=(e.muscles||[]).join(" ").toLowerCase();
 return desired.reduce((s,m)=>s+(text.includes(String(m).toLowerCase())?18:0),0);
}
function injuryPenalty(e,injuries=[]){
 const t=`${e.name} ${e.pattern} ${(e.muscles||[]).join(" ")}`.toLowerCase();let p=0;
 for(const x0 of injuries||[]){const x=x0.toLowerCase();
  if(x.includes("genou")&&/squat|lunge|fente|jump|sprint|côte|presse/.test(t))p+=35;
  if(x.includes("épaule")&&/press|pompe|push|boxe|traction|dip|shoulder/.test(t))p+=35;
  if((x.includes("dos")||x.includes("lomb"))&&/deadlift|hinge|soulevé|row|good morning/.test(t))p+=35;
  if(x.includes("cheville")&&/run|course|jump|saut|côte|mollet/.test(t))p+=30;
 }
 return p;
}
function prescription(e,level,format,ready,block="main"){
 let rpe=level==="Débutant"?6:level==="Intermédiaire"?7:8;
 if(ready<55)rpe-=1;if(ready>88)rpe+=.5;rpe=Math.max(4,Math.min(9,Math.round(rpe*10)/10));
 if(block==="warmup")return{sets:1,reps:e.mode==="time"?"30–45 s":"8–10",rest:"15–20 s",rpe:4,tempo:"progressif"};
 if(block==="cooldown")return{sets:1,reps:e.mode==="time"?"45–60 s":"6–8",rest:"respiration",rpe:3,tempo:"lent"};
 if(e.family==="Boxe"||e.mode==="rounds")return{sets:level==="Débutant"?3:level==="Intermédiaire"?4:6,reps:level==="Débutant"?"2 min":"3 min",rest:"60 s",rpe,tempo:"garde + appuis"};
 if(e.family==="Course / Trail"){
  if(e.mode==="distance")return{sets:format==="intervals"?6:3,reps:level==="Débutant"?"200–400 m":level==="Intermédiaire"?"400–800 m":"400–1200 m",rest:"60–120 s",rpe,tempo:"allure ciblée"};
  return{sets:1,reps:"bloc chronométré",rest:"selon format",rpe,tempo:"allure régulière"};
 }
 if(format==="tabata")return{sets:8,reps:"20 s",rest:"10 s",rpe,tempo:"rythmé"};
 if(format==="emom")return{sets:10,reps:"travail/minute",rest:"temps restant",rpe,tempo:"constant"};
 if(format==="amrap")return{sets:1,reps:"AMRAP 10–18 min",rest:"auto-régulé",rpe,tempo:"durable"};
 if(format==="for_time")return{sets:1,reps:"travail total",rest:"minimum utile",rpe,tempo:"efficace"};
 if(format==="rounds")return{sets:level==="Débutant"?3:5,reps:"2–3 min",rest:"60 s",rpe,tempo:"constant"};
 if(e.mode==="time")return{sets:3,reps:level==="Débutant"?"20–30 s":"30–45 s",rest:"30–60 s",rpe,tempo:"contrôlé"};
 if(e.mode==="distance")return{sets:3,reps:"20–40 m",rest:"45–75 s",rpe,tempo:"stable"};
 if(format==="pyramid_up")return{sets:4,reps:"6 / 8 / 10 / 12",rest:"60–90 s",rpe,tempo:"contrôlé"};
 if(format==="pyramid_down")return{sets:4,reps:"12 / 10 / 8 / 6",rest:"60–90 s",rpe,tempo:"contrôlé"};
 if(format==="pyramid_full")return{sets:7,reps:"4-6-8-10-8-6-4",rest:"45–75 s",rpe,tempo:"propre"};
 if(format==="superset")return{sets:3,reps:"8–12",rest:"60–75 s après le duo",rpe,tempo:"2-0-2"};
 if(format==="drop_set")return{sets:3,reps:"8–12 + baisse de charge",rest:"90 s",rpe,tempo:"contrôlé"};
 if(format==="rest_pause")return{sets:3,reps:"8–12 + mini-pause",rest:"90 s",rpe,tempo:"contrôlé"};
 return{sets:level==="Débutant"?2:level==="Intermédiaire"?3:4,reps:level==="Débutant"?"10–15":level==="Intermédiaire"?"8–12":"5–10",rest:level==="Avancé"?"75–120 s":"45–90 s",rpe,tempo:format==="tempo"?"3-1-1":"2-0-2"};
}
function blockPlan(duration,type,format){
 const d=Number(duration)||45;
 if(type==="boxe"||type==="cardio_boxing")return[
  ["warmup","Échauffement",Math.round(d*.15),2],["skill","Technique / appuis",Math.round(d*.22),2],
  ["main","Rounds principaux",Math.round(d*.43),4],["support","Conditionnement",Math.round(d*.12),2],["cooldown","Retour au calme",Math.round(d*.08),1]
 ];
 if(type==="running"||type==="trail")return[
  ["warmup","Mise en route",Math.round(d*.18),2],["skill","Éducatifs",Math.round(d*.12),2],
  ["main","Bloc course",Math.round(d*.55),3],["cooldown","Retour au calme",Math.round(d*.15),2]
 ];
 if(type==="mobilite"||type==="recovery"||type==="souplesse")return[
  ["warmup","Respiration / mise en route",Math.round(d*.15),1],["main","Flow principal",Math.round(d*.65),5],["cooldown","Relâchement",Math.round(d*.20),2]
 ];
 return[
  ["warmup","Échauffement",Math.round(d*.14),2],["skill","Préparation spécifique",Math.round(d*.12),1],
  ["main","Bloc principal",Math.round(d*.48),d<=30?4:5],["support","Complément / finisher",Math.round(d*.18),2],["cooldown","Retour au calme",Math.round(d*.08),1]
 ];
}
function scoreExercise(e,cfg,block,recent,used){
 let s=0;
 if(typeOK(e,cfg.trainingType))s+=60;else s-=20;
 if(equipmentOK(e,cfg.equipment))s+=35;else s-=75;
 if(placeOK(e,cfg.place))s+=25;else s-=40;
 s+=targetScore(e,cfg.targets);
 const er=LEVEL_RANK[e.level3]??1,lr=LEVEL_RANK[cfg.level]??1;
 s-=Math.abs(er-lr)*8;
 if(block==="warmup"&&["Mobilité","Prévention","Cardio"].includes(e.family))s+=24;
 if(block==="cooldown"&&["Mobilité","Récupération","Prévention"].includes(e.family))s+=40;
 if(block==="skill"&&["Boxe","Prévention","Mobilité","Poids du corps / Renfo"].includes(e.family))s+=15;
 if(recent.has(e.id))s-=28;if(used.has(e.id))s-=180;
 s-=injuryPenalty(e,cfg.injuries);
 if(cfg.readiness<60&&e.lowImpact)s+=16;
 return s;
}
function choose(exercises,cfg,block,count,recent,used,seed){
 const scored=exercises.map(e=>({e,s:scoreExercise(e,cfg,block,recent,used)})).filter(x=>x.s>-10);
 const best=scored.sort((a,b)=>b.s-a.s).slice(0,Math.max(20,count*6)).map(x=>x.e);
 const pool=seededSort(best,seed+block);
 const out=[];
 for(const e of pool){if(out.length>=count)break;if(!used.has(e.id)){out.push(e);used.add(e.id)}}
 return out;
}
export function generateSession({profile,daily={},choice={},exercises,history=[],seed=""}){
 const cfg={
  level:choice.level||profile?.level||"Débutant",trainingType:choice.trainingType||"functional",
  targets:choice.targets?.length?choice.targets:["full_body"],format:choice.format||"series",
  duration:Number(choice.duration||profile?.duration||45),equipment:choice.equipment||profile?.equipment||[],
  place:choice.place||profile?.place||"mixed",injuries:profile?.injuries||[],readiness:readiness(profile||{},daily)
 };
 const recent=new Set((history||[]).slice(0,8).flatMap(s=>s.exerciseIds||[])),used=new Set();
 const blocks=blockPlan(cfg.duration,cfg.trainingType,cfg.format).map(([key,label,minutes,count],bi)=>{
  const selected=choose(exercises,cfg,key,count,recent,used,`${seed}|${Date.now()}|${bi}`);
  return{key,label,minutes,exercises:selected.map(e=>({...e,prescription:prescription(e,cfg.level,cfg.format,cfg.readiness,key),suggestedLoad:lastLoad(history,e.id)}))};
 });
 return{
  id:`session_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,date:new Date().toISOString(),
  athleteId:profile?.id||"free",clientName:profile?.firstName||"Séance libre",
  title:choice.title||"Séance FAFATRAINING",trainingType:cfg.trainingType,targets:cfg.targets,format:cfg.format,
  duration:cfg.duration,readiness:cfg.readiness,level:cfg.level,equipment:cfg.equipment,place:cfg.place,
  blocks,exerciseIds:blocks.flatMap(b=>b.exercises.map(e=>e.id)),logs:[],
  coachNote:cfg.readiness<55?"Volume réduit aujourd’hui : technique, faible impact et récupération prioritaires.":cfg.readiness>88?"Très bonne disponibilité : vise le haut des fourchettes en gardant une exécution propre.":"Séance équilibrée selon le profil et l’état du jour."
 };
}
export function generateProgram({profile,choice,exercises,history=[]}){
 const weeks=Math.max(2,Math.min(26,Number(choice.weeks)||4)),perWeek=Math.max(1,Math.min(6,Number(choice.sessionsPerWeek)||3));
 const plan={id:`program_${Date.now()}`,date:new Date().toISOString(),athleteId:profile.id,name:choice.name||`Programme ${weeks} semaines`,weeks,perWeek,choice,schedule:[]};
 let virtualHistory=[...history];
 for(let w=1;w<=weeks;w++){
  const phase=w===1?"Mise en route":w===weeks?"Bilan / consolidation":(w%4===0?"Semaine allégée":"Progression");
  const week={number:w,phase,sessions:[]};
  for(let d=1;d<=perWeek;d++){
   const formats=choice.formats?.length?choice.formats:[choice.format||"series"];
   const format=formats[(w+d-2)%formats.length];
   const seed=`${profile.id}-${w}-${d}-${format}`;
   const daily={sleep:3,fatigue:(w%4===0?4:3),stress:3,pain:0};
   const session=generateSession({profile,daily,choice:{...choice,format,duration:choice.duration||profile.duration||45,title:`S${w}.${d} · ${phase}`},exercises,history:virtualHistory,seed});
   session.week=w;session.day=d;session.phase=phase;
   week.sessions.push(session);virtualHistory.unshift(session);
  }
  plan.schedule.push(week);
 }
 return plan;
}
export function generateGroupClass({choice,exercises,seed=""}){
 const participants=Math.max(2,Math.min(50,Number(choice.participants)||10));
 const stations=Math.max(3,Math.min(12,Number(choice.stations)||Math.min(6,Math.ceil(participants/2))));
 const profile={id:"group",firstName:"Cours collectif",level:choice.level||"Intermédiaire",equipment:choice.equipment||[],place:choice.place||"studio",injuries:[]};
 const base=generateSession({profile,daily:{sleep:3,fatigue:3,stress:3,pain:0},choice:{...choice,duration:choice.duration||45,format:choice.format||"stations"},exercises,history:[],seed:`group-${seed}-${Date.now()}`});
 let all=base.blocks.flatMap(b=>b.exercises);
 if(all.length<stations)all=[...all,...seededSort(exercises.filter(e=>equipmentOK(e,choice.equipment||[])&&placeOK(e,choice.place)),seed).slice(0,stations-all.length)];
 const chosen=all.slice(0,stations);
 const qty=choice.equipmentQuantities||{};
 const perStation=Math.ceil(participants/stations);
 const stationData=chosen.map((e,i)=>{
  const needed=e.equipment?.find(x=>!["poids du corps","mur","sol","extérieur","terrain","piste"].includes(x));
  const available=needed?Number(qty[needed]??999):999;
  const fallback=needed&&available<perStation?"Prévoir alternance ou une variante poids du corps / élastique.":"Matériel suffisant pour la rotation.";
  return{
   number:i+1,exercise:e,people:perStation,work:choice.work||"40 s",rest:choice.rest||"20 s",equipmentNote:fallback,
   levels:{
    Débutant:`${e.name} · amplitude/charge facile · RPE 5–6`,
    Intermédiaire:`${e.name} · version standard · RPE 6–8`,
    Avancé:`${e.name} · variante/charge exigeante · RPE 7–9`
   }
  };
 });
 return{id:`class_${Date.now()}`,date:new Date().toISOString(),name:choice.name||"Cours collectif FAFATRAINING",participants,stations:stationData,duration:Number(choice.duration)||45,rounds:Number(choice.rounds)||3,format:choice.format||"stations",trainingType:choice.trainingType||"cross_training",targets:choice.targets||["full_body"],equipment:choice.equipment||[],place:choice.place||"studio"};
}

