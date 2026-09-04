
const GOAL_RULES={
  remise_en_forme:{label:"Remise en forme",rpe:[5.5,7],sets:[2,3],reps:[8,15],rest:[45,75]},
  musculation:{label:"Musculation",rpe:[6.5,8],sets:[3,4],reps:[8,12],rest:[60,100]},
  force:{label:"Force",rpe:[7,8.5],sets:[3,5],reps:[3,6],rest:[120,210]},
  perte_gras:{label:"Perte de poids",rpe:[6,8],sets:[3,5],reps:[10,15],rest:[30,60]},
  full_body:{label:"Full Body",rpe:[6,8],sets:[3,4],reps:[8,15],rest:[45,90]},
  hiit:{label:"HIIT",rpe:[6.5,8.5],sets:[4,8],reps:[8,15],rest:[20,60]},
  boxe:{label:"Boxe",rpe:[6,8.5],sets:[3,6],reps:[8,15],rest:[45,75]},
  cardio:{label:"Cardio",rpe:[5.5,8],sets:[3,6],reps:[10,20],rest:[30,75]},
  trail:{label:"Course / Trail",rpe:[5.5,8.5],sets:[3,8],reps:[6,15],rest:[45,120]},
  crossfit:{label:"Cross training",rpe:[6.5,8.5],sets:[3,6],reps:[6,15],rest:[30,90]},
  hyrox:{label:"Hyrox",rpe:[6.5,8.5],sets:[3,6],reps:[8,20],rest:[45,90]},
  aerobic:{label:"Aérobic",rpe:[5.5,7.5],sets:[3,6],reps:[10,20],rest:[20,45]},
  mobilite:{label:"Mobilité",rpe:[3,5],sets:[2,3],reps:[6,12],rest:[15,30]},
  prevention:{label:"Prévention",rpe:[4,6],sets:[2,3],reps:[8,15],rest:[30,60]},
  recovery:{label:"Récupération",rpe:[2,4],sets:[1,3],reps:[6,12],rest:[15,30]},
};

export function bmi(weightKg,heightCm){
  const w=Number(weightKg), h=Number(heightCm)/100;
  if(!w||!h) return {value:null,label:"À renseigner",note:"Taille et poids nécessaires."};
  const v=Math.round((w/(h*h))*10)/10;
  let label="Corpulence habituelle";
  if(v<18.5) label="IMC bas";
  else if(v>=25&&v<30) label="IMC élevé";
  else if(v>=30) label="IMC très élevé";
  return {value:v,label,note:"L’IMC est un repère général et ne mesure pas directement la composition corporelle."};
}
export function e1rm(weight,reps){
  weight=Number(weight); reps=Number(reps);
  if(!weight||!reps) return null;
  return Math.round(weight*(1+reps/30)*10)/10;
}
export function readiness(athlete,daily={}){
  let score=80;
  const sleep=Number(daily.sleep??athlete.sleep??3);
  const fatigue=Number(daily.fatigue??3);
  const stress=Number(daily.stress??3);
  const pain=Number(daily.pain??0);
  score+=(sleep-3)*6;
  score-=(fatigue-3)*8;
  score-=(stress-3)*5;
  score-=pain*8;
  return Math.max(25,Math.min(100,Math.round(score)));
}
export function loadSuggestion(history,exerciseId,targetRpe=7){
  const sets=history.flatMap(s=>s.logs||[]).filter(x=>x.exerciseId===exerciseId && Number(x.weight)>0);
  if(!sets.length) return null;
  const last=sets[0];
  let weight=Number(last.weight);
  const rpe=Number(last.rpe||targetRpe);
  if(rpe<=targetRpe-1) weight*=1.025;
  else if(rpe>=targetRpe+1) weight*=0.975;
  return Math.max(0,Math.round(weight*2)/2);
}
function available(ex, equipment){
  if(!equipment?.length) return true;
  if((ex.equipment||[]).includes("poids du corps")) return true;
  return (ex.equipment||[]).some(x=>equipment.includes(x));
}
function levelRank(level){return {Débutant:1,Intermédiaire:2,Avancé:3,Expert:4}[level]||2}
function profileLevelRank(level){return {Débutant:1,Intermédiaire:2,Avancé:3,Expert:4}[level]||2}
function randomize(list){return [...list].sort(()=>Math.random()-.5)}
function durationPlan(duration){
  duration=Number(duration)||30;
  if(duration<=20) return {warm:4,skill:2,main:10,support:2,cool:2,counts:[2,1,3,1,1]};
  if(duration<=30) return {warm:5,skill:4,main:14,support:4,cool:3,counts:[2,1,4,2,1]};
  if(duration<=45) return {warm:7,skill:5,main:22,support:7,cool:4,counts:[3,2,5,2,2]};
  return {warm:9,skill:7,main:30,support:9,cool:5,counts:[3,2,6,3,2]};
}
function formatFor(goal,style){
  if(goal==="boxe") return style==="technique"?"Rounds techniques":"Rounds";
  if(goal==="hiit") return style==="tabata"?"Tabata 20/10":style==="emom"?"EMOM":"Intervalles";
  if(goal==="crossfit") return style==="emom"?"EMOM":style==="amrap"?"AMRAP":style==="fortime"?"For Time":"Circuit";
  if(goal==="hyrox") return "Stations";
  if(goal==="trail") return "Course + renforcement";
  if(["mobilite","recovery","prevention"].includes(goal)) return "Flow contrôlé";
  return "Séries";
}
function prescription(goal,style,level,ready,mode,block){
  const rule=GOAL_RULES[goal]||GOAL_RULES.remise_en_forme;
  let rpe=(rule.rpe[0]+rule.rpe[1])/2;
  if(ready<55) rpe-=1.2; else if(ready<70) rpe-=.6; else if(ready>88) rpe+=.3;
  if(level==="Débutant") rpe-=.5;
  rpe=Math.max(3,Math.min(9,Math.round(rpe*10)/10));
  if(block==="warmup") return {sets:1,reps:mode==="time"?"30-45 sec":"8-10",rest:"15-20 sec",rpe:4,tempo:"progressif"};
  if(block==="cooldown") return {sets:1,reps:mode==="time"?"45-60 sec":"6-8",rest:"respiration",rpe:3,tempo:"lent"};
  if(goal==="boxe" || mode==="rounds") return {sets:level==="Débutant"?3:5,reps:level==="Débutant"?"2 min":"3 min",rest:"60 sec",rpe,tempo:"garde + appuis"};
  if(goal==="trail" && mode==="distance") return {sets:4,reps:level==="Débutant"?"200-400 m":"400-800 m",rest:"60-120 sec",rpe,tempo:"allure régulière"};
  if(goal==="hyrox" && mode==="distance") return {sets:3,reps:"250-1000 m",rest:"60-90 sec",rpe,tempo:"constant"};
  if(goal==="hiit" || goal==="crossfit" || mode==="time") return {sets:4,reps:style==="tabata"?"20 sec":"30-45 sec",rest:style==="tabata"?"10 sec":"30-45 sec",rpe,tempo:"rythmé"};
  const sets=Math.round((rule.sets[0]+rule.sets[1])/2);
  const reps=`${rule.reps[0]}-${rule.reps[1]}`;
  return {sets,reps,rest:`${rule.rest[0]}-${rule.rest[1]} sec`,rpe,tempo:goal==="force"?"contrôlé / explosif":"2-0-2"};
}
function preferredFamilies(goal){
  return {
    boxe:["Boxe","Cardio","Prévention"],
    trail:["Course / Trail","Prévention","Mobilité","Poids du corps / Renfo"],
    hyrox:["Hyrox","Cross training","Musculation","Cardio"],
    crossfit:["Cross training","Musculation","Cardio","Poids du corps / Renfo"],
    hiit:["Cardio","Cross training","Poids du corps / Renfo"],
    musculation:["Musculation","Prévention"],
    force:["Musculation","Prévention"],
    full_body:["Poids du corps / Renfo","Musculation","Cross training"],
    cardio:["Cardio","Aérobic","Course / Trail"],
    aerobic:["Aérobic","Cardio"],
    mobilite:["Mobilité","Récupération"],
    prevention:["Prévention","Mobilité"],
    recovery:["Récupération","Mobilité"],
    perte_gras:["Cardio","Cross training","Poids du corps / Renfo","Musculation"],
    remise_en_forme:["Poids du corps / Renfo","Cardio","Prévention","Mobilité"],
  }[goal]||["Général","Poids du corps / Renfo"];
}
function blockFamilies(goal,block){
  if(block==="warmup") return ["Mobilité","Prévention","Cardio",...preferredFamilies(goal)];
  if(block==="skill") return goal==="boxe"?["Boxe","Prévention"]:goal==="trail"?["Course / Trail","Mobilité"]:["Prévention","Mobilité",...preferredFamilies(goal)];
  if(block==="main") return preferredFamilies(goal);
  if(block==="support") return ["Prévention","Poids du corps / Renfo","Musculation",...preferredFamilies(goal)];
  return ["Récupération","Mobilité","Prévention"];
}
function injuryPenalty(ex,injuries=[]){
  const text=`${ex.name} ${ex.pattern} ${(ex.muscles||[]).join(" ")}`.toLowerCase();
  let penalty=0;
  injuries.forEach(i=>{
    const x=i.toLowerCase();
    if(x.includes("genou") && /squat|fente|jump|box jump|burpee|course|côte/.test(text)) penalty+=40;
    if(x.includes("épaule") && /press|pompe|push|boxe|sac|épaule|traction/.test(text)) penalty+=40;
    if(x.includes("dos") || x.includes("lomb")) if(/deadlift|hinge|rowing|soulevé|good morning/.test(text)) penalty+=40;
    if(x.includes("cheville") && /course|jump|saut|côte|mollet/.test(text)) penalty+=35;
  });
  return penalty;
}
function selectExercises(exercises,cfg,block,count,used,recent){
  const families=blockFamilies(cfg.goal,block);
  const maxLevel=profileLevelRank(cfg.level);
  const scored=exercises.map(ex=>{
    let s=0;
    const fi=families.indexOf(ex.family);
    if(fi>=0) s+=80-fi*8; else s-=15;
    if(available(ex,cfg.equipment)) s+=30; else s-=60;
    if(levelRank(ex.level)<=maxLevel+1) s+=15; else s-=35;
    if(ex.lowImpact && (cfg.readiness<60 || cfg.age>=60 || cfg.pain>=2)) s+=22;
    if(used.has(ex.id)) s-=180;
    if(recent.has(ex.id)) s-=20;
    s-=injuryPenalty(ex,cfg.injuries);
    if((ex.goals||[]).some(g=>String(g).toLowerCase().includes(cfg.goal.replace("_"," ")))) s+=18;
    return {ex,s};
  }).filter(x=>x.s>-20).sort((a,b)=>b.s-a.s);
  const pool=randomize(scored.slice(0,Math.max(count*4,12))).sort((a,b)=>b.s-a.s);
  return pool.slice(0,count).map(x=>x.ex);
}
export function generateSession({athlete,daily,choice,exercises,history}){
  const ready=readiness(athlete,daily);
  const goal=choice.goal||athlete.primaryGoal||"remise_en_forme";
  const level=choice.level||athlete.level||"Débutant";
  const duration=Number(choice.duration||athlete.duration||30);
  const plan=durationPlan(duration);
  const cfg={
    goal,level,duration,age:Number(athlete.age)||30,
    equipment:choice.equipment?.length?choice.equipment:athlete.equipment||["poids du corps"],
    injuries:[...(athlete.injuries||[]),...(daily.injuries||[])],
    pain:Number(daily.pain||0),readiness:ready
  };
  const recent=new Set((history||[]).slice(0,6).flatMap(s=>s.exerciseIds||[]));
  const used=new Set();
  const blocks=[
    ["warmup","Échauffement",plan.warm,plan.counts[0]],
    ["skill","Préparation spécifique",plan.skill,plan.counts[1]],
    ["main","Bloc principal",plan.main,plan.counts[2]],
    ["support","Renfort / complément",plan.support,plan.counts[3]],
    ["cooldown","Retour au calme",plan.cool,plan.counts[4]],
  ].map(([key,label,minutes,count])=>{
    const selected=selectExercises(exercises,cfg,key,count,used,recent);
    selected.forEach(e=>used.add(e.id));
    return {
      key,label,minutes,
      exercises:selected.map(ex=>({
        ...ex,
        prescription:prescription(goal,choice.style||"",level,ready,ex.mode,key),
        suggestedLoad:loadSuggestion(history||[],ex.id,7)
      }))
    };
  });
  const score=Math.round(Math.min(98,65+ready*.25+(cfg.equipment.length>2?5:0)));
  return {
    id:`session_${Date.now()}`,date:new Date().toISOString(),athleteId:athlete.id,
    title:GOAL_RULES[goal]?.label||goal,
    goal,style:choice.style||"standard",duration,readiness:ready,score,
    objective:choice.secondaryGoal||athlete.secondaryGoal||"Progresser régulièrement avec une séance adaptée.",
    format:formatFor(goal,choice.style),
    equipment:cfg.equipment,
    blocks,
    exerciseIds:blocks.flatMap(b=>b.exercises.map(e=>e.id)),
    coachNote: ready<55 ? "Séance allégée aujourd’hui : priorité à la technique et à la récupération." :
      ready>88 ? "Très bonne disponibilité : tu peux viser le haut de la fourchette sans sacrifier la technique." :
      "Séance calibrée pour ton état du jour. Garde 1 à 3 répétitions en réserve selon le bloc.",
    logs:[]
  };
}
export function progressStats(history){
  const completed=history.filter(s=>s.completedAt);
  const totalMinutes=completed.reduce((a,s)=>a+Number(s.duration||0),0);
  const logs=completed.flatMap(s=>s.logs||[]);
  const volume=logs.reduce((a,x)=>a+(Number(x.weight)||0)*(Number(x.reps)||0),0);
  const best1rm=logs.reduce((m,x)=>Math.max(m,e1rm(x.weight,x.reps)||0),0);
  return {completed:completed.length,totalMinutes,volume:Math.round(volume),best1rm:Math.round(best1rm*10)/10};
}
