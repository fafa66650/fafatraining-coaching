
const LEVELS = ["debutant","intermediaire","avance"];
let exercises = [];
let programs = [];

let user = JSON.parse(localStorage.getItem("fafatraining_user_v7")) || {
  xp: 0,
  level: "debutant",
  streak: 0,
  day: 0,
  objective: "masse",
  equipment: ["poids_corps","halteres","barre","machine","poulie","cardio","kettlebell","box_crossfit","corde","sac_boxe","gants","elastique"],
  fatigue: 2,
  history: [],
  completed: 0,
  coachMode: "client"
};

Promise.all([
  fetch("data/exercises.json").then(r=>r.json()),
  fetch("data/programs.json").then(r=>r.json())
]).then(([ex, pr])=>{
  exercises = ex;
  programs = pr;
  go("home");
});

function save(){
  localStorage.setItem("fafatraining_user_v7", JSON.stringify(user));
}

function setActive(route){
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active", b.dataset.route===route));
}

function updateHeader(){
  const next = nextLevelXP();
  const pct = Math.min(100, Math.round((user.xp / next) * 100));
  document.getElementById("quickStats").innerHTML = `
    <b>${user.level.toUpperCase()}</b><br>
    ${user.xp} XP · ${user.streak} 🔥 · ${pct}%
  `;
}

function nextLevelXP(){
  if(user.level === "debutant") return 450;
  if(user.level === "intermediaire") return 1000;
  return 1800;
}

function syncLevel(){
  if(user.xp >= 1000) user.level = "avance";
  else if(user.xp >= 450) user.level = "intermediaire";
  else user.level = "debutant";
}

function go(route){
  setActive(route);
  updateHeader();
  const v = document.getElementById("view");
  if(!v) return;

  if(route === "home"){
    const program = getCurrentProgram();
    v.innerHTML = `
      <section class="hero">
        <h2>Ta séance intelligente est prête.</h2>
        <p>Objectif : <b>${labelObjective(user.objective)}</b>. Niveau : <b>${labelLevel(user.level)}</b>. Le coach adapte volume, intensité et choix des exercices selon ton matériel et ta fatigue.</p>
        <button class="btn" onclick="go('program')">COMMENCER LA SÉANCE</button>
        <button class="btn secondary" onclick="go('coach')">RÉGLER MON PROFIL</button>
      </section>

      <div class="grid3" style="margin-top:14px">
        <div class="card"><h3>${user.completed}</h3><p class="small">séances terminées</p></div>
        <div class="card"><h3>${user.streak} 🔥</h3><p class="small">streak actuel</p></div>
        <div class="card"><h3>${program.nom}</h3><p class="small">programme actif</p></div>
      </div>

      <div class="card success">
        <h3>Smart Coach</h3>
        <p class="small">${coachAdvice()}</p>
      </div>
    `;
  }

  if(route === "program"){
    renderProgram();
  }

  if(route === "library"){
    renderLibrary();
  }

  if(route === "stats"){
    renderStats();
  }

  if(route === "coach"){
    renderCoach();
  }
}

function labelLevel(l){
  return {debutant:"Débutant", intermediaire:"Intermédiaire", avance:"Avancé"}[l] || l;
}
function labelObjective(o){
  return {masse:"Prise de masse", perte:"Perte de poids", force:"Force", crossfit:"CrossTraining", boxe:"Boxe", forme:"Remise en forme"}[o] || o;
}

function getCurrentProgram(){
  return programs.find(p=>p.objectif === user.objective) || programs[0];
}

function renderProgram(){
  const v = document.getElementById("view");
  const program = getCurrentProgram();
  const day = program.jours[user.day % program.jours.length];
  const session = buildSession(day);

  let html = `
    <div class="card">
      <span class="pill">Jour ${(user.day % program.jours.length)+1}/${program.jours.length}</span>
      <span class="pill">${labelObjective(user.objective)}</span>
      <h2>${day.nom}</h2>
      <p class="small">${program.description}</p>
      <div class="meta">
        <span>Fatigue ${user.fatigue}/5</span>
        <span>${session.length} exercices</span>
        <span>Adapté matériel</span>
      </div>
    </div>
  `;

  html += session.map((item, idx)=> exerciseCard(item, idx+1)).join("");
  html += `
    <div class="card warning">
      <h3>Consigne coach</h3>
      <p class="small">${sessionIntensityAdvice()}</p>
    </div>
    <button class="btn" onclick="finishSession()">SÉANCE TERMINÉE</button>
    <button class="btn secondary" onclick="renderProgram()">RECOMPOSER LA SÉANCE</button>
  `;
  v.innerHTML = html;
}

function buildSession(day){
  const categories = day.categories || [];
  const count = day.count || 6;
  const lastIds = user.history.slice(-3).flatMap(h => h.exercises || []);
  let pool = exercises.filter(e => 
    categories.includes(e.categorie) &&
    hasEquipment(e) &&
    !lastIds.includes(e.id)
  );

  if(pool.length < count){
    pool = exercises.filter(e => categories.includes(e.categorie) && hasEquipment(e));
  }
  if(pool.length < count){
    pool = exercises.filter(e => hasEquipment(e));
  }

  // Smart sorting: prioritize objective tags, then safer/less volume when fatigue high
  pool = pool.map(e => {
    let score = 0;
    if((e.objectifs || []).includes(user.objective)) score += 4;
    if(user.fatigue >= 4 && ["mobilite","stretching","core"].includes(e.categorie)) score += 2;
    if(user.fatigue <= 2 && ["force","masse","crossfit","cardio"].some(t => (e.objectifs||[]).includes(t))) score += 1;
    score += Math.random();
    return {...e, _score: score};
  }).sort((a,b)=>b._score-a._score);

  return pool.slice(0,count).map(e => adaptExercise(e));
}

function hasEquipment(e){
  return (e.materiel || []).some(m => user.equipment.includes(m));
}

function adaptExercise(ex){
  const variant = {...ex.variantes[user.level]};
  let modifier = 1;

  if(user.fatigue >= 4) modifier = 0.75;
  if(user.fatigue <= 1) modifier = 1.1;

  if(typeof variant.reps === "number"){
    variant.reps = Math.max(4, Math.round(variant.reps * modifier));
  }
  if(variant.series && user.fatigue >= 4){
    variant.series = Math.max(2, variant.series - 1);
  }

  return {
    id: ex.id,
    baseName: ex.nom,
    icon: ex.imageIcon || "💪",
    categorie: ex.categorie,
    muscles: ex.muscles || [],
    consignes: ex.consignes,
    materiel: ex.materiel || [],
    ...variant
  };
}

function exerciseCard(item, index){
  const volume = item.temps ? item.temps : `${item.series || ""} x ${item.reps || ""} reps`;
  return `
    <div class="card exercise">
      <div class="icon">${item.icon}</div>
      <div style="width:100%">
        <span class="pill">#${index}</span>
        <h3>${item.nom}</h3>
        <p><b>${volume}</b> · Repos ${item.repos || "45s"}</p>
        <p class="small">${item.consignes || ""}</p>
        <div class="meta">
          ${(item.muscles || []).slice(0,3).map(m=>`<span>${m}</span>`).join("")}
          <span>${item.categorie}</span>
        </div>
      </div>
    </div>
  `;
}

function sessionIntensityAdvice(){
  if(user.fatigue >= 4) return "Fatigue élevée : le coach réduit un peu le volume. Reste propre techniquement, pas besoin de forcer à l’échec.";
  if(user.fatigue <= 1) return "Tu es frais : garde une exécution propre et monte l’intensité sur les deux derniers exercices.";
  return "Rythme équilibré : cherche la régularité, la qualité et une intensité contrôlée.";
}

function coachAdvice(){
  if(user.history.length === 0) return "Démarre par une séance complète. L’app ajustera ensuite selon ton historique.";
  const last = user.history[user.history.length-1];
  if(user.fatigue >= 4) return "Tu as indiqué une fatigue haute : privilégie technique, mobilité et récupération active.";
  return `Dernière séance : ${last.dayName}. Continue la rotation pour progresser sans répéter toujours les mêmes muscles.`;
}

function finishSession(){
  const program = getCurrentProgram();
  const day = program.jours[user.day % program.jours.length];
  const session = buildSession(day);
  const xpGain = user.fatigue >= 4 ? 80 : user.fatigue <= 1 ? 140 : 120;

  user.xp += xpGain;
  user.streak += 1;
  user.completed += 1;
  user.history.push({
    date: new Date().toISOString(),
    objective: user.objective,
    dayName: day.nom,
    xp: xpGain,
    fatigue: user.fatigue,
    exercises: session.map(s=>s.id)
  });
  if(user.history.length > 30) user.history = user.history.slice(-30);
  user.day += 1;
  syncLevel();
  save();
  go("stats");
}

function renderLibrary(){
  const v = document.getElementById("view");
  const grouped = {};
  exercises.forEach(e=>{
    grouped[e.categorie] = grouped[e.categorie] || [];
    grouped[e.categorie].push(e);
  });

  let html = `<div class="card"><h2>Bibliothèque</h2><p class="small">${exercises.length} exercices réels avec variantes par niveau, matériel, consignes et catégories.</p></div>`;
  Object.entries(grouped).forEach(([cat, list])=>{
    html += `<div class="card"><h3>${cat.toUpperCase()} · ${list.length}</h3>`;
    html += list.slice(0,12).map(e=>`<span class="pill">${e.imageIcon || "💪"} ${e.nom}</span>`).join("");
    if(list.length > 12) html += `<p class="small">+ ${list.length - 12} autres exercices dans cette catégorie</p>`;
    html += `</div>`;
  });
  v.innerHTML = html;
}

function renderStats(){
  const v = document.getElementById("view");
  const next = nextLevelXP();
  const pct = Math.min(100, Math.round((user.xp / next) * 100));
  const last = user.history.slice(-7);
  const bars = last.length ? last.map(h=>`<div class="bar" style="height:${Math.max(8,Math.min(140,h.xp))}px" title="${h.dayName}"></div>`).join("") : `<div class="bar" style="height:10px"></div>`;

  v.innerHTML = `
    <div class="card">
      <h2>Progression</h2>
      <p>Niveau : <b>${labelLevel(user.level)}</b></p>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <p class="small">${user.xp} XP / ${next} XP</p>
    </div>
    <div class="grid3">
      <div class="card"><h3>${user.completed}</h3><p class="small">séances</p></div>
      <div class="card"><h3>${user.streak}</h3><p class="small">streak</p></div>
      <div class="card"><h3>${user.history.length}</h3><p class="small">historique</p></div>
    </div>
    <div class="card">
      <h3>7 dernières séances</h3>
      <div class="chart">${bars}</div>
    </div>
    <div class="card">
      <h3>Derniers entraînements</h3>
      ${user.history.slice(-5).reverse().map(h=>`<p class="small">✅ ${h.dayName} · ${h.xp} XP · fatigue ${h.fatigue}/5</p>`).join("") || "<p class='small'>Aucune séance terminée.</p>"}
    </div>
  `;
}

function renderCoach(){
  const v = document.getElementById("view");
  const allEquip = ["poids_corps","halteres","barre","machine","poulie","cardio","kettlebell","box_crossfit","corde","sac_boxe","gants","elastique","medecine_ball","barre_traction","battle_rope","ab_wheel"];
  v.innerHTML = `
    <div class="card">
      <h2>Smart Coach</h2>
      <p class="small">Règle ton objectif, ta fatigue et ton matériel. La séance s’adapte automatiquement.</p>
      <label>Objectif</label>
      <select id="objective">
        ${["masse","perte","force","crossfit","boxe","forme"].map(o=>`<option value="${o}" ${user.objective===o?"selected":""}>${labelObjective(o)}</option>`).join("")}
      </select>
      <label>Niveau</label>
      <select id="level">
        ${LEVELS.map(l=>`<option value="${l}" ${user.level===l?"selected":""}>${labelLevel(l)}</option>`).join("")}
      </select>
      <label>Fatigue aujourd’hui : <b id="fatigueLabel">${user.fatigue}/5</b></label>
      <input id="fatigue" type="range" min="1" max="5" value="${user.fatigue}" oninput="document.getElementById('fatigueLabel').innerText=this.value+'/5'">
      <button class="btn" onclick="saveCoach()">ENREGISTRER</button>
    </div>
    <div class="card">
      <h3>Matériel disponible</h3>
      <div class="grid2">
      ${allEquip.map(m=>`
        <label class="small"><input type="checkbox" class="equip" value="${m}" ${user.equipment.includes(m)?"checked":""}> ${m}</label>
      `).join("")}
      </div>
    </div>
    <div class="card warning">
      <h3>Mode Coach / Client</h3>
      <p class="small">Base prête pour gérer plusieurs clients plus tard. Pour l’instant, tout est sauvegardé localement sur l’appareil.</p>
    </div>
    <button class="btn danger" onclick="resetApp()">RÉINITIALISER MES DONNÉES</button>
  `;
}

function saveCoach(){
  user.objective = document.getElementById("objective").value;
  user.level = document.getElementById("level").value;
  user.fatigue = Number(document.getElementById("fatigue").value);
  user.equipment = Array.from(document.querySelectorAll(".equip:checked")).map(e=>e.value);
  if(user.equipment.length === 0) user.equipment = ["poids_corps"];
  save();
  go("home");
}

function resetApp(){
  if(!confirm("Réinitialiser la progression FAFATRAINING ?")) return;
  localStorage.removeItem("fafatraining_user_v7");
  user = {xp:0,level:"debutant",streak:0,day:0,objective:"masse",equipment:["poids_corps","halteres"],fatigue:2,history:[],completed:0,coachMode:"client"};
  save();
  go("home");
}
