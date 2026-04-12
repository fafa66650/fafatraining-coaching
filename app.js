
let EXERCISES = [];
const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['mat','Tapis de sol'],['dumbbell','Haltères'],['barbell','Barre olympique / standard'],
  ['bench','Banc'],['rack','Rack / cage'],['cable','Poulie / vis-à-vis'],['machine','Machines guidées'],
  ['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],['treadmill','Tapis de course'],
  ['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],['med_ball','Medicine ball'],
  ['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],['ladder','Échelle de rythme'],
  ['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],['skierg','SkiErg'],
  ['dip_bars','Barres dips'],['landmine','Landmine'],['box','Plyo box / step'],['chair','Chaise'],['sofa','Canapé / rebord stable'],
  ['stairs','Marches / escalier'],['backpack','Sac à dos lestable'],['water_bottles','Bouteilles d’eau / bidons'],['foam_roller','Foam roller / rouleau'],['towel','Serviette']
];
const ENV_LABELS = {
  gym:'Salle de musculation', crossfit_box:'Salle CrossFit / Hyrox', boxing_gym:'Salle de boxe',
  home:'Maison / appartement', outdoor:'Extérieur', bodyweight_only:'Poids du corps uniquement'
};
const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','treadmill','bike','elliptical','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles','towel']
};
const goalLabels = {
  muscle_gain:'Prise de muscle', fat_loss:'Perte de poids', strength:'Force', conditioning:'Condition physique / HIIT',
  boxing:'Boxe', hyrox:'Hyrox / fonctionnel', endurance:'Cardio / endurance', mobility:'Mobilité / souplesse',
  recovery:'Bien-être / récupération', core:'Abdos / gainage'
};
const moduleLabels = {
  boxing_prep:'Prépa boxe', hyrox_prep:'Prépa Hyrox', trail_prep:'Prépa Trail', return_to_play:'Réathlétisation',
  seniors_health:'Séniors / santé', kids_teens:'Kids / ados', express_fat_loss:'Perte de poids express', transformation:'Challenge transformation'
};
function $(sel){ return document.querySelector(sel); }
function $$(sel){ return [...document.querySelectorAll(sel)]; }
function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function levelValue(v){ return ({beginner:1, intermediate:2, advanced:3}[v] || 1); }
function eqLabel(v){ return (EQUIPMENTS.find(x=>x[0]===v)||[v,v])[1]; }
function labelForGoal(v){ return goalLabels[v] || v; }


function simplifyPrescriptionText(p){
  return `En clair : fais ${p.series.toLowerCase()}, ${p.reps.toLowerCase()}, récupère ${p.rest.toLowerCase()}.`;
}
function stripProgramForShare(p){
  return {
    name:p.name, code:p.code, age:p.age, sex:p.sex, height:p.height, weight:p.weight, level:p.level, freq:p.freq, duration:p.duration,
    env:p.env, mainGoal:p.mainGoal, secondGoal:p.secondGoal, bodyArea:p.bodyArea, focusTarget:p.focusTarget,
    cycleWeeks:p.cycleWeeks, cycleGoal:p.cycleGoal, specialModule:p.specialModule, warmup:p.warmup, cooldown:p.cooldown,
    days:p.days, bmi:p.bmi, nutrition:p.nutrition, cycle:p.cycle
  };
}
function encodeSharePayload(obj){
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeSharePayload(str){
  try{ return JSON.parse(decodeURIComponent(escape(atob(str)))); }catch(e){ return null; }
}
function beginnerGlossaryHTML(){
  return `<h2>Glossaire simple</h2>
  <p><strong>Série :</strong> nombre de blocs à faire.</p>
  <p><strong>Reps :</strong> nombre de répétitions dans un bloc.</p>
  <p><strong>Repos :</strong> temps à récupérer avant de repartir.</p>
  <p><strong>Tempo :</strong> vitesse d’exécution de l’exercice.</p>
  <p><strong>RPE :</strong> ressenti d’effort sur 10.</p>`;
}
function exportProgramHTML(p){
  const levelText = p.level==='beginner' ? 'Débutant' : p.level==='intermediate' ? 'Intermédiaire' : 'Avancé';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(p.name)}</title><style>
  body{font-family:Arial,sans-serif;padding:28px;color:#111;background:#fff}
  h1,h2,h3{margin:0 0 12px}
  .top{padding:18px 20px;border:1px solid #ddd;border-radius:20px;background:#f7f9fc;margin-bottom:18px}
  .day{border:1px solid #ddd;border-radius:16px;padding:16px;margin:16px 0}
  .ex{padding:10px 0;border-top:1px solid #eee}
  .ex:first-child{border-top:none}
  .muted{color:#555;line-height:1.45}
  .badge{display:inline-block;padding:4px 8px;border:1px solid #ccc;border-radius:999px;margin:0 6px 6px 0;font-size:12px}
  .small{font-size:13px;color:#555}
  </style></head><body>
  <div class="top">
    <h1>${esc(p.name)} · ${esc(p.code)}</h1>
    <p><strong>Objectif :</strong> ${esc(labelForGoal(p.mainGoal))}${p.secondGoal?` · ${esc(labelForGoal(p.secondGoal))}`:''}</p>
    <p><strong>Niveau :</strong> ${esc(levelText)} · <strong>Fréquence :</strong> ${p.freq}/semaine · <strong>Durée :</strong> ${p.duration} min</p>
    ${p.bmi?`<p><strong>IMC :</strong> ${esc(p.bmi.value)} · ${esc(p.bmi.label)}</p>`:''}
    ${p.nutrition?`<p><strong>Nutrition :</strong> ${p.nutrition.kcal} kcal · P ${p.nutrition.protein} g · G ${p.nutrition.carbs} g · L ${p.nutrition.fats} g</p><p class="small">Ces repères servent de base de travail et s’ajustent selon l’évolution, la récupération et l’adhérence alimentaire.</p>`:''}
  </div>
  <h2>Programme</h2>
  ${p.days.map(day=>`<div class="day"><h3>${esc(day.title)}</h3>${day.items.map(ex=>`<div class="ex"><strong>${esc(ex.name)}</strong><br><span class="muted">${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</span><br><span class="muted">${esc(ex.cue||'')}</span><br><span class="small">${esc(simplifyPrescriptionText(ex.prescription))}</span></div>`).join('')}</div>`).join('')}
  ${p.level==='beginner' ? beginnerGlossaryHTML() : ''}
  </body></html>`;
}

function goView(id){
  $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===id));
}
function initNav(){ $$('.navbtn').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.view))); }
function bindHeroButtons(){
  $('#homeCreateProgram')?.addEventListener('click', ()=>goView('coach'));
  $('#homeOpenLibrary')?.addEventListener('click', ()=>goView('library'));
}
async function init(){
  EXERCISES = await fetch('data/exercises.json').then(r=>r.json());
  $('#exerciseCount').textContent = EXERCISES.length;
  initNav();
  bindHeroButtons();
  buildEquipmentGrid();
  buildLibraryFilters();
  renderLibrary();
  loadTracking();
  hydrateAthleteFromLink();
  renderHomeEnhancements();
}
function renderHomeEnhancements(){
  const hero = $('#home .hero-copy');
  if(hero){
    const x = document.createElement('div');
    x.className='mini-help premium-home';
    x.innerHTML='';
    hero.appendChild(x);
  }
}
function buildEquipmentGrid(){
  $('#equipmentGrid').innerHTML = EQUIPMENTS.map(([k,l])=>`<label class="chk"><input type="checkbox" value="${k}"> <span>${l}</span></label>`).join('');
  $('#environmentSelect').addEventListener('change', ()=>{ $('#presetLabel').textContent='Contexte choisi : '+($('#environmentSelect').selectedOptions[0]?.textContent||''); });
}
function applyEquipmentPreset(){}
function buildLibraryFilters(){
  const cats = [''].concat([...new Set(EXERCISES.map(e=>e.category))]);
  $('#libCategory').innerHTML = cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML = [''].concat(Object.keys(ENV_LABELS)).map(v=>`<option value="${v}">${v ? ENV_LABELS[v] : 'Tous les lieux'}</option>`).join('');
}
function selectedEquipment(){ return $$('#equipmentGrid input:checked').map(i=>i.value); }

function calcBMI(weightKg,heightCm){
  const h = Number(heightCm)/100;
  if(!weightKg || !h) return null;
  const bmi = Number(weightKg)/(h*h);
  let label='Poids normal', risk='profil standard';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
  else if(bmi < 35){ label='Obésité modérée'; risk='progressivité indispensable'; }
  else { label='Obésité sévère'; risk='approche santé prioritaire'; }
  return {value:bmi.toFixed(1), label, risk};
}
function calcCalories({sex, weight, height, age, goal, stress, activityFactor=1.5}){
  weight=Number(weight||0); height=Number(height||0); age=Number(age||0);
  if(!weight || !height || !age) return null;
  const bmr = sex==='female' ? (10*weight + 6.25*height - 5*age - 161) : (10*weight + 6.25*height - 5*age + 5);
  let maintenance = bmr * activityFactor;
  if(stress==='high') maintenance *= 0.97;
  if(goal==='fat_loss') maintenance -= 350;
  if(goal==='muscle_gain') maintenance += 250;
  if(goal==='strength') maintenance += 120;
  if(goal==='endurance' || goal==='conditioning' || goal==='hyrox') maintenance += 150;
  const kcal = Math.round(maintenance);
  let protein = Math.round(weight * (goal==='muscle_gain'||goal==='strength' ? 2.0 : 1.8));
  let fats = Math.round(weight * 0.9);
  let carbs = Math.max(80, Math.round((kcal - protein*4 - fats*9)/4));
  return {kcal, protein, fats, carbs};
}
function nutritionMenu(goal){
  const base = {
    breakfast:'Skyr + flocons d’avoine + fruits rouges + graines',
    lunch:'Poulet / tofu + riz / quinoa + légumes + huile d’olive',
    snack:'Fruit + yaourt grec / whey + poignée d’amandes',
    dinner:'Poisson / œufs + pommes de terre / légumineuses + légumes verts'
  };
  if(goal==='fat_loss') base.snack='Fruit + fromage blanc 0%';
  if(goal==='endurance' || goal==='hyrox') base.lunch='Poulet + riz + légumes + fruit';
  if(goal==='recovery') base.dinner='Poisson gras + légumes + féculent modéré';
  return base;
}
function moduleGuidance(module){
  const map = {
    boxing_prep:['travail technique + appuis','rotation du tronc / gainage','vitesse bras + récupération active'],
    hyrox_prep:['locomotion + sled / carries','moteur cardio fort','travail mix endurance-force'],
    trail_prep:['ischios / fessiers / mollets','montées / descentes / gainage','capacité aérobie'],
    return_to_play:['progressivité stricte','amplitudes contrôlées','volume réduit puis montée'],
    seniors_health:['stabilité / mobilité / respiration','force utile sécurisée','fatigue maîtrisée'],
    kids_teens:['ludique / technique / coordination','durée courte','densité maîtrisée'],
    express_fat_loss:['circuit full body','pas trop de fatigue nerveuse','adhérence alimentaire'],
    transformation:['mix muscu + cardio','suivi assiduité','densité progressive']
  };
  return map[module] || [];
}
function patternFromExercise(ex){
  const name = (ex.name+' '+ex.subcategory+' '+(ex.focus||[]).join(' ')+' '+(ex.areas||[]).join(' ')).toLowerCase();
  if(name.includes('squat') || name.includes('fente') || name.includes('quadriceps')) return 'squat';
  if(name.includes('deadlift') || name.includes('soulev') || name.includes('hinge') || name.includes('ischio')) return 'hinge';
  if(name.includes('développ') || name.includes('pompe') || name.includes('pector')) return 'push';
  if(name.includes('tirage') || name.includes('row') || name.includes('dos') || name.includes('traction')) return 'pull';
  if(name.includes('gainage') || name.includes('abdo') || name.includes('core')) return 'core';
  if(name.includes('course') || name.includes('rameur') || name.includes('bike') || name.includes('cardio')) return 'engine';
  if(name.includes('boxe') || name.includes('shadow') || name.includes('frappe')) return 'boxing';
  return ex.category || 'misc';
}
function fatigueCost(ex){
  const pat = patternFromExercise(ex);
  let cost = 1;
  if(['squat','hinge','engine','hyrox'].includes(pat)) cost = 3;
  if(['push','pull','boxing'].includes(pat)) cost = 2;
  if((ex.level||'')==='advanced') cost += 1;
  return cost;
}
function pickUniqueFrom(pool, count, usedRoots=new Set()){
  const out=[];
  for(const ex of shuffle(pool)){
    const root=(ex.name||'').toLowerCase().split('—')[0].trim();
    if(usedRoots.has(root)) continue;
    out.push(ex); usedRoots.add(root);
    if(out.length>=count) break;
  }
  return out;
}
function normalizeArea(area){
  return area || '';
}
function validateCoachInputs(){
  const mainGoal = $('#mainGoal').value;
  const freq = Number($('#clientFreq').value||0);
  const duration = Number($('#clientDuration').value||0);
  if(!mainGoal){ alert('Choisis un objectif principal.'); return false; }
  if(!freq || !duration){ alert('Renseigne la fréquence et la durée.'); return false; }
  if(!$('#clientHeight').value || !$('#clientWeight').value){ alert('Ajoute la taille et le poids pour l’IMC réel.'); return false; }
  return true;
}
function buildDayBlueprintsPremium(freq, mainGoal, secondGoal, area, focus, module, cycleGoal){
  const areaNorm = normalizeArea(area);
  let base = [];
  if(module==='boxing_prep'){
    base = ['Boxe technique + moteur','Force bas du corps + core','Puissance haut du corps','Sparring / répétitions / récup active','Renfo full body','Mobilité / respiration'];
  } else if(module==='hyrox_prep'){
    base = ['Force jambe + carries','Engine mixte','Hyrox simulation','Haut du corps + core','Run + threshold','Mobilité / déload'];
  } else if(module==='trail_prep'){
    base = ['Chaîne postérieure','Seuil / côtes','Stabilité + mollets','Full body léger','Sortie longue / cardio','Récupération'];
  } else if(module==='seniors_health'){
    base = ['Mobilité + stabilité','Force utile full body','Cardio doux','Équilibre + core','Circuit santé','Respiration'];
  } else if(module==='kids_teens'){
    base = ['Coordination / appuis','Circuit ludique','Force poids du corps','Cardio jeu','Boxe éducative','Mobilité'];
  } else if(cycleGoal==='strength'){
    base = ['Lower force','Upper force','Engine recovery','Full body puissance','Lower assistance','Upper assistance'];
  } else if(cycleGoal==='hypertrophy'){
    base = ['Push','Pull','Legs','Upper mix','Lower + core','Conditioning'];
  } else {
    base = ['Full body 1','Upper','Lower','Conditioning','Core / mobility','Full body 2'];
  }
  if(areaNorm==='haut_du_corps') base = ['Upper push','Upper pull','Upper mix','Core'];
  if(areaNorm==='bas_du_corps') base = ['Lower quad','Lower posterior','Lower mix','Core'];
  if(areaNorm==='abdos_core') base = ['Core','Core + mobilité','Core + posture','Conditioning light'];
  return Array.from({length:freq}, (_,i)=>({title: base[i] || `Séance ${i+1}`, focus, module, mainGoal, secondGoal}));
}
function filterPoolPremium({title,focus,module,mainGoal,secondGoal}, env, level, equipment){
  const eqSet = new Set(equipment);
  const lvl = levelValue(level);
  const moduleGoalMap = {
    boxing_prep:['boxing','conditioning','core'],
    hyrox_prep:['hyrox','conditioning','strength'],
    trail_prep:['endurance','conditioning','recovery'],
    return_to_play:['recovery','mobility','core'],
    seniors_health:['recovery','mobility','conditioning'],
    kids_teens:['conditioning','boxing','mobility'],
    express_fat_loss:['fat_loss','conditioning','core'],
    transformation:['muscle_gain','fat_loss','conditioning']
  };
  const focusGoals = [mainGoal, secondGoal].filter(Boolean).concat(moduleGoalMap[module] || []);
  return EXERCISES.filter(ex=>{
    if(levelValue(ex.level)>lvl) return false;
    if(env && !(ex.environments||[]).includes(env)) return false;
    if(ex.equipment && ex.equipment.length){
      const match = ex.equipment.some(eq=>eqSet.has(eq));
      if(!match) return false;
    }
    const hay = [ex.category, ex.subcategory, ...(ex.tags||[]), ...(ex.focus||[]), ...(ex.areas||[]), ex.name].join(' ').toLowerCase();
    if(title.toLowerCase().includes('push') && !hay.match(/pector|triceps|pompe|développ|push|epaul|épaul/)) return false;
    if(title.toLowerCase().includes('pull') && !hay.match(/dos|tirage|row|traction|biceps|pull/)) return false;
    if(title.toLowerCase().includes('lower') && !hay.match(/jambe|quadriceps|ischio|fess|squat|soulev|fente|bas_du_corps/)) return false;
    if(title.toLowerCase().includes('boxe') && !hay.match(/boxe|frappe|shadow|corde/)) return false;
    if(title.toLowerCase().includes('engine') && !hay.match(/cardio|rameur|bike|course|hiit|condition/)) return false;
    if(title.toLowerCase().includes('mobility') && !hay.match(/mobil|bien_etre|recovery|souplesse/)) return false;
    if(focus && !hay.includes(String(focus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''))) {
      // allow broader if no exact focus match
    }
    if(focusGoals.length && !focusGoals.some(g=>hay.includes(String(g).toLowerCase()))) return Math.random() < 0.25;
    return true;
  });
}
function buildPrescription(ex, mainGoal, level, hiitFormat, rmMap, weekIndex=0, cycleGoal='hypertrophy', fatigue='medium'){
  const pat = patternFromExercise(ex);
  const progressMult = [0.92,0.96,1.00,1.04,0.88,1.02,1.06,1.10,0.90,1.03,1.07,1.12][weekIndex] || 1;
  let series='3 séries', reps='8 à 12 reps', rest='60 à 90 s', tempo='2-0-2-0', intensity='modérée', loadText='à la sensation / technique propre';
  if(mainGoal==='strength' || cycleGoal==='strength'){
    series='4 à 6 séries'; reps='3 à 6 reps'; rest='2 à 3 min'; tempo='contrôle + explosif'; intensity='élevée';
  }
  if(mainGoal==='fat_loss' || mainGoal==='conditioning'){ series='3 à 5 tours'; reps=hiitFormat || '40/20'; rest='30 à 45 s'; intensity='soutenue'; }
  if(mainGoal==='boxing'){ series='6 à 10 rounds'; reps='1 à 3 min / round'; rest='30 à 60 s'; intensity='soutenue'; }
  if(mainGoal==='hyrox'){ series='4 à 8 blocs'; reps='distance / reps ciblées'; rest='45 à 90 s'; intensity='élevée'; }
  if(mainGoal==='mobility' || mainGoal==='recovery'){ series='2 à 4 séries'; reps='30 à 60 s / drill'; rest='15 à 30 s'; intensity='douce'; tempo='respiré'; }
  if(level==='beginner' && (mainGoal==='strength' || cycleGoal==='strength')) { reps='4 à 8 reps'; series='3 à 5 séries'; }
  let loadBase = 0;
  if(pat==='squat' && rmMap.squat) loadBase = rmMap.squat * (cycleGoal==='strength' ? 0.78 : 0.67);
  if(pat==='push' && rmMap.bench) loadBase = rmMap.bench * (cycleGoal==='strength' ? 0.76 : 0.65);
  if(pat==='hinge' && rmMap.deadlift) loadBase = rmMap.deadlift * (cycleGoal==='strength' ? 0.80 : 0.68);
  if(loadBase){
    let adjusted = loadBase * progressMult * (fatigue==='high' ? 0.94 : fatigue==='low' ? 1.02 : 1);
    loadText = `${Math.max(5, Math.round(adjusted/2.5)*2.5)} kg cible approx.`;
  }
  return {series,reps,rest,tempo,intensity,loadText};
}
function buildWarmup(mainGoal, module){
  const lines = ['3 à 5 min de mise en route progressive','respiration + mobilité ciblée'];
  if(mainGoal==='boxing' || module==='boxing_prep') lines.push('corde à sauter / shadow boxing léger');
  if(mainGoal==='hyrox' || module==='hyrox_prep') lines.push('activation hanches / chevilles + locomotion');
  if(module==='trail_prep') lines.push('montée progressive cardio + mollets / pieds');
  return [...new Set(lines)];
}
function buildCooldown(mainGoal){
  const lines = ['Retour au calme 3 à 5 min','respiration lente 1 à 2 min'];
  if(['boxing','conditioning','hyrox','fat_loss','endurance'].includes(mainGoal)) lines.push('mobilité douce + baisse progressive du rythme cardiaque');
  else lines.push('étirements doux ciblés sur les zones travaillées');
  return lines;
}
function computeExercisesPerDay(duration, mainGoal, module){
  const d = Number(duration||60);
  if(module==='kids_teens') return d>=60 ? 5 : 4;
  if(['mobility','recovery'].includes(mainGoal)) return d>=60 ? 5 : 4;
  if(d>=90) return 8; if(d>=75) return 7; if(d>=60) return 6; if(d>=45) return 5; return 4;
}
function buildCycle(weeks, cycleGoal, fatigue){
  const arr = [];
  for(let i=1;i<=weeks;i++){
    const isDeload = i%4===0;
    arr.push({
      week:i,
      phase: isDeload ? 'Déload' : (i<=Math.ceil(weeks/2) ? 'Accumulation' : cycleGoal==='peak' ? 'Intensification / peaking' : 'Intensification'),
      volume: isDeload ? '-35%' : (i===1 ? 'base' : '+'+Math.min(5*(i-1),15)+'%'),
      intensity: isDeload ? 'modérée' : (cycleGoal==='strength' ? (i<weeks ? 'haute' : 'très haute') : cycleGoal==='hypertrophy' ? 'modérée à haute' : 'variable'),
      recoveryFocus: fatigue==='high' || isDeload ? 'prioritaire' : 'standard'
    });
  }
  return arr;
}
function renderBMIBox(bmi){
  if(!bmi) return '<p>Ajoute taille et poids pour calculer l’IMC réel.</p>';
  return `<div class="summary"><h4>IMC réel : ${bmi.value}</h4><p><strong>Interprétation :</strong> ${esc(bmi.label)}</p><p><strong>Lecture coach :</strong> ${esc(bmi.risk)}</p></div>`;
}
function renderNutritionBox(nutri, goal){
  if(!nutri) return '<p>Ajoute taille, poids, âge et sexe pour calculer les besoins.</p>';
  const menu = nutritionMenu(goal);
  return `<div class="summary"><h4>${nutri.kcal} kcal / jour</h4><p><strong>Pourquoi :</strong> base de départ pour cadrer l'énergie et les macros selon le profil et l'objectif. À ajuster après 2 à 3 semaines de suivi.</p><p><strong>Macros :</strong> protéines ${nutri.protein} g · glucides ${nutri.carbs} g · lipides ${nutri.fats} g</p><p><strong>Petit-déj :</strong> ${esc(menu.breakfast)}</p><p><strong>Déjeuner :</strong> ${esc(menu.lunch)}</p><p><strong>Snack :</strong> ${esc(menu.snack)}</p><p><strong>Dîner :</strong> ${esc(menu.dinner)}</p></div>`;
}
function renderCycleTimeline(cycle){
  return `<div class="cycle-grid">${cycle.map(w=>`<div class="cycle-card ${w.phase.includes('Déload')?'deload':''}"><strong>S${w.week}</strong><span>${esc(w.phase)}</span><small>Volume ${esc(w.volume)} · intensité ${esc(w.intensity)}</small></div>`).join('')}</div>`;
}
function exerciseHtml(ex, mode){
  const showCoach = mode==='coach';
  const showBeginner = mode==='beginner' || mode==='coach';
  const showIntermediate = mode==='intermediate' || mode==='coach';
  const showAdvanced = mode==='advanced' || mode==='coach';
  return `
    <div class="ex-item">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.subcategory)}</span>
        ${showCoach ? `<span class="badge">${esc(ex.level)}</span>` : ''}
        ${showCoach && ex.pattern ? `<span class="badge">${esc(ex.pattern)}</span>` : ''}
      </div>
      <strong>${esc(ex.name)}</strong><br>
      <span class="line"><strong>${esc(ex.prescription.series)}</strong> · <strong>${esc(ex.prescription.reps)}</strong> · repos <strong>${esc(ex.prescription.rest)}</strong>${showCoach || showAdvanced ? ` · tempo <strong>${esc(ex.prescription.tempo)}</strong>` : ''}</span><br>
      ${showCoach ? `Muscles : ${esc(ex.muscles)}<br>` : ''}
      ${showBeginner ? `Consigne simple : ${esc(ex.cue)}<br><em>${esc(simplifyPrescriptionText(ex.prescription))}</em><br>` : ''}
      ${(showCoach || showIntermediate) && ex.substitute ? `Substitut utile : ${esc(ex.substitute)}<br>` : ''}
      ${(showCoach || showBeginner || showIntermediate) ? `Variante facile : ${esc(ex.easy)} · Variante avancée : ${esc(ex.hard)}<br>` : ''}
      ${showCoach ? `Intensité : ${esc(ex.prescription.intensity)} · Charge : ${esc(ex.prescription.loadText)}<br>Fatigue nerveuse : ${ex.neuralFatigue || 'modérée'} · Difficulté technique : ${ex.techDifficulty || 'modérée'}` : ''}
    </div>`;
}
function displayMode(level, coachView){
  if(coachView) return 'coach';
  return level==='advanced' ? 'advanced' : level==='intermediate' ? 'intermediate' : 'beginner';
}
function renderProgram(p, coachView){
  const mode = displayMode(p.level, coachView);
  const bmi = p.bmi ? `<p><strong>IMC :</strong> ${esc(p.bmi.value)} · ${esc(p.bmi.label)}</p>` : '';
  const nutrition = p.nutrition ? `<p><strong>Nutrition :</strong> ${p.nutrition.kcal} kcal · P ${p.nutrition.protein}g · G ${p.nutrition.carbs}g · L ${p.nutrition.fats}g</p>` : '';
  const module = p.specialModule ? `<p><strong>Module FAFATRAINING :</strong> ${esc(moduleLabels[p.specialModule] || p.specialModule)}</p>` : '';
  return `
    <div class="summary">
      <h3>${esc(p.name)}</h3><p class="muted">Code adhérent : ${esc(p.code)}</p>
      <p><strong>Objectif principal :</strong> ${esc(labelForGoal(p.mainGoal))} ${p.secondGoal ? `· <strong>objectif secondaire :</strong> ${esc(labelForGoal(p.secondGoal))}`:''}</p>
      <p><strong>Niveau :</strong> ${esc(p.level)} · <strong>Fréquence :</strong> ${p.freq} / semaine · <strong>Durée :</strong> ${p.duration} min · <strong>Contexte :</strong> ${esc(ENV_LABELS[p.env] || p.env)}</p>
      ${bmi}
      ${nutrition}${p.nutrition?`<div class="mini-help"><strong>Nutrition intelligente</strong><span>Ces calories et macros donnent une base claire. Elles servent à démarrer correctement puis à ajuster selon le poids, l’énergie, la faim, la récupération et les résultats.</span></div>`:''}
      ${module}
      <p><strong>Bloc :</strong> ${p.cycleWeeks} semaines · <strong>orientation :</strong> ${esc(p.cycleGoal)}</p>
      <div class="meta">${p.warmup.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</div>${!coachView && mode==='beginner' ? `<div class="mini-help"><strong>Comment lire le programme</strong><span>Une série = un bloc de répétitions. Reps = nombre de répétitions. Repos = temps à récupérer avant de repartir.</span></div>` : ''}
      ${coachView ? `<div class="actions" style="margin-top:12px"><button class="ghost" onclick="generateShareLink()">Copier le lien adhérent</button><button class="ghost" onclick="saveForAthlete()">Enregistrer pour l’adhérent</button><button class="ghost" onclick="printProgram()">Exporter le programme en PDF</button></div>` : ''}${!coachView && mode==='beginner' ? `<div class="mini-help"><strong>Lecture simple</strong><span>Lis chaque exercice une ligne après l’autre. Fais le nombre de séries indiqué, puis le nombre de répétitions, puis récupère le temps prévu avant de repartir.</span></div>`:''}
    </div>
    <div class="panel">
      <h4>Timeline du cycle</h4>
      ${renderCycleTimeline(p.cycle)}
    </div>
    <div class="program-days">
      ${p.days.map(day=>`
        <article class="day-card">
          <h4>${esc(day.title)}</h4>
          <div class="mini-help"><strong>Pattern balance</strong><span>${esc(day.patternSummary)}</span></div>
          ${day.items.map(ex=>exerciseHtml(ex, mode)).join('')}
          <div class="cooldown-box"><strong>Retour au calme :</strong> ${p.cooldown.map(x=>esc(x)).join(' · ')}</div>
        </article>
      `).join('')}
    </div>`;
}
function generateProgram(){
  if(!validateCoachInputs()) return;
  const name = $('#clientName').value.trim() || 'Client FAFATRAINING';
  const code = ($('#clientCode').value.trim() || '').toUpperCase() || ('FT'+Math.floor(Math.random()*9000+1000));
  $('#clientCode').value = code;
  const level = $('#clientLevel').value;
  const freq = Number($('#clientFreq').value||3);
  const duration = Number($('#clientDuration').value||60);
  const env = $('#environmentSelect').value;
  const mainGoal = $('#mainGoal').value;
  const secondGoal = $('#secondGoal').value;
  const hiitFormat = $('#hiitFormat').value;
  const bodyArea = $('#bodyArea')?.value || '';
  const focusTarget = $('#focusTarget')?.value || '';
  const cycleWeeks = Number($('#cycleWeeks').value||8);
  const cycleGoal = $('#cycleGoal').value;
  const specialModule = $('#specialModule').value;
  const sleepHours = Number($('#sleepHours').value||7);
  const stressLevel = $('#stressLevel').value;
  const height = Number($('#clientHeight').value||0);
  const weight = Number($('#clientWeight').value||0);
  const sex = $('#clientSex').value;
  const age = Number($('#clientAge').value||0);
  const equipment = selectedEquipment();
  const rmMap = { squat:Number($('#rmSquat').value||0), bench:Number($('#rmBench').value||0), deadlift:Number($('#rmDeadlift').value||0) };
  const fatigue = stressLevel==='high' || sleepHours<6 ? 'high' : sleepHours>=8 && stressLevel==='low' ? 'low' : 'medium';
  const bmi = calcBMI(weight, height);
  const nutrition = calcCalories({sex, weight, height, age, goal:mainGoal, stress:stressLevel, activityFactor: 1.35 + freq*0.08});
  const blueprints = buildDayBlueprintsPremium(freq, mainGoal, secondGoal, bodyArea, focusTarget, specialModule, cycleGoal);
  const perDay = computeExercisesPerDay(duration, mainGoal, specialModule);
  const warmup = buildWarmup(mainGoal, specialModule);
  const cooldown = buildCooldown(mainGoal);
  const cycle = buildCycle(cycleWeeks, cycleGoal, fatigue);
  const usedRoots = new Set();
  const days = blueprints.map((bp, idx) => {
    let pool = filterPoolPremium(bp, env, level, equipment);
    if(!pool.length) pool = EXERCISES.filter(ex => (ex.environments||[]).includes(env));
    let chosen = [];
    const patternTargets = idx%2===0 ? ['squat','push','pull','core','engine'] : ['hinge','pull','push','core','engine'];
    for(const pattern of patternTargets){
      const bucket = pool.filter(ex => patternFromExercise(ex)===pattern);
      chosen.push(...pickUniqueFrom(bucket, 1, usedRoots));
      if(chosen.length>=perDay) break;
    }
    if(chosen.length < perDay){
      chosen.push(...pickUniqueFrom(pool, perDay-chosen.length, usedRoots));
    }
    chosen = chosen.slice(0, perDay).map(ex => {
      const pattern = patternFromExercise(ex);
      return {
        ...ex,
        pattern,
        neuralFatigue: fatigueCost(ex)>=4 ? 'élevée' : fatigueCost(ex)===3 ? 'modérée +' : 'modérée',
        techDifficulty: ex.level==='advanced' ? 'haute' : ex.level==='intermediate' ? 'moyenne' : 'accessible',
        prescription: buildPrescription(ex, mainGoal, level, hiitFormat, rmMap, idx, cycleGoal, fatigue),
        substitute: substituteText(ex, env)
      };
    });
    const patternSummary = Array.from(new Set(chosen.map(x=>x.pattern))).join(' · ');
    return {title: bp.title, items: chosen, patternSummary};
  });
  const athletePayload = encodeURIComponent(encodeSharePayload(stripProgramForShare({name, code, age, sex, height, weight, level, freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, hiitFormat, cycleWeeks, cycleGoal, specialModule, sleepHours, stressLevel, warmup, cooldown, days, rmMap, createdAt:new Date().toISOString(), bmi, nutrition, cycle})));
  const athleteLink = `${location.origin}${location.pathname}?client=${encodeURIComponent(code)}&payload=${athletePayload}`;
  const crm = {
    subStatus: $('#subStatus').value,
    payStatus: $('#payStatus').value,
    notes: $('#coachNotes').value || '',
    updatedAt: new Date().toISOString()
  };
  const program = {
    name, code, age, sex, height, weight, level, freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, hiitFormat,
    cycleWeeks, cycleGoal, specialModule, sleepHours, stressLevel, warmup, cooldown, days, rmMap, athleteLink, createdAt:new Date().toISOString(),
    bmi, nutrition, cycle, crm
  };
  window.currentProgram = program;
  $('#programOutput').innerHTML = renderProgram(program, true);
  $('#bmiOutput').innerHTML = renderBMIBox(bmi);
  $('#nutritionOutput').innerHTML = renderNutritionBox(nutrition, mainGoal);
}
function substituteText(ex, env){
  const eqs = ex.equipment || [];
  if(env==='home' || env==='bodyweight_only'){
    if(eqs.includes('barbell')) return 'Remplace la barre par haltères, sac à dos lesté ou tempo lent';
    if(eqs.includes('machine')) return 'Cherche une variante avec élastique / poids du corps';
  }
  if(env==='outdoor' && eqs.includes('bench')) return 'Utilise banc public / marche / rebord stable';
  return '';
}
function saveForAthlete(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  all[window.currentProgram.code] = window.currentProgram;
  localStorage.setItem('fafaPrograms', JSON.stringify(all));
  const crm = JSON.parse(localStorage.getItem('fafaCRM')||'{}');
  crm[window.currentProgram.code] = {name:window.currentProgram.name, ...window.currentProgram.crm, mainGoal:window.currentProgram.mainGoal};
  localStorage.setItem('fafaCRM', JSON.stringify(crm));
  alert(`Le programme ${window.currentProgram.code} est maintenant stocké côté application avec son profil, sa nutrition et son suivi coach.`);
}
function generateShareLink(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const link = window.currentProgram.athleteLink;
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(link).then(()=>alert('Lien adhérent copié.')).catch(()=>window.prompt('Copie ce lien adhérent :', link)); }
  else { window.prompt('Copie ce lien adhérent :', link); }
}
function printProgram(){ if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; } const w=window.open('','_blank'); if(!w){ alert('Autorise les fenêtres pour exporter en PDF.'); return; } w.document.open(); w.document.write(exportProgramHTML(window.currentProgram)); w.document.close(); w.focus(); setTimeout(()=>w.print(),300); }

function renderLibrary(){
  const cat = $('#libCategory').value;
  const level = $('#libLevel').value;
  const env = $('#libEnv').value;
  const q = ($('#libSearch').value||'').toLowerCase().trim();
  const lvl = {beginner:1, intermediate:2, advanced:3};
  const arr = EXERCISES.filter(ex =>
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || (ex.environments||[]).includes(env)) &&
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...(ex.tags||[]),...(ex.focus||[]),...(ex.areas||[])].join(' ').toLowerCase().includes(q))
  ).slice(0, 300);
  $('#libraryOutput').innerHTML = arr.map(ex=>{
    const pattern = patternFromExercise(ex);
    const neural = fatigueCost(ex)>=4 ? 'élevée' : fatigueCost(ex)===3 ? 'modérée +' : 'modérée';
    return `<article class="library-card">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.subcategory)}</span>
        <span class="badge">${esc(ex.level)}</span>
        <span class="badge">${esc(pattern)}</span>
      </div>
      <h4>${esc(ex.name)}</h4>
      <p><strong>Muscles :</strong> ${esc(ex.muscles)}</p>
      <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
      <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
      <p><strong>Substitution coach :</strong> ${esc(substituteText(ex, env||'home') || 'Selon matériel disponible')}</p>
      <p><strong>Biomécanique :</strong> pattern ${esc(pattern)} · fatigue nerveuse ${esc(neural)} · difficulté technique ${esc(ex.level==='advanced'?'haute':ex.level==='intermediate'?'moyenne':'accessible')}</p>
      <p><strong>Matériel :</strong> ${(ex.equipment||[]).map(eqLabel).join(' · ')}</p>
    </article>`;
  }).join('');
}

function openAthleteProgram(){
  const code = ($('#athleteCode').value||'').trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const p = all[code];
  if(!p){ alert('Aucun programme trouvé pour ce code.'); return; }
  window.athleteProgram = p;
  $('#athleteLobby').classList.add('hidden');
  $('#athleteProgram').classList.remove('hidden');
  $('#athleteDashboard').classList.remove('hidden');
  $('#athleteHistory').classList.remove('hidden');
  $('#athleteDashboard').innerHTML = renderAthleteDashboard(p);
  $('#athleteProgramOutput').innerHTML = renderProgram(p, false);
  renderAthleteHistory(p.code);
}
function renderAthleteDashboard(p){
  const adherence = getAdherenceScore(p.code);
  return `<h3>Dashboard adhérent</h3>
  <div class="tracking-summary">
    <span class="badge">Code : ${esc(p.code)}</span>
    <span class="badge">Objectif : ${esc(labelForGoal(p.mainGoal))}</span>
    <span class="badge">IMC : ${esc(p.bmi?.value || '-')}</span>
    <span class="badge">Score régularité : ${adherence}%</span>
  </div>
  <div class="mini-help"><strong>Cycle actif</strong><span>${p.cycleWeeks} semaines · ${esc(p.cycleGoal)}</span></div>
  <div class="mini-help"><strong>Nutrition</strong><span>${p.nutrition ? `${p.nutrition.kcal} kcal · P ${p.nutrition.protein}g · G ${p.nutrition.carbs}g · L ${p.nutrition.fats}g` : 'non définie'}</span></div>
  <div class="mini-help"><strong>Lecture simple</strong><span>Valide tes séances, note ta difficulté et ton RPE pour aider le coach à ajuster la suite.</span></div>`;
}
function hydrateAthleteFromLink(){
  const params = new URLSearchParams(location.search);
  const code = (params.get('client') || '').trim().toUpperCase();
  const payload = params.get('payload');
  if(payload){ const parsed = decodeSharePayload(decodeURIComponent(payload)); if(parsed?.code){ const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}'); all[parsed.code]=parsed; localStorage.setItem('fafaPrograms', JSON.stringify(all)); } }
  if(code){ goView('athlete'); $('#athleteCode').value = code; setTimeout(()=>openAthleteProgram(), 200); }
}
function backAthlete(){
  $('#athleteProgram').classList.add('hidden');
  $('#liveSession').classList.add('hidden');
  $('#athleteDashboard').classList.add('hidden');
  $('#athleteHistory').classList.add('hidden');
  $('#athleteLobby').classList.remove('hidden');
}
function startLiveSession(){
  if(!window.athleteProgram) return;
  window.liveFlat = window.athleteProgram.days.flatMap((d,dayIndex) => d.items.map((x,exIndex)=>({...x, day:d.title, dayIndex, exIndex})));
  window.liveIndex = 0;
  $('#liveSession').classList.remove('hidden');
  renderLive();
}
function renderLive(){
  const ex = window.liveFlat[window.liveIndex];
  const logs = JSON.parse(localStorage.getItem('fafaSessionLogs')||'{}');
  const key = `${window.athleteProgram.code}_${ex.dayIndex}_${ex.exIndex}`;
  const row = logs[key] || {load:'', reps:'', rpe:'', done:false, feedback:''};
  $('#liveCard').innerHTML = `
    <div class="meta"><span class="badge">${esc(ex.day)}</span><span class="badge">${esc(ex.category)}</span></div>
    <h3>${esc(ex.name)}</h3>
    <p class="big">${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</p>
    <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
    ${ex.substitute ? `<p><strong>Substitut utile :</strong> ${esc(ex.substitute)}</p>` : ''}
    <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
    <div class="form-grid">
      <label>Charge utilisée<input id="liveLoad" value="${esc(row.load)}" placeholder="ex : 60 kg"></label>
      <label>Reps réelles<input id="liveReps" value="${esc(row.reps)}" placeholder="ex : 10 / 10 / 8"></label>
      <label>RPE<select id="liveRPE">${[6,7,8,9,10].map(v=>`<option value="${v}" ${String(row.rpe)===String(v)?'selected':''}>${v}</option>`).join('')}</select></label>
      <label>Feedback séance<select id="liveFeedback"><option value="easy" ${row.feedback==='easy'?'selected':''}>Facile</option><option value="ok" ${row.feedback==='ok'?'selected':''}>OK</option><option value="hard" ${row.feedback==='hard'?'selected':''}>Trop dur</option></select></label>
    </div>
    <div class="actions"><button onclick="saveLiveExercise()">Valider l’exercice</button></div>`;
  $('#liveLog').innerHTML = `<h4>Suivi live</h4><p>Exercice ${window.liveIndex+1} / ${window.liveFlat.length}</p><p>Chaque validation alimente l’historique adhérent et le score de régularité.</p>`;
}
function saveLiveExercise(){
  const ex = window.liveFlat[window.liveIndex];
  const logs = JSON.parse(localStorage.getItem('fafaSessionLogs')||'{}');
  const key = `${window.athleteProgram.code}_${ex.dayIndex}_${ex.exIndex}`;
  logs[key] = {
    date:new Date().toLocaleDateString('fr-FR'),
    load:$('#liveLoad').value,
    reps:$('#liveReps').value,
    rpe:$('#liveRPE').value,
    feedback:$('#liveFeedback').value,
    done:true
  };
  localStorage.setItem('fafaSessionLogs', JSON.stringify(logs));
  renderAthleteHistory(window.athleteProgram.code);
  if($('#liveFeedback').value==='hard'){ adjustNextSessions(window.athleteProgram.code, -1); }
  if($('#liveFeedback').value==='easy'){ adjustNextSessions(window.athleteProgram.code, +1); }
  alert('Exercice validé.');
}
function adjustNextSessions(code, delta){
  const flags = JSON.parse(localStorage.getItem('fafaAdjustments')||'{}');
  flags[code] = (flags[code]||0) + delta;
  localStorage.setItem('fafaAdjustments', JSON.stringify(flags));
}
function nextExercise(){ if(window.liveIndex < window.liveFlat.length-1){ window.liveIndex++; renderLive(); } }
function prevExercise(){ if(window.liveIndex > 0){ window.liveIndex--; renderLive(); } }
function backProgram(){ $('#liveSession').classList.add('hidden'); }
function renderAthleteHistory(code){
  const logs = JSON.parse(localStorage.getItem('fafaSessionLogs')||'{}');
  const rows = Object.entries(logs).filter(([k])=>k.startsWith(code+'_')).map(([k,v])=>v).reverse();
  $('#athleteHistory').innerHTML = `<h3>Historique séances</h3>` + (rows.length ? rows.map(r=>`<article class="library-card"><h4>${esc(r.date)}</h4><p><strong>Charge :</strong> ${esc(r.load || '-')}</p><p><strong>Reps :</strong> ${esc(r.reps || '-')}</p><p><strong>RPE :</strong> ${esc(r.rpe || '-')}</p><p><strong>Feedback :</strong> ${esc(r.feedback || '-')}</p></article>`).join('') : '<p>Aucune validation pour le moment.</p>');
}
function getAdherenceScore(code){
  const logs = JSON.parse(localStorage.getItem('fafaSessionLogs')||'{}');
  const done = Object.entries(logs).filter(([k,v])=>k.startsWith(code+'_') && v.done).length;
  return Math.min(100, done*8);
}

function generateQuickSession(){
  const type = $('#quickType').value;
  const level = $('#quickLevel').value;
  const duration = Number($('#quickDuration').value||45);
  const env = $('#quickEnv').value;
  const pool = filterPoolPremium({title:'Quick session', focus:'', module:'', mainGoal:type, secondGoal:''}, env, level, PRESETS[env]||[]);
  const count = computeExercisesPerDay(duration, type, '');
  const chosen = pickUniqueFrom(pool, count, new Set()).map(ex=>({...ex, prescription: buildPrescription(ex, type, level, '40/20', {squat:0, bench:0, deadlift:0}, 0, 'conditioning', 'medium')}));
  $('#quickOutput').innerHTML = `<div class="summary"><h3>Session rapide ${esc(labelForGoal(type))}</h3><p>${duration} min · ${esc(ENV_LABELS[env])}</p></div>` + chosen.map(ex=>exerciseHtml(ex, 'coach')).join('');
}
function saveTracking(){
  const code = ($('#trackCode').value||'').trim().toUpperCase();
  const weight = $('#trackWeight').value;
  const note = $('#trackNote').value;
  const waist = $('#trackWaist').value;
  const energy = $('#trackEnergy').value;
  if(!code){ alert('Ajoute un code.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  all[code] = all[code] || [];
  all[code].push({date:new Date().toLocaleDateString('fr-FR'), weight, note, waist, energy});
  localStorage.setItem('fafaTracking', JSON.stringify(all));
  loadTracking();
}
function lineSvg(points, width=520, height=180){
  if(!points.length) return '<p>Pas assez de données.</p>';
  const vals = points.map(p=>Number(p.y)).filter(v=>!Number.isNaN(v));
  if(!vals.length) return '<p>Pas assez de données.</p>';
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max-min) || 1;
  const coords = points.map((p,i)=>{
    const x = 20 + (i*(width-40)/Math.max(1, points.length-1));
    const y = height-20 - ((Number(p.y)-min)/range)*(height-40);
    return [x,y];
  });
  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg"><polyline fill="none" stroke="currentColor" stroke-width="3" points="${coords.map(c=>c.join(',')).join(' ')}" /></svg>`;
}
function loadTracking(){
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  const rows = Object.entries(all).flatMap(([code,items]) => items.map(it=>({code,...it}))).reverse();
  const totalClients = Object.keys(all).length;
  const totalEntries = rows.length;
  $('#trackingOutput').innerHTML = `<div class="tracking-summary"><span class="badge">Clients suivis : ${totalClients}</span><span class="badge">Entrées de suivi : ${totalEntries}</span></div>` + rows.map(r=>`<article class="library-card"><h4>${esc(r.code)}</h4><p><strong>Date :</strong> ${esc(r.date)}</p><p><strong>Poids :</strong> ${esc(r.weight || '-')} kg</p><p><strong>Taille :</strong> ${esc(r.waist || '-')} cm</p><p><strong>Énergie :</strong> ${esc(r.energy || '-')} /10</p><p><strong>Note :</strong> ${esc(r.note || '')}</p></article>`).join('');
  const firstCode = $('#trackCode')?.value?.trim().toUpperCase() || Object.keys(all)[0];
  renderAnalytics(firstCode, all[firstCode] || []);
}
function renderAnalytics(code, entries){
  const weights = entries.filter(x=>x.weight).map((x,i)=>({x:i,y:Number(x.weight)}));
  const waists = entries.filter(x=>x.waist).map((x,i)=>({x:i,y:Number(x.waist)}));
  const avgEnergy = entries.filter(x=>x.energy).map(x=>Number(x.energy));
  const consistency = Math.min(100, entries.length*8);
  $('#analyticsOutput').innerHTML = `<h3>Analytics visuels ${code ? '· '+esc(code) : ''}</h3>
    <div class="tracking-summary">
      <span class="badge">Score régularité : ${consistency}%</span>
      <span class="badge">Énergie moyenne : ${avgEnergy.length ? (avgEnergy.reduce((a,b)=>a+b,0)/avgEnergy.length).toFixed(1) : '-'}/10</span>
      <span class="badge">Tendance fatigue : ${avgEnergy.length ? ((avgEnergy.reduce((a,b)=>a+b,0)/avgEnergy.length) < 6 ? 'à surveiller' : 'correcte') : 'pas assez de données'}</span>
    </div>
    <div class="coach-grid premium-grid">
      <div class="panel"><h4>Progression poids</h4>${lineSvg(weights)}</div>
      <div class="panel"><h4>Progression tour de taille</h4>${lineSvg(waists)}</div>
    </div>`;
}
init();
