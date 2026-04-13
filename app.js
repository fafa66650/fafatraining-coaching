
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

let EXERCISES = [];
let currentProgram = null;

const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['mat','Tapis de sol'],['dumbbell','Haltères'],['barbell','Barre olympique / standard'],
  ['bench','Banc'],['rack','Rack / cage'],['smith','Machine Smith'],['cable','Poulie / vis-à-vis'],['machine','Machines guidées'],
  ['leg_press','Presse à cuisses'],['lat_pulldown','Tirage vertical'],['ghd','GHD / banc lombaires'],['glute_bridge','Banc hip thrust'],
  ['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],['treadmill','Tapis de course'],
  ['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],['ski_erg','SkiErg'],['med_ball','Medicine ball'],
  ['wall_ball','Wall ball'],['sandbag','Sandbag'],['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],
  ['ladder','Échelle de rythme'],['cones','Plots / balises'],['parallettes','Parallettes'],['rings','Anneaux'],['pullup_bar','Barre de traction'],
  ['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['mini_band','Mini-band'],['sled','Traîneau'],['farmer_handles','Poignées farmer carry'],
  ['landmine','Landmine'],['dip_bars','Barres dips'],['box','Plyo box / step'],['step','Step'],['chair','Chaise'],['sofa','Canapé / rebord stable'],
  ['stairs','Marches / escalier'],['backpack','Sac à dos lestable'],['water_bottles','Bouteilles / bidons'],['foam_roller','Foam roller / rouleau'],['massage_ball','Balle de massage'],
  ['towel','Serviette'],['timer','Chrono / timer'],['heart_rate','Cardiofréquencemètre'],['pulse_belt','Ceinture cardio'],['outdoor_track','Piste / boucle running'],['hill','Côtes / dénivelé']
];
const ENV_LABELS = {
  gym:'Salle de musculation',
  crossfit_box:'Salle CrossFit / Hyrox',
  boxing_gym:'Salle de boxe',
  home:'Maison / appartement',
  outdoor:'Extérieur',
  bodyweight_only:'Poids du corps uniquement'
};
const PRESETS = {
  gym:['barbell','bench','rack','smith','cable','machine','leg_press','lat_pulldown','dumbbell','bike','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','wall_ball','sled','ski_erg','trap_bar','rope','box','sandbag','mat','timer'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','cones','band','med_ball','mat','timer'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','mini_band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel','foam_roller','timer'],
  outdoor:['bodyweight','mat','band','ladder','cones','rope','sled','med_ball','box','sandbag','outdoor_track','hill','timer'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','towel','mini_band','timer']
};

function esc(v){return String(v ?? '').replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));}
function getMulti(id){ const el=document.getElementById(id); return el ? Array.from(el.selectedOptions).map(o=>o.value).filter(Boolean) : []; }
function setMulti(id, values){ const el=document.getElementById(id); if(!el) return; const set=new Set(values||[]); Array.from(el.options).forEach(o=>o.selected=set.has(o.value));}
function labelForLevel(v){ return v==='beginner'?'Débutant':v==='intermediate'?'Intermédiaire':v==='advanced'?'Avancé':v; }


function normalizeEffortToStyle(s){
  const map={hiit:'conditioning', circuit:'conditioning', emom:'conditioning', amrap:'conditioning', interval:'conditioning', boxing_rounds:'boxing', classic:'hypertrophy', tempo:'hypertrophy', clusters:'strength', ladder:'conditioning', density:'conditioning', fartlek:'trail', zone2:'trail', threshold:'trail', shadow_rounds:'boxing', complex:'hyrox'};
  return map[s] || s;
}
function styleLabel(style){
  const m={strength:'Force', hypertrophy:'Hypertrophie', conditioning:'Conditioning', boxing:'Boxe', hyrox:'Hyrox', trail:'Trail', mobility:'Mobilité', health:'Santé'};
  return m[style] || style;
}
function coachNoteForStyle(style, idx, form){
  const notes={
    strength:'Reste propre techniquement et garde 1 à 2 reps de marge.',
    hypertrophy:'Contrôle le tempo et cherche la qualité de contraction.',
    conditioning:'Travail rythmé, respiration active, récupérations tenues.',
    boxing:'Garde haute, appuis vivants, précision avant vitesse.',
    hyrox:'Reste régulier et propre dans les transitions.',
    trail:'Travail d’économie de course et stabilité.',
    mobility:'Amplitudes contrôlées, respiration calme et fluide.',
    health:'Aucun mouvement douloureux, priorité au confort et au contrôle.'
  };
  if(form.restrictions && idx===0) return notes[style] + ' Contraintes santé prises en compte.';
  return notes[style] || 'Technique propre et progression contrôlée.';
}
function styleMatches(ex, style){
  if(!style) return true;
  const txt = (ex.name+' '+(ex.category||'')+' '+(ex.subcategory||'')+' '+(ex.muscles||'')+' '+(ex.cue||'')+' '+(ex.tags||[]).join(' ')+' '+(ex.focus||[]).join(' ')).toLowerCase();
  const map = {
    strength:['force','strength','deadlift','squat','bench','pull','push'],
    hypertrophy:['hypertroph','muscle','pector','dos','épaule','biceps','triceps','legs'],
    conditioning:['cardio','conditioning','bike','rameur','course','interval','hiit'],
    boxing:['boxe','boxing','pads','bag','round','shadow'],
    hyrox:['hyrox','sled','ski','carry','wall ball','rower','air bike'],
    trail:['trail','run','course','côtes','aerobic','endurance'],
    mobility:['mobil','stretch','souplesse','rotation','amplitude'],
    health:['santé','health','réhab','rehab','stabilité','douce']
  };
  return (map[style]||[]).some(k=>txt.includes(k));
}
function optionLabels(id){ return getMulti(id).map(v=> {
  const opt = document.querySelector(`#${id} option[value="${CSS.escape(v)}"]`);
  return opt ? opt.textContent : v;
});}
function addOptions(selectId, options){
  const el = document.getElementById(selectId);
  if(!el) return;
  const existing = new Set(Array.from(el.options).map(o=>o.value));
  options.forEach(([value,label])=>{
    if(!existing.has(value)){
      const opt=document.createElement('option');
      opt.value=value; opt.textContent=label;
      el.appendChild(opt);
    }
  });
}
function labelForGoal(v){
  const m={fat_loss:'Perte de poids',recomposition:'Recomposition corporelle',muscle_gain:'Prise de muscle',strength:'Force',conditioning:'Condition physique',endurance:'Endurance',boxing:'Boxe',hyrox:'Hyrox',trail:'Trail',mobility:'Mobilité',health:'Santé',return_to_play:'Retour de blessure'};
  return m[v]||v;
}
function eqLabel(v){ return (EQUIPMENTS.find(x=>x[0]===v)||[])[1] || v; }
function labelForEnv(v){ return ENV_LABELS[v] || v; }
function activityFactorFromProfile(activity,freq){
  if(activity==='sedentary') return 1.2;
  if(activity==='moderate') return freq>=4?1.5:1.4;
  if(activity==='active') return freq>=4?1.65:1.55;
  if(activity==='very_active') return 1.8;
  return 1.45;
}

function calcBMI(weightKg,heightCm,meta={}){
  const h = Number(heightCm)/100;
  if(!weightKg || !h) return null;
  const bmi = Number(weightKg)/(h*h);
  let label='Poids normal', risk='zone de référence';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='à recouper avec tour de taille, activité et habitudes'; }
  else if(bmi < 35){ label='IMC élevé'; risk='lecture à nuancer selon composition corporelle'; }
  else { label='IMC très élevé'; risk='approche santé prioritaire'; }
  if((meta.activityLevel==='very_active' || meta.activityLevel==='active') && meta.level==='advanced' && bmi >= 27){
    label = 'IMC élevé à interpréter avec prudence';
    risk = 'profil potentiellement très musclé : compléter avec tour de taille, progression et terrain';
  }
  const waist = Number(meta.waist||0);
  let waistToHeight = null;
  let waistRisk = '';
  if(waist && heightCm){
    waistToHeight = +(waist/Number(heightCm)).toFixed(2);
    waistRisk = waistToHeight < 0.5 ? 'tour de taille plutôt rassurant' : 'tour de taille à surveiller';
  }
  return {value:bmi.toFixed(1), label, risk, waistToHeight, waistRisk};
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
  if(['endurance','conditioning','hyrox','trail'].includes(goal)) maintenance += 150;
  const kcal = Math.round(maintenance);
  const protein = Math.round(weight * (['muscle_gain','strength'].includes(goal) ? 2.0 : 1.8));
  const fats = Math.round(weight * 0.9);
  const carbs = Math.max(80, Math.round((kcal - protein*4 - fats*9)/4));
  return {kcal, protein, carbs, fats};
}
function saveLocal(key,obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function loadLocal(key, fallback){ try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;} }

function initNav(){
  $$('.navbtn').forEach(btn=>btn.addEventListener('click',()=>goView(btn.dataset.view)));
}
function goView(view){
  $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===view));
}
function initSteps(){
  $$('.step').forEach(btn=>btn.addEventListener('click',()=>showStep(btn.dataset.step)));
}
function showStep(step){
  $$('.step').forEach(b=>b.classList.toggle('active', b.dataset.step===String(step)));
  $$('.step-panel').forEach(p=>p.classList.toggle('active', p.dataset.stepPanel===String(step)));
}

function buildEquipmentSelect(){
  $('#equipmentSelect').innerHTML=EQUIPMENTS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
}



function seedAdvancedOptions(){
  addOptions('secondGoals', [['recovery','Récupération'],['wellbeing','Bien-être'],['performance','Performance générale'],['posture','Posture / stabilité'],['athleticism','Préparation athlétique'],['health_markers','Marqueurs santé'],['micro_cut','Mini sèche'],['mass_quality','Masse de qualité']]);
  addOptions('cycleGoals', [['technique','Technique'],['endurance','Endurance spécifique'],['recovery','Récupération'],['mobility','Mobilité / amplitudes'],['aerobic_base','Base aérobie'],['peak','Pic de forme'],['deload','Déload guidé']]);
  addOptions('focusTargets', [['mollets','Mollets'],['ischios','Ischios'],['avant_bras','Avant-bras / grip'],['rotation','Rotation / anti-rotation'],['cardio','Cardio / moteur'],['stability','Stabilité'],['explosivite','Explosivité'],['posture','Posture']]);
  addOptions('fafaModules', [['mobility_flow','Mobilité / flow'],['body_recomp','Recomposition'],['combat_conditioning','Conditioning combat'],['micro_nutrition','Micro-nutrition'],['wellness_reset','Rééquilibrage bien-être']]);
  addOptions('effortFormats', [['tempo','Tempo / contrôle'],['clusters','Clusters'],['ladder','Ladder'],['density','Density training'],['fartlek','Fartlek'],['zone2','Zone 2'],['threshold','Seuil'],['interval_walk','Marche fractionnée'],['shadow_rounds','Shadow rounds'],['complex','Complexe haltères / kettlebell']]);
  addOptions('coachingTypes', [['performance','Performance'],['wellbeing','Bien-être'],['weightlifting','Haltérophilie'],['athletic','Préparation athlétique'],['micro_nutrition','Micro-nutrition'],['rebalancing','Rééquilibrage alimentaire']]);
  addOptions('supports', [['hybrid','Hybride'],['messaging','Messagerie / feedback'],['autonome','Autonome guidé'],['nutrition_only','Nutrition seule'],['weekly_review','Bilan hebdo']]);
  addOptions('medicalKnown', [['asthme','Asthme'],['surpoids','Surpoids / obésité'],['discopathie','Discopathie / hernie'],['anxiete','Stress / anxiété'],['diabete2','Diabète type 2'],['cholesterol','Cholestérol']]);
  addOptions('injuryKnown', [['poignet','Poignet'],['hanche','Hanche'],['cheville','Cheville'],['ischio','Ischio / adducteurs'],['cervicales','Cervicales'],['coude','Coude']]);
  addOptions('foodKnown', [['vegetarien','Végétarien'],['vegan','Vegan'],['halal','Halal'],['lactose','Sans lactose'],['gluten','Sans gluten'],['arachides','Arachides'],['fodmap','Sensibilité FODMAP'],['anti_inflammatoire','Orientation anti-inflammatoire']]);
}


function enhanceMultiSelects(ids){
  ids.forEach(id=>{
    const select = document.getElementById(id);
    if(!select || select.dataset.enhanced) return;
    select.dataset.enhanced='1';
    select.style.display='none';
    const box = document.createElement('div');
    box.className='multi-select-box';
    const trigger = document.createElement('button');
    trigger.type='button';
    trigger.className='multi-trigger';
    trigger.innerHTML = `<span>Choisir...</span><span class="caret">▾</span>`;
    const panel = document.createElement('div');
    panel.className='multi-panel hidden';
    const search = document.createElement('input');
    search.type='text';
    search.className='multi-search';
    search.placeholder='Rechercher...';
    const opts = document.createElement('div');
    opts.className='multi-options';
    const tags = document.createElement('div');
    tags.className='multi-tags';
    panel.appendChild(search);
    panel.appendChild(opts);
    box.appendChild(trigger);
    box.appendChild(panel);
    box.appendChild(tags);
    select.parentNode.insertBefore(box, select.nextSibling);
    const renderOptions = ()=>{
      const q=(search.value||'').toLowerCase().trim();
      opts.innerHTML = Array.from(select.options).filter(o=>!q || o.textContent.toLowerCase().includes(q)).map(o=>`
        <label class="multi-opt"><input type="checkbox" value="${o.value}" ${o.selected?'checked':''}> <span>${o.textContent}</span></label>
      `).join('') || '<div class="small-muted">Aucun résultat</div>';
      opts.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
        ch.addEventListener('change', ()=>{
          const opt = Array.from(select.options).find(o=>o.value===ch.value);
          if(opt) opt.selected = ch.checked;
          update();
          select.dispatchEvent(new Event('change',{bubbles:true}));
        });
      });
    };
    const update = ()=>{
      const selected = Array.from(select.selectedOptions);
      trigger.querySelector('span').textContent = selected.length ? `${selected.length} sélection${selected.length>1?'s':''}` : 'Choisir...';
      tags.innerHTML = selected.length ? selected.map(o=>`<span class="tag">${o.textContent}</span>`).join('') : '<span class="tag muted">Aucune sélection</span>';
    };
    trigger.addEventListener('click', ()=>{
      document.querySelectorAll('.multi-panel').forEach(p=>{ if(p!==panel) p.classList.add('hidden'); });
      panel.classList.toggle('hidden');
      if(!panel.classList.contains('hidden')) search.focus();
    });
    search.addEventListener('input', renderOptions);
    document.addEventListener('click', (e)=>{ if(!box.contains(e.target)) panel.classList.add('hidden'); });
    select.addEventListener('change', ()=>{ renderOptions(); update(); });
    renderOptions(); update();
  });
}


function buildLibraryFilters(){
  const cats=[''].concat([...new Set(EXERCISES.map(e=>e.category).filter(Boolean))].sort());
  $('#libCategory').innerHTML=cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML=[''].concat(Object.keys(ENV_LABELS)).map(v=>`<option value="${v}">${v?ENV_LABELS[v]:'Tous les contextes'}</option>`).join('');
  $('#libEquipment').innerHTML=[''].concat(EQUIPMENTS.map(x=>x[0])).map(v=>`<option value="${v}">${v?eqLabel(v):'Tout le matériel'}</option>`).join('');
}


function autoFill(){
  const prefs=getMulti('practicePrefs');
  const sport=$('#currentSport').value;
  const goal=$('#mainGoal').value;
  const avail=$('#availabilityWeekly').value;
  const level=$('#clientLevel').value;
  if(!$('#environmentSelect').value){
    if(prefs.includes('gym')) $('#environmentSelect').value='gym';
    else if(prefs.includes('outdoor')) $('#environmentSelect').value='outdoor';
    else if(prefs.includes('home')) $('#environmentSelect').value='home';
    else if(sport==='boxing') $('#environmentSelect').value='boxing_gym';
    else if(sport==='hyrox') $('#environmentSelect').value='crossfit_box';
  }
  if(!$('#clientFreq').value){
    $('#clientFreq').value = avail==='1' ? '2' : avail==='2-3' ? '3' : avail==='4-5' ? '4' : avail==='6+' ? '5' : (level==='beginner' ? '3' : '4');
  }
  if(!$('#clientDuration').value){
    $('#clientDuration').value = level==='beginner' ? '45' : level==='advanced' ? '75' : '60';
  }
  if(goal){
    const cycleMap = {
      fat_loss:['conditioning','maintenance'],
      recomposition:['hypertrophy','conditioning'],
      muscle_gain:['hypertrophy'],
      strength:['strength','technique'],
      conditioning:['conditioning','aerobic_base'],
      boxing:['conditioning','peak','technique'],
      hyrox:['conditioning','peak'],
      trail:['conditioning','endurance'],
      mobility:['health','mobility'],
      health:['health','recovery'],
      return_to_play:['health','recovery'],
      wellbeing:['health','maintenance'],
      posture:['technique','health'],
      athleticism:['strength','conditioning']
    };
    setMulti('cycleGoals', cycleMap[goal]||['conditioning']);
  }
  const coachTypes=[];
  if(goal==='boxing' || sport==='boxing') coachTypes.push('boxing');
  if(goal==='hyrox' || sport==='hyrox') coachTypes.push('hyrox');
  if(goal==='trail' || sport==='running') coachTypes.push('trail');
  if(['fat_loss','recomposition','muscle_gain','strength','conditioning','athleticism'].includes(goal)) coachTypes.push('fitness');
  if(['health','return_to_play','mobility','wellbeing','posture'].includes(goal) || getMulti('medicalKnown').length || getMulti('injuryKnown').length) coachTypes.push('health');
  if(getMulti('foodKnown').length || goal==='wellbeing') coachTypes.push('nutrition');
  coachTypes.push('general');
  setMulti('coachingTypes',[...new Set(coachTypes)]);
  const mods=[];
  if(goal==='boxing'||sport==='boxing') mods.push('boxing_prep');
  if(goal==='hyrox'||sport==='hyrox') mods.push('hyrox_prep');
  if(goal==='trail'||sport==='running') mods.push('trail_prep');
  if(['health','return_to_play','mobility','posture'].includes(goal) || getMulti('injuryKnown').length || getMulti('medicalKnown').length) mods.push('return_to_play');
  if(['fat_loss','recomposition'].includes(goal)) mods.push('body_recomp');
  if(goal==='wellbeing' || getMulti('foodKnown').length) mods.push('wellness_reset');
  setMulti('fafaModules',[...new Set(mods)]);
  const supports=[];
  supports.push('remote');
  if(prefs.includes('gym')) supports.push('in_person_gym');
  if(prefs.includes('outdoor')) supports.push('in_person_outdoor');
  if(prefs.includes('video')) supports.push('video');
  if(getMulti('coachingTypes').includes('nutrition')) supports.push('nutrition_only');
  setMulti('supports',[...new Set(supports)]);
  const env=$('#environmentSelect').value;
  if(env && !getMulti('equipmentSelect').length){
    const preset = PRESETS[env] || [];
    setMulti('equipmentSelect', preset);
    $('#equipmentSelect').dispatchEvent(new Event('change',{bubbles:true}));
  }
  updateSummary();
}

function applyEquipmentPreset(){
  const env=$('#environmentSelect').value;
  const preset=PRESETS[env]||[];
  if(preset.length) setMulti('equipmentSelect', preset);
}

function updateSummary(){
  const bmi = calcBMI(Number($('#clientWeight').value||0), Number($('#clientHeight').value||0), {
    activityLevel: $('#activityLevel').value,
    level: $('#clientLevel').value,
    waist: Number($('#clientWaist')?.value||0)
  });
  const prefs = getMulti('practicePrefs');
  const coaching = getMulti('coachingTypes');
  const modules = getMulti('fafaModules');
  $('#coachSummary').innerHTML = `
    <div class="summary-card"><strong>Profil</strong><div class="small-muted">${esc($('#clientName').value||'Client à définir')} · ${esc(labelForLevel($('#clientLevel').value||'intermediate'))}</div></div>
    <div class="summary-card"><strong>Objectif</strong><div class="small-muted">${esc(labelForGoal($('#mainGoal').value||'')) || 'À choisir'}</div></div>
    <div class="summary-card"><strong>Contexte</strong><div class="small-muted">${esc(labelForEnv($('#environmentSelect').value||'')) || 'À choisir'}</div></div>
    <div class="summary-card"><strong>Préférences</strong><div class="small-muted">${esc(prefs.join(', ')||'Aucune')}</div></div>
    <div class="summary-card"><strong>Coaching</strong><div class="small-muted">${esc(coaching.join(', ')||'Auto')}</div></div>
    <div class="summary-card"><strong>Modules</strong><div class="small-muted">${esc(modules.join(', ')||'Auto')}</div></div>
    <div class="summary-card"><strong>Fréquence / durée</strong><div class="small-muted">${esc($('#clientFreq').value||'-')} / semaine · ${esc($('#clientDuration').value||'-')} min</div></div>
    <div class="summary-card"><strong>Lecture santé</strong><div class="small-muted">${bmi ? `IMC ${bmi.value} · ${bmi.label}${bmi.waistToHeight?` · ratio ${bmi.waistToHeight}`:''}` : 'Renseigne taille / poids / âge'}</div></div>`;
}


function buildDayTitles(freq, goal='conditioning', cycle='conditioning'){
  const f=Number(freq||3);
  if(goal==='boxing') return f===2?['Jour 1 · Technique + moteur','Jour 2 · Full body + rounds'] : f===3?['Jour 1 · Technique + appuis','Jour 2 · Force utile','Jour 3 · Conditioning boxe'] : ['Jour 1 · Technique','Jour 2 · Force bas du corps','Jour 3 · Technique + vitesse','Jour 4 · Conditioning / core','Jour 5 · Full body boxe'];
  if(goal==='hyrox') return f===3?['Jour 1 · Force utile','Jour 2 · Engine mixte','Jour 3 · Hyrox simulation'] : f===4?['Jour 1 · Lower + carry','Jour 2 · Engine','Jour 3 · Upper + sled','Jour 4 · Hyrox simulation'] : ['Jour 1 · Force lower','Jour 2 · Engine','Jour 3 · Upper + ski/row','Jour 4 · Threshold','Jour 5 · Hyrox simulation'];
  if(goal==='trail' || goal==='endurance') return f===3?['Jour 1 · Chaîne postérieure','Jour 2 · Seuil / côtes','Jour 3 · Sortie longue / core'] : ['Jour 1 · Force utile','Jour 2 · Seuil','Jour 3 · Cardio zone 2','Jour 4 · Sortie longue'];
  if(goal==='mobility' || cycle==='mobility') return ['Jour 1 · Mobilité globale','Jour 2 · Stabilité + respiration','Jour 3 · Flow + récupération'];
  if(goal==='strength' || cycle==='strength') return f===3?['Jour 1 · Lower force','Jour 2 · Upper force','Jour 3 · Full body assistance'] : f===4?['Jour 1 · Squat dominant','Jour 2 · Push force','Jour 3 · Hinge dominant','Jour 4 · Pull force + core'] : ['Jour 1 · Lower force','Jour 2 · Push force','Jour 3 · Pull force','Jour 4 · Lower assistance','Jour 5 · Upper assistance'];
  if(goal==='muscle_gain' || goal==='recomposition' || cycle==='hypertrophy') return f===3?['Jour 1 · Upper hypertrophie','Jour 2 · Lower hypertrophie','Jour 3 · Full body / conditioning'] : f===4?['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Lower + core'] : ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Full body','Jour 5 · Conditioning / core'];
  if(goal==='health' || goal==='return_to_play') return ['Jour 1 · Mobilité / stabilité','Jour 2 · Force utile','Jour 3 · Cardio doux / core'];
  if(f===2) return ['Jour 1 · Full body','Jour 2 · Full body + cardio'];
  if(f===3) return ['Jour 1 · Haut du corps','Jour 2 · Bas du corps','Jour 3 · Full body / conditioning'];
  if(f===4) return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Conditioning / core'];
  if(f===5) return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Lower + conditioning','Jour 5 · Upper + core'];
  return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Lower','Jour 5 · Upper','Jour 6 · Conditioning'];
}



function exerciseMatches(ex, level, env, equipment, injuries, medical){
  const lvl={beginner:1,intermediate:2,advanced:3};
  if(lvl[ex.level] > lvl[level||'intermediate']) return false;
  if(env && ex.environments && !ex.environments.includes(env) && !['gym','mixed'].includes(env)) return false;
  if(equipment.length && ex.equipment && ex.equipment.length && !ex.equipment.some(e=>equipment.includes(e))) return false;
  const txt=(ex.name+' '+(ex.category||'')+' '+(ex.subcategory||'')+' '+(ex.muscles||'')+' '+(ex.cue||'')+' '+(ex.tags||[]).join(' ')+' '+(ex.focus||[]).join(' ')).toLowerCase();
  if(injuries.includes('epaule') && /(overhead|développé nuque|snatch|jerk|throw|handstand)/i.test(txt)) return false;
  if(injuries.includes('dos') && /(soulevé de terre lourd|good morning|deadlift|rotation explosive|hyperextension lourde|rounded back)/i.test(txt)) return false;
  if(injuries.includes('genou') && /(jump squat|saut|pistol|bondissement|lunge jump|depth jump)/i.test(txt)) return false;
  if(injuries.includes('poignet') && /(handstand|planche|front rack lourd|clean lourd|burpee poignet)/i.test(txt)) return false;
  if(injuries.includes('hanche') && /(cossack lourd|split jump|amplitude forcée)/i.test(txt)) return false;
  if(injuries.includes('cheville') && /(plyo|bondissement|double under|sprint all out)/i.test(txt)) return false;
  if(medical.includes('hypertension') && /(max|sprint all out|valsalva|all out|effort max)/i.test(txt)) return false;
  if(medical.includes('asthme') && /(apnée|all out long)/i.test(txt)) return false;
  if(medical.includes('discopathie') && /(flexion lombaire chargée|rounded back deadlift|good morning lourd)/i.test(txt)) return false;
  if(medical.includes('diabete') && /(jeûne strict|all out prolongé)/i.test(txt)) return false;
  return true;
}




function buildProgramDays(form){
  const titles=buildDayTitles(form.freq, form.mainGoal, (form.cycleGoals||[])[0] || '');
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const preferredStyles = form.effortFormats||[];
  const primaryCycle = (form.cycleGoals||[])[0] || '';
  const filtered=EXERCISES.filter(ex=>exerciseMatches(ex, level, form.env, form.equipment, injuries, medical));
  const pickBy = (keywords, count=5, style='')=>{
    let res=filtered.filter(ex=>{
      const text=(ex.name+' '+(ex.subcategory||'')+' '+(ex.muscles||'')+' '+(ex.category||'')+' '+(ex.tags||[]).join(' ')+' '+(ex.focus||[]).join(' ')).toLowerCase();
      return keywords.some(k=>text.includes(k));
    });
    if(style) res = res.filter(ex=>styleMatches(ex, style));
    if(preferredStyles.length){
      const styleRes = res.filter(ex=>preferredStyles.some(s=>styleMatches(ex, normalizeEffortToStyle(s))));
      if(styleRes.length >= Math.max(2, count-1)) res = styleRes;
    }
    if(!res.length && style) res = filtered.filter(ex=>styleMatches(ex, style));
    return (res.length?res:filtered).slice(0,count);
  };
  return titles.map((title, i)=>{
    let keys=['full body']; let style='conditioning';
    if(/push/i.test(title)) { keys=['pector','épaule','triceps','push']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/pull/i.test(title)) { keys=['dos','biceps','tirage','pull']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/lower|bas|squat|hinge/i.test(title)) { keys=['quadriceps','fess','ischio','jamb']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/conditioning|cardio|engine|simulation|threshold|zone 2|moteur/i.test(title)) { keys=['cardio','course','rameur','conditioning','bike','carry']; style=form.mainGoal==='boxing'?'boxing':form.mainGoal==='hyrox'?'hyrox':form.mainGoal==='trail'?'trail':'conditioning'; }
    else if(/mobilité|respiratio|flow|stabilité/i.test(title)) { keys=['mobility','stretch','stabilité','core']; style='mobility'; }
    if(primaryCycle==='strength') style='strength';
    const exs = pickBy(keys, 5, style);
    return {
      title,
      style,
      patternSummary: `${labelForLevel(level)} · ${labelForEnv(form.env)} · ${styleLabel(style)}`,
      items: exs.map((ex, idx)=>({
        name: ex.name,
        muscles: ex.muscles,
        cue: ex.cue,
        substitute: ex.equipment?.length ? `Alternative si besoin : ${eqLabel(ex.equipment[0])} ou variante facile.` : 'Alternative poids du corps / variante facile.',
        coachNote: coachNoteForStyle(style, idx, form),
        prescription: prescribe(ex, level, style, form.duration)
      }))
    };
  });
}



function buildWeekSchedule(freq){
  const days=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const f=Number(freq||3);
  const layouts = {
    2:[1,4],
    3:[1,3,5],
    4:[1,2,4,6],
    5:[1,2,4,5,6],
    6:[1,2,3,5,6,7]
  };
  const trainIdx = layouts[f] || layouts[3];
  return days.map((d,idx)=>({
    day:d,
    train:trainIdx.includes(idx+1),
    note:trainIdx.includes(idx+1)?'Entraînement':'Repos / mobilité / marche'
  }));
}



function renderProgram(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const head = `<div class="panel panel-hero"><h3>${esc(p.name)} · ${esc(p.code)}</h3>
    <div class="meta">
      <span class="badge">${esc(labelForGoal(p.mainGoal))}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(labelForEnv(p.env))}</span>
      <span class="badge">${esc(p.freq)}/semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>Lecture santé :</strong> IMC ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}${p.bmi.waistToHeight?` · ratio taille/taille ${esc(p.bmi.waistToHeight)} (${esc(p.bmi.waistRisk)})`:''}</p>`:''}
    ${p.restrictions?`<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictions)}</p>`:''}
    <div class="summary-grid">
      <div class="summary-card"><strong>${esc(p.freq)}</strong><div class="small-muted">séances / semaine</div></div>
      <div class="summary-card"><strong>${esc(p.duration)} min</strong><div class="small-muted">durée cible</div></div>
      <div class="summary-card"><strong>${esc((p.cycleGoals||[]).map(labelForGoal).join(', ') || 'Cycle auto')}</strong><div class="small-muted">orientation</div></div>
    </div>
  </div>`;
  const sched = `<article class="athlete-week"><h3>Semaine type</h3><div class="week-days">${
    week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><div>${w.note}</div></div>`).join('')
  }</div></article>`;
  const days = p.days.map(day=>`<article class="panel"><div class="session-top"><h3>${esc(day.title)}</h3><span class="badge">${esc(day.style||'mixte')}</span></div><p class="small-muted">Répartition : ${esc(day.patternSummary)}</p>${
    day.items.map(ex=>`<div class="summary-card session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles)}</div>
    <div><strong>${esc(ex.prescription.series)}</strong> · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</div>
    <div class="small-muted">Consigne : ${esc(ex.cue)}</div>
    <div class="small-muted">Substitution : ${esc(ex.substitute)}</div>
    <div class="small-muted">Note coach : ${esc(ex.coachNote||'')}</div></div>`).join('')
  }</article>`).join('');
  const actions = coach ? `<div class="panel"><div class="actions"><button id="copyLinkBtn2">Copier lien adhérent</button><button class="ghost" id="exportPdfBtn2">Exporter PDF</button></div></div>` : '';
  return head + sched + actions + days;
}



function buildNutritionView(p){
  const n = p.nutrition;
  if(!n) return '<div class="panel"><p>Impossible de calculer la nutrition sans taille, poids et âge.</p></div>';
  const food = p.restrictions || '';
  const nutritionCoaching = (p.coachingTypes||[]).includes('nutrition') || (p.fafaModules||[]).includes('micro_nutrition') || p.mainGoal==='wellbeing';
  const goalText = labelForGoal(p.mainGoal);
  const hydration = p.weight ? Math.round(p.weight*35) : 2000;
  const templates = nutritionTemplates(p);
  return `<div class="panel panel-hero">
      <h3>Centre nutrition FAFATRAINING</h3>
      <p class="small-muted">Lecture intelligente selon objectif, profil, allergies, coaching choisi et volume d'entraînement.</p>
      <div class="summary-grid">
        <div class="summary-card"><strong>${n.kcal}</strong><div class="small-muted">kcal / jour</div></div>
        <div class="summary-card"><strong>${n.protein} g</strong><div class="small-muted">protéines</div></div>
        <div class="summary-card"><strong>${n.carbs} g</strong><div class="small-muted">glucides</div></div>
        <div class="summary-card"><strong>${n.fats} g</strong><div class="small-muted">lipides</div></div>
      </div>
    </div>
    <div class="panel"><h3>Lecture coach</h3>
      <p><strong>Objectif :</strong> ${goalText}</p>
      <p><strong>Hydratation repère :</strong> environ ${hydration} ml / jour, à ajuster selon chaleur, sudation et volume d'entraînement.</p>
      <p><strong>Contraintes prises en compte :</strong> ${food || 'Aucune contrainte particulière détectée.'}</p>
      <p><strong>Orientation micro-nutrition / hygiène de vie :</strong> sommeil régulier, protéines réparties, fibres quotidiennes, oméga-3, fruits/légumes variés, sodium maîtrisé si besoin santé.</p>
      ${nutritionCoaching?'<p><strong>Mode nutrition coaching actif :</strong> tu peux utiliser ce cadre comme base de rééquilibrage alimentaire, performance ou transformation selon le profil.</p>':''}
    </div>
    <div class="panel"><h3>Structure repas type</h3>
      <div class="summary-grid">
        <div class="summary-card"><strong>Petit-déjeuner</strong><div>${templates.breakfast}</div></div>
        <div class="summary-card"><strong>Déjeuner</strong><div>${templates.lunch}</div></div>
        <div class="summary-card"><strong>Collation</strong><div>${templates.snack}</div></div>
        <div class="summary-card"><strong>Dîner</strong><div>${templates.dinner}</div></div>
      </div>
    </div>
    <div class="panel"><h3>Aides coach / original FAFATRAINING</h3>
      <div class="summary-card"><strong>Astuce terrain</strong><div class="small-muted">${templates.tip}</div></div>
      <div class="summary-card"><strong>Substitutions utiles</strong><div class="small-muted">${templates.swap}</div></div>
      <div class="summary-card"><strong>Priorité de la semaine</strong><div class="small-muted">${templates.priority}</div></div>
    </div>`;
}


function collectRestrictions(){
  const parts=[];
  const med=getMulti('medicalKnown');
  const inj=getMulti('injuryKnown');
  const food=getMulti('foodKnown');
  if(med.length) parts.push('Pathologies : '+med.join(', '));
  if(inj.length) parts.push('Blessures : '+inj.join(', '));
  if(food.length) parts.push('Allergies / alimentation : '+food.join(', '));
  return parts.join(' · ');
}

function saveProgram(program){
  const all=loadLocal('fafaPrograms',{});
  all[program.code]=program;
  saveLocal('fafaPrograms', all);
  updateHome();
}
function generateAthleteLink(program){
  return `${location.origin}${location.pathname}?client=${encodeURIComponent(program.code)}`;
}

function buildProgram(){
  const form = {
    name:$('#clientName').value.trim() || 'Client FAFATRAINING',
    code:($('#clientCode').value.trim()||('FT'+Math.floor(Math.random()*9000+1000))).toUpperCase(),
    email:$('#clientEmail').value.trim(),
    age:Number($('#clientAge').value||0),
    sex:$('#clientSex').value,
    height:Number($('#clientHeight').value||0),
    weight:Number($('#clientWeight').value||0),
    waist:Number($('#clientWaist')?.value||0),
    level:$('#clientLevel').value || 'intermediate',
    sport:$('#currentSport').value,
    availability:$('#availabilityWeekly').value,
    activityLevel:$('#activityLevel').value,
    mainGoal:$('#mainGoal').value,
    secondGoals:getMulti('secondGoals'),
    env:$('#environmentSelect').value,
    cycleGoals:getMulti('cycleGoals'),
    fafaModules:getMulti('fafaModules'),
    focusTargets:getMulti('focusTargets'),
    coachingTypes:getMulti('coachingTypes'),
    supports:getMulti('supports'),
    equipment:getMulti('equipmentSelect'),
    effortFormats:getMulti('effortFormats'),
    freq:Number($('#clientFreq').value||3),
    duration:Number($('#clientDuration').value||60),
    cycleWeeks:Number($('#cycleWeeks').value||8),
    sleepHours:Number($('#sleepHours').value||7),
    stressLevel:$('#stressLevel').value,
    bizStatus:$('#bizStatus').value,
    bizAmount:Number($('#bizAmount').value||0)
  };
  if(!form.mainGoal){ alert('Choisis un objectif principal.'); showStep(2); return; }
  if(!form.height || !form.weight || !form.age){ alert('Renseigne âge, taille et poids.'); showStep(1); return; }
  form.bmi=calcBMI(form.weight, form.height, {activityLevel:form.activityLevel, level:form.level, waist:form.waist});
  form.nutrition=calcCalories({sex:form.sex, weight:form.weight, height:form.height, age:form.age, goal:form.mainGoal, stress:form.stressLevel, activityFactor:activityFactorFromProfile(form.activityLevel, form.freq)});
  form.restrictions=collectRestrictions();
  form.days=buildProgramDays(form);
  form.athleteLink=generateAthleteLink(form);
  currentProgram=form;
  saveProgram(form);
  const existingBiz = loadLocal('fafaBusiness',{})[form.code];
  const statusToSave = form.bizStatus || existingBiz?.status || 'pause';
  const amountToSave = form.bizAmount > 0 ? form.bizAmount : Number(existingBiz?.amount||0);
  const renewalToSave = existingBiz?.renewal || '';
  saveBusinessStatus(form.code, statusToSave, amountToSave, renewalToSave);
  $('#athleteCode').value = form.code;
  $('#nutritionCode').value = form.code;
  $('#trackCode').value = form.code;
  $('#bizCodeInput').value = form.code;
  $('#coachOutput').innerHTML=renderProgram(form,true);
  wireProgramActionButtons();
  updateSummary();
  $('#coachOutput').scrollIntoView({behavior:'smooth', block:'start'});
}

function wireProgramActionButtons(){
  $('#coachSaveAgain')?.addEventListener('click', ()=>{ if(currentProgram){ saveProgram(currentProgram); alert('Programme enregistré.'); }});
  $('#coachCopyLinkAgain')?.addEventListener('click', copyAthleteLink);
  $('#coachExportPdfAgain')?.addEventListener('click', exportPdf);
}

function copyAthleteLink(){
  if(!currentProgram){ alert('Génère d’abord un programme.'); return; }
  navigator.clipboard?.writeText(currentProgram.athleteLink).then(()=>{
    const div=document.createElement('div');
    div.className='copyok'; div.textContent='Lien adhérent copié';
    $('#coachOutput').prepend(div); setTimeout(()=>div.remove(),1800);
  }).catch(()=>window.prompt('Copie le lien :', currentProgram.athleteLink));
}


function exportPdf(){
  const p=currentProgram;
  if(!p){ alert('Génère d’abord un programme.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  let y=20;
  const line=(txt,size=10,bold=false,color=[18,24,32])=>{
    doc.setFont('helvetica', bold?'bold':'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(txt), 178);
    lines.forEach(l=>{ if(y>280){ doc.addPage(); y=18; } doc.text(l, 16, y); y += size>=14?8:5; });
  };
  doc.setFillColor(14,20,28); doc.roundedRect(12,10,186,28,8,8,'F');
  line('FAFATRAINING COACHING',18,true,[255,255,255]);
  y=28; line(`${p.name} · ${p.code}`,11,true,[230,236,243]); y=44;
  line('Profil',13,true,[74,201,118]);
  line(`${p.age} ans · ${p.sex==='female'?'Femme':'Homme'} · ${p.height} cm · ${p.weight} kg · ${labelForLevel(p.level)}`,10);
  line('Objectifs',13,true,[74,201,118]);
  line(`Objectif principal : ${labelForGoal(p.mainGoal)}`,10,true);
  if(p.secondGoals?.length) line(`Objectifs secondaires : ${p.secondGoals.map(labelForGoal).join(', ')}`,10);
  line(`Contexte : ${labelForEnv(p.env)} · Fréquence : ${p.freq}/semaine · Durée : ${p.duration} min`,10);
  if(p.bmi) line(`Lecture santé : IMC ${p.bmi.value} (${p.bmi.label}) · ${p.bmi.risk}`,10);
  if(p.restrictions) line(`Contraintes : ${p.restrictions}`,10);
  line('Planning semaine',13,true,[74,201,118]);
  buildWeekSchedule(p.freq).forEach(w=>line(`${w.day} : ${w.note}`,10));
  line('Séances détaillées',13,true,[74,201,118]);
  p.days.forEach(day=>{
    line(day.title,11,true);
    line(`Répartition : ${day.patternSummary}`,9);
    day.items.forEach(ex=>{
      line(`${ex.name} — ${ex.prescription.series} · ${ex.prescription.reps} · repos ${ex.prescription.rest}`,9,true);
      line(`Consigne : ${ex.cue}`,9);
      line(`Substitution : ${ex.substitute}`,9);
      if(ex.coachNote) line(`Note coach : ${ex.coachNote}`,9);
    });
  });
  if(p.nutrition){
    line('Lecture nutrition',13,true,[74,201,118]);
    line(`${p.nutrition.kcal} kcal · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`,10);
  }
  line('Glossaire débutant',13,true,[74,201,118]);
  line('Série = blocs à faire. Reps = répétitions. Repos = récupération. RPE = ressenti sur 10.',9);
  doc.save(`${p.code}_FAFATRAINING_V26.pdf`);
}



function renderLibrary(){
  const q=($('#libSearch').value||'').toLowerCase().trim();
  const cat=$('#libCategory').value;
  const level=$('#libLevel').value;
  const env=$('#libEnv').value;
  const equipment=$('#libEquipment').value;
  const style=$('#libStyle')?.value || '';
  const lvl={beginner:1,intermediate:2,advanced:3};
  const results=EXERCISES.filter(ex=>
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,(ex.tags||[]).join(' '),(ex.focus||[]).join(' ')].join(' ').toLowerCase().includes(q)) &&
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || (ex.environments||[]).includes(env)) &&
    (!equipment || (ex.equipment||[]).includes(equipment)) &&
    styleMatches(ex, style)
  );
  $('#libraryMeta').innerHTML=`<strong>${results.length}</strong> résultats sur <strong>${EXERCISES.length}</strong> exercices / variantes.`;
  $('#libraryOutput').innerHTML = results.slice(0,360).map(ex=>`<article class="library-card">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(labelForLevel(ex.level))}</span>
        <span class="badge">${esc(styleLabel(inferPrimaryStyle(ex)))}</span>
        ${(ex.equipment||[]).slice(0,2).map(eq=>`<span class="badge">${esc(eqLabel(eq))}</span>`).join('')}
      </div>
      <h3>${esc(ex.name)}</h3>
      <div class="small-muted">${esc(ex.subcategory||'')} · ${esc(ex.muscles||'')}</div>
      <p>${esc(ex.cue||'')}</p>
      <div class="library-split">
        <div><strong>Régression</strong><div class="small-muted">${esc(ex.easy||'Version plus simple / assistance')}</div></div>
        <div><strong>Progression</strong><div class="small-muted">${esc(ex.hard||'Version plus avancée / charge / complexité')}</div></div>
      </div>
    </article>`).join('') || '<div class="panel">Aucun résultat pour ces filtres.</div>';
}


function saveBusinessStatus(code,status,amount,renewal){
  const all=loadLocal('fafaBusiness',{});
  all[code]={code,status,amount,renewal};
  saveLocal('fafaBusiness', all);
  renderBusiness();
}


function openAthletePortal(){
  const code=($('#athleteCode').value||'').trim().toUpperCase();
  const programs=loadLocal('fafaPrograms',{});
  const p=programs[code];
  if(!p){ $('#athleteOutput').innerHTML='<div class="panel">Aucun programme trouvé.</div>'; return; }
  const biz=loadLocal('fafaBusiness',{})[code];
  if(!biz || biz.status!=='actif' || Number(biz.amount||0)<=0){
    $('#athleteOutput').innerHTML='<div class="panel">Accès bloqué : abonnement non actif ou non payé.</div>'; return;
  }
  const tracks=loadLocal('fafaTracking',{})[code]||[];
  const last = tracks[tracks.length-1];
  $('#athleteOutput').innerHTML = `<div class="panel panel-hero"><h3>Portail adhérent · ${esc(p.name)}</h3><div class="meta"><span class="badge">${esc(labelForGoal(p.mainGoal))}</span><span class="badge">${esc(p.freq)}/semaine</span><span class="badge">${esc(p.duration)} min</span></div><p class="small-muted">Lecture simple : suis le planning, valide ton ressenti et garde une exécution propre.</p><div class="summary-grid"><div class="summary-card"><strong>${esc(p.cycleWeeks||8)} semaines</strong><div class="small-muted">cycle</div></div><div class="summary-card"><strong>${last?.energy||'-'}/10</strong><div class="small-muted">dernière énergie</div></div><div class="summary-card"><strong>${p.nutrition?.kcal || '-'}</strong><div class="small-muted">kcal repère</div></div></div></div>` + renderProgram(p,false) + 
    `<div class="panel"><h3>Historique / ressenti</h3>${tracks.length?tracks.map(t=>`<div class="summary-card"><strong>${t.date}</strong><div>Poids : ${t.weight||'-'} kg · Énergie : ${t.energy||'-'}/10 · Compliance : ${t.compliance||'-'}%</div><div class="small-muted">${esc(t.note||'')}</div></div>`).join(''):'<p>Aucun suivi pour le moment.</p>'}</div>`;
  $('#athleteOutput').scrollIntoView({behavior:'smooth', block:'start'});
}


function saveTracking(){
  const code=($('#trackCode').value||'').trim().toUpperCase();
  if(!code){ alert('Ajoute un code adhérent.'); return; }
  const all=loadLocal('fafaTracking',{});
  all[code]=all[code]||[];
  all[code].push({
    date:new Date().toLocaleDateString('fr-FR'),
    weight:Number($('#trackWeight').value||0)||'',
    energy:Number($('#trackEnergy').value||0)||'',
    compliance:Number($('#trackCompliance').value||0)||'',
    note:$('#trackNote').value.trim()
  });
  saveLocal('fafaTracking', all);
  renderProgress(code);
}
function renderProgress(code=''){
  const all=loadLocal('fafaTracking',{});
  const target=code || ($('#trackCode').value||'').trim().toUpperCase();
  if(!target){ $('#progressOutput').innerHTML=''; return; }
  const arr=all[target]||[];
  $('#progressOutput').innerHTML = arr.length?arr.map(x=>`<div class="summary-card"><strong>${x.date}</strong><div>Poids : ${x.weight||'-'} kg · Énergie : ${x.energy||'-'}/10 · Compliance : ${x.compliance||'-'}%</div><div class="small-muted">${esc(x.note||'')}</div></div>`).join(''):'<div class="panel">Aucun suivi pour ce code.</div>';
}

function showNutrition(){
  const code=($('#nutritionCode').value||currentProgram?.code||'').trim().toUpperCase();
  const p=loadLocal('fafaPrograms',{})[code];
  $('#nutritionOutput').innerHTML = p ? buildNutritionView(p) : '<div class="panel">Aucun programme trouvé.</div>';
}


function renderBusiness(){
  const all=loadLocal('fafaBusiness',{});
  const rows=Object.values(all);
  $('#businessOutput').innerHTML = rows.length ? rows.map(r=>`<div class="summary-card"><strong>${esc(r.code)}</strong><div>Statut : ${esc(r.status)} · Montant payé : ${esc(r.amount)} €</div><div class="small-muted">${r.renewal?`Échéance : ${esc(r.renewal)}`:'Sans échéance'} · Portail ${r.status==='actif' && Number(r.amount||0)>0 ? 'déverrouillé' : 'bloqué'}</div></div>`).join('') : '<div class="panel">Aucun statut enregistré.</div>';
  const due = rows.filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  $('#kpiDue').textContent = due;
  $('#kpiClients').textContent = rows.filter(r=>r.status==='actif' && Number(r.amount||0)>0).length;
}

function quickBuild(){
  const dur=$('#quickDuration').value;
  const style=$('#quickStyle').value;
  const env=$('#quickEnv').value;
  const exs=EXERCISES.filter(ex=>(ex.environments||[]).includes(env)).slice(0,6);
  $('#quickOutput').innerHTML = `<div class="panel"><h3>Séance rapide ${esc(style)}</h3><p>${esc(dur)} minutes · ${esc(ENV_LABELS[env]||env)}</p>${
    exs.map(ex=>`<div class="summary-card"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.cue)}</div></div>`).join('')
  }</div>`;
}

function renderHome(){
  const programs=loadLocal('fafaPrograms',{});
  const business=loadLocal('fafaBusiness',{});
  const tracks=loadLocal('fafaTracking',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length;
  $('#kpiLibrary').textContent=EXERCISES.length;
  renderBusiness();
  const acts=[];
  Object.values(programs).slice(-5).reverse().forEach(p=>acts.push(`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${esc(labelForGoal(p.mainGoal))}</div></div>`));
  const activeClients = Object.values(business).filter(b=>b.status==='actif' && Number(b.amount||0)>0).length;
  const trackedCount = Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0);
  $('#homeActivity').innerHTML=(`
    <div class="summary-grid">
      <div class="summary-card"><strong>${activeClients}</strong><div class="small-muted">clients actifs</div></div>
      <div class="summary-card"><strong>${trackedCount}</strong><div class="small-muted">check-ins enregistrés</div></div>
      <div class="summary-card"><strong>${Object.values(business).filter(b=>b.renewal).length}</strong><div class="small-muted">échéances suivies</div></div>
    </div>` + (acts.join('') || '<div class="summary-card">Aucune activité récente.</div>'));
}


function wireEvents(){
  ['#clientName','#clientCode','#clientEmail','#clientAge','#clientHeight','#clientWeight','#clientWaist','#clientLevel','#currentSport','#availabilityWeekly','#activityLevel','#mainGoal','#environmentSelect','#clientFreq','#clientDuration','#bizStatus','#bizAmount']
    .forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  ['#mainGoal','#currentSport','#availabilityWeekly','#clientLevel','#practicePrefs','#medicalKnown','#injuryKnown','#foodKnown','#coachingTypes','#supports','#cycleGoals','#fafaModules','#equipmentSelect','#effortFormats'].forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  $('#buildProgramBtn').addEventListener('click', buildProgram);
  $('#saveProgramBtn').addEventListener('click', ()=>currentProgram && saveProgram(currentProgram));
  $('#copyLinkBtn').addEventListener('click', copyAthleteLink);
  $('#exportPdfBtn').addEventListener('click', exportPdf);
  $('#libSearchBtn').addEventListener('click', renderLibrary);
  $('#libSearch').addEventListener('input', renderLibrary);
  $('#libCategory').addEventListener('change', renderLibrary);
  $('#libLevel').addEventListener('change', renderLibrary);
  $('#libEnv').addEventListener('change', renderLibrary);
  $('#libEquipment').addEventListener('change', renderLibrary);
  $('#libStyle')?.addEventListener('change', renderLibrary);
  $('#openAthleteBtn').addEventListener('click', openAthletePortal);
  $('#saveTrackBtn').addEventListener('click', saveTracking);
  $('#showNutritionBtn').addEventListener('click', showNutrition);
  $('#saveBizBtn').addEventListener('click', ()=>{
    saveBusinessStatus(($('#bizCodeInput').value||'').trim().toUpperCase(), $('#bizStatusInput').value, Number($('#bizAmountInput').value||0), $('#bizRenewalInput').value);
  });
  $('#quickBuildBtn').addEventListener('click', quickBuild);
  document.addEventListener('click', (e)=>{
    if(e.target?.id==='copyLinkBtn2') copyAthleteLink();
    if(e.target?.id==='exportPdfBtn2') exportPdf();
  });
}

function hydrateLink(){
  const sp=new URLSearchParams(location.search);
  const code=(sp.get('client')||'').trim().toUpperCase();
  if(code){
    goView('athlete');
    $('#athleteCode').value=code;
    openAthletePortal();
  }
}
async function init(){
  EXERCISES = await fetch('data/exercises.json').then(r=>r.json());
  initNav();
  initSteps();
  buildEquipmentSelect();
  buildLibraryFilters();
  seedAdvancedOptions();
  wireEvents();
  autoFill();
  enhanceMultiSelects(['practicePrefs','coachingTypes','supports','medicalKnown','injuryKnown','foodKnown','secondGoals','cycleGoals','focusTargets','fafaModules','equipmentSelect','effortFormats']);
  renderLibrary();
  renderHome();
  hydrateLink();
}
window.addEventListener('DOMContentLoaded', init);

function nutritionTemplates(p){
  const lactose = (p.restrictions||'').toLowerCase().includes('lactose');
  const gluten = (p.restrictions||'').toLowerCase().includes('gluten');
  const veg = /(vegetarien|vegan)/i.test(p.restrictions||'');
  const proteinBase = veg ? 'tofu, tempeh, œufs ou légumineuses' : lactose ? 'œufs, volailles, poissons, yaourts sans lactose' : 'œufs, volailles, poissons, skyr ou yaourt grec';
  const carbBase = gluten ? 'riz, pommes de terre, quinoa, flocons sans gluten' : 'riz, pommes de terre, avoine, pain complet';
  const breakfast = `${proteinBase} + ${carbBase} + fruit`;
  const lunch = `${proteinBase} + légumes + ${carbBase}`;
  const snack = `fruit + source protéinée simple + oléagineux selon tolérance`;
  const dinner = `${proteinBase} + légumes cuits + portion de glucides adaptée à l'objectif`;
  const tip = p.mainGoal==='fat_loss' ? "Garde des repas simples et répétables 80% du temps pour faciliter l'adhérence." :
              p.mainGoal==='muscle_gain' ? "Ajoute facilement des calories via féculents, huile d'olive, fruits secs et collations utiles." :
              p.mainGoal==='hyrox' || p.mainGoal==='trail' ? "Priorise les glucides autour des séances les plus dures et l'hydratation." :
              "Cherche surtout la régularité, le sommeil et des repas lisibles.";
  const swap = gluten ? "Pain/pâtes → riz, quinoa, pommes de terre." : lactose ? "Skyr/fromage blanc → version sans lactose ou protéine solide." : "Repas libre : garde la structure assiette protéine + légumes + glucides.";
  const priority = p.mainGoal==='wellbeing' ? "Stabilité digestive et énergie régulière." :
                   p.mainGoal==='health' || p.mainGoal==='return_to_play' ? "Inflammation maîtrisée, récupération et confort digestif." :
                   "Adhérence + qualité des portions + suivi simple.";
  return {breakfast,lunch,snack,dinner,tip,swap,priority};
}

function inferPrimaryStyle(ex){
  for(const s of ['strength','hypertrophy','conditioning','boxing','hyrox','trail','mobility','health']){
    if(styleMatches(ex,s)) return s;
  }
  return 'conditioning';
}
