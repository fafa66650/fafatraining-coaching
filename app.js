
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function dedupeByBaseName(list){ const seen=new Set(); return list.filter(ex=>{ const base=(ex.name||'').split('—')[0].trim().toLowerCase(); if(seen.has(base)) return false; seen.add(base); return true; }); }

let EXERCISES = [];
let currentProgram = null;

const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['mat','Tapis de sol'],['dumbbell','Haltères'],['barbell','Barre olympique / standard'],
  ['bench','Banc'],['rack','Rack / cage'],['cable','Poulie / vis-à-vis'],['machine','Machines guidées'],
  ['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],['treadmill','Tapis de course'],
  ['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],['med_ball','Medicine ball'],
  ['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],['ladder','Échelle de rythme'],
  ['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],['skierg','SkiErg'],
  ['dip_bars','Barres dips'],['landmine','Landmine'],['box','Plyo box / step'],['chair','Chaise'],['sofa','Canapé / rebord stable'],
  ['stairs','Marches / escalier'],['backpack','Sac à dos lestable'],['water_bottles','Bouteilles d’eau / bidons'],['foam_roller','Foam roller / rouleau'],
  ['towel','Serviette'],['sandbag','Sandbag'],['rings','Anneaux'],['pullup_bar','Barre de traction'],['mini_band','Mini-band'],['cones','Plots / balises']
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
  gym:['barbell','bench','rack','cable','machine','dumbbell','bike','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack','cones'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles','towel']
};

function esc(v){return String(v ?? '').replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));}
function getMulti(id){ const el=document.getElementById(id); return el ? Array.from(el.selectedOptions).map(o=>o.value).filter(Boolean) : []; }
function setMulti(id, values){ const el=document.getElementById(id); if(!el) return; const set=new Set(values||[]); Array.from(el.options).forEach(o=>o.selected=set.has(o.value));}
function labelForLevel(v){ return v==='beginner'?'Débutant':v==='intermediate'?'Intermédiaire':v==='advanced'?'Avancé':v; }

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
    core:['gainage','abdos','core','anti rotation','hollow'],
    recovery:['recovery','récup','mobilité douce','respiration'],
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

const QUICK_STYLE_LABELS={
  circuit:'Circuit',hiit:'HIIT',boxing:'Boxe',mobility:'Mobilité / stretching',strength:'Force',conditioning:'Condition physique',hyrox:'Hyrox',trail:'Trail',core:'Ceinture abdominale / gainage',health:'Santé',recovery:'Récupération / retour au calme'
};
const AUDIENCE_LABELS={kids:'Enfants',teens:'Ados',adults:'Adultes',seniors:'Seniors',athletes:'Sportifs avancés'};
function quickStyleLabel(v){return QUICK_STYLE_LABELS[v]||v;}
function audienceLabel(v){return AUDIENCE_LABELS[v]||v;}
function notify(targetId,msg,type='ok'){
  const host=document.getElementById(targetId); if(!host) return;
  let box=host.querySelector('.status-inline');
  if(!box){ box=document.createElement('div'); host.prepend(box); }
  box.className='status-inline'+(type==='warn'?' warn':type==='error'?' error':'');
  box.textContent=msg;
}
function setButtonState(btn,label,timeout=1400){ if(!btn) return; const old=btn.textContent; btn.textContent=label; btn.disabled=true; setTimeout(()=>{btn.textContent=old; btn.disabled=false;},timeout); }
function parseClientInput(raw){
  const txt=(raw||'').trim();
  if(!txt) return '';
  try{ const u=new URL(txt); const c=(u.searchParams.get('client')||'').trim().toUpperCase(); if(c) return c; }catch(e){}
  const m=txt.match(/[?&]client=([^&]+)/i); if(m) return decodeURIComponent(m[1]).trim().toUpperCase();
  return txt.toUpperCase();
}
function resolveProgramByInput(raw){
  const code=parseClientInput(raw);
  const programs=loadLocal('fafaPrograms',{});
  if(programs[code]) return {code, program:programs[code]};
  const keys=Object.keys(programs);
  const exactIgnore=keys.find(k=>k.toUpperCase()===code);
  if(exactIgnore) return {code:exactIgnore, program:programs[exactIgnore]};
  const partial=keys.filter(k=>k.startsWith(code));
  if(partial.length===1) return {code:partial[0], program:programs[partial[0]]};
  return {code, program:null};
}
function ageBand(age){ age=Number(age||0); if(age && age<13) return 'enfant'; if(age && age<18) return 'ado'; if(age>=60) return 'senior'; return 'adulte'; }
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
  let label='Poids normal', risk='profil standard';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
  else if(bmi < 35){ label='IMC élevé'; risk='lecture à nuancer selon composition corporelle'; }
  else { label='IMC très élevé'; risk='approche santé prioritaire'; }
  if((meta.activityLevel==='very_active' || meta.activityLevel==='active') && meta.level==='advanced' && bmi >= 27){
    label = 'IMC élevé à interpréter avec prudence';
    risk = 'profil potentiellement très musclé : compléter avec mensurations et tour de taille';
  }
  const waistCm = Number(meta.waistCm||0);
  const waistFlag = waistCm ? (meta.sex==='female' ? waistCm>=88 : waistCm>=102) : false;
  return {value:bmi.toFixed(1), label, risk: waistFlag ? risk + ' · tour de taille à surveiller' : risk};
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
  addOptions('secondGoals', [['recovery','Récupération'],['wellbeing','Bien-être'],['performance','Performance générale'],['posture','Posture / stabilité']]);
  addOptions('cycleGoals', [['technique','Technique'],['endurance','Endurance spécifique'],['recovery','Récupération'],['mobility','Mobilité / amplitudes']]);
  addOptions('focusTargets', [['mollets','Mollets'],['ischios','Ischios'],['avant_bras','Avant-bras / grip'],['rotation','Rotation / anti-rotation'],['cardio','Cardio / moteur']]);
  addOptions('fafaModules', [['mobility_flow','Mobilité / flow'],['body_recomp','Recomposition'],['combat_conditioning','Conditioning combat']]);
  addOptions('effortFormats', [['tempo','Tempo / contrôle'],['clusters','Clusters'],['ladder','Ladder'],['density','Density training'],['fartlek','Fartlek'],['zone2','Zone 2']]);
  addOptions('coachingTypes', [['performance','Performance'],['wellbeing','Bien-être'],['weightlifting','Haltérophilie'],['athletic','Préparation athlétique']]);
  addOptions('supports', [['hybrid','Hybride'],['messaging','Messagerie / feedback'],['autonome','Autonome guidé']]);
  addOptions('medicalKnown', [['asthme','Asthme'],['surpoids','Surpoids / obésité'],['discopathie','Discopathie / hernie'],['anxiete','Stress / anxiété']]);
  addOptions('injuryKnown', [['poignet','Poignet'],['hanche','Hanche'],['cheville','Cheville'],['ischio','Ischio / adducteurs']]);
  addOptions('foodKnown', [['vegetarien','Végétarien'],['vegan','Vegan'],['halal','Halal'],['lactose','Sans lactose'],['gluten','Sans gluten'],['arachides','Arachides']]);
}

function enhanceMultiSelects(ids){
  ids.forEach(id=>{
    const select = document.getElementById(id);
    if(!select || select.dataset.enhanced) return;
    select.dataset.enhanced='1';
    select.style.display='none';
    const host = document.createElement('div');
    host.className = 'multi-select';
    host.innerHTML = `
      <button type="button" class="multi-select-trigger" aria-expanded="false">
        <span class="multi-select-value">Aucune sélection</span>
        <span class="multi-select-arrow">▾</span>
      </button>
      <div class="multi-select-tags"></div>
      <div class="multi-select-menu" hidden>
        <div class="multi-select-search-wrap"><input type="text" class="multi-select-search" placeholder="Rechercher..."></div>
        <div class="multi-select-options"></div>
      </div>`;
    select.parentNode.insertBefore(host, select.nextSibling);
    host.appendChild(select);
    const trigger = host.querySelector('.multi-select-trigger');
    const value = host.querySelector('.multi-select-value');
    const tags = host.querySelector('.multi-select-tags');
    const menu = host.querySelector('.multi-select-menu');
    const search = host.querySelector('.multi-select-search');
    const optionsWrap = host.querySelector('.multi-select-options');

    const paint = ()=>{
      const q=(search.value||'').toLowerCase().trim();
      optionsWrap.innerHTML='';
      Array.from(select.options).forEach(opt=>{
        if(q && !opt.textContent.toLowerCase().includes(q)) return;
        const row=document.createElement('label');
        row.className='multi-option';
        row.innerHTML=`<input type="checkbox" ${opt.selected?'checked':''}><span>${opt.textContent}</span>`;
        row.querySelector('input').addEventListener('change', e=>{
          opt.selected=e.target.checked;
          refresh();
          select.dispatchEvent(new Event('change',{bubbles:true}));
        });
        optionsWrap.appendChild(row);
      });
    };

    const refresh = ()=>{
      const chosen = Array.from(select.selectedOptions);
      value.textContent = chosen.length ? `${chosen.length} sélection${chosen.length>1?'s':''}` : 'Aucune sélection';
      tags.innerHTML = chosen.length
        ? chosen.map(o=>`<span class="tag">${o.textContent}</span>`).join('')
        : '<span class="tag muted">Aucune sélection</span>';
      trigger.setAttribute('aria-expanded', String(!menu.hasAttribute('hidden')));
      host.classList.toggle('open', !menu.hasAttribute('hidden'));
      paint();
    };

    trigger.addEventListener('click', e=>{
      e.preventDefault();
      const isOpen = !menu.hasAttribute('hidden');
      document.querySelectorAll('.multi-select-menu').forEach(m=>m.setAttribute('hidden',''));
      document.querySelectorAll('.multi-select-trigger').forEach(t=>t.setAttribute('aria-expanded','false'));
      document.querySelectorAll('.multi-select').forEach(h=>h.classList.remove('open'));
      if(isOpen) menu.setAttribute('hidden','');
      else {
        menu.removeAttribute('hidden');
        trigger.setAttribute('aria-expanded','true');
        requestAnimationFrame(()=>search.focus());
      }
    });
    search.addEventListener('input', paint);
    document.addEventListener('click', e=>{ if(!host.contains(e.target)) { menu.setAttribute('hidden',''); trigger.setAttribute('aria-expanded','false'); } });
    refresh();
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
      fat_loss:['conditioning'],
      recomposition:['hypertrophy','conditioning'],
      muscle_gain:['hypertrophy'],
      strength:['strength'],
      conditioning:['conditioning'],
      boxing:['conditioning','peak'],
      hyrox:['conditioning','peak'],
      trail:['conditioning'],
      mobility:['health'],
      health:['health'],
      return_to_play:['health']
    };
    setMulti('cycleGoals', cycleMap[goal]||['conditioning']);
  }
  const coachTypes=[];
  if(goal==='boxing' || sport==='boxing') coachTypes.push('boxing');
  if(goal==='hyrox' || sport==='hyrox') coachTypes.push('hyrox');
  if(goal==='trail' || sport==='running') coachTypes.push('trail');
  if(['fat_loss','recomposition','muscle_gain','strength','conditioning'].includes(goal)) coachTypes.push('fitness');
  if(['health','return_to_play','mobility'].includes(goal) || getMulti('medicalKnown').length || getMulti('injuryKnown').length) coachTypes.push('health');
  coachTypes.push('general');
  setMulti('coachingTypes',[...new Set(coachTypes)]);
  const mods=[];
  if(goal==='boxing'||sport==='boxing') mods.push('boxing_prep');
  if(goal==='hyrox'||sport==='hyrox') mods.push('hyrox_prep');
  if(goal==='trail'||sport==='running') mods.push('trail_prep');
  if(goal==='return_to_play'||getMulti('injuryKnown').length) mods.push('return_to_play');
  if(goal==='health') mods.push('seniors_health');
  if(goal==='fat_loss') mods.push('express_fat_loss');
  if(goal==='recomposition' || goal==='muscle_gain') mods.push('transformation');
  setMulti('fafaModules',[...new Set(mods)]);
  applyEquipmentPreset();
  updateSummary();
}
function applyEquipmentPreset(){
  const env=$('#environmentSelect').value;
  const preset=PRESETS[env]||[];
  if(preset.length) setMulti('equipmentSelect', preset);
}
function updateSummary(){
  const bmi = calcBMI(Number($('#clientWeight').value||0), Number($('#clientHeight').value||0), {activityLevel:$('#activityLevel').value, level:$('#clientLevel').value});
  const summary=[
    ['Client', $('#clientName').value || '—'],
    ['Objectif', labelForGoal($('#mainGoal').value||'') || '—'],
    ['Contexte', ENV_LABELS[$('#environmentSelect').value] || 'Auto / à définir'],
    ['Fréquence conseillée', $('#clientFreq').value ? $('#clientFreq').value+'/semaine' : 'Auto'],
    ['Durée conseillée', $('#clientDuration').value ? $('#clientDuration').value+' min' : 'Auto'],
    ['IMC', bmi ? `${bmi.value} · ${bmi.label}` : '—'],
    ['Tour de taille', $('#waistCm')?.value ? $('#waistCm').value+' cm' : '—'],
    ['Modules', getMulti('fafaModules').map(v=>$('#fafaModules').querySelector(`option[value="${v}"]`)?.textContent||v).join(', ') || '—'],
    ['Statut business', `${$('#bizStatus').value||'—'} / ${Number($('#bizAmount').value||0)>0?'payé':'non payé'}`]
  ];
  $('#coachSummary').innerHTML=summary.map(([k,v])=>`<div><strong>${esc(k)} :</strong> ${esc(v)}</div>`).join('');
}

function buildDayTitles(freq, goal='conditioning', cycle='conditioning'){
  const f=Number(freq||3);
  if(goal==='boxing') return f===2?['Jour 1 · Technique + moteur','Jour 2 · Corps entier + rounds'] : f===3?['Jour 1 · Technique + appuis','Jour 2 · Force utile','Jour 3 · Conditioning boxe'] : ['Jour 1 · Technique','Jour 2 · Force bas du corps','Jour 3 · Technique + vitesse','Jour 4 · Condition physique / gainage','Jour 5 · Corps entier boxe'];
  if(goal==='hyrox') return f===3?['Jour 1 · Force utile','Jour 2 · Engine mixte','Jour 3 · Hyrox simulation'] : f===4?['Jour 1 · Lower + carry','Jour 2 · Engine','Jour 3 · Upper + sled','Jour 4 · Hyrox simulation'] : ['Jour 1 · Force lower','Jour 2 · Engine','Jour 3 · Upper + ski/row','Jour 4 · Threshold','Jour 5 · Hyrox simulation'];
  if(goal==='trail' || goal==='endurance') return f===3?['Jour 1 · Chaîne postérieure','Jour 2 · Seuil / côtes','Jour 3 · Sortie longue / core'] : ['Jour 1 · Force utile','Jour 2 · Seuil','Jour 3 · Cardio zone 2','Jour 4 · Sortie longue'];
  if(goal==='mobility' || cycle==='mobility') return ['Jour 1 · Mobilité globale','Jour 2 · Stabilité + respiration','Jour 3 · Flow + récupération'];
  if(goal==='strength' || cycle==='strength') return f===3?['Jour 1 · Bas du corps force','Jour 2 · Haut du corps force','Jour 3 · Corps entier assistance'] : f===4?['Jour 1 · Dominante squat','Jour 2 · Poussée force','Jour 3 · Dominante charnière hanche','Jour 4 · Tirage force + gainage'] : ['Jour 1 · Bas du corps force','Jour 2 · Poussée force','Jour 3 · Tirage force','Jour 4 · Bas du corps assistance','Jour 5 · Haut du corps assistance'];
  if(goal==='muscle_gain' || goal==='recomposition' || cycle==='hypertrophy') return f===3?['Jour 1 · Haut du corps hypertrophie','Jour 2 · Bas du corps hypertrophie','Jour 3 · Corps entier / condition physique'] : f===4?['Jour 1 · Poussée','Jour 2 · Lower','Jour 3 · Tirage','Jour 4 · Bas du corps + gainage'] : ['Jour 1 · Poussée','Jour 2 · Lower','Jour 3 · Tirage','Jour 4 · Corps entier','Jour 5 · Condition physique / gainage'];
  if(goal==='health' || goal==='return_to_play') return ['Jour 1 · Mobilité / stabilité','Jour 2 · Force utile','Jour 3 · Cardio doux / gainage'];
  if(f===2) return ['Jour 1 · Corps entier','Jour 2 · Corps entier + cardio'];
  if(f===3) return ['Jour 1 · Haut du corps','Jour 2 · Bas du corps','Jour 3 · Corps entier / condition physique'];
  if(f===4) return ['Jour 1 · Poussée','Jour 2 · Lower','Jour 3 · Tirage','Jour 4 · Condition physique / gainage'];
  if(f===5) return ['Jour 1 · Poussée','Jour 2 · Lower','Jour 3 · Tirage','Jour 4 · Bas du corps + condition physique','Jour 5 · Haut du corps + gainage'];
  return ['Jour 1 · Poussée','Jour 2 · Lower','Jour 3 · Tirage','Jour 4 · Lower','Jour 5 · Upper','Jour 6 · Conditioning'];
}


function exerciseMatches(ex, level, env, equipment, injuries, medical){
  const lvl={beginner:1,intermediate:2,advanced:3};
  if(lvl[ex.level] > lvl[level||'intermediate']) return false;
  if(env && ex.environments && !ex.environments.includes(env) && !['gym','mixed'].includes(env)) return false;
  if(equipment.length && ex.equipment && ex.equipment.length && !ex.equipment.some(e=>equipment.includes(e))) return false;
  const txt=(ex.name+' '+(ex.category||'')+' '+(ex.subcategory||'')+' '+ex.muscles+' '+ex.cue+' '+(ex.tags||[]).join(' ')).toLowerCase();
  if(injuries.includes('epaule') && /(overhead|développé nuque|snatch|jerk|throw)/i.test(txt)) return false;
  if(injuries.includes('dos') && /(soulevé de terre lourd|good morning|deadlift|rotation explosive|hyperextension lourde)/i.test(txt)) return false;
  if(injuries.includes('genou') && /(jump squat|saut|pistol|bondissement|lunge jump)/i.test(txt)) return false;
  if(injuries.includes('poignet') && /(handstand|planche|front rack lourd|clean lourd)/i.test(txt)) return false;
  if(injuries.includes('hanche') && /(cossack lourd|split jump|amplitude forcée)/i.test(txt)) return false;
  if(medical.includes('hypertension') && /(max|sprint all out|valsalva|all out)/i.test(txt)) return false;
  if(medical.includes('asthme') && /(apnée|all out long)/i.test(txt)) return false;
  if(medical.includes('discopathie') && /(flexion lombaire chargée|rounded back deadlift)/i.test(txt)) return false;
  return true;
}



function pickExercisesForContext({level='intermediate', env='', equipment=[], injuries=[], medical=[], style='', keywords=[], count=5, excludeBases=[]}){
  const filtered = EXERCISES.filter(ex=>exerciseMatches(ex, level, env, equipment, injuries, medical));
  const pool = shuffle(filtered).filter(ex=>{
    const base=(ex.name||'').split('—')[0].trim().toLowerCase();
    if(excludeBases.includes(base)) return false;
    const text=(ex.name+' '+(ex.subcategory||'')+' '+(ex.muscles||'')+' '+(ex.category||'')+' '+(ex.tags||[]).join(' ')+' '+(ex.focus||[]).join(' ')).toLowerCase();
    const keywordOK = !keywords.length || keywords.some(k=>text.includes(k));
    const styleOK = !style || styleMatches(ex, style);
    return keywordOK && styleOK;
  });
  const fallback = shuffle(filtered).filter(ex=>!excludeBases.includes((ex.name||'').split('—')[0].trim().toLowerCase()));
  return dedupeByBaseName(pool.length ? pool : fallback).slice(0, count);
}

function formatPrescription(goal, title, idx){
  const lower=(title||'').toLowerCase();
  if(goal==='strength') return {series: idx<2?'5 séries':'4 séries', reps: idx<2?'4 à 6 reps':'6 à 8 reps', rest: idx<2?'120 à 180 sec':'90 à 120 sec'};
  if(goal==='muscle_gain' || goal==='recomposition') return {series:'3 à 4 séries', reps: idx<2?'8 à 10 reps':'10 à 15 reps', rest:'60 à 90 sec'};
  if(goal==='fat_loss' || goal==='conditioning') return {series:'3 à 4 tours', reps: '30 à 45 sec / 10 à 15 reps', rest:'20 à 45 sec'};
  if(goal==='boxing') return {series:'4 à 8 rounds', reps: lower.includes('technique')?'2 à 3 min / round':'30 à 45 sec / drill', rest:'30 à 60 sec'};
  if(goal==='hyrox' || goal==='trail' || lower.includes('engine') || lower.includes('conditioning')) return {series:'3 à 5 blocs', reps:'4 à 8 min / bloc', rest:'60 à 120 sec'};
  if(goal==='mobility' || goal==='health' || lower.includes('mobilité') || lower.includes('respiration')) return {series:'2 à 4 séries', reps:'6 à 10 reps / 30 à 45 sec', rest:'20 à 30 sec'};
  return {series:'3 séries', reps:'8 à 12 reps', rest:'60 sec'};
}

function mobilityFocused(ex){
  const txt = (ex.name+' '+(ex.category||'')+' '+(ex.subcategory||'')+' '+(ex.muscles||'')+' '+(ex.cue||'')+' '+(ex.tags||[]).join(' ')+' '+(ex.focus||[]).join(' ')).toLowerCase();
  return ['mobil','stretch','rotation','respiration','souplesse','amplitude','stability','stabilité'].some(k=>txt.includes(k));
}
function prescriptionForQuick(style, zone='main', dur=45){
  const short = dur<=20, medium = dur<=30;
  const map = {
    mobility: {
      warmup:{series:'1 à 2 passages', reps:'30 à 40 sec / exercice', rest:'10 à 20 sec'},
      main:{series:'2 à 3 séries', reps:'6 à 10 reps / côté ou 30 à 45 sec', rest:'15 à 25 sec'},
      finisher:{series:'1 à 2 passages', reps:'40 à 60 sec respiration / stretch', rest:'10 sec'}
    },
    recovery: {
      warmup:{series:'1 passage', reps:'30 sec / exercice', rest:'10 sec'},
      main:{series:'2 séries', reps:'6 à 8 reps / 30 à 40 sec', rest:'15 à 20 sec'},
      finisher:{series:'1 passage', reps:'45 à 75 sec', rest:'10 sec'}
    },
    boxing: {
      warmup:{series:'2 passages', reps:'30 sec / drill', rest:'15 sec'},
      main:{series: short?'4 rounds':'6 à 8 rounds', reps:'2 à 3 min / round', rest:'45 à 60 sec'},
      finisher:{series:'2 à 3 rounds', reps:'30 sec', rest:'30 sec'}
    },
    hiit: {
      warmup:{series:'2 passages', reps:'30 sec', rest:'15 sec'},
      main:{series: short?'3 tours':'4 à 5 tours', reps: medium?'30 sec effort / 20 sec repos':'40 sec effort / 20 sec repos', rest:'60 à 90 sec entre tours'},
      finisher:{series:'1 à 2 blocs', reps:'4 min', rest:'60 sec'}
    },
    circuit: {
      warmup:{series:'1 à 2 passages', reps:'8 reps / 25 sec', rest:'15 sec'},
      main:{series: short?'3 tours':'4 tours', reps:'10 à 15 reps / 35 à 45 sec', rest:'20 à 30 sec'},
      finisher:{series:'1 bloc', reps:'3 à 5 min', rest:'30 sec'}
    },
    strength: {
      warmup:{series:'2 passages', reps:'6 à 8 reps', rest:'20 sec'},
      main:{series:'4 à 5 séries', reps:'4 à 8 reps', rest:'90 à 150 sec'},
      finisher:{series:'2 à 3 séries', reps:'8 à 12 reps', rest:'45 à 60 sec'}
    },
    conditioning: {
      warmup:{series:'2 passages', reps:'30 sec', rest:'15 sec'},
      main:{series:'3 à 4 blocs', reps:'4 à 6 min', rest:'60 à 90 sec'},
      finisher:{series:'1 bloc', reps:'3 min', rest:'30 sec'}
    },
    hyrox: {
      warmup:{series:'2 passages', reps:'30 sec', rest:'15 sec'},
      main:{series:'3 à 5 blocs', reps:'3 à 5 min / atelier', rest:'45 à 75 sec'},
      finisher:{series:'1 bloc', reps:'4 min carry / erg', rest:'45 sec'}
    },
    trail: {
      warmup:{series:'1 à 2 passages', reps:'20 à 30 sec', rest:'15 sec'},
      main:{series:'4 à 6 blocs', reps:'2 à 5 min', rest:'60 à 90 sec'},
      finisher:{series:'1 à 2 blocs', reps:'5 min retour au calme', rest:'—'}
    },
    core: {
      warmup:{series:'2 passages', reps:'20 à 30 sec', rest:'15 sec'},
      main:{series:'3 à 4 tours', reps:'20 à 40 sec / 8 à 12 reps', rest:'20 à 30 sec'},
      finisher:{series:'1 à 2 passages', reps:'30 sec', rest:'15 sec'}
    },
    health: {
      warmup:{series:'1 à 2 passages', reps:'20 à 30 sec', rest:'15 sec'},
      main:{series:'2 à 3 séries', reps:'8 à 12 reps / 30 sec', rest:'30 à 45 sec'},
      finisher:{series:'1 passage', reps:'3 à 5 min', rest:'—'}
    }
  };
  return (map[style]||map.circuit)[zone];
}

function quickCard(ex, prescription){
  return `<div class="quick-ex"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles||'')}</div><div class="small-muted">${esc(ex.cue||'')}</div><div class="quick-prescription"><span>${esc(prescription.series)}</span><span>${esc(prescription.reps)}</span><span>Repos ${esc(prescription.rest)}</span></div></div>`;
}

function buildProgramDays(form){
  const titles=buildDayTitles(form.freq, form.mainGoal, (form.cycleGoals||[])[0] || '');
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const usedBases=[];
  return titles.map((title)=>{
    let keys=['full body']; let style='';
    if(/push/i.test(title)) { keys=['pector','épaule','triceps','push']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/pull/i.test(title)) { keys=['dos','biceps','tirage','pull']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/lower|bas|squat|hinge/i.test(title)) { keys=['quadriceps','fess','ischio','jamb']; style=form.mainGoal==='strength'?'strength':'hypertrophy'; }
    else if(/conditioning|cardio|engine|simulation|threshold|zone 2|moteur/i.test(title)) { keys=['cardio','course','rameur','conditioning','bike','carry']; style=form.mainGoal==='boxing'?'boxing':form.mainGoal==='hyrox'?'hyrox':form.mainGoal==='trail'?'trail':'conditioning'; }
    else if(/mobilité|respiration|stabilité|flow/i.test(title)) { keys=['mobility','stability','rotation','core']; style='mobility'; }
    else if(/technique|rounds/i.test(title)) { keys=['boxe','boxing','shadow','pads','bag']; style='boxing'; }
    const chosen = pickExercisesForContext({level, env:form.env, equipment:form.equipment, injuries, medical, style, keywords:keys, count:5, excludeBases:usedBases});
    usedBases.push(...chosen.map(ex=>(ex.name||'').split('—')[0].trim().toLowerCase()));
    const items=chosen.map((ex,idx)=>({
      name:ex.name,
      category:ex.category,
      muscles:ex.muscles,
      cue:ex.cue,
      easy:ex.easy,
      hard:ex.hard,
      substitute: ex.easy || ex.hard || 'Adapter selon matériel',
      prescription: formatPrescription(form.mainGoal, title, idx),
      coachNote: style==='strength' ? 'Priorité à la qualité technique et à la récupération entre les séries.' :
        style==='conditioning' ? 'Garde une intensité progressive et propre, pas de départ trop violent.' :
        style==='boxing' ? 'Précision, appuis et rythme avant la puissance.' :
        style==='mobility' ? 'Cherche l’amplitude confortable et la respiration.' :
        'Exécution propre et marge de sécurité.'
    }));
    return {title, items, patternSummary: keys.join(' / '), style};
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
    note:trainIdx.includes(idx+1)?'Entraînement':'Repos actif / mobilité'
  }));
}


function renderProgram(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const head = `<div class="panel panel-hero"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Lien adhérent prêt</span>`:''}</div>
    <div class="meta">
      <span class="badge">${esc(labelForGoal(p.mainGoal))}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(labelForEnv(p.env))}</span>
      <span class="badge">${esc(p.freq)}/semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>IMC :</strong> ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}</p>`:''}
    ${p.restrictions?`<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictions)}</p>`:''}
    <div class="summary-grid summary-grid-3">
      <div class="summary-card"><strong>${esc(p.freq)}</strong><div class="small-muted">séances / semaine</div></div>
      <div class="summary-card"><strong>${esc(p.duration)} min</strong><div class="small-muted">durée cible</div></div>
      <div class="summary-card"><strong>${esc((p.cycleGoals||[]).map(labelForGoal).join(', ') || 'Cycle auto')}</strong><div class="small-muted">orientation</div></div>
    </div>
  </div>`;
  const sched = `<article class="athlete-week"><h3>Semaine type</h3><div class="week-days compact">${
    week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><small>${w.note}</small></div>`).join('')
  }</div></article>`;
  const days = p.days.map(day=>`<article class="panel"><div class="session-top"><h3>${esc(day.title)}</h3><span class="badge">${esc(quickStyleLabel(day.style||'mixte'))}</span></div><p class="small-muted">Répartition : ${esc(day.patternSummary)}</p>${
    day.items.map(ex=>`<div class="summary-card session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles)}</div>
    <div class="quick-prescription"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.reps)}</span><span>Repos ${esc(ex.prescription.rest)}</span></div>
    <div class="small-muted">Consigne : ${esc(ex.cue)}</div>
    <div class="small-muted">Substitution : ${esc(ex.substitute)}</div>
    <div class="small-muted">Note coach : ${esc(ex.coachNote||'')}</div></div>`).join('')
  }</article>`).join('');
  const actions = coach ? `<div class="actions"><button id="coachSaveAgain">Enregistrer</button><button class="ghost" id="coachCopyLinkAgain">Copier lien adhérent</button><button class="ghost" id="coachExportPdfAgain">Exporter PDF premium</button></div>` : '';
  return head + sched + actions + `<div class="stack">${days}</div>`;
}

function buildNutritionView(p){
  const n = p.nutrition;
  if(!n) return '<div class="panel"><p>Impossible de calculer la nutrition sans taille, poids et âge.</p></div>';
  const food = optionLabels('foodKnown');
  const band = ageBand(p.age);
  const goalText = labelForGoal(p.mainGoal);
  const hydration = p.mainGoal==='trail' || p.mainGoal==='hyrox' || p.mainGoal==='endurance'
    ? 'Hydratation renforcée : 30 à 40 ml/kg/jour comme base, plus 500 à 1000 ml par heure d’effort selon chaleur et transpiration.'
    : 'Hydratation de base : 30 à 35 ml/kg/jour, à augmenter les jours d’entraînement ou en période chaude.';
  const peri = ['hyrox','trail','conditioning','endurance','boxing'].includes(p.mainGoal)
    ? 'Autour de la séance : 1 source de glucides facile à digérer avant si besoin, puis protéines + glucides après pour mieux récupérer.'
    : ['strength','muscle_gain','recomposition'].includes(p.mainGoal)
      ? 'Autour de la séance : collation simple utile si la séance est éloignée d’un repas, puis protéines après l’entraînement.'
      : 'Autour de la séance : priorité à la régularité, à la digestion confortable et à une récupération simple.';
  const audienceTips = band==='enfant'
    ? ['Priorité à la croissance, à l’énergie et à des repas simples.', 'Ne pas viser de restriction agressive.', 'Collations utiles : fruit, yaourt, lait, tartine, compote.']
    : band==='ado'
      ? ['Structurer 3 repas + 1 à 2 collations selon sport et école.', 'Protéines réparties sans obsession.', 'Attention à l’hydratation et au sommeil.']
      : band==='senior'
        ? ['Apport protéique réparti sur la journée.', 'Fibres, hydratation et micronutrition à surveiller.', 'Privilégier digestion confortable et récupération.']
        : ['3 à 4 repas stables, protéines réparties, légumes réguliers.', 'Ajuster les glucides selon volume d’entraînement.', 'Surveiller faim, énergie, récupération et adhérence.'];
  const micro = [
    'Légumes ou fruits colorés chaque jour pour les micronutriments.',
    'Oméga-3 alimentaires 2 à 3 fois par semaine si possible.',
    'Magnésium / potassium via une alimentation variée, surtout en période de fatigue ou forte transpiration.',
    'Sodium à ne pas négliger chez les profils qui transpirent beaucoup.'
  ];
  return `<div class="panel panel-hero"><h3>Nutrition FAFATRAINING · ${esc(goalText)}</h3>
    <div class="nutrition-grid">
      <div class="nutrition-block"><strong>${n.kcal}</strong><div class="small-muted">kcal repère / jour</div></div>
      <div class="nutrition-block"><strong>${n.protein} g</strong><div class="small-muted">protéines / jour</div></div>
      <div class="nutrition-block"><strong>${n.carbs} g</strong><div class="small-muted">glucides / jour</div></div>
      <div class="nutrition-block"><strong>${n.fats} g</strong><div class="small-muted">lipides / jour</div></div>
    </div>
    <div class="portal-hero">
      <div class="portal-card">
        <h3>Lecture coach personnalisée</h3>
        <div class="nutrition-list">
          <div><strong>Profil :</strong> ${band} · ${esc(labelForGoal(p.mainGoal))} · ${esc(p.freq)} séance(s) / semaine</div>
          <div><strong>Cap nutrition :</strong> ${p.mainGoal==='fat_loss' ? 'léger déficit, satiété élevée, maintien des protéines' : p.mainGoal==='muscle_gain' ? 'surplus mesuré, progression sans prise de gras trop rapide' : ['hyrox','trail','conditioning','endurance'].includes(p.mainGoal) ? 'carburant suffisant, hydratation et récupération' : 'stabilité alimentaire et récupération durable'}</div>
          <div><strong>Hydratation :</strong> ${hydration}</div>
          <div><strong>Autour des séances :</strong> ${peri}</div>
          <div><strong>Restrictions connues :</strong> ${p.restrictions || 'aucune restriction déclarée'}</div>
          ${food.length?`<div><strong>Préférences alimentaires :</strong> ${food.join(', ')}</div>`:''}
        </div>
      </div>
      <div class="portal-card">
        <h3>Repères terrain FAFATRAINING</h3>
        <div class="nutrition-list">
          ${audienceTips.map(t=>`<div>${t}</div>`).join('')}
          ${micro.map(t=>`<div>${t}</div>`).join('')}
        </div>
      </div>
    </div>
    <p class="small-muted" style="margin-top:14px">Lecture simple : point de départ à ajuster selon évolution du poids, énergie, faim, digestion, sommeil et assiduité.</p></div>`;
}
function collectRestrictions(){
  const arr=[];
  if(getMulti('medicalKnown').length) arr.push('Pathologies : '+getMulti('medicalKnown').join(', '));
  if(getMulti('injuryKnown').length) arr.push('Blessures : '+getMulti('injuryKnown').join(', '));
  if(getMulti('foodKnown').length) arr.push('Nutrition / allergies : '+getMulti('foodKnown').join(', '));
  if($('#healthNotes').value.trim()) arr.push($('#healthNotes').value.trim());
  return arr.join(' · ');
}
function saveProgram(program){
  const all=loadLocal('fafaPrograms',{});
  all[program.code]=program;
  saveLocal('fafaPrograms', all);
  if($('#athleteCode')) $('#athleteCode').value=program.code;
  if($('#nutritionCode')) $('#nutritionCode').value=program.code;
  if($('#trackCode')) $('#trackCode').value=program.code;
  if($('#bizCodeInput')) $('#bizCodeInput').value=program.code;
  renderHome();
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
    level:$('#clientLevel').value || 'intermediate',
    sport:$('#currentSport').value,
    availability:$('#availabilityWeekly').value,
    activityLevel:$('#activityLevel').value,
    waistCm:Number($('#waistCm')?.value||0),
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
  if(!form.mainGoal){ $('#coachOutput').innerHTML='<div class="panel">Choisis un objectif principal pour lancer le moteur programme.</div>'; showStep(2); return; }
  if(!form.height || !form.weight || !form.age){ $('#coachOutput').innerHTML='<div class="panel">Renseigne âge, taille et poids pour générer un programme crédible et la partie nutrition.</div>'; showStep(1); return; }
  form.bmi=calcBMI(form.weight, form.height, {activityLevel:form.activityLevel, level:form.level, waistCm:form.waistCm, sex:form.sex});
  form.nutrition=calcCalories({sex:form.sex, weight:form.weight, height:form.height, age:form.age, goal:form.mainGoal, stress:form.stressLevel, activityFactor:activityFactorFromProfile(form.activityLevel, form.freq)});
  form.restrictions=collectRestrictions();
  form.days=buildProgramDays(form);
  form.athleteLink=generateAthleteLink(form);
  currentProgram=form;
  saveProgram(form);
  saveBusinessStatus(form.code, form.bizStatus, form.bizAmount, '');
  $('#coachOutput').innerHTML=renderProgram(form,true);
  notify('coachOutput', `Programme généré et enregistré sous le code ${form.code}.`, 'ok');
  goView('coach');
  showStep(3);
  wireProgramActionButtons();
  updateSummary();
  $('#coachOutput').scrollIntoView({behavior:'smooth', block:'start'});
}

function wireProgramActionButtons(){
  $('#coachSaveAgain')?.addEventListener('click', (e)=>{ if(currentProgram){ saveProgram(currentProgram); setButtonState(e.currentTarget,'Enregistré'); notify('coachOutput', `Programme ${currentProgram.code} enregistré.`, 'ok'); }});
  $('#coachCopyLinkAgain')?.addEventListener('click', copyAthleteLink);
  $('#coachExportPdfAgain')?.addEventListener('click', exportPdf);
}

function copyAthleteLink(){
  if(!currentProgram){ notify('coachOutput','Génère d’abord un programme avant de copier le lien adhérent.','warn'); return; }
  const text=`Code adhérent : ${currentProgram.code}
Lien adhérent : ${currentProgram.athleteLink}`;
  navigator.clipboard?.writeText(text).then(()=>{
    notify('coachOutput', `Code ${currentProgram.code} et lien adhérent copiés.`, 'ok');
  }).catch(()=>window.prompt('Copie ce texte :', text));
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
  doc.save(`${p.code}_FAFATRAINING_V28_1.pdf`);
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
  $('#libraryOutput').innerHTML = results.slice(0,240).map(ex=>`<article class="library-card">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(labelForLevel(ex.level))}</span>
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
  const resolved=resolveProgramByInput(($('#athleteCode').value||''));
  const code=resolved.code;
  if($('#athleteCode')) $('#athleteCode').value=code;
  const p=resolved.program;
  if(!p){ $('#athleteOutput').innerHTML='<div class="empty-state"><strong>Aucun programme trouvé.</strong><div class="small-muted">Colle soit le code exact, soit le lien adhérent complet, puis vérifie que le programme a bien été généré et enregistré.</div></div>'; return; }
  const biz=loadLocal('fafaBusiness',{})[p.code] || {status:p.bizStatus||'actif', amount:Number(p.bizAmount||0)};
  if(biz.status==='impaye'){
    $('#athleteOutput').innerHTML='<div class="panel">Accès bloqué : compte impayé. Remets le statut sur actif ou pause dans le module Business.</div>'; return;
  }
  const tracks=loadLocal('fafaTracking',{})[p.code]||[];
  const last = tracks[tracks.length-1];
  const accessNote = biz.status==='pause' ? '<div class="panel"><strong>Compte en pause.</strong> Le planning reste visible, mais l’accompagnement est suspendu.</div>' : (Number(biz.amount||0)<=0 ? '<div class="panel"><strong>Accès ouvert.</strong> Aucun paiement enregistré pour le moment dans Business.</div>' : '');
  $('#athleteOutput').innerHTML = accessNote + `<div class="portal-hero"><div class="portal-card"><h3>Portail adhérent · ${esc(p.name)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span><span class="badge">${esc(labelForGoal(p.mainGoal))}</span><span class="badge">${esc(p.freq)}/semaine</span><span class="badge">${esc(p.duration)} min</span></div><p class="small-muted">Lecture simple : suis le planning, valide ton ressenti et garde une exécution propre.</p><div class="mini-actions"><button type="button" class="ghost" id="portalCopyCodeBtn">Copier le code</button><button type="button" class="ghost" id="portalCopyLinkBtn">Copier le lien</button></div></div><div class="portal-card"><h3>Résumé adhérent</h3><div class="summary-grid summary-grid-3"><div class="summary-card"><strong>${esc(p.cycleWeeks||8)} semaines</strong><div class="small-muted">cycle</div></div><div class="summary-card"><strong>${last?.energy||'-'}/10</strong><div class="small-muted">dernière énergie</div></div><div class="summary-card"><strong>${p.nutrition?.kcal || '-'}</strong><div class="small-muted">kcal repère</div></div></div><div class="portal-lock">Statut : ${esc(biz.status)} · Montant enregistré : ${esc(biz.amount||0)} €</div></div></div>` + renderProgram(p,false) + `<div class="panel"><h3>Historique / ressenti</h3>${tracks.length?tracks.map(t=>`<div class="summary-card"><strong>${t.date}</strong><div>Poids : ${t.weight||'-'} kg · Énergie : ${t.energy||'-'}/10 · Compliance : ${t.compliance||'-'}%</div><div class="small-muted">${esc(t.note||'')}</div></div>`).join(''):'<p>Aucun suivi pour le moment.</p>'}</div>`;
  $('#portalCopyCodeBtn')?.addEventListener('click',e=>{navigator.clipboard?.writeText(p.code); setButtonState(e.currentTarget,'Code copié');});
  $('#portalCopyLinkBtn')?.addEventListener('click',e=>{navigator.clipboard?.writeText(p.athleteLink); setButtonState(e.currentTarget,'Lien copié');});
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
  const resolved=resolveProgramByInput(($('#nutritionCode').value||''));
  if($('#nutritionCode')) $('#nutritionCode').value=resolved.code;
  $('#nutritionOutput').innerHTML = resolved.program ? buildNutritionView(resolved.program) : '<div class="panel">Aucun programme trouvé. Colle le code adhérent exact ou le lien adhérent complet.</div>';
}
function renderBusiness(){
  const all=loadLocal('fafaBusiness',{});
  const rows=Object.values(all);
  $('#businessOutput').innerHTML = rows.length ? rows.map(r=>`<div class="summary-card"><strong>${esc(r.code)}</strong><div>Statut : ${esc(r.status)} · Montant : ${esc(r.amount)} €</div><div class="small-muted">${r.renewal?`Échéance : ${esc(r.renewal)}`:'Sans échéance'}</div></div>`).join('') : '<div class="panel">Aucun statut enregistré.</div>';
  const due = rows.filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  $('#kpiDue').textContent = due;
  $('#kpiClients').textContent = rows.filter(r=>r.status==='actif' && Number(r.amount||0)>0).length;
}
function quickBuild(){
  const dur=Number($('#quickDuration').value||45);
  const style=$('#quickStyle').value;
  const env=$('#quickEnv').value;
  const audience=$('#quickPublic').value;
  const audienceHints={
    kids:'ludique, très simple, peu technique, beaucoup de mouvement',
    teens:'dynamique, varié, progressif et motivant',
    adults:'équilibré, utile, fluide et adaptable',
    seniors:'sécurisé, mobilité, posture, respiration et force utile',
    athletes:'plus dense, plus précis et plus exigeant'
  };
  let basePool = pickExercisesForContext({
    level: audience==='kids' || audience==='seniors' ? 'beginner' : audience==='athletes' ? 'advanced' : 'intermediate',
    env,
    equipment: PRESETS[env] || [],
    injuries: [],
    medical: audience==='seniors' ? ['hypertension'] : [],
    style: style==='recovery' ? 'mobility' : style,
    keywords: [],
    count: 24,
    excludeBases: []
  });

  if(['mobility','recovery','health'].includes(style)){
    basePool = basePool.filter(ex=>mobilityFocused(ex));
  } else if(style==='boxing'){
    basePool = basePool.filter(ex=>styleMatches(ex,'boxing'));
  } else if(style==='trail'){
    basePool = basePool.filter(ex=>styleMatches(ex,'trail'));
  } else if(style==='hyrox'){
    basePool = basePool.filter(ex=>styleMatches(ex,'hyrox'));
  } else if(style==='strength'){
    basePool = basePool.filter(ex=>styleMatches(ex,'strength') || ['musculation'].includes((ex.category||'').toLowerCase()));
  }

  if(basePool.length<9){
    basePool = pickExercisesForContext({
      level: audience==='kids' || audience==='seniors' ? 'beginner' : audience==='athletes' ? 'advanced' : 'intermediate',
      env,
      equipment: PRESETS[env] || [],
      injuries: [],
      medical: audience==='seniors' ? ['hypertension'] : [],
      style: style==='recovery' ? 'mobility' : style,
      keywords: [],
      count: 18,
      excludeBases: []
    });
  }
  const pool = dedupeByBaseName(shuffle(basePool));
  const warmup = pool.slice(0,2);
  const main = pool.slice(2,7);
  const finisher = pool.slice(7,9);
  const blockTitle = style==='boxing' ? 'Rounds / ateliers' : style==='mobility' || style==='recovery' ? 'Bloc mobilité / stretching' : 'Bloc principal';
  $('#quickOutput').innerHTML = `<div class="quick-layout">
      <div class="panel panel-hero">
        <div class="section-mini-head"><h3>Séance rapide ${esc(quickStyleLabel(style))}</h3><p>${dur} minutes · ${esc(ENV_LABELS[env]||env)} · ${esc(audienceLabel(audience))}</p></div>
        <div class="quick-block"><h4>Échauffement</h4><div class="quick-list">${warmup.map(ex=>quickCard(ex, prescriptionForQuick(style,'warmup',dur))).join('')}</div></div>
        <div class="quick-block"><h4>${blockTitle}</h4><div class="quick-list">${main.map(ex=>quickCard(ex, prescriptionForQuick(style,'main',dur))).join('')}</div></div>
        <div class="quick-block"><h4>Finisher / retour au calme</h4><div class="quick-list">${finisher.map(ex=>quickCard(ex, prescriptionForQuick(style,'finisher',dur))).join('')}</div></div>
      </div>
      <div class="quick-rail">
        <div class="panel"><h3>Logique de séance</h3><div class="small-muted">Public : ${audienceHints[audience]||'adaptable'}.</div><div class="small-muted">Style : ${esc(quickStyleLabel(style))}.</div><div class="small-muted">Volume cible : ${dur===20?'court et dense':dur===30?'efficace et simple':dur===45?'complet et polyvalent':'plus développé et progressif'}.</div></div>
        <div class="panel"><h3>Prescription coach</h3><div class="small-muted">Chaque exercice affiche maintenant le cadre de travail : séries, reps ou temps, et repos.</div><div class="quick-meta"><span class="badge">Public filtré</span><span class="badge">Lieu filtré</span><span class="badge">Style filtré</span></div></div>
      </div>
    </div>`;
}

function renderHome(){
  const programs=loadLocal('fafaPrograms',{});
  const business=loadLocal('fafaBusiness',{});
  const tracks=loadLocal('fafaTracking',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length;
  $('#kpiLibrary').textContent=EXERCISES.length;
  renderBusiness();
  const activeClients = Object.values(business).filter(b=>b.status==='actif').length;
  const trackedCount = Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0);
  const recentPrograms = Object.values(programs).slice(-4).reverse();
  const recentHtml = recentPrograms.length ? recentPrograms.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${esc(labelForGoal(p.mainGoal))} · ${esc(p.freq)}/sem · ${esc(labelForEnv(p.env))}</div></div>`).join('') : '<div class="summary-card"><strong>Aucun programme enregistré</strong><div class="small-muted">Crée ton premier programme depuis Coach Pro.</div></div>';
  $('#homeActivity').innerHTML=`
    <div class="summary-grid summary-grid-3">
      <div class="summary-card"><strong>${activeClients}</strong><div class="small-muted">clients suivis</div></div>
      <div class="summary-card"><strong>${trackedCount}</strong><div class="small-muted">check-ins enregistrés</div></div>
      <div class="summary-card"><strong>${Object.keys(programs).length}</strong><div class="small-muted">programmes sauvegardés</div></div>
    </div>
    <div class="empty-state"><strong>Accueil recentré.</strong><div class="small-muted">Ici, seulement l’essentiel : état de la plateforme, derniers programmes et accès rapides. Les doublons visuels ont été retirés.</div></div>
    ${recentHtml}`;
  $('#kpiTracked') && ($('#kpiTracked').textContent = trackedCount);
}

function wireEvents(){
  ['#clientName','#clientCode','#clientEmail','#clientAge','#clientHeight','#clientWeight','#clientLevel','#currentSport','#availabilityWeekly','#activityLevel','#mainGoal','#environmentSelect','#clientFreq','#clientDuration','#bizStatus','#bizAmount','#waistCm']
    .forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  ['#mainGoal','#currentSport','#availabilityWeekly','#clientLevel','#practicePrefs','#medicalKnown','#injuryKnown','#foodKnown'].forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  $('#buildProgramBtn').addEventListener('click', buildProgram);
  $('#saveProgramBtn').addEventListener('click', (e)=>{ if(currentProgram){ saveProgram(currentProgram); setButtonState(e.currentTarget,'Enregistré'); notify('coachOutput', `Programme ${currentProgram.code} enregistré.`, 'ok'); } else { notify('coachOutput','Génère d’abord un programme avant de l’enregistrer.','warn'); } });
  $('#copyLinkBtn').addEventListener('click', copyAthleteLink);
  $('#exportPdfBtn').addEventListener('click', exportPdf);
  $('#libSearchBtn').addEventListener('click', renderLibrary);
  $('#libSearch').addEventListener('input', renderLibrary);
  $('#libCategory').addEventListener('change', renderLibrary);
  $('#libLevel').addEventListener('change', renderLibrary);
  $('#libEnv').addEventListener('change', renderLibrary);
  $('#libEquipment').addEventListener('change', renderLibrary);
  $('#libStyle')?.addEventListener('change', renderLibrary);
  $('#openAthleteBtn').addEventListener('click', (e)=>{ openAthletePortal(); setButtonState(e.currentTarget,'Ouvert'); });
  $('#saveTrackBtn').addEventListener('click', saveTracking);
  $('#showNutritionBtn').addEventListener('click', (e)=>{ showNutrition(); setButtonState(e.currentTarget,'Affiché'); });
  $('#saveBizBtn').addEventListener('click', ()=>{
    saveBusinessStatus(($('#bizCodeInput').value||'').trim().toUpperCase(), $('#bizStatusInput').value, Number($('#bizAmountInput').value||0), $('#bizRenewalInput').value);
  });
  $('#quickBuildBtn').addEventListener('click', (e)=>{ quickBuild(); setButtonState(e.currentTarget,'Créée'); });
  $$('[data-nav-target]').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.navTarget)));
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

/* ===== V29 overrides ===== */
function quickStyleLabel(v){
  const labels={
    circuit:'Circuit',
    hiit:'HIIT (intervalles haute intensité)',
    boxing:'Boxe',
    mobility:'Mobilité / stretching',
    strength:'Force',
    conditioning:'Condition physique',
    hyrox:'Hyrox / fonctionnel',
    trail:'Trail / course nature',
    core:'Gainage / ceinture abdominale',
    health:'Santé / remise en forme',
    recovery:'Récupération / retour au calme',
    zone2:'Zone 2 (endurance fondamentale)'
  };
  return labels[v]||v;
}
function ageBand(age){
  age=Number(age||0);
  if(age>=3 && age<=5) return 'petite_enfance';
  if(age>=6 && age<=10) return 'enfant';
  if(age>=11 && age<=13) return 'preado';
  if(age>=14 && age<=17) return 'ado';
  if(age>=18 && age<=49) return 'adulte';
  if(age>=50 && age<=64) return 'senior_actif';
  if(age>=65) return 'senior_avance';
  return 'adulte';
}
function ageBandLabel(b){
  return {
    petite_enfance:'Petite enfance (3-5 ans)',
    enfant:'Enfant (6-10 ans)',
    preado:'Pré-ado (11-13 ans)',
    ado:'Adolescent (14-17 ans)',
    adulte:'Adulte (18-49 ans)',
    senior_actif:'Senior actif (50-64 ans)',
    senior_avance:'Senior avancé (65 ans et +)'
  }[b]||'Adulte';
}
function labelForCycle(v){
  return {
    hypertrophy:'Hypertrophie (développement musculaire)',
    strength:'Force',
    conditioning:'Condition physique / cardio',
    maintenance:'Maintenance',
    peak:'Pic de forme / affûtage',
    health:'Santé / remise en forme',
    technique:'Technique',
    endurance:'Endurance spécifique',
    recovery:'Récupération',
    mobility:'Mobilité / amplitudes'
  }[v]||labelForGoal(v)||v;
}
function buildWeekSchedule(freq){
  const days=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const f=Number(freq||3);
  const layouts={2:[1,4],3:[1,3,5],4:[1,2,4,6],5:[1,2,4,5,6],6:[1,2,3,5,6,7]};
  const trainIdx=layouts[f]||layouts[3];
  return days.map((d,idx)=>({day:d,train:trainIdx.includes(idx+1),note:trainIdx.includes(idx+1)?'Séance':'Repos actif'}));
}
function renderProgram(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const cycleText=(p.cycleGoals||[]).length ? p.cycleGoals.map(labelForCycle).join(', ') : 'Cycle automatique';
  const ageText=ageBandLabel(ageBand(p.age));
  const head = `<div class="panel panel-hero"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Lien adhérent prêt</span>`:''}</div>
    <div class="meta">
      <span class="badge">${esc(labelForGoal(p.mainGoal))}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(labelForEnv(p.env))}</span>
      <span class="badge">${esc(p.freq)}/semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>IMC :</strong> ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}<br><span class="small-muted">Calcul officiel : poids (kg) / taille² (m). Chez les profils sportifs ou très musclés, l’IMC doit être nuancé avec le tour de taille et l’observation terrain.</span></p>`:''}
    <div class="summary-grid summary-grid-3">
      <div class="summary-card"><strong>${esc(ageText)}</strong><div class="small-muted">catégorie d’âge</div></div>
      <div class="summary-card"><strong>${esc(p.duration)} min</strong><div class="small-muted">durée cible</div></div>
      <div class="summary-card"><strong>${esc(cycleText)}</strong><div class="small-muted">orientation du cycle</div></div>
    </div>
  </div>`;
  const sched=`<article class="athlete-week"><h3>Semaine type</h3><div class="week-days compact">${week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><small>${w.note}</small></div>`).join('')}</div></article>`;
  const days=p.days.map(day=>`<article class="panel"><div class="session-top"><h3>${esc(day.title)}</h3><span class="badge">${esc(quickStyleLabel(day.style||'mixte'))}</span></div><p class="small-muted">Répartition : ${esc(day.patternSummary)}</p>${day.items.map(ex=>`<div class="summary-card session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles)}</div><div class="quick-prescription"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.reps)}</span><span>Repos ${esc(ex.prescription.rest)}</span></div><div class="small-muted">Consigne : ${esc(ex.cue)}</div><div class="small-muted">Substitution : ${esc(ex.substitute)}</div><div class="small-muted">Note coach : ${esc(ex.coachNote||'')}</div></div>`).join('')}</article>`).join('');
  const actions = coach ? `<div class="actions"><button id="coachSaveAgain">Enregistrer</button><button class="ghost" id="coachCopyLinkAgain">Copier lien adhérent</button><button class="ghost" id="coachExportPdfAgain">Exporter PDF premium</button></div>` : '';
  return head + sched + actions + `<div class="stack">${days}</div>`;
}
function buildStandaloneNutrition(){
  const audience=$('#nutriAudience')?.value||'adult';
  const goal=$('#nutriGoal')?.value||'health';
  const restrictions=optionLabels('nutriRestrictions');
  const dislikes=optionLabels('nutriDislikes');
  const kcalMap={adult:{health:2100,fat_loss:1800,muscle_gain:2400,performance:2500,recomposition:2200},child:{health:1600,fat_loss:1500,muscle_gain:1800,performance:1900,recomposition:1700},teen:{health:2200,fat_loss:1900,muscle_gain:2500,performance:2700,recomposition:2300},senior:{health:1900,fat_loss:1700,muscle_gain:2100,performance:2200,recomposition:1950}};
  const proteinMap={adult:{health:120,fat_loss:140,muscle_gain:150,performance:130,recomposition:145},child:{health:65,fat_loss:60,muscle_gain:75,performance:75,recomposition:70},teen:{health:90,fat_loss:110,muscle_gain:130,performance:120,recomposition:120},senior:{health:110,fat_loss:120,muscle_gain:130,performance:120,recomposition:125}};
  const n={kcal:kcalMap[audience][goal], protein:proteinMap[audience][goal], carbs:Math.round(kcalMap[audience][goal]*0.4/4), fats:Math.round(kcalMap[audience][goal]*0.3/9)};
  const profile={
    name:'Mode nutrition seule', age: audience==='child'?8:audience==='teen'?15:audience==='senior'?68:30,
    mainGoal: goal==='performance'?'conditioning':goal, freq:goal==='performance'?4:3, restrictions:[...restrictions,...dislikes].join(', '), nutrition:n,
    ageBand: audience
  };
  return buildNutritionView(profile,true);
}
function buildNutritionView(p, standalone=false){
  const n=p.nutrition; if(!n) return '<div class="panel"><p>Impossible de calculer la nutrition sans données suffisantes.</p></div>';
  const food = standalone ? optionLabels('nutriRestrictions').concat(optionLabels('nutriDislikes')) : optionLabels('foodKnown');
  const band = standalone ? ({adult:'adulte',child:'enfant',teen:'ado',senior:'senior_avance'}[($('#nutriAudience')?.value||'adult')]) : ageBand(p.age);
  const bandText = standalone ? ({adult:'Adulte',child:'Enfant (6-10 ans)',teen:'Adolescent',senior:'Senior'}[($('#nutriAudience')?.value||'adult')]) : ageBandLabel(band);
  const goalText = standalone ? ({health:'Santé / équilibre',fat_loss:'Perte de poids',muscle_gain:'Prise de muscle',performance:'Performance / énergie',recomposition:'Recomposition corporelle'}[$('#nutriGoal')?.value||'health']) : labelForGoal(p.mainGoal);
  const hydration = ['trail','hyrox','endurance','conditioning','performance'].includes(p.mainGoal||$('#nutriGoal')?.value) ? 'Hydratation renforcée : base 30 à 40 ml/kg/jour, à adapter selon chaleur, durée et transpiration.' : 'Hydratation de base : 30 à 35 ml/kg/jour, puis ajustement selon la journée et l’entraînement.';
  const substitutions=[
    ['Œufs','yaourt grec, skyr, tofu soyeux, blanc de poulet'],
    ['Légumes peu aimés','soupes lisses, purées, crudités fines, légumes mixés dans sauces'],
    ['Produits laitiers','boissons végétales enrichies, tofu, yaourts sans lactose'],
    ['Poisson','volaille, œufs, tofu, légumineuses + céréales'],
    ['Collation rapide','fruit + yaourt, compote + skyr, tartine + jambon, smoothie maison']
  ];
  const micro=[
    'Calcium et vitamine D à surveiller chez l’enfant, l’ado et le senior.',
    'Magnésium, potassium et sodium utiles pour les profils qui transpirent beaucoup.',
    'Oméga-3 via poissons gras, noix ou alternatives végétales adaptées.',
    'Fibres et couleur dans l’assiette pour digestion et micronutrition.'
  ];
  return `<div class="panel panel-hero"><h3>${standalone?'Nutrition autonome FAFATRAINING':'Nutrition FAFATRAINING'} · ${esc(goalText)}</h3>
    <div class="nutrition-grid">
      <div class="nutrition-block"><strong>${n.kcal}</strong><div class="small-muted">kcal repère / jour</div></div>
      <div class="nutrition-block"><strong>${n.protein} g</strong><div class="small-muted">protéines / jour</div></div>
      <div class="nutrition-block"><strong>${n.carbs} g</strong><div class="small-muted">glucides / jour</div></div>
      <div class="nutrition-block"><strong>${n.fats} g</strong><div class="small-muted">lipides / jour</div></div>
    </div>
    <div class="portal-hero">
      <div class="portal-card">
        <h3>Lecture personnalisée</h3>
        <div class="nutrition-list">
          <div><strong>Public :</strong> ${esc(bandText)}</div>
          <div><strong>Cap nutrition :</strong> ${esc(goalText)}</div>
          <div><strong>Hydratation :</strong> ${hydration}</div>
          <div><strong>Repère repas :</strong> 3 repas stables + 1 collation utile si besoin, avec protéines réparties.</div>
          <div><strong>Allergies / préférences :</strong> ${food.length?food.join(', '):'aucune restriction déclarée'}</div>
        </div>
      </div>
      <div class="portal-card">
        <h3>Micro-nutrition & substitutions</h3>
        <div class="nutrition-list">${micro.map(t=>`<div>${t}</div>`).join('')}${substitutions.map(([a,b])=>`<div><strong>${a} :</strong> ${b}</div>`).join('')}</div>
      </div>
    </div>
    <div class="panel" style="margin-top:16px"><h3>Bibliothèque nutrition rapide</h3><div class="summary-grid summary-grid-3">
      <div class="summary-card"><strong>Petit-déjeuner</strong><div class="small-muted">protéines + fruit + féculent digeste</div></div>
      <div class="summary-card"><strong>Repas principal</strong><div class="small-muted">source protéique + légumes + féculent modulé</div></div>
      <div class="summary-card"><strong>Collation</strong><div class="small-muted">simple, digeste, utile autour des séances</div></div>
    </div></div>
    <p class="small-muted" style="margin-top:14px">Lecture coach : point de départ à ajuster selon faim, digestion, énergie, récupération, croissance pour les plus jeunes, et contexte médical si besoin.</p></div>`;
}
function deleteProgram(code){
  const all=loadLocal('fafaPrograms',{}); delete all[code]; saveLocal('fafaPrograms',all);
  const biz=loadLocal('fafaBusiness',{}); delete biz[code]; saveLocal('fafaBusiness',biz);
  const tr=loadLocal('fafaTracking',{}); delete tr[code]; saveLocal('fafaTracking',tr);
  if(currentProgram && currentProgram.code===code) currentProgram=null;
  renderHome(); renderAthleteDirectory(); renderNutritionDirectory(); renderBusiness();
  if($('#athleteCode')?.value===code) $('#athleteOutput').innerHTML='';
}
function renderProgramMiniCard(p){
  return `<div class="summary-card action-card" data-code="${esc(p.code)}"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${esc(labelForGoal(p.mainGoal))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Ouvrir</button><button type="button" class="ghost tiny delete-program" data-code="${esc(p.code)}">Supprimer</button></div></div>`;
}
function bindDirectoryActions(root=document){
  root.querySelectorAll('.open-program').forEach(btn=>btn.onclick=()=>{const code=btn.dataset.code; goView('athlete'); $('#athleteCode').value=code; openAthletePortal();});
  root.querySelectorAll('.open-nutrition').forEach(btn=>btn.onclick=()=>{const code=btn.dataset.code; goView('nutrition'); $('#nutritionMode').value='program'; $('#nutritionCode').value=code; showNutrition();});
  root.querySelectorAll('.delete-program').forEach(btn=>btn.onclick=()=>{const code=btn.dataset.code; if(confirm(`Supprimer le programme ${code} ?`)) deleteProgram(code);});
}
function renderAthleteDirectory(){
  const programs=Object.values(loadLocal('fafaPrograms',{})).reverse();
  const host=$('#athleteDirectory'); if(!host) return;
  host.innerHTML = `<div class="panel"><h3>Répertoire programmes / adhérents</h3>${programs.length?`<div class="summary-grid summary-grid-3">${programs.map(renderProgramMiniCard).join('')}</div>`:'<div class="small-muted">Aucun programme enregistré pour le moment.</div>'}</div>`;
  bindDirectoryActions(host);
}
function renderNutritionDirectory(){
  const programs=Object.values(loadLocal('fafaPrograms',{})).reverse();
  const host=$('#nutritionDirectory'); if(!host) return;
  host.innerHTML=`<div class="panel"><h3>Nutrition liée aux programmes</h3>${programs.length?`<div class="summary-grid summary-grid-3">${programs.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${esc(labelForGoal(p.mainGoal))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Afficher</button></div></div>`).join('')}</div>`:'<div class="small-muted">Aucun programme enregistré.</div>'}</div>`;
  bindDirectoryActions(host);
}
function openAthletePortal(){
  const raw=($('#athleteCode').value||'');
  const resolved=resolveProgramByInput(raw);
  const code=resolved.code;
  if($('#athleteCode')) $('#athleteCode').value=code;
  const p=resolved.program;
  if(!p){
    const programs=Object.values(loadLocal('fafaPrograms',{}));
    const suggestions=programs.filter(x=>x.code.includes(code)||x.name.toLowerCase().includes(String(raw).toLowerCase())).slice(0,6);
    $('#athleteOutput').innerHTML='<div class="empty-state"><strong>Aucun programme trouvé pour ce code.</strong><div class="small-muted">Utilise le code exact enregistré ou clique directement dans le répertoire ci-dessus.</div>'+ (suggestions.length?`<div class="summary-grid summary-grid-3" style="margin-top:12px">${suggestions.map(renderProgramMiniCard).join('')}</div>`:'') + '</div>';
    bindDirectoryActions($('#athleteOutput'));
    return;
  }
  const biz=loadLocal('fafaBusiness',{})[p.code] || {status:p.bizStatus||'actif', amount:Number(p.bizAmount||0)};
  if(biz.status==='impaye'){$('#athleteOutput').innerHTML='<div class="panel">Accès bloqué : compte impayé. Remets le statut sur actif ou pause dans Business.</div>'; return;}
  const tracks=loadLocal('fafaTracking',{})[p.code]||[]; const last=tracks[tracks.length-1];
  const accessNote = biz.status==='pause' ? '<div class="panel"><strong>Compte en pause.</strong> Le planning reste visible, mais l’accompagnement est suspendu.</div>' : '';
  $('#athleteOutput').innerHTML = accessNote + `<div class="portal-hero"><div class="portal-card"><h3>Portail adhérent · ${esc(p.name)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span><span class="badge">${esc(labelForGoal(p.mainGoal))}</span><span class="badge">${esc(p.freq)}/semaine</span><span class="badge">${esc(p.duration)} min</span></div><p class="small-muted">Lecture simple : suis le planning, valide ton ressenti et garde une exécution propre.</p><div class="mini-actions"><button type="button" class="ghost" id="portalCopyCodeBtn">Copier le code</button><button type="button" class="ghost" id="portalCopyLinkBtn">Copier le lien</button><button type="button" class="ghost delete-program" data-code="${esc(p.code)}">Supprimer ce programme</button></div></div><div class="portal-card"><h3>Résumé adhérent</h3><div class="summary-grid summary-grid-3"><div class="summary-card"><strong>${esc(p.cycleWeeks||8)} semaines</strong><div class="small-muted">cycle</div></div><div class="summary-card"><strong>${last?.energy||'-'}/10</strong><div class="small-muted">dernière énergie</div></div><div class="summary-card"><strong>${p.nutrition?.kcal || '-'}</strong><div class="small-muted">kcal repère</div></div></div><div class="portal-lock">Statut : ${esc(biz.status)} · Montant enregistré : ${esc(biz.amount||0)} €</div></div></div>` + renderProgram(p,false) + `<div class="panel"><h3>Historique / ressenti</h3>${tracks.length?tracks.map(t=>`<div class="summary-card"><strong>${t.date}</strong><div>Poids : ${t.weight||'-'} kg · Énergie : ${t.energy||'-'}/10 · Compliance : ${t.compliance||'-'}%</div><div class="small-muted">${esc(t.note||'')}</div></div>`).join(''):'<p>Aucun suivi pour le moment.</p>'}</div>`;
  $('#portalCopyCodeBtn')?.addEventListener('click',e=>{navigator.clipboard?.writeText(p.code); setButtonState(e.currentTarget,'Code copié');});
  $('#portalCopyLinkBtn')?.addEventListener('click',e=>{navigator.clipboard?.writeText(`Code adhérent : ${p.code}\nLien adhérent : ${p.athleteLink}`); setButtonState(e.currentTarget,'Lien copié');});
  bindDirectoryActions($('#athleteOutput'));
}
function showNutrition(){
  const mode=$('#nutritionMode')?.value||'program';
  if(mode==='standalone'){$('#nutritionOutput').innerHTML=buildStandaloneNutrition(); return;}
  const resolved=resolveProgramByInput(($('#nutritionCode').value||''));
  if($('#nutritionCode')) $('#nutritionCode').value=resolved.code;
  $('#nutritionOutput').innerHTML = resolved.program ? buildNutritionView(resolved.program,false) : '<div class="panel">Aucun programme trouvé. Utilise le code exact ou clique sur un programme ci-dessus.</div>';
}
function renderBusiness(){
  const all=loadLocal('fafaBusiness',{}); const rows=Object.values(all);
  $('#businessOutput').innerHTML = rows.length ? `<div class="summary-grid summary-grid-3">${rows.map(r=>`<div class="summary-card"><strong>${esc(r.code)}</strong><div>Statut : ${esc(r.status)} · Montant : ${esc(r.amount)} €</div><div class="small-muted">${r.renewal?`Échéance : ${esc(r.renewal)}`:'Sans échéance'}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(r.code)}">Ouvrir</button><button type="button" class="ghost tiny delete-program" data-code="${esc(r.code)}">Supprimer</button></div></div>`).join('')}</div>` : '<div class="panel">Aucun statut enregistré.</div>';
  const due = rows.filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  $('#kpiDue').textContent = due;
  $('#kpiClients').textContent = rows.filter(r=>r.status==='actif').length;
  bindDirectoryActions($('#businessOutput'));
}
function renderHome(){
  const programs=loadLocal('fafaPrograms',{}); const business=loadLocal('fafaBusiness',{}); const tracks=loadLocal('fafaTracking',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length; $('#kpiLibrary').textContent=EXERCISES.length; renderBusiness();
  const activeClients = Object.values(business).filter(b=>b.status==='actif').length;
  const trackedCount = Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0);
  const recentPrograms = Object.values(programs).slice(-3).reverse();
  $('#homeActivity').innerHTML=`<div class="summary-grid summary-grid-3"><div class="summary-card"><strong>${activeClients}</strong><div class="small-muted">clients suivis</div></div><div class="summary-card"><strong>${trackedCount}</strong><div class="small-muted">check-ins enregistrés</div></div><div class="summary-card"><strong>${Object.keys(programs).length}</strong><div class="small-muted">programmes sauvegardés</div></div></div>${recentPrograms.length?`<div class="panel"><h3>Derniers programmes</h3><div class="summary-grid summary-grid-3">${recentPrograms.map(renderProgramMiniCard).join('')}</div></div>`:`<div class="empty-state"><strong>Aucun programme enregistré</strong><div class="small-muted">Crée ton premier programme depuis Coach Pro.</div></div>`}`;
  const clients = Object.values(programs).slice().reverse();
  $('#homeDirectory').innerHTML=`<div class="panel"><h3>Répertoire rapide</h3><div class="summary-grid summary-grid-3">${clients.length?clients.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${ageBandLabel(ageBand(p.age))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Portail</button><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Nutrition</button></div></div>`).join(''):'<div class="summary-card"><strong>Répertoire vide</strong><div class="small-muted">Il apparaîtra ici après enregistrement d’un programme.</div></div>'}</div></div>`;
  $('#kpiTracked') && ($('#kpiTracked').textContent = trackedCount);
  bindDirectoryActions($('#home'));
}
function quickBuild(){
  const dur=Number($('#quickDuration').value||45); const style=$('#quickStyle').value; const env=$('#quickEnv').value; const audience=$('#quickPublic').value;
  const audienceHints={kids:'ludique, très simple, peu technique et sécurisant',teens:'dynamique, varié, progressif et motivant',adults:'équilibré, utile, fluide et adaptable',seniors:'sécurisé, mobilité, posture, respiration et force utile',athletes:'plus dense, plus précis et plus exigeant'};
  let level = audience==='kids' ? 'beginner' : audience==='teens' ? 'intermediate' : audience==='athletes' ? 'advanced' : (audience==='seniors'?'beginner':'intermediate');
  let medical = audience==='seniors' ? ['hypertension'] : [];
  let basePool = pickExercisesForContext({level,env,equipment:PRESETS[env]||[],injuries:[],medical,style:style==='recovery'?'mobility':style,keywords:style==='mobility'||style==='recovery'?['mobil','stretch','rotation','respiration','amplitude']:[],count:24,excludeBases:[]});
  if(['mobility','recovery','health'].includes(style)) basePool = basePool.filter(ex=>mobilityFocused(ex));
  const pool=dedupeByBaseName(shuffle(basePool));
  const warmup=pool.slice(0,2), main=pool.slice(2,7), finisher=pool.slice(7,9);
  const blockTitle = style==='boxing' ? 'Rounds / ateliers' : style==='mobility' || style==='recovery' ? 'Bloc mobilité / stretching' : 'Bloc principal';
  $('#quickOutput').innerHTML = `<div class="quick-layout"><div class="panel panel-hero"><div class="section-mini-head"><h3>Séance rapide ${esc(quickStyleLabel(style))}</h3><p>${dur} minutes · ${esc(ENV_LABELS[env]||env)} · ${esc(audienceLabel(audience))}</p></div><div class="quick-block"><h4>Échauffement</h4><div class="quick-list">${warmup.map(ex=>quickCard(ex, prescriptionForQuick(style,'warmup',dur))).join('')}</div></div><div class="quick-block"><h4>${blockTitle}</h4><div class="quick-list">${main.map(ex=>quickCard(ex, prescriptionForQuick(style,'main',dur))).join('')}</div></div><div class="quick-block"><h4>Finisher / retour au calme</h4><div class="quick-list">${finisher.map(ex=>quickCard(ex, prescriptionForQuick(style,'finisher',dur))).join('')}</div></div></div><div class="quick-rail"><div class="panel"><h3>Logique de séance</h3><div class="small-muted">Public : ${audienceHints[audience]||'adaptable'}.</div><div class="small-muted">Style : ${esc(quickStyleLabel(style))}.</div><div class="small-muted">Volume cible : ${dur===20?'court et dense':dur===30?'efficace et simple':dur===45?'complet et polyvalent':'plus développé et progressif'}.</div></div><div class="panel"><h3>Lecture FR des formats</h3><div class="nutrition-list"><div><strong>HIIT :</strong> intervalles haute intensité</div><div><strong>AMRAP :</strong> maximum de tours dans le temps donné</div><div><strong>EMOM :</strong> chaque minute sur la minute</div><div><strong>Zone 2 :</strong> endurance fondamentale, effort confortable</div></div></div></div></div>`;
}
function setupV29Enhancements(){
  enhanceMultiSelects(['nutriRestrictions','nutriDislikes']);
  renderAthleteDirectory(); renderNutritionDirectory(); renderHome();
  document.querySelectorAll('[data-home-target]').forEach(card=>card.addEventListener('click',()=>{const t=card.dataset.homeTarget; if(t==='programs'||t==='clients'){goView('athlete');} else if(t==='library'){goView('library');} else if(t==='business'){goView('business');} else if(t==='progress'){goView('progress');}}));
}
window.addEventListener('DOMContentLoaded', setupV29Enhancements);
