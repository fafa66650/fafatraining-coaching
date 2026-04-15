
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function dedupeByBaseName(list){ const seen=new Set(); return list.filter(ex=>{ const base=(ex.name||'').split('—')[0].trim().toLowerCase(); if(seen.has(base)) return false; seen.add(base); return true; }); }

let EXERCISES = [];
let currentProgram = null;
let LOGO_DATA = null;

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
  try{
    const u=new URL(txt);
    const c=(u.searchParams.get('client')||'').trim().toUpperCase();
    if(c) return c;
  }catch(e){}
  const qs=txt.match(/[?&]client=([^&\s]+)/i);
  if(qs) return decodeURIComponent(qs[1]).trim().toUpperCase();
  const codeLine=txt.match(/code\s*adh[ée]rent\s*:?\s*([A-Z0-9_-]+)/i);
  if(codeLine) return codeLine[1].trim().toUpperCase();
  const plain=txt.match(/([A-Z]{2,}[A-Z0-9_-]{0,})/);
  if(plain) return plain[1].trim().toUpperCase();
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
async function preloadLogo(){
  try{
    const res = await fetch('assets/logo.jpeg');
    const blob = await res.blob();
    LOGO_DATA = await new Promise((resolve,reject)=>{
      const fr=new FileReader();
      fr.onload=()=>resolve(fr.result);
      fr.onerror=reject;
      fr.readAsDataURL(blob);
    });
  }catch(e){ LOGO_DATA = null; }
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
  addOptions('effortFormats', [['tempo','Tempo / contrôle'],['clusters','Clusters (mini-blocs avec micro-repos)'],['ladder','Ladder (montée / descente progressive)'],['density','Density training (densité de travail)'],['fartlek','Fartlek (jeu d’allures)'],['zone2','Zone 2 (endurance fondamentale)']]);
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
  const link=currentProgram.athleteLink;
  navigator.clipboard?.writeText(link).then(()=>{
    notify('coachOutput', `Lien adhérent copié. Code associé : ${currentProgram.code}.`, 'ok');
  }).catch(()=>window.prompt('Copie ce lien :', link));
}

function exportPdf(){
  const p=currentProgram;
  if(!p){ alert('Génère d’abord un programme.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;
  const ensure = (needed=8)=>{ if(y + needed > 282){ doc.addPage(); y = 18; drawHeader(false); } };
  const write = (txt,size=10,bold=false,color=[20,26,34],indent=0,lh=5)=>{
    doc.setFont('helvetica', bold?'bold':'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(txt), pageW - margin*2 - indent);
    lines.forEach(line=>{ ensure(lh+2); doc.text(line, margin+indent, y); y += lh; });
  };
  const pill = (txt,x,w)=>{ doc.setFillColor(239,245,236); doc.roundedRect(x,y,w,8,4,4,'F'); doc.setTextColor(14,25,18); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(txt,x+3, y+5.2); };
  const drawHeader = (first=true)=>{
    doc.setFillColor(10,14,20); doc.roundedRect(10,10,190,26,8,8,'F');
    if(first && LOGO_DATA){ try{ doc.addImage(LOGO_DATA,'JPEG',14,13,16,16); }catch(e){} }
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.text('FAFATRAINING', first && LOGO_DATA ? 34 : 16, 20);
    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(224,232,236); doc.text('Programme coaching personnalisé', first && LOGO_DATA ? 34 : 16, 27);
    y = 44;
  };
  drawHeader(true);
  write(`${p.name} · code ${p.code}`, 15, true);
  y += 1;
  const goal = labelForGoal(p.mainGoal);
  pill(goal, margin, 58); pill(`${p.freq}/semaine`, 76, 34); pill(`${p.duration} min`, 114, 30); pill(labelForEnv(p.env), 148, 46);
  y += 14;
  write('Profil', 13, true, [89,155,62]);
  write(`${ageBandLabel(ageBand(p.age))} · ${p.sex==='female'?'Femme':'Homme'} · ${p.height} cm · ${p.weight} kg · niveau ${labelForLevel(p.level)}`);
  if(p.bmi) write(`IMC ${p.bmi.value} : ${p.bmi.label}. ${p.bmi.risk}`);
  if(p.restrictions) write(`Contraintes prises en compte : ${p.restrictions}`);
  y += 2;
  write('Objectifs et cadre de travail', 13, true, [89,155,62]);
  write(`Objectif principal : ${goal}`);
  if((p.secondGoals||[]).length) write(`Objectifs secondaires : ${p.secondGoals.map(labelForGoal).join(', ')}`);
  write(`Contexte : ${labelForEnv(p.env)} · cycle : ${((p.cycleGoals||[]).map(labelForCycle).join(', ')) || 'automatique'}`);
  y += 2;
  write('Planning de la semaine', 13, true, [89,155,62]);
  buildWeekSchedule(p.freq).forEach(w=>write(`${w.day} : ${w.note}`));
  y += 2;
  write('Séances détaillées', 13, true, [89,155,62]);
  p.days.forEach(day=>{
    ensure(12); y += 1;
    doc.setFillColor(245,248,250); doc.roundedRect(margin, y-1, pageW-margin*2, 9, 4, 4, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(18,24,32); doc.text(day.title, margin+3, y+5);
    y += 12;
    write(`Répartition : ${day.patternSummary}`, 9, false, [80,92,106]);
    day.items.forEach(ex=>{
      write(ex.name, 10, true);
      write(`${ex.prescription.series} · ${ex.prescription.reps} · repos ${ex.prescription.rest}`);
      write(`Consigne : ${ex.cue}`, 9, false, [65,75,88], 2);
      write(`Version plus facile : ${ex.substitute || 'adapter selon le matériel'}`, 9, false, [65,75,88], 2);
      write(`Repère coach : ${ex.coachNote || 'exécution propre et progressive'}`, 9, false, [65,75,88], 2);
      y += 1;
    });
  });
  if(p.nutrition){
    y += 2;
    write('Repères nutrition', 13, true, [89,155,62]);
    write(`${p.nutrition.kcal} kcal / jour · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`);
    write('Structure simple : petit-déjeuner protéiné, déjeuner complet, dîner digeste, collation utile autour des séances si besoin.');
  }
  y += 2;
  write('Glossaire simple', 13, true, [89,155,62]);
  write('HIIT = intervalles haute intensité. EMOM = chaque minute sur la minute. AMRAP = maximum de tours dans le temps donné.');
  write('Série = nombre de blocs. Répétitions = nombre de mouvements. Repos = temps de récupération entre deux efforts.');
  doc.save(`${p.code}_FAFATRAINING.pdf`);
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
  preloadLogo();
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


/* ===== V29.2 final fixes ===== */
function positionMultiMenu(host, menu){
  const rect = host.getBoundingClientRect();
  const maxWidth = Math.min(520, window.innerWidth - 24);
  const width = Math.min(Math.max(rect.width, 320), maxWidth);
  let left = rect.left;
  if(left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  menu.style.position='fixed';
  menu.style.left=`${Math.max(12,left)}px`;
  menu.style.top=`${Math.min(window.innerHeight-20, rect.bottom + 8)}px`;
  menu.style.width=`${width}px`;
  menu.style.maxWidth=`${maxWidth}px`;
  menu.style.maxHeight=`${Math.min(320, Math.max(180, window.innerHeight - rect.bottom - 24))}px`;
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
        row.querySelector('input').addEventListener('change', e=>{ opt.selected=e.target.checked; refresh(); select.dispatchEvent(new Event('change',{bubbles:true})); });
        optionsWrap.appendChild(row);
      });
    };
    const refresh = ()=>{
      const chosen = Array.from(select.selectedOptions);
      value.textContent = chosen.length ? `${chosen.length} sélection${chosen.length>1?'s':''}` : 'Aucune sélection';
      tags.innerHTML = chosen.length ? chosen.map(o=>`<span class="tag">${o.textContent}</span>`).join('') : '<span class="tag muted">Aucune sélection</span>';
      trigger.setAttribute('aria-expanded', String(!menu.hasAttribute('hidden')));
      host.classList.toggle('open', !menu.hasAttribute('hidden'));
      paint();
      if(!menu.hasAttribute('hidden')) positionMultiMenu(host, menu);
    };
    const closeAll = ()=>{ document.querySelectorAll('.multi-select-menu').forEach(m=>m.setAttribute('hidden','')); document.querySelectorAll('.multi-select').forEach(h=>h.classList.remove('open')); document.querySelectorAll('.multi-select-trigger').forEach(t=>t.setAttribute('aria-expanded','false')); };
    trigger.addEventListener('click', e=>{
      e.preventDefault();
      const isOpen = !menu.hasAttribute('hidden');
      closeAll();
      if(!isOpen){ menu.removeAttribute('hidden'); trigger.setAttribute('aria-expanded','true'); host.classList.add('open'); positionMultiMenu(host, menu); requestAnimationFrame(()=>search.focus()); }
    });
    search.addEventListener('input', paint);
    document.addEventListener('click', e=>{ if(!host.contains(e.target) && !menu.contains(e.target)) { menu.setAttribute('hidden',''); trigger.setAttribute('aria-expanded','false'); host.classList.remove('open'); } });
    window.addEventListener('scroll', ()=>{ if(!menu.hasAttribute('hidden')) positionMultiMenu(host, menu); }, true);
    window.addEventListener('resize', ()=>{ if(!menu.hasAttribute('hidden')) positionMultiMenu(host, menu); });
    refresh();
  });
}
function buildNutritionView(p, standalone=false){
  const n=p.nutrition; if(!n) return '<div class="panel"><p>Données insuffisantes pour afficher la nutrition.</p></div>';
  const food = standalone ? optionLabels('nutriRestrictions').concat(optionLabels('nutriDislikes')) : optionLabels('foodKnown');
  const bandText = standalone ? ({adult:'Adulte',child:'Enfant (6-10 ans)',teen:'Adolescent (11-17 ans)',senior:'Senior (65 ans et +)'})[$('#nutriAudience')?.value||'adult'] : ageBandLabel(ageBand(p.age));
  const goalText = standalone ? ({health:'Santé / équilibre',fat_loss:'Perte de poids',muscle_gain:'Prise de muscle',performance:'Performance / énergie',recomposition:'Recomposition corporelle'})[$('#nutriGoal')?.value||'health'] : labelForGoal(p.mainGoal);
  const mealIdeas = [
    ['Petit-déjeuner','protéines + fruit + féculent digeste'],
    ['Déjeuner','source protéique + légumes + féculent modulé'],
    ['Collation','simple, digeste, utile autour des séances'],
    ['Dîner','protéines + légumes + portion glucidique ajustée']
  ];
  const substitutions=[
    'Sans œufs : yaourt grec, skyr, tofu soyeux, blanc de poulet.',
    'Légumes peu aimés : soupes lisses, purées, crudités fines, sauces mixées.',
    'Sans laitages : boissons végétales enrichies, tofu, yaourts sans lactose.',
    'Sans poisson : volaille, œufs, tofu, légumineuses + céréales.',
    'Collation rapide : fruit + yaourt, compote + skyr, tartine + jambon, smoothie maison.'
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
          <div><strong>Objectif nutrition :</strong> ${esc(goalText)}</div>
          <div><strong>Hydratation :</strong> 30 à 35 ml/kg/jour de base, puis ajustement selon chaleur et entraînement.</div>
          <div><strong>Allergies / préférences :</strong> ${food.length?food.join(', '):'aucune restriction déclarée'}</div>
          <div><strong>Repère coach :</strong> point de départ à ajuster selon faim, digestion, énergie, récupération et évolution du poids.</div>
        </div>
      </div>
      <div class="portal-card">
        <h3>Micro-nutrition & substitutions</h3>
        <div class="nutrition-list">
          <div>Calcium et vitamine D à surveiller chez l’enfant, l’ado et le senior.</div>
          <div>Magnésium, potassium et sodium utiles pour les profils qui transpirent beaucoup.</div>
          <div>Oméga-3 via poissons gras, noix ou alternatives végétales adaptées.</div>
          <div>Fibres et couleur dans l’assiette pour la digestion et la micronutrition.</div>
          ${substitutions.map(s=>`<div>${s}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel" style="margin-top:14px">
      <h3>Exemple de structure repas</h3>
      <div class="summary-grid summary-grid-3">
        ${mealIdeas.map(m=>`<div class="summary-card"><strong>${m[0]}</strong><div class="small-muted">${m[1]}</div></div>`).join('')}
      </div>
    </div>
  </div>`;
}
function renderHome(){
  const programs=loadLocal('fafaPrograms',{}); const business=loadLocal('fafaBusiness',{}); const tracks=loadLocal('fafaTracking',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length; $('#kpiLibrary').textContent=EXERCISES.length; renderBusiness();
  const activeClients = Object.values(business).filter(b=>b.status==='actif').length;
  const trackedCount = Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0);
  const recentPrograms = Object.values(programs).slice(-3).reverse();
  $('#homeActivity').innerHTML=`<div class="summary-grid summary-grid-3"><div class="summary-card"><strong>${activeClients}</strong><div class="small-muted">clients suivis</div></div><div class="summary-card"><strong>${trackedCount}</strong><div class="small-muted">check-ins enregistrés</div></div><div class="summary-card"><strong>${Object.keys(programs).length}</strong><div class="small-muted">programmes sauvegardés</div></div></div>${recentPrograms.length?`<div class="panel"><h3>Derniers programmes</h3><div class="summary-grid summary-grid-3">${recentPrograms.map(renderProgramMiniCard).join('')}</div></div>`:`<div class="empty-state"><strong>Aucun programme enregistré</strong><div class="small-muted">Crée ton premier programme depuis Coach Pro.</div></div>`}`;
  const clients = Object.values(programs).slice().reverse();
  $('#homeDirectory').innerHTML=`<div class="panel"><h3>Répertoire rapide</h3><div class="summary-grid summary-grid-3">${clients.length?clients.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${ageBandLabel(ageBand(p.age))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Portail</button><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Nutrition</button><button type="button" class="ghost tiny delete-program" data-code="${esc(p.code)}">Supprimer</button></div></div>`).join(''):'<div class="summary-card"><strong>Répertoire vide</strong><div class="small-muted">Il apparaîtra ici après enregistrement d’un programme.</div></div>'}</div></div>`;
  const modules=document.querySelector('#home .panel.panel-hero:not(.home-showcase) .feature-grid');
  if(modules){ modules.innerHTML=`<div class="feature-card"><strong>Coach Pro</strong><span>profil, objectifs, matériel et logique automatique</span></div><div class="feature-card"><strong>Portail adhérent</strong><span>ouverture simple, code, suivi et suppression rapide</span></div><div class="feature-card"><strong>Nutrition</strong><span>mode programme ou nutrition seule, avec exemples de repas</span></div><div class="feature-card"><strong>PDF premium</strong><span>export lisible avec structure, substitutions et glossaire</span></div>`; }
  $('#kpiTracked') && ($('#kpiTracked').textContent = trackedCount);
  bindDirectoryActions($('#home'));
}
window.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{
    renderHome();
    document.querySelectorAll('#quickStyle option,#libStyle option,#coachingTypes option,#effortFormats option').forEach(opt=>{
      if(opt.value==='hiit' && !opt.textContent.includes('(')) opt.textContent='HIIT (intervalles haute intensité)';
      if(opt.value==='amrap') opt.textContent='AMRAP (maximum de tours)';
      if(opt.value==='emom') opt.textContent='EMOM (chaque minute sur la minute)';
      if(opt.value==='zone2') opt.textContent='Zone 2 (endurance fondamentale)';
    });
  }, 50);
});


/* ===== V29.2 usability + generation overhaul ===== */
function cleanText(v){return String(v||'').replace(/\s+/g,' ').trim();}
function baseName(ex){return cleanText((ex?.name||'').split('—')[0]).toLowerCase();}
function exerciseText(ex){return cleanText([ex.name, ex.category, ex.subcategory, ex.muscles, ex.cue, ...(ex.tags||[]), ...(ex.focus||[])].join(' ')).toLowerCase();}
function frStyleLabel(v){
  const map={
    hiit:'HIIT (intervalles haute intensité)', emom:'EMOM (chaque minute sur la minute)', amrap:'AMRAP (maximum de tours)',
    zone2:'Zone 2 (endurance fondamentale)', boxing:'Boxe', hyrox:'Hyrox (course + ateliers fonctionnels)',
    mobility:'Mobilité / stretching', strength:'Force', conditioning:'Condition physique', circuit:'Circuit training',
    trail:'Trail / course nature', core:'Gainage / ceinture abdominale', health:'Santé / remise en forme', recovery:'Récupération active'
  };
  return map[v]||quickStyleLabel(v)||v;
}
function goalFocusMap(goal,title=''){
  const t=(title||'').toLowerCase();
  if(goal==='strength') return ['squat','hinge','push','pull','core'];
  if(goal==='muscle_gain' || goal==='recomposition'){
    if(t.includes('pouss')) return ['push','chest','shoulders','triceps','core'];
    if(t.includes('tirage')) return ['pull','back','biceps','rear','core'];
    if(t.includes('lower')||t.includes('bas')) return ['squat','hinge','glutes','quads','core'];
    return ['squat','push','pull','hinge','core'];
  }
  if(goal==='fat_loss' || goal==='conditioning') return ['cardio','squat','push','pull','core'];
  if(goal==='boxing') return ['boxing','conditioning','rotation','legs','core'];
  if(goal==='hyrox') return ['carry','sled','row','ski','fullbody'];
  if(goal==='trail' || goal==='endurance') return ['hinge','single_leg','cardio','calves','core'];
  if(goal==='mobility') return ['mobility','rotation','stretch','breathing','stability'];
  if(goal==='health' || goal==='return_to_play') return ['mobility','stability','squat','push','pull'];
  return ['squat','push','pull','hinge','core'];
}
function movementTag(ex){
  const txt=exerciseText(ex);
  const tests=[
    ['boxing',/(boxe|boxing|shadow|jab|cross|hook|uppercut|bag|pads|slip|footwork)/],
    ['sled',/(sled|traîneau)/],['carry',/(carry|farmer|sandbag carry|marches lestées)/],['row',/(rameur|rower|tirage horizontal|row )/],['ski',/(skierg|ski erg)/],
    ['mobility',/(mobil|stretch|souplesse|amplitude)/],['rotation',/(rotation|anti rotation|twist|pallof)/],['breathing',/(respiration|breath)/],['stability',/(stabilit|équilibre|balance)/],
    ['squat',/(squat|leg press|split squat|fente|lunge|step up|wall sit)/],['hinge',/(deadlift|soulevé|hip thrust|pont fessier|hinge|rdl|good morning)/],
    ['push',/(développé|bench|pompes|push press|presse poitrine|dips|overhead press)/],['pull',/(traction|tirage|row|lat pulldown|face pull|curl)/],
    ['chest',/(pector|bench|chest|pompes)/],['back',/(dos|rowing|tirage|traction|pull)/],['shoulders',/(épaule|shoulder|lateral raise|military press)/],['triceps',/(triceps|dips|extension triceps)/],['biceps',/(biceps|curl)/],
    ['quads',/(quadriceps|leg extension|squat|fente)/],['glutes',/(fess|hip thrust|glute|pont)/],['hamstrings',/(ischio|hamstring|leg curl|rdl)/],['calves',/(mollet|calf)/],
    ['single_leg',/(split squat|fente|single leg|unilatéral|pistol|step up)/],['core',/(gainage|core|abdos|hollow|dead bug|plank)/],
    ['cardio',/(burpee|bike|course|run|rower|rameur|air bike|jumping|mountain climber|cardio)/],['fullbody',/(full body|thruster|burpee|wall ball|clean|snatch)/]
  ];
  for(const [tag,re] of tests){ if(re.test(txt)) return tag; }
  return (ex.category||'général').toLowerCase();
}
function preferredEquipmentOrder(form){
  const eq=form.equipment||[];
  const gymHeavy=['barbell','rack','machine','cable','dumbbell','bench','landmine','trap_bar'];
  const home=['dumbbell','kettlebell','band','trx','bodyweight','chair','backpack'];
  const boxing=['heavy_bag','pads','gloves','rope','ladder','med_ball','bodyweight'];
  if(form.env==='gym') return gymHeavy.filter(x=>eq.includes(x)).concat(eq.filter(x=>!gymHeavy.includes(x)));
  if(form.env==='boxing_gym') return boxing.filter(x=>eq.includes(x)).concat(eq.filter(x=>!boxing.includes(x)));
  if(['home','bodyweight_only','outdoor'].includes(form.env)) return home.filter(x=>eq.includes(x)).concat(eq.filter(x=>!home.includes(x)));
  return eq;
}
function chooseDiverseExercises({level='intermediate', env='', equipment=[], injuries=[], medical=[], style='', goals=[], count=5, excludeBases=[]}){
  const filtered = EXERCISES.filter(ex=>exerciseMatches(ex, level, env, equipment, injuries, medical));
  const eqOrder = equipment.length ? equipment : PRESETS[env]||[];
  const scored = filtered.map(ex=>{
    const txt=exerciseText(ex); const base=baseName(ex); const tag=movementTag(ex);
    let score=0;
    if(excludeBases.includes(base)) score -= 100;
    if(style && styleMatches(ex, style)) score += 35;
    if(goals.some(g=>tag===g)) score += 28;
    if(goals.some(g=>txt.includes(g.replace('_',' ')))) score += 18;
    if(eqOrder.length && (ex.equipment||[]).some(e=>eqOrder.includes(e))) score += 16;
    if(env && (ex.environments||[]).includes(env)) score += 10;
    if(level==='beginner' && /(guidée|tempo|pause|simple|assisted|assistée|régression)/i.test(ex.name+' '+(ex.easy||''))) score += 8;
    if(level==='advanced' && /(barbell|lourd|performance|explosif|complexe|advanced)/i.test(txt)) score += 8;
    if(style==='mobility' && mobilityFocused(ex)) score += 40;
    if(style==='strength' && /(barbell|machine|cable|dumbbell|trap bar|rack|bench)/i.test(txt)) score += 12;
    return {ex,score,tag,base};
  }).sort((a,b)=>b.score-a.score);
  const picks=[]; const usedTags=new Set(); const usedBases=new Set(excludeBases);
  for(const target of goals){
    const hit=scored.find(s=>!usedBases.has(s.base) && !picks.includes(s.ex) && (s.tag===target || exerciseText(s.ex).includes(target.replace('_',' '))));
    if(hit){ picks.push(hit.ex); usedBases.add(hit.base); usedTags.add(hit.tag); }
  }
  for(const s of scored){
    if(picks.length>=count) break;
    if(usedBases.has(s.base)) continue;
    if(usedTags.has(s.tag) && picks.length < count-1) continue;
    picks.push(s.ex); usedBases.add(s.base); usedTags.add(s.tag);
  }
  return picks.slice(0,count);
}
function loadGuidance(goal, env, idx){
  if(goal==='strength') return idx<2?'Charge lourde maîtrisée (RPE 7 à 9 / 10)':'Charge modérée à lourde (RPE 7 à 8 / 10)';
  if(goal==='muscle_gain' || goal==='recomposition') return idx<2?'Charge modérée à lourde (2 à 3 reps en réserve)':'Charge modérée, sensation musculaire nette';
  if(goal==='fat_loss' || goal==='conditioning') return 'Charge légère à modérée, rythme propre et continu';
  if(goal==='boxing') return 'Vitesse, précision et appuis avant la puissance';
  if(goal==='hyrox' || goal==='trail' || goal==='endurance') return 'Allure durable, respiration contrôlée, technique stable';
  if(goal==='mobility' || goal==='health' || goal==='return_to_play') return 'Amplitude confortable, sans douleur, respiration fluide';
  return env==='gym' ? 'Charge modérée adaptée au niveau' : 'Intensité adaptée au niveau';
}
formatPrescription = function(goal, title, idx){
  const lower=(title||'').toLowerCase();
  if(goal==='strength') return {series: idx<2?'4 à 5 séries':'3 à 4 séries', reps: idx<2?'4 à 6 reps':'6 à 8 reps', rest: idx<2?'120 à 180 sec':'75 à 120 sec'};
  if(goal==='muscle_gain' || goal==='recomposition') return {series:'3 à 4 séries', reps: idx<2?'6 à 10 reps':'10 à 15 reps', rest:'60 à 90 sec'};
  if(goal==='fat_loss' || goal==='conditioning') return {series:'3 à 4 tours', reps: idx<3?'8 à 15 reps':'30 à 45 sec', rest:'20 à 40 sec'};
  if(goal==='boxing') return {series:'4 à 8 rounds', reps: lower.includes('technique')?'2 à 3 min / round':'20 à 45 sec / drill', rest:'30 à 60 sec'};
  if(goal==='hyrox') return {series:'3 à 5 blocs', reps:'45 à 90 sec / atelier', rest:'45 à 75 sec'};
  if(goal==='trail' || goal==='endurance') return {series:'3 à 5 blocs', reps:'40 sec à 4 min selon l’exercice', rest:'45 à 90 sec'};
  if(goal==='mobility' || goal==='health' || goal==='return_to_play' || lower.includes('mobilité') || lower.includes('respiration')) return {series:'2 à 3 séries', reps:'6 à 10 reps / 30 à 45 sec', rest:'15 à 30 sec'};
  return {series:'3 séries', reps:'8 à 12 reps', rest:'60 sec'};
};
buildProgramDays = function(form){
  const titles=buildDayTitles(form.freq, form.mainGoal, (form.cycleGoals||[])[0] || '');
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const usedBases=[];
  return titles.map((title)=>{
    const lower=title.toLowerCase();
    let style=form.mainGoal || 'conditioning';
    if(/mobilité|flow|respiration|stabilité/.test(lower)) style='mobility';
    if(/technique|rounds/.test(lower)) style='boxing';
    if(/conditioning|engine|zone 2|seuil|threshold|simulation/.test(lower)) style=(form.mainGoal==='hyrox'||lower.includes('hyrox'))?'hyrox':(form.mainGoal==='trail'?'trail':'conditioning');
    if(/poussée/.test(lower)) style=form.mainGoal==='strength'?'strength':'muscle_gain';
    if(/tirage/.test(lower)) style=form.mainGoal==='strength'?'strength':'muscle_gain';
    const goals=goalFocusMap(form.mainGoal, title);
    const chosen=chooseDiverseExercises({level, env:form.env, equipment:preferredEquipmentOrder(form), injuries, medical, style, goals, count:5, excludeBases:usedBases});
    usedBases.push(...chosen.map(baseName));
    const items=chosen.map((ex,idx)=>({
      name: ex.name,
      category: ex.category,
      muscles: ex.muscles,
      cue: ex.cue,
      easy: ex.easy,
      hard: ex.hard,
      substitute: ex.easy || 'Version plus simple / assistance / charge réduite',
      progression: ex.hard || 'Version plus exigeante / charge supérieure',
      prescription: formatPrescription(form.mainGoal, title, idx),
      load: loadGuidance(form.mainGoal, form.env, idx),
      coachNote: style==='strength' ? 'Cherche une technique stable et garde 1 à 3 répétitions en réserve.' : style==='conditioning' ? 'Qualité de mouvement avant vitesse, respiration régulière.' : style==='boxing' ? 'Précision, appuis et relâchement avant puissance.' : style==='mobility' ? 'Bouge lentement, sans douleur, avec respiration calme.' : 'Exécution propre et progressive.'
    }));
    return {title, items, patternSummary: goals.join(' · '), style};
  });
};
renderProgram = function(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const goalFr=labelForGoal(p.mainGoal);
  const head = `<div class="panel panel-hero"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Accès adhérent prêt</span>`:''}</div>
    <div class="meta">
      <span class="badge">${esc(goalFr)}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(labelForEnv(p.env))}</span>
      <span class="badge">${esc(p.freq)} séance(s) / semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>Lecture santé :</strong> IMC ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}</p>`:''}
    ${p.restrictions?`<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictions)}</p>`:''}
    <div class="summary-grid summary-grid-3 compact-summary">
      <div class="summary-card"><strong>${esc(p.freq)}</strong><div class="small-muted">séances / semaine</div></div>
      <div class="summary-card"><strong>${esc(p.duration)} min</strong><div class="small-muted">durée cible</div></div>
      <div class="summary-card"><strong>${esc((p.cycleGoals||[]).map(labelForCycle).join(', ') || 'Cycle automatique')}</strong><div class="small-muted">orientation</div></div>
    </div>
  </div>`;
  const sched = `<article class="athlete-week"><h3>Semaine type</h3><div class="week-days compact">${
    week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><small>${w.note}</small></div>`).join('')
  }</div></article>`;
  const days = p.days.map(day=>`<article class="panel"><div class="session-top"><h3>${esc(day.title)}</h3><span class="badge">${esc(frStyleLabel(day.style||'conditioning'))}</span></div><p class="small-muted">Répartition utile : ${esc(day.patternSummary)}</p>${
    day.items.map(ex=>`<div class="summary-card session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles||'')}</div>
    <div class="quick-prescription"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.reps)}</span><span>Repos ${esc(ex.prescription.rest)}</span></div>
    <div class="small-muted"><strong>Charge / intensité :</strong> ${esc(ex.load||'Adaptée au niveau')}</div>
    <div class="small-muted"><strong>Consigne :</strong> ${esc(ex.cue||'')}</div>
    <div class="small-muted"><strong>Version plus facile :</strong> ${esc(ex.substitute||'Adapter selon le matériel')}</div>
    <div class="small-muted"><strong>Version plus difficile :</strong> ${esc(ex.progression||'Ajouter charge, amplitude ou complexité')}</div>
    <div class="small-muted"><strong>Note coach :</strong> ${esc(ex.coachNote||'')}</div></div>`).join('')
  }</article>`).join('');
  const actions = coach ? `<div class="actions"><button id="coachSaveAgain">Enregistrer</button><button class="ghost" id="coachCopyLinkAgain">Copier le lien adhérent</button><button class="ghost" id="coachExportPdfAgain">Exporter PDF premium</button></div>` : '';
  return head + sched + actions + `<div class="stack">${days}</div>`;
};
quickBuild = function(){
  const dur=Number($('#quickDuration').value||45), style=$('#quickStyle').value, env=$('#quickEnv').value, audience=$('#quickPublic').value;
  const audienceHints={kids:'ludique, très simple, peu technique et sécurisant',teens:'dynamique, varié, progressif et motivant',adults:'équilibré, utile, fluide et adaptable',seniors:'sécurisé, mobilité, posture, respiration et force utile',athletes:'plus dense, plus précis et plus exigeant'};
  let level = audience==='kids' ? 'beginner' : audience==='teens' ? 'intermediate' : audience==='athletes' ? 'advanced' : (audience==='seniors'?'beginner':'intermediate');
  const medical = audience==='seniors' ? ['hypertension'] : [];
  const styleMap={mobility:['mobility','rotation','stretch','breathing','stability'],recovery:['mobility','breathing','stretch','stability','core'],boxing:['boxing','legs','core','conditioning','rotation'],hiit:['cardio','push','pull','squat','core'],circuit:['squat','push','pull','hinge','core'],strength:['squat','hinge','push','pull','core'],conditioning:['cardio','squat','push','pull','core'],hyrox:['sled','carry','row','ski','fullbody'],trail:['single_leg','hinge','cardio','calves','core'],core:['core','rotation','stability','breathing','mobility'],health:['mobility','stability','squat','push','pull']};
  const pool = chooseDiverseExercises({level, env, equipment:PRESETS[env]||[], injuries:[], medical, style:style==='recovery'?'mobility':style, goals:styleMap[style]||['squat','push','pull','hinge','core'], count:10, excludeBases:[]});
  const warmup=pool.slice(0,2), main=pool.slice(2,7), finisher=pool.slice(7,10);
  const blockTitle = style==='boxing' ? 'Bloc technique / rounds' : ['mobility','recovery'].includes(style) ? 'Bloc mobilité / stretching' : 'Bloc principal';
  $('#quickOutput').innerHTML = `<div class="quick-layout"><div class="panel panel-hero"><div class="section-mini-head"><h3>Séance rapide ${esc(frStyleLabel(style))}</h3><p>${dur} minutes · ${esc(ENV_LABELS[env]||env)} · ${esc(audienceLabel(audience))}</p></div><div class="quick-block"><h4>Échauffement</h4><div class="quick-list">${warmup.map(ex=>quickCard(ex, prescriptionForQuick(style,'warmup',dur))).join('')}</div></div><div class="quick-block"><h4>${blockTitle}</h4><div class="quick-list">${main.map(ex=>quickCard(ex, prescriptionForQuick(style,'main',dur))).join('')}</div></div><div class="quick-block"><h4>Retour au calme</h4><div class="quick-list">${finisher.map(ex=>quickCard(ex, prescriptionForQuick(style,'finisher',dur))).join('')}</div></div></div><div class="quick-rail"><div class="panel"><h3>Logique de séance</h3><div class="small-muted">Public : ${audienceHints[audience]||'adaptable'}.</div><div class="small-muted">Style : ${esc(frStyleLabel(style))}.</div><div class="small-muted">Volume cible : ${dur<=20?'court et dense':dur<=30?'efficace et simple':dur<=45?'complet et polyvalent':'plus développé et progressif'}.</div></div><div class="panel"><h3>Glossaire FR</h3><div class="nutrition-list"><div><strong>HIIT :</strong> intervalles haute intensité</div><div><strong>AMRAP :</strong> maximum de tours dans le temps donné</div><div><strong>EMOM :</strong> chaque minute sur la minute</div><div><strong>Zone 2 :</strong> cardio d’endurance facile</div></div></div></div></div>`;
};
generateAthleteLink = function(program){
  return `${location.origin}${location.pathname}?view=athlete&client=${encodeURIComponent(program.code)}`;
};
function parseAndOpenSharedLink(){
  const u=new URL(location.href);
  const client=u.searchParams.get('client');
  const view=u.searchParams.get('view');
  if(client){
    if($('#athleteCode')) $('#athleteCode').value = client.toUpperCase();
    goView(view==='nutrition' ? 'nutrition' : 'athlete');
    setTimeout(()=>{ view==='nutrition' ? renderNutrition() : openAthletePortal(); }, 80);
  }
}
function mealExamplesFor(goal,audience){
  const adultCut=[['Petit-déjeuner','Skyr ou yaourt grec, flocons d’avoine, fruits rouges'],['Déjeuner','Poulet ou tofu, riz, légumes cuits'],['Collation','Fruit + fromage blanc / skyr'],['Dîner','Poisson ou œufs, pommes de terre, légumes']];
  const adultGain=[['Petit-déjeuner','Omelette ou skyr, pain complet, banane'],['Déjeuner','Viande maigre ou tofu, pâtes/riz, légumes'],['Collation','Shake ou yaourt + fruit + oléagineux'],['Dîner','Saumon / poulet, féculent, légumes']];
  const teen=[['Petit-déjeuner','Laitage + tartines + fruit'],['Déjeuner','Repas complet avec protéine, féculent, légumes'],['Collation','Compote + yaourt / sandwich simple'],['Dîner','Repas familial équilibré, sans restriction agressive']];
  const child=[['Petit-déjeuner','Laitage, pain ou céréales simples, fruit'],['Déjeuner','Protéine + féculent + légumes en texture acceptée'],['Goûter','Fruit, yaourt, tartine'],['Dîner','Repas simple, digestible, rassasiant']];
  const senior=[['Petit-déjeuner','Boisson, laitage, pain, fruit'],['Déjeuner','Protéine digeste, féculent, légumes'],['Collation','Yaourt, compote, fruit, poignée d’oléagineux'],['Dîner','Repas simple avec protéines réparties']];
  if(audience==='child') return child; if(audience==='teen') return teen; if(audience==='senior') return senior;
  return goal==='muscle_gain' || goal==='performance' ? adultGain : adultCut;
}
buildNutritionView = function(p, standalone=false){
  const n=p.nutrition; if(!n) return '<div class="panel"><p>Données insuffisantes pour afficher la nutrition.</p></div>';
  const food = standalone ? optionLabels('nutriRestrictions').concat(optionLabels('nutriDislikes')) : optionLabels('foodKnown');
  const audience = standalone ? ($('#nutriAudience')?.value||'adult') : (ageBand(p.age)==='enfant'?'child':ageBand(p.age)==='ado'?'teen':ageBand(p.age)==='senior'?'senior':'adult');
  const bandText = {adult:'Adulte',child:'Enfant (6 à 10 ans)',teen:'Adolescent (11 à 17 ans)',senior:'Senior (60 ans et +)'}[audience] || 'Adulte';
  const goalKey = standalone ? ($('#nutriGoal')?.value||'health') : p.mainGoal;
  const goalText = standalone ? ({health:'Santé / équilibre',fat_loss:'Perte de poids',muscle_gain:'Prise de muscle',performance:'Performance / énergie',recomposition:'Recomposition corporelle'})[goalKey] : labelForGoal(goalKey);
  const meals=mealExamplesFor(goalKey,audience);
  const substitutions=['Sans œufs : skyr, tofu soyeux, blancs de volaille, poisson.','Légumes peu aimés : soupes, purées, sauces mixées, crudités fines.','Sans laitages : boissons végétales enrichies, tofu, yaourts sans lactose.','Sans poisson : œufs, volaille, tofu, légumineuses + céréales.','Collation rapide : fruit + yaourt, compote + skyr, tartine jambon, smoothie maison.'];
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
          <div><strong>Objectif :</strong> ${esc(goalText)}</div>
          <div><strong>Hydratation :</strong> 30 à 35 ml/kg/jour de base, puis plus selon chaleur, transpiration et séance.</div>
          <div><strong>Repères :</strong> 3 repas stables + 1 collation utile si besoin, protéines réparties, féculents ajustés à l’activité.</div>
          <div><strong>Allergies / préférences :</strong> ${food.length?food.join(', '):'aucune restriction déclarée'}</div>
        </div>
      </div>
      <div class="portal-card">
        <h3>Micro-nutrition & substitutions</h3>
        <div class="nutrition-list">
          <div>Calcium et vitamine D à surveiller chez l’enfant, l’ado et le senior.</div>
          <div>Magnésium, potassium et sodium utiles pour les profils qui transpirent beaucoup.</div>
          <div>Oméga-3 via poissons gras, noix ou alternatives végétales adaptées.</div>
          <div>Fibres et couleurs dans l’assiette pour la digestion et la micronutrition.</div>
          ${substitutions.map(s=>`<div>${s}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel" style="margin-top:14px">
      <h3>Exemples de repas simples</h3>
      <div class="summary-grid summary-grid-4">${meals.map(m=>`<div class="summary-card"><strong>${m[0]}</strong><div class="small-muted">${m[1]}</div></div>`).join('')}</div>
    </div>
  </div>`;
};
exportPdf = function(){
  const p=currentProgram; if(!p){ alert('Génère d’abord un programme.'); return; }
  const { jsPDF } = window.jspdf; const doc=new jsPDF({unit:'mm', format:'a4'});
  const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), M=16; let y=20;
  const header=(first=false)=>{
    doc.setFillColor(10,14,20); doc.roundedRect(10,10,W-20,26,8,8,'F');
    if(first && LOGO_DATA){ try{ doc.addImage(LOGO_DATA,'JPEG',14,13,16,16);}catch(e){} }
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('FAFATRAINING', first&&LOGO_DATA?34:16, 21);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text('Programme personnalisé', first&&LOGO_DATA?34:16, 28); y=44;
  };
  const addPage=()=>{ doc.addPage(); header(false); };
  const ensure=(h=8)=>{ if(y+h>H-14) addPage(); };
  const write=(txt,size=10,bold=false,color=[24,30,38],indent=0,lh=5)=>{
    doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(txt), W-(M*2)-indent);
    lines.forEach(line=>{ ensure(lh+2); doc.text(line, M+indent, y); y+=lh; });
  };
  const section=(title)=>{ y+=2; ensure(12); doc.setFillColor(236,244,238); doc.roundedRect(M, y-1, W-(M*2), 9, 4,4,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(62,120,52); doc.text(title, M+3, y+5); y+=11; };
  header(true);
  write(`${p.name} · code ${p.code}`,15,true);
  write(`${labelForGoal(p.mainGoal)} · ${labelForEnv(p.env)} · ${p.freq} séance(s) / semaine · ${p.duration} min`,10,false,[84,96,110]);
  if(p.bmi) write(`Lecture santé : IMC ${p.bmi.value} · ${p.bmi.label}. ${p.bmi.risk}`);
  if(p.restrictions) write(`Contraintes prises en compte : ${p.restrictions}`);
  section('Profil');
  write(`${ageBandLabel(ageBand(p.age))} · ${p.sex==='female'?'Femme':'Homme'} · ${p.height} cm · ${p.weight} kg · niveau ${labelForLevel(p.level)}`);
  section('Semaine type');
  buildWeekSchedule(p.freq).forEach(w=>write(`${w.day} : ${w.note}`));
  section('Séances détaillées');
  p.days.forEach(day=>{
    ensure(14); doc.setFillColor(246,248,250); doc.roundedRect(M, y-1, W-(M*2), 8, 4,4,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(18,24,32); doc.text(day.title, M+3, y+5); y+=10;
    write(`Répartition utile : ${day.patternSummary}`,9,false,[80,92,106]);
    day.items.forEach(ex=>{
      write(ex.name,10,true);
      write(`${ex.prescription.series} · ${ex.prescription.reps} · repos ${ex.prescription.rest}`,9,false,[60,70,82],2);
      write(`Charge / intensité : ${ex.load||'adaptée au niveau'}`,9,false,[60,70,82],2);
      write(`Consigne : ${ex.cue}`,9,false,[60,70,82],2);
      write(`Version plus facile : ${ex.substitute||'adapter selon le matériel'}`,9,false,[60,70,82],2);
      write(`Version plus difficile : ${ex.progression||'ajouter charge, amplitude ou complexité'}`,9,false,[60,70,82],2);
      y+=1;
    });
  });
  if(p.nutrition){
    section('Nutrition');
    write(`${p.nutrition.kcal} kcal / jour · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`);
    write('Repères simples : 3 repas stables + 1 collation utile si besoin, hydratation régulière, légumes ou fruits chaque jour.');
  }
  section('Glossaire simple');
  write('HIIT = intervalles haute intensité. EMOM = chaque minute sur la minute. AMRAP = maximum de tours dans un temps donné.');
  write('Série = nombre de blocs. Répétitions = nombre de mouvements. Repos = temps de récupération entre deux efforts.');
  doc.save(`${p.code}_FAFATRAINING_PREMIUM.pdf`);
};
renderHome = function(){
  const programs=loadLocal('fafaPrograms',{}), business=loadLocal('fafaBusiness',{}), tracks=loadLocal('fafaTracking',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length; $('#kpiLibrary').textContent=EXERCISES.length;
  const activeClients = Object.values(business).filter(b=>b.status==='actif').length;
  const trackedCount = Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0);
  $('#kpiClients').textContent=activeClients; $('#kpiTracked').textContent=trackedCount;
  const due = Object.values(business).filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length; $('#kpiDue').textContent=due;
  const recentPrograms=Object.values(programs).slice(-4).reverse();
  $('#homeActivity').innerHTML = recentPrograms.length ? `<div class="panel"><h3>Programmes récents</h3><div class="summary-grid summary-grid-2">${recentPrograms.map(renderProgramMiniCard).join('')}</div></div>` : `<div class="empty-state"><strong>Aucun programme enregistré</strong><div class="small-muted">Commence par générer un premier programme propre depuis Coach Pro.</div></div>`;
  const clients = Object.values(programs).slice().reverse();
  $('#homeDirectory').innerHTML = `<div class="panel compact-home-panel"><h3>Répertoire utile</h3><div class="summary-grid summary-grid-2">${clients.length?clients.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${ageBandLabel(ageBand(p.age))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Ouvrir</button><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Nutrition</button><button type="button" class="ghost tiny delete-program" data-code="${esc(p.code)}">Supprimer</button></div></div>`).join(''):'<div class="summary-card"><strong>Répertoire vide</strong><div class="small-muted">Il apparaîtra ici après enregistrement d’un programme.</div></div>'}</div></div>`;
  const showcase=document.querySelector('#home .home-showcase');
  if(showcase){ showcase.innerHTML=`<div class="section-mini-head"><h3>Accueil coach</h3><p>Vue courte, lisible et utile : programmes récents, accès client, nutrition et actions rapides sans bloc vide ni doublon.</p></div><div class="summary-grid summary-grid-2"><div class="summary-card"><strong>Créer et corriger</strong><div class="small-muted">Programmes structurés avec variantes plus faciles et plus difficiles</div></div><div class="summary-card"><strong>Suivre et partager</strong><div class="small-muted">Code adhérent, portail, nutrition et suppression simple</div></div></div>`; }
  const modules=document.querySelector('#home .feature-grid');
  if(modules){ modules.innerHTML=`<div class="feature-card"><strong>Coach Pro</strong><span>profil utile, objectifs triés, matériel clair</span></div><div class="feature-card"><strong>Programmes</strong><span>structure lisible, intensité, variantes et substitutions</span></div><div class="feature-card"><strong>Nutrition</strong><span>repères compréhensibles + exemples de repas</span></div><div class="feature-card"><strong>Portail adhérent</strong><span>accès direct par lien ou par code</span></div>`; }
  bindDirectoryActions($('#home')); renderBusiness();
};
function localizeTechnicalLabels(){
  document.querySelectorAll('option').forEach(opt=>{
    const v=(opt.value||'').toLowerCase();
    if(v==='hiit') opt.textContent='HIIT (intervalles haute intensité)';
    if(v==='amrap') opt.textContent='AMRAP (maximum de tours)';
    if(v==='emom') opt.textContent='EMOM (chaque minute sur la minute)';
    if(v==='zone2') opt.textContent='Zone 2 (endurance fondamentale)';
    if(v==='hyrox') opt.textContent='Hyrox (course + ateliers fonctionnels)';
  });
}
window.addEventListener('DOMContentLoaded', ()=>{ setTimeout(()=>{ localizeTechnicalLabels(); parseAndOpenSharedLink(); renderHome(); }, 80); });


/* === V29.3 focused cleanup and generation patch === */
function frExerciseMeta(txt=''){
  return String(txt||'')
    .replace(/\bfull body\b/ig,'corps entier')
    .replace(/\bcardio\b/ig,'cardio')
    .replace(/\bpush\b/ig,'poussée')
    .replace(/\bpull\b/ig,'tirage')
    .replace(/\bupper\b/ig,'haut du corps')
    .replace(/\blower\b/ig,'bas du corps')
    .replace(/\bcore\b/ig,'gainage')
    .replace(/\bmobility\b/ig,'mobilité')
    .replace(/\bstretching\b/ig,'stretching')
    .replace(/\bglutes\b/ig,'fessiers')
    .replace(/\bhamstrings\b/ig,'ischios')
    .replace(/\bquads\b/ig,'quadriceps')
    .replace(/\bshoulders\b/ig,'épaules')
    .replace(/\bchest\b/ig,'pectoraux')
    .replace(/\bback\b/ig,'dos')
    .replace(/\bbiceps\b/ig,'biceps')
    .replace(/\btriceps\b/ig,'triceps')
    .replace(/\brear_delt\b/ig,'arrière d’épaule')
    .replace(/_/g,' ')
    .replace(/\s{2,}/g,' ')
    .trim();
}
baseName = function(ex){
  let name = cleanText((ex?.name||'')).toLowerCase();
  name = name.replace(/[•·]/g, ' — ').replace(/\s+-\s+/g,' — ').split('—')[0].trim();
  name = name.replace(/\b(version|tempo|pause|volume|léger|lourd|guidée|guidé|performance|explosif|contrôlé|contrôlée|isométrique|chargé|chargée)\b/gi,'').replace(/\s{2,}/g,' ').trim();
  return name;
};
function patternListForDay(form, title){
  const t=(title||'').toLowerCase();
  const goal=form.mainGoal;
  const gym=form.env==='gym' || form.env==='crossfit_box' || form.env==='boxing_gym';
  if(gym && ['strength','muscle_gain','recomposition'].includes(goal)){
    if(/pouss/.test(t)) return ['push','chest','shoulders','triceps','core'];
    if(/tirage/.test(t)) return ['pull','back','biceps','core','rear_delt'];
    if(/squat|quad|jambe/.test(t)) return ['quads','single_leg','glutes','calves','core'];
    if(/charni|hinge|ischio/.test(t)) return ['hamstrings','glutes','single_leg','core','calves'];
    return ['push','pull','quads','hamstrings','core'];
  }
  if(goal==='boxing') return ['cardio','core','push','rotation','single_leg'];
  if(['hyrox','conditioning','fat_loss'].includes(goal)) return ['quads','push','pull','cardio','core'];
  if(['trail','endurance'].includes(goal)) return ['single_leg','hamstrings','calves','cardio','core'];
  if(['mobility','health','return_to_play'].includes(goal)) return ['core','single_leg','mobility','glutes','hamstrings'];
  return goalFocusMap(form.mainGoal, title);
}
function chooseOneForPattern(cfg, pattern, excludeBases){
  const picks = chooseDiverseExercises({...cfg, goals:[pattern], count:3, excludeBases});
  return picks.find(ex=>!excludeBases.includes(baseName(ex))) || picks[0] || null;
}
buildProgramDays = function(form){
  const titles=buildDayTitles(form.freq, form.mainGoal, (form.cycleGoals||[])[0] || '');
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const usedBases=[];
  return titles.map((title)=>{
    const lower=(title||'').toLowerCase();
    let style=form.mainGoal || 'conditioning';
    if(/mobilité|flow|respiration|stabilité/.test(lower)) style='mobility';
    else if(/technique|rounds/.test(lower)) style='boxing';
    else if(/zone 2|seuil|conditioning|engine|simulation/.test(lower)) style=(form.mainGoal==='trail'?'trail':(form.mainGoal==='hyrox'?'hyrox':'conditioning'));
    else if((form.env==='gym' || form.env==='crossfit_box') && ['strength','muscle_gain','recomposition'].includes(form.mainGoal)) style=form.mainGoal;
    const cfg={level, env:form.env, equipment:preferredEquipmentOrder(form), injuries, medical, style};
    const patterns = patternListForDay(form, title);
    const chosen=[];
    patterns.forEach(pt=>{
      const ex = chooseOneForPattern(cfg, pt, usedBases.concat(chosen.map(baseName)));
      if(ex && !chosen.some(c=>baseName(c)===baseName(ex))) chosen.push(ex);
    });
    if(chosen.length < 5){
      chooseDiverseExercises({...cfg, goals:patterns, count:6-chosen.length, excludeBases:usedBases.concat(chosen.map(baseName))})
        .forEach(ex=>{ if(chosen.length<5 && !chosen.some(c=>baseName(c)===baseName(ex))) chosen.push(ex); });
    }
    return {title, items: chosen.slice(0,5).map((ex,idx)=>({
      name: ex.name,
      category: frExerciseMeta(ex.category),
      muscles: frExerciseMeta(ex.muscles),
      cue: ex.cue,
      easy: ex.easy,
      hard: ex.hard,
      substitute: ex.easy || 'Assistance, amplitude réduite ou charge plus légère',
      progression: ex.hard || 'Charge plus lourde, amplitude complète ou variante plus exigeante',
      prescription: formatPrescription(form.mainGoal, title, idx),
      load: loadGuidance(form.mainGoal, form.env, idx),
      coachNote: style==='strength' ? 'Charge maîtrisée, trajectoire propre et 1 à 3 répétitions en réserve.' : style==='conditioning' ? 'Rythme utile, technique propre et respiration régulière.' : style==='boxing' ? 'Précision, appuis et relâchement avant puissance.' : style==='mobility' ? 'Amplitude confortable, sans douleur, avec respiration calme.' : 'Exécution propre et progressive.'
    })), patternSummary: patterns.map(x=>frExerciseMeta(String(x))).join(' · '), style};
  }).map(day=>{ day.items.forEach(ex=>usedBases.push(baseName(ex))); return day; });
};
renderProgram = function(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const head = `<div class="panel panel-hero"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Accès adhérent prêt</span>`:''}</div>
    <div class="meta">
      <span class="badge">${esc(labelForGoal(p.mainGoal))}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(labelForEnv(p.env))}</span>
      <span class="badge">${esc(p.freq)} séance(s) / semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>Lecture santé :</strong> IMC ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}</p>`:''}
    ${p.restrictions?`<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictions)}</p>`:''}
  </div>`;
  const sched = `<article class="athlete-week"><h3>Semaine type</h3><div class="week-days compact">${week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><small>${w.note}</small></div>`).join('')}</div></article>`;
  const days = p.days.map(day=>`<article class="panel"><div class="session-top"><h3>${esc(day.title)}</h3><span class="badge">${esc(frStyleLabel(day.style||'conditioning'))}</span></div><p class="small-muted">Répartition utile : ${esc(day.patternSummary)}</p>${day.items.map(ex=>`<div class="summary-card session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(frExerciseMeta(ex.muscles||ex.category||''))}</div><div class="quick-prescription"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.reps)}</span><span>Repos ${esc(ex.prescription.rest)}</span></div><div class="session-line"><strong>Charge / intensité :</strong> ${esc(ex.load||'adaptée au niveau')}</div><div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue||'Exécution propre, respiration maîtrisée et amplitude utile.')}</div><div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.substitute||'adapter selon le matériel')}</div><div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.progression||'ajouter charge, amplitude ou complexité')}</div><div class="session-line"><strong>Note coach :</strong> ${esc(ex.coachNote||'Qualité d’exécution d’abord.')}</div></div>`).join('')}</article>`).join('');
  return head + sched + days;
};
buildNutritionView = function(p, standalone=false){
  const n=p.nutrition; if(!n) return '<div class="panel"><p>Données insuffisantes pour afficher la nutrition.</p></div>';
  const food = standalone ? optionLabels('nutriRestrictions').concat(optionLabels('nutriDislikes')) : optionLabels('foodKnown');
  const audience = standalone ? ($('#nutriAudience')?.value||'adult') : (ageBand(p.age)==='enfant'?'child':ageBand(p.age)==='ado'?'teen':ageBand(p.age)==='senior'?'senior':'adult');
  const bandText = {adult:'Adulte',child:'Enfant (6 à 10 ans)',teen:'Adolescent (11 à 17 ans)',senior:'Senior (60 ans et +)'}[audience] || 'Adulte';
  const goalKey = standalone ? ($('#nutriGoal')?.value||'health') : p.mainGoal;
  const goalText = standalone ? ({health:'Santé / équilibre',fat_loss:'Perte de poids',muscle_gain:'Prise de muscle',performance:'Performance / énergie',recomposition:'Recomposition corporelle'})[goalKey] : labelForGoal(goalKey);
  const meals=mealExamplesFor(goalKey,audience);
  const substitutions=['Sans œufs : skyr, tofu soyeux, blancs de volaille, poisson.','Légumes peu aimés : soupes, purées, sauces mixées, crudités fines.','Sans laitages : boissons végétales enrichies, tofu, yaourts sans lactose.','Sans poisson : œufs, volaille, tofu, légumineuses + céréales.'];
  return `<div class="panel panel-hero"><h3>${standalone?'Nutrition autonome FAFATRAINING':'Nutrition FAFATRAINING'} · ${esc(goalText)}</h3><div class="nutrition-grid"><div class="nutrition-block"><strong>${n.kcal}</strong><div class="small-muted">kcal repère / jour</div></div><div class="nutrition-block"><strong>${n.protein} g</strong><div class="small-muted">protéines / jour</div></div><div class="nutrition-block"><strong>${n.carbs} g</strong><div class="small-muted">glucides / jour</div></div><div class="nutrition-block"><strong>${n.fats} g</strong><div class="small-muted">lipides / jour</div></div></div><div class="portal-hero"><div class="portal-card"><h3>Repères simples</h3><div class="nutrition-list"><div><strong>Public :</strong> ${esc(bandText)}</div><div><strong>Objectif :</strong> ${esc(goalText)}</div><div><strong>Hydratation :</strong> 30 à 35 ml/kg/jour, puis ajustement selon chaleur et entraînement.</div><div><strong>Répartition :</strong> 3 repas stables + 1 collation utile si besoin.</div><div><strong>Préférences / allergies :</strong> ${food.length?food.join(', '):'aucune restriction déclarée'}</div></div></div><div class="portal-card"><h3>Substitutions utiles</h3><div class="nutrition-list">${substitutions.map(s=>`<div>${s}</div>`).join('')}</div></div></div><div class="panel" style="margin-top:14px"><h3>Exemples de repas simples</h3><div class="summary-grid summary-grid-4">${meals.map(m=>`<div class="summary-card"><strong>${m[0]}</strong><div class="small-muted">${m[1]}</div></div>`).join('')}</div></div></div>`;
};
function localizeTechnicalLabelsDeep(){
  const map = {'hiit':'HIIT (intervalles haute intensité)','amrap':'AMRAP (maximum de tours)','emom':'EMOM (chaque minute sur la minute)','zone2':'Zone 2 (endurance fondamentale)','hyrox':'Hyrox (course + ateliers fonctionnels)','general':'Général (polyvalent)','fitness':'Fitness (forme générale)','conditioning':'Conditioning (condition physique)','strength':'Force (charges lourdes)','mobility':'Mobilité (amplitudes / contrôle)','nutrition':'Nutrition (alimentation)','trail':'Trail (course nature)','boxing':'Boxe (technique / cardio)','remote':'Suivi à distance','video':'Visio','program_only':'Programme seul','home':'Maison','gym':'Salle','outdoor':'Extérieur','mixed':'Mixte'};
  document.querySelectorAll('option').forEach(opt=>{ const v=(opt.value||'').toLowerCase(); if(map[v]) opt.textContent=map[v]; });
}
renderHome = function(){
  const programs=loadLocal('fafaPrograms',{}), business=loadLocal('fafaBusiness',{}), tracks=loadLocal('fafaTracking',{}), clients=Object.values(programs).slice().reverse();
  $('#kpiPrograms').textContent=Object.keys(programs).length; $('#kpiLibrary').textContent=EXERCISES.length; $('#kpiClients').textContent=Object.values(business).filter(b=>b.status==='actif').length || clients.length; $('#kpiTracked').textContent=Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0); $('#kpiDue').textContent=Object.values(business).filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  const recentPrograms=clients.slice(0,4);
  $('#homeActivity').innerHTML=`<div class="panel compact-home-panel"><h3>Programmes récents</h3>${recentPrograms.length?`<div class="summary-grid summary-grid-2">${recentPrograms.map(renderProgramMiniCard).join('')}</div>`:'<div class="small-muted">Aucun programme enregistré pour le moment.</div>'}</div>`;
  $('#homeDirectory').innerHTML=`<div class="panel compact-home-panel"><h3>Accès rapides</h3><div class="summary-grid summary-grid-2">${clients.length?clients.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${ageBandLabel(ageBand(p.age))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Portail</button><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Nutrition</button><button type="button" class="ghost tiny delete-program" data-code="${esc(p.code)}">Supprimer</button></div></div>`).join(''):'<div class="summary-card"><strong>Répertoire vide</strong><div class="small-muted">Il apparaîtra ici après enregistrement d’un programme.</div></div>'}</div></div>`;
  const showcase=document.querySelector('#home .home-showcase'); if(showcase){ showcase.innerHTML=`<div class="section-mini-head"><h3>Accueil coach</h3><p>Épuré, utile et sans doublons : programmes récents, accès client, nutrition et actions rapides.</p></div><div class="summary-grid summary-grid-2"><div class="summary-card"><strong>Créer</strong><div class="small-muted">Programme structuré, variantes faciles et difficiles, charge / intensité</div></div><div class="summary-card"><strong>Suivre</strong><div class="small-muted">Portail adhérent, nutrition, suppression et réouverture rapide</div></div></div>`; showcase.style.display='block'; }
  const modulesPanel=document.querySelector('#home .feature-grid'); if(modulesPanel){ modulesPanel.innerHTML=`<div class="feature-card"><strong>Coach Pro</strong><span>profil utile, objectifs triés, matériel clair</span></div><div class="feature-card"><strong>Programme</strong><span>séances plus variées et plus logiques en salle</span></div><div class="feature-card"><strong>Nutrition</strong><span>repères concrets + exemples de repas simples</span></div><div class="feature-card"><strong>Portail adhérent</strong><span>accès direct, partage et suppression</span></div>`; }
  bindDirectoryActions($('#home')); renderBusiness();
};
enhanceMultiSelects = function(ids){
  ids.forEach(id=>{
    const select=document.getElementById(id); if(!select || select.dataset.enhanced) return;
    select.dataset.enhanced='1'; select.style.display='none';
    const host=document.createElement('div'); host.className='multi-select';
    host.innerHTML=`<button type="button" class="multi-select-trigger" aria-expanded="false"><span class="multi-select-value">Aucune sélection</span><span class="multi-select-arrow">▾</span></button><div class="multi-select-tags"></div><div class="multi-select-menu" hidden><div class="multi-select-search-wrap"><input type="text" class="multi-select-search" placeholder="Rechercher..."></div><div class="multi-select-options"></div></div>`;
    select.parentNode.insertBefore(host, select.nextSibling); host.appendChild(select);
    const trigger=host.querySelector('.multi-select-trigger'), value=host.querySelector('.multi-select-value'), tags=host.querySelector('.multi-select-tags'), menu=host.querySelector('.multi-select-menu'), search=host.querySelector('.multi-select-search'), optionsWrap=host.querySelector('.multi-select-options');
    const paint=()=>{ const q=(search.value||'').toLowerCase().trim(); optionsWrap.innerHTML=''; Array.from(select.options).forEach(opt=>{ if(q && !opt.textContent.toLowerCase().includes(q)) return; const row=document.createElement('label'); row.className='multi-option'; row.innerHTML=`<input type="checkbox" ${opt.selected?'checked':''}><span>${opt.textContent}</span>`; row.querySelector('input').addEventListener('change',e=>{ opt.selected=e.target.checked; refresh(); select.dispatchEvent(new Event('change',{bubbles:true})); }); optionsWrap.appendChild(row); }); };
    const closeAll=()=>{ document.querySelectorAll('.multi-select-menu').forEach(m=>m.setAttribute('hidden','')); document.querySelectorAll('.multi-select').forEach(h=>h.classList.remove('open')); document.querySelectorAll('.multi-select-trigger').forEach(t=>t.setAttribute('aria-expanded','false')); };
    const refresh=()=>{ const chosen=Array.from(select.selectedOptions); value.textContent=chosen.length?`${chosen.length} sélection${chosen.length>1?'s':''}`:'Aucune sélection'; tags.innerHTML=chosen.length?chosen.map(o=>`<span class="tag">${o.textContent}</span>`).join(''):''; paint(); };
    trigger.addEventListener('click',e=>{ e.preventDefault(); const open=!menu.hasAttribute('hidden'); closeAll(); if(!open){ menu.removeAttribute('hidden'); host.classList.add('open'); trigger.setAttribute('aria-expanded','true'); requestAnimationFrame(()=>search.focus()); } });
    search.addEventListener('input', paint); document.addEventListener('click',e=>{ if(!host.contains(e.target)) closeAll(); }); refresh();
  });
};
window.addEventListener('DOMContentLoaded', ()=>{ setTimeout(()=>{ localizeTechnicalLabelsDeep(); parseAndOpenSharedLink(); renderHome(); }, 120); });

/* === V29.4 art direction + cleaner programming engine === */
function exerciseFamilyName(ex){
  const raw = baseName(ex) || cleanText(ex?.name||'');
  let t = String(raw).toLowerCase();
  t = t.replace(/\b(barbell|halt[eé]res?|dumbbell|machine|cable|band|trx|kb|kettlebell|landmine|trap bar|bodyweight|poids du corps)\b/g,'');
  t = t.replace(/\b(version|tempo|pause|volume|l[ée]ger|lourd|guid[ée]e?|performance|explosif|contr[ôo]l[ée]|isom[ée]trique|charg[ée]e?)\b/g,'');
  t = t.replace(/\s{2,}/g,' ').trim();
  const family = t.split(/[,/]| — /)[0].trim();
  return family || t;
}
function isGymWeighted(ex){
  const txt = exerciseText(ex);
  return /(barbell|halt[eé]re|dumbbell|machine|cable|landmine|trap bar|smith|poulie|leg press|lat pulldown|rowing assis|développé|developpe|dips lest|hip thrust|rack|bench|tirage vertical|tirage horizontal)/i.test(txt);
}
function isTooMetconForStrength(ex){
  const txt = exerciseText(ex);
  return /(burpee|mountain climber|jumping jack|skater|frog jump|air bike|bike sprint|battle rope|box jump|double under|thruster|wall ball)/i.test(txt);
}
chooseDiverseExercises = function({level='intermediate', env='', equipment=[], injuries=[], medical=[], style='', goals=[], count=5, excludeBases=[]}){
  let filtered = EXERCISES.filter(ex=>exerciseMatches(ex, level, env, equipment, injuries, medical));
  const eqOrder = equipment.length ? equipment : PRESETS[env]||[];
  const gymFocused = env==='gym' && ['strength','muscle_gain','recomposition'].includes(style);
  if(gymFocused){
    const weighted = filtered.filter(ex=>isGymWeighted(ex) && !isTooMetconForStrength(ex));
    if(weighted.length >= Math.max(6, count)) filtered = weighted;
  }
  const scored = filtered.map(ex=>{
    const txt=exerciseText(ex); const base=baseName(ex); const fam=exerciseFamilyName(ex); const tag=movementTag(ex);
    let score=0;
    if(excludeBases.includes(base) || excludeBases.includes(fam)) score -= 100;
    if(style && styleMatches(ex, style)) score += 34;
    if(goals.some(g=>tag===g)) score += 30;
    if(goals.some(g=>txt.includes(String(g).replace('_',' ')))) score += 16;
    if(eqOrder.length && (ex.equipment||[]).some(e=>eqOrder.includes(e))) score += 18;
    if(env && (ex.environments||[]).includes(env)) score += 10;
    if(level==='beginner' && /(guid[ée]e?|tempo|pause|simple|assist[ée]e?|r[eé]gression)/i.test(ex.name+' '+(ex.easy||''))) score += 10;
    if(level==='advanced' && /(barbell|lourd|performance|explosif|complexe|advanced|power)/i.test(txt)) score += 10;
    if(style==='mobility' && mobilityFocused(ex)) score += 40;
    if(gymFocused && isGymWeighted(ex)) score += 30;
    if(gymFocused && isTooMetconForStrength(ex)) score -= 60;
    return {ex,score,tag,base,fam};
  }).sort((a,b)=>b.score-a.score);
  const picks=[]; const usedTags=new Set(); const usedBases=new Set(excludeBases); const usedFamilies=new Set(excludeBases);
  for(const target of goals){
    const hit=scored.find(s=>!usedBases.has(s.base) && !usedFamilies.has(s.fam) && !picks.includes(s.ex) && (s.tag===target || exerciseText(s.ex).includes(String(target).replace('_',' '))));
    if(hit){ picks.push(hit.ex); usedBases.add(hit.base); usedFamilies.add(hit.fam); usedTags.add(hit.tag); }
  }
  for(const s of scored){
    if(picks.length>=count) break;
    if(usedBases.has(s.base) || usedFamilies.has(s.fam)) continue;
    if(usedTags.has(s.tag) && picks.length < count-1) continue;
    picks.push(s.ex); usedBases.add(s.base); usedFamilies.add(s.fam); usedTags.add(s.tag);
  }
  return picks.slice(0,count);
};
buildProgramDays = function(form){
  const titles=buildDayTitles(form.freq, form.mainGoal, (form.cycleGoals||[])[0] || '');
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const used=[];
  return titles.map((title)=>{
    const lower=(title||'').toLowerCase();
    let style=form.mainGoal || 'conditioning';
    if(/mobilit[eé]|flow|respiration|stabilit[eé]/.test(lower)) style='mobility';
    else if(/technique|rounds/.test(lower)) style='boxing';
    else if(/zone 2|seuil|conditioning|engine|simulation/.test(lower)) style=(form.mainGoal==='trail'?'trail':(form.mainGoal==='hyrox'?'hyrox':'conditioning'));
    else if((form.env==='gym' || form.env==='crossfit_box') && ['strength','muscle_gain','recomposition'].includes(form.mainGoal)) style=form.mainGoal;
    const cfg={level, env:form.env, equipment:preferredEquipmentOrder(form), injuries, medical, style};
    const patterns = patternListForDay(form, title);
    const chosen=[];
    patterns.forEach(pt=>{
      const ex = chooseOneForPattern(cfg, pt, used.concat(chosen.map(exerciseFamilyName)).concat(chosen.map(baseName)));
      if(ex && !chosen.some(c=>exerciseFamilyName(c)===exerciseFamilyName(ex))) chosen.push(ex);
    });
    if(chosen.length < 5){
      chooseDiverseExercises({...cfg, goals:patterns, count:7, excludeBases:used.concat(chosen.map(exerciseFamilyName)).concat(chosen.map(baseName))})
        .forEach(ex=>{ if(chosen.length<5 && !chosen.some(c=>exerciseFamilyName(c)===exerciseFamilyName(ex))) chosen.push(ex); });
    }
    const taggedStyle = style==='strength' ? 'force' : style==='muscle_gain' ? 'hypertrophie' : style==='recomposition' ? 'recomposition' : style;
    const items=chosen.slice(0,5).map((ex,idx)=>({
      name: ex.name,
      category: frExerciseMeta(ex.category),
      muscles: frExerciseMeta(ex.muscles),
      cue: ex.cue,
      easy: ex.easy,
      hard: ex.hard,
      substitute: ex.easy || 'Réduire l’amplitude, alléger la charge ou choisir une machine plus stable',
      progression: ex.hard || 'Ajouter un peu de charge, d’amplitude ou une variante plus exigeante',
      prescription: formatPrescription(form.mainGoal, title, idx),
      load: loadGuidance(form.mainGoal, form.env, idx),
      coachNote: taggedStyle==='force' ? 'Montée de charge progressive, exécution propre et 1 à 3 répétitions en réserve.' : taggedStyle==='hypertrophie' ? 'Cherche la sensation musculaire, une amplitude utile et un tempo contrôlé.' : taggedStyle==='recomposition' ? 'Travail propre, densité maîtrisée et transitions courtes.' : taggedStyle==='conditioning' ? 'Rythme régulier, respiration stable et technique propre malgré la fatigue.' : taggedStyle==='boxing' ? 'Appuis propres, relâchement et précision avant la puissance.' : taggedStyle==='mobility' ? 'Amplitude confortable, sans douleur, respiration calme.' : 'Exécution propre et progressive.'
    }));
    items.forEach(ex=>used.push(exerciseFamilyName(ex)));
    return {title, items, patternSummary: patterns.map(x=>frExerciseMeta(String(x))).join(' · '), style};
  });
};
renderProgram = function(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const head = `<div class="panel panel-hero clean-program-head"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Accès adhérent prêt</span>`:''}</div><div class="meta"><span class="badge">${esc(labelForGoal(p.mainGoal))}</span><span class="badge">${esc(labelForEnv(p.env))}</span><span class="badge">${esc(p.freq)} séance(s) / semaine</span><span class="badge">${esc(p.duration)} min</span></div><div class="summary-grid summary-grid-4 compact-kpis"><div class="summary-card"><strong>${esc(ageBandLabel(ageBand(p.age)))}</strong><div class="small-muted">public</div></div><div class="summary-card"><strong>${esc(labelForLevel(p.level))}</strong><div class="small-muted">niveau</div></div><div class="summary-card"><strong>${p.bmi?esc(p.bmi.value):'-'}</strong><div class="small-muted">IMC</div></div><div class="summary-card"><strong>${esc(p.cycleWeeks||8)} sem.</strong><div class="small-muted">cycle</div></div></div></div>`;
  const sched = `<div class="panel"><h3>Semaine type</h3><div class="week-days compact">${week.map(w=>`<div class="daypill"><strong>${w.short}</strong><small>${w.note}</small></div>`).join('')}</div></div>`;
  const days = p.days.map(day=>`<article class="panel session-day"><div class="section-mini-head"><h3>${esc(day.title)}</h3><p>Répartition utile : ${esc(day.patternSummary)}</p></div>${day.items.map(ex=>`<div class="session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.category)} · ${esc(ex.muscles)}</div><div class="quick-prescription"><span>${esc(ex.prescription.series)}</span><span>${esc(ex.prescription.reps)}</span><span>Repos ${esc(ex.prescription.rest)}</span><span>${esc(ex.load||'intensité adaptée')}</span></div><div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue)}</div><div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.substitute||'adapter selon le matériel')}</div><div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.progression||'ajouter charge, amplitude ou complexité')}</div><div class="session-line"><strong>Note coach :</strong> ${esc(ex.coachNote||'Qualité d’exécution d’abord.')}</div></div>`).join('')}</article>`).join('');
  return head + sched + days;
};
exportPdf = function(){
  const p=currentProgram; if(!p){ alert('Génère d’abord un programme.'); return; }
  const { jsPDF } = window.jspdf; const doc=new jsPDF({unit:'mm', format:'a4'});
  const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), M=14; let y=18;
  const header=(first=false)=>{
    doc.setFillColor(11,16,23); doc.roundedRect(10,10,W-20,22,6,6,'F');
    if(LOGO_DATA){ try{ doc.addImage(LOGO_DATA,'JPEG',14,13,14,14);}catch(e){} }
    doc.setTextColor(250,250,250); doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.text('FAFATRAINING', 32, 20);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(first?'Programme personnalisé premium':'Programme personnalisé', 32, 26);
    y=39;
  };
  const ensure=(h=8)=>{ if(y+h>H-14){ doc.addPage(); header(false); } };
  const write=(txt,size=10,bold=false,color=[32,39,46],indent=0,lh=5)=>{
    doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(txt), W-(M*2)-indent);
    lines.forEach(line=>{ ensure(lh+2); doc.text(line, M+indent, y); y+=lh; });
  };
  const section=(title)=>{ y+=2; ensure(12); doc.setFillColor(236,244,238); doc.roundedRect(M, y-1, W-(M*2), 9, 4,4,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(62,120,52); doc.text(title, M+3, y+5); y+=11; };
  header(true);
  write(`${p.name} · code ${p.code}`,15,true,[18,24,32]);
  write(`${labelForGoal(p.mainGoal)} · ${labelForEnv(p.env)} · ${p.freq} séance(s) / semaine · ${p.duration} min`,10,false,[84,96,110]);
  if(p.bmi) write(`Lecture santé : IMC ${p.bmi.value} · ${p.bmi.label}. ${p.bmi.risk}`);
  if(p.restrictions) write(`Contraintes prises en compte : ${p.restrictions}`);
  section('Profil');
  write(`${ageBandLabel(ageBand(p.age))} · ${p.sex==='female'?'Femme':'Homme'} · ${p.height} cm · ${p.weight} kg · niveau ${labelForLevel(p.level)}`);
  section('Semaine type');
  buildWeekSchedule(p.freq).forEach(w=>write(`${w.day} : ${w.note}`));
  section('Séances détaillées');
  p.days.forEach(day=>{
    ensure(14); doc.setFillColor(246,248,250); doc.roundedRect(M, y-1, W-(M*2), 8, 4,4,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(18,24,32); doc.text(day.title, M+3, y+5); y+=10;
    write(`Répartition utile : ${day.patternSummary}`,9,false,[80,92,106]);
    day.items.forEach(ex=>{
      write(ex.name,10,true);
      write(`${ex.prescription.series} · ${ex.prescription.reps} · repos ${ex.prescription.rest}`,9,false,[60,70,82],2);
      write(`Charge / intensité : ${ex.load||'adaptée au niveau'}`,9,false,[60,70,82],2);
      write(`Consigne : ${ex.cue}`,9,false,[60,70,82],2);
      write(`Version plus facile : ${ex.substitute||'adapter selon le matériel'}`,9,false,[60,70,82],2);
      write(`Version plus difficile : ${ex.progression||'ajouter charge, amplitude ou complexité'}`,9,false,[60,70,82],2);
      y+=1;
    });
  });
  if(p.nutrition){
    const meals=mealExamplesFor(p.mainGoal, ageBand(p.age)==='enfant'?'child':ageBand(p.age)==='ado'?'teen':ageBand(p.age)==='senior'?'senior':'adult');
    section('Nutrition');
    write(`${p.nutrition.kcal} kcal / jour · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`);
    meals.forEach(m=>write(`${m[0]} : ${m[1]}`,9,false,[60,70,82],2));
  }
  section('Glossaire simple');
  write('HIIT = intervalles haute intensité. EMOM = chaque minute sur la minute. AMRAP = maximum de tours dans un temps donné.');
  write('Série = nombre de blocs. Répétitions = nombre de mouvements. Repos = temps de récupération entre deux efforts.');
  doc.save(`${p.code}_FAFATRAINING_PREMIUM.pdf`);
};
renderHome = function(){
  const programs=loadLocal('fafaPrograms',{}), business=loadLocal('fafaBusiness',{}), tracks=loadLocal('fafaTracking',{}), clients=Object.values(programs).slice().reverse();
  $('#kpiPrograms').textContent=Object.keys(programs).length; $('#kpiLibrary').textContent=EXERCISES.length; $('#kpiClients').textContent=Object.values(business).filter(b=>b.status==='actif').length || clients.length; $('#kpiTracked').textContent=Object.values(tracks).reduce((a,b)=>a+(b?.length||0),0); $('#kpiDue').textContent=Object.values(business).filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  const recentPrograms=clients.slice(0,4);
  $('#homeActivity').innerHTML=`<div class="panel compact-home-panel"><h3>Programmes récents</h3>${recentPrograms.length?`<div class="summary-grid summary-grid-2">${recentPrograms.map(renderProgramMiniCard).join('')}</div>`:'<div class="small-muted">Aucun programme enregistré pour le moment.</div>'}</div>`;
  $('#homeDirectory').innerHTML=`<div class="panel compact-home-panel"><h3>Accès rapides</h3><div class="summary-grid summary-grid-2">${clients.length?clients.map(p=>`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${ageBandLabel(ageBand(p.age))}</div><div class="mini-actions"><button type="button" class="ghost tiny open-program" data-code="${esc(p.code)}">Portail</button><button type="button" class="ghost tiny open-nutrition" data-code="${esc(p.code)}">Nutrition</button><button type="button" class="ghost tiny delete-program" data-code="${esc(p.code)}">Supprimer</button></div></div>`).join(''):'<div class="summary-card"><strong>Répertoire vide</strong><div class="small-muted">Il apparaîtra ici après enregistrement d’un programme.</div></div>'}</div></div>`;
  const showcase=document.querySelector('#home .home-showcase'); if(showcase){ showcase.style.display='none'; }
  const modulesPanel=document.querySelector('#home .feature-grid'); if(modulesPanel){ modulesPanel.innerHTML=`<div class="feature-card"><strong>Coach Pro</strong><span>profil utile, objectifs triés, matériel clair</span></div><div class="feature-card"><strong>Programme</strong><span>séances plus variées, plus propres et plus lisibles</span></div><div class="feature-card"><strong>Nutrition</strong><span>repères concrets + exemples de repas simples</span></div><div class="feature-card"><strong>Portail adhérent</strong><span>accès direct, partage et suppression</span></div>`; }
  bindDirectoryActions($('#home')); renderBusiness();
};
enhanceMultiSelects = function(ids){
  ids.forEach(id=>{
    const select=document.getElementById(id); if(!select || select.dataset.enhanced) return;
    select.dataset.enhanced='1'; select.style.display='none';
    const host=document.createElement('div'); host.className='multi-select';
    host.innerHTML=`<button type="button" class="multi-select-trigger" aria-expanded="false"><span class="multi-select-value">Aucune sélection</span><span class="multi-select-arrow">▾</span></button><div class="multi-select-tags"></div><div class="multi-select-menu" hidden><div class="multi-select-search-wrap"><input type="text" class="multi-select-search" placeholder="Rechercher..."></div><div class="multi-select-options"></div></div>`;
    select.parentNode.insertBefore(host, select.nextSibling); host.appendChild(select);
    const trigger=host.querySelector('.multi-select-trigger'), value=host.querySelector('.multi-select-value'), tags=host.querySelector('.multi-select-tags'), menu=host.querySelector('.multi-select-menu'), search=host.querySelector('.multi-select-search'), optionsWrap=host.querySelector('.multi-select-options');
    const paint=()=>{ const q=(search.value||'').toLowerCase().trim(); optionsWrap.innerHTML=''; Array.from(select.options).forEach(opt=>{ if(q && !opt.textContent.toLowerCase().includes(q)) return; const row=document.createElement('label'); row.className='multi-option'; row.innerHTML=`<input type="checkbox" ${opt.selected?'checked':''}><span>${opt.textContent}</span>`; row.querySelector('input').addEventListener('change',e=>{ opt.selected=e.target.checked; refresh(); select.dispatchEvent(new Event('change',{bubbles:true})); }); optionsWrap.appendChild(row); }); };
    const closeAll=()=>{ document.querySelectorAll('.multi-select-menu').forEach(m=>m.setAttribute('hidden','')); document.querySelectorAll('.multi-select').forEach(h=>h.classList.remove('open')); document.querySelectorAll('.multi-select-trigger').forEach(t=>t.setAttribute('aria-expanded','false')); };
    const refresh=()=>{ const chosen=Array.from(select.selectedOptions); value.textContent=chosen.length?`${chosen.length} sélection${chosen.length>1?'s':''}`:'Aucune sélection'; tags.innerHTML=chosen.length?chosen.map(o=>`<span class="tag">${o.textContent}</span>`).join(''):''; paint(); };
    trigger.addEventListener('click',e=>{ e.preventDefault(); const open=!menu.hasAttribute('hidden'); closeAll(); if(!open){ menu.removeAttribute('hidden'); host.classList.add('open'); trigger.setAttribute('aria-expanded','true'); requestAnimationFrame(()=>search.focus()); } });
    search.addEventListener('input', paint); document.addEventListener('click',e=>{ if(!host.contains(e.target)) closeAll(); }); refresh();
  });
};
window.addEventListener('DOMContentLoaded', ()=>{ setTimeout(()=>{ localizeTechnicalLabelsDeep(); parseAndOpenSharedLink(); renderHome(); }, 120); });


/* === V29.5 final cleanup and UX fixes === */
(function(){
  const DAY_SHORTS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  window.buildWeekSchedule = function(freq){
    const f=Number(freq||3);
    const layouts={2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,3,4,5],6:[0,1,2,4,5,6]};
    const trains=new Set(layouts[f]||layouts[3]);
    return DAY_SHORTS.map((d,i)=>({day:d,short:d,train:trains.has(i),note:trains.has(i)?'Séance':'Repos actif'}));
  };

  const STYLE_FR={
    circuit:'Circuit training', hiit:'HIIT (intervalles haute intensité)', emom:'EMOM (chaque minute sur la minute)',
    amrap:'AMRAP (maximum de tours)', interval:'Intervalles (effort / récupération)', zone2:'Zone 2 (endurance fondamentale)',
    boxing:'Boxe', mobility:'Mobilité / stretching', strength:'Force / musculation', conditioning:'Condition physique',
    hyrox:'Hyrox (course + ateliers fonctionnels)', trail:'Trail / course nature', core:'Gainage / ceinture abdominale',
    health:'Santé / remise en forme', recovery:'Récupération active', muscle_gain:'Hypertrophie / prise de muscle', recomposition:'Recomposition'
  };
  window.frStyleLabel = function(v){ return STYLE_FR[v] || (window.quickStyleLabel ? quickStyleLabel(v) : v) || v; };

  function patchQuickOptions(){
    const sel=document.getElementById('quickStyle');
    if(!sel) return;
    const wanted=[
      ['circuit','Circuit training'],['hiit','HIIT (intervalles haute intensité)'],['emom','EMOM (chaque minute sur la minute)'],
      ['amrap','AMRAP (maximum de tours)'],['interval','Intervalles (effort / récupération)'],['zone2','Zone 2 (endurance fondamentale)'],
      ['strength','Force / musculation'],['boxing','Boxe'],['hyrox','Hyrox (course + ateliers fonctionnels)'],['conditioning','Condition physique'],
      ['mobility','Mobilité / stretching'],['trail','Trail / course nature'],['core','Gainage / ceinture abdominale'],['health','Santé / remise en forme'],['recovery','Récupération active']
    ];
    sel.innerHTML=wanted.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  }

  function localizeAllOptions(){
    const map={
      hiit:'HIIT (intervalles haute intensité)',amrap:'AMRAP (maximum de tours)',emom:'EMOM (chaque minute sur la minute)',interval:'Intervalles (effort / récupération)',zone2:'Zone 2 (endurance fondamentale)',
      hyrox:'Hyrox (course + ateliers fonctionnels)',general:'Général (polyvalent)',fitness:'Fitness (forme générale)',conditioning:'Conditioning (condition physique)',strength:'Force / musculation',
      mobility:'Mobilité / stretching',nutrition:'Nutrition (alimentation)',trail:'Trail / course nature',boxing:'Boxe',remote:'Suivi à distance',video:'Visio',program_only:'Programme seul',
      home:'Maison',gym:'Salle de musculation',outdoor:'Extérieur',mixed:'Mixte',crossfit_box:'Salle CrossFit / Hyrox',boxing_gym:'Salle de boxe',bodyweight_only:'Poids du corps uniquement',
      muscle_gain:'Prise de muscle',fat_loss:'Perte de poids',recomposition:'Recomposition corporelle',health:'Santé / remise en forme',return_to_play:'Retour de blessure',
      endurance:'Endurance',core:'Gainage / ceinture abdominale',recovery:'Récupération active'
    };
    document.querySelectorAll('option').forEach(opt=>{ const v=(opt.value||'').toLowerCase(); if(map[v]) opt.textContent=map[v]; });
  }

  const oldPattern=window.patternListForDay;
  window.patternListForDay = function(form,title){
    const t=String(title||'').toLowerCase();
    const goal=form.mainGoal; const gym=form.env==='gym' || form.env==='crossfit_box';
    if(gym && ['strength','muscle_gain','recomposition'].includes(goal)){
      if(/pouss/.test(t)) return ['push','chest','shoulders','triceps','core'];
      if(/tirage/.test(t)) return ['pull','back','biceps','rear_delt','core'];
      if(/squat|quad|jambe|lower/.test(t)) return ['quads','glutes','single_leg','calves','core'];
      if(/charni|hinge|ischio|poster/.test(t)) return ['hamstrings','glutes','single_leg','calves','core'];
      return ['push','pull','quads','hamstrings','core'];
    }
    if(goal==='boxing') return ['boxing','rotation','single_leg','conditioning','core'];
    if(goal==='hyrox') return ['sled','carry','row','ski','core'];
    if(goal==='trail' || goal==='endurance') return ['single_leg','hamstrings','calves','cardio','core'];
    if(goal==='mobility' || goal==='health' || goal==='return_to_play') return ['mobility','stability','rotation','single_leg','core'];
    if(goal==='fat_loss' || goal==='conditioning') return ['squat','push','pull','cardio','core'];
    return oldPattern ? oldPattern(form,title) : ['push','pull','quads','hamstrings','core'];
  };

  const oldLoad=window.loadGuidance;
  window.loadGuidance = function(goal,env,idx){
    if((env==='gym'||env==='crossfit_box') && ['strength','muscle_gain','recomposition'].includes(goal)){
      if(goal==='strength') return idx<2?'Charge lourde maîtrisée (RPE 7 à 9 / 10)':'Charge modérée à lourde, technique propre';
      if(goal==='muscle_gain') return idx<2?'Charge de travail 6 à 10 reps, proche de l’échec contrôlé':'Charge modérée, amplitude complète et tension musculaire';
      return 'Charge modérée, effort propre, transitions courtes';
    }
    return oldLoad ? oldLoad(goal,env,idx) : 'Intensité adaptée au niveau';
  };

  window.renderProgram = function(p,coach=true){
    const week=buildWeekSchedule(p.freq);
    const head = `<div class="panel panel-hero clean-program-head"><h3>${esc(p.name)} · ${esc(p.code)}</h3><div class="meta"><span class="program-code">Code ${esc(p.code)}</span>${coach?`<span class="badge">Accès adhérent prêt</span>`:''}</div><div class="meta"><span class="badge">${esc(labelForGoal(p.mainGoal))}</span><span class="badge">${esc(labelForEnv(p.env))}</span><span class="badge">${esc(labelForLevel(p.level))}</span><span class="badge">${esc(p.freq)} séance(s) / semaine</span><span class="badge">${esc(p.duration)} min</span></div><div class="summary-grid summary-grid-4 compact-kpis"><div class="summary-card"><strong>${esc(ageBandLabel(ageBand(p.age)))}</strong><div class="small-muted">public</div></div><div class="summary-card"><strong>${p.bmi?esc(p.bmi.value):'-'}</strong><div class="small-muted">IMC</div></div><div class="summary-card"><strong>${esc(p.cycleWeeks||8)} sem.</strong><div class="small-muted">cycle</div></div><div class="summary-card"><strong>${esc((p.days||[]).length)}</strong><div class="small-muted">séances clés</div></div></div></div>`;
    const sched = `<div class="panel"><h3>Semaine type</h3><div class="week-days compact">${week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.short}</strong><small>${w.note}</small></div>`).join('')}</div></div>`;
    const days=(p.days||[]).map(day=>`<article class="panel session-day"><div class="section-mini-head"><h3>${esc(day.title)}</h3><p>Répartition utile : ${esc(day.patternSummary||'')}</p></div>${(day.items||[]).map(ex=>`<div class="session-item"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.category||'')} · ${esc(ex.muscles||'')}</div><div class="quick-prescription"><span>${esc(ex.prescription?.series||'3 séries')}</span><span>${esc(ex.prescription?.reps||'8 à 12 reps')}</span><span>Repos ${esc(ex.prescription?.rest||'60 sec')}</span><span>${esc(ex.load||'intensité adaptée')}</span></div><div class="session-line"><strong>Consigne :</strong> ${esc(ex.cue||'Exécution propre et respiration maîtrisée.')}</div><div class="session-line"><strong>Version plus facile :</strong> ${esc(ex.substitute||'Alléger la charge, réduire l’amplitude ou choisir une machine plus stable')}</div><div class="session-line"><strong>Version plus difficile :</strong> ${esc(ex.progression||'Ajouter un peu de charge, d’amplitude ou une variante plus exigeante')}</div><div class="session-line"><strong>Note coach :</strong> ${esc(ex.coachNote||'Qualité d’exécution d’abord.')}</div></div>`).join('')}</article>`).join('');
    return head + sched + days;
  };

  const oldRenderHome=window.renderHome;
  window.renderHome = function(){
    if(oldRenderHome) oldRenderHome();
    const hero=document.querySelector('#home .hero-card.xl');
    if(hero){
      hero.innerHTML=`<span class="eyebrow">FAFATRAINING</span><h2>Une application de coaching premium, claire et utile.</h2><p>Programme, adhérent, nutrition et business dans une interface plus simple, plus lisible et moins chargée.</p>`;
    }
    const featureGrid=document.querySelector('#home .feature-grid');
    if(featureGrid){
      featureGrid.innerHTML=`<div class="feature-card"><strong>Programmes</strong><span>création, enregistrement, suppression</span></div><div class="feature-card"><strong>Adhérents</strong><span>code, portail et partage</span></div><div class="feature-card"><strong>Nutrition</strong><span>repères concrets + exemples de repas</span></div><div class="feature-card"><strong>Business</strong><span>statut, montant, échéance</span></div>`;
    }
  };

  window.quickBuild = function(){
    const dur=Number(document.getElementById('quickDuration').value||45), style=document.getElementById('quickStyle').value, env=document.getElementById('quickEnv').value, audience=document.getElementById('quickPublic').value;
    const audienceHints={kids:'ludique, simple et sécurisé',teens:'dynamique, progressif et engageant',adults:'équilibré, utile et adaptable',seniors:'contrôlé, stable et sécurisant',athletes:'plus dense, plus spécifique et exigeant'};
    const styleMap={amrap:'conditioning',emom:'conditioning',interval:'conditioning',zone2:'trail'};
    const realStyle=styleMap[style]||style;
    const warmup=chooseDiverseExercises({level:audience==='athletes'?'advanced':'intermediate',env,equipment:PRESETS[env]||[],style:realStyle,goals:realStyle==='mobility'?['mobility','stability','rotation']:['mobility','core','cardio'],count:3,excludeBases:[]});
    const mainGoals = realStyle==='strength'?['push','pull','quads','hamstrings','core'] : realStyle==='boxing'?['boxing','rotation','single_leg','conditioning','core'] : realStyle==='hyrox'?['sled','carry','row','ski','core'] : realStyle==='trail'?['cardio','single_leg','calves','hamstrings','core'] : realStyle==='mobility'?['mobility','stability','rotation','breathing','core'] : ['squat','push','pull','cardio','core'];
    const main=chooseDiverseExercises({level:audience==='athletes'?'advanced':'intermediate',env,equipment:PRESETS[env]||[],style:realStyle,goals:mainGoals,count:5,excludeBases:warmup.map(ex=>baseName(ex))});
    const finisher=chooseDiverseExercises({level:audience==='athletes'?'advanced':'intermediate',env,equipment:PRESETS[env]||[],style:realStyle==='strength'?'mobility':realStyle,goals:realStyle==='mobility'||realStyle==='recovery'?['breathing','mobility','stability']:['core','mobility','cardio'],count:2,excludeBases:warmup.concat(main).map(ex=>baseName(ex))});
    const blockTitle = style==='emom'?'Bloc EMOM (chaque minute sur la minute)' : style==='amrap'?'Bloc AMRAP (maximum de tours)' : style==='interval'?'Bloc intervalles' : style==='zone2'?'Bloc Zone 2 (endurance fondamentale)' : realStyle==='mobility'?'Bloc mobilité' : realStyle==='strength'?'Bloc principal force / musculation' : 'Bloc principal';
    document.getElementById('quickOutput').innerHTML = `<div class="quick-layout"><div class="panel panel-hero"><div class="section-mini-head"><h3>Séance rapide ${esc(frStyleLabel(style))}</h3><p>${dur} minutes · ${esc(ENV_LABELS[env]||env)} · ${esc(audienceLabel(audience))}</p></div><div class="quick-block"><h4>Échauffement</h4><div class="quick-list">${warmup.map(ex=>quickCard(ex,prescriptionForQuick(realStyle,'warmup',dur))).join('')}</div></div><div class="quick-block"><h4>${blockTitle}</h4><div class="quick-list">${main.map(ex=>quickCard(ex,prescriptionForQuick(realStyle,'main',dur))).join('')}</div></div><div class="quick-block"><h4>Retour au calme</h4><div class="quick-list">${finisher.map(ex=>quickCard(ex,prescriptionForQuick(realStyle,'finisher',dur))).join('')}</div></div></div><div class="quick-rail"><div class="panel"><h3>Logique de séance</h3><div class="small-muted">Public : ${audienceHints[audience]||'adaptable'}.</div><div class="small-muted">Style : ${esc(frStyleLabel(style))}.</div><div class="small-muted">Volume cible : ${dur<=20?'court et dense':dur<=30?'efficace et simple':dur<=45?'complet et polyvalent':'plus développé et progressif'}.</div></div><div class="panel"><h3>Glossaire FR</h3><div class="nutrition-list"><div><strong>HIIT :</strong> intervalles haute intensité</div><div><strong>AMRAP :</strong> maximum de tours dans le temps donné</div><div><strong>EMOM :</strong> chaque minute sur la minute</div><div><strong>Zone 2 :</strong> endurance fondamentale, effort confortable</div></div></div></div></div>`;
  };

  const oldAutoFill = window.autoFill;
  window.autoFill = function(){ if(oldAutoFill) oldAutoFill(); const goal=document.getElementById('mainGoal')?.value; const env=document.getElementById('environmentSelect')?.value; if(goal && document.getElementById('quickStyle') && !document.getElementById('quickStyle').dataset.userTouched){ if(goal==='muscle_gain') document.getElementById('quickStyle').value='strength'; else if(goal==='fat_loss') document.getElementById('quickStyle').value='conditioning'; else if(STYLE_FR[goal]) document.getElementById('quickStyle').value=goal; } if(env && document.getElementById('quickEnv') && !document.getElementById('quickEnv').dataset.userTouched){ document.getElementById('quickEnv').value=env; } };

  document.addEventListener('DOMContentLoaded', ()=>{
    patchQuickOptions();
    localizeAllOptions();
    setTimeout(()=>{ localizeAllOptions(); if(window.renderHome) renderHome(); },200);
    const qs=document.getElementById('quickStyle'); if(qs) qs.addEventListener('change',()=>qs.dataset.userTouched='1');
    const qe=document.getElementById('quickEnv'); if(qe) qe.addEventListener('change',()=>qe.dataset.userTouched='1');
  });
})();
