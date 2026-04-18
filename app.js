const $ = (s, root=document)=>root.querySelector(s);
const $$ = (s, root=document)=>Array.from(root.querySelectorAll(s));

const STORAGE_KEYS = {
  programs: 'fafa_programs_v302',
  tracks: 'fafa_tracks_v302',
  business: 'fafa_business_v302'
};

const GOAL_LABELS = {
  fat_loss:'Perte de poids',
  recomposition:'Recomposition corporelle',
  muscle_gain:'Prise de muscle',
  strength:'Force',
  conditioning:'Condition physique',
  endurance:'Endurance',
  boxing:'Boxe',
  hyrox:'Hyrox',
  trail:'Trail',
  mobility:'Mobilité / stretching',
  health:'Santé / remise en forme',
  return_to_play:'Retour de blessure'
};

const TECH_LABELS = {
  hiit:'HIIT (intervalles haute intensité)',
  emom:'EMOM (chaque minute sur la minute)',
  amrap:'AMRAP (maximum de tours)',
  zone2:'Zone 2 (endurance fondamentale)',
  hyrox:'Hyrox (course + ateliers fonctionnels)',
  classic:'Classique (séries traditionnelles)',
  interval:'Intervalle (effort / récupération)',
  boxing_rounds:'Rounds boxe (rounds chronométrés)',
  circuit:'Circuit (enchaînement d’exercices)',
  mobility:'Mobilité / stretching',
  strength:'Force',
  conditioning:'Condition physique',
  recovery:'Récupération / retour au calme',
  core:'Ceinture abdominale / gainage'
};

const EQUIPMENT_OPTIONS = [
  ['bodyweight','Poids du corps'],['mat','Tapis de sol'],['dumbbell','Haltères'],['barbell','Barre'],['bench','Banc'],['rack','Rack / cage'],['cable','Poulie / vis-à-vis'],['machine','Machine guidée'],['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],['treadmill','Tapis de course'],['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],['med_ball','Medicine ball'],['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],['ladder','Échelle de rythme'],['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],['skierg','SkiErg'],['dip_bars','Barres dips'],['landmine','Landmine'],['box','Plyo box / step'],['chair','Chaise'],['sofa','Canapé / rebord stable'],['stairs','Marches / escalier'],['backpack','Sac à dos lestable'],['water_bottles','Bouteilles / bidons'],['foam_roller','Foam roller'],['towel','Serviette'],['sandbag','Sandbag'],['rings','Anneaux'],['pullup_bar','Barre de traction'],['mini_band','Mini-band'],['cones','Plots / balises']
];
const EQ_LABEL = Object.fromEntries(EQUIPMENT_OPTIONS);

const ENV_LABELS = {
  gym:'Salle de musculation',
  crossfit_box:'Salle CrossFit / Hyrox',
  boxing_gym:'Salle de boxe',
  home:'Maison / appartement',
  outdoor:'Extérieur',
  bodyweight_only:'Poids du corps uniquement'
};

const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','bike','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack','cones'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles']
};

const QUICK_STYLE_OPTIONS = [
  ['circuit', TECH_LABELS.circuit],
  ['hiit', TECH_LABELS.hiit],
  ['emom', TECH_LABELS.emom],
  ['amrap', TECH_LABELS.amrap],
  ['boxing', 'Boxe'],
  ['mobility', 'Mobilité / stretching'],
  ['strength', 'Force'],
  ['conditioning', 'Condition physique'],
  ['hyrox', TECH_LABELS.hyrox],
  ['trail', 'Trail / course'],
  ['core', 'Ceinture abdominale / gainage'],
  ['health', 'Santé / remise en forme'],
  ['recovery', 'Récupération / retour au calme'],
  ['zone2', TECH_LABELS.zone2]
];

const MULTI_FIELDS = ['secondGoals','practicePrefs','coachingTypes','supports','cycleGoals','focusTargets','fafaModules','medicalKnown','injuryKnown','foodKnown','equipmentSelect','effortFormats','nutriRestrictions','nutriDislikes'];

let EXERCISES = [];
let CURRENT_PROGRAM = null;
let LOGO_DATA = null;

const esc = (v='') => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const saveLocal = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
const loadLocal = (k,fallback)=>{ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback));}catch(e){return fallback;} };
const baseName = ex => (ex?.name || '').split('—')[0].trim().toLowerCase();
const randomPick = arr => arr[Math.floor(Math.random()*arr.length)];
const LOADED_KEYS = ['barbell','dumbbell','machine','cable','kettlebell','trap_bar','landmine','sandbag','sled','heavy_bag','med_ball','battle_rope','skierg','rower','airbike','bike'];

function normalizeText(v=''){ return String(v || '').toLowerCase(); }
function isLoadedExercise(ex){ return (ex?.equipment || []).some(e=>LOADED_KEYS.includes(e)); }
function movementFamily(ex){
  const text = normalizeText(`${ex?.name} ${ex?.subcategory} ${ex?.muscles} ${(ex?.tags||[]).join(' ')}`);
  if(/shadow|sac|boxe|bag|pads|jab|cross|hook|uppercut/.test(text)) return 'boxing';
  if(/course|run|marche|sprint|trail|zone 2|zone2|bike|rameur|rower|ski|erg|carry|sled/.test(text)) return 'engine';
  if(/mobil|stretch|resp|souplesse|rotation|foam|recovery/.test(text)) return 'mobility';
  if(/gainage|plank|core|hollow|dead bug|anti-rotation|abdo|anti-extension/.test(text)) return 'core';
  if(/split squat|fente|lunge|step up|step-up|quadriceps|jambes dominant squat|squat/.test(text)) return 'squat';
  if(/deadlift|hip thrust|romanian|rdl|soulev|ischio|chaîne post|good morning|hinge/.test(text)) return 'hinge';
  if(/développ|bench|pompe|push|pec|pector|triceps/.test(text)) return 'push';
  if(/tirage|row|traction|pull|lat|dos|biceps/.test(text)) return 'pull';
  if(/mollet|calf/.test(text)) return 'calves';
  return ex?.subcategory || ex?.category || 'general';
}
function getStyleSpec(style, env){
  const loadedEnv = ['gym','crossfit_box'].includes(env);
  const specs = {
    circuit:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['squat','push','hinge','pull','engine'], mode:'circuit'},
    hiit:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['engine','squat','push','hinge','core'], mode:'hiit'},
    emom:{mainCount:4, warmupCount:3, cooldownCount:2, mainPatterns:['squat','push','hinge','pull'], mode:'emom'},
    amrap:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['squat','push','hinge','pull','core'], mode:'amrap'},
    strength:{mainCount:loadedEnv?5:4, warmupCount:3, cooldownCount:2, mainPatterns:loadedEnv?['squat','push','hinge','pull','core']:['squat','hinge','push','core'], mode:'strength'},
    boxing:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['boxing','engine','core','boxing','mobility'], mode:'boxing'},
    mobility:{mainCount:5, warmupCount:2, cooldownCount:2, mainPatterns:['mobility','mobility','core','mobility','engine'], mode:'mobility'},
    recovery:{mainCount:4, warmupCount:2, cooldownCount:2, mainPatterns:['mobility','core','mobility','engine'], mode:'recovery'},
    zone2:{mainCount:3, warmupCount:2, cooldownCount:2, mainPatterns:['engine','engine','mobility'], mode:'zone2'},
    trail:{mainCount:4, warmupCount:3, cooldownCount:2, mainPatterns:['engine','hinge','squat','core'], mode:'trail'},
    hyrox:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['engine','squat','hinge','push','carry'], mode:'hyrox'},
    core:{mainCount:4, warmupCount:2, cooldownCount:2, mainPatterns:['core','core','squat','mobility'], mode:'core'},
    health:{mainCount:4, warmupCount:3, cooldownCount:2, mainPatterns:['mobility','squat','push','engine'], mode:'health'},
    conditioning:{mainCount:5, warmupCount:3, cooldownCount:2, mainPatterns:['engine','squat','push','hinge','core'], mode:'conditioning'}
  };
  return specs[style] || specs.circuit;
}
function rangeForLevel(level, beginner, intermediate, advanced){
  return level === 'beginner' ? beginner : level === 'advanced' ? advanced : intermediate;
}
function rotateBySeed(list, seed=''){ 
  const arr = [...list];
  if(!arr.length) return arr;
  let n = 0; for(const ch of String(seed)) n += ch.charCodeAt(0);
  const offset = n % arr.length;
  return arr.slice(offset).concat(arr.slice(0, offset));
}

function goalLabel(v){ return GOAL_LABELS[v] || v || '—'; }
function envLabel(v){ return ENV_LABELS[v] || v || '—'; }
function levelLabel(v){ return {beginner:'Débutant',intermediate:'Intermédiaire',advanced:'Avancé'}[v] || '—'; }
function activityLabel(v){ return {sedentary:'Peu actif au quotidien',moderate:'Activité quotidienne modérée',active:'Actif au quotidien',very_active:'Très actif au quotidien'}[v] || '—'; }
function lifeLabel(v){ return {desk:'Travail surtout assis',mixed:'Rythme mixte',physical:'Travail physique',shift:'Horaires décalés',parent:'Vie familiale très chargée'}[v] || '—'; }
function sexLabel(v){ return {male:'Homme',female:'Femme'}[v] || '—'; }
function formatLabel(v){ return TECH_LABELS[v] || v; }
function eqLabel(v){ return EQ_LABEL[v] || v; }
function getPrograms(){ return loadLocal(STORAGE_KEYS.programs, {}); }
function setPrograms(v){ saveLocal(STORAGE_KEYS.programs, v); }
function getTracks(){ return loadLocal(STORAGE_KEYS.tracks, {}); }
function getBusiness(){ return loadLocal(STORAGE_KEYS.business, {}); }

function notify(hostId, msg, type='ok'){
  const host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
  if(!host) return;
  let el = host.querySelector('.status-inline');
  if(!el){ el = document.createElement('div'); host.prepend(el); }
  el.className = `status-inline ${type}`;
  el.textContent = msg;
}

function preloadLogo(){
  return fetch('assets/logo.jpeg').then(r=>r.blob()).then(blob=>new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload=()=>{LOGO_DATA=fr.result;resolve();};
    fr.onerror=reject; fr.readAsDataURL(blob);
  })).catch(()=>{ LOGO_DATA = null; });
}

function buildEquipmentOptions(){
  const select = $('#equipmentSelect');
  if(!select) return;
  select.innerHTML = EQUIPMENT_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
}

function extendQuickStyles(){
  const sel = $('#quickStyle');
  if(!sel) return;
  sel.innerHTML = QUICK_STYLE_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
}

function getMulti(id){
  const select = document.getElementById(id);
  return select ? Array.from(select.selectedOptions).map(o=>o.value).filter(Boolean) : [];
}
function setMulti(id, values){
  const select = document.getElementById(id);
  if(!select) return;
  const set = new Set(values || []);
  Array.from(select.options).forEach(opt => opt.selected = set.has(opt.value));
  if(select._updateUI) select._updateUI();
}

function mountMultiSelect(select){
  if(!select || select.dataset.enhanced) return;
  select.dataset.enhanced = '1';
  select.hidden = true;
  select.style.display = 'none';

  const host = document.createElement('div');
  host.className = 'ms';
  host.innerHTML = `
    <button type="button" class="ms-trigger"><span class="ms-value">Aucune sélection</span><span class="ms-arrow">▾</span></button>
    <div class="ms-tags"></div>
    <div class="ms-menu" hidden>
      <input class="ms-search" type="text" placeholder="Rechercher...">
      <div class="ms-options"></div>
    </div>`;
  select.after(host);
  host.appendChild(select);

  const trigger = $('.ms-trigger', host);
  const value = $('.ms-value', host);
  const tags = $('.ms-tags', host);
  const menu = $('.ms-menu', host);
  const search = $('.ms-search', host);
  const options = $('.ms-options', host);

  function refreshPlaceholder(chosen){
    if(!chosen.length){
      value.textContent = 'Aucune sélection';
      tags.innerHTML = '';
      return;
    }
    value.textContent = `${chosen.length} sélection${chosen.length>1?'s':''}`;
    tags.innerHTML = chosen.map(opt=>`<span class="tag">${esc(opt.textContent)}</span>`).join('');
  }

  function renderOptions(){
    const q = (search.value || '').toLowerCase().trim();
    options.innerHTML = '';
    Array.from(select.options).forEach(opt => {
      if(q && !opt.textContent.toLowerCase().includes(q)) return;
      const row = document.createElement('label');
      row.className = 'ms-option';
      row.innerHTML = `<input type="checkbox" ${opt.selected ? 'checked' : ''}><span>${esc(opt.textContent)}</span>`;
      row.querySelector('input').addEventListener('change', ev => {
        opt.selected = ev.target.checked;
        refresh();
        select.dispatchEvent(new Event('change', {bubbles:true}));
      });
      options.appendChild(row);
    });
  }

  function refresh(){
    const chosen = Array.from(select.selectedOptions);
    refreshPlaceholder(chosen);
    renderOptions();
  }

  trigger.addEventListener('click', (ev)=>{
    ev.preventDefault();
    const open = menu.hidden;
    $$('.ms-menu').forEach(m=>m.hidden=true);
    $$('.ms').forEach(x=>x.classList.remove('open'));
    if(open){ menu.hidden=false; host.classList.add('open'); search.focus(); }
  });
  search.addEventListener('input', renderOptions);
  document.addEventListener('click', ev=>{ if(!host.contains(ev.target)){ menu.hidden=true; host.classList.remove('open'); } });
  select._updateUI = refresh;
  refresh();
}
function enhanceMultiSelects(){ MULTI_FIELDS.forEach(id=>mountMultiSelect(document.getElementById(id))); }

function initNav(){
  $$('.navbtn').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.view)));
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
  $$('.step-panel').forEach(p=>p.classList.toggle('active', p.dataset.stepPanel===String(step)));
}

function decorateLabels(){
  const map = {
    clientName:{hint:'Nom visible dans le programme et dans le portail adhérent.', req:true},
    clientCode:{hint:'Code unique simple, par exemple ALEX01.', req:true},
    clientEmail:{hint:'Optionnel. Utile pour le suivi client.', req:false},
    clientAge:{hint:'Sert à adapter le volume, la sécurité et la nutrition.', req:true},
    clientSex:{hint:'Sert uniquement aux calculs santé et nutrition.', req:true},
    clientLevel:{hint:'Niveau d’entraînement réel du client.', req:true, title:'Niveau d’entraînement'},
    currentSport:{hint:'Optionnel. Sert seulement à connaître les habitudes sportives actuelles du client.', req:false, title:'Pratique actuelle'},
    availabilityWeekly:{hint:'Nombre de jours réellement disponibles.', req:true, title:'Disponibilité hebdomadaire'},
    activityLevel:{hint:'Niveau de mouvement dans la vie quotidienne : peu actif, actif, très actif.', req:true, title:'Niveau d’activité quotidien'},
    lifeContext:{hint:'Organisation générale : travail assis, horaires décalés, travail physique, vie familiale chargée…', req:true, title:'Rythme de vie / contraintes'},
    waistCm:{hint:'Optionnel. Sert à compléter la lecture santé.', req:false},
    secondGoals:{hint:'Axes complémentaires. 0 à 3 choix maximum.', req:false, title:'Objectifs secondaires'},
    practicePrefs:{hint:'Où et comment le client aime s’entraîner : maison, salle, extérieur, visio…', req:false, title:'Préférences de pratique'},
    coachingTypes:{hint:'Pôle principal du coaching : général, boxe, trail, force, santé, nutrition…', req:false, title:'Type de coaching'},
    supports:{hint:'Format d’accompagnement : à distance, en présentiel, en visio, programme seul…', req:false, title:'Mode d’accompagnement'},
    environmentSelect:{hint:'Lieu principal où le client s’entraîne la plupart du temps.', req:true, title:'Contexte d’entraînement'},
    cycleGoals:{hint:'Cap du cycle : hypertrophie, force, condition physique, santé, maintien…', req:false, title:'Orientation du cycle'},
    focusTargets:{hint:'Zones corporelles à prioriser : haut du corps, bas du corps, dos, gainage…', req:false, title:'Focus musculaires'},
    fafaModules:{hint:'Modules spécifiques vraiment utiles pour ce client, sans surcharger.', req:false, title:'Modules FAFATRAINING'},
    medicalKnown:{hint:'Pathologies déclarées qui peuvent modifier le choix des exercices ou l’intensité.', req:false, title:'Pathologies connues'},
    injuryKnown:{hint:'Douleurs, antécédents ou zones fragiles à protéger.', req:false, title:'Blessures / limitations'},
    foodKnown:{hint:'Allergies, exclusions, restrictions ou préférences alimentaires.', req:false, title:'Allergies / restrictions alimentaires'},
    equipmentSelect:{hint:'Matériel réellement disponible. Des pré-sélections automatiques sont proposées selon le lieu choisi, puis tu peux ajouter ou enlever du matériel.', req:true, title:'Matériel disponible'},
    effortFormats:{hint:'Formats d’effort que tu veux privilégier : circuit, HIIT, EMOM, AMRAP, rounds boxe…', req:false, title:'Formats d’effort favoris'},
    clientFreq:{hint:'Fréquence cible. Laisse “Auto” si tu veux une suggestion.', req:true, title:'Fréquence / semaine'},
    clientDuration:{hint:'Durée cible. Laisse “Auto” si tu veux une suggestion.', req:true, title:'Durée / séance'},
    cycleWeeks:{hint:'Durée du cycle avant réévaluation.', req:true, title:'Cycle (semaines)'},
    sleepHours:{hint:'Impacte récupération et nutrition.', req:false, title:'Sommeil moyen'},
    stressLevel:{hint:'Niveau de fatigue nerveuse ou de stress actuel.', req:false, title:'Niveau de stress'},
    bizStatus:{hint:'Statut d’accès client.', req:false, title:'Statut abonnement'},
    bizAmount:{hint:'Montant effectivement encaissé.', req:false, title:'Montant payé (€)'}
  };
  Object.entries(map).forEach(([id, cfg])=>{
    const field = document.getElementById(id);
    if(!field) return;
    const label = field.closest('label');
    if(!label) return;
    const mainTitle = cfg.title || (label.childNodes[0]?.textContent || '').trim();
    label.childNodes[0] && label.childNodes[0].remove();
    label.insertAdjacentHTML('afterbegin', `<span class="label-line"><span>${esc(mainTitle)}</span><span class="field-badge ${cfg.req?'required':'optional'}">${cfg.req?'obligatoire':'optionnel'}</span></span>${cfg.hint ? `<span class="help-text">${esc(cfg.hint)}</span>`:''}`);
  });
}

function calcBMI(weightKg, heightCm){
  const w = Number(weightKg); const h = Number(heightCm)/100;
  if(!w || !h) return null;
  const bmi = w / (h*h);
  let label = 'Poids normal';
  if(bmi < 18.5) label = 'Insuffisance pondérale';
  else if(bmi < 25) label = 'Poids normal';
  else if(bmi < 30) label = 'Surpoids';
  else if(bmi < 35) label = 'Obésité modérée';
  else if(bmi < 40) label = 'Obésité sévère';
  else label = 'Obésité très sévère';
  return {
    value: bmi.toFixed(1),
    formula: 'IMC = poids (kg) / taille² (m)',
    label
  };
}

function calcCalories({sex, weight, height, age, goal, activityFactor=1.5}){
  weight = Number(weight||0); height = Number(height||0); age = Number(age||0);
  if(!weight || !height || !age) return null;
  const bmr = sex === 'female' ? (10*weight + 6.25*height - 5*age - 161) : (10*weight + 6.25*height - 5*age + 5);
  let kcal = bmr * activityFactor;
  if(goal === 'fat_loss') kcal -= 300;
  else if(goal === 'muscle_gain') kcal += 220;
  else if(['hyrox','trail','conditioning','endurance'].includes(goal)) kcal += 120;
  const protein = Math.round(weight * (goal === 'muscle_gain' || goal === 'strength' ? 2.0 : 1.7));
  const fats = Math.round(weight * 0.8);
  const carbs = Math.max(90, Math.round((kcal - protein*4 - fats*9)/4));
  return {kcal:Math.round(kcal), protein, fats, carbs};
}

function activityFactor(activity, sessions){
  if(activity === 'sedentary') return 1.25;
  if(activity === 'moderate') return sessions >= 4 ? 1.45 : 1.35;
  if(activity === 'active') return sessions >= 4 ? 1.6 : 1.5;
  if(activity === 'very_active') return 1.75;
  return 1.4;
}

function autoFillDerived(){
  const env = $('#environmentSelect').value;
  if(env && (!getMulti('equipmentSelect').length || $('#equipmentSelect').dataset.autofill !== 'done')){
    setMulti('equipmentSelect', PRESETS[env] || []);
    $('#equipmentSelect').dataset.autofill = 'done';
  }
  if(!$('#clientFreq').value){
    const availability = $('#availabilityWeekly').value;
    $('#clientFreq').value = availability === '1' ? '2' : availability === '2-3' ? '3' : availability === '4-5' ? '4' : availability === '6+' ? '5' : '3';
  }
  if(!$('#clientDuration').value){
    const lvl = $('#clientLevel').value;
    $('#clientDuration').value = lvl === 'beginner' ? '45' : lvl === 'advanced' ? '75' : '60';
  }

  const goal = $('#mainGoal').value;
  if(goal && !getMulti('cycleGoals').length){
    const map = {fat_loss:['conditioning'],recomposition:['hypertrophy'],muscle_gain:['hypertrophy'],strength:['strength'],conditioning:['conditioning'],endurance:['conditioning'],boxing:['conditioning'],hyrox:['conditioning'],trail:['conditioning'],mobility:['mobility'],health:['health'],return_to_play:['health']};
    setMulti('cycleGoals', map[goal] || ['conditioning']);
  }
  if(goal && !getMulti('coachingTypes').length){
    const list = ['general'];
    if(['muscle_gain','fat_loss','recomposition','strength','conditioning'].includes(goal)) list.push('fitness');
    if(goal==='boxing') list.push('boxing');
    if(goal==='hyrox') list.push('hyrox');
    if(goal==='trail' || goal==='endurance') list.push('trail');
    if(['health','return_to_play','mobility'].includes(goal)) list.push('health');
    setMulti('coachingTypes', [...new Set(list)]);
  }
  updateSummary();
}

function readForm(){
  const form = {
    name: $('#clientName').value.trim() || 'Client FAFATRAINING',
    code: ($('#clientCode').value.trim() || ($('#clientName').value.trim().split(/\s+/).slice(0,2).join('').substring(0,6) || 'FAFA')).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,12),
    email: $('#clientEmail').value.trim(),
    age: Number($('#clientAge').value || 0),
    sex: $('#clientSex').value,
    level: $('#clientLevel').value || 'intermediate',
    height: Number($('#clientHeight').value || 0),
    weight: Number($('#clientWeight').value || 0),
    currentSport: $('#currentSport').value,
    availability: $('#availabilityWeekly').value,
    activity: $('#activityLevel').value,
    lifeContext: $('#lifeContext').value,
    waist: Number($('#waistCm').value || 0),
    mainGoal: $('#mainGoal').value,
    secondGoals: getMulti('secondGoals').slice(0,3),
    practicePrefs: getMulti('practicePrefs'),
    coachingTypes: getMulti('coachingTypes'),
    supports: getMulti('supports'),
    env: $('#environmentSelect').value,
    cycleGoals: getMulti('cycleGoals'),
    focusTargets: getMulti('focusTargets'),
    modules: getMulti('fafaModules'),
    medical: getMulti('medicalKnown'),
    injuries: getMulti('injuryKnown'),
    foods: getMulti('foodKnown'),
    notes: $('#healthNotes').value.trim(),
    equipment: getMulti('equipmentSelect'),
    effortFormats: getMulti('effortFormats'),
    freq: Number($('#clientFreq').value || 0),
    duration: Number($('#clientDuration').value || 0),
    cycleWeeks: Number($('#cycleWeeks').value || 8),
    sleep: Number($('#sleepHours').value || 7),
    stress: $('#stressLevel').value,
    bizStatus: $('#bizStatus').value,
    bizAmount: Number($('#bizAmount').value || 0)
  };
  form.bmi = calcBMI(form.weight, form.height);
  form.nutrition = calcCalories({sex:form.sex, weight:form.weight, height:form.height, age:form.age, goal:form.mainGoal, activityFactor:activityFactor(form.activity, form.freq || 3)});
  return form;
}

function updateSummary(){
  const f = readForm();
  const rows = [
    ['Client', f.name],
    ['Objectif', goalLabel(f.mainGoal)],
    ['Contexte', envLabel(f.env) || 'À définir'],
    ['Niveau', levelLabel(f.level)],
    ['Activité quotidienne', activityLabel(f.activity)],
    ['Rythme de vie', lifeLabel(f.lifeContext)],
    ['Fréquence conseillée', f.freq ? `${f.freq} / semaine` : 'Auto'],
    ['Durée conseillée', f.duration ? `${f.duration} min` : 'Auto'],
    ['IMC officiel', f.bmi ? `${f.bmi.value} · ${f.bmi.label}` : '—'],
    ['Lecture santé', f.bmi ? `${f.bmi.formula}` : 'Renseigner taille et poids'],
    ['Modules', f.modules.map(goalLabel).join(', ') || '—'],
    ['Statut business', `${f.bizStatus} / ${f.bizAmount>0?'payé':'non payé'}`]
  ];
  $('#coachSummary').innerHTML = rows.map(([k,v])=>`<div><strong>${esc(k)} :</strong> ${esc(v)}</div>`).join('');
}

function parseClientInput(raw){
  const txt = (raw || '').trim();
  if(!txt) return '';
  try{ const u = new URL(txt); return (u.searchParams.get('client') || '').trim().toUpperCase(); }catch(e){}
  const m = txt.match(/client=([^&\s]+)/i); if(m) return decodeURIComponent(m[1]).trim().toUpperCase();
  const c = txt.match(/code\s*adh[ée]rent\s*:?\s*([A-Z0-9_-]+)/i); if(c) return c[1].toUpperCase();
  return txt.toUpperCase();
}

function resolveProgram(raw){
  const code = parseClientInput(raw);
  const programs = getPrograms();
  return {code, program: programs[code] || null};
}

function scoreExercise(ex, ctx){
  let score = 0;
  const text = normalizeText(`${ex.name} ${ex.category} ${ex.subcategory} ${ex.muscles} ${(ex.tags||[]).join(' ')} ${(ex.focus||[]).join(' ')}`);
  const family = movementFamily(ex);
  if(ex.level === ctx.level) score += 16;
  else if(ctx.level === 'advanced' && ex.level === 'intermediate') score += 10;
  else if(ctx.level === 'intermediate' && ex.level === 'beginner') score += 7;
  if(ctx.env && ex.environments?.includes(ctx.env)) score += 22;
  if(ctx.env === 'gym' && ex.environments?.includes('gym')) score += 12;
  if(ctx.equipment?.length && ex.equipment?.some(e=>ctx.equipment.includes(e))) score += 16;
  if(ctx.goal && (ex.tags||[]).includes(ctx.goal)) score += 24;
  if((ctx.secondGoals||[]).some(g=>(ex.tags||[]).includes(g))) score += 10;
  if(ctx.pattern && family === ctx.pattern) score += 26;
  if((ctx.keywords||[]).some(k=>text.includes(k))) score += 12;
  if((ctx.focusTargets||[]).some(k=>text.includes(k.replace('_',' ')))) score += 10;
  if(ctx.loadedPriority && isLoadedExercise(ex)) score += 20;
  if(ctx.bodyweightPriority && ex.equipment?.includes('bodyweight')) score += 14;
  if(ctx.preferMobility && family === 'mobility') score += 18;
  if(ctx.preferEngine && family === 'engine') score += 16;
  if((ctx.disallowFamilies||[]).includes(family)) score -= 80;
  if((ctx.exclude||[]).includes(baseName(ex))) score -= 100;
  if(ctx.avoidBurpee && /burpee/i.test(text)) score -= 90;
  if(ctx.medical.includes('hypertension') && /(all out|max|sprint)/i.test(text)) score -= 40;
  if(ctx.injuries.includes('genou') && /(jump|bond|saut|plyo)/i.test(text)) score -= 35;
  if(ctx.injuries.includes('dos') && /(good morning|rotation explosive)/i.test(text)) score -= 35;
  if(ctx.injuries.includes('epaule') && /(overhead|snatch|jerk|handstand)/i.test(text)) score -= 35;
  if(ctx.goal === 'strength' && ctx.env === 'gym' && family === 'engine') score -= 35;
  if(ctx.goal === 'mobility' && !['mobility','core','engine'].includes(family)) score -= 20;
  if(ctx.goal === 'boxing' && !['boxing','engine','core','mobility'].includes(family)) score -= 24;
  return score;
}

function pickExercises(ctx, count=4){
  const pool = EXERCISES.filter(ex => {
    if(!ex.name) return false;
    if(ctx.env && ex.environments && !ex.environments.includes(ctx.env) && !(ctx.env==='gym' && ex.environments.includes('home'))) return false;
    if(ctx.equipment?.length && ex.equipment && ex.equipment.length && !ex.equipment.some(e=>ctx.equipment.includes(e))) return false;
    return true;
  }).map(ex => ({ex, score: scoreExercise(ex, ctx)})).filter(x=>x.score > 0).sort((a,b)=>b.score-a.score);
  const chosen = [];
  const usedNames = new Set(ctx.exclude || []);
  const usedFamilies = new Set(ctx.usedFamilies || []);
  const rotated = rotateBySeed(pool, ctx.seed || `${ctx.goal}-${ctx.pattern}-${ctx.env}`);
  for(const row of rotated){
    const base = baseName(row.ex);
    const family = movementFamily(row.ex);
    if(usedNames.has(base)) continue;
    if(usedFamilies.has(family) && !['mobility','engine','core','boxing'].includes(family)) continue;
    chosen.push(row.ex);
    usedNames.add(base);
    usedFamilies.add(family);
    if(chosen.length >= count) break;
  }
  return chosen;
}

function splitForGoal(goal, freq){
  const f = Number(freq || 3);
  if(goal === 'strength') return f===2 ? ['Force bas du corps','Force haut du corps'] : f===3 ? ['Dominante squat','Poussée','Dominante charnière / tirage'] : f===4 ? ['Dominante squat','Poussée','Dominante charnière','Tirage'] : ['Dominante squat','Poussée','Dominante charnière','Tirage','Assistance / gainage'];
  if(goal === 'muscle_gain' || goal === 'recomposition') return f===2 ? ['Haut du corps','Bas du corps'] : f===3 ? ['Poussée','Tirage','Jambes'] : f===4 ? ['Poussée','Tirage','Jambes dominant squat','Jambes dominant charnière'] : ['Poussée','Tirage','Jambes dominant squat','Haut du corps volume','Jambes dominant charnière'];
  if(goal === 'boxing') return f===2 ? ['Technique + appuis','Préparation physique boxe'] : ['Technique + appuis','Force utile','Conditioning boxe','Mobilité / gainage'].slice(0,f);
  if(goal === 'hyrox') return ['Force utile','Moteur / ergos','Ateliers Hyrox','Hyrox simulation'].slice(0, Math.max(3,f));
  if(goal === 'trail' || goal === 'endurance') return ['Force utile coureur','Seuil / côtes','Sortie endurance / zone 2','Mobilité / gainage'].slice(0, Math.max(3,f));
  if(goal === 'mobility' || goal === 'health' || goal === 'return_to_play') return ['Mobilité globale','Stabilité / gainage','Force douce / moteur santé','Respiration / récupération'].slice(0, Math.max(3, Math.min(f,4)));
  return f===2 ? ['Corps entier A','Corps entier B'] : f===3 ? ['Corps entier','Condition physique','Jambes + gainage'] : f===4 ? ['Poussée','Tirage','Jambes','Condition physique'] : ['Poussée','Tirage','Jambes','Condition physique','Assistance / gainage'];
}

function loadGuidance(form, ex){
  const eq = ex.equipment || [];
  if(eq.includes('bodyweight') && !eq.some(e=>['dumbbell','barbell','machine','cable','kettlebell','trap_bar','landmine','sandbag'].includes(e))) return '';
  if(form.level === 'beginner') return 'Charge technique · garder environ 3 répétitions en réserve';
  if(form.level === 'intermediate') return 'Charge modérée · garder environ 2 répétitions en réserve';
  return 'Charge de travail · garder 1 à 2 répétitions en réserve';
}

function prescriptionFor(goal, title, block, ex, form, mode='program'){
  const family = movementFamily(ex);
  const loaded = isLoadedExercise(ex);
  const mobilityLike = family === 'mobility';
  const bodyOnly = (ex.equipment||[]).includes('bodyweight') && !loaded;
  if(block === 'warmup'){
    if(family === 'engine') return {series:'1 à 2 passages', work:'3 à 5 min progressives', rest:'15 sec entre ateliers', load:'Montée progressive', note:'Activation générale avant le bloc principal'};
    return {series:'1 à 2 passages', work: mobilityLike ? '20 à 30 sec par mouvement' : '6 à 8 reps contrôlées', rest:'10 à 20 sec', load:'Préparation technique', note:'On prépare les articulations et les muscles utiles à la séance'};
  }
  if(block === 'cooldown') return {series:'1 passage', work: mobilityLike ? '30 à 45 sec par zone' : '3 à 5 reps lentes', rest:'respiration calme', load:'Aucune charge', note:'Retour au calme et respiration'};
  if(goal === 'strength') return {series:'4 à 5 séries', work: loaded ? rangeForLevel(form.level,'5 à 6 reps','4 à 6 reps','3 à 5 reps') : '6 à 8 reps', rest:'90 à 150 sec entre séries', load: bodyOnly ? 'Au poids du corps' : loadGuidance(form, ex), note:'Repos après chaque série'};
  if(goal === 'muscle_gain' || goal === 'recomposition') return {series:'3 à 4 séries', work: loaded ? '6 à 12 reps' : '10 à 15 reps', rest:'60 à 90 sec entre séries', load: bodyOnly ? 'Au poids du corps' : loadGuidance(form, ex), note:'Repos après chaque série'};
  if(goal === 'boxing') return {series:'3 à 5 rounds', work:'45 à 90 sec de travail', rest:'30 à 45 sec entre rounds', load: loaded ? 'Impact / résistance contrôlés' : 'Vitesse, relâchement et précision', note:'Repos à la fin de chaque round'};
  if(goal === 'hyrox') return {series:'3 à 4 blocs', work: family === 'engine' ? '200 à 500 m ou 45 à 90 sec' : '8 à 12 reps', rest:'45 à 75 sec entre blocs', load: bodyOnly ? 'Au poids du corps' : loadGuidance(form, ex), note:'Repos à la fin de chaque bloc'};
  if(goal === 'trail' || goal === 'endurance') return {series:'3 à 4 blocs', work: family === 'engine' ? '2 à 5 min ou allure facile' : '8 à 12 reps', rest:'45 à 60 sec entre blocs', load: loaded ? 'Charge légère à modérée' : 'Allure contrôlée', note:'Repos à la fin de chaque bloc'};
  if(goal === 'mobility' || goal === 'health' || goal === 'return_to_play') return {series:'2 à 3 séries', work: mobilityLike ? '25 à 40 sec' : '8 à 12 reps', rest:'20 à 40 sec entre séries', load: bodyOnly ? 'Amplitude confortable' : 'Charge légère', note:'Repos court pour garder le contrôle'};
  if(goal === 'conditioning' || goal === 'fat_loss') return {series:'3 à 4 séries', work: family === 'engine' ? '30 à 45 sec' : '8 à 12 reps', rest:'20 à 40 sec entre séries', load: bodyOnly ? 'Au poids du corps' : 'Charge modérée', note:'Repos court pour garder le rythme'};
  return {series:'3 à 4 séries', work: loaded ? '6 à 10 reps' : '8 à 12 reps', rest:'45 à 75 sec entre séries', load: bodyOnly ? 'Au poids du corps' : loadGuidance(form, ex), note:'Repos après chaque série'};
}

function sectionKeywords(title, goal){
  const t = title.toLowerCase();
  if(t.includes('pouss')) return ['pector','épaule','triceps','push'];
  if(t.includes('tirage')) return ['dos','biceps','tirage','pull'];
  if(t.includes('squat') || t.includes('jambes')) return ['quadriceps','fess','jamb'];
  if(t.includes('charnière')) return ['ischio','fess','chaîne post'];
  if(t.includes('mobil') || t.includes('respiration')) return ['mobil','rotation','stability','resp'];
  if(t.includes('condition') || t.includes('moteur')) return ['cardio','conditioning','bike','rameur','course'];
  if(t.includes('boxe') || goal==='boxing') return ['boxe','boxing','shadow','pads','bag'];
  if(t.includes('hyrox') || goal==='hyrox') return ['sled','carry','rower','ski','wall ball','air bike'];
  if(t.includes('trail') || goal==='trail') return ['course','run','endurance','marche'];
  return ['full body'];
}

function buildProgram(){
  const form = readForm();
  if(!form.mainGoal){ notify('coachOutput', 'Choisis d’abord un objectif principal.', 'error'); showStep(2); return; }
  if(!form.env){ notify('coachOutput', 'Choisis le contexte d’entraînement principal.', 'error'); showStep(2); return; }
  if(!form.equipment.length){ notify('coachOutput', 'Choisis au moins le matériel réellement disponible.', 'error'); showStep(3); return; }
  if(!form.age || !form.height || !form.weight){ notify('coachOutput', 'Renseigne âge, taille et poids pour une base sérieuse.', 'error'); showStep(1); return; }

  const dayTitles = splitForGoal(form.mainGoal, form.freq || 3);
  const used = [];
  const days = dayTitles.map(title => {
    const keywords = sectionKeywords(title, form.mainGoal);
    const loadedPriority = ['gym','crossfit_box'].includes(form.env) && ['strength','muscle_gain','recomposition'].includes(form.mainGoal);
    const bodyweightPriority = form.env === 'bodyweight_only';
    const warmup = pickExercises({goal:'mobility', secondGoals:[], level:'beginner', env:form.env, equipment:form.equipment, keywords:['mobil','activation','rotation','respiration','marche'], focusTargets:[], loadedPriority:false, bodyweightPriority:true, medical:form.medical, injuries:form.injuries, exclude:used}, 2);
    warmup.forEach(ex=>used.push(baseName(ex)));
    const main = pickExercises({goal:form.mainGoal, secondGoals:form.secondGoals, level:form.level, env:form.env, equipment:form.equipment, keywords, focusTargets:form.focusTargets, loadedPriority, bodyweightPriority, avoidBurpee: loadedPriority || form.mainGoal!=='conditioning', medical:form.medical, injuries:form.injuries, exclude:used}, 4);
    main.forEach(ex=>used.push(baseName(ex)));
    const cooldown = pickExercises({goal:'mobility', secondGoals:[], level:'beginner', env:form.env, equipment:form.equipment, keywords:['stretch','mobil','respiration','marche'], focusTargets:[], loadedPriority:false, bodyweightPriority:true, medical:form.medical, injuries:form.injuries, exclude:used}, 1);
    cooldown.forEach(ex=>used.push(baseName(ex)));
    return {
      title,
      warmup: warmup.map(ex=>({...ex, prescription: prescriptionFor(form.mainGoal, title, 'warmup', ex, form)})),
      main: main.map(ex=>({...ex, prescription: prescriptionFor(form.mainGoal, title, 'main', ex, form)})),
      cooldown: cooldown.map(ex=>({...ex, prescription: prescriptionFor(form.mainGoal, title, 'cooldown', ex, form)}))
    };
  });

  CURRENT_PROGRAM = {...form, createdAt:new Date().toISOString(), days};
  renderProgram(CURRENT_PROGRAM, '#coachOutput', true);
  notify('coachOutput', 'Programme généré. Vérifie-le puis clique sur Enregistrer.', 'ok');
}

function renderExerciseCard(ex){
  return `<div class="program-ex-card">
    <h4>${esc(ex.name)}</h4>
    <div class="small-muted">${esc(ex.muscles || ex.category || '')}</div>
    <div class="meta-line"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.work)}</span><span>Repos ${esc(ex.prescription.rest)}</span>${ex.prescription.load ? `<span>${esc(ex.prescription.load)}</span>` : ''}</div>
    <div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue || 'Exécution contrôlée')}</div>
    <div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.easy || 'Réduire amplitude, charge ou vitesse')}</div>
    <div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.hard || 'Augmenter légèrement la charge ou la contrainte')}</div>
  </div>`;
}

function weekLayout(freq){
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const map = {2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,3,4,5],6:[0,1,2,4,5,6]};
  const active = map[freq] || map[3];
  return days.map((d,i)=>({day:d, note: active.includes(i) ? 'Séance' : 'Repos actif', active: active.includes(i)}));
}


function normalizeProgramDays(days, freq){
  const week = weekLayout(freq || 3);
  return week.map((slot, index)=>({
    dayLabel: slot.day,
    active: slot.active,
    title: slot.active ? (days.filter(d=>d && d.title)[index % Math.max(1, days.filter(d=>d && d.title).length)]?.title || `Séance ${index+1}`) : 'Repos actif',
    warmup: slot.active ? (days.find(d=>d && d.title=== (days.filter(d=>d && d.title)[index % Math.max(1, days.filter(d=>d && d.title).length)]?.title))?.warmup || []) : [],
    main: slot.active ? (days.find(d=>d && d.title=== (days.filter(d=>d && d.title)[index % Math.max(1, days.filter(d=>d && d.title).length)]?.title))?.main || []) : [],
    cooldown: slot.active ? (days.find(d=>d && d.title=== (days.filter(d=>d && d.title)[index % Math.max(1, days.filter(d=>d && d.title).length)]?.title))?.cooldown || []) : []
  }));
}

function renderProgram(program, target, coachMode=false){
  const host = typeof target === 'string' ? $(target) : target;
  const week = normalizeProgramDays(program.days || [], program.freq || 3);
  host.innerHTML = `
    <div class="panel panel-hero clean-program-head">
      <div class="program-day-header"><div><h3>${esc(program.name)} · ${esc(program.code)}</h3><div class="meta"><span class="program-code">Code ${esc(program.code)}</span><span class="badge">${esc(goalLabel(program.mainGoal))}</span><span class="badge">${esc(envLabel(program.env))}</span><span class="badge">${esc(levelLabel(program.level))}</span></div></div>${coachMode ? '<div class="actions compact"><button class="ghost" id="saveProgramInline">Enregistrer</button><button class="ghost" id="copyLinkInline">Copier lien adhérent</button><button class="ghost" id="exportPdfInline">Exporter PDF</button></div>' : ''}</div>
      <div class="summary-grid summary-grid-4">
        <div class="summary-card"><strong>${esc(String(program.freq || 3))}</strong><div class="small-muted">séances / semaine</div></div>
        <div class="summary-card"><strong>${esc(String(program.duration || 60))} min</strong><div class="small-muted">durée cible</div></div>
        <div class="summary-card"><strong>${esc(program.bmi ? program.bmi.value : '—')}</strong><div class="small-muted">IMC officiel</div></div>
        <div class="summary-card"><strong>${esc(String(program.cycleWeeks || 8))} sem.</strong><div class="small-muted">cycle</div></div>
      </div>
      <div class="week-strip">${week.map(w=>`<div class="daypill ${w.active?'train':'rest'}"><strong>${w.dayLabel}</strong><small>${w.active ? 'Séance' : 'Repos actif'}</small></div>`).join('')}</div>
    </div>
    <div class="stack">${program.days.map(day=>`
      <article class="panel program-day-block">
        <div class="program-day-header"><div><h3>${esc(day.title)}</h3><p class="small-muted">Bloc structuré : échauffement, corps de séance, retour au calme.</p></div></div>
        <section class="quick-block"><h4>Échauffement</h4><div class="program-ex-grid">${day.warmup.map(renderExerciseCard).join('')}</div></section>
        <section class="quick-block"><h4>Corps de séance</h4><div class="program-ex-grid">${day.main.map(renderExerciseCard).join('')}</div></section>
        <section class="quick-block"><h4>Retour au calme</h4><div class="program-ex-grid">${day.cooldown.map(renderExerciseCard).join('')}</div></section>
      </article>`).join('')}</div>`;
  if(coachMode){
    $('#saveProgramInline')?.addEventListener('click', saveCurrentProgram);
    $('#copyLinkInline')?.addEventListener('click', copyClientLink);
    $('#exportPdfInline')?.addEventListener('click', exportPdf);
  }
}

function saveCurrentProgram(){
  if(!CURRENT_PROGRAM){ notify('coachOutput','Génère d’abord un programme.', 'error'); return; }
  const programs = getPrograms();
  programs[CURRENT_PROGRAM.code] = CURRENT_PROGRAM;
  setPrograms(programs);
  const biz = getBusiness();
  biz[CURRENT_PROGRAM.code] = {status: CURRENT_PROGRAM.bizStatus, amount: CURRENT_PROGRAM.bizAmount, renewal: biz[CURRENT_PROGRAM.code]?.renewal || ''};
  saveLocal(STORAGE_KEYS.business, biz);
  renderHome();
  renderDirectories();
  notify('coachOutput', `Programme enregistré sous le code ${CURRENT_PROGRAM.code}.`, 'ok');
}

function clientLink(code){ return `${location.origin}${location.pathname}?client=${encodeURIComponent(code)}`; }
async function copyClientLink(){
  const code = CURRENT_PROGRAM?.code || $('#clientCode').value.trim().toUpperCase();
  if(!code){ notify('coachOutput','Aucun code adhérent disponible.', 'error'); return; }
  const url = clientLink(code);
  try{ await navigator.clipboard.writeText(url); notify('coachOutput', 'Lien adhérent copié.', 'ok'); }
  catch(e){ notify('coachOutput', url, 'warn'); }
}

function quickPrescription(style, zone, env, audience){
  const bodyOnly = env === 'bodyweight_only';
  const athlete = audience === 'athletes';
  const maps = {
    hiit:{warmup:{series:'1 à 2 passages', work:'4 min progressives', rest:'15 sec', note:'Activation dynamique avant le HIIT'}, main:{series:'4 à 6 tours', work:'35 sec d’effort', rest:'25 sec entre exercices', note:'Le repos se fait après chaque exercice'}, cooldown:{series:'1 passage', work:'3 à 4 min', rest:'—', note:'Retour au calme respiratoire'}},
    emom:{warmup:{series:'1 à 2 passages', work:'4 min progressives', rest:'15 sec', note:'Préparer les mouvements de la séance'}, main:{series:'8 à 12 minutes', work:'1 exercice démarre au début de chaque minute', rest:'temps restant dans la minute', note:'Le repos correspond au temps restant une fois les reps terminées'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Respiration et mobilité'}},
    amrap:{warmup:{series:'1 à 2 passages', work:'4 min progressives', rest:'15 sec', note:'Activation générale'}, main:{series:'1 bloc', work:'8 à 15 min en continu', rest:'repos libre si besoin', note:'Enchaîner les exercices et compter le nombre de tours'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Retour au calme'}},
    strength:{warmup:{series:'2 passages', work:'6 reps techniques', rest:'20 sec', note:'Monter progressivement en intensité'}, main:{series:'4 séries', work: bodyOnly ? '8 à 12 reps' : (athlete ? '4 à 6 reps' : '5 à 8 reps'), rest:'90 à 120 sec entre séries', note:'Faire toutes les séries d’un exercice avant le suivant'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Respiration et mobilité ciblée'}},
    boxing:{warmup:{series:'2 passages', work:'30 sec par atelier', rest:'15 sec', note:'Appuis, épaules, tronc'}, main:{series:'4 à 6 rounds', work:'45 à 90 sec', rest:'30 à 45 sec entre rounds', note:'Le repos se prend à la fin de chaque round'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Relâchement et mobilité'}},
    mobility:{warmup:{series:'1 passage', work:'3 min', rest:'—', note:'Entrer progressivement dans les amplitudes'}, main:{series:'2 à 3 séries', work:'30 à 45 sec ou 6 à 8 reps lentes', rest:'15 à 20 sec entre exercices', note:'On cherche la qualité, pas la vitesse'}, cooldown:{series:'1 passage', work:'2 à 3 min', rest:'—', note:'Respiration lente'}},
    recovery:{warmup:{series:'1 passage', work:'2 min', rest:'—', note:'Mise en route douce'}, main:{series:'2 séries', work:'25 à 40 sec', rest:'15 sec', note:'Retour au calme actif'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Respiration et relâchement'}},
    zone2:{warmup:{series:'1 passage', work:'4 min', rest:'—', note:'Allure progressive'}, main:{series:'1 bloc', work:'20 à 40 min allure facile', rest:'—', note:'Pouvoir parler pendant l’effort'}, cooldown:{series:'1 passage', work:'4 min', rest:'—', note:'Finir plus lentement'}},
    trail:{warmup:{series:'1 passage', work:'5 min', rest:'—', note:'Chevilles, hanches et rythme'}, main:{series:'3 à 5 blocs', work:'2 à 5 min', rest:'60 sec entre blocs', note:'Le repos se prend à la fin de chaque bloc'}, cooldown:{series:'1 passage', work:'4 min', rest:'—', note:'Marche et respiration'}},
    hyrox:{warmup:{series:'1 à 2 passages', work:'4 min', rest:'15 sec', note:'Activation full body'}, main:{series:'3 à 4 blocs', work:'40 à 60 sec ou 200 à 500 m', rest:'30 à 60 sec entre blocs', note:'On termine un atelier puis on prend le repos prévu'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Retour au calme'}},
    core:{warmup:{series:'1 passage', work:'2 min', rest:'—', note:'Activation tronc et respiration'}, main:{series:'3 séries', work:'20 à 40 sec ou 8 à 12 reps', rest:'20 sec entre séries', note:'Repos après chaque série'}, cooldown:{series:'1 passage', work:'2 min', rest:'—', note:'Respiration diaphragmatique'}},
    health:{warmup:{series:'1 passage', work:'3 min', rest:'—', note:'Mise en route articulaire'}, main:{series:'2 à 3 séries', work:'8 à 12 reps', rest:'30 à 45 sec entre séries', note:'Contrôle et régularité'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Retour au calme'}},
    conditioning:{warmup:{series:'1 à 2 passages', work:'4 min', rest:'15 sec', note:'Activation cardio progressive'}, main:{series:'3 à 5 séries', work:'30 à 45 sec', rest:'25 à 35 sec entre exercices', note:'Repos court pour garder le rythme'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Faire redescendre le cardio'}},
    circuit:{warmup:{series:'1 à 2 passages', work:'4 min', rest:'15 sec', note:'Activation générale'}, main:{series:'3 à 4 tours', work:'8 à 12 reps ou 30 sec', rest:'20 à 30 sec entre exercices / 60 sec entre tours', note:'Repos court entre exercices, plus long à la fin de chaque tour'}, cooldown:{series:'1 passage', work:'3 min', rest:'—', note:'Mobilité et respiration'}}
  };
  return (maps[style] || maps.circuit)[zone];
}

function buildQuickSession(){
  const style = $('#quickStyle').value;
  const env = $('#quickEnv').value;
  const audience = $('#quickPublic').value;
  const duration = Number($('#quickDuration').value || 45);
  const spec = getStyleSpec(style, env);
  const ctx = {goal: style === 'zone2' ? 'trail' : style, secondGoals:[], level: audience==='athletes' ? 'advanced' : audience==='adults' ? 'intermediate' : 'beginner', env, equipment: PRESETS[env] || ['bodyweight'], keywords:[], focusTargets:[], loadedPriority:['gym','crossfit_box'].includes(env) && style==='strength', bodyweightPriority:env==='bodyweight_only', medical:[], injuries:[], exclude:[]};
  const warmup = [];
  ['mobility','engine','mobility'].slice(0, spec.warmupCount || 2).forEach((pattern,i)=>{
    const ex = pickExercises({...ctx, goal:'mobility', pattern, preferMobility:pattern==='mobility', preferEngine:pattern==='engine', exclude:ctx.exclude, usedFamilies:warmup.map(movementFamily), seed:`quick-warm-${style}-${env}-${i}`},1)[0];
    if(ex){ warmup.push(ex); ctx.exclude.push(baseName(ex)); }
  });
  const main = [];
  spec.mainPatterns.forEach((pattern,i)=>{
    const ex = pickExercises({...ctx, pattern, avoidBurpee: !['conditioning','hiit'].includes(style), exclude:ctx.exclude, usedFamilies:main.map(movementFamily), seed:`quick-main-${style}-${env}-${pattern}-${i}`},1)[0];
    if(ex){ main.push(ex); ctx.exclude.push(baseName(ex)); }
  });
  const cooldown = [];
  ['mobility','mobility'].slice(0, spec.cooldownCount || 1).forEach((pattern,i)=>{
    const ex = pickExercises({...ctx, goal:'mobility', pattern, preferMobility:true, exclude:ctx.exclude, usedFamilies:cooldown.map(movementFamily), seed:`quick-cool-${style}-${env}-${i}`},1)[0];
    if(ex){ cooldown.push(ex); ctx.exclude.push(baseName(ex)); }
  });
  const blocks = [
    {title:'Échauffement', items:warmup, prescription:quickPrescription(style,'warmup',env,audience)},
    {title: style==='zone2' ? 'Bloc principal cardio' : 'Corps de séance', items:main, prescription:quickPrescription(style,'main',env,audience)},
    {title:'Retour au calme', items:cooldown, prescription:quickPrescription(style,'cooldown',env,audience)}
  ];
  $('#quickOutput').innerHTML = `<div class="quick-layout"><div class="stack">${blocks.map(block=>`<article class="panel quick-block"><h3>${esc(block.title)}</h3><div class="session-line"><strong>Organisation :</strong> ${esc(block.prescription.series)} · ${esc(block.prescription.work)} · Repos ${esc(block.prescription.rest)}</div><div class="session-line"><strong>Lecture :</strong> ${esc(block.prescription.note)}</div>${block.items.map(ex=>`<div class="program-ex-card"><h4>${esc(ex.name)}</h4><div class="small-muted">${esc(ex.muscles || '')}</div><div class="meta-line"><span>${esc(block.prescription.series)}</span><span>${esc(block.prescription.work)}</span><span>Repos ${esc(block.prescription.rest)}</span>${!((ex.equipment||[]).includes('bodyweight') && !isLoadedExercise(ex)) ? `<span>${esc(loadGuidance({level:ctx.level}, ex))}</span>` : '<span>Au poids du corps</span>'}</div><div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue)}</div><div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.easy || 'Réduire amplitude ou vitesse')}</div><div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.hard || 'Augmenter légèrement l’intensité')}</div></div>`).join('')}</article>`).join('')}</div><aside class="panel"><h3>Logique de séance</h3><div class="session-line"><strong>Public :</strong> ${esc({kids:'Enfants',teens:'Ados',adults:'Adultes',seniors:'Seniors',athletes:'Sportifs avancés'}[audience])}</div><div class="session-line"><strong>Style :</strong> ${esc(formatLabel(style))}</div><div class="session-line"><strong>Lieu :</strong> ${esc(envLabel(env))}</div><div class="session-line"><strong>Durée :</strong> ${esc(String(duration))} min</div><div class="session-line"><strong>Lecture pratique :</strong> Les reps ou le temps indiqués s’appliquent à chaque exercice. Le repos se prend exactement là où il est écrit : entre exercices, entre séries ou entre tours.</div><div class="session-line"><strong>Charge :</strong> Poids du corps = aucune charge externe. En salle, choisis une charge propre qui laisse 1 à 3 répétitions en réserve selon ton niveau.</div><div class="panel subtle"><h4>Glossaire</h4><div class="session-line">HIIT : Intervalles haute intensité</div><div class="session-line">EMOM : Chaque minute sur la minute</div><div class="session-line">AMRAP : Maximum de tours</div><div class="session-line">Zone 2 : Endurance fondamentale</div></div></aside></div>`;
}


function renderLibrary(){
  const q = ($('#libSearch').value || '').toLowerCase().trim();
  const cat = $('#libCategory').value;
  const lvl = $('#libLevel').value;
  const env = $('#libEnv').value;
  const eq = $('#libEquipment').value;
  const style = $('#libStyle').value;
  let list = EXERCISES.filter(ex => {
    const text = `${ex.name} ${ex.category} ${ex.subcategory} ${ex.muscles} ${(ex.tags||[]).join(' ')}`.toLowerCase();
    if(q && !text.includes(q)) return false;
    if(cat && ex.category !== cat) return false;
    if(lvl && ex.level !== lvl) return false;
    if(env && !(ex.environments || []).includes(env)) return false;
    if(eq && !(ex.equipment || []).includes(eq)) return false;
    if(style && !(ex.tags || []).includes(style)) return false;
    return true;
  }).slice(0,80);
  $('#libraryMeta').textContent = `${list.length} exercice(s) affiché(s)`;
  $('#libraryOutput').innerHTML = list.map(ex=>`<article class="panel"><h3>${esc(ex.name)}</h3><div class="small-muted">${esc(ex.category)} · ${esc(ex.subcategory || '')}</div><div class="session-line"><strong>Muscles :</strong> ${esc(ex.muscles || '—')}</div><div class="session-line"><strong>Matériel :</strong> ${esc((ex.equipment || []).map(eqLabel).join(', ') || '—')}</div><div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue || '—')}</div><div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.easy || '—')}</div><div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.hard || '—')}</div></article>`).join('');
}

function renderDirectories(){
  const programs = getPrograms();
  const items = Object.values(programs).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const html = !items.length ? '<div class="panel subtle">Aucun programme enregistré pour le moment.</div>' : items.map(p=>`<article class="panel"><div class="program-day-header"><div><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="badge">${esc(goalLabel(p.mainGoal))}</span><span class="badge">${esc(envLabel(p.env))}</span><span class="badge">${esc(p.freq)} / semaine</span></div></div><div class="actions compact"><button class="ghost" data-open-program="${esc(p.code)}">Ouvrir</button><button class="ghost" data-copy-program="${esc(p.code)}">Copier lien</button><button class="ghost danger" data-delete-program="${esc(p.code)}">Supprimer</button></div></div></article>`).join('');
  $('#homeDirectory').innerHTML = html;
  $('#athleteDirectory').innerHTML = html;
  $('#nutritionDirectory').innerHTML = html;
  $$('[data-open-program]').forEach(btn=>btn.onclick=()=>{ const p=getPrograms()[btn.dataset.openProgram]; if(p){ goView('athlete'); $('#athleteCode').value=p.code; openAthletePortal(); } });
  $$('[data-copy-program]').forEach(btn=>btn.onclick=async()=>{ try{ await navigator.clipboard.writeText(clientLink(btn.dataset.copyProgram)); }catch(e){} });
  $$('[data-delete-program]').forEach(btn=>btn.onclick=()=>deleteProgram(btn.dataset.deleteProgram));
}

function deleteProgram(code){
  const programs = getPrograms();
  if(!programs[code]) return;
  delete programs[code];
  setPrograms(programs);
  const business = getBusiness(); if(business[code]){ delete business[code]; saveLocal(STORAGE_KEYS.business, business); }
  const tracks = getTracks(); if(tracks[code]){ delete tracks[code]; saveLocal(STORAGE_KEYS.tracks, tracks); }
  renderHome(); renderDirectories();
  $('#athleteOutput').innerHTML = '';
}

function openAthletePortal(){
  const {code, program} = resolveProgram($('#athleteCode').value);
  if(!program){ $('#athleteOutput').innerHTML = `<div class="panel">Aucun programme trouvé pour ce code.</div>`; return; }
  $('#athleteOutput').innerHTML = renderAthlete(program);
}
function renderAthlete(program){
  const biz = getBusiness()[program.code] || {status: program.bizStatus, amount: program.bizAmount};
  if(biz.status === 'impaye') return `<div class="panel"><h3>Accès bloqué</h3><p>Le portail est verrouillé tant que le statut est “impayé”.</p></div>`;
  const tracks = (getTracks()[program.code] || []).slice(-5).reverse();
  return `<div class="panel panel-hero"><h3>${esc(program.name)}</h3><div class="meta"><span class="program-code">Code ${esc(program.code)}</span><span class="badge">${esc(goalLabel(program.mainGoal))}</span></div></div><div class="stack">${program.days.map(day=>`<article class="panel"><h3>${esc(day.title)}</h3><div class="quick-block"><h4>Échauffement</h4>${day.warmup.map(renderExerciseCard).join('')}</div><div class="quick-block"><h4>Corps de séance</h4>${day.main.map(renderExerciseCard).join('')}</div><div class="quick-block"><h4>Retour au calme</h4>${day.cooldown.map(renderExerciseCard).join('')}</div></article>`).join('')}<article class="panel"><h3>Suivis récents</h3>${tracks.length ? tracks.map(t=>`<div class="session-line">${esc(t.date)} · poids ${esc(String(t.weight||'—'))} kg · énergie ${esc(String(t.energy||'—'))}/10 · compliance ${esc(String(t.compliance||'—'))}% · ${esc(t.note||'')}</div>`).join('') : '<div class="small-muted">Aucun suivi enregistré.</div>'}</article></div>`;
}

function saveTrack(){
  const code = parseClientInput($('#trackCode').value);
  const programs = getPrograms();
  if(!programs[code]){ notify('progressOutput','Code adhérent introuvable.', 'error'); return; }
  const tracks = getTracks();
  tracks[code] = tracks[code] || [];
  tracks[code].push({date:new Date().toLocaleDateString('fr-FR'), weight:$('#trackWeight').value, energy:$('#trackEnergy').value, compliance:$('#trackCompliance').value, note:$('#trackNote').value.trim()});
  saveLocal(STORAGE_KEYS.tracks, tracks);
  $('#progressOutput').innerHTML = tracks[code].slice().reverse().map(t=>`<article class="panel"><div class="session-line"><strong>${esc(t.date)}</strong></div><div class="session-line">Poids : ${esc(String(t.weight||'—'))} kg · Énergie : ${esc(String(t.energy||'—'))}/10 · Compliance : ${esc(String(t.compliance||'—'))}%</div><div class="session-line">${esc(t.note || '')}</div></article>`).join('');
  renderHome();
}

function audienceLabel(v){ return {adult:'Adulte',child:'Enfant',teen:'Adolescent',senior:'Senior'}[v] || v; }
function buildNutrition(){
  const mode = $('#nutritionMode').value;
  let program = null;
  if(mode === 'program'){
    const resolved = resolveProgram($('#nutritionCode').value);
    program = resolved.program;
    if(!program){ $('#nutritionOutput').innerHTML = '<div class="panel">Aucun programme trouvé pour ce code.</div>'; return; }
  }
  const audience = mode==='program' ? (program.age < 11 ? 'child' : program.age < 18 ? 'teen' : program.age >= 65 ? 'senior' : 'adult') : $('#nutriAudience').value;
  const goal = mode==='program' ? (program.mainGoal || 'health') : $('#nutriGoal').value;
  const restrictions = mode==='program' ? program.foods : getMulti('nutriRestrictions');
  const dislikes = getMulti('nutriDislikes');
  const macros = mode==='program' ? (program.nutrition || {kcal:0, protein:0, carbs:0, fats:0}) : calcCalories({sex:'male', weight:75, height:175, age:35, goal, activityFactor:1.4});
  const mealIdeas = goal==='muscle_gain' ? ['Petit-déjeuner : flocons d’avoine + yaourt grec + fruit','Repas principal : féculent + viande/poisson/tofu + légumes','Collation : skyr + fruit + oléagineux'] : goal==='fat_loss' ? ['Petit-déjeuner : protéines + fruit','Repas principal : légumes + source protéique + féculent modéré','Collation : yaourt ou fruit selon faim'] : ['Petit-déjeuner : simple et digeste','Repas principal : assiette équilibrée','Collation : utile autour des séances'];
  const substitution = {
    oeufs:'Remplacer par yaourt grec, tofu soyeux ou blanc de poulet',
    poisson:'Remplacer par volaille, tofu, œufs, légumineuses + céréales',
    laitage:'Boissons végétales enrichies, tofu, yaourts sans lactose',
    legumes:'Soupes lisses, purées, crudités fines, légumes mixés en sauce',
    gluten:'Riz, pommes de terre, quinoa, sarrasin',
    lactose:'Boissons végétales enrichies, skyr sans lactose, tofu',
    arachides:'Amandes, noix de cajou, graines',
    vegetarien:'Œufs, produits laitiers si tolérés, tofu, tempeh, légumineuses',
    vegan:'Tofu, tempeh, légumineuses, céréales, protéines végétales',
    halal:'Volaille, bœuf halal, œufs, poisson, tofu'
  };
  const blocks = [...restrictions, ...dislikes].filter(Boolean).map(k=>substitution[k]).filter(Boolean);
  $('#nutritionOutput').innerHTML = `<div class="panel panel-hero"><h3>Nutrition FAFATRAINING · ${esc(goalLabel(goal))}</h3><div class="nutrition-grid"><div class="nutrition-block"><strong>${esc(String(macros.kcal||0))}</strong><div class="small-muted">kcal / jour</div></div><div class="nutrition-block"><strong>${esc(String(macros.protein||0))} g</strong><div class="small-muted">protéines</div></div><div class="nutrition-block"><strong>${esc(String(macros.carbs||0))} g</strong><div class="small-muted">glucides</div></div><div class="nutrition-block"><strong>${esc(String(macros.fats||0))} g</strong><div class="small-muted">lipides</div></div></div><div class="feature-grid"><div class="feature-card"><strong>Public</strong><span>${esc(audienceLabel(audience))}</span></div><div class="feature-card"><strong>Objectif nutrition</strong><span>${esc(goalLabel(goal))}</span></div><div class="feature-card"><strong>Hydratation</strong><span>30 à 35 ml/kg/jour comme base, plus les jours chauds ou sportifs.</span></div><div class="feature-card"><strong>Lecture pratique</strong><span>3 repas stables + 1 collation si besoin autour des séances.</span></div></div><article class="panel"><h3>Exemples simples de repas</h3>${mealIdeas.map(x=>`<div class="session-line">• ${esc(x)}</div>`).join('')}</article><article class="panel"><h3>Substitutions et micro-nutrition</h3>${blocks.length ? blocks.map(x=>`<div class="session-line">• ${esc(x)}</div>`).join('') : '<div class="session-line">Aucune substitution spécifique signalée.</div>'}<div class="session-line">• Pense aux fruits et légumes colorés pour les micronutriments.</div><div class="session-line">• Oméga-3 alimentaires réguliers si possible.</div><div class="session-line">• Magnésium et sodium à surveiller chez les profils qui transpirent beaucoup.</div></article></div>`;
}

function saveBusiness(){
  const code = parseClientInput($('#bizCodeInput').value);
  if(!code){ notify('businessOutput','Renseigne un code adhérent.', 'error'); return; }
  const business = getBusiness();
  business[code] = {status: $('#bizStatusInput').value, amount: Number($('#bizAmountInput').value || 0), renewal: $('#bizRenewalInput').value};
  saveLocal(STORAGE_KEYS.business, business);
  renderBusiness();
  renderHome();
}

function renderBusiness(){
  const business = getBusiness();
  const items = Object.entries(business).sort((a,b)=>a[0].localeCompare(b[0]));
  $('#businessOutput').innerHTML = items.length ? items.map(([code, b])=>`<article class="panel"><h3>${esc(code)}</h3><div class="session-line">Statut : ${esc(b.status)}</div><div class="session-line">Montant payé : ${esc(String(b.amount || 0))} €</div><div class="session-line">Échéance : ${esc(b.renewal || '—')}</div></article>`).join('') : '<div class="panel">Aucun statut business enregistré.</div>';
}

function renderHome(){
  const programs = Object.values(getPrograms());
  const tracks = getTracks();
  const business = Object.values(getBusiness());
  $('#kpiPrograms').textContent = String(programs.length);
  $('#kpiClients').textContent = String(programs.length);
  $('#kpiLibrary').textContent = String(EXERCISES.length);
  $('#kpiDue').textContent = String(business.filter(x=>x.renewal).length);
  $('#kpiTracked').textContent = String(Object.values(tracks).reduce((n,arr)=>n+arr.length,0));
  $('#homeActivity').innerHTML = programs.length ? programs.slice(-5).reverse().map(p=>`<article class="panel"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="session-line">${esc(goalLabel(p.mainGoal))} · ${esc(envLabel(p.env))} · ${esc(String(p.freq))}/semaine</div></article>`).join('') : '<div class="panel">Aucun programme enregistré pour le moment. Crée d’abord un programme depuis Coach Pro puis enregistre-le.</div>';
}

function renderCategories(){
  const cats = [''].concat([...new Set(EXERCISES.map(e=>e.category).filter(Boolean))].sort());
  $('#libCategory').innerHTML = cats.map(v=>`<option value="${v}">${v || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML = `<option value="">Tous les contextes</option>${Object.entries(ENV_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}`;
  $('#libEquipment').innerHTML = `<option value="">Tout le matériel</option>${EQUIPMENT_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}`;
}

function parseAndOpenSharedLink(){
  const params = new URLSearchParams(location.search);
  const code = params.get('client');
  if(code){ goView('athlete'); $('#athleteCode').value = code; openAthletePortal(); }
}

function exportPdf(){
  const p = CURRENT_PROGRAM;
  if(!p || !window.jspdf){ notify('coachOutput','Génère d’abord un programme.', 'error'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  let y = 48;
  if(LOGO_DATA) try{ doc.addImage(LOGO_DATA, 'JPEG', 40, 28, 54, 54); }catch(e){}
  doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.text('FAFATRAINING', 106, 52);
  doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.text(`${p.name} · Code ${p.code}`, 106, 70);
  doc.text(`Objectif : ${goalLabel(p.mainGoal)} · Contexte : ${envLabel(p.env)} · ${p.freq}/semaine · ${p.duration} min`, 40, 106);
  if(p.bmi) doc.text(`IMC officiel : ${p.bmi.value} (${p.bmi.label}) · Formule : ${p.bmi.formula}`, 40, 124);
  y = 154;
  for(const day of p.days){
    if(y > 720){ doc.addPage(); y = 50; }
    doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text(day.title, 40, y); y += 18;
    const sections = [['Échauffement', day.warmup], ['Corps de séance', day.main], ['Retour au calme', day.cooldown]];
    for(const [title, list] of sections){
      doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(title, 52, y); y += 14;
      for(const ex of list){
        const lines = [
          `${ex.name}`,
          `• ${ex.prescription.series} · ${ex.prescription.work} · Repos ${ex.prescription.rest}`,
          `• Charge / intensité : ${ex.prescription.load}`,
          `• Consigne : ${ex.cue}`,
          `• Version plus facile : ${ex.easy || 'Réduire amplitude ou vitesse'}`,
          `• Version plus difficile : ${ex.hard || 'Augmenter légèrement l’intensité'}`
        ];
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(lines[0], 64, y); y += 12;
        doc.setFont('helvetica','normal'); doc.setFontSize(9);
        lines.slice(1).forEach(line=>{ const split = doc.splitTextToSize(line, 480); doc.text(split, 64, y); y += split.length*11; });
        y += 6;
        if(y > 740){ doc.addPage(); y = 50; }
      }
      y += 4;
    }
    y += 8;
  }
  doc.addPage(); y = 50;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('Nutrition FAFATRAINING', 40, y); y += 20;
  if(p.nutrition){
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    ['kcal repère : '+p.nutrition.kcal+' / jour','protéines : '+p.nutrition.protein+' g','glucides : '+p.nutrition.carbs+' g','lipides : '+p.nutrition.fats+' g'].forEach(line=>{ doc.text(line, 40, y); y += 14; });
    y += 10;
    const nutritionLines = [
      'Repères : 3 repas stables + 1 collation si besoin autour des séances.',
      'Hydratation : 30 à 35 ml/kg/jour comme base, à ajuster selon chaleur et volume sportif.',
      'Micro-nutrition : fruits et légumes colorés, oméga-3 alimentaires, magnésium et sodium à surveiller selon transpiration.'
    ];
    nutritionLines.forEach(line=>{ const split = doc.splitTextToSize(line, 500); doc.text(split, 40, y); y += split.length*13; });
  }
  doc.save(`FAFATRAINING_${p.code}.pdf`);
}

async function init(){
  await preloadLogo();
  const res = await fetch('data/exercises.json');
  EXERCISES = await res.json();
  buildEquipmentOptions();
  extendQuickStyles();
  renderCategories();
  decorateLabels();
  enhanceMultiSelects();
  initNav();
  initSteps();
  ['clientName','clientCode','clientEmail','clientAge','clientSex','clientLevel','clientHeight','clientWeight','currentSport','availabilityWeekly','activityLevel','lifeContext','waistCm','mainGoal','environmentSelect','clientFreq','clientDuration','cycleWeeks','sleepHours','stressLevel','bizStatus','bizAmount','healthNotes'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.addEventListener('change', autoFillDerived);
  });
  MULTI_FIELDS.forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', autoFillDerived); });
  $('#environmentSelect')?.addEventListener('change', ()=>{ $('#equipmentSelect').dataset.autofill=''; autoFillDerived(); });
  $('#buildProgramBtn')?.addEventListener('click', buildProgram);
  $('#saveProgramBtn')?.addEventListener('click', saveCurrentProgram);
  $('#copyLinkBtn')?.addEventListener('click', copyClientLink);
  $('#exportPdfBtn')?.addEventListener('click', exportPdf);
  $('#quickBuildBtn')?.addEventListener('click', buildQuickSession);
  $('#libSearchBtn')?.addEventListener('click', renderLibrary);
  ['libSearch','libCategory','libLevel','libEnv','libEquipment','libStyle'].forEach(id=>document.getElementById(id)?.addEventListener('input', renderLibrary));
  $('#openAthleteBtn')?.addEventListener('click', openAthletePortal);
  $('#saveTrackBtn')?.addEventListener('click', saveTrack);
  $('#showNutritionBtn')?.addEventListener('click', buildNutrition);
  $('#saveBizBtn')?.addEventListener('click', saveBusiness);
  $$('.kpi.clickable').forEach(k=>k.addEventListener('click', ()=>{ const t=k.dataset.homeTarget; goView(t==='programs' || t==='clients' ? 'athlete' : t); }));
  renderHome(); renderDirectories(); renderBusiness(); renderLibrary(); updateSummary(); parseAndOpenSharedLink();
}

document.addEventListener('DOMContentLoaded', init);
