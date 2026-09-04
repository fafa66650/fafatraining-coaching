
import {loadState,saveState,uid,upsertAthlete,activeAthlete,removeAthlete,sessionsFor,exportState,importState} from "./storage.js";
import {bmi,readiness,generateSession,progressStats,e1rm} from "./coach-engine.js";

let state=loadState();
let exercises=[],programs=[];
let currentSession=null;
let wizardStep=0;
let wizard={};
let builder={};
let libraryFilter={q:"",family:"Tous",group:"Tous",equipment:"Tous"};
let timerInterval=null;
let timerSeconds=0;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safe=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const visualPath=name=>`assets/visuals/${name||"coaching.jpeg"}`;
const logoPath=()=>`assets/logo/${[...document.querySelectorAll("img")].length?"logo-fafatraining.jpg":"logo-fafatraining.jpg"}`;

function toast(msg){
  const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}
function go(route){ location.hash=route; }
function route(){ return (location.hash||"#home").slice(1).split("?")[0]; }
function qparam(key){ return new URLSearchParams((location.hash.split("?")[1]||"")).get(key); }
function active(){ return activeAthlete(state); }
function hFor(){ const a=active();return a?sessionsFor(state,a.id):[]; }

async function init(){
  [exercises,programs]=await Promise.all([
    fetch("data/exercises.json?v=79").then(r=>r.json()),
    fetch("data/programs.json?v=79").then(r=>r.json())
  ]);
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  window.addEventListener("hashchange",render);
  if(!state.athletes.length && route()!=="onboarding") go("onboarding");
  else render();
}

function chrome(content,{nav=true}={}){
  const a=active();
  return `<div class="shell">
    <header class="topbar no-print">
      <button class="brand" data-go="home" style="background:none;border:0;color:white;text-align:left">
        <img src="${logoPath()}" alt="FAFATRAINING">
        <span>FAFATRAINING<small>REAL ATHLETE SYSTEM</small></span>
      </button>
      ${a?`<button class="avatar-switch" data-go="athletes">👤 ${safe(a.firstName||a.name||"Profil")} ▾</button>`:""}
    </header>
    ${content}
  </div>${nav?navBar():""}`;
}
function navBar(){
  const r=route();
  const item=(to,icon,label,match=to)=>`<button class="${r===match?"active":""}" data-go="${to}"><b>${icon}</b>${label}</button>`;
  return `<nav class="nav no-print">
    ${item("home","⌂","Accueil")}
    ${item("create","＋","Créer")}
    ${item("library","▦","Exercices")}
    ${item("progress","⌁","Progrès")}
    ${item("athletes","◎","Profils")}
  </nav>`;
}

function render(){
  clearInterval(timerInterval);timerInterval=null;
  const r=route();
  if(!state.athletes.length && r!=="onboarding") {go("onboarding");return;}
  const map={
    home:homePage, onboarding:onboardingPage, create:createPage, session:sessionPage,
    live:livePage, library:libraryPage, progress:progressPage, athletes:athletesPage,
    profile:profileEditPage
  };
  document.getElementById("app").innerHTML=(map[r]||homePage)();
  bind();
}

function homePage(){
  const a=active(), history=hFor(), stats=progressStats(history);
  const last=history[0];
  const heroProgram=programs.find(p=>p.goal===(a?.primaryGoal||"remise_en_forme"))||programs[0];
  const rd=readiness(a||{}, {fatigue:3,stress:3,sleep:a?.sleep||3,pain:0});
  return chrome(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Ton coach FAFATRAINING</p>
        <h1>${a?.firstName?safe(a.firstName)+", ":""}on sait quoi faire aujourd’hui.</h1>
        <p>Une séance claire, adaptée à ton niveau, ton matériel et ton état du jour. Pas besoin de chercher dans dix menus.</p>
        <div class="action-row">
          <button class="btn primary" data-go="create">Créer ma séance</button>
          ${last?`<button class="btn secondary" data-open-session="${last.id}">Revoir ma dernière séance</button>`:""}
        </div>
      </div>
      <div class="hero-media"><img src="${visualPath(heroProgram.visual)}" alt=""></div>
    </section>

    <div class="section-title"><div><h2>En un coup d’œil</h2><p>Seulement les informations utiles.</p></div></div>
    <section class="card-grid">
      <button class="quick-card" data-go="create"><b>⚡ Séance du jour</b><span>Objectif + état du jour → séance générée.</span></button>
      <button class="quick-card" data-go="progress"><b>${stats.completed} séances</b><span>${stats.totalMinutes} minutes enregistrées.</span></button>
      <button class="quick-card" data-go="library"><b>${exercises.length} exercices</b><span>Variantes, matériel, muscles, consignes.</span></button>
      <button class="quick-card" data-go="profile"><b>Disponibilité ${rd}%</b><span>Profil, niveau, objectifs et matériel.</span></button>
    </section>

    <div class="section-title"><div><h2>Choisir un univers</h2><p>Le style de séance change vraiment selon le choix.</p></div></div>
    <section class="program-grid">
      ${programs.slice(0,12).map(p=>`<button class="program-card" data-program="${p.goal}">
        <img src="${visualPath(p.visual)}" alt="">
        <div class="content"><span class="icon">${p.icon}</span><b>${safe(p.name)}</b><p>${safe(p.benefit)}</p></div>
      </button>`).join("")}
    </section>

    <aside class="coach-tip">
      <img src="${visualPath("avatar-coach.jpeg")}" alt="Coach FAFATRAINING">
      <div class="copy"><span class="badge">FAFA TE CONSEILLE</span><h3>Tu n’as que 20 minutes ?</h3><p>Choisis 20 min dans “Créer”. Le moteur raccourcit les blocs et garde la priorité de ta séance au lieu de simplement couper au hasard.</p></div>
    </aside>
  `);
}

function onboardingPage(){
  const steps=[
    ["Bienvenue","On crée ton profil en quelques choix simples."],
    ["Qui es-tu ?","Les données de base servent à adapter le volume et les repères."],
    ["Ton objectif","Choisis une priorité et, si tu veux, un objectif secondaire."],
    ["Ton niveau","On adapte les exercices et les prescriptions."],
    ["Ton contexte","Lieu, matériel et fréquence habituelle."],
    ["Tes limites","Zones à protéger et préférences."],
    ["Résumé","Vérifie. Ensuite l’application fait le reste."]
  ];
  const [title,sub]=steps[wizardStep];
  return chrome(`<div class="wizard">
    <header class="wizard-head">
      <img class="logo" src="${logoPath()}" alt="">
      <p class="eyebrow">Onboarding ${wizardStep+1}/7</p>
      <h1>${title}</h1><p>${sub}</p>
      <div class="progress">${steps.map((_,i)=>`<i class="${i<=wizardStep?"on":""}"></i>`).join("")}</div>
    </header>
    <section class="wizard-card">${onboardStep()}</section>
  </div>`,{nav:false});
}
function onboardStep(){
  if(wizardStep===0) return `
    <h2>Une application qui s’adapte à toi.</h2>
    <p>Tu répondras à une seule chose à la fois. Tu pourras tout modifier ensuite.</p>
    <div class="choice-grid">
      <button class="choice selected"><span class="emoji">🎯</span><b>Séances personnalisées</b><small>Objectif, niveau, temps et matériel.</small></button>
      <button class="choice selected"><span class="emoji">📈</span><b>Progression</b><small>Historique, charges, volume et records.</small></button>
      <button class="choice selected"><span class="emoji">🧠</span><b>Adaptation du jour</b><small>Fatigue, stress, sommeil et douleur.</small></button>
    </div>
    <div class="wizard-actions"><span></span><button class="btn primary" data-wizard-next>Commencer</button></div>`;
  if(wizardStep===1) return `
    <h2>Les informations essentielles</h2><p>Pas de formulaire interminable.</p>
    <div class="form-grid">
      ${field("firstName","Prénom",wizard.firstName||"","text","Ton prénom")}
      ${field("age","Âge",wizard.age||"","number","Ex. 35")}
      ${field("height","Taille (cm)",wizard.height||"","number","Ex. 175")}
      ${field("weight","Poids (kg)",wizard.weight||"","number","Ex. 78")}
    </div>${wizardNav(true)}`;
  if(wizardStep===2) return `
    <h2>Qu’est-ce que tu veux améliorer en priorité ?</h2><p>Ce choix influence toute la construction de la séance.</p>
    <div class="choice-grid">${programs.map(p=>`<button class="choice ${wizard.primaryGoal===p.goal?"selected":""}" data-wiz-goal="${p.goal}">
      <span class="emoji">${p.icon}</span><b>${p.name}</b><small>${p.benefit}</small></button>`).join("")}</div>
    <div class="field full" style="margin-top:14px"><label>Objectif secondaire (optionnel)</label>
      <input id="secondaryGoal" value="${safe(wizard.secondaryGoal||"")}" placeholder="Ex. améliorer mon cardio, préparer un 10 km…"></div>
    ${wizardNav(true)}`;
  if(wizardStep===3) return `
    <h2>Ton niveau actuel</h2><p>Choisis celui qui correspond à ta pratique réelle, pas celui que tu aimerais avoir.</p>
    <div class="choice-grid">${[
      ["Débutant","Je reprends ou j’apprends les bases."],["Intermédiaire","Je m’entraîne régulièrement."],
      ["Avancé","Je maîtrise les principaux mouvements."],["Expert","Je pratique à haut niveau / très régulièrement."]
    ].map(([v,d])=>`<button class="choice ${wizard.level===v?"selected":""}" data-wiz-level="${v}"><b>${v}</b><small>${d}</small></button>`).join("")}</div>
    ${wizardNav(true)}`;
  if(wizardStep===4) return `
    <h2>Où et avec quoi t’entraînes-tu ?</h2><p>Tu peux sélectionner plusieurs matériels.</p>
    <div class="form-grid">
      <div class="field"><label>Lieu principal</label><select id="place">
        ${["Maison","Salle","Extérieur","Gymnase","Mixte"].map(x=>`<option ${wizard.place===x?"selected":""}>${x}</option>`).join("")}
      </select></div>
      <div class="field"><label>Séances par semaine</label><select id="frequency">
        ${[1,2,3,4,5,6].map(x=>`<option value="${x}" ${Number(wizard.frequency||3)===x?"selected":""}>${x}</option>`).join("")}
      </select></div>
      <div class="field"><label>Durée habituelle</label><select id="duration">
        ${[20,30,45,60].map(x=>`<option value="${x}" ${Number(wizard.duration||30)===x?"selected":""}>${x} min</option>`).join("")}
      </select></div>
    </div>
    <div class="field full" style="margin-top:14px"><label>Matériel disponible</label><div class="chip-wrap">
      ${equipmentOptions().map(x=>`<button class="chip ${(wizard.equipment||[]).includes(x)?"on":""}" data-wiz-equipment="${x}">${x}</button>`).join("")}
    </div></div>${wizardNav(true)}`;
  if(wizardStep===5) return `
    <h2>Zones à protéger et préférences</h2><p>Ces informations servent à filtrer les exercices, pas à établir un diagnostic.</p>
    <div class="field full"><label>Zones à protéger</label><div class="chip-wrap">
      ${["Épaule","Genou","Dos / lombaires","Cheville","Poignet","Hanches","Aucune"].map(x=>`<button class="chip ${(wizard.injuries||[]).includes(x)?"on":""}" data-wiz-injury="${x}">${x}</button>`).join("")}
    </div></div>
    <div class="field full" style="margin-top:14px"><label>Notes / préférences (optionnel)</label>
      <textarea id="notes" placeholder="Ex. je n’aime pas courir, je préfère les haltères…">${safe(wizard.notes||"")}</textarea></div>
    ${wizardNav(true)}`;
  const b=bmi(wizard.weight,wizard.height);
  return `<h2>Ton profil est prêt</h2><p>Tu pourras le modifier à tout moment.</p>
    <div class="summary-list">
      ${summaryItem("Prénom",wizard.firstName||"—")}
      ${summaryItem("Objectif",programs.find(p=>p.goal===wizard.primaryGoal)?.name||"—")}
      ${summaryItem("Niveau",wizard.level||"—")}
      ${summaryItem("Fréquence",`${wizard.frequency||3} séance(s)/semaine`)}
      ${summaryItem("Durée",`${wizard.duration||30} min`)}
      ${summaryItem("IMC",b.value?`${b.value} · ${b.label}`:"Non calculé")}
      ${summaryItem("Lieu",wizard.place||"—")}
      ${summaryItem("Matériel",(wizard.equipment||[]).join(", ")||"Poids du corps")}
    </div>
    <div class="wizard-actions"><button class="btn secondary" data-wizard-prev>Retour</button><button class="btn primary" data-save-onboarding>Créer mon espace</button></div>`;
}
function wizardNav(back=true){return `<div class="wizard-actions">${back?`<button class="btn secondary" data-wizard-prev>Retour</button>`:"<span></span>"}<button class="btn primary" data-wizard-next>Continuer</button></div>`}
function field(id,label,value,type="text",placeholder=""){return `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${safe(value)}" placeholder="${placeholder}"></div>`}
function summaryItem(k,v){return `<article><b>${k}</b><span>${safe(v)}</span></article>`}

function createPage(){
  const a=active(); if(!a) return "";
  builder={goal:builder.goal||a.primaryGoal||"remise_en_forme",duration:builder.duration||a.duration||30,
    level:builder.level||a.level||"Débutant",equipment:builder.equipment||[...(a.equipment||["poids du corps"])],
    fatigue:builder.fatigue??3,stress:builder.stress??3,sleep:builder.sleep??(a.sleep||3),pain:builder.pain??0,
    secondaryGoal:builder.secondaryGoal||a.secondaryGoal||"",style:builder.style||"standard"};
  const p=programs.find(x=>x.goal===builder.goal)||programs[0];
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Créer une séance</p><h1>3 choix. Puis je m’occupe du reste.</h1><p>Objectif → temps → état du jour. Le profil et le matériel sont déjà connus.</p></div></div>
    <section class="wizard-card">
      <h2>1. Aujourd’hui, tu veux travailler quoi ?</h2>
      <div class="program-grid" style="grid-template-columns:repeat(3,1fr)">
        ${programs.map(x=>`<button class="program-card" style="height:185px;outline:${builder.goal===x.goal?"2px solid var(--green)":"none"}" data-builder-goal="${x.goal}">
          <img src="${visualPath(x.visual)}"><div class="content"><span class="icon">${x.icon}</span><b>${x.name}</b><p>${x.benefit}</p></div></button>`).join("")}
      </div>
    </section>
    <section class="wizard-card" style="margin-top:12px">
      <h2>2. Combien de temps ?</h2><p>Le nombre de blocs et d’exercices s’adapte réellement.</p>
      <div class="chip-wrap">${[20,30,45,60].map(x=>`<button class="chip ${Number(builder.duration)===x?"on":""}" data-builder-duration="${x}">${x} min</button>`).join("")}</div>
    </section>
    <section class="wizard-card" style="margin-top:12px">
      <h2>3. Comment tu te sens ?</h2><p>La séance est allégée ou renforcée selon ces réponses.</p>
      <div class="form-grid">
        ${rangeBuilder("fatigue","Fatigue",builder.fatigue,"1 = frais · 5 = très fatigué")}
        ${rangeBuilder("stress","Stress",builder.stress,"1 = calme · 5 = élevé")}
        ${rangeBuilder("sleep","Sommeil",builder.sleep,"1 = mauvais · 5 = très bon")}
        ${rangeBuilder("pain","Douleur aujourd’hui",builder.pain,"0 = aucune · 5 = forte",0)}
      </div>
      <div class="summary-list" style="margin-top:16px">
        ${summaryItem("Profil",`${a.level} · ${a.age||"—"} ans`)}
        ${summaryItem("Matériel",builder.equipment.join(", "))}
        ${summaryItem("Objectif secondaire",builder.secondaryGoal||"Aucun")}
        ${summaryItem("Univers",p.name)}
      </div>
      <div class="wizard-actions"><button class="btn secondary" data-edit-equipment>Modifier le matériel</button><button class="btn primary" data-generate>Générer ma séance</button></div>
    </section>
    <aside class="coach-tip"><img src="${visualPath(p.visual)}"><div class="copy"><span class="badge">APERÇU</span><h3>${p.name}</h3><p>${p.benefit}</p></div></aside>
  `);
}
function rangeBuilder(key,label,value,legend,min=1){return `<div class="range-card"><header><span>${label}</span><span id="${key}Val">${value}</span></header><input data-builder-range="${key}" type="range" min="${min}" max="5" value="${value}"><small>${legend}</small></div>`}
function equipmentOptions(){return ["poids du corps","tapis","mur","chaise","banc","haltères","barre","kettlebell","élastique","machine","poulie","barre traction","box","step","medecine ball","sandbag","battle rope","sac","pattes d’ours","corde","rameur","vélo","skierg","sled","cônes","extérieur"]}

function sessionPage(){
  const id=qparam("id");
  if(id && !currentSession) currentSession=state.sessions.find(s=>s.id===id)||null;
  if(!currentSession) return chrome(`<div class="empty"><h2>Aucune séance ouverte</h2><button class="btn primary" data-go="create">Créer une séance</button></div>`);
  const p=programs.find(x=>x.goal===currentSession.goal)||programs[0];
  return chrome(`
    <section class="session-hero">
      <div class="copy"><p class="eyebrow">${safe(currentSession.format)} · Score ${currentSession.score}/100</p>
        <h1>${safe(currentSession.title)}</h1>
        <p>${safe(currentSession.coachNote)}</p>
        <div class="action-row"><button class="btn primary" data-go-live>Démarrer</button><button class="btn secondary" data-print>Imprimer / PDF</button></div>
      </div>
      <div class="media"><img src="${visualPath(p.visual)}"></div>
    </section>
    <section class="metrics">
      ${metric("Durée",`${currentSession.duration} min`)}
      ${metric("Disponibilité",`${currentSession.readiness}%`)}
      ${metric("Objectif",safe(p.name))}
      ${metric("Matériel",`${currentSession.equipment.length} choix`)}
      ${metric("Exercices",currentSession.exerciseIds.length)}
    </section>
    <div class="block-list">${currentSession.blocks.map(blockHtml).join("")}</div>
    <div class="action-row no-print"><button class="btn primary" data-go-live>Démarrer cette séance</button><button class="btn secondary" data-regenerate>🔁 Générer une autre proposition</button></div>
  `);
}
function metric(k,v){return `<article class="stat-card"><b>${k}</b><span>${v}</span></article>`}
function blockHtml(b){return `<section class="block"><header class="block-head"><h2>${safe(b.label)}</h2><span>${b.minutes} min</span></header>
  ${b.exercises.map((e,i)=>`<article class="session-ex"><div><h3>${i+1}. ${safe(e.name)}</h3><p>${safe(e.cues)}</p></div>
    <div class="rx"><b>${e.prescription.sets} × ${safe(e.prescription.reps)}</b><small>Repos ${safe(e.prescription.rest)} · RPE ${e.prescription.rpe}</small></div>
    <footer><span class="badge">${safe(e.family)}</span><span class="badge">${safe(e.pattern)}</span>${e.suggestedLoad?`<span class="badge">Charge suggérée ${e.suggestedLoad} kg</span>`:""}<button class="btn secondary small no-print" data-swap="${e.id}" data-block="${b.key}">Remplacer</button></footer>
  </article>`).join("")}</section>`}

function livePage(){
  if(!currentSession){
    const last=state.sessions.find(s=>s.id===qparam("id"));
    if(last) currentSession=last;
  }
  if(!currentSession) return sessionPage();
  const all=currentSession.blocks.flatMap(b=>b.exercises.map(e=>({...e,block:b.label})));
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Séance en direct</p><h1>${safe(currentSession.title)}</h1><p>Coche les séries et note ce que tu as réellement fait.</p></div>
      <button class="btn primary" data-finish-session>Terminer la séance</button></div>
    <div class="timer no-print"><span>Repos</span><strong id="timerText">00:00</strong><button class="btn secondary small" data-timer="60">1:00</button><button class="btn secondary small" data-timer="90">1:30</button><button class="btn secondary small" data-timer-stop>Stop</button></div>
    <section class="panel">
      ${all.map((e,i)=>`<div class="live-row">
        <div class="exercise-name"><b>${safe(e.name)}</b><small style="display:block;color:var(--muted)">${safe(e.block)} · cible ${e.prescription.sets} × ${safe(e.prescription.reps)}</small></div>
        <input aria-label="Série" type="number" min="1" value="${e.prescription.sets}" data-log-sets="${e.id}">
        <input aria-label="Répétitions" type="number" min="0" placeholder="reps" data-log-reps="${e.id}">
        <input aria-label="Poids" type="number" min="0" step=".5" placeholder="kg" value="${e.suggestedLoad||""}" data-log-weight="${e.id}">
        <input aria-label="RPE" type="number" min="1" max="10" step=".5" placeholder="RPE" value="${e.prescription.rpe}" data-log-rpe="${e.id}">
        <button data-complete-ex="${e.id}">✓</button>
      </div>`).join("")}
    </section>
  `);
}

function libraryPage(){
  const families=["Tous",...new Set(exercises.map(e=>e.family))];
  const groups=["Tous",...new Set(exercises.map(e=>e.group))];
  const equipment=["Tous",...new Set(exercises.flatMap(e=>e.equipment))];
  let list=exercises.filter(e=>
    (!libraryFilter.q || e.search.includes(libraryFilter.q.toLowerCase())) &&
    (libraryFilter.family==="Tous"||e.family===libraryFilter.family) &&
    (libraryFilter.group==="Tous"||e.group===libraryFilter.group) &&
    (libraryFilter.equipment==="Tous"||e.equipment.includes(libraryFilter.equipment))
  );
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Bibliothèque pro</p><h1>${exercises.length} exercices réels</h1><p>Recherche, muscles, matériel, variantes et consignes.</p></div></div>
    <div class="filters">
      <input id="libQ" value="${safe(libraryFilter.q)}" placeholder="Rechercher : squat, dos, corde, boxe…">
      ${filterSelect("libFamily",families,libraryFilter.family)}
      ${filterSelect("libGroup",groups,libraryFilter.group)}
      ${filterSelect("libEquipment",equipment,libraryFilter.equipment)}
    </div>
    <div class="section-title"><div><h2>${list.length} résultat(s)</h2></div></div>
    <section class="library-grid">${list.slice(0,180).map(exCard).join("")}</section>
    ${list.length>180?`<div class="empty">Affichage des 180 premiers résultats. Affine les filtres pour aller plus vite.</div>`:""}
  `);
}
function filterSelect(id,arr,value){return `<select id="${id}">${arr.map(x=>`<option ${x===value?"selected":""}>${safe(x)}</option>`).join("")}</select>`}
function exCard(e){return `<article class="exercise-card"><span class="meta">${safe(e.family)} · ${safe(e.level)}</span><h3>${safe(e.name)}</h3><p>${safe(e.cues)}</p><small>${safe(e.muscles.join(" · "))}<br>${safe(e.equipment.join(" · "))}</small>
  <div class="variants"><b>Variantes :</b> ${safe((e.variants||[]).slice(0,3).join(" · ")||"—")}<br><b>Erreur fréquente :</b> ${safe(e.error)}</div></article>`}

function progressPage(){
  const h=hFor(), st=progressStats(h), completed=h.filter(s=>s.completedAt);
  const recents=completed.slice(0,8);
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Progression</p><h1>Ce qui compte, c’est ce que tu fais réellement.</h1><p>Les statistiques viennent des séances enregistrées.</p></div></div>
    <section class="stat-grid">
      ${metric("Séances",st.completed)}${metric("Temps",`${st.totalMinutes} min`)}${metric("Volume",`${st.volume.toLocaleString("fr-FR")} kg`)}${metric("Meilleur 1RM estimé",st.best1rm?`${st.best1rm} kg`:"—")}
    </section>
    <div class="section-title"><div><h2>Historique</h2><p>Reprends une séance ou observe ta régularité.</p></div></div>
    ${recents.length?`<section class="panel">${recents.map(s=>`<div class="session-ex"><div><h3>${safe(s.title)}</h3><p>${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.duration} min</p></div><div class="rx"><b>${s.score||"—"}/100</b><small>${(s.logs||[]).length} exercice(s) noté(s)</small></div><footer><button class="btn secondary small" data-open-session="${s.id}">Voir</button></footer></div>`).join("")}</section>`:
      `<div class="empty"><h2>Pas encore de séance terminée</h2><p>Démarre une séance puis enregistre tes séries, reps, poids et RPE.</p><button class="btn primary" data-go="create">Créer ma première séance</button></div>`}
  `);
}

function athletesPage(){
  const a=active();
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Profils / adhérents</p><h1>Un espace par personne.</h1><p>Chaque adhérent garde son profil, ses séances et sa progression.</p></div><button class="btn primary" data-new-athlete>+ Ajouter</button></div>
    <div class="athlete-layout">
      <section>
        ${state.athletes.map(x=>`<article class="athlete-card ${a?.id===x.id?"active":""}">
          <h3>${safe(x.firstName||"Sans nom")}</h3><p>${safe(x.level||"—")} · ${safe(programs.find(p=>p.goal===x.primaryGoal)?.name||x.primaryGoal||"—")}</p>
          <div class="action-row"><button class="btn secondary small" data-activate-athlete="${x.id}">Ouvrir</button><button class="btn secondary small" data-edit-athlete="${x.id}">Modifier</button>${state.athletes.length>1?`<button class="btn danger small" data-delete-athlete="${x.id}">Supprimer</button>`:""}</div>
        </article>`).join("")}
      </section>
      <section class="panel">
        <h2>Sauvegarde des données</h2><p style="color:var(--muted)">GitHub Pages n’a pas de base de données serveur. Les profils restent sur cet appareil ; l’export permet de les sauvegarder ou de les déplacer.</p>
        <div class="action-row"><button class="btn secondary" data-export>Exporter</button><label class="btn secondary" style="display:inline-block">Importer<input id="importFile" type="file" accept="application/json" hidden></label></div>
      </section>
    </div>
  `);
}

function profileEditPage(){
  const a=active(); if(!a) return "";
  const b=bmi(a.weight,a.height);
  return chrome(`
    <div class="page-head"><div><p class="eyebrow">Profil actif</p><h1>${safe(a.firstName||"Profil")}</h1><p>Ces réglages influencent la génération.</p></div></div>
    <section class="panel">
      <div class="form-grid">
        ${editField("pf_firstName","Prénom",a.firstName||"")}
        ${editField("pf_age","Âge",a.age||"","number")}
        ${editField("pf_height","Taille cm",a.height||"","number")}
        ${editField("pf_weight","Poids kg",a.weight||"","number")}
        <div class="field"><label>Niveau</label><select id="pf_level">${["Débutant","Intermédiaire","Avancé","Expert"].map(x=>`<option ${x===a.level?"selected":""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label>Objectif principal</label><select id="pf_goal">${programs.map(p=>`<option value="${p.goal}" ${p.goal===a.primaryGoal?"selected":""}>${p.name}</option>`).join("")}</select></div>
        ${editField("pf_secondary","Objectif secondaire",a.secondaryGoal||"")}
        <div class="field"><label>Durée habituelle</label><select id="pf_duration">${[20,30,45,60].map(x=>`<option value="${x}" ${Number(a.duration)===x?"selected":""}>${x} min</option>`).join("")}</select></div>
      </div>
      <div class="field full" style="margin-top:15px"><label>Matériel</label><div class="chip-wrap">${equipmentOptions().map(x=>`<button class="chip ${(a.equipment||[]).includes(x)?"on":""}" data-profile-equipment="${x}">${x}</button>`).join("")}</div></div>
      <div class="summary-list" style="margin-top:16px">${summaryItem("IMC",b.value?`${b.value} · ${b.label}`:"Non calculé")}${summaryItem("Séances enregistrées",hFor().filter(s=>s.completedAt).length)}</div>
      <div class="action-row"><button class="btn primary" data-save-profile>Enregistrer</button></div>
    </section>
  `);
}
function editField(id,label,value,type="text"){return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${safe(value)}"></div>`}

function saveOnboarding(){
  wizard.firstName=$("#firstName")?.value||wizard.firstName||"";
  const athlete={
    id:uid("athlete"),firstName:wizard.firstName||"Athlète",age:Number(wizard.age)||null,
    height:Number(wizard.height)||null,weight:Number(wizard.weight)||null,
    primaryGoal:wizard.primaryGoal||"remise_en_forme",secondaryGoal:wizard.secondaryGoal||"",
    level:wizard.level||"Débutant",place:wizard.place||"Mixte",frequency:Number(wizard.frequency)||3,
    duration:Number(wizard.duration)||30,equipment:wizard.equipment?.length?wizard.equipment:["poids du corps"],
    injuries:(wizard.injuries||[]).filter(x=>x!=="Aucune"),notes:wizard.notes||"",sleep:3,createdAt:new Date().toISOString()
  };
  upsertAthlete(state,athlete); wizard={};wizardStep=0;go("home");
}

function syncWizardInputs(){
  ["firstName","age","height","weight","secondaryGoal","notes"].forEach(k=>{const el=$("#"+k);if(el)wizard[k]=el.value});
  ["place","frequency","duration"].forEach(k=>{const el=$("#"+k);if(el)wizard[k]=el.value});
}
function regenerate(){
  const a=active(); if(!a)return;
  currentSession=generateSession({athlete:a,daily:builder,choice:builder,exercises,history:hFor()});
  state.sessions.unshift(currentSession);saveState(state);go(`session?id=${currentSession.id}`);
}
function swapExercise(blockKey,exerciseId){
  const block=currentSession.blocks.find(b=>b.key===blockKey); if(!block)return;
  const ix=block.exercises.findIndex(e=>e.id===exerciseId); if(ix<0)return;
  const old=block.exercises[ix];
  const candidates=exercises.filter(e=>e.id!==old.id && e.family===old.family && e.group===old.group &&
    (e.equipment.includes("poids du corps")||e.equipment.some(x=>currentSession.equipment.includes(x))));
  const replacement=candidates[Math.floor(Math.random()*candidates.length)]||exercises.find(e=>e.id!==old.id&&e.family===old.family);
  if(!replacement){toast("Pas d’alternative trouvée.");return;}
  block.exercises[ix]={...replacement,prescription:old.prescription,suggestedLoad:null};
  block.exercises[ix].cues=replacement.cues;
  currentSession.exerciseIds=currentSession.blocks.flatMap(b=>b.exercises.map(e=>e.id));
  const si=state.sessions.findIndex(s=>s.id===currentSession.id);if(si>=0)state.sessions[si]=currentSession;saveState(state);render();
}
function startTimer(sec){
  clearInterval(timerInterval);timerSeconds=sec;updateTimer();
  timerInterval=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){clearInterval(timerInterval);timerInterval=null;toast("Repos terminé.");}},1000);
}
function updateTimer(){const el=$("#timerText");if(el)el.textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,"0")}:${String(timerSeconds%60).padStart(2,"0")}`}

function bind(){
  $$("[data-go]").forEach(x=>x.onclick=()=>go(x.dataset.go));
  $$("[data-program]").forEach(x=>x.onclick=()=>{builder.goal=x.dataset.program;go("create")});
  $$("[data-open-session]").forEach(x=>x.onclick=()=>{currentSession=state.sessions.find(s=>s.id===x.dataset.openSession)||null;go(`session?id=${x.dataset.openSession}`)});
  $$("[data-wizard-next]").forEach(x=>x.onclick=()=>{syncWizardInputs();wizardStep=Math.min(6,wizardStep+1);render()});
  $$("[data-wizard-prev]").forEach(x=>x.onclick=()=>{syncWizardInputs();wizardStep=Math.max(0,wizardStep-1);render()});
  $$("[data-wiz-goal]").forEach(x=>x.onclick=()=>{wizard.primaryGoal=x.dataset.wizGoal;render()});
  $$("[data-wiz-level]").forEach(x=>x.onclick=()=>{wizard.level=x.dataset.wizLevel;render()});
  $$("[data-wiz-equipment]").forEach(x=>x.onclick=()=>{wizard.equipment=wizard.equipment||[];const v=x.dataset.wizEquipment;wizard.equipment=wizard.equipment.includes(v)?wizard.equipment.filter(a=>a!==v):[...wizard.equipment,v];render()});
  $$("[data-wiz-injury]").forEach(x=>x.onclick=()=>{wizard.injuries=wizard.injuries||[];const v=x.dataset.wizInjury;if(v==="Aucune")wizard.injuries=["Aucune"];else{wizard.injuries=wizard.injuries.filter(a=>a!=="Aucune");wizard.injuries=wizard.injuries.includes(v)?wizard.injuries.filter(a=>a!==v):[...wizard.injuries,v]}render()});
  $("[data-save-onboarding]")?.addEventListener("click",()=>{syncWizardInputs();saveOnboarding()});
  $$("[data-builder-goal]").forEach(x=>x.onclick=()=>{builder.goal=x.dataset.builderGoal;render()});
  $$("[data-builder-duration]").forEach(x=>x.onclick=()=>{builder.duration=Number(x.dataset.builderDuration);render()});
  $$("[data-builder-range]").forEach(x=>x.oninput=()=>{builder[x.dataset.builderRange]=Number(x.value);const t=$("#"+x.dataset.builderRange+"Val");if(t)t.textContent=x.value});
  $("[data-generate]")?.addEventListener("click",regenerate);
  $("[data-edit-equipment]")?.addEventListener("click",()=>go("profile"));
  $$("[data-swap]").forEach(x=>x.onclick=()=>swapExercise(x.dataset.block,x.dataset.swap));
  $$("[data-go-live]").forEach(x=>x.onclick=()=>go(`live?id=${currentSession.id}`));
  $("[data-print]")?.addEventListener("click",()=>window.print());
  $("[data-regenerate]")?.addEventListener("click",regenerate);
  $$("[data-timer]").forEach(x=>x.onclick=()=>startTimer(Number(x.dataset.timer)));
  $("[data-timer-stop]")?.addEventListener("click",()=>{clearInterval(timerInterval);timerInterval=null;timerSeconds=0;updateTimer()});
  $$("[data-complete-ex]").forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.completeEx;
    const log={
      exerciseId:id,sets:Number($(`[data-log-sets="${id}"]`)?.value)||0,reps:Number($(`[data-log-reps="${id}"]`)?.value)||0,
      weight:Number($(`[data-log-weight="${id}"]`)?.value)||0,rpe:Number($(`[data-log-rpe="${id}"]`)?.value)||0
    };
    currentSession.logs=currentSession.logs||[];
    currentSession.logs=currentSession.logs.filter(x=>x.exerciseId!==id);currentSession.logs.unshift(log);
    btn.textContent="✓ fait";btn.style.opacity=".6";toast("Exercice enregistré");
  });
  $("[data-finish-session]")?.addEventListener("click",()=>{
    currentSession.completedAt=new Date().toISOString();
    const ix=state.sessions.findIndex(s=>s.id===currentSession.id); if(ix>=0)state.sessions[ix]=currentSession;else state.sessions.unshift(currentSession);
    saveState(state);toast("Séance terminée");go("progress");
  });
  const libHandler=()=>{libraryFilter={q:$("#libQ")?.value||"",family:$("#libFamily")?.value||"Tous",group:$("#libGroup")?.value||"Tous",equipment:$("#libEquipment")?.value||"Tous"};render()};
  $("#libQ")?.addEventListener("input",libHandler);$("#libFamily")?.addEventListener("change",libHandler);$("#libGroup")?.addEventListener("change",libHandler);$("#libEquipment")?.addEventListener("change",libHandler);
  $("[data-new-athlete]")?.addEventListener("click",()=>{wizard={};wizardStep=0;go("onboarding")});
  $$("[data-activate-athlete]").forEach(x=>x.onclick=()=>{state.activeAthleteId=x.dataset.activateAthlete;saveState(state);go("home")});
  $$("[data-edit-athlete]").forEach(x=>x.onclick=()=>{state.activeAthleteId=x.dataset.editAthlete;saveState(state);go("profile")});
  $$("[data-delete-athlete]").forEach(x=>x.onclick=()=>{if(confirm("Supprimer ce profil et son historique ?")){removeAthlete(state,x.dataset.deleteAthlete);render()}});
  $("[data-export]")?.addEventListener("click",()=>exportState(state));
  $("#importFile")?.addEventListener("change",async e=>{try{state=await importState(e.target.files[0]);toast("Données importées");render()}catch(err){toast("Import impossible")}});
  $$("[data-profile-equipment]").forEach(x=>x.onclick=()=>{const a=active();const v=x.dataset.profileEquipment;a.equipment=a.equipment||[];a.equipment=a.equipment.includes(v)?a.equipment.filter(z=>z!==v):[...a.equipment,v];upsertAthlete(state,a);render()});
  $("[data-save-profile]")?.addEventListener("click",()=>{
    const a=active();a.firstName=$("#pf_firstName").value;a.age=Number($("#pf_age").value)||null;a.height=Number($("#pf_height").value)||null;a.weight=Number($("#pf_weight").value)||null;
    a.level=$("#pf_level").value;a.primaryGoal=$("#pf_goal").value;a.secondaryGoal=$("#pf_secondary").value;a.duration=Number($("#pf_duration").value)||30;
    upsertAthlete(state,a);toast("Profil enregistré");go("home");
  });
}

init();
