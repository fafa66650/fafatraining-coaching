
let DATA = null;
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function openTab(id){
  qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.target===id));
  qsa('.tab-panel').forEach(p => p.classList.toggle('active', p.id===id));
}

async function init(){
  DATA = await fetch('data.json').then(r => r.json());
  qs('#statExercises').textContent = DATA.exercises.length;
  qs('#goal').innerHTML = DATA.goals.map(g => `<option value="${g.key}">${g.label}</option>`).join('');
  qs('#singleGoal').innerHTML = DATA.goals.map(g => `<option value="${g.key}">${g.label}</option>`).join('');
  qs('#equipmentGrid').innerHTML = DATA.equipmentOptions.map(k => `
    <label class="equip-chip"><input type="checkbox" value="${k}" checked> ${prettyEquip(k)}</label>
  `).join('');
  const cats = [...new Set(DATA.exercises.map(e => e.category))].sort();
  qs('#libCategory').innerHTML += cats.map(c => `<option value="${c}">${prettyCategory(c)}</option>`).join('');
  renderLibrary();
}

function prettyEquip(k){
  const m = {
    bodyweight:'Poids du corps', band:'Élastiques', dumbbell:'Haltères', barbell:'Barre', bench:'Banc', rack:'Rack',
    machine:'Machines', cable:'Poulie / câble', kettlebell:'Kettlebell', trx:'TRX', rope:'Corde à sauter', airbike:'Air bike',
    bike:'Vélo', rower:'Rameur', skierg:'SkiErg', treadmill:'Tapis', medball:'Med ball', battle_ropes:'Battle rope',
    trapbar:'Trap bar', box:'Box / step', sled:'Traîneau', heavy_bag:'Sac de frappe', pads:'Pattes d’ours', ladder:'Échelle de rythme',
    cones:'Plots / cônes', ab_wheel:'Roue abdos', swissball:'Swiss ball', landmine:'Landmine', dip_bars:'Barres dips', slam_ball:'Slam ball'
  };
  return m[k] || k;
}
function prettyCategory(c){
  const m = {athletic:'Athlétique', boxing:'Boxe', cardio:'Cardio', conditioning:'Conditionnement', core:'Gainage', mobility:'Mobilité', strength:'Force / musculation'};
  return m[c] || c;
}
function trainingAgeBand(age){ return age < 16 ? 'youth' : age >= 55 ? 'senior' : 'adult'; }
function activityFactor(a){ return {sedentary:1.2, light:1.375, moderate:1.55, high:1.725}[a] || 1.2; }
function mifflin(sex, weight, height, age){
  return sex === 'female'
    ? 10*weight + 6.25*height - 5*age - 161
    : 10*weight + 6.25*height - 5*age + 5;
}
function recommendedFrequency(goal, level, activity){
  if (level === 'beginner' && activity === 'sedentary') return 3;
  if (goal === 'strength' || goal === 'hypertrophy') return level === 'advanced' ? 5 : 4;
  if (goal === 'endurance' || goal === 'conditioning') return 4;
  if (goal === 'health' || goal === 'recovery') return 3;
  if (goal === 'boxing' || goal === 'athletic') return 4;
  return 3;
}
function goalTemplate(goal){
  const map = {
    fat_loss:{reps:'10–15', rest:'45–75 s', intensity:'RPE 6–8', pct:'55–70%', structure:'full_body / circuit / cardio'},
    hypertrophy:{reps:'6–12', rest:'60–120 s', intensity:'RPE 7–9', pct:'65–80%', structure:'split ou full body selon fréquence'},
    recomp:{reps:'8–12', rest:'60–90 s', intensity:'RPE 7–8', pct:'60–75%', structure:'full body ou haut/bas'},
    strength:{reps:'3–6', rest:'2–4 min', intensity:'RPE 7–9', pct:'75–90%', structure:'mouvements de base + assistance'},
    health:{reps:'8–12', rest:'60–90 s', intensity:'RPE 5–7', pct:'50–65%', structure:'full body + mobilité + cardio léger'},
    conditioning:{reps:'travail en temps', rest:'30–90 s', intensity:'RPE 7–9', pct:'effort par intervalles', structure:'circuit / intervalles'},
    boxing:{reps:'rounds 2 à 3 min', rest:'45–75 s', intensity:'RPE 6–9', pct:'technique + intensité', structure:'skill + cardio + gainage'},
    athletic:{reps:'3–8', rest:'90–180 s', intensity:'RPE 6–8', pct:'puissance / vitesse', structure:'puissance + force + mobilité'},
    endurance:{reps:'temps / distance', rest:'selon protocole', intensity:'zone 2 + intervalles', pct:'allures', structure:'base aérobie + intervalle'},
    recovery:{reps:'flux / respiration', rest:'non applicable', intensity:'faible', pct:'non applicable', structure:'mobilité + respiration + marche'}
  };
  return map[goal] || map.health;
}
function selectedEquipment(){
  return qsa('#equipmentGrid input:checked').map(x => x.value);
}
function envAllowed(e, env){
  return e.environment.includes(env) || e.environment.includes('gym') && env==='gym' || e.environment.includes('home') && env==='home' || e.environment.includes('outdoor') && env==='outdoor';
}
function equipmentAllowed(e, equip, env){
  if (env==='outdoor' && e.environment.includes('outdoor')) return e.equipment.some(x => equip.includes(x) || ['none','bodyweight'].includes(x));
  return e.equipment.some(x => equip.includes(x) || ['none','bodyweight'].includes(x));
}
function levelRank(l){ return {beginner:1, intermediate:2, advanced:3}[l] || 1; }
function filterExercises(goal, level, env, equip){
  return DATA.exercises.filter(e =>
    e.goals.includes(goal) &&
    envAllowed(e, env) &&
    equipmentAllowed(e, equip, env) &&
    levelRank(e.level_min) <= levelRank(level)
  );
}
function pickUnique(pool, n, byName=true){
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const out = [];
  const seen = new Set();
  for (const item of shuffled){
    const key = byName ? item.name : JSON.stringify(item);
    if (!seen.has(key)){
      seen.add(key);
      out.push(item);
      if (out.length >= n) break;
    }
  }
  return out;
}
function bucketByPattern(list){
  const map = {};
  list.forEach(e => { (map[e.pattern] ||= []).push(e); });
  return map;
}
function exerciseBlock(ex, template, goal, ageBand){
  const youthAdj = ageBand === 'youth' ? 'réduire la charge, accent technique et maîtrise' : '';
  return `
    <li>
      <strong>${esc(ex.name)}</strong> — ${esc(ex.primary)}<br>
      Séries : <strong>${goal==='strength' ? '4 à 5' : goal==='hypertrophy' ? '3 à 5' : goal==='conditioning' ? '3 à 4 blocs' : '2 à 4'}</strong> ·
      Répétitions / temps : <strong>${esc(template.reps)}</strong> ·
      Repos : <strong>${esc(template.rest)}</strong> ·
      Intensité : <strong>${esc(template.intensity)}</strong> ·
      Charge cible : <strong>${esc(template.pct)}</strong><br>
      Tempo conseillé : <strong>${esc(ex.tempo || 'contrôlé')}</strong><br>
      Consigne coach : ${esc(ex.coaching)} ${youthAdj ? '· ' + youthAdj : ''}<br>
      Variantes : ${esc(ex.variants || '—')}
    </li>
  `;
}
function buildSession(goal, level, env, duration, focus, style, ageBand, equip){
  const pool = filterExercises(goal, level, env, equip);
  const byPattern = bucketByPattern(pool);
  const template = goalTemplate(goal);

  const warmup = DATA.exercises.filter(e => ['mobility','cardio','conditioning'].includes(e.category) && envAllowed(e, env)).slice(0, 4);
  let picks = [];
  const pickFrom = pat => pickUnique(byPattern[pat] || [], 1)[0];

  if (focus === 'lower'){
    picks = [pickFrom('squat'), pickFrom('hinge'), pickFrom('single_leg'), pickFrom('calves'), pickFrom('anti_extension')].filter(Boolean);
  } else if (focus === 'upper'){
    picks = [pickFrom('horizontal_push'), pickFrom('horizontal_pull'), pickFrom('vertical_push'), pickFrom('vertical_pull'), pickFrom('rear_delts')].filter(Boolean);
  } else if (focus === 'push'){
    picks = [pickFrom('horizontal_push'), pickFrom('vertical_push'), pickFrom('shoulder_isolation'), pickFrom('elbow_extension')].filter(Boolean);
  } else if (focus === 'pull'){
    picks = [pickFrom('horizontal_pull'), pickFrom('vertical_pull'), pickFrom('rear_delts'), pickFrom('elbow_flexion')].filter(Boolean);
  } else if (focus === 'core'){
    picks = [pickFrom('anti_extension'), pickFrom('anti_rotation'), pickFrom('anti_lateral_flexion'), pickFrom('rotation')].filter(Boolean);
  } else if (focus === 'cardio'){
    picks = pickUnique(pool.filter(e => ['cardio','conditioning'].includes(e.category)), duration >= 60 ? 6 : 4);
  } else if (focus === 'boxing'){
    picks = pickUnique(pool.filter(e => e.category==='boxing' || e.goals.includes('boxing') || e.goals.includes('athletic')), duration >= 60 ? 6 : 4);
  } else {
    picks = [pickFrom('squat'), pickFrom('hinge'), pickFrom('horizontal_push'), pickFrom('horizontal_pull'), pickFrom('anti_extension')].filter(Boolean);
    if (duration >= 60) {
      const extra = pickUnique(pool.filter(e => !picks.some(p => p.name===e.name)), 2);
      picks = picks.concat(extra);
    }
  }

  if (style === 'circuit') template.rest = '15–45 s entre exercices, 60–90 s entre tours';
  if (style === 'intervals') template.reps = '30–60 s de travail / 15–60 s de repos';
  const finisher = goal in {fat_loss:1, conditioning:1, boxing:1, endurance:1, athletic:1} ? pickUnique(DATA.exercises.filter(e => (e.category==='cardio' || e.category==='conditioning' || e.category==='boxing') && envAllowed(e, env)), 2) : [];

  return {
    warmup,
    picks,
    finisher,
    template,
    duration,
    style,
    focus,
    goal
  };
}
function renderSessionCard(session, title){
  return `
    <div class="session-card">
      <div class="pillbar">
        <span class="pill">${esc(title)}</span>
        <span class="pill">${esc(session.style)}</span>
        <span class="pill">${esc(session.focus)}</span>
      </div>
      <h3>Échauffement</h3>
      <ul class="list">${session.warmup.map(e => `<li><strong>${esc(e.name)}</strong> — 5 à 8 min de mise en route / mobilité.</li>`).join('')}</ul>
      <h3>Bloc principal</h3>
      <ul class="list">${session.picks.map(e => exerciseBlock(e, session.template, session.goal, window.__ageBand || 'adult')).join('')}</ul>
      <h3>Finisher</h3>
      <ul class="list">${session.finisher.length ? session.finisher.map(e => `<li><strong>${esc(e.name)}</strong> — 6 à 12 min, format ${esc(session.template.reps)}, intensité adaptée.</li>`).join('') : '<li>Optionnel selon fatigue, objectif et temps disponible.</li>'}</ul>
      <h3>Retour au calme</h3>
      <ul class="list"><li>3 à 8 min de respiration nasale, mobilité douce et étirements actifs.</li></ul>
    </div>
  `;
}
function generateProgram(){
  const age = Number(qs('#age').value || 30);
  const sex = qs('#sex').value;
  const height = Number(qs('#height').value || 175);
  const weight = Number(qs('#weight').value || 75);
  const level = qs('#level').value;
  const activity = qs('#activity').value;
  const goal = qs('#goal').value;
  const env = qs('#environment').value;
  const duration = Number(qs('#duration').value || 60);
  const equip = selectedEquipment();
  const ageBand = trainingAgeBand(age);
  window.__ageBand = ageBand;

  let frequency = qs('#frequency').value === 'auto' ? recommendedFrequency(goal, level, activity) : Number(qs('#frequency').value);
  const bmr = Math.round(mifflin(sex, weight, height, age));
  const tdee = Math.round(bmr * activityFactor(activity));
  let calorieTarget = tdee;
  if (goal === 'fat_loss') calorieTarget = Math.round(tdee - 300);
  if (goal === 'hypertrophy') calorieTarget = Math.round(tdee + 250);
  if (goal === 'recomp') calorieTarget = tdee;
  const protein = Math.round(weight * (goal === 'hypertrophy' ? 2.0 : goal === 'fat_loss' ? 2.0 : 1.6));

  const sessionFocuses = frequency <= 2 ? ['full_body','full_body'] :
                         frequency === 3 ? ['full_body','upper','lower'] :
                         frequency === 4 ? ['upper','lower','push','pull'] :
                         frequency === 5 ? ['lower','upper','full_body','lower','upper'] :
                         ['lower','upper','conditioning','lower','upper','athletic'];

  const style = goal === 'conditioning' || goal === 'fat_loss' ? 'circuit' : 'classic';
  const sessions = sessionFocuses.slice(0, frequency).map((focus, i) => buildSession(goal, level, env, duration, focus, style, ageBand, equip));

  qs('#programOutput').innerHTML = `
    <div class="week-box">
      <h3>Résumé profil</h3>
      <div class="meta">
        Âge : <strong>${age}</strong> · Niveau : <strong>${esc(level)}</strong> · Activité : <strong>${esc(activity)}</strong> ·
        Objectif : <strong>${esc(goal)}</strong> · Environnement : <strong>${esc(env)}</strong><br>
        BMR estimé : <strong>${bmr} kcal</strong> · Dépense journalière estimée : <strong>${tdee} kcal</strong> ·
        Cible calorique : <strong>${calorieTarget} kcal</strong> · Protéines conseillées : <strong>${protein} g/j</strong>
      </div>
      <p class="small">Les calories sont des estimations de départ. À ajuster selon évolution du poids, de la récupération, de la faim et des performances.</p>
    </div>
    <div class="week-box">
      <h3>Répartition hebdomadaire conseillée</h3>
      <ul class="list">
        <li>Fréquence proposée : <strong>${frequency} séance(s) / semaine</strong>.</li>
        <li>Durée cible : <strong>${duration} min</strong> par séance.</li>
        <li>Structure dominante : <strong>${esc(goalTemplate(goal).structure)}</strong>.</li>
        <li>Progression : ajouter 1 à 2 répétitions ou 2 à 5% de charge quand toutes les séries sont techniquement propres.</li>
      </ul>
    </div>
    <div class="exercise-grid">
      ${sessions.map((s, idx) => renderSessionCard(s, `Séance ${idx+1}`)).join('')}
    </div>
  `;
}
function generateSingleSession(){
  const goal = qs('#singleGoal').value;
  const level = qs('#singleLevel').value;
  const env = qs('#singleEnv').value;
  const duration = Number(qs('#singleDuration').value || 60);
  const focus = qs('#singleFocus').value;
  const style = qs('#singleStyle').value;
  const equip = selectedEquipment();
  window.__ageBand = 'adult';
  const session = buildSession(goal, level, env, duration, focus, style, 'adult', equip);
  qs('#sessionOutput').innerHTML = renderSessionCard(session, 'Séance générée');
}
function renderLibrary(){
  const cat = qs('#libCategory').value;
  const level = qs('#libLevel').value;
  const env = qs('#libEnv').value;
  const q = qs('#libSearch').value.toLowerCase().trim();
  const list = DATA.exercises.filter(e => {
    const blob = [e.name,e.primary,e.pattern,e.coaching,e.variants,...e.goals].join(' ').toLowerCase();
    return (!cat || e.category===cat) && (!level || e.level_min===level || levelRank(e.level_min) <= levelRank(level)) && (!env || e.environment.includes(env)) && (!q || blob.includes(q));
  });
  qs('#libraryGrid').innerHTML = list.map(e => `
    <article class="exercise-card">
      <div class="pillbar">
        <span class="pill">${esc(prettyCategory(e.category))}</span>
        <span class="pill">${esc(e.level_min)}</span>
        <span class="pill">${esc(e.pattern)}</span>
      </div>
      <h3>${esc(e.name)}</h3>
      <div class="story"><strong>Muscles / dominante :</strong> ${esc(e.primary)}</div>
      <div class="story"><strong>Matériel :</strong> ${esc(e.equipment.map(prettyEquip).join(', '))}</div>
      <div class="story"><strong>Lieu :</strong> ${esc(e.environment.join(', '))}</div>
      <div class="story"><strong>Objectifs :</strong> ${esc(e.goals.join(', '))}</div>
      <ul class="list">
        <li><strong>Tempo conseillé :</strong> ${esc(e.tempo || 'contrôlé')}</li>
        <li><strong>Consigne coach :</strong> ${esc(e.coaching)}</li>
        <li><strong>Variantes :</strong> ${esc(e.variants || '—')}</li>
      </ul>
    </article>
  `).join('');
}
function exportCurrent(id){
  const html = qs('#'+id).innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Export coach</title><style>body{font-family:Arial;padding:30px}.session-card,.week-box,.exercise-card{border:1px solid #ccc;border-radius:12px;padding:14px;margin-bottom:14px}.pill{display:inline-block;border:1px solid #aaa;border-radius:999px;padding:4px 8px;margin:2px}</style></head><body>${html}</body></html>`);
  win.document.close();
}
init();
