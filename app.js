
const LEVEL_LABELS = {beginner:'Débutant', intermediate:'Intermédiaire', advanced:'Avancé'};
const CYCLE_LABELS = {hypertrophy:'Hypertrophie', strength:'Force', conditioning:'Conditionnement', peak:'Peaking', maintenance:'Maintien'};
function labelForLevel(v){ return LEVEL_LABELS[v] || v; }
function labelForCycle(v){ return CYCLE_LABELS[v] || v; }

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
  home:'Maison / appartement', outdoor:'Extérieur', bodyweight_only:'Poids du corps uniquement', travel:'Voyage / déplacement', beach:'Plage / sable', video_coaching:'Visiocoaching uniquement'
};
const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','treadmill','bike','elliptical','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles','towel'],
  travel:['bodyweight','band','mini_band','mat','chair','backpack','towel','jump_rope_speed'],
  beach:['bodyweight','band','mini_band','rope','cones','timer','mat'],
  video_coaching:['bodyweight','mat','band','mini_band','dumbbell','chair','timer']
};
const goalLabels = {
  muscle_gain:'Prise de muscle', fat_loss:'Perte de poids', strength:'Force', conditioning:'Condition physique / HIIT',
  boxing:'Boxe', hyrox:'Hyrox / fonctionnel', endurance:'Cardio / endurance', mobility:'Mobilité / souplesse',
  recovery:'Bien-être / récupération', core:'Abdos / gainage'
};
const moduleLabels = {
  boxing_prep:'Prépa boxe', hyrox_prep:'Prépa Hyrox', trail_prep:'Prépa Trail', return_to_play:'Réathlétisation',
  seniors_health:'Séniors / santé', kids_teens:'Kids / ados', express_fat_loss:'Perte de poids express', transformation:'Challenge transformation', combat_conditioning:'Conditionnement combat', posture_core:'Posture / core', fitness_reset:'Remise en route santé'
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
    cycleWeeks:p.cycleWeeks, cycleGoal:p.cycleGoal, specialModule:p.specialModule,
    warmup:p.warmup, cooldown:p.cooldown,
    days:(p.days||[]).map(day=>({
      title:day.title,
      patternSummary:day.patternSummary,
      items:(day.items||[]).map(ex=>({
        name:ex.name, category:ex.category, muscles:ex.muscles, cue:ex.cue,
        prescription:ex.prescription, substitute:ex.substitute
      }))
    })),
    bmi:p.bmi, nutrition:p.nutrition, cycle:p.cycle
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
  renderFoodBank();
  renderBookingList();
  renderBusinessCenter();
  renderHomeEnhancements();
  bindCoachSmartSync();
}




function bindCoachSmartSync(){
  const autoFill = ()=>{
    const prefs = getMultiValues('trainingPreference');
    const sport = $('#currentSport')?.value || '';
    const level = $('#clientLevel')?.value || '';
    const avail = $('#availabilityWeekly')?.value || '';
    const main = $('#mainGoal')?.value || '';
    const medFlag = $('#medicalFlag')?.value || '';
    const medKnown = getMultiValues('medicalKnown');
    const injuryKnown = getMultiValues('injuryKnown');
    const envSel = $('#environmentSelect');
    if(envSel && !envSel.value){
      if(prefs.includes('gym')) envSel.value = 'gym';
      else if(prefs.includes('outdoor')) envSel.value = 'outdoor';
      else if(prefs.includes('home')) envSel.value = 'home';
      else if(prefs.includes('video')) envSel.value = 'video_coaching';
      applyEquipmentPreset();
    }
    const cycleMap = {
      fat_loss:['conditioning','maintenance'],
      muscle_gain:['hypertrophy'],
      recomposition:['hypertrophy','conditioning'],
      strength:['strength'],
      conditioning:['conditioning'],
      boxing:['conditioning','peak'],
      hyrox:['conditioning','peak'],
      endurance:['conditioning'],
      mobility:['maintenance','technical'],
      recovery:['rehab','maintenance'],
      fitness_general:['maintenance','conditioning'],
      explosiveness:['peak','technical'],
      athleticism:['technical','mixed'],
      posture:['technical','maintenance'],
      combat_conditioning:['conditioning','peak']
    };
    if(main && !getMultiValues('cycleGoal').length) setMultiValues('cycleGoal', cycleMap[main] || ['maintenance']);
    const moduleSet = new Set(getMultiValues('specialModule'));
    if(sport==='boxing' || main==='boxing' || main==='combat_conditioning') moduleSet.add('boxing_prep');
    if(sport==='running' || main==='endurance') moduleSet.add('trail_prep');
    if(main==='hyrox' || sport==='gym') moduleSet.add('hyrox_prep');
    if(main==='fat_loss') moduleSet.add('express_fat_loss');
    if(main==='posture') moduleSet.add('posture_core');
    if(main==='fitness_general') moduleSet.add('fitness_reset');
    if(medFlag==='yes' || medKnown.length || injuryKnown.length) moduleSet.add('return_to_play');
    if(moduleSet.size) setMultiValues('specialModule', Array.from(moduleSet));
    const coachSet = new Set(getMultiValues('coachingType'));
    if(main==='boxing' || sport==='boxing') coachSet.add('boxing');
    if(main==='recovery' || medFlag==='yes' || medKnown.length || injuryKnown.length) coachSet.add('health');
    if(main==='mobility' || main==='posture') coachSet.add('stretching');
    if(['fat_loss','conditioning','hyrox','muscle_gain','strength','fitness_general','athleticism'].includes(main)) coachSet.add('fitness');
    if(['strength','hyrox','boxing','endurance','combat_conditioning'].includes(main)) coachSet.add('performance');
    coachSet.add('general');
    setMultiValues('coachingType', Array.from(coachSet));
    const liveSet = new Set(getMultiValues('liveMode'));
    if(prefs.includes('video')) liveSet.add('video');
    if(prefs.includes('gym')) liveSet.add('gym');
    if(prefs.includes('outdoor')) liveSet.add('outdoor');
    setMultiValues('liveMode', Array.from(liveSet));
    const duration = $('#clientDuration');
    const freq = $('#clientFreq');
    if(duration && !duration.value){
      duration.value = level==='beginner' ? '45' : level==='advanced' ? '75' : '60';
    }
    if(freq && !freq.value){
      freq.value = avail==='1' ? '2' : avail==='2-3' ? '3' : avail==='4-5' ? '4' : avail==='6+' ? '5' : (level==='beginner' ? '3' : '4');
    }
  };
  ['trainingPreference','currentSport','mainGoal','medicalFlag','availabilityWeekly','clientLevel','medicalKnown','injuryKnown','foodKnown'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', autoFill);
  });
  autoFill();
}








function collectOnboarding(){
  return {
    email: ($('#clientEmail')?.value||'').trim(),
    activityLevel: $('#activityLevel')?.value || '',
    currentSport: $('#currentSport')?.value || '',
    coachingExperience: $('#coachingExperience')?.value || '',
    availabilityWeekly: $('#availabilityWeekly')?.value || '',
    trainingPreference: getMultiValues('trainingPreference'),
    medicalFlag: $('#medicalFlag')?.value || '',
    medicalKnown: getMultiValues('medicalKnown'),
    medicalNotes: ($('#medicalNotes')?.value||'').trim(),
    injuryKnown: getMultiValues('injuryKnown'),
    injuryNotes: ($('#injuryNotes')?.value||'').trim(),
    medicationNotes: ($('#medicationNotes')?.value||'').trim(),
    foodFlag: $('#foodFlag')?.value || '',
    foodKnown: getMultiValues('foodKnown'),
    foodNotes: ($('#foodNotes')?.value||'').trim(),
    coachingType: getMultiValues('coachingType'),
    liveMode: getMultiValues('liveMode')
  };
}


function activityFactorFromProfile(level, freq){
  const map = {sedentary:1.2, moderate:1.4, active:1.55, very_active:1.7};
  const base = map[level] || (1.3 + Number(freq||0)*0.08);
  return Math.min(1.9, Math.max(1.2, base));
}


function activityLabel(v){ return {sedentary:'Sédentaire',moderate:'Modéré',active:'Actif',very_active:'Très actif'}[v] || v || ''; }
function sportLabel(v){ return {none:'Aucune activité régulière',running:'Course à pied',gym:'Salle de sport',boxing:'Boxe',strength:'Renforcement musculaire',other:'Autre'}[v] || v || ''; }
function coachingTypeLabel(v){ return {general:'Coaching sportif général',health:'Coaching santé / rééducation',fitness:'Coaching fitness',boxing:'Coaching boxe',nutrition:'Conseil nutritionnel',stretching:'Coaching stretching'}[v] || v || ''; }
function prefLabel(v){ return {home:'Maison',gym:'Salle',outdoor:'Extérieur',video:'Visioconférence',any:'Peu importe'}[v] || v || ''; }
function liveModeLabel(v){ return {none:'Aucun',video:'Visioconférence',outdoor:'Présentiel extérieur',gym:'Présentiel en salle'}[v] || v || ''; }

function renderFoundationSummary(p){
  const ob = p.onboarding || {};
  const body = p.bodyComp;
  const alerts = [];
  if(ob.medicalFlag==='yes' && ob.medicalNotes) alerts.push(`Pathologies : ${esc(ob.medicalNotes)}`);
  if(ob.injuryNotes) alerts.push(`Blessures / douleurs : ${esc(ob.injuryNotes)}`);
  if(ob.medicationNotes) alerts.push(`Médicaments : ${esc(ob.medicationNotes)}`);
  if(ob.foodFlag==='yes' && ob.foodNotes) alerts.push(`Alimentation / allergies : ${esc(ob.foodNotes)}`);
  return `<div class="panel">
    <h3>Résumé onboarding premium</h3>
    <div class="onboarding-summary">
      <div class="summary"><h4>${esc(activityLabel(ob.activityLevel) || 'non renseigné')}</h4><p>activité physique</p></div>
      <div class="summary"><h4>${esc(sportLabel(ob.currentSport) || 'non renseigné')}</h4><p>sport actuel</p></div>
      <div class="summary"><h4>${esc(coachingTypeLabel(ob.coachingType) || 'non renseigné')}</h4><p>type de coaching</p></div>
      <div class="summary"><h4>${esc(prefLabel(ob.trainingPreference) || 'non renseigné')}</h4><p>préférence pratique</p></div>
      <div class="summary"><h4>${esc(liveModeLabel(ob.liveMode) || 'aucun')}</h4><p>coaching live</p></div>
      <div class="summary"><h4>${body ? esc(body.band) : 'à estimer'}</h4><p>lecture morpho-coach</p></div>
    </div>
    <p class="helper">${body ? esc(body.coach) : 'Complète le profil pour enrichir les recommandations.'}</p>
    ${alerts.length ? `<div class="mini-help"><strong>Points à respecter :</strong><span>${alerts.join(' · ')}</span></div>` : ''}
  </div>`;
}

function renderAthleteCalendar(p){
  const names = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const freq = Number(p.freq||0);
  const activeDays = Array.from({length:7}, (_,i)=> i<freq);
  const html = `<h3>Calendrier d'entraînement</h3><div class="calendar-grid">${names.map((n,i)=>`<div class="day-cell"><strong>${n}</strong>${activeDays[i] ? 'Séance prévue' : 'Récupération / mobilité'}</div>`).join('')}</div>`;
  if($('#athleteCalendar')){ $('#athleteCalendar').classList.remove('hidden'); $('#athleteCalendar').innerHTML = html; }
}
function renderAthleteHabits(p){
  const nutr = p.nutrition ? `${p.nutrition.kcal} kcal` : 'non défini';
  const html = `<h3>Habitudes & repères</h3>
    <div class="habit-grid">
      <div class="habit-card"><strong>Hydratation</strong><p>Objectif : 2 à 3 L / jour selon le volume d'effort.</p></div>
      <div class="habit-card"><strong>Sommeil</strong><p>Repère profil : ${esc(String(p.sleepHours || '-'))} h / nuit.</p></div>
      <div class="habit-card"><strong>Nutrition</strong><p>${esc(nutr)} · objectif ${esc(labelForGoal(p.mainGoal))}</p></div>
      <div class="habit-card"><strong>Feedback séance</strong><p>Note ton RPE, ton énergie et ton ressenti pour ajuster la suite.</p></div>
    </div>`;
  if($('#athleteHabits')){ $('#athleteHabits').classList.remove('hidden'); $('#athleteHabits').innerHTML = html; }
}



function renderHomeEnhancements(){
  const programs = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const tracking = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  const business = JSON.parse(localStorage.getItem('fafaBusiness')||'{}');
  const bookings = JSON.parse(localStorage.getItem('fafaBookings')||'{}');
  const codes = Object.keys(programs);
  const activeClients = Object.values(business).filter(x=>x.status==='actif').length || codes.length;
  const revenue = Object.values(business).reduce((a,b)=>a + Number(b.amount||0), 0);
  if($('#homeClientCount')) $('#homeClientCount').textContent = String(activeClients);
  if($('#homeProgramCount')) $('#homeProgramCount').textContent = String(codes.length);
  if($('#homeRevenue')) $('#homeRevenue').textContent = `${Math.round(revenue)} €`;
  const dueSoon = Object.values(business).filter(v=>v.renewal && ((new Date(v.renewal)-new Date())/86400000) >=0 && ((new Date(v.renewal)-new Date())/86400000)<=7).length;
  const bookingCount = Object.values(bookings).flat().length;
  const tracked = Object.values(tracking).flat();
  const avgEnergy = tracked.filter(x=>x.energy).map(x=>Number(x.energy));
  const avg = avgEnergy.length ? (avgEnergy.reduce((a,b)=>a+b,0)/avgEnergy.length).toFixed(1) : '-';
  const html = `
    <div class="panel dashboard-panel">
      <h3>Dashboard Coach Fafa</h3>
      <div class="dashboard-kpi">
        <div class="kpi"><strong>${codes.length}</strong><span>programmes enregistrés</span></div>
        <div class="kpi"><strong>${activeClients}</strong><span>clients actifs</span></div>
        <div class="kpi"><strong>${dueSoon}</strong><span>échéances proches</span></div>
        <div class="kpi"><strong>${bookingCount}</strong><span>sessions live planifiées</span></div>
      </div>
      <div class="summary-grid-premium" style="margin-top:14px">
        <div class="summary"><h4>${Math.round(revenue)} €</h4><p>CA déclaré</p></div>
        <div class="summary"><h4>${avg}/10</h4><p>énergie moyenne</p></div>
        <div class="summary"><h4>${EXERCISES.length}</h4><p>exercices / variantes</p></div>
        <div class="summary"><h4>centralisé</h4><p>écosystème coach</p></div>
      </div>
    </div>`;
  if($('#studioHomeDashboard')) $('#studioHomeDashboard').innerHTML = html;
}





function buildEquipmentGrid(){
  const labels = EQUIPMENTS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
  $('#equipmentGrid').innerHTML = `
    <label>Bibliothèque matériel
      <select id="equipmentMulti" multiple size="18">${labels}</select>
    </label>
    <div class="select-note">Astuce : sélectionne seulement le matériel vraiment disponible. Le moteur utilisera ensuite les substitutions adaptées.</div>`;
  const syncEnv = ()=>{
    const txt = $('#environmentSelect').selectedOptions[0]?.textContent || 'Aucun contexte';
    if($('#presetStatus')) $('#presetStatus').textContent = `Contexte choisi : ${txt}`;
    if($('#presetLabel')) $('#presetLabel').textContent = `Contexte choisi : ${txt}`;
  };
  $('#environmentSelect')?.addEventListener('change', syncEnv);
  syncEnv();
}




function applyEquipmentPreset(){
  const env = $('#environmentSelect').value;
  const preset = PRESETS[env] || [];
  const select = document.getElementById('equipmentMulti');
  if(select){
    Array.from(select.options).forEach(opt => opt.selected = preset.includes(opt.value));
  }
  const label = $('#presetLabel');
  const status = $('#presetStatus');
  const txt = preset.length ? `Pré-sélection appliquée : ${preset.length} éléments. Tu peux ensuite compléter ou retirer librement.` : 'Aucun préremplissage automatique.';
  if(label) label.textContent = txt;
  if(status) status.textContent = txt;
}



function buildLibraryFilters(){
  const cats = [''].concat([...new Set(EXERCISES.map(e=>e.category).filter(Boolean))].sort());
  $('#libCategory').innerHTML = cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML = [''].concat(Object.keys(ENV_LABELS)).map(v=>`<option value="${v}">${v ? ENV_LABELS[v] : 'Tous les lieux'}</option>`).join('');
}

function selectedEquipment(){ return Array.from(document.getElementById('equipmentMulti')?.selectedOptions || []).map(o=>o.value); }

function getMultiValues(id){
  const el = document.getElementById(id);
  if(!el) return [];
  return Array.from(el.selectedOptions || []).map(o=>o.value).filter(Boolean);
}
function setMultiValues(id, values){
  const el = document.getElementById(id);
  if(!el) return;
  const set = new Set(values || []);
  Array.from(el.options || []).forEach(opt => opt.selected = set.has(opt.value));
}
function niceJoin(arr){
  return (arr || []).filter(Boolean).join(', ');
}



function calcBMI(weightKg,heightCm,meta={}){
  const h = Number(heightCm)/100;
  if(!weightKg || !h) return null;
  const bmi = Number(weightKg)/(h*h);
  let label='Poids normal', risk='profil standard';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
  else if(bmi < 35){ label='IMC élevé'; risk='lecture à nuancer selon composition corporelle'; }
  else { label='IMC très élevé'; risk='approche santé prioritaire'; }
  if((meta.activityLevel==='very_active' || meta.activityLevel==='active') && meta.level==='advanced' && bmi >= 27){
    label = 'IMC élevé à interpréter avec prudence';
    risk = 'profil potentiellement très musclé : complète avec tour de taille, photos, mesures et contexte sportif';
  }
  return {value:bmi.toFixed(1), label, risk};
}
){
  const h = Number(heightCm)/100;
  if(!weightKg || !h) return null;
  const bmi = Number(weightKg)/(h*h);
  let label='Poids normal', risk='profil standard';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
  else if(bmi < 35){ label='IMC élevé'; risk='lecture à nuancer selon composition corporelle'; }
  else { label='IMC très élevé'; risk='approche santé prioritaire'; }
  if((meta.activityLevel==='very_active' || meta.activityLevel==='active') && meta.level==='advanced' && bmi >= 27){
    label = 'IMC élevé à interpréter avec prudence';
    risk = 'profil potentiellement très musclé : compléter avec mensurations, tour de taille et ressenti terrain';
  }
  return {value:bmi.toFixed(1), label, risk};
}

function calcTDEE(profile){ return calcCalories(profile); }
function estimateBodyComposition({sex, bmi, activityLevel}){
  if(!bmi) return null;
  const v = Number(bmi.value||bmi);
  let band = v<18.5 ? 'profil léger / surveiller les apports' : v<25 ? 'profil équilibré de base' : v<30 ? 'profil à recomposer' : 'profil santé prioritaire';
  let coach = activityLevel==='sedentary' ? 'Remonter progressivement le volume global.' : activityLevel==='very_active' ? 'Surveiller récupération et charge totale.' : 'Ajuster selon assiduité et récupération.';
  return {band, coach};
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
  if(!$('#activityLevel').value){ alert('Choisis le niveau d’activité physique.'); return false; }
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
  const deloadEvery = weeks >= 8 ? 4 : weeks >= 6 ? 3 : 0;
  for(let i=1;i<=weeks;i++){
    const isDeload = deloadEvery ? i % deloadEvery === 0 : false;
    const phase =
      isDeload ? 'Déload / récupération' :
      i <= Math.ceil(weeks*0.4) ? 'Accumulation technique' :
      i <= Math.ceil(weeks*0.75) ? (cycleGoal==='strength' ? 'Intensification force' : cycleGoal==='hypertrophy' ? 'Montée en volume' : 'Développement spécifique') :
      cycleGoal==='peak' ? 'Peaking / affûtage' : 'Consolidation';
    const volume =
      isDeload ? '-35%' :
      i===1 ? 'base' :
      i<=Math.ceil(weeks*0.4) ? '+5%' :
      i<=Math.ceil(weeks*0.75) ? '+8%' :
      '+3%';
    const intensity =
      isDeload ? 'modérée' :
      cycleGoal==='strength' ? (i<weeks ? 'haute' : 'très haute') :
      cycleGoal==='hypertrophy' ? (i<weeks ? 'modérée à haute' : 'haute') :
      cycleGoal==='conditioning' ? 'variable et soutenue' :
      'contrôlée';
    const coachNote =
      isDeload ? 'Semaine pour faire redescendre la fatigue, garder la technique et repartir plus propre.' :
      fatigue==='high' ? 'Surveille la récupération, le sommeil et évite de forcer à l’échec.' :
      'Progression normale, technique propre et marge de sécurité.';
    arr.push({week:i, phase, volume, intensity, recoveryFocus: fatigue==='high' || isDeload ? 'prioritaire' : 'standard', coachNote});
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
  const why = goal==='fat_loss' ? 'Déficit modéré pour perdre sans détruire l’énergie.' :
              goal==='muscle_gain' ? 'Léger surplus pour construire sans prise de gras excessive.' :
              goal==='conditioning' ? 'Assez d’énergie pour tenir le volume et récupérer.' :
              'Base de maintien ajustable selon le ressenti, le poids et la régularité.';
  return `<div class="summary"><h4>${nutri.kcal} kcal / jour</h4>
    <p><strong>Pourquoi ce cadre :</strong> ${why}</p>
    <p><strong>Macros :</strong> protéines ${nutri.protein} g · glucides ${nutri.carbs} g · lipides ${nutri.fats} g</p>
    <div class="export-chip">Petit-déj · ${esc(menu.breakfast)}</div>
    <div class="export-chip">Déjeuner · ${esc(menu.lunch)}</div>
    <div class="export-chip">Snack · ${esc(menu.snack)}</div>
    <div class="export-chip">Dîner · ${esc(menu.dinner)}</div>
    <p class="pdf-note">Lecture coach : point de départ à ajuster après 2 à 3 semaines selon poids, faim, énergie et assiduité.</p>
  </div>`;
}

function renderCycleTimeline(cycle){
  return `<div class="cycle-grid">${cycle.map(w=>`<button class="cycle-card ${w.phase.includes('Déload')?'deload':''}" onclick="showCycleWeek(${w.week}, '${esc(w.phase)}', '${esc(w.volume)}', '${esc(w.intensity)}')"><strong>S${w.week}</strong><span>${esc(w.phase)}</span><small>Volume ${esc(w.volume)} · intensité ${esc(w.intensity)}</small></button>`).join('')}</div>`;
}

function showCycleWeek(week, phase, volume, intensity){
  const el = document.getElementById('cycleInfo');
  const cards = document.querySelectorAll('.cycle-card');
  cards.forEach(btn=>btn.classList.remove('active-week'));
  const active = Array.from(cards).find(btn=>btn.textContent.includes(`S${week}`));
  if(active) active.classList.add('active-week');
  const all = window.currentProgram?.cycle || [];
  const meta = all.find(x=>x.week===Number(week));
  if(el) el.innerHTML = `<strong>Semaine ${week}</strong><span>Phase : ${phase} · volume ${volume} · intensité ${intensity}. ${meta?.coachNote || 'Cette semaine sert à organiser la progression sans surcharger inutilement.'}</span>`;
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
        ${showCoach ? `<span class="badge">${esc(labelForLevel(ex.level))}</span>` : ''}
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
  const nutrition = p.nutrition ? `<p><strong>Nutrition :</strong> ${p.nutrition.kcal} kcal · Protéines ${p.nutrition.protein}g · Glucides ${p.nutrition.carbs}g · Lipides ${p.nutrition.fats}g</p>` : '';
  const mods = (p.specialModules || (p.specialModule?[p.specialModule]:[])).map(x=>moduleLabels[x] || x).join(' · ');
  const weekly = (p.days||[]).map(d=>`<span class="badge">${esc(d.title)}</span>`).join('');
  return `
    <div class="program-header-grid">
      <div class="program-kpi"><strong>${esc(labelForGoal(p.mainGoal))}</strong><span>objectif principal</span></div>
      <div class="program-kpi"><strong>${p.freq}/sem</strong><span>fréquence</span></div>
      <div class="program-kpi"><strong>${p.duration} min</strong><span>durée séance</span></div>
      <div class="program-kpi"><strong>${p.cycleWeeks} sem</strong><span>cycle</span></div>
    </div>
    <div class="panel">
      <h3>Lecture coach</h3>
      ${bmi}
      ${nutrition}
      <p><strong>Contexte :</strong> ${esc(labelForEnv(p.env) || p.env)}</p>
      ${mods ? `<p><strong>Modules FAFATRAINING :</strong> ${esc(mods)}</p>` : ''}
      ${p.restrictionsSummary ? `<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictionsSummary)}</p>` : ''}
      <div class="tracking-summary">${weekly}</div>
    </div>
    <div class="cards">${(p.days||[]).map(day=>`
      <article class="day-card">
        <div class="meta"><span class="badge">${esc(day.title)}</span>${day.patternSummary?`<span class="badge">${esc(day.patternSummary)}</span>`:''}</div>
        <h4>${esc(day.theme || day.title)}</h4>
        ${(day.items||[]).map(ex=>`
          <div class="ex-card">
            <strong>${esc(ex.name)}</strong>
            <p>${typeof ex.prescription==='string' ? esc(ex.prescription) : `${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}`}</p>
            <p class="helper">${esc(ex.cue || '')}</p>
            ${coachView && ex.substitute ? `<p class="helper"><strong>Substitution :</strong> ${esc(ex.substitute)}</p>` : ''}
          </div>`).join('')}
      </article>`).join('')}
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
  const secondGoals = getMultiValues('secondGoal');
  const secondGoal = secondGoals[0] || '';
  const hiitFormats = getMultiValues('hiitFormat');
  const hiitFormat = hiitFormats[0] || '';
  const bodyArea = $('#bodyArea')?.value || '';
  const focusTargets = getMultiValues('focusTarget');
  const focusTarget = focusTargets[0] || '';
  const cycleWeeks = Number($('#cycleWeeks').value||8);
  const cycleGoals = getMultiValues('cycleGoal');
  const cycleGoal = cycleGoals[0] || 'maintenance';
  const specialModules = getMultiValues('specialModule');
  const specialModule = specialModules[0] || '';
  const sleepHours = Number($('#sleepHours').value||7);
  const stressLevel = $('#stressLevel').value;
  const height = Number($('#clientHeight').value||0);
  const weight = Number($('#clientWeight').value||0);
  const sex = $('#clientSex').value;
  const age = Number($('#clientAge').value||0);
  const equipment = selectedEquipment();
  const onboarding = collectOnboarding();
  const rmMap = { squat:Number($('#rmSquat').value||0), bench:Number($('#rmBench').value||0), deadlift:Number($('#rmDeadlift').value||0) };
  const fatigue = stressLevel==='high' || sleepHours<6 ? 'high' : sleepHours>=8 && stressLevel==='low' ? 'low' : 'medium';
  const bmi = calcBMI(weight, height, {activityLevel:onboarding.activityLevel, level});
  const tdee = calcTDEE({sex, weight, height, age, goal:mainGoal, stress:stressLevel, activityFactor:activityFactorFromProfile(onboarding.activityLevel, freq)});
  const bodyComp = estimateBodyComposition({sex, bmi, activityLevel:onboarding.activityLevel});
  const days = buildProgramDaysPremium({freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, module:specialModule, level, equipment, rmMap, cycleGoal, hiitFormat, fatigue});
  const cycle = buildCycle(cycleWeeks, cycleGoal, fatigue);
  const nutrition = tdee ? {...tdee} : null;
  const athletePayload = encodeSharePayload(compactProgramForShare({name, code, age, sex, height, weight, level, freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, hiitFormat, cycleWeeks, cycleGoal, specialModule, sleepHours, stressLevel, warmup:'Standard', cooldown:'Standard', days, rmMap, createdAt:new Date().toISOString(), bmi, nutrition, cycle, onboarding, bodyComp, restrictionsSummary: collectRestrictionsSummary()}));
  const athleteLink = `${location.origin}${location.pathname}?client=${encodeURIComponent(code)}&payload=${encodeURIComponent(athletePayload)}`;
  const crm = {
    subStatus: $('#subStatus')?.value || '',
    payStatus: $('#payStatus')?.value || '',
    notes: $('#coachNotes')?.value || '',
    updatedAt: new Date().toISOString()
  };
  const program = {
    name, code, age, sex, height, weight, level, freq, duration, env, mainGoal, secondGoal, secondGoals,
    bodyArea, focusTarget, focusTargets, hiitFormat, hiitFormats, cycleWeeks, cycleGoal, cycleGoals,
    specialModule, specialModules, sleepHours, stressLevel, warmup:'Standard', cooldown:'Standard',
    days, rmMap, athleteLink, createdAt:new Date().toISOString(), bmi, nutrition, cycle, crm, onboarding, bodyComp,
    restrictionsSummary: collectRestrictionsSummary()
  };
  window.currentProgram = program;
  window.latestProgram = program;
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  all[code] = program;
  localStorage.setItem('fafaPrograms', JSON.stringify(all));
  $('#coachOutput').innerHTML = renderProgram(program, true);
  renderAnalytics(code, JSON.parse(localStorage.getItem('fafaTracking')||'{}')[code] || []);
}



function bindCoachSmartSync(){
  const envSel = $('#environmentSelect');
  const prefSel = $('#trainingPreference');
  const sportSel = $('#currentSport');
  const moduleSel = $('#specialModule');
  const coachingType = $('#coachingType');
  const mainGoal = $('#mainGoal');
  const cycleGoal = $('#cycleGoal');
  if(prefSel && envSel){
    prefSel.addEventListener('change', ()=>{
      if(!envSel.value && prefSel.value && prefSel.value!=='any' && ['home','gym','outdoor','video'].includes(prefSel.value)){
        envSel.value = prefSel.value==='video' ? 'hybrid' : prefSel.value;
        applyEquipmentPreset();
      }
    });
  }
  if(sportSel && moduleSel){
    sportSel.addEventListener('change', ()=>{
      const map = {boxing:'boxing', running:'trail', gym:'hyrox', strength:'transformation'};
      if(!moduleSel.value && map[sportSel.value]) moduleSel.value = map[sportSel.value];
    });
  }
  if(mainGoal && cycleGoal){
    mainGoal.addEventListener('change', ()=>{
      const map = {fat_loss:'conditioning', muscle_gain:'hypertrophy', strength:'strength', health:'maintenance', endurance:'conditioning'};
      if(map[mainGoal.value]) cycleGoal.value = map[mainGoal.value];
    });
  }
  if(mainGoal && coachingType){
    mainGoal.addEventListener('change', ()=>{
      if(!coachingType.value){
        coachingType.value = mainGoal.value==='health' ? 'health' : mainGoal.value==='boxing' ? 'boxing' : 'general';
      }
    });
  }
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
  alert(`Le programme ${window.currentProgram.code} est enregistré côté application. L’adhérent pourra l’ouvrir avec son code ou avec le lien direct.`);
}


function generateShareLink(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const link = window.currentProgram.athleteLink;
  const out = document.getElementById('programOutput');
  if(out && !document.getElementById('shareLinkCard')){
    out.insertAdjacentHTML('afterbegin', `<div class="panel" id="shareLinkCard" style="margin-bottom:12px"><h4>Lien adhérent</h4><p class="helper">Lien direct à copier et envoyer par mail, SMS ou WhatsApp.</p><div class="copybox">${esc(link)}</div><div id="copyBadge" class="copy-badge">Prêt à copier</div></div>`);
  }
  const badge = document.getElementById('copyBadge');
  const done = ()=>{ if(badge){ badge.textContent = 'Copié'; badge.classList.add('copied'); } };
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(link).then(done).catch(()=>window.prompt('Copie ce lien adhérent :', link));
  } else {
    window.prompt('Copie ce lien adhérent :', link);
    done();
  }
}





function printProgram(){
  if(!window.latestProgram){ alert('Génère d’abord un programme.'); return; }
  const p = window.latestProgram;
  const file = `${(p.code||'programme').toUpperCase()}_FAFATRAINING.pdf`;
  if(window.jspdf && window.jspdf.jsPDF){
    const doc = new window.jspdf.jsPDF({unit:'mm',format:'a4'});
    let y = 18;
    const pageH = 285;
    const addLine = (txt, size=10, bold=false)=>{
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(txt), 180);
      lines.forEach(line=>{
        if(y>pageH){ doc.addPage(); y=18; }
        doc.text(line, 15, y);
        y += size>=14 ? 8 : 5;
      });
    };
    addLine('FAFATRAINING COACHING', 16, true);
    addLine(`${p.name} · ${p.code}`, 12, true);
    addLine(`Objectif : ${labelForGoal(p.mainGoal)} | Niveau : ${labelForLevel(p.level)} | Contexte : ${labelForEnv(p.env)}`, 10);
    if(p.bmi?.value) addLine(`IMC : ${p.bmi.value} (${p.bmi.label})`, 10);
    if(p.restrictionsSummary) addLine(`Contraintes prises en compte : ${p.restrictionsSummary}`, 10);
    if(p.nutrition) addLine(`Nutrition : ${p.nutrition.kcal} kcal · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`,10);
    addLine('Programme', 12, true);
    (p.days||[]).forEach(day=>{
      addLine(day.title, 11, true);
      if(day.patternSummary) addLine(`Répartition : ${day.patternSummary}`, 9);
      (day.items||[]).forEach(ex=>{
        addLine(`${ex.name} — ${typeof ex.prescription==='string' ? ex.prescription : `${ex.prescription.series} / ${ex.prescription.reps} / repos ${ex.prescription.rest}`}`, 9, true);
        if(ex.cue) addLine(`Consigne : ${ex.cue}`, 9);
        if(ex.substitute) addLine(`Substitution : ${ex.substitute}`, 9);
      });
      addLine(' ', 8);
    });
    const blob = doc.output('blob');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return;
  }
  alert('Export PDF indisponible sur ce support.');
}








function renderLibrary(){
  const cat = $('#libCategory')?.value || '';
  const level = $('#libLevel')?.value || '';
  const env = $('#libEnv')?.value || '';
  const q = ($('#libSearch')?.value||'').toLowerCase().trim();
  const lvl = {beginner:1, intermediate:2, advanced:3};
  const arr = (EXERCISES || []).filter(ex =>
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || (ex.environments||[]).includes(env)) &&
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...(ex.tags||[]),...(ex.focus||[]),...(ex.areas||[])].join(' ').toLowerCase().includes(q))
  ).slice(0, 300);
  $('#libraryOutput').innerHTML = `
    <div class="panel library-summary">
      <div class="library-toolbar">
        <div class="summary"><h4>${EXERCISES.length}</h4><p>exercices / variantes</p></div>
        <div class="summary"><h4>${arr.length}</h4><p>résultats visibles</p></div>
        <div class="summary"><h4>${cat || 'Toutes'}</h4><p>catégorie</p></div>
        <div class="summary"><h4>${level ? labelForLevel(level) : 'Tous'}</h4><p>niveau</p></div>
        <div class="summary"><h4>${env ? labelForEnv(env) : 'Tous'}</h4><p>contexte</p></div>
      </div>
    </div>` + (arr.length ? arr.map(ex=>{
      const pattern = ex.biomech_pattern || patternFromExercise(ex);
      return `<article class="library-card">
        <div class="meta">
          <span class="badge">${esc(ex.category)}</span>
          <span class="badge">${esc(ex.subcategory)}</span>
          <span class="badge">${esc(labelForLevel(ex.level))}</span>
          <span class="badge badge-premium">${esc(pattern)}</span>
        </div>
        <h4>${esc(ex.name)}</h4>
        <p><strong>Muscles :</strong> ${esc(ex.muscles)}</p>
        <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
        <p><strong>Lecture simple :</strong> ${esc(ex.beginner_explain || 'Version simple à intégrer')}</p>
        <p><strong>Matériel :</strong> ${(ex.equipment||[]).map(eqLabel).join(' · ') || 'Poids du corps / adaptable'}</p>
      </article>`;
  }).join('') : '<div class="panel"><p>Aucun exercice trouvé avec ces filtres. Élargis la recherche ou retire un filtre.</p></div>');
}





function openAthleteProgram(){
  const code = ($('#athleteCode').value||'').trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const p = all[code];
  if(!p){ alert('Aucun programme trouvé pour ce code.'); return; }
  const business = JSON.parse(localStorage.getItem('fafaBusiness')||'{}');
  const b = business[code];
  if(!b || b.status !== 'actif' || Number(b.amount||0) <= 0){
    alert('Accès adhérent bloqué : le dossier doit être actif et payé.');
    return;
  }
  window.athleteProgram = p;
  $('#athleteLobby').classList.add('hidden');
  $('#athleteProgram').classList.remove('hidden');
  $('#athleteDashboard').classList.remove('hidden');
  $('#athleteHistory').classList.remove('hidden');
  $('#athleteDashboard').innerHTML = renderAthleteDashboard(p);
  renderAthleteCalendar(p);
  renderAthleteHabits(p);
  $('#athleteProgramOutput').innerHTML = renderProgram(p, false);
  renderAthleteHistory(p.code);
}


function renderAthleteDashboard(p){
  const adherence = getAdherenceScore(p.code);
  const tracking = JSON.parse(localStorage.getItem('fafaTracking')||'{}')[p.code] || [];
  const last = tracking.length ? tracking[tracking.length-1] : null;
  return `<h3>Dashboard adhérent</h3>
  <div class="athlete-dashboard-grid">
    <div class="summary"><h4>${esc(labelForGoal(p.mainGoal))}</h4><p>Objectif principal</p></div>
    <div class="summary"><h4>${esc(p.bmi?.value || '-')}</h4><p>IMC réel</p></div>
    <div class="summary"><h4>${p.nutrition ? p.nutrition.kcal : '-'}</h4><p>kcal de référence</p></div>
    <div class="summary"><h4>${adherence}%</h4><p>Régularité</p></div>
  </div>
  <div class="tracking-summary">
    <span class="badge">Code : ${esc(p.code)}</span>
    <span class="badge">Cycle : ${p.cycleWeeks} semaines · ${esc(p.cycleGoal)}</span>
    <span class="badge">Nutrition : ${p.nutrition ? `${p.nutrition.kcal} kcal` : 'non définie'}</span>
    <span class="badge">Dernier suivi : ${last ? `${last.weight || '-'} kg · énergie ${last.energy || '-'}/10` : 'aucun'}</span>
  </div>
  <div class="mini-help"><strong>Lecture simple</strong><span>Valide tes séances, note ton ressenti, ton RPE et ton énergie. Le coach pourra ajuster la suite plus précisément.</span></div>`;
}



function hydrateAthleteFromLink(){
  const search = new URLSearchParams(location.search);
  const code = (search.get('client') || '').trim().toUpperCase();
  const payload = search.get('payload');
  if(payload){
    const parsed = decodeSharePayload(decodeURIComponent(payload));
    if(parsed?.code){
      const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
      all[parsed.code] = parsed;
      localStorage.setItem('fafaPrograms', JSON.stringify(all));
    }
  }
  if(code){
    goView('athlete');
    $('#athleteCode').value = code;
    setTimeout(()=>openAthleteProgram(), 200);
  }
}


function backAthlete(){
  $('#athleteProgram').classList.add('hidden');
  $('#liveSession').classList.add('hidden');
  $('#athleteDashboard').classList.add('hidden');
  $('#athleteHistory').classList.add('hidden'); $('#athleteCalendar').classList.add('hidden'); $('#athleteHabits').classList.add('hidden');
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
  const rpe = $('#trackRpe').value;
  const compliance = $('#trackCompliance').value;
  if(!code){ alert('Ajoute un code.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  all[code] = all[code] || [];
  all[code].push({date:new Date().toLocaleDateString('fr-FR'), weight, note, waist, energy, rpe, compliance});
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
  const complianceVals = entries.filter(x=>x.compliance).map(x=>Number(x.compliance));
  const consistency = complianceVals.length ? Math.round(complianceVals.reduce((a,b)=>a+b,0)/complianceVals.length) : Math.min(100, entries.length*8);
  const avg = avgEnergy.length ? (avgEnergy.reduce((a,b)=>a+b,0)/avgEnergy.length) : 0;
  const fatigueTrend = avgEnergy.length ? (avg < 6 ? 'à surveiller' : avg < 7.5 ? 'modérée' : 'bonne') : 'pas assez de données';
  $('#analyticsOutput').innerHTML = `<h3>Analytics visuels ${code ? '· '+esc(code) : ''}</h3>
    <div class="dashboard-kpi">
      <div class="kpi"><strong>${consistency}%</strong><span>score régularité</span></div>
      <div class="kpi"><strong>${avgEnergy.length ? avg.toFixed(1) : '-'}/10</strong><span>énergie moyenne</span></div>
      <div class="kpi"><strong>${fatigueTrend}</strong><span>tendance fatigue</span></div>
      <div class="kpi"><strong>${entries.length}</strong><span>entrées suivies</span></div>
    </div>
    <div class="coach-grid premium-grid">
      <div class="panel"><h4>Progression poids</h4>${lineSvg(weights)}</div>
      <div class="panel"><h4>Progression tour de taille</h4>${lineSvg(waists)}</div>
    </div>`;
}

init();


function saveBusiness(){
  const code = ($('#bizCode').value||'').trim().toUpperCase();
  if(!code){ alert('Ajoute un code adhérent.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaBusiness')||'{}');
  all[code] = {
    code,
    status: $('#bizStatus').value,
    plan: ($('#bizPlan').value||'').trim(),
    amount: Number($('#bizAmount').value||0),
    renewal: $('#bizRenewal').value,
    paymentMethod: $('#bizPaymentMethod').value,
    notes: ($('#bizNotes').value||'').trim(),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('fafaBusiness', JSON.stringify(all));
  renderBusinessPanel();
}
function renderBusinessPanel(){
  const all = JSON.parse(localStorage.getItem('fafaBusiness')||'{}');
  const rows = Object.values(all).sort((a,b)=>(a.renewal||'').localeCompare(b.renewal||''));
  const total = rows.reduce((s,x)=>s+Number(x.amount||0),0);
  const active = rows.filter(x=>x.status==='actif').length;
  const unpaid = rows.filter(x=>x.status==='impaye').length;
  const html = `<h3>Vue business</h3>
    <div class="tracking-summary">
      <span class="badge">Actifs : ${active}</span>
      <span class="badge">Impayés : ${unpaid}</span>
      <span class="badge">CA saisi : ${Math.round(total)} €</span>
      <span class="badge">Dossiers : ${rows.length}</span>
    </div>
    <div class="crm-list">
      ${rows.length ? rows.map(r=>`<div class="crm-row"><div class="left"><strong>${esc(r.code)}</strong><span>${esc(r.plan||'Formule non précisée')}</span></div><div class="right"><div>${esc(r.status||'statut vide')}</div><div>${r.amount ? `${Math.round(r.amount)} €` : '0 €'} · ${esc(r.paymentMethod||'paiement non précisé')}</div><div>${r.renewal ? 'Échéance : '+esc(r.renewal) : 'Sans échéance'}</div></div></div>`).join('') : '<p>Aucun suivi business enregistré pour le moment.</p>'}
    </div>`;
  if($('#businessOutput')) $('#businessOutput').innerHTML = html;
  renderHomeEnhancements();
  bindCoachSmartSync();
}


function bindCoachSmartSync(){
  const envSel = $('#environmentSelect');
  const prefSel = $('#trainingPreference');
  const sportSel = $('#currentSport');
  const moduleSel = $('#specialModule');
  const coachingType = $('#coachingType');
  const mainGoal = $('#mainGoal');
  const cycleGoal = $('#cycleGoal');
  if(prefSel && envSel){
    prefSel.addEventListener('change', ()=>{
      if(!envSel.value && prefSel.value && prefSel.value!=='any' && ['home','gym','outdoor','video'].includes(prefSel.value)){
        envSel.value = prefSel.value==='video' ? 'hybrid' : prefSel.value;
        applyEquipmentPreset();
      }
    });
  }
  if(sportSel && moduleSel){
    sportSel.addEventListener('change', ()=>{
      const map = {boxing:'boxing', running:'trail', gym:'hyrox', strength:'transformation'};
      if(!moduleSel.value && map[sportSel.value]) moduleSel.value = map[sportSel.value];
    });
  }
  if(mainGoal && cycleGoal){
    mainGoal.addEventListener('change', ()=>{
      const map = {fat_loss:'conditioning', muscle_gain:'hypertrophy', strength:'strength', health:'maintenance', endurance:'conditioning'};
      if(map[mainGoal.value]) cycleGoal.value = map[mainGoal.value];
    });
  }
  if(mainGoal && coachingType){
    mainGoal.addEventListener('change', ()=>{
      if(!coachingType.value){
        coachingType.value = mainGoal.value==='health' ? 'health' : mainGoal.value==='boxing' ? 'boxing' : 'general';
      }
    });
  }
}


window.addEventListener('load', ()=>{ try{ renderBusinessPanel(); }catch(e){} });


function nutritionTargetReason(goal){
  return goal==='fat_loss' ? 'déficit modéré pour perdre sans casser l’énergie' :
         goal==='muscle_gain' ? 'léger surplus pour construire plus proprement' :
         goal==='conditioning' ? 'cadre énergétique suffisant pour performer et récupérer' :
         'base de maintien ajustable selon l’évolution réelle';
}
function openNutritionForCode(){
  const code = ($('#nutritionCode').value||'').trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const p = all[code];
  if(!p){ $('#nutritionOutput').innerHTML = '<p>Aucun programme trouvé pour ce code.</p>'; return; }
  const nutrition = p.nutrition || null;
  const html = `
    <h3>Plan nutrition · ${esc(code)}</h3>
    <div class="dashboard-kpi">
      <div class="kpi"><strong>${nutrition ? nutrition.kcal : '-'}</strong><span>kcal / jour</span></div>
      <div class="kpi"><strong>${nutrition ? nutrition.protein : '-'}</strong><span>protéines</span></div>
      <div class="kpi"><strong>${nutrition ? nutrition.carbs : '-'}</strong><span>glucides</span></div>
      <div class="kpi"><strong>${nutrition ? nutrition.fats : '-'}</strong><span>lipides</span></div>
    </div>
    <div class="summary"><p><strong>Pourquoi ce cadre :</strong> ${nutritionTargetReason(p.mainGoal)}</p><p><strong>Lecture coach :</strong> base à ajuster selon la faim, le poids, l’énergie, l’assiduité et les retours adhérent.</p></div>
    ${renderNutritionBox(nutrition, p.mainGoal)}
  `;
  $('#nutritionOutput').innerHTML = html;
  renderMealLogs(code);
}
function saveMealLog(){
  const code = ($('#nutritionCode').value||'').trim().toUpperCase();
  if(!code){ alert('Ajoute un code adhérent.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaMealLogs')||'{}');
  if(!all[code]) all[code] = [];
  all[code].push({
    date: $('#mealDate').value,
    moment: $('#mealMoment').value,
    calories: Number($('#mealCalories').value||0),
    text: ($('#mealText').value||'').trim()
  });
  localStorage.setItem('fafaMealLogs', JSON.stringify(all));
  renderMealLogs(code);
}
function renderMealLogs(code){
  const all = JSON.parse(localStorage.getItem('fafaMealLogs')||'{}');
  const arr = (all[code]||[]).slice().reverse();
  $('#mealLogOutput').innerHTML = arr.length ? arr.map(x=>`<article class="library-card"><div class="meta"><span class="badge">${esc(x.date||'-')}</span><span class="badge">${esc(x.moment||'-')}</span><span class="badge">${x.calories||0} kcal</span></div><p>${esc(x.text||'')}</p></article>`).join('') : '<p>Aucun repas enregistré pour ce code.</p>';
}
function renderFoodBank(){
  const blocks = [
    ['Protéines maigres','Poulet, dinde, œufs, skyr, thon, tofu'],
    ['Glucides utiles','Riz, flocons d’avoine, pommes de terre, quinoa, pâtes, fruits'],
    ['Lipides qualité','Huile d’olive, avocat, oléagineux, saumon'],
    ['Collations simples','Fruit + yaourt, shake protéiné, amandes, tartines complètes']
  ];
  $('#foodBankOutput').innerHTML = '<h3>Banque alimentaire coach</h3><div class="team-grid">' + blocks.map(([t,c])=>`<div class="card"><strong>${t}</strong><p>${c}</p></div>`).join('') + '</div>';
}
function renderBusinessCenter(){
  if(typeof renderBusinessPanel === 'function'){ renderBusinessPanel(); return; }
}
function saveBooking(){
  const all = JSON.parse(localStorage.getItem('fafaBookings')||'{}');
  const code = ($('#bookCode').value||'').trim().toUpperCase();
  if(!code){ alert('Ajoute un code adhérent.'); return; }
  if(!all[code]) all[code]=[];
  all[code].push({
    code,
    title: ($('#bookTitle').value||'').trim(),
    date: $('#bookDate').value,
    time: $('#bookTime').value,
    mode: $('#bookMode').value,
    link: ($('#bookLink').value||'').trim(),
    note: ($('#bookNote').value||'').trim()
  });
  localStorage.setItem('fafaBookings', JSON.stringify(all));
  renderBookingList();
}
function renderBookingList(){
  const all = JSON.parse(localStorage.getItem('fafaBookings')||'{}');
  const rows = Object.values(all).flat().sort((a,b)=>`${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));
  $('#bookingOutput').innerHTML = `<h3>Planning coaching live</h3><div class="crm-list">${rows.length ? rows.map(r=>`<div class="crm-row"><div class="left"><strong>${esc(r.code)} · ${esc(r.title||'Séance')}</strong><span>${esc(r.mode||'')}</span></div><div class="right"><div>${esc(r.date||'')}</div><div>${esc(r.time||'')}</div><div>${esc(r.link||'')}</div></div></div>`).join('') : '<p>Aucune séance planifiée pour le moment.</p>'}</div>`;
}


;(() => {
  function esc2(v){ return typeof esc === 'function' ? esc(v) : String(v ?? ''); }

  window.scrollCoachTo = function(id){
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  };

  window.collectRestrictionsSummary = function(){
    const parts = [];
    const med = (document.getElementById('medicalNotes')?.value || '').trim();
    const inj = (document.getElementById('injuryNotes')?.value || '').trim();
    const food = (document.getElementById('foodNotes')?.value || '').trim();
    const meds = (document.getElementById('medicationNotes')?.value || '').trim();
    if(med) parts.push(`Pathologies : ${med}`);
    if(inj) parts.push(`Blessures : ${inj}`);
    if(food) parts.push(`Nutrition / allergies : ${food}`);
    if(meds) parts.push(`Médicaments : ${meds}`);
    return parts.join(' · ');
  };

  window.autoPickCoachingType = function(){
    const main = document.getElementById('mainGoal')?.value || '';
    const med = document.getElementById('medicalFlag')?.value || '';
    const module = document.getElementById('specialModule')?.value || '';
    const coachingType = document.getElementById('coachingType');
    if(!coachingType) return;
    if(med === 'yes' || module === 'return_to_play' || main === 'recovery') coachingType.value = 'health';
    else if(main === 'boxing' || module === 'boxing_prep') coachingType.value = 'boxing';
    else if(main === 'mobility') coachingType.value = 'stretching';
    else if(['fat_loss','conditioning','hyrox'].includes(main)) coachingType.value = 'fitness';
    else if(main) coachingType.value = 'general';
  };

  window.suggestModuleFromContext = function(){
    const sport = document.getElementById('currentSport')?.value || '';
    const main = document.getElementById('mainGoal')?.value || '';
    const med = document.getElementById('medicalFlag')?.value || '';
    const moduleSel = document.getElementById('specialModule');
    if(!moduleSel) return;
    const map = {boxing:'boxing_prep', running:'trail_prep', gym:'hyrox_prep', strength:'transformation'};
    if(med === 'yes') moduleSel.value = 'return_to_play';
    else if(main === 'hyrox' || main === 'conditioning') moduleSel.value = 'hyrox_prep';
    else if(main === 'boxing') moduleSel.value = 'boxing_prep';
    else if(main === 'fat_loss') moduleSel.value = 'express_fat_loss';
    else if(main === 'recovery') moduleSel.value = 'seniors_health';
    else if(map[sport]) moduleSel.value = map[sport];
  };

  const __baseBindCoachSmartSync = window.bindCoachSmartSync;
  window.bindCoachSmartSync = function(){
    if(typeof __baseBindCoachSmartSync === 'function') __baseBindCoachSmartSync();
    document.getElementById('medicalFlag')?.addEventListener('change', () => { window.autoPickCoachingType(); window.suggestModuleFromContext(); });
    document.getElementById('mainGoal')?.addEventListener('change', () => { window.autoPickCoachingType(); window.suggestModuleFromContext(); });
    document.getElementById('currentSport')?.addEventListener('change', () => { window.suggestModuleFromContext(); });
  };

  function renderMesocycleTimeline(p){
    if(!p?.cycle?.length) return '';
    const meso = [];
    for(let i=0;i<p.cycle.length;i+=4){
      const chunk = p.cycle.slice(i,i+4);
      meso.push({
        label:`Bloc ${meso.length+1}`,
        weeks:`S${chunk[0].week} à S${chunk[chunk.length-1].week}`,
        phase: chunk.map(x=>x.phase).join(' · '),
        focus: chunk.map(x=> x.intensity || '').filter(Boolean).join(' / ')
      });
    }
    return `<div class="panel"><h3>Timeline macrocycle / mésocycle</h3><div class="meso-grid">${meso.map(m=>`<div class="meso-card"><strong>${m.label}</strong><p>${m.weeks}</p><p>${m.phase}</p><p class="helper">${m.focus}</p></div>`).join('')}</div></div>`;
  }

  function currentFeedbackAdjustment(code){
    const flags = JSON.parse(localStorage.getItem('fafaAdjustments')||'{}');
    const val = Number(flags[code] || 0);
    if(val >= 2) return 'Feedback global facile : le moteur peut augmenter légèrement la densité ou la charge.';
    if(val <= -2) return 'Feedback global difficile : le moteur doit alléger légèrement la densité ou le volume.';
    return 'Feedback global stable : le moteur peut continuer sur la progression prévue.';
  }

  function buildNotifications(program){
    if(!program) return [];
    const notes = [];
    const freq = Number(program.freq || 0);
    const live = program.onboarding?.liveMode || '';
    if(freq >= 4) notes.push('Rappel récupération : pense au sommeil, à l’hydratation et au retour au calme.');
    if(program.nutrition?.kcal) notes.push(`Rappel nutrition : viser environ ${program.nutrition.kcal} kcal et rester cohérent sur les protéines.`);
    if(live && live !== 'none') notes.push(`Rappel coaching live : confirme le créneau ${live === 'video' ? 'visioconférence' : 'présentiel'} 24 h avant.`);
    if(program.cycleWeeks >= 8) notes.push('Rappel cycle : fais un point fin de bloc à mi-parcours pour ajuster la suite.');
    if(program.restrictionsSummary) notes.push('Rappel sécurité : respecte les contraintes santé / blessures renseignées au profil.');
    return notes;
  }

  function heatmapHTML(entries){
    const vals = (entries || []).slice(-28).map(x => Number(x.compliance || 0));
    const boxes = Array.from({length:28}, (_,i)=>vals[i] || 0).map(v=>{
      const c = v >= 90 ? 'heat4' : v >= 70 ? 'heat3' : v >= 40 ? 'heat2' : v > 0 ? 'heat1' : '';
      return `<div class="heatcell ${c}"></div>`;
    }).join('');
    return `<div class="heatmap">${boxes}</div>`;
  }

  function lineSvgSafe(points, color){
    if(typeof lineSvg === 'function') return lineSvg(points, color);
    return '<div class="helper">Graphique indisponible.</div>';
  }

  const __baseRenderAnalytics = window.renderAnalytics;
  window.renderAnalytics = function(code, entries){
    const weights = entries.filter(x=>x.weight).map((x,i)=>({x:i,y:Number(x.weight)}));
    const waists = entries.filter(x=>x.waist).map((x,i)=>({x:i,y:Number(x.waist)}));
    const avgEnergy = entries.filter(x=>x.energy).map(x=>Number(x.energy));
    const complianceVals = entries.filter(x=>x.compliance).map(x=>Number(x.compliance));
    const consistency = complianceVals.length ? Math.round(complianceVals.reduce((a,b)=>a+b,0)/complianceVals.length) : Math.min(100, entries.length*8);
    const avg = avgEnergy.length ? (avgEnergy.reduce((a,b)=>a+b,0)/avgEnergy.length) : 0;
    const fatigueTrend = avgEnergy.length ? (avg < 6 ? 'à surveiller' : avg < 7.5 ? 'modérée' : 'bonne') : 'pas assez de données';
    const avgComp = complianceVals.length ? Math.round(complianceVals.reduce((a,b)=>a+b,0)/complianceVals.length) : 0;
    const html = `<h3>Analytics premium ${code ? '· '+esc2(code) : ''}</h3>
      <div class="dashboard-kpi">
        <div class="kpi"><strong>${consistency}%</strong><span>score régularité</span></div>
        <div class="kpi"><strong>${avgEnergy.length ? avg.toFixed(1) : '-'}/10</strong><span>énergie moyenne</span></div>
        <div class="kpi"><strong>${fatigueTrend}</strong><span>tendance fatigue</span></div>
        <div class="kpi"><strong>${entries.length}</strong><span>entrées suivies</span></div>
      </div>
      <div class="coach-grid premium-grid">
        <div class="panel"><h4>Progression poids</h4>${lineSvgSafe(weights)}</div>
        <div class="panel"><h4>Progression tour de taille</h4>${lineSvgSafe(waists)}</div>
      </div>
      <div class="coach-grid premium-grid" style="margin-top:14px">
        <div class="panel"><h4>Assiduité / heatmap</h4>${heatmapHTML(entries)}</div>
        <div class="panel"><h4>Lecture coach</h4><p><strong>Compliance moyenne :</strong> ${avgComp || '-'}%</p><p><strong>Ajustement conseillé :</strong> ${avgComp < 60 ? 'simplifier / sécuriser le programme' : avgComp < 80 ? 'tenir le cap avec quelques rappels' : 'possible de progresser davantage'}</p></div>
      </div>`;
    const out = document.getElementById('analyticsOutput');
    if(out) out.innerHTML = html;
  };

  function renderNotificationsPanel(program){
    const notes = buildNotifications(program);
    return `<div class="panel"><h3>Rappels intelligents</h3><div class="notification-grid">${notes.map(n=>`<div class="notify-card">${esc2(n)}</div>`).join('') || '<div class="notify-card">Aucun rappel spécifique.</div>'}</div></div>`;
  }

  function renderDragBuilder(program){
    if(!program?.days?.length || !Array.isArray(window.EXERCISES)) return '';
    const bank = window.EXERCISES.slice(0, 60);
    return `<div class="panel"><h3>Drag & drop builder séances</h3><p class="helper">Déplace les exercices de la banque vers les jours de séance. Cela sert de builder coach visuel sur la base du programme généré.</p>
      <div class="drag-builder">
        <div class="drag-bank">
          <input id="dragSearch" class="drag-bank-search" placeholder="Rechercher un exercice..." oninput="filterDragBank(this.value)">
          <div id="dragBankList" class="drag-items">${bank.map((ex,i)=>`<div class="drag-ex" draggable="true" ondragstart="startBuilderDrag(${i})" data-i="${i}">${esc2(ex.name)}</div>`).join('')}</div>
        </div>
        <div id="dragDays" class="drag-days">${program.days.map((day,di)=>`<div class="drag-day" ondragover="builderAllowDrop(event)" ondrop="builderDrop(${di})"><h4>${esc2(day.title)}</h4><div class="drag-items">${day.items.map((it,ii)=>`<div class="drag-ex">${esc2(it.name)}</div>`).join('')}</div></div>`).join('')}</div>
      </div>
    </div>`;
  }

  window.builderDragIndex = null;
  window.startBuilderDrag = function(i){ window.builderDragIndex = i; };
  window.builderAllowDrop = function(ev){ ev.preventDefault(); };
  window.builderDrop = function(dayIndex){
    if(window.builderDragIndex == null || !window.currentProgram || !Array.isArray(window.EXERCISES)) return;
    const ex = window.EXERCISES[window.builderDragIndex];
    if(!ex) return;
    const item = {
      name: ex.name,
      category: ex.category,
      subcategory: ex.subcategory,
      muscles: ex.muscles,
      cue: ex.cue,
      easy: ex.easy || 'Variante simple',
      hard: ex.hard || 'Variante avancée',
      pattern: ex.biomech_pattern || '',
      substitute: ex.substitution || 'Adapter selon matériel',
      prescription: {series:'3 séries', reps:'8 à 12 reps', rest:'60 à 90 sec', tempo:'contrôlé'}
    };
    window.currentProgram.days[dayIndex].items.push(item);
    const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
    all[window.currentProgram.code] = window.currentProgram;
    localStorage.setItem('fafaPrograms', JSON.stringify(all));
    setupCoachAfterGenerate(window.currentProgram);
  };
  window.filterDragBank = function(q){
    if(!Array.isArray(window.EXERCISES)) return;
    const s = String(q || '').toLowerCase().trim();
    const bank = window.EXERCISES.filter(ex => !s || [ex.name, ex.subcategory, ex.muscles].join(' ').toLowerCase().includes(s)).slice(0, 80);
    const el = document.getElementById('dragBankList');
    if(el) el.innerHTML = bank.map((ex,i)=>`<div class="drag-ex" draggable="true" ondragstart="startBuilderDrag(${window.EXERCISES.indexOf(ex)})">${esc2(ex.name)}</div>`).join('');
  };

  function setupCoachAfterGenerate(program){
    const out = document.getElementById('coachOutput');
    if(!out || !program) return;
    let extras = document.getElementById('coachStudioExtras');
    const html = `<div id="coachStudioExtras">${renderMesocycleTimeline(program)}${renderNotificationsPanel(program)}${renderDragBuilder(program)}</div>`;
    if(extras) extras.outerHTML = html;
    else out.insertAdjacentHTML('beforeend', html);
  }

  const __baseGenerateProgram = window.generateProgram;
  window.generateProgram = function(){
    if(typeof __baseGenerateProgram === 'function') __baseGenerateProgram();
    if(window.currentProgram){
      window.currentProgram.restrictionsSummary = window.currentProgram.restrictionsSummary || window.collectRestrictionsSummary();
      const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
      all[window.currentProgram.code] = window.currentProgram;
      localStorage.setItem('fafaPrograms', JSON.stringify(all));
      setupCoachAfterGenerate(window.currentProgram);
    }
  };

  const __baseOpenAthleteProgram = window.openAthleteProgram;
  window.openAthleteProgram = function(){
    if(typeof __baseOpenAthleteProgram === 'function') __baseOpenAthleteProgram();
    const p = window.athleteProgram;
    if(!p) return;
    const dash = document.getElementById('athleteDashboard');
    if(dash){
      dash.insertAdjacentHTML('afterbegin', `<div class="portal-hero"><h3>Portail adhérent FAFATRAINING</h3><p>Lis ton programme, suis ta progression, valide tes séances et garde une lecture simple de tes objectifs.</p><div class="portal-row"><div class="summary"><h4>${esc2(labelForGoal(p.mainGoal))}</h4><p>objectif</p></div><div class="summary"><h4>${p.cycleWeeks} sem</h4><p>cycle</p></div><div class="summary"><h4>${p.nutrition ? p.nutrition.kcal : '-'}</h4><p>kcal repère</p></div></div></div>`);
      dash.insertAdjacentHTML('beforeend', renderNotificationsPanel(p));
      dash.insertAdjacentHTML('beforeend', `<div class="live-adjust"><strong>Auto-ajustement programme :</strong> ${esc2(currentFeedbackAdjustment(p.code))}</div>`);
    }
  };

  const __baseSaveLiveExercise = window.saveLiveExercise;
  window.saveLiveExercise = function(){
    if(typeof __baseSaveLiveExercise === 'function') __baseSaveLiveExercise();
    const p = window.athleteProgram;
    if(!p) return;
    const log = document.getElementById('liveLog');
    if(log){
      log.insertAdjacentHTML('beforeend', `<div class="live-adjust"><strong>Ajustement moteur :</strong> ${esc2(currentFeedbackAdjustment(p.code))}</div>`);
    }
    const dash = document.getElementById('athleteDashboard');
    if(dash){
      const old = dash.querySelector('.live-adjust');
      if(old) old.innerHTML = `<strong>Auto-ajustement programme :</strong> ${esc2(currentFeedbackAdjustment(p.code))}`;
    }
  };

})();


;(() => {
  const readChecks = (id) => Array.from(document.querySelectorAll(`#${id} input:checked`)).map(x=>x.value);
  const setChecks = (id, values=[]) => {
    document.querySelectorAll(`#${id} input`).forEach(i=>{ i.checked = values.includes(i.value); });
  };
  const joinPresetAndText = (list, txt) => {
    const items = list.filter(v=>v && v!=='none' && v!=='any');
    if(txt) items.push(txt.trim());
    return items.join(', ');
  };

  const oldCollect = window.collectOnboarding;
  window.collectOnboarding = function(){
    const base = oldCollect ? oldCollect() : {};
    const pref = readChecks('trainingPreferenceMulti');
    const med = readChecks('medicalPreset');
    const injury = readChecks('injuryPreset');
    const food = readChecks('foodPreset');
    const coachTypes = readChecks('coachingTypeMulti');
    const liveModes = readChecks('liveModeMulti');
    return {
      ...base,
      trainingPreference: pref.join(','),
      trainingPreferenceMulti: pref,
      medicalFlag: med.length ? 'yes' : 'none',
      medicalPreset: med,
      medicalNotes: joinPresetAndText(med, document.getElementById('medicalNotes')?.value||''),
      injuryPreset: injury,
      injuryNotes: joinPresetAndText(injury, document.getElementById('injuryNotes')?.value||''),
      foodFlag: food.length ? 'yes' : 'none',
      foodPreset: food,
      foodNotes: joinPresetAndText(food, document.getElementById('foodNotes')?.value||''),
      coachingType: coachTypes[0] || base.coachingType || '',
      coachingTypeMulti: coachTypes,
      liveMode: liveModes[0] || base.liveMode || '',
      liveModeMulti: liveModes
    };
  };

  const prefLabelMulti = (vals='') => String(vals||'').split(',').filter(Boolean).map(v=>({home:'Maison',gym:'Salle',outdoor:'Extérieur',video:'Visio',any:'Peu importe'}[v]||v)).join(' · ');
  const oldFoundation = window.renderFoundationSummary;
  window.renderFoundationSummary = function(p){
    const ob = p.onboarding || {};
    const body = p.bodyComp;
    const alerts = [];
    if(ob.medicalNotes) alerts.push(`Pathologies : ${esc(ob.medicalNotes)}`);
    if(ob.injuryNotes) alerts.push(`Blessures / douleurs : ${esc(ob.injuryNotes)}`);
    if(ob.medicationNotes) alerts.push(`Médicaments : ${esc(ob.medicationNotes)}`);
    if(ob.foodNotes) alerts.push(`Alimentation / allergies : ${esc(ob.foodNotes)}`);
    return `<div class="panel">
      <h3>Résumé onboarding premium</h3>
      <div class="onboarding-summary">
        <div class="summary"><h4>${esc(activityLabel(ob.activityLevel) || 'non renseigné')}</h4><p>activité physique</p></div>
        <div class="summary"><h4>${esc(sportLabel(ob.currentSport) || 'non renseigné')}</h4><p>sport actuel</p></div>
        <div class="summary"><h4>${esc(prefLabelMulti(ob.trainingPreference) || 'non renseigné')}</h4><p>préférences de pratique</p></div>
        <div class="summary"><h4>${esc((ob.coachingTypeMulti||[]).join(' · ') || coachingTypeLabel(ob.coachingType) || 'non renseigné')}</h4><p>type de coaching</p></div>
      </div>
      ${body?`<div class="mini-help"><strong>Lecture coach santé</strong><span>${esc(body.band)} · ${esc(body.coach)}</span></div>`:''}
      ${alerts.length ? `<div class="alerts">${alerts.map(x=>`<div class="alert">${x}</div>`).join('')}</div>` : '<p class="helper">Aucune contrainte santé ou nutrition importante renseignée.</p>'}
    </div>`;
  };

  const oldEstimate = window.estimateBodyComposition;
  window.estimateBodyComposition = function({sex,bmi,activityLevel}){
    const res = oldEstimate ? oldEstimate({sex,bmi,activityLevel}) : {band:'',coach:''};
    const lvl = document.getElementById('clientLevel')?.value || '';
    const weight = Number(document.getElementById('clientWeight')?.value || 0);
    const height = Number(document.getElementById('clientHeight')?.value || 0);
    if(bmi && Number(bmi.value) >= 30 && (activityLevel === 'very_active' || lvl === 'advanced')){
      res.band = 'IMC élevé à interpréter avec prudence';
      res.coach = 'Le calcul IMC reste mathématique, mais le profil musculaire / sportif peut le surestimer. À croiser avec le niveau, le tour de taille, le ressenti et l’historique.';
    }
    return res;
  };

  function autoFillCoachFields(){
    const onboarding = window.collectOnboarding ? window.collectOnboarding() : {};
    const level = document.getElementById('clientLevel')?.value || '';
    const avail = onboarding.availabilityWeekly || '';
    const freq = document.getElementById('clientFreq');
    const duration = document.getElementById('clientDuration');
    const env = document.getElementById('environmentSelect');
    const cycle = document.getElementById('cycleGoal');
    if(freq && !freq.value){
      const map = {'1':'2','2-3':'3','4-5':'4','6+':'5'};
      if(map[avail]) freq.value = map[avail];
    }
    if(duration && !duration.value){
      const d = level === 'beginner' ? '45' : level === 'intermediate' ? '60' : '75';
      duration.value = d;
    }
    if(env && !env.value){
      const prefs = onboarding.trainingPreferenceMulti || [];
      const p = prefs[0];
      const map = {home:'home',gym:'gym',outdoor:'outdoor',video:'home'};
      if(map[p]) env.value = map[p];
    }
    if(cycle && !cycle.value){
      const main = document.getElementById('mainGoal')?.value || '';
      const map = {fat_loss:'conditioning', conditioning:'conditioning', hyrox:'conditioning', muscle_gain:'hypertrophy', strength:'strength', boxing:'conditioning', endurance:'conditioning', mobility:'maintenance', recovery:'maintenance'};
      if(map[main]) cycle.value = map[main];
    }
  }
  window.autoFillCoachFields = autoFillCoachFields;

  const oldBind = window.bindCoachSmartSync;
  window.bindCoachSmartSync = function(){
    if(oldBind) oldBind();
    ['activityLevel','coachingExperience','availabilityWeekly','mainGoal','clientLevel'].forEach(id=> document.getElementById(id)?.addEventListener('change', autoFillCoachFields));
    document.querySelectorAll('#trainingPreferenceMulti input, #medicalPreset input, #injuryPreset input, #foodPreset input, #coachingTypeMulti input, #liveModeMulti input').forEach(i=> i.addEventListener('change', autoFillCoachFields));
  };

  const oldGenerate = window.generateProgram;
  window.generateProgram = function(){
    autoFillCoachFields();
    if(oldGenerate) oldGenerate();
    if(window.currentProgram){
      const p = window.currentProgram;
      const restMap = {2:['Lun','Jeu'],3:['Lun','Mer','Ven'],4:['Lun','Mar','Jeu','Sam'],5:['Lun','Mar','Jeu','Ven','Sam'],6:['Lun','Mar','Mer','Jeu','Ven','Sam']};
      p.weekPlan = (restMap[String(p.freq)] || ['Lun','Mer','Ven']).map((d,i)=>({day:d, type:'training', session:p.days[i]?.title || `Séance ${i+1}`}));
      const names=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
      names.forEach(d=>{ if(!p.weekPlan.find(x=>x.day===d)) p.weekPlan.push({day:d,type:'rest',session:'Récupération / mobilité'}); });
      p.weekPlan.sort((a,b)=> names.indexOf(a.day)-names.indexOf(b.day));
      const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}'); all[p.code]=p; localStorage.setItem('fafaPrograms', JSON.stringify(all));
    }
  };

  const oldRenderCal = window.renderAthleteCalendar;
  window.renderAthleteCalendar = function(p){
    if(!p?.weekPlan){ if(oldRenderCal) return oldRenderCal(p); return; }
    const html = `<h3>Calendrier d'entraînement</h3><div class="calendar-grid">${p.weekPlan.map(x=>`<div class="day-cell"><strong>${x.day}</strong>${x.type==='training' ? esc(x.session) : 'Récupération / mobilité'}</div>`).join('')}</div>`;
    const el = document.getElementById('athleteCalendar');
    if(el){ el.classList.remove('hidden'); el.innerHTML = html; }
  };

  const oldOpenAthlete = window.openAthleteProgram;
  window.openAthleteProgram = function(){
    const code = (document.getElementById('athleteCode')?.value||'').trim().toUpperCase();
    const biz = JSON.parse(localStorage.getItem('fafaBusiness')||'{}')[code];
    if(!biz || biz.status !== 'actif' || Number(biz.amount||0) <= 0){
      alert('Accès adhérent refusé : abonnement inactif ou paiement non validé.');
      return;
    }
    if(oldOpenAthlete) oldOpenAthlete();
  };

  const oldShare = window.generateShareLink;
  window.generateShareLink = function(){
    if(oldShare) oldShare();
    const badge = document.getElementById('copyLinkBadge');
    if(badge){ badge.classList.remove('hidden'); setTimeout(()=>badge.classList.add('hidden'), 2200); }
  };

  const oldPrint = window.printProgram;
  window.printProgram = function(){
    try{ if(oldPrint) oldPrint(); }
    catch(e){ alert('Export PDF impossible sur ce navigateur.'); }
  };
})();


;(() => {
  const multiValues = (id) => Array.from(document.querySelectorAll(`#${id} input:checked`)).map(x=>x.value);
  const esc2 = (v) => typeof esc === 'function' ? esc(v) : String(v ?? '');

  window.collectOnboarding = function(){
    const medicalChoices = multiValues('medicalPreset');
    const injuryChoices = multiValues('injuryPreset');
    const foodChoices = multiValues('foodPreset');
    const coachingTypes = multiValues('coachingTypeMulti');
    const liveModes = multiValues('liveModeMulti');
    const prefs = multiValues('trainingPreferenceMulti');
    const medicalNotes = (document.getElementById('medicalNotes')?.value || '').trim();
    const injuryNotes = (document.getElementById('injuryNotes')?.value || '').trim();
    const foodNotes = (document.getElementById('foodNotes')?.value || '').trim();
    const medicationNotes = (document.getElementById('medicationNotes')?.value || '').trim();
    return {
      email: (document.getElementById('clientEmail')?.value || '').trim(),
      activityLevel: document.getElementById('activityLevel')?.value || '',
      currentSport: document.getElementById('currentSport')?.value || '',
      coachingExperience: document.getElementById('coachingExperience')?.value || '',
      availabilityWeekly: document.getElementById('availabilityWeekly')?.value || '',
      trainingPreference: prefs,
      medicalFlag: medicalChoices.length ? 'yes' : 'none',
      medicalChoices,
      medicalNotes: [medicalChoices.filter(x=>x!=='autre').join(', '), medicalNotes].filter(Boolean).join(' · '),
      injuryChoices,
      injuryNotes: [injuryChoices.filter(x=>x!=='autre').join(', '), injuryNotes].filter(Boolean).join(' · '),
      medicationNotes,
      foodFlag: foodChoices.length ? 'yes' : 'none',
      foodChoices,
      foodNotes: [foodChoices.filter(x=>x!=='autre').join(', '), foodNotes].filter(Boolean).join(' · '),
      coachingType: coachingTypes[0] || '',
      coachingTypes,
      liveMode: liveModes[0] || '',
      liveModes
    };
  };

  window.collectRestrictionsSummary = function(){
    const ob = window.collectOnboarding();
    const parts = [];
    if(ob.medicalNotes) parts.push(`Pathologies : ${ob.medicalNotes}`);
    if(ob.injuryNotes) parts.push(`Blessures : ${ob.injuryNotes}`);
    if(ob.foodNotes) parts.push(`Nutrition / allergies : ${ob.foodNotes}`);
    if(ob.medicationNotes) parts.push(`Médicaments : ${ob.medicationNotes}`);
    return parts.join(' · ');
  };

  window.calcBMI = function(weightKg,heightCm){
    const h = Number(heightCm)/100;
    if(!weightKg || !h) return null;
    const bmi = Number(weightKg)/(h*h);
    const activity = document.getElementById('activityLevel')?.value || '';
    const level = document.getElementById('clientLevel')?.value || '';
    const mainGoal = document.getElementById('mainGoal')?.value || '';
    let label='Poids normal', risk='profil standard', nuance='';
    if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
    else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
    else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
    else if(bmi < 35){ label='IMC élevé à interpréter'; risk='progressivité indispensable'; }
    else { label='IMC très élevé à interpréter'; risk='approche santé prioritaire'; }
    const sportif = (activity==='very_active' || level==='advanced') && ['strength','muscle_gain','boxing','hyrox'].includes(mainGoal);
    if(sportif && bmi >= 25){
      nuance = 'Profil sportif ou musculaire possible : l’IMC seul ne suffit pas à conclure.';
      if(bmi < 35) label = 'IMC élevé à interpréter avec prudence';
    }
    return {value:bmi.toFixed(1), label, risk, nuance};
  };

  window.estimateBodyComposition = function({sex, bmi, activityLevel}){
    if(!bmi) return null;
    const v = Number(bmi.value||bmi);
    let band = v<18.5 ? 'profil léger / surveiller les apports' : v<25 ? 'profil équilibré de base' : v<30 ? 'profil à recomposer' : 'profil santé prioritaire';
    let coach = activityLevel==='sedentary' ? 'Remonter progressivement le volume global.' : activityLevel==='very_active' ? 'Surveiller récupération et charge totale.' : 'Ajuster selon assiduité et récupération.';
    if(bmi.nuance) coach += ' ' + bmi.nuance;
    return {band, coach};
  };

  function autoFillFromOnboarding(){
    const ob = window.collectOnboarding();
    const levelEl = document.getElementById('clientLevel');
    const freqEl = document.getElementById('clientFreq');
    const durEl = document.getElementById('clientDuration');
    const envEl = document.getElementById('environmentSelect');
    const cycleGoalEl = document.getElementById('cycleGoal');
    const hiitEl = document.getElementById('hiitFormat');
    const mainGoalEl = document.getElementById('mainGoal');
    const moduleEl = document.getElementById('specialModule');

    if(levelEl && !levelEl.dataset.userSet){
      if(ob.coachingExperience==='new') levelEl.value = 'beginner';
      else if(ob.coachingExperience==='experienced' || ob.activityLevel==='very_active') levelEl.value = 'advanced';
      else if(ob.coachingExperience==='beginner') levelEl.value = 'intermediate';
    }

    if(freqEl && !freqEl.dataset.userSet){
      const map = {'1':'2','2-3':'3','4-5':'4','6+':'5'};
      if(map[ob.availabilityWeekly]) freqEl.value = map[ob.availabilityWeekly];
    }

    if(durEl && !durEl.dataset.userSet){
      const lvl = levelEl?.value || 'beginner';
      const rec = lvl==='beginner' ? '45' : lvl==='intermediate' ? '60' : '75';
      durEl.value = durEl.value || rec;
    }

    if(envEl && !envEl.dataset.userSet){
      const prefs = ob.trainingPreference || [];
      if(prefs.includes('gym')) envEl.value = 'gym';
      else if(prefs.includes('outdoor')) envEl.value = 'outdoor';
      else if(prefs.includes('home')) envEl.value = 'home';
      else if(prefs.includes('video')) envEl.value = 'bodyweight_only';
      if(typeof applyEquipmentPreset === 'function') applyEquipmentPreset();
    }

    if(moduleEl && !moduleEl.dataset.userSet){
      const sportMap = {boxing:'boxing_prep', running:'trail_prep', gym:'hyrox_prep', strength:'transformation'};
      if(ob.medicalFlag==='yes') moduleEl.value = 'return_to_play';
      else if(mainGoalEl?.value==='hyrox' || mainGoalEl?.value==='conditioning') moduleEl.value = 'hyrox_prep';
      else if(mainGoalEl?.value==='boxing') moduleEl.value = 'boxing_prep';
      else if(sportMap[ob.currentSport]) moduleEl.value = sportMap[ob.currentSport];
    }

    if(cycleGoalEl && !cycleGoalEl.dataset.userSet){
      const mg = mainGoalEl?.value || '';
      const map = {
        fat_loss:'conditioning',
        muscle_gain:'hypertrophy',
        strength:'strength',
        endurance:'conditioning',
        conditioning:'conditioning',
        boxing:'conditioning',
        hyrox:'conditioning',
        mobility:'maintenance',
        recovery:'maintenance'
      };
      if(map[mg]) cycleGoalEl.value = map[mg];
    }

    if(hiitEl && !hiitEl.dataset.userSet){
      const mg = mainGoalEl?.value || '';
      if(['conditioning','hyrox','fat_loss'].includes(mg)) hiitEl.value = hiitEl.value || '40/20';
      else if(mg==='boxing') hiitEl.value = hiitEl.value || '30/30';
    }

    if(typeof autoPickCoachingType === 'function') autoPickCoachingType();
    if(typeof suggestModuleFromContext === 'function') suggestModuleFromContext();
  }

  window.bindCoachSmartSync = function(){
    ['clientLevel','clientFreq','clientDuration','environmentSelect','cycleGoal','hiitFormat','specialModule'].forEach(id=>{
      document.getElementById(id)?.addEventListener('change', ()=>{ document.getElementById(id).dataset.userSet='1'; });
    });
    ['activityLevel','currentSport','coachingExperience','availabilityWeekly','mainGoal'].forEach(id=>{
      document.getElementById(id)?.addEventListener('change', autoFillFromOnboarding);
    });
    ['trainingPreferenceMulti','medicalPreset','injuryPreset','foodPreset','coachingTypeMulti','liveModeMulti'].forEach(id=>{
      document.getElementById(id)?.addEventListener('change', autoFillFromOnboarding);
    });
    autoFillFromOnboarding();
  };

  window.generateShareLink = function(){
    if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
    const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
    all[window.currentProgram.code] = window.currentProgram;
    localStorage.setItem('fafaPrograms', JSON.stringify(all));
    const link = window.currentProgram.athleteLink;
    const out = document.getElementById('programOutput');
    if(out && !document.getElementById('shareLinkCard')){
      out.insertAdjacentHTML('afterbegin', `<div class="panel" id="shareLinkCard" style="margin-bottom:12px"><h4>Lien adhérent</h4><p class="helper">Lien direct à copier et envoyer. L’accès adhérent reste bloqué si le statut n’est pas actif / payé.</p><div class="copybox">${esc2(link)}</div></div>`);
    }
    const badge = document.getElementById('copyBadge');
    const showBadge = ()=>{ if(badge){ badge.classList.remove('hidden'); setTimeout(()=>badge.classList.add('hidden'), 1800); } };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(link).then(showBadge).catch(()=>window.prompt('Copie ce lien adhérent :', link));
    } else {
      window.prompt('Copie ce lien adhérent :', link);
    }
  };

  window.printProgram = function(){
    if(!window.latestProgram){ alert('Génère d’abord un programme.'); return; }
    const p = window.latestProgram;
    const file = `${(p.code||'programme').toUpperCase()}_FAFATRAINING.pdf`;
    if(window.jspdf && window.jspdf.jsPDF){
      const doc = new window.jspdf.jsPDF({unit:'mm',format:'a4'});
      let y = 16;
      const pageH = 285;
      const add = (txt, size=10, bold=false)=>{
        doc.setFont('helvetica', bold ? 'bold':'normal');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(String(txt), 180);
        lines.forEach(line=>{ if(y>pageH){ doc.addPage(); y=16; } doc.text(line, 15, y); y += size===16 ? 8 : size===12 ? 6 : 5; });
      };
      doc.setFillColor(16,20,28); doc.roundedRect(10,10,190,22,5,5,'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('FAFATRAINING COACHING', 15, 23);
      y = 42; doc.setTextColor(20,24,32);
      add(`${p.name} · ${p.code}`, 12, true);
      add(`Objectif : ${labelForGoal(p.mainGoal)}${p.secondGoal?` · ${labelForGoal(p.secondGoal)}`:''}`, 10);
      add(`Niveau : ${labelForLevel(p.level)} · fréquence : ${p.freq}/semaine · durée : ${p.duration} min`, 10);
      add(`Contexte : ${labelForEnv(p.env)}`, 10);
      if(p.bmi?.value) add(`IMC réel : ${p.bmi.value} (${p.bmi.label})${p.bmi.nuance ? ' · '+p.bmi.nuance : ''}`, 10);
      if(p.restrictionsSummary) add(`Contraintes prises en compte : ${p.restrictionsSummary}`, 10);
      if(p.nutrition) add(`Nutrition : ${p.nutrition.kcal} kcal · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`, 10);
      add('Programme détaillé', 12, true);
      (p.days||[]).forEach(day=>{
        add(day.title, 11, true);
        if(day.patternSummary) add(`Répartition : ${day.patternSummary}`, 9);
        (day.items||[]).forEach(ex=>{
          const pres = typeof ex.prescription === 'string' ? ex.prescription : `${ex.prescription?.series||''} · ${ex.prescription?.reps||''} · repos ${ex.prescription?.rest||''}`;
          add(`${ex.name} — ${pres}`, 9, true);
          if(ex.cue) add(`Consigne : ${ex.cue}`, 9);
          if(ex.substitute) add(`Substitution : ${ex.substitute}`, 9);
        });
        add(' ', 8);
      });
      if(p.level==='beginner'){
        add('Glossaire débutant', 11, true);
        add('Série = nombre de blocs à faire. Reps = nombre de répétitions. Repos = temps de récupération. RPE = ressenti de l’effort sur 10.', 9);
      }
      doc.save(file);
      return;
    }
    alert('Le module PDF n’est pas disponible dans ce navigateur.');
  };

  window.openAthleteProgram = function(){
    const code = ((document.getElementById('athleteCode')?.value)||'').trim().toUpperCase();
    const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
    const biz = JSON.parse(localStorage.getItem('fafaBusiness')||'{}');
    const p = all[code];
    if(!p){ alert('Aucun programme trouvé pour ce code.'); return; }
    const dossier = biz[code];
    const hasPaid = dossier && dossier.status === 'actif' && Number(dossier.amount || 0) > 0;
    if(!hasPaid){
      alert("Accès adhérent bloqué : statut non actif ou paiement non validé.");
      return;
    }
    window.athleteProgram = p;
    document.getElementById('athleteLobby')?.classList.add('hidden');
    document.getElementById('athleteProgram')?.classList.remove('hidden');
    document.getElementById('athleteDashboard')?.classList.remove('hidden');
    document.getElementById('athleteHistory')?.classList.remove('hidden');
    const dash = document.getElementById('athleteDashboard');
    if(dash){
      dash.innerHTML = `
        <div class="portal-hero">
          <h3>Portail adhérent FAFATRAINING</h3>
          <p>Lis ton programme, suis ta progression, valide tes séances et garde une lecture simple de tes objectifs.</p>
          <div class="portal-row">
            <div class="summary"><h4>${esc2(labelForGoal(p.mainGoal))}</h4><p>objectif</p></div>
            <div class="summary"><h4>${p.cycleWeeks} sem</h4><p>cycle</p></div>
            <div class="summary"><h4>${p.nutrition ? p.nutrition.kcal : '-'} kcal</h4><p>repère nutrition</p></div>
          </div>
        </div>` + (typeof renderAthleteDashboard === 'function' ? renderAthleteDashboard(p) : '');
    }
    if(typeof renderAthleteCalendar === 'function') renderAthleteCalendar(p);
    if(typeof renderAthleteHabits === 'function') renderAthleteHabits(p);
    const out = document.getElementById('athleteProgramOutput');
    if(out) out.innerHTML = typeof renderProgram === 'function' ? renderProgram(p, false) : '';
    if(typeof renderAthleteHistory === 'function') renderAthleteHistory(p.code);
  };

  window.renderAthleteCalendar = function(p){
    const names = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const map = {
      1:[1],
      2:[1,4],
      3:[1,3,5],
      4:[1,2,4,6],
      5:[1,2,4,5,7],
      6:[1,2,3,5,6,7]
    };
    const activeSet = new Set((map[Number(p.freq||0)] || [1,3,5]).map(x=>x-1));
    const html = `<h3>Calendrier d'entraînement</h3><div class="calendar-grid">${names.map((n,i)=>`<div class="day-cell"><strong>${n}</strong>${activeSet.has(i) ? 'Séance prévue' : 'Récupération / mobilité'}</div>`).join('')}</div>`;
    const el = document.getElementById('athleteCalendar');
    if(el){ el.classList.remove('hidden'); el.innerHTML = html; }
  };

  window.renderLibrary = function(){
    const cat = document.getElementById('libCategory')?.value || '';
    const level = document.getElementById('libLevel')?.value || '';
    const env = document.getElementById('libEnv')?.value || '';
    const q = (document.getElementById('libSearch')?.value || '').toLowerCase().trim();
    const lvl = {beginner:1, intermediate:2, advanced:3};
    const arr = (window.EXERCISES || []).filter(ex =>
      (!cat || ex.category===cat) &&
      (!level || lvl[ex.level] <= lvl[level]) &&
      (!env || (ex.environments||[]).includes(env)) &&
      (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...(ex.tags||[]),...(ex.focus||[]),...(ex.areas||[])].join(' ').toLowerCase().includes(q))
    ).slice(0, 500);
    const eqCount = new Set(arr.flatMap(ex=>ex.equipment||[])).size;
    const out = document.getElementById('libraryOutput');
    if(!out) return;
    out.innerHTML = `
      <div class="panel">
        <div class="library-toolbar">
          <div class="summary"><h4>${arr.length}</h4><p>résultats</p></div>
          <div class="summary"><h4>${cat || 'Toutes'}</h4><p>catégorie</p></div>
          <div class="summary"><h4>${level ? labelForLevel(level) : 'Tous'}</h4><p>niveau</p></div>
          <div class="summary"><h4>${env ? labelForEnv(env) : 'Tous'}</h4><p>contexte</p></div>
        </div>
        <div class="library-intro"><strong>Bibliothèque enrichie :</strong> ${new_count} exercices / variantes au total dans la base. Sur ce filtre : ${arr.length} résultats et ${eqCount} matériels reliés.</div>
      </div>` + arr.map(ex=>`
        <article class="library-card">
          <div class="meta">
            <span class="badge">${esc2(ex.category)}</span>
            <span class="badge">${esc2(ex.subcategory)}</span>
            <span class="badge">${esc2(labelForLevel(ex.level))}</span>
          </div>
          <h4>${esc2(ex.name)}</h4>
          <p><strong>Muscles :</strong> ${esc2(ex.muscles)}</p>
          <p><strong>Consigne :</strong> ${esc2(ex.cue)}</p>
          <p><strong>Lecture débutant :</strong> ${esc2(ex.beginner_explain || 'Version simple à intégrer')}</p>
          <p><strong>Régression :</strong> ${esc2(ex.regression || ex.easy || 'À intégrer')} · <strong>Progression :</strong> ${esc2(ex.progression || ex.hard || 'À intégrer')}</p>
          <p><strong>Matériel :</strong> ${(ex.equipment||[]).map(eqLabel).join(' · ')}</p>
          <div class="demo">Note coach : ${esc2(ex.coach_note || 'Technique et respiration')}</div>
        </article>`).join('');
  };

  const __origGenerateProgram = window.generateProgram;
  window.generateProgram = function(){
    if(typeof __origGenerateProgram === 'function') __origGenerateProgram();
    if(window.currentProgram){
      window.currentProgram.restrictionsSummary = window.collectRestrictionsSummary();
      const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
      all[window.currentProgram.code] = window.currentProgram;
      localStorage.setItem('fafaPrograms', JSON.stringify(all));
    }
  };

  const __origInit = window.init;
  window.init = async function(){
    if(typeof __origInit === 'function') await __origInit();
    try{ window.bindCoachSmartSync(); }catch(e){}
    try{ if(typeof window.renderLibrary === 'function') window.renderLibrary(); }catch(e){}
    const countEl = document.getElementById('exerciseCount');
    if(countEl) countEl.textContent = '3692';
  };
})();

function selectedTextValues(id, labelsMap){
  const values = getMultiValues(id);
  return values.map(v => labelsMap?.[v] || labelForGoal?.(v) || labelForEnv?.(v) || v).filter(Boolean);
}
