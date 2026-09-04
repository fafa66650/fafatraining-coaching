import { memberSessions } from '../core/storage.js';

const levelRank={Débutant:1,Intermédiaire:2,Avancé:3,Expert:4};
const loadGoals={
  force:{sets:'4–5',reps:'3–6',rest:'2–3 min',rpe:8,tempo:'2-1-X',pct:'80–88% 1RM'},
  hypertrophie:{sets:'3–4',reps:'8–12',rest:'60–90 s',rpe:7.5,tempo:'2-0-2',pct:'60–75% 1RM'},
  remise_en_forme:{sets:'2–4',reps:'8–15',rest:'45–75 s',rpe:6.5,tempo:'contrôlé',pct:'charge confortable'},
  perte_gras:{sets:'3–5 tours',reps:'30–45 s',rest:'30–60 s',rpe:7.5,tempo:'rythme stable',pct:'léger à modéré'},
  bodyweight:{sets:'3–4',reps:'8–20',rest:'45–75 s',rpe:7,tempo:'propre',pct:'poids du corps'},
  crossfit:{sets:'AMRAP/EMOM',reps:'6–15',rest:'selon format',rpe:8,tempo:'constant',pct:'technique avant charge'},
  hyrox:{sets:'4–8 stations',reps:'distance/temps',rest:'45–90 s',rpe:8,tempo:'soutenu',pct:'charge contrôlée'},
  boxe:{sets:'3–6 rounds',reps:'2–3 min',rest:'1 min',rpe:7.5,tempo:'technique + rythme',pct:'—'},
  cardio_boxing:{sets:'4–8 rounds',reps:'30–60 s',rest:'20–40 s',rpe:7.5,tempo:'rythmé',pct:'—'},
  trail:{sets:'blocs course',reps:'temps/distance',rest:'marche/trot',rpe:7,tempo:'selon terrain',pct:'—'},
  aerobic:{sets:'blocs chorégraphiés',reps:'30–60 s',rest:'actif',rpe:6.5,tempo:'musical',pct:'—'},
  mobilite:{sets:'2–3 tours',reps:'30–60 s',rest:'respiration',rpe:3,tempo:'lent',pct:'—'},
  prevention:{sets:'2–3',reps:'8–15',rest:'30–60 s',rpe:5,tempo:'lent/contrôlé',pct:'léger'},
  senior:{sets:'2–3',reps:'8–12',rest:'60–90 s',rpe:5.5,tempo:'stable',pct:'léger'}
};

export function bmi(weight,heightCm){
  const w=Number(weight), h=Number(heightCm)/100;
  if(!w||!h) return {value:null,label:'Non calculé',note:'Renseigne taille et poids.'};
  const v=Math.round((w/(h*h))*10)/10;
  let label='Corpulence habituelle',note='À interpréter avec prudence chez les sportifs très musclés.';
  if(v<18.5){label='IMC bas';note='La priorité peut être la force, la masse utile et la récupération.'}
  else if(v>=25&&v<30){label='IMC élevé';note='À nuancer selon la masse musculaire et la composition corporelle.'}
  else if(v>=30){label='IMC très élevé';note='Progressivité recommandée, surtout en reprise ou en cas de douleur.'}
  return {value:v,label,note};
}
export function epley1RM(weight,reps){ const w=Number(weight),r=Number(reps); return w&&r?Math.round((w*(1+r/30))*10)/10:null; }

function readiness(member,daily){
  const fatigue=Number(daily.fatigue||3),stress=Number(daily.stress||3),sleep=Number(daily.sleep||3),pain=Number(daily.pain||0);
  let score=100-(fatigue-1)*8-(stress-1)*5-(5-sleep)*6-pain*10;
  if(member?.level==='Débutant')score-=3;
  return Math.max(35,Math.min(100,Math.round(score)));
}
function effectiveRPE(base,score){ if(score<55)return Math.max(5,base-2); if(score<70)return Math.max(5,base-1); return base; }
function recentExerciseIds(memberId){ return new Set(memberSessions(memberId).slice(0,5).flatMap(s=>s.exercises?.map(e=>e.exerciseId)||[])); }
function equipOK(ex,available){ if(!available?.length)return true; if(ex.equipment.includes('poids du corps'))return true; return ex.equipment.some(x=>available.includes(x)); }
function levelOK(ex,level){ return (levelRank[ex.level]||2) <= (levelRank[level]||2)+1; }
function sportScore(ex,profile,goal){ let s=0; if(ex.goals.includes(goal))s+=35; if(profile.sport&&ex.sport.toLowerCase().includes(profile.sport.toLowerCase()))s+=25; if(goal==='boxe'&&ex.sport==='Boxe')s+=45; if(goal==='trail'&&ex.sport==='Trail')s+=45; if(goal==='aerobic'&&ex.sport==='Aérobic')s+=45; if(goal==='hyrox'&&ex.sport==='Hyrox')s+=45; if(goal==='crossfit'&&ex.sport==='Cross training')s+=35; return s; }

function lastPerformance(memberId,exerciseId){
  for(const s of memberSessions(memberId)){
    const found=s.exercises?.find(x=>x.exerciseId===exerciseId && x.loggedWeight);
    if(found)return found;
  }
  return null;
}
function suggestLoad(memberId,ex,rx,readinessScore){
  if(!['reps'].includes(ex.mode) || ex.equipment.includes('poids du corps')) return rx.pct;
  const last=lastPerformance(memberId,ex.id);
  if(!last) return `${rx.pct} · viser RPE ${rx.rpe}`;
  let w=Number(last.loggedWeight)||0;
  const rpe=Number(last.loggedRpe)||8;
  if(readinessScore>=75 && rpe<=7.5)w*=1.025;
  if(readinessScore<60)w*=0.95;
  return `${Math.max(1,Math.round(w*2)/2)} kg suggérés · RPE ${rx.rpe}`;
}

function buildBoxing(profile,duration,level,readinessScore){
  const pro=(level==='Avancé'||level==='Expert'); const round=pro?3:2; const total=Math.max(3,Math.floor((duration-8)/(round+1)));
  return {roundSeconds:round*60,restSeconds:60,rounds:Math.min(8,total),note:`${round} min travail / 1 min récupération · ${readinessScore<60?'volume réduit':'volume normal'}`};
}
function choose(pool,n,used){ const out=[]; for(const e of pool){ if(!used.has(e.id)){out.push(e);used.add(e.id);if(out.length===n)break;} } return out; }

export function generateSession({member,daily,goal,duration,equipment,place,exercises}){
  const readinessScore=readiness(member,daily); const base={...(loadGoals[goal]||loadGoals.remise_en_forme)}; base.rpe=effectiveRPE(base.rpe,readinessScore);
  const recent=recentExerciseIds(member.id); const used=new Set();
  let pool=exercises.filter(e=>equipOK(e,equipment)&&levelOK(e,member.level));
  if(member.lowImpact||daily.pain>0) pool=pool.filter(e=>e.lowImpact||!['Plyométrie','Sprint'].includes(e.pattern));
  pool=pool.map(e=>({e,score:sportScore(e,member,goal)-(recent.has(e.id)?18:0)+(e.lowImpact&&readinessScore<60?10:0)})).sort((a,b)=>b.score-a.score).map(x=>x.e);
  const warm=choose(pool.filter(e=>['mobilite','reeducation','cardio','boxe'].includes(e.group)),3,used);
  const skill=choose(pool.filter(e=>goal==='boxe'?e.sport==='Boxe':['mobilite','reeducation'].includes(e.group)||e.pattern==='Technique'),2,used);
  const main=choose(pool.filter(e=>!['mobilite','reeducation'].includes(e.group)),readinessScore<55?3:4,used);
  const support=choose(pool.filter(e=>['core','reeducation','mobilite','haut_du_corps','bas_du_corps'].includes(e.group)),3,used);
  const finish=choose(pool.filter(e=>goal==='mobilite'?e.group==='mobilite':['cardio','mobilite','boxe'].includes(e.group)),2,used);
  const all=[...warm,...skill,...main,...support,...finish];
  const boxing=(goal==='boxe'||goal==='cardio_boxing')?buildBoxing(member,duration,member.level,readinessScore):null;
  const mapEx=(e,block)=>({
    exerciseId:e.id,name:e.name,block,mode:e.mode,cues:e.cues,error:e.error,variants:e.variants,
    sets:block==='main'?base.sets:(block==='warmup'?'1–2':'2–3'),
    reps:block==='warmup'?(e.mode==='time'?'30–45 s':'8–10'):base.reps,
    rest:block==='main'?base.rest:(block==='warmup'?'court':'30–60 s'),
    tempo:block==='main'?base.tempo:'contrôlé',
    targetRpe:block==='main'?base.rpe:Math.max(3,base.rpe-1.5),
    load:suggestLoad(member.id,e,base,readinessScore)
  });
  const blocks={warmup:warm.map(e=>mapEx(e,'warmup')),skill:skill.map(e=>mapEx(e,'skill')),main:main.map(e=>mapEx(e,'main')),support:support.map(e=>mapEx(e,'support')),finish:finish.map(e=>mapEx(e,'finish'))};
  const estimatedCalories=Math.round((({boxe:8,cardio_boxing:8.5,trail:7.5,aerobic:6.5,crossfit:9,hyrox:8.5,force:5,hypertrophie:5.5,perte_gras:7,mobilite:2.5,prevention:3,senior:3.2}[goal]||6)*3.5*(Number(member.weight)||75)/200)*duration);
  return {id:crypto.randomUUID(),memberId:member.id,date:new Date().toISOString(),goal,duration,place,equipment,readinessScore,rx:base,boxing,estimatedCalories,blocks,exercises:Object.values(blocks).flat(),feedback:null};
}

export function progression(memberId){
  const s=memberSessions(memberId); const count=s.length;
  const volume=s.reduce((sum,x)=>sum+(x.exercises||[]).reduce((a,e)=>a+(Number(e.loggedWeight)||0)*(Number(e.loggedReps)||0)*(Number(e.loggedSets)||0),0),0);
  const pr={};
  s.forEach(x=>(x.exercises||[]).forEach(e=>{ if(e.loggedWeight&&e.loggedReps){const est=epley1RM(e.loggedWeight,e.loggedReps);if(est>(pr[e.exerciseId]?.value||0))pr[e.exerciseId]={name:e.name,value:est};}}));
  const last30=s.filter(x=>Date.now()-new Date(x.date).getTime()<30*86400000).length;
  return {count,last30,volume:Math.round(volume),prs:Object.values(pr).sort((a,b)=>b.value-a.value).slice(0,8)};
}
