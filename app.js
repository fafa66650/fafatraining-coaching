const STORAGE = {
  programs: 'fafa_v33_programs',
  tracks: 'fafa_v33_tracks',
  business: 'fafa_v33_business'
};

const GOALS = [
  ['fat_loss','Perte de poids'],['recomposition','Recomposition corporelle'],['muscle_gain','Prise de muscle'],
  ['strength','Force'],['conditioning','Condition physique'],['endurance','Endurance'],['boxing','Boxe'],
  ['hyrox','Hyrox / fonctionnel'],['trail','Trail'],['mobility','Mobilité / stretching'],['health','Santé / remise en forme']
];
const GOAL_LABEL = Object.fromEntries(GOALS);
const ENVIRONMENTS = [
  ['home','Maison'],['gym','Salle de musculation'],['boxing_gym','Salle de boxe'],['crossfit_box','Box Hyrox / CrossFit'],['outdoor','Extérieur'],['bodyweight_only','Poids du corps uniquement']
];
const ENV_LABEL = Object.fromEntries(ENVIRONMENTS);
const EQUIPMENT = [
  ['bodyweight','Poids du corps'],['dumbbells','Haltères'],['barbell','Barre'],['bench','Banc'],['kettlebell','Kettlebell'],['bands','Élastiques'],['trx','TRX / sangles'],['jump_rope','Corde à sauter'],['medicine_ball','Medicine ball'],['battle_rope','Battle rope'],['box','Plyo box / step'],['bike','Vélo'],['rower','Rameur'],['treadmill','Tapis de course'],['sled','Traîneau'],['pullup_bar','Barre de traction'],['bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['cones','Cônes'],['stairs','Escalier / marches'],['mat','Tapis de sol']
];
const EQ_LABEL = Object.fromEntries(EQUIPMENT);
const PRESET_EQUIPMENT = {
  home:['bodyweight','dumbbells','bands','mat'],
  gym:['dumbbells','barbell','bench','kettlebell','pullup_bar','bike','rower','treadmill'],
  boxing_gym:['bodyweight','jump_rope','gloves','pads','bag','medicine_ball'],
  crossfit_box:['bodyweight','dumbbells','barbell','kettlebell','box','rower','bike','sled','battle_rope'],
  outdoor:['bodyweight','jump_rope','cones','stairs','medicine_ball'],
  bodyweight_only:['bodyweight','mat']
};
const QUICK_STYLES = [
  ['amrap','AMRAP (maximum de tours)'],['emom','EMOM (chaque minute sur la minute)'],['hiit','HIIT (intervalles haute intensité)'],['circuit','Circuit training'],['strength','Musculation / force'],['conditioning','Condition physique'],['boxing','Boxe'],['hyrox','Hyrox / fonctionnel'],['trail','Trail / course'],['mobility','Mobilité / stretching'],['zone2','Zone 2 (endurance fondamentale)'],['recovery','Récupération']
];
const TECH_GLOSSARY = {
  amrap:'AMRAP : maximum de tours dans le temps donné.',
  emom:'EMOM : on démarre l’exercice en début de minute, puis on récupère sur le temps restant.',
  hiit:'HIIT : alternance de temps de travail et de repos courts.',
  zone2:'Zone 2 : endurance fondamentale, respiration contrôlée, allure confortable.',
  rir:'RIR : répétitions en réserve, nombre de répétitions qu’on aurait encore pu faire proprement.'
};
const chipConfigs = {
  secondaryGoalsChips: {max:3, options: GOALS.filter(([v])=>!['health'].includes(v))},
  equipmentChips: {max:null, options:EQUIPMENT},
  nutritionRestrictionsChips: {max:null, options:[['lactose','Sans lactose'],['gluten','Sans gluten'],['oeufs','Sans œufs'],['arachides','Sans arachides'],['vegetarien','Végétarien'],['vegan','Vegan'],['halal','Halal']]},
  nutritionDislikesChips: {max:null, options:[['oeufs','Œufs'],['poisson','Poisson'],['laitage','Produits laitiers'],['legumes','Légumes'],['legumineuses','Légumineuses']]}
};
const chipState = {};

const $ = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>Array.from(p.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const byId = id => document.getElementById(id);

let EXERCISES = [];
let CURRENT_PROGRAM = null;

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function getPrograms(){ return load(STORAGE.programs, {}); }
function setPrograms(v){ save(STORAGE.programs, v); }
function getTracks(){ return load(STORAGE.tracks, {}); }
function setTracks(v){ save(STORAGE.tracks, v); }
function getBusiness(){ return load(STORAGE.business, {}); }
function setBusiness(v){ save(STORAGE.business, v); }

function initNav(){
  $$('.navbtn').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.view)));
  byId('goSimpleBtn').addEventListener('click', ()=>goView('quick'));
  byId('goCoachBtn').addEventListener('click', ()=>goView('coach'));
}
function goView(view){
  $$('.navbtn').forEach(btn=>btn.classList.toggle('active', btn.dataset.view===view));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===view));
}
function initSteps(){
  $$('.step').forEach(btn=>btn.addEventListener('click', ()=>showStep(btn.dataset.step)));
}
function showStep(step){
  $$('.step').forEach(btn=>btn.classList.toggle('active', btn.dataset.step===String(step)));
  $$('.step-panel').forEach(panel=>panel.classList.toggle('active', panel.dataset.panel===String(step)));
}

function initChips(){
  for(const [id,cfg] of Object.entries(chipConfigs)){
    chipState[id] = new Set();
    const host = byId(id);
    host.innerHTML = cfg.options.map(([value,label])=>`<button type="button" class="chip" data-chip-group="${id}" data-chip-value="${value}">${esc(label)}</button>`).join('');
  }
  document.addEventListener('click', ev=>{
    const btn = ev.target.closest('.chip[data-chip-group]');
    if(!btn) return;
    const group = btn.dataset.chipGroup;
    const value = btn.dataset.chipValue;
    const set = chipState[group];
    const max = chipConfigs[group].max;
    if(set.has(value)) set.delete(value);
    else {
      if(max && set.size >= max) return;
      set.add(value);
    }
    renderChipGroup(group);
    if(group === 'equipmentChips') updateCoachSummary();
    if(group === 'secondaryGoalsChips') updateCoachSummary();
  });
}
function renderChipGroup(group){
  $$(`[data-chip-group="${group}"]`).forEach(btn=>btn.classList.toggle('active', chipState[group].has(btn.dataset.chipValue)));
}
function getChipValues(group){ return Array.from(chipState[group] || []); }
function setChipValues(group, values){ chipState[group] = new Set(values || []); renderChipGroup(group); }

function populateSelects(){
  byId('libEnv').innerHTML = `<option value="">Tous les lieux</option>${ENVIRONMENTS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}`;
  byId('libEquipment').innerHTML = `<option value="">Tout le matériel</option>${EQUIPMENT.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}`;
}

function notify(host, msg, type='ok'){
  const el = typeof host === 'string' ? byId(host) : host;
  if(!el) return;
  let box = $('.status-inline', el);
  if(!box){ box = document.createElement('div'); el.prepend(box); }
  box.className = `status-inline ${type === 'ok' ? '' : type}`.trim();
  box.textContent = msg;
}

function initAutoPresets(){
  byId('environmentSelect').addEventListener('change', ()=>{
    const env = byId('environmentSelect').value;
    const preset = PRESET_EQUIPMENT[env] || [];
    setChipValues('equipmentChips', preset);
    updateCoachSummary();
  });
}

function bindSummary(){
  ['clientName','clientCode','clientAge','clientHeight','clientWeight','clientLevel','activityLevel','mainGoal','environmentSelect','clientFreq','clientDuration','stressLevel','constraintsInput'].forEach(id=>{
    const field = byId(id); if(field) field.addEventListener('input', updateCoachSummary);
    if(field) field.addEventListener('change', updateCoachSummary);
  });
}

function computeBMI(weight, heightCm){
  const h = Number(heightCm) / 100;
  const w = Number(weight);
  if(!h || !w) return null;
  return +(w / (h*h)).toFixed(1);
}
function bmiLabel(bmi){
  if(bmi == null) return '—';
  if(bmi < 18.5) return 'Corpulence insuffisante';
  if(bmi < 25) return 'Corpulence normale';
  if(bmi < 30) return 'Surpoids';
  if(bmi < 35) return 'Obésité modérée';
  return 'Obésité élevée';
}
function levelLabel(v){ return {beginner:'Débutant',intermediate:'Intermédiaire',advanced:'Avancé'}[v] || '—'; }
function activityLabel(v){ return {sedentary:'Peu actif',moderate:'Modérément actif',active:'Actif',very_active:'Très actif'}[v] || '—'; }
function intensityLabel(v){ return {low:'Douce',medium:'Modérée',high:'Élevée'}[v] || '—'; }

function updateCoachSummary(){
  const name = byId('clientName').value.trim() || '—';
  const code = byId('clientCode').value.trim() || '—';
  const goal = GOAL_LABEL[byId('mainGoal').value] || '—';
  const env = ENV_LABEL[byId('environmentSelect').value] || '—';
  const level = levelLabel(byId('clientLevel').value);
  const freq = byId('clientFreq').value ? `${byId('clientFreq').value} / semaine` : 'Auto';
  const duration = byId('clientDuration').value ? `${byId('clientDuration').value} min` : 'Auto';
  const bmi = computeBMI(byId('clientWeight').value, byId('clientHeight').value);
  const equip = getChipValues('equipmentChips').map(v=>EQ_LABEL[v]).slice(0,6).join(', ') || '—';
  const secs = getChipValues('secondaryGoalsChips').map(v=>GOAL_LABEL[v]).join(', ') || '—';
  byId('coachSummary').innerHTML = [
    ['Client', name],['Code', code],['Objectif principal', goal],['Objectifs secondaires', secs],['Lieu', env],['Niveau', level],['Activité quotidienne', activityLabel(byId('activityLevel').value)],['Fréquence', freq],['Durée', duration],['Intensité', intensityLabel(byId('stressLevel').value)],['IMC officiel', bmi != null ? `${bmi} • ${bmiLabel(bmi)}` : 'À compléter'],['Matériel', equip]
  ].map(([k,v])=>`<div class="summary-item"><strong>${esc(k)}</strong><div>${esc(v)}</div></div>`).join('');
}

function sanitizeName(name){
  return String(name || '').split('—')[0].split('•')[0].trim().toLowerCase();
}
function goalTagsFor(goal){
  const map = {
    fat_loss:['fat_loss','conditioning','recomp'], recomp:['recomp','fat_loss','muscle_gain'], recomposition:['recomp','fat_loss','muscle_gain'], muscle_gain:['muscle_gain','strength','hypertrophy'], strength:['strength','muscle_gain'], conditioning:['conditioning','fat_loss'], endurance:['trail','conditioning'], boxing:['boxing','conditioning'], hyrox:['hyrox','conditioning'], trail:['trail','conditioning'], mobility:['mobility','health'], health:['health','fat_loss']
  };
  return map[goal] || [goal];
}
function styleTarget(style){
  return {amrap:'conditioning',emom:'conditioning',hiit:'conditioning',circuit:'conditioning',strength:'strength',boxing:'boxing',hyrox:'hyrox',trail:'trail',mobility:'mobility',zone2:'endurance',recovery:'mobility'}[style] || 'conditioning';
}
function envPriority(env){
  return PRESET_EQUIPMENT[env] || ['bodyweight'];
}
function scoreExercise(ex, ctx){
  let score = 0;
  const tags = goalTagsFor(ctx.goal).concat((ctx.secondGoals||[]).flatMap(goalTagsFor));
  if(ex.environments?.includes(ctx.env)) score += 22;
  if((ex.equipment || []).some(eq => ctx.equipment.includes(eq))) score += 18;
  if(tags.some(tag => ex.tags?.includes(tag))) score += 20;
  if(ctx.level === ex.level) score += 10;
  if(ctx.level === 'advanced' && ex.level === 'intermediate') score += 4;
  if(ctx.level === 'intermediate' && ex.level === 'beginner') score += 3;
  if(ctx.level === 'beginner' && ex.level === 'advanced') score -= 18;
  const base = sanitizeName(ex.name);
  if(ctx.usedBases.has(base)) score -= 35;
  if(ctx.usedNames.has(ex.name)) score -= 50;
  if(ctx.patterns.has(ex.subcategory)) score -= 12;
  if(ctx.bodyweightOnly && (ex.equipment || []).some(eq => !['bodyweight','mat','bands','jump_rope','cones','stairs'].includes(eq))) score -= 30;
  if(ctx.loaded && ['dumbbells','barbell','bench','kettlebell','sled','rower','bike','medicine_ball'].some(eq => ex.equipment?.includes(eq))) score += 8;
  if(ctx.boxing && (ex.tags?.includes('boxing') || base.includes('shadow') || base.includes('footwork'))) score += 12;
  if(ctx.mobility && (ex.tags?.includes('mobility') || /mobil|stretch|respiration|ouverture|rotation/i.test(ex.name))) score += 12;
  if(ctx.outdoor && ex.environments?.includes('outdoor')) score += 6;
  if(/burpee/i.test(ex.name) && ctx.goal !== 'conditioning' && ctx.goal !== 'fat_loss') score -= 40;
  if(ctx.avoidStaticWarmup && /étirement|stretch/i.test(ex.name) && !ctx.mobility) score -= 14;
  return score;
}
function chooseExercises(ctx, count){
  const list = EXERCISES
    .map(ex => ({...ex, _score: scoreExercise(ex, ctx)}))
    .filter(ex => ex._score > -10)
    .sort((a,b)=>b._score-a._score);
  const chosen = [];
  for(const ex of list){
    const base = sanitizeName(ex.name);
    if(chosen.find(c => sanitizeName(c.name) === base)) continue;
    chosen.push(ex);
    ctx.usedBases.add(base); ctx.usedNames.add(ex.name); if(ex.subcategory) ctx.patterns.add(ex.subcategory);
    if(chosen.length >= count) break;
  }
  return chosen;
}

function buildPrescription(style, level, ex, duration, env){
  const lvl = level || 'intermediate';
  const loadLine = {
    beginner:'Charge légère à modérée • garder 2 à 3 répétitions en réserve',
    intermediate:'Charge modérée • garder 1 à 2 répétitions en réserve',
    advanced:'Charge lourde contrôlée • garder 1 répétition en réserve'
  }[lvl];
  const bwLine = 'Au poids du corps • exécution propre et amplitude maîtrisée';
  const loaded = (ex.equipment || []).some(eq => ['dumbbells','barbell','bench','kettlebell','sled','medicine_ball','rower','bike','treadmill','battle_rope'].includes(eq));

  switch(style){
    case 'strength':
      return {series:'4 séries', reps:lvl==='beginner'?'8 reps':'6 à 8 reps', rest:'Repos 90 à 120 sec entre séries', charge: loaded ? loadLine : bwLine, explain:'On termine toutes les séries du même exercice avant de passer au suivant.'};
    case 'amrap':
      return {series:'1 bloc', reps:`Timer global ${duration || 20} min`, rest:'Repos libre seulement si nécessaire', charge: loaded ? 'Charge modérée • garder environ 2 répétitions en réserve' : bwLine, explain:'Enchaîner les exercices, faire le plus de tours propres possible dans le temps imparti.'};
    case 'emom':
      return {series:`${Math.max(10, Math.min(20, Number(duration)||12))} min`, reps:'1 exercice par minute', rest:'Le repos correspond au temps restant dans la minute', charge: loaded ? 'Charge technique • rester propre et régulier' : bwLine, explain:'On démarre l’exercice en début de minute. Dès que le travail est fini, on récupère jusqu’à la minute suivante.'};
    case 'hiit':
      return {series:'3 à 4 séries', reps:'30 sec effort / 30 sec repos', rest:'Repos 60 sec entre blocs', charge: loaded ? 'Charge légère à modérée • garder de la vitesse' : bwLine, explain:'Travail court et intense. Qualité d’exécution avant la vitesse.'};
    case 'circuit':
      return {series:'3 à 4 tours', reps:'10 à 15 reps', rest:'Repos 75 sec entre tours', charge: loaded ? loadLine : bwLine, explain:'Finir tous les exercices du tour, puis prendre le repos prévu avant le tour suivant.'};
    case 'boxing':
      return {series:'4 à 6 rounds', reps:'2 à 3 min de travail', rest:'Repos 45 à 60 sec entre rounds', charge:'Charge explosive ou poids du corps selon exercice', explain:'Travail en rounds. Garder technique, garde et déplacements propres.'};
    case 'hyrox':
      return {series:'3 à 5 blocs', reps:'40 à 90 sec de travail', rest:'Repos 45 à 75 sec entre blocs', charge: loaded ? 'Charge modérée • garder du rythme' : bwLine, explain:'Alternance cardio + renforcement + locomotion, avec effort continu mais contrôlé.'};
    case 'trail':
    case 'zone2':
      return {series:'1 bloc continu', reps:`${duration || 30} min d’effort régulier`, rest:'Pas de repos fixe', charge:'Allure confortable, respiration contrôlée', explain:'On doit pouvoir parler par petites phrases. Intensité modérée et stable.'};
    case 'mobility':
    case 'recovery':
      return {series:'2 à 3 séries', reps:'6 à 10 répétitions lentes ou 20 à 30 sec', rest:'Repos 15 à 20 sec', charge:'Pas de charge externe, contrôle du mouvement et respiration', explain:'Bouger lentement, respirer, chercher l’amplitude utile sans douleur.'};
    default:
      return {series:'3 à 4 séries', reps:'8 à 12 reps', rest:'Repos 60 à 75 sec', charge: loaded ? loadLine : bwLine, explain:'On termine les séries prévues, puis on prend le repos indiqué avant la série suivante.'};
  }
}

function renderExerciseCard(ex, prescription){
  return `<article class="exercise-card">
    <h5>${esc(ex.name)}</h5>
    <div class="muted-line">${esc(ex.subcategory || ex.category || '')} • ${esc(ex.muscles || '')}</div>
    <div class="prescription">
      <span>${esc(prescription.series)}</span>
      <span>${esc(prescription.reps)}</span>
      <span>${esc(prescription.rest)}</span>
      <span>${esc(prescription.charge)}</span>
    </div>
    <div class="exercise-lines">
      <div><strong>Consigne :</strong> ${esc(ex.cue || 'Exécution propre et régulière')}</div>
      <div><strong>Version plus facile :</strong> ${esc(ex.easy || 'Réduire l’amplitude ou le volume')}</div>
      <div><strong>Version plus difficile :</strong> ${esc(ex.hard || 'Augmenter la charge, l’amplitude ou le volume')}</div>
    </div>
  </article>`;
}

function buildProgram(form){
  const level = form.level || 'intermediate';
  const freq = Number(form.freq || autoFrequency(form));
  const duration = Number(form.duration || autoDuration(form));
  const usedBases = new Set();
  const usedNames = new Set();
  const patterns = new Set();
  const ctxBase = {goal:form.mainGoal, secondGoals:form.secondGoals, level, env:form.env, equipment:form.equipment, usedBases, usedNames, patterns, bodyweightOnly:form.env==='bodyweight_only', loaded:['gym','crossfit_box'].includes(form.env), boxing:form.mainGoal==='boxing' || form.env==='boxing_gym', mobility:form.mainGoal==='mobility', outdoor:form.env==='outdoor', avoidStaticWarmup:true};

  const style = chooseProgramStyle(form);
  const warmStyle = form.mainGoal === 'mobility' ? 'mobility' : 'recovery';
  const warm = chooseExercises({...ctxBase, goal:'mobility', mobility:true}, 2);
  const mainCount = style === 'strength' ? 5 : style === 'amrap' ? 5 : style === 'emom' ? 5 : 4;
  const main = chooseExercises({...ctxBase, goal: styleTarget(style), mobility:false}, mainCount);
  const cool = chooseExercises({...ctxBase, goal:'mobility', mobility:true}, 1);

  const sessions = [];
  for(let day=1; day<=freq; day++){
    const rotateUsed = day > 1 ? new Set() : usedBases;
    const rotateNames = day > 1 ? new Set() : usedNames;
    const rotatePatterns = day > 1 ? new Set() : patterns;
    const dayStyle = rotateProgramStyle(style, day);
    const ctx = {...ctxBase, usedBases:rotateUsed, usedNames:rotateNames, patterns:rotatePatterns, goal: styleTarget(dayStyle)};
    const mainDay = chooseExercises(ctx, mainCount);
    const warmDay = chooseExercises({...ctxBase, usedBases:new Set(), usedNames:new Set(), patterns:new Set(), goal:'mobility', mobility:true}, 2);
    const coolDay = chooseExercises({...ctxBase, usedBases:new Set(), usedNames:new Set(), patterns:new Set(), goal:'mobility', mobility:true}, 1);
    sessions.push({day, style:dayStyle, warm:warmDay, main:mainDay, cool:coolDay});
  }

  return {
    code: form.code,
    name: form.name || form.code,
    form,
    freq,
    duration,
    bmi: computeBMI(form.weight, form.height),
    style,
    sessions
  };
}

function chooseProgramStyle(form){
  if(['strength','muscle_gain'].includes(form.mainGoal) && ['gym','crossfit_box'].includes(form.env)) return 'strength';
  if(form.mainGoal === 'boxing') return 'boxing';
  if(form.mainGoal === 'hyrox') return 'hyrox';
  if(form.mainGoal === 'trail' || form.mainGoal === 'endurance') return 'zone2';
  if(form.mainGoal === 'mobility') return 'mobility';
  if(form.mainGoal === 'health') return 'circuit';
  if(form.mainGoal === 'fat_loss') return form.env === 'gym' ? 'circuit' : 'hiit';
  return 'circuit';
}
function rotateProgramStyle(style, day){
  const variants = {
    strength:['strength','strength','circuit'],
    circuit:['circuit','hiit','amrap'],
    hiit:['hiit','circuit','amrap'],
    boxing:['boxing','conditioning','circuit'],
    hyrox:['hyrox','circuit','conditioning'],
    zone2:['zone2','circuit','mobility'],
    mobility:['mobility','mobility','recovery']
  }[style] || [style];
  return variants[(day-1) % variants.length];
}
function autoFrequency(form){
  if(form.level === 'beginner') return 3;
  if(form.level === 'advanced') return 5;
  return 4;
}
function autoDuration(form){
  if(form.mainGoal === 'mobility') return 30;
  if(['trail','endurance','hyrox'].includes(form.mainGoal)) return 60;
  return 45;
}

function gatherForm(){
  return {
    name: byId('clientName').value.trim(),
    code: byId('clientCode').value.trim().toUpperCase(),
    age: Number(byId('clientAge').value || 0),
    height: Number(byId('clientHeight').value || 0),
    weight: Number(byId('clientWeight').value || 0),
    level: byId('clientLevel').value,
    activity: byId('activityLevel').value,
    mainGoal: byId('mainGoal').value,
    secondGoals: getChipValues('secondaryGoalsChips'),
    env: byId('environmentSelect').value,
    equipment: getChipValues('equipmentChips'),
    constraints: byId('constraintsInput').value.trim(),
    duration: byId('clientDuration').value,
    freq: byId('clientFreq').value,
    intensity: byId('stressLevel').value
  };
}
function validateForm(f){
  if(!f.code) return 'Le code adhérent est obligatoire.';
  if(!f.age || !f.height || !f.weight) return 'Âge, taille et poids sont obligatoires.';
  if(!f.level || !f.activity) return 'Le niveau et l’activité quotidienne sont obligatoires.';
  if(!f.mainGoal) return 'L’objectif principal est obligatoire.';
  if(!f.env) return 'Le lieu d’entraînement est obligatoire.';
  if(!f.equipment.length) return 'Le matériel disponible est obligatoire.';
  return null;
}

function renderProgram(program){
  const form = program.form;
  const summary = `<div class="program-head">
    <div class="panel">
      <div class="section-title-row"><h3>${esc(program.name || 'Programme')}</h3><span class="small-note">Code ${esc(program.code)}</span></div>
      <div class="summary-grid">
        <div class="kpi-card"><strong>${esc(GOAL_LABEL[form.mainGoal])}</strong><div class="small-note">Objectif principal</div></div>
        <div class="kpi-card"><strong>${esc(ENV_LABEL[form.env])}</strong><div class="small-note">Lieu</div></div>
        <div class="kpi-card"><strong>${program.freq} / semaine</strong><div class="small-note">Fréquence</div></div>
        <div class="kpi-card"><strong>${program.duration} min</strong><div class="small-note">Durée</div></div>
      </div>
    </div>
    <div class="logic-box">
      <h3 class="block-title">Comment lire le programme</h3>
      <div class="exercise-lines">
        <div><strong>Séries :</strong> nombre de passages complets d’un exercice.</div>
        <div><strong>Répétitions :</strong> nombre de mouvements à faire dans chaque série.</div>
        <div><strong>Repos :</strong> temps de récupération entre les séries, sauf indication contraire.</div>
        <div><strong>Charge :</strong> légère, modérée ou lourde selon le niveau, avec repères simples côté client.</div>
        <div><strong>IMC officiel :</strong> ${program.bmi != null ? `${program.bmi} • ${bmiLabel(program.bmi)}` : 'à compléter'}.</div>
      </div>
    </div>
  </div>`;

  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const week = `<div class="panel"><div class="section-title-row"><h3>Semaine type</h3><span class="small-note">Organisation claire de la semaine</span></div><div class="week-grid">${days.map((d,i)=>`<div class="day-card"><strong>${d}</strong><div>${i < program.freq ? 'Séance' : 'Repos / mobilité'}</div></div>`).join('')}</div></div>`;

  const sessionHtml = program.sessions.map(session => {
    const styleTitle = Object.fromEntries(QUICK_STYLES)[session.style] || session.style;
    const warmHtml = session.warm.map(ex => renderExerciseCard(ex, buildPrescription(session.style === 'strength' ? 'mobility' : 'recovery', form.level, ex, 10, form.env))).join('');
    const mainHtml = session.main.map(ex => renderExerciseCard(ex, buildPrescription(session.style, form.level, ex, program.duration, form.env))).join('');
    const coolHtml = session.cool.map(ex => renderExerciseCard(ex, buildPrescription('recovery', form.level, ex, 8, form.env))).join('');
    return `<section class="panel program-section">
      <div class="section-title-row"><h3>Jour ${session.day} • ${esc(styleTitle)}</h3><span class="small-note">Séance ${session.day}</span></div>
      <div>
        <h4 class="block-title">Échauffement</h4>
        <div class="stack">${warmHtml}</div>
      </div>
      <div>
        <h4 class="block-title">Corps de séance</h4>
        <div class="stack">${mainHtml}</div>
      </div>
      <div>
        <h4 class="block-title">Retour au calme</h4>
        <div class="stack">${coolHtml}</div>
      </div>
    </section>`;
  }).join('');

  byId('coachOutput').innerHTML = `<div class="program-wrap">${summary}${week}${sessionHtml}</div>`;
}

function saveProgram(){
  if(!CURRENT_PROGRAM){ notify('coachOutput', 'Construis un programme avant de l’enregistrer.', 'warn'); return; }
  const programs = getPrograms();
  programs[CURRENT_PROGRAM.code] = CURRENT_PROGRAM;
  setPrograms(programs);
  renderHomeHistory();
  notify('coachOutput', `Programme enregistré sous le code ${CURRENT_PROGRAM.code}.`);
}
function copyLink(){
  if(!CURRENT_PROGRAM){ notify('coachOutput', 'Aucun programme à partager.', 'warn'); return; }
  const link = `${location.origin}${location.pathname}?client=${encodeURIComponent(CURRENT_PROGRAM.code)}`;
  navigator.clipboard.writeText(link).then(()=>notify('coachOutput', 'Lien adhérent copié.'));
}

function initCoachActions(){
  byId('buildProgramBtn').addEventListener('click', ()=>{
    const form = gatherForm();
    const error = validateForm(form);
    if(error){ notify('coachOutput', error, 'error'); return; }
    CURRENT_PROGRAM = buildProgram(form);
    renderProgram(CURRENT_PROGRAM);
    notify('coachOutput', 'Programme généré. Vérifie la cohérence puis enregistre-le.');
  });
  byId('saveProgramBtn').addEventListener('click', saveProgram);
  byId('copyLinkBtn').addEventListener('click', copyLink);
  byId('exportPdfBtn').addEventListener('click', exportPdf);
}

function renderHomeHistory(){
  const wrap = byId('homeHistory');
  const programs = Object.values(getPrograms());
  if(!programs.length){ wrap.innerHTML = '<div class="empty-state">Aucun programme enregistré pour le moment.</div>'; return; }
  wrap.innerHTML = programs.slice(-5).reverse().map(p=>`<button class="history-card open-program" data-code="${esc(p.code)}"><strong>${esc(p.name || p.code)}</strong><div class="small-note">${esc(GOAL_LABEL[p.form.mainGoal] || 'Programme')} • ${esc(ENV_LABEL[p.form.env] || '')}</div></button>`).join('');
  $$('.open-program', wrap).forEach(btn=>btn.addEventListener('click', ()=>{
    const p = getPrograms()[btn.dataset.code];
    if(!p) return;
    CURRENT_PROGRAM = p;
    fillForm(p.form);
    renderProgram(p);
    updateCoachSummary();
    goView('coach');
    showStep(3);
  }));
}

function fillForm(f){
  byId('clientName').value = f.name || '';
  byId('clientCode').value = f.code || '';
  byId('clientAge').value = f.age || '';
  byId('clientHeight').value = f.height || '';
  byId('clientWeight').value = f.weight || '';
  byId('clientLevel').value = f.level || '';
  byId('activityLevel').value = f.activity || '';
  byId('mainGoal').value = f.mainGoal || '';
  byId('environmentSelect').value = f.env || '';
  byId('constraintsInput').value = f.constraints || '';
  byId('clientDuration').value = f.duration || '';
  byId('clientFreq').value = f.freq || '';
  byId('stressLevel').value = f.intensity || 'medium';
  setChipValues('secondaryGoalsChips', f.secondGoals || []);
  setChipValues('equipmentChips', f.equipment || []);
}

function buildQuickSession(){
  const style = byId('quickStyle').value;
  const goal = styleTarget(style);
  const env = byId('quickEnv').value;
  const duration = Number(byId('quickDuration').value);
  const publicKey = byId('quickPublic').value;
  const level = {kids:'beginner',teens:'beginner',adults:'intermediate',seniors:'beginner',athletes:'advanced'}[publicKey] || 'intermediate';
  const ctx = {goal, secondGoals:[], level, env, equipment:PRESET_EQUIPMENT[env] || ['bodyweight'], usedBases:new Set(), usedNames:new Set(), patterns:new Set(), bodyweightOnly:env==='bodyweight_only', loaded:['gym','crossfit_box'].includes(env), boxing:style==='boxing' || env==='boxing_gym', mobility:['mobility','recovery'].includes(style), outdoor:env==='outdoor', avoidStaticWarmup:true};
  const warm = chooseExercises({...ctx, goal:'mobility', mobility:true}, 2);
  const mainCount = style === 'amrap' || style === 'emom' ? 5 : style === 'strength' ? 4 : 4;
  const main = chooseExercises(ctx, mainCount);
  const cool = chooseExercises({...ctx, goal:'mobility', mobility:true, usedBases:new Set(), usedNames:new Set(), patterns:new Set()}, 1);
  const styleTitle = Object.fromEntries(QUICK_STYLES)[style];
  const logic = buildPrescription(style, level, main[0] || {}, duration, env);
  byId('quickOutput').innerHTML = `<div class="quick-wrap">
    <div class="program-head">
      <div class="panel">
        <div class="section-title-row"><h3>${esc(styleTitle)}</h3><span class="small-note">${esc(ENV_LABEL[env])} • ${duration} min</span></div>
        <div class="exercise-lines">
          <div><strong>Public :</strong> ${esc({kids:'Enfants',teens:'Ados',adults:'Adultes',seniors:'Seniors',athletes:'Sportifs avancés'}[publicKey])}</div>
          <div><strong>Lecture pratique :</strong> ${esc(logic.explain)}</div>
          <div><strong>Repos :</strong> ${esc(logic.rest)}</div>
          <div><strong>Charge :</strong> ${esc(logic.charge)}</div>
        </div>
      </div>
      <div class="logic-box">
        <h3 class="block-title">Glossaire</h3>
        <div class="glossary">${Object.values(TECH_GLOSSARY).map(t=>`<div>${esc(t)}</div>`).join('')}</div>
      </div>
    </div>
    <section class="panel program-section"><h4 class="block-title">Échauffement</h4>${warm.map(ex=>renderExerciseCard(ex, buildPrescription('recovery', level, ex, 8, env))).join('')}</section>
    <section class="panel program-section"><h4 class="block-title">Corps de séance</h4>${main.map(ex=>renderExerciseCard(ex, buildPrescription(style, level, ex, duration, env))).join('')}</section>
    <section class="panel program-section"><h4 class="block-title">Retour au calme</h4>${cool.map(ex=>renderExerciseCard(ex, buildPrescription('recovery', level, ex, 6, env))).join('')}</section>
  </div>`;
}

function renderLibrary(){
  const q = byId('libSearch').value.trim().toLowerCase();
  const env = byId('libEnv').value;
  const level = byId('libLevel').value;
  const eq = byId('libEquipment').value;
  const filtered = EXERCISES.filter(ex => {
    if(q && !(`${ex.name} ${ex.muscles} ${ex.tags?.join(' ')}`.toLowerCase().includes(q))) return false;
    if(env && !ex.environments?.includes(env)) return false;
    if(level && ex.level !== level) return false;
    if(eq && !(ex.equipment || []).includes(eq)) return false;
    return true;
  }).slice(0,80);
  byId('libraryMeta').textContent = `${filtered.length} exercice(s) affiché(s).`;
  byId('libraryOutput').innerHTML = filtered.map(ex=>`<article class="library-card"><h5>${esc(ex.name)}</h5><div class="muted-line">${esc(ex.subcategory || ex.category || '')}</div><div class="exercise-lines"><div><strong>Muscles :</strong> ${esc(ex.muscles || '—')}</div><div><strong>Consigne :</strong> ${esc(ex.cue || '—')}</div><div><strong>Version plus facile :</strong> ${esc(ex.easy || '—')}</div><div><strong>Version plus difficile :</strong> ${esc(ex.hard || '—')}</div></div></article>`).join('');
}

function openAthlete(){
  const code = byId('athleteCode').value.trim().toUpperCase();
  const p = getPrograms()[code];
  if(!p){ byId('athleteOutput').innerHTML = '<div class="empty-state">Aucun programme trouvé pour ce code.</div>'; return; }
  const biz = getBusiness()[code] || {status:'actif',amount:0,renewal:''};
  const blocked = biz.status === 'impaye';
  byId('athleteOutput').innerHTML = `<div class="portal-card stack"><div class="portal-header"><h3>${esc(p.name || code)}</h3><span class="chip ${blocked ? '' : 'active'}">${blocked ? 'Accès bloqué' : 'Accès autorisé'}</span></div>${blocked ? '<div class="status-inline warn">Client impayé : accès suspendu.</div>' : ''}<div class="exercise-lines"><div><strong>Objectif :</strong> ${esc(GOAL_LABEL[p.form.mainGoal])}</div><div><strong>Lieu :</strong> ${esc(ENV_LABEL[p.form.env])}</div><div><strong>Fréquence :</strong> ${p.freq} séance(s) / semaine</div></div></div>`;
}

function saveTrack(){
  const code = byId('trackCode').value.trim().toUpperCase();
  if(!code){ byId('progressOutput').innerHTML = '<div class="empty-state">Entre un code adhérent.</div>'; return; }
  const tracks = getTracks();
  tracks[code] = tracks[code] || [];
  tracks[code].push({date:new Date().toISOString(), weight:byId('trackWeight').value, energy:byId('trackEnergy').value, compliance:byId('trackCompliance').value, note:byId('trackNote').value.trim()});
  setTracks(tracks);
  byId('progressOutput').innerHTML = tracks[code].slice().reverse().map(t=>`<div class="history-card"><strong>${new Date(t.date).toLocaleDateString('fr-FR')}</strong><div class="small-note">Poids : ${esc(t.weight || '—')} kg • Énergie : ${esc(t.energy || '—')}/10 • Respect : ${esc(t.compliance || '—')}%</div><div>${esc(t.note || '')}</div></div>`).join('');
}

function showNutrition(){
  const mode = byId('nutritionMode').value;
  let source = null;
  const code = byId('nutritionCode').value.trim().toUpperCase();
  if(mode === 'program' && code) source = getPrograms()[code]?.form || null;
  const audience = byId('nutriAudience').value;
  const goal = mode === 'program' && source ? source.mainGoal : byId('nutriGoal').value;
  const restrictions = getChipValues('nutritionRestrictionsChips');
  const dislikes = getChipValues('nutritionDislikesChips');
  const kcal = {child:1700, teen:2300, adult:2100, senior:1900}[audience] + ({fat_loss:-250,muscle_gain:250,performance:200,recomposition:0,health:0}[goal] || 0);
  const prot = audience === 'child' ? 90 : audience === 'teen' ? 120 : 140;
  const cards = [
    ['Repère énergie', `${kcal} kcal / jour`],
    ['Protéines', `${prot} g / jour`],
    ['Hydratation', audience === 'adult' ? '30 à 35 ml / kg / jour' : 'Hydratation régulière sur la journée'],
    ['Structure simple', 'Petit-déjeuner, repas principal, repas principal, collation si besoin']
  ].map(([k,v])=>`<div class="nutrition-card"><strong>${esc(k)}</strong><div>${esc(v)}</div></div>`).join('');
  const substitutions = [
    restrictions.includes('oeufs') ? 'Sans œufs : yaourt grec, tofu soyeux, fromage blanc, blanc de poulet.' : 'Œufs : source simple de protéines au petit-déjeuner ou en collation.',
    dislikes.includes('legumes') ? 'Légumes peu aimés : privilégier soupes lisses, purées, légumes mixés dans les sauces.' : 'Légumes : au moins 2 repas avec légumes ou crudités.',
    restrictions.includes('lactose') ? 'Sans lactose : boissons végétales enrichies, yaourts sans lactose, tofu.' : 'Produits laitiers : utiles pour calcium et protéines si bien tolérés.',
    'Collation pratique : fruit + yaourt, compote + skyr, sandwich jambon fromage blanc, smoothie maison.'
  ].map(v=>`<div>${esc(v)}</div>`).join('');
  byId('nutritionOutput').innerHTML = `<div class="program-head"><div class="panel"><div class="section-title-row"><h3>Nutrition FAFATRAINING</h3><span class="small-note">${mode === 'program' && source ? 'Basée sur le programme' : 'Mode nutrition seule'}</span></div><div class="card-grid">${cards}</div></div><div class="logic-box"><h3 class="block-title">Substitutions et conseils</h3><div class="glossary">${substitutions}</div></div></div>`;
}

function saveBusiness(){
  const code = byId('bizCodeInput').value.trim().toUpperCase();
  if(!code){ byId('businessOutput').innerHTML = '<div class="empty-state">Entre un code adhérent.</div>'; return; }
  const business = getBusiness();
  business[code] = {status:byId('bizStatusInput').value, amount:Number(byId('bizAmountInput').value || 0), renewal:byId('bizRenewalInput').value || ''};
  setBusiness(business);
  byId('businessOutput').innerHTML = `<div class="history-card"><strong>${esc(code)}</strong><div class="small-note">Statut : ${esc(business[code].status)} • Montant : ${business[code].amount} € • Échéance : ${esc(business[code].renewal || '—')}</div></div>`;
}

function exportPdf(){
  if(!CURRENT_PROGRAM || !window.jspdf?.jsPDF){ notify('coachOutput', 'Aucun programme à exporter.', 'warn'); return; }
  const doc = new window.jspdf.jsPDF({unit:'pt', format:'a4'});
  const margin = 42;
  let y = 46;
  const pageH = doc.internal.pageSize.height;
  const write = (text, size=12, bold=false, color=[15,24,35]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, 510);
    if(y + lines.length * (size + 3) > pageH - 50){ doc.addPage(); y = 46; }
    doc.text(lines, margin, y); y += lines.length * (size + 4);
  };
  doc.setFillColor(10,18,28); doc.roundedRect(30, 24, 535, 72, 18, 18, 'F');
  doc.setTextColor(200,255,41); doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('FAFATRAINING', margin, 48);
  doc.setTextColor(242,247,252); doc.setFontSize(24); doc.text(CURRENT_PROGRAM.name || CURRENT_PROGRAM.code, margin, 76);
  y = 118;
  write(`Objectif principal : ${GOAL_LABEL[CURRENT_PROGRAM.form.mainGoal]}`, 14, true);
  write(`Lieu : ${ENV_LABEL[CURRENT_PROGRAM.form.env]} • Fréquence : ${CURRENT_PROGRAM.freq} / semaine • Durée : ${CURRENT_PROGRAM.duration} min`, 11);
  write(`IMC officiel : ${CURRENT_PROGRAM.bmi ?? '—'} ${CURRENT_PROGRAM.bmi != null ? `(${bmiLabel(CURRENT_PROGRAM.bmi)})` : ''}`, 11);
  CURRENT_PROGRAM.sessions.forEach(session => {
    write(`Jour ${session.day} • ${Object.fromEntries(QUICK_STYLES)[session.style] || session.style}`, 16, true, [21,66,33]);
    write('Échauffement', 13, true);
    session.warm.forEach(ex=>{ const p = buildPrescription('recovery', CURRENT_PROGRAM.form.level, ex, 8, CURRENT_PROGRAM.form.env); write(`${ex.name} — ${p.series} • ${p.reps} • ${p.rest}`, 10, true); write(`Consigne : ${ex.cue}`, 10); write(`Version facile : ${ex.easy} • Version difficile : ${ex.hard}`, 10); });
    write('Corps de séance', 13, true);
    session.main.forEach(ex=>{ const p = buildPrescription(session.style, CURRENT_PROGRAM.form.level, ex, CURRENT_PROGRAM.duration, CURRENT_PROGRAM.form.env); write(`${ex.name} — ${p.series} • ${p.reps} • ${p.rest}`, 10, true); write(`Charge : ${p.charge}`, 10); write(`Consigne : ${ex.cue}`, 10); write(`Version facile : ${ex.easy} • Version difficile : ${ex.hard}`, 10); });
    write('Retour au calme', 13, true);
    session.cool.forEach(ex=>{ const p = buildPrescription('recovery', CURRENT_PROGRAM.form.level, ex, 6, CURRENT_PROGRAM.form.env); write(`${ex.name} — ${p.series} • ${p.reps} • ${p.rest}`, 10, true); write(`Consigne : ${ex.cue}`, 10); });
  });
  doc.save(`FAFATRAINING_${CURRENT_PROGRAM.code}.pdf`);
}

async function loadExercises(){
  const res = await fetch('data/exercises.json');
  EXERCISES = await res.json();
}

function parseClientLink(){
  const code = new URLSearchParams(location.search).get('client');
  if(!code) return;
  byId('athleteCode').value = code.toUpperCase();
  goView('athlete');
  openAthlete();
}

async function init(){
  await loadExercises();
  initNav(); initSteps(); initChips(); populateSelects(); initAutoPresets(); bindSummary(); updateCoachSummary();
  initCoachActions(); renderHomeHistory();
  byId('quickBuildBtn').addEventListener('click', buildQuickSession);
  byId('libSearchBtn').addEventListener('click', renderLibrary);
  byId('openAthleteBtn').addEventListener('click', openAthlete);
  byId('saveTrackBtn').addEventListener('click', saveTrack);
  byId('showNutritionBtn').addEventListener('click', showNutrition);
  byId('saveBizBtn').addEventListener('click', saveBusiness);
  parseClientLink();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

document.addEventListener('DOMContentLoaded', init);
