
let EXERCISES=[];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['dumbbell','Haltères'],['barbell','Barre'],['bench','Banc'],['rack','Rack'],
  ['cable','Poulie'],['machine','Machines'],['kettlebell','Kettlebell'],['trx','TRX'],['battle_rope','Battle rope'],
  ['treadmill','Tapis'],['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],
  ['med_ball','Medicine ball'],['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde'],
  ['ladder','Échelle'],['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],
  ['skierg','SkiErg'],['dip_bars','Barres dips'],['landmine','Landmine'],['box','Box / step']
];
const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','treadmill','bike','elliptical','rower'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band'],
  home:['bodyweight','dumbbell','kettlebell','band','trx','bench','bike'],
  outdoor:['bodyweight','band','ladder','rope','sled'],
  bodyweight_only:['bodyweight']
};

function goView(id){
  $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===id));
  const target = document.getElementById(id);
  if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
}
function initNav(){
  $$('.navbtn').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.view)));
}
async function init(){
  EXERCISES = await fetch('data/exercises.json').then(r=>r.json());
  const countEl = $('#exerciseCount');
  if(countEl) countEl.textContent = EXERCISES.length;
  initNav();
  bindHeroButtons();
  buildEquipmentGrid();
  buildLibraryFilters();
  renderLibrary();
  loadTracking();
}
function bindHeroButtons(){
  const buttons = [...document.querySelectorAll('.hero-actions button')];
  if(buttons[0]) buttons[0].addEventListener('click', ()=>goView('coach'));
  if(buttons[1]) buttons[1].addEventListener('click', ()=>goView('library'));
}
function buildEquipmentGrid(){
  $('#equipmentGrid').innerHTML = EQUIPMENTS.map(([k,l])=>`<label class="chk"><input type="checkbox" value="${k}"> <span>${l}</span></label>`).join('');
  applyEquipmentPreset();
  $('#environmentSelect').addEventListener('change', applyEquipmentPreset);
}
function applyEquipmentPreset(){
  const env = $('#environmentSelect').value;
  const preset = PRESETS[env] || [];
  $$('#equipmentGrid input').forEach(i => i.checked = preset.includes(i.value));
  $('#presetLabel').textContent = `Préselection : ${env}`;
}
function buildLibraryFilters(){
  const cats = [''].concat([...new Set(EXERCISES.map(e=>e.category))]);
  $('#libCategory').innerHTML = cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML = ['','gym','crossfit_box','boxing_gym','home','outdoor','bodyweight_only'].map(v=>`<option value="${v}">${v || 'Tous les lieux'}</option>`).join('');
}
function selectedEquipment(){ return $$('#equipmentGrid input:checked').map(i=>i.value); }
function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

function goalToCategories(main, second){
  const goals=[main, second].filter(Boolean);
  const map={
    muscle_gain:['musculation','core'],
    fat_loss:['hiit','cardio','musculation','core'],
    strength:['musculation','core'],
    conditioning:['hiit','cardio','hyrox','core'],
    boxing:['boxe','hiit','core','cardio'],
    hyrox:['hyrox','cardio','musculation','core','hiit'],
    endurance:['cardio','hiit','mobilité'],
    mobility:['mobilité','bien_etre','core'],
    recovery:['bien_etre','mobilité'],
  };
  return [...new Set(goals.flatMap(g=>map[g]||['musculation']))];
}
function calcFreq(){
  return Number($('#clientFreq').value||3);
}
function calcDuration(){ return Number($('#clientDuration').value||60); }

function chooseExercises(categorySet, env, level, equipment){
  const levelOrder = {beginner:1, intermediate:2, advanced:3};
  let arr = EXERCISES.filter(e =>
    categorySet.includes(e.category) &&
    (e.environments.includes(env) || (env==='crossfit_box' && (e.environments.includes('gym')||e.environments.includes('crossfit_box'))) || (env==='boxing_gym' && (e.environments.includes('gym')||e.environments.includes('boxing_gym')))) &&
    levelOrder[e.level] <= levelOrder[level] &&
    e.equipment.some(eq => equipment.includes(eq) || eq==='bodyweight')
  );
  if (!arr.length) arr = EXERCISES.filter(e => categorySet.includes(e.category));
  return arr;
}
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function buildPrescription(ex, mainGoal, level, hiitFormat, rmMap){
  const isBegin = level==='beginner', isInter=level==='intermediate';
  let series='3', reps='10-12', rest='60 sec', tempo='2-0-2', intensity='modérée', loadText='à ajuster selon technique';
  const lowerName = ex.name.toLowerCase();

  if (ex.category==='hiit'){
    series = hiitFormat.includes('/') ? '4 à 8 tours' : '4 tours';
    reps = `${hiitFormat} travail/repos`;
    rest = 'entre exercices inclus dans le format';
    tempo = 'rythme athlétique';
    intensity = level==='advanced' ? 'élevée' : level==='intermediate' ? 'soutenue' : 'progressive';
  } else if (ex.category==='cardio'){
    series='1 bloc';
    reps = lowerName.includes('sprint') ? '8 à 12 efforts' : (lowerName.includes('intervalles') ? '8 à 20 min' : '12 à 30 min');
    rest = lowerName.includes('intervalles') || lowerName.includes('sprint') ? 'selon format' : 'continu';
    tempo = 'cadence régulière';
    intensity = mainGoal==='fat_loss' ? 'modérée à soutenue' : 'endurance contrôlée';
  } else if (ex.category==='boxe'){
    series = isBegin ? '4 rounds' : isInter ? '5 rounds' : '6 rounds';
    reps = isBegin ? '1 min 30 à 2 min / round' : '2 à 3 min / round';
    rest = '45 à 60 sec';
    tempo = 'fluide / explosif';
    intensity = 'technique + cardio';
  } else if (['mobilité','bien_etre'].includes(ex.category)){
    series='2 à 4 séries';
    reps = ex.category==='bien_etre' ? '2 à 8 min' : '30 à 60 sec ou 6 à 10 reps';
    rest='respiration libre';
    tempo='lent et contrôlé';
    intensity='faible';
  } else if (ex.category==='hyrox'){
    series = isBegin ? '3 à 4 séries' : '4 à 5 séries';
    reps = lowerName.includes('carry') || lowerName.includes('sled') ? '20 à 40 m' : '10 à 20 reps';
    rest = isBegin ? '75 sec' : '60 sec';
    tempo='athlétique';
    intensity='soutenue';
  } else { // muscu/core
    if (mainGoal==='strength'){
      series = isBegin ? '4 séries' : '5 séries';
      reps = isBegin ? '6 à 8 reps' : '4 à 6 reps';
      rest = isBegin ? '90 sec' : '2 à 3 min';
      tempo='3-1-1';
      intensity='lourde';
    } else if (mainGoal==='muscle_gain'){
      series = isBegin ? '3 à 4 séries' : '4 séries';
      reps = '8 à 12 reps';
      rest = '60 à 90 sec';
      tempo='2-0-2';
      intensity='modérée à lourde';
    } else if (mainGoal==='fat_loss'){
      series='3 séries';
      reps='12 à 20 reps';
      rest='30 à 45 sec';
      tempo='contrôlé';
      intensity='modérée';
    } else {
      series = ex.category==='core' ? '3 séries' : '3 à 4 séries';
      reps = ex.category==='core' ? '8 à 15 reps ou 30 à 45 sec' : '8 à 15 reps';
      rest = ex.category==='core' ? '30 à 45 sec' : '60 sec';
      tempo='contrôlé';
      intensity='progressive';
    }

    if (lowerName.includes('squat')){
      const rm = rmMap.squat || 0;
      if (rm > 0 && (lowerName.includes('barre') || lowerName.includes('back squat') || lowerName.includes('front squat'))){
        const pct = mainGoal==='strength' ? 0.80 : mainGoal==='muscle_gain' ? 0.72 : 0.60;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM squat)`;
      }
    }
    if (lowerName.includes('développé couché') || lowerName.includes('bench')){
      const rm = rmMap.bench || 0;
      if (rm > 0){
        const pct = mainGoal==='strength' ? 0.80 : mainGoal==='muscle_gain' ? 0.72 : 0.60;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM bench)`;
      }
    }
    if (lowerName.includes('deadlift') || lowerName.includes('rdl')){
      const rm = rmMap.deadlift || 0;
      if (rm > 0){
        const pct = mainGoal==='strength' ? 0.78 : mainGoal==='muscle_gain' ? 0.70 : 0.58;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM deadlift)`;
      }
    }
  }

  return {series,reps,rest,tempo,intensity,loadText};
}

function generateProgram(){
  const name = $('#clientName').value.trim() || 'Client FAFATRAINING';
  const code = ($('#clientCode').value.trim() || '').toUpperCase() || ('FT'+Math.floor(Math.random()*9000+1000));
  $('#clientCode').value = code;
  const level = $('#clientLevel').value;
  const freq = calcFreq();
  const duration = calcDuration();
  const env = $('#environmentSelect').value;
  const mainGoal = $('#mainGoal').value;
  const secondGoal = $('#secondGoal').value;
  const hiitFormat = $('#hiitFormat').value;
  const equipment = selectedEquipment();
  const categories = goalToCategories(mainGoal, secondGoal);
  const pool = chooseExercises(categories, env, level, equipment);
  const rmMap = {
    squat:Number($('#rmSquat').value||0),
    bench:Number($('#rmBench').value||0),
    deadlift:Number($('#rmDeadlift').value||0)
  };

  const perDay = duration>=75 ? 7 : duration>=60 ? 6 : duration>=45 ? 5 : 4;
  const days = [];
  for(let d=0; d<freq; d++){
    const chosen = shuffle(pool).slice(0, perDay);
    const title = freq===2 ? (d===0?'Séance A':'Séance B') :
                  freq===3 ? ['Full body 1','Full body 2','Full body 3'][d] || `Séance ${d+1}` :
                  freq===4 ? ['Bas du corps','Haut du corps','Conditioning','Mix complet'][d] || `Séance ${d+1}` :
                  `Séance ${d+1}`;
    const items = chosen.map(ex=>({...ex, prescription:buildPrescription(ex, mainGoal, level, hiitFormat, rmMap)}));
    days.push({title, items});
  }

  const warmup = mainGoal==='boxing'
    ? ['Mobilité épaules 2 min','Shadow boxing 2 rounds','Appuis / coordination 3 min']
    : mainGoal==='hyrox'
    ? ['Cardio progressif 5 min','Mobilité hanches/chevilles','Activation bas du corps et gainage']
    : mainGoal==='mobility' || mainGoal==='recovery'
    ? ['Respiration 2 min','Mobilité douce 5 min','Activation légère']
    : ['Cardio léger 5 min','Mobilité dynamique','2 séries progressives du 1er exercice'];

  const cooldown = ['Retour au calme 3 à 5 min','Respiration lente','Mobilité ciblée / étirements doux'];

  const program = {name, code, level, freq, duration, env, mainGoal, secondGoal, hiitFormat, warmup, cooldown, days, rmMap, createdAt:new Date().toISOString()};
  window.currentProgram = program;
  $('#programOutput').innerHTML = renderProgram(program, true);
}
function renderProgram(p, coachView){
  return `
    <div class="summary">
      <h3>${esc(p.name)} · ${esc(p.code)}</h3>
      <p><strong>Objectif principal :</strong> ${esc(p.mainGoal)} ${p.secondGoal ? `· <strong>objectif secondaire :</strong> ${esc(p.secondGoal)}`:''}</p>
      <p><strong>Niveau :</strong> ${esc(p.level)} · <strong>Fréquence :</strong> ${p.freq} / semaine · <strong>Durée :</strong> ${p.duration} min · <strong>Environnement :</strong> ${esc(p.env)}</p>
      <div class="meta">${p.warmup.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</div>
    </div>
    <div class="program-days">
      ${p.days.map((day,idx)=>`
        <article class="day-card">
          <h4>${esc(day.title)}</h4>
          ${day.items.map(ex=>`
            <div class="ex-item">
              <div class="meta">
                <span class="badge">${esc(ex.category)}</span>
                <span class="badge">${esc(ex.subcategory)}</span>
                <span class="badge">${esc(ex.level)}</span>
              </div>
              <strong>${esc(ex.name)}</strong><br>
              Muscles : ${esc(ex.muscles)}<br>
              Séries : <strong>${esc(ex.prescription.series)}</strong> · Rép / temps : <strong>${esc(ex.prescription.reps)}</strong><br>
              Repos : <strong>${esc(ex.prescription.rest)}</strong> · Tempo : <strong>${esc(ex.prescription.tempo)}</strong> · Intensité : <strong>${esc(ex.prescription.intensity)}</strong><br>
              ${coachView ? `Charge conseillée : <strong>${esc(ex.prescription.loadText)}</strong><br>`:''}
              Consigne coach : ${esc(ex.cue)}<br>
              Variante facile : ${esc(ex.easy)} · Variante avancée : ${esc(ex.hard)}
            </div>
          `).join('')}
        </article>
      `).join('')}
    </div>
    <div class="summary">
      <h3>Retour au calme</h3>
      <div class="meta">${p.cooldown.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</div>
    </div>
  `;
}
function saveForAthlete(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  all[window.currentProgram.code] = window.currentProgram;
  localStorage.setItem('fafaPrograms', JSON.stringify(all));
  alert(`Programme enregistré pour l’adhérent : ${window.currentProgram.code}`);
}
function printProgram(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Programme FAFATRAINING</title><style>body{font-family:Arial;padding:24px} .day{border:1px solid #ddd;border-radius:12px;padding:14px;margin:14px 0} .item{margin:10px 0;padding-top:10px;border-top:1px solid #eee} h1{margin:0 0 8px}</style></head><body><h1>${window.currentProgram.name}</h1>${window.currentProgram.days.map(d=>`<div class="day"><h2>${d.title}</h2>${d.items.map(ex=>`<div class="item"><strong>${ex.name}</strong><br>Séries : ${ex.prescription.series} · Rép / temps : ${ex.prescription.reps} · Repos : ${ex.prescription.rest}<br>Consigne : ${ex.cue}<br>Variante facile : ${ex.easy} · Variante avancée : ${ex.hard}</div>`).join('')}</div>`).join('')}</body></html>`);
  w.document.close();
  w.focus();
}
function renderLibrary(){
  const cat = $('#libCategory').value;
  const level = $('#libLevel').value;
  const env = $('#libEnv').value;
  const q = ($('#libSearch').value||'').toLowerCase().trim();
  const lvl = {beginner:1, intermediate:2, advanced:3};
  const arr = EXERCISES.filter(ex => 
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || ex.environments.includes(env)) &&
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...ex.tags].join(' ').toLowerCase().includes(q))
  );
  $('#libraryOutput').innerHTML = arr.map(ex=>`
    <article class="library-card">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.subcategory)}</span>
        <span class="badge">${esc(ex.level)}</span>
      </div>
      <h4>${esc(ex.name)}</h4>
      <p><strong>Muscles :</strong> ${esc(ex.muscles)}</p>
      <p><strong>Lieux :</strong> ${esc(ex.environments.join(', '))}</p>
      <p><strong>Matériel :</strong> ${esc(ex.equipment.join(', '))}</p>
      <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
      <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
    </article>
  `).join('');
}
function openAthleteProgram(){
  const code = ($('#athleteCode').value||'').trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const p = all[code];
  if(!p){ alert('Aucun programme trouvé pour ce code.'); return; }
  window.athleteProgram = p;
  $('#athleteLobby').classList.add('hidden');
  $('#athleteProgram').classList.remove('hidden');
  $('#athleteProgramOutput').innerHTML = renderProgram(p, false);
}
function backAthlete(){
  $('#athleteProgram').classList.add('hidden');
  $('#liveSession').classList.add('hidden');
  $('#athleteLobby').classList.remove('hidden');
}
function startLiveSession(){
  if(!window.athleteProgram) return;
  window.liveFlat = window.athleteProgram.days.flatMap(d => d.items.map(x=>({...x, day:d.title})));
  window.liveIndex = 0;
  $('#liveSession').classList.remove('hidden');
  renderLive();
}
function renderLive(){
  const ex = window.liveFlat[window.liveIndex];
  $('#liveCard').innerHTML = `
    <div class="meta"><span class="badge">${esc(ex.day)}</span><span class="badge">${esc(ex.category)}</span></div>
    <h3>${esc(ex.name)}</h3>
    <p class="big">${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</p>
    <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
    <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
  `;
}
function nextExercise(){ if(window.liveIndex < window.liveFlat.length-1){ window.liveIndex++; renderLive(); } }
function prevExercise(){ if(window.liveIndex > 0){ window.liveIndex--; renderLive(); } }
function backProgram(){ $('#liveSession').classList.add('hidden'); }

function generateQuickSession(){
  const type = $('#quickType').value, level = $('#quickLevel').value, duration = Number($('#quickDuration').value), env = $('#quickEnv').value;
  const pool = chooseExercises(goalToCategories(type,''), env, level, PRESETS[env]||['bodyweight']);
  const blocks = Math.max(3, Math.min(6, Math.round(duration/10)));
  const items = shuffle(pool).slice(0, blocks*2);
  $('#quickOutput').innerHTML = `
    <div class="summary"><h3>Session rapide ${esc(type)}</h3><p>${duration} min · ${esc(level)} · ${esc(env)}</p></div>
    <div class="program-days">
      ${Array.from({length:blocks}).map((_,i)=>`
      <article class="day-card">
        <h4>Bloc ${i+1}</h4>
        ${items.slice(i*2,i*2+2).map(ex=>`
          <div class="ex-item"><strong>${esc(ex.name)}</strong><br>Format conseillé : ${type==='conditioning' || type==='hyrox' ? '40 sec effort / 20 sec repos x 3' : type==='boxing' ? '2 min round / 45 sec repos x 3' : '3 séries de 10 à 15 reps'}<br>Consigne : ${esc(ex.cue)}</div>
        `).join('')}
      </article>`).join('')}
    </div>`;
}
function saveTracking(){
  const code = ($('#trackCode').value||'').trim().toUpperCase();
  const weight = $('#trackWeight').value;
  const note = $('#trackNote').value;
  if(!code){ alert('Ajoute un code.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  all[code] = all[code] || [];
  all[code].push({date:new Date().toLocaleDateString('fr-FR'), weight, note});
  localStorage.setItem('fafaTracking', JSON.stringify(all));
  loadTracking();
}
function loadTracking(){
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  const rows = Object.entries(all).flatMap(([code,items]) => items.map(it=>({code,...it}))).reverse();
  $('#trackingOutput').innerHTML = rows.map(r=>`<article class="library-card"><h4>${esc(r.code)}</h4><p><strong>Date :</strong> ${esc(r.date)}</p><p><strong>Poids :</strong> ${esc(r.weight || '-')} kg</p><p><strong>Note :</strong> ${esc(r.note || '')}</p></article>`).join('');
}
init();
