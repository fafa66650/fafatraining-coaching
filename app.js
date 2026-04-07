
let EXERCISES = [];
let META = {};
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

function openTab(id){
  qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab===id));
  qsa('.tab-panel').forEach(p => p.classList.toggle('active', p.id===id));
  const target = document.getElementById(id);
  if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
}

function bindHomeButtons(){
  const btnProgram = document.getElementById('homeCreateProgram');
  const btnLibrary = document.getElementById('homeOpenLibrary');
  if(btnProgram) btnProgram.onclick = () => openTab('coach');
  if(btnLibrary) btnLibrary.onclick = () => openTab('library');
}

async function init(){
  EXERCISES = await fetch('./data/exercises.json').then(r=>r.json());
  META = await fetch('./data/meta.json').then(r=>r.json());
  bindHomeButtons();
  fillDynamicFields();
  hydrateAthleteFromLink();
  renderLibrary();
  renderHomeStats();
}
function renderHomeStats(){
  const total = EXERCISES.length;
  const homeExerciseCount = document.getElementById('homeExerciseCount');
  if(homeExerciseCount) homeExerciseCount.textContent = total;
}
function fillDynamicFields(){
  qs('#environment').innerHTML = Object.entries(META.environments).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  qs('#goalsGrid').innerHTML = Object.entries(META.goals).map(([k,v])=>`<label class="chip"><input type="checkbox" value="${k}" ${k==='health' ? 'checked' : ''}> <span>${v}</span></label>`).join('');
  qs('#equipmentGrid').innerHTML = Object.entries(META.equipment).map(([k,v])=>`<label class="chip"><input type="checkbox" value="${k}"> <span>${v}</span></label>`).join('');
  qs('#filterType').innerHTML += [...new Set(EXERCISES.map(e=>e.type))].sort().map(t=>`<option value="${t}">${prettyType(t)}</option>`).join('');
  qs('#filterEnvironment').innerHTML += Object.entries(META.environments).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  applyEquipmentPreset();
  qs('#environment').addEventListener('change', applyEquipmentPreset);
}
function prettyType(t){
  return {
    strength:'Musculation',
    machine:'Machine guidée',
    accessory:'Accessoire / isolation',
    core:'Core / gainage',
    hiit:'HIIT',
    cardio:'Cardio',
    boxing:'Boxe',
    hyrox:'Hyrox / fonctionnel',
    mobility:'Mobilité',
    wellness:'Bien-être'
  }[t] || t;
}
function applyEquipmentPreset(){
  qsa('#equipmentGrid input').forEach(x=>x.checked=false);
  const env = qs('#environment').value;
  const preset = {
    gym:['barbell','rack','bench','dumbbells','cable','machines','treadmill','bike','rower','elliptical','airbike','medball'],
    crossfit:['barbell','dumbbells','kettlebells','rower','skierg','airbike','sled','medball','battle_rope','box','ladder'],
    boxing_gym:['bodyweight','rope','heavy_bag','pads','gloves','bands'],
    home:['bodyweight','dumbbells','bands','kettlebells','trx','abwheel'],
    outdoor:['bodyweight','bands','rope','ladder','box','sled','medball'],
    bodyweight:['bodyweight']
  }[env] || [];
  preset.forEach(key=>{
    const el = qs(`#equipmentGrid input[value="${key}"]`);
    if(el) el.checked = true;
  });
}
function selectedGoals(){ return qsa('#goalsGrid input:checked').map(x=>x.value); }
function selectedEquipment(){ return qsa('#equipmentGrid input:checked').map(x=>x.value); }

function recommendedFrequency(level, activity, goals){
  if(level==='beginner' && activity==='sedentary') return 3;
  if(goals.includes('strength') || goals.includes('muscle_gain')) return level==='advanced' ? 5 : 4;
  if(goals.includes('boxing') || goals.includes('conditioning') || goals.includes('hyrox') || goals.includes('endurance')) return 4;
  if(goals.includes('mobility')) return 3;
  return 3;
}
function sessionStructure(goals, duration){
  const d = Number(duration);
  return {
    warmup: d >= 60 ? 10 : 8,
    main: d >= 75 ? 35 : d >= 60 ? 28 : 20,
    secondary: d >= 75 ? 18 : d >= 60 ? 14 : 10,
    finisher: goals.includes('conditioning') || goals.includes('fat_loss') || goals.includes('boxing') || goals.includes('hyrox') ? (d >= 60 ? 8 : 5) : 0,
    cooldown: goals.includes('mobility') || goals.includes('health') || goals.includes('boxing') ? 5 : 3,
  };
}
function computePrescription(ex, level, goals, oneRMMap){
  let series = 3, reps = "10-12", rest = "1 min", tempo = "", intensity = "modérée", load = "à l'effort propre";
  const advanced = level === 'advanced';
  const inter = level === 'intermediate';

  if(ex.type === 'hiit'){
    const format = goals.includes('boxing') ? "3 x 2 min / récup 1 min"
      : goals.includes('hyrox') ? "40s travail / 20s repos x 6"
      : goals.includes('fat_loss') ? "30s travail / 30s repos x 6"
      : "20s travail / 20s repos x 8";
    return {series: advanced?5:4, reps: format, rest:"1 min entre tours", tempo:"", intensity:"cardio", load:"poids du corps / léger"};
  }
  if(ex.type === 'cardio'){
    const format = goals.includes('endurance') ? "12 à 20 min" : goals.includes('hyrox') ? "6 x 250 m / récup 60s" : "8 à 15 min";
    return {series:1, reps: format, rest:"-", tempo:"", intensity:"zone 2 à intense", load:"selon machine"};
  }
  if(ex.type === 'boxing'){
    const format = goals.includes('boxing') ? (advanced ? "4 x 3 min" : inter ? "4 x 2 min" : "3 x 2 min") : "3 x 90s";
    return {series: advanced?4:3, reps: format, rest:"45s à 1 min", tempo:"", intensity:"technique + cardio", load:"selon vitesse / puissance"};
  }
  if(ex.type === 'mobility' || ex.type === 'wellness'){
    return {series:2, reps:"30 à 60 sec / côté", rest:"15 à 20 sec", tempo:"lent", intensity:"douce", load:"poids du corps"};
  }
  if(ex.type === 'core'){
    return {series:3, reps: advanced ? "40 à 60 sec" : "8 à 12 reps / 20 à 40 sec", rest:"30 à 45 sec", tempo:"contrôlé", intensity:"gainage", load:"poids du corps"};
  }

  if(goals.includes('strength')){
    series = advanced ? 5 : 4; reps = "4-6"; rest = "2 à 3 min"; tempo = "2-0-1"; intensity = "lourde";
  } else if(goals.includes('muscle_gain')){
    series = 4; reps = ex.type === 'accessory' ? "12-15" : "8-12"; rest = ex.type==='accessory' ? "45 à 60 sec" : "1 min 15 à 1 min 45"; tempo = "3-1-1"; intensity = "modérée à lourde";
  } else if(goals.includes('fat_loss') || goals.includes('conditioning') || goals.includes('hyrox')){
    series = 3; reps = ex.type === 'accessory' ? "12-20" : "10-15"; rest = "30 à 60 sec"; tempo = "2-0-1"; intensity = "continue";
  } else {
    series = 3; reps = "8-12"; rest = "60 à 90 sec"; tempo = "contrôlé"; intensity = "modérée";
  }

  if(level==='beginner'){
    series = Math.max(2, series-1);
    rest = ex.type==='accessory' ? "45 à 60 sec" : "60 à 90 sec";
    if(reps==="4-6") reps="6-8";
  }

  if(ex.strength_lift && ex.lift_key && oneRMMap[ex.lift_key] > 0){
    let pct = goals.includes('strength') ? "75–85%" : goals.includes('muscle_gain') ? "65–75%" : "55–70%";
    let avg = goals.includes('strength') ? 0.80 : goals.includes('muscle_gain') ? 0.70 : 0.62;
    let kg = Math.round(oneRMMap[ex.lift_key] * avg * 2)/2;
    load = `${pct} 1RM ≈ ${kg} kg`;
  } else {
    load = goals.includes('strength') ? "charge lourde mais propre" : goals.includes('muscle_gain') ? "charge moyenne à lourde" : "charge légère à modérée";
  }

  return {series, reps, rest, tempo, intensity, load};
}
function exerciseMatches(ex, env, level, goals, equipment){
  const levelOk = ({beginner:1, intermediate:2, advanced:3}[ex.level] || 1) <= ({beginner:1, intermediate:2, advanced:3}[level] || 1);
  const envOk = ex.environments.includes(env) || (env === 'crossfit' && ['gym','outdoor'].some(v => ex.environments.includes(v))) || (env === 'boxing_gym' && ['gym','home','outdoor','boxing_gym'].some(v => ex.environments.includes(v)));
  const goalOk = goals.some(g => ex.goals.includes(g)) || goals.length===0;
  const eqOk = ex.equipment.some(eq => equipment.includes(eq) || eq === 'bodyweight');
  return levelOk && envOk && goalOk && eqOk;
}
function randomPick(arr, n){
  return [...arr].sort(()=>Math.random()-0.5).slice(0, Math.min(n, arr.length));
}
function buildWarmup(goals){
  const lines = [];
  lines.push("2 à 4 min de mise en route générale");
  if(goals.includes('boxing')) lines.push("Corde à sauter légère ou shadow boxing technique");
  if(goals.includes('hyrox') || goals.includes('conditioning')) lines.push("Montées de genoux, jumping jacks, mobilité dynamique");
  if(goals.includes('muscle_gain') || goals.includes('strength')) lines.push("Mobilité active + séries de chauffe progressives");
  if(goals.includes('mobility') || goals.includes('health')) lines.push("Mobilité hanches, épaules et respiration");
  return [...new Set(lines)];
}
function generateProgram(){
  const clientName = qs('#clientName').value.trim() || 'Athlète';
  const clientCode = qs('#clientCode').value.trim().toUpperCase();
  const age = Number(qs('#age').value || 30);
  const level = qs('#level').value;
  const env = qs('#environment').value;
  const activity = qs('#activity').value;
  const goals = selectedGoals();
  const equipment = selectedEquipment();
  const duration = Number(qs('#duration').value || 60);
  const frequency = qs('#frequency').value === 'auto' ? recommendedFrequency(level, activity, goals) : Number(qs('#frequency').value);
  const oneRMMap = {
    squat: Number(qs('#rmSquat').value || 0),
    bench: Number(qs('#rmBench').value || 0),
    deadlift: Number(qs('#rmDeadlift').value || 0)
  };
  const structure = sessionStructure(goals, duration);
  const pool = EXERCISES.filter(ex => exerciseMatches(ex, env, level, goals, equipment));

  const sessions = [];
  for(let i=0;i<frequency;i++){
    const primaries = randomPick(pool.filter(x => ['strength','machine'].includes(x.type)), goals.includes('strength') ? 3 : 2);
    const accessories = randomPick(pool.filter(x => ['accessory','core','mobility','wellness'].includes(x.type)), 2);
    const conditioners = randomPick(pool.filter(x => ['hiit','cardio','boxing','hyrox'].includes(x.type)), 2);
    const block = [...primaries, ...accessories];
    if(structure.finisher > 0) block.push(...conditioners.slice(0,1));
    sessions.push({
      title: frequency===2 ? (i===0 ? "Séance A" : "Séance B") : `Séance ${i+1}`,
      warmup: buildWarmup(goals),
      exercises: block.map(ex => ({...ex, prescription: computePrescription(ex, level, goals, oneRMMap)})),
      cooldown: goals.includes('mobility') || goals.includes('boxing') || goals.includes('health') ? ["Respiration diaphragmatique 2–4 min","Mobilité ciblée 3–5 min"] : ["Retour au calme 2–3 min"]
    });
  }

  const summary = {
    clientName, clientCode, age, level, environment: META.environments[env], frequency, duration,
    goals: goals.map(g => META.goals[g]), equipment: equipment.map(e => META.equipment[e]),
    structure, sessions, oneRMMap
  };
  window.__currentProgram = summary;
  qs('#coachOutput').innerHTML = renderProgram(summary, true);
}
function renderProgram(program, coachView){
  return `
    <div class="summary">
      <h3>${program.clientName}${program.clientCode ? ' · ' + program.clientCode : ''}</h3>
      <div class="meta">
        Niveau : <strong>${prettyLevel(program.level)}</strong> · Environnement : <strong>${program.environment}</strong> · Séances / semaine : <strong>${program.frequency}</strong> · Durée : <strong>${program.duration} min</strong><br>
        Objectifs : <strong>${program.goals.join(' / ')}</strong><br>
        Structure séance : Échauffement ${program.structure.warmup} min · Bloc principal ${program.structure.main} min · Bloc complémentaire ${program.structure.secondary} min${program.structure.finisher ? ' · Finisher ' + program.structure.finisher + ' min' : ''} · Retour au calme ${program.structure.cooldown} min
      </div>
    </div>
    <div class="program-grid">
      ${program.sessions.map(s => `
        <article class="program-day">
          <div class="pills"><span class="pill">${s.title}</span><span class="pill">${program.duration} min</span></div>
          <h3>${s.title}</h3>
          <p><strong>Échauffement</strong></p>
          <ul class="list">${s.warmup.map(x => `<li>${x}</li>`).join('')}</ul>
          <p><strong>Corps de séance</strong></p>
          <ul class="list">
            ${s.exercises.map(ex => `<li>
              <strong>${ex.name}</strong> — ${ex.muscles}<br>
              ${ex.prescription.series} séries · ${ex.prescription.reps} · repos ${ex.prescription.rest}${ex.prescription.tempo ? ' · tempo ' + ex.prescription.tempo : ''}<br>
              Intensité : ${ex.prescription.intensity}${coachView ? ' · Charge : ' + ex.prescription.load : ''}<br>
              Conseils : ${ex.cues}<br>
              Variante facile : ${ex.easy_variant} · Variante avancée : ${ex.hard_variant}
            </li>`).join('')}
          </ul>
          <p><strong>Retour au calme</strong></p>
          <ul class="list">${s.cooldown.map(x => `<li>${x}</li>`).join('')}</ul>
        </article>
      `).join('')}
    </div>`;
}
function prettyLevel(l){ return {beginner:'Débutant', intermediate:'Intermédiaire', advanced:'Avancé'}[l] || l; }
function saveAthletePlan(){
  if(!window.__currentProgram){ alert("Génère d'abord un programme."); return; }
  if(!window.__currentProgram.clientCode){ alert("Ajoute un code athlète."); return; }
  const all = JSON.parse(localStorage.getItem('fafa_v10_plans') || '{}');
  all[window.__currentProgram.clientCode] = window.__currentProgram;
  localStorage.setItem('fafa_v10_plans', JSON.stringify(all));
  alert("Programme enregistré pour l’athlète.");
}
function exportProgram(){
  if(!window.__currentProgram){ alert("Génère d'abord un programme."); return; }
  const html = renderProgram(window.__currentProgram, false);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Programme FAFATRAINING</title><style>body{font-family:Arial;padding:28px;background:#fff;color:#000}.summary,.program-day{border:1px solid #ccc;border-radius:12px;padding:14px;margin-bottom:14px}.list li{margin:6px 0}</style></head><body>${html}</body></html>`);
  w.document.close();
}
function openAthletePlan(){
  const code = qs('#athleteCodeInput').value.trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafa_v10_plans') || '{}');
  if(!all[code]){ alert("Aucun programme trouvé pour ce code."); return; }
  const plan = all[code];
  qs('#athleteLobby').classList.add('hidden');
  qs('#athletePlanWrap').classList.remove('hidden');
  qs('#athleteTitle').textContent = `${plan.clientName} · ${plan.clientCode}`;
  qs('#athletePlan').innerHTML = renderProgram(plan, false);
}
function backToAthleteLobby(){
  qs('#athletePlanWrap').classList.add('hidden');
  qs('#athleteLobby').classList.remove('hidden');
}
function printAthleteProgram(){ window.print(); }
function generateQuickSession(){
  const level = qs('#quickLevel').value;
  const duration = Number(qs('#quickDuration').value || 30);
  const type = qs('#quickType').value;
  const pool = EXERCISES.filter(ex => ex.type === type || (type==='conditioning' && ['hiit','cardio'].includes(ex.type)) || (type==='mobility' && ['mobility','wellness','core'].includes(ex.type)));
  const chosen = randomPick(pool, duration >= 60 ? 6 : duration >= 45 ? 5 : 4);
  qs('#quickOutput').innerHTML = `
    <div class="summary">
      <h3>Session rapide ${prettyType(type)}</h3>
      <div class="meta">Public : <strong>${prettyLevel(level)}</strong> · Durée : <strong>${duration} min</strong></div>
    </div>
    <div class="program-grid">
      <article class="program-day">
        <h3>Déroulé</h3>
        <ul class="list">
          <li>Échauffement : 5 à 8 min</li>
          ${chosen.map((ex, i) => {
            const p = computePrescription(ex, level, [type], {squat:0, bench:0, deadlift:0});
            return `<li><strong>Bloc ${i+1} :</strong> ${ex.name} — ${p.series} séries · ${p.reps} · repos ${p.rest}</li>`;
          }).join('')}
          <li>Retour au calme : 3 à 5 min</li>
        </ul>
      </article>
    </div>`;
}
function renderLibrary(){
  const type = qs('#filterType').value;
  const level = qs('#filterLevel').value;
  const env = qs('#filterEnvironment').value;
  const q = (qs('#librarySearch').value || '').toLowerCase().trim();
  const filtered = EXERCISES.filter(ex => {
    const blob = [ex.name, ex.muscles, ex.category, ex.description, ex.cues, ...ex.equipment, ...ex.goals].join(' ').toLowerCase();
    return (!type || ex.type===type) &&
           (!level || ex.level===level || ({beginner:1, intermediate:2, advanced:3}[ex.level] <= {beginner:1, intermediate:2, advanced:3}[level])) &&
           (!env || ex.environments.includes(env)) &&
           (!q || blob.includes(q));
  });
  qs('#libraryStats').textContent = `${filtered.length} exercice(s) affiché(s) sur ${EXERCISES.length}.`;
  qs('#libraryGrid').innerHTML = filtered.map(ex => `
    <article class="card">
      <div class="pills">
        <span class="pill">${prettyType(ex.type)}</span>
        <span class="pill">${prettyLevel(ex.level)}</span>
      </div>
      <h3>${ex.name}</h3>
      <p><strong>Catégorie :</strong> ${ex.category}</p>
      <p><strong>Muscles :</strong> ${ex.muscles}</p>
      <p><strong>Lieux :</strong> ${ex.environments.map(x => META.environments[x] || x).join(', ')}</p>
      <p><strong>Matériel :</strong> ${ex.equipment.map(x => META.equipment[x] || x).join(', ')}</p>
      <p><strong>Comment faire :</strong> ${ex.description}</p>
      <p><strong>Consignes :</strong> ${ex.cues}</p>
      <p><strong>Variante facile :</strong> ${ex.easy_variant}</p>
      <p><strong>Variante avancée :</strong> ${ex.hard_variant}</p>
    </article>
  `).join('');
}
function saveProgress(){
  const code = qs('#progressCode').value.trim().toUpperCase();
  if(!code){ alert("Ajoute un code athlète."); return; }
  const weight = qs('#progressWeight').value || '';
  const note = qs('#progressNote').value || '';
  const all = JSON.parse(localStorage.getItem('fafa_v10_progress') || '{}');
  all[code] = all[code] || [];
  all[code].push({date:new Date().toLocaleDateString('fr-FR'), weight, note});
  localStorage.setItem('fafa_v10_progress', JSON.stringify(all));
  alert("Suivi enregistré.");
}
function loadProgress(){
  const code = qs('#progressCode').value.trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafa_v10_progress') || '{}');
  const rows = all[code] || [];
  qs('#progressOutput').innerHTML = rows.length ? `
    <div class="card-grid">
      ${rows.map(r => `<article class="card"><h3>${r.date}</h3><p><strong>Poids :</strong> ${r.weight || '-'} kg</p><p><strong>Note :</strong> ${r.note || '-'}</p></article>`).join('')}
    </div>` : `<div class="notice">Aucun historique pour ce code.</div>`;
}
function resetCoachForm(){ qs('#coachOutput').innerHTML=''; }
function hydrateAthleteFromLink(){
  const p = new URLSearchParams(window.location.search);
  const code = p.get('client');
  if(code){ openTab('athlete'); qs('#athleteCodeInput').value = code.toUpperCase(); }
}
init();
