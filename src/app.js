
import {loadState,saveState,uid,upsertAthlete,activeAthlete,removeAthlete,sessionsFor,exportState,importState} from "./storage.js";
import {bmi,readiness,generateSession,progressStats} from "./coach-engine.js";

let state=loadState(), exercises=[], programs=[], masters=[];
let currentSession=null, createStep=0, builder={}, clientDraft={}, library={q:"",family:"Tous",level:"Tous",equipment:"Tous"};
let timer=null, timerSeconds=0;

const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const route=()=>((location.hash||"#home").slice(1).split("?")[0]||"home");
const param=k=>new URLSearchParams(location.hash.split("?")[1]||"").get(k);
const go=x=>location.hash=x;
const logo="./assets/logo/logo-fafatraining.jpg";
const visual=x=>`./assets/visuals/${x||"coaching.jpeg"}`;
const active=()=>activeAthlete(state);
const historyFor=id=>id?sessionsFor(state,id):[];
const programFor=goal=>programs.find(p=>p.goal===goal)||programs[0];

const STYLES={
 remise_en_forme:[["equilibre","Équilibré"],["renfo_doux","Renforcement doux"],["cardio_renfo","Cardio + renfo"]],
 musculation:[["full","Full body"],["haut","Haut du corps"],["bas","Bas du corps"],["push","Push"],["pull","Pull"],["hypertrophie","Hypertrophie"]],
 force:[["full","Force globale"],["haut","Force haut"],["bas","Force bas"],["technique","Technique"]],
 perte_gras:[["circuit","Circuit"],["cardio_renfo","Cardio + renfo"],["low_impact","Sans impact"]],
 full_body:[["equilibre","Équilibré"],["kettlebell","Kettlebell"],["poids_corps","Poids du corps"]],
 hiit:[["interval","Intervalles"],["tabata","Tabata 20/10"],["emom","EMOM"],["low_impact","Sans impact"]],
 boxe:[["technique","Technique"],["sac","Sac"],["appuis","Appuis"],["puissance","Puissance"],["cardio","Cardio boxing"]],
 cardio:[["continu","Continu"],["interval","Intervalles"],["low_impact","Faible impact"]],
 trail:[["endurance","Endurance"],["cotes","Côtes"],["fractionne","Fractionné"],["descente","Technique descente"]],
 crossfit:[["circuit","Circuit"],["amrap","AMRAP"],["emom","EMOM"],["fortime","For Time"]],
 hyrox:[["simulation","Simulation"],["ergos","Ergos"],["carries","Portés"],["stations","Stations"]],
 aerobic:[["low_impact","Low impact"],["coordination","Coordination"],["cardio","Cardio"]],
 mobilite:[["global","Globale"],["hanches","Hanches"],["chevilles","Chevilles"],["haut","Haut du corps"]],
 prevention:[["global","Globale"],["epaules","Épaules"],["genoux","Genoux"],["dos","Dos"],["chevilles","Chevilles"]],
 recovery:[["respiration","Respiration"],["mobilite","Mobilité douce"],["deverrouillage","Déverrouillage"]]
};

function toast(text){
 const x=document.createElement("div");x.className="toast";x.textContent=text;document.body.appendChild(x);setTimeout(()=>x.remove(),2200);
}
function backPill(label="Retour"){
 return `<button class="back-pill no-print" data-back><span>‹</span>${label}</button>`;
}
function nav(){
 const r=route(), item=(to,icon,label,match=to)=>`<button class="${r===match?'active':''}" data-go="${to}"><b>${icon}</b><small>${label}</small></button>`;
 return `<nav class="bottom-nav no-print">${item("home","⌂","Accueil")}${item("clients","♙","Coachés")}${item("create","＋","Créer")}${item("library","▦","Bibliothèque")}${item("progress","⌁","Suivi")}</nav>`;
}
function shell(content,{showNav=true,back=false}={}){
 return `<main class="shell">
   <header class="topbar no-print">
    <button class="brand" data-go="home"><img src="${logo}"><span>FAFATRAINING<small>COACH OS</small></span></button>
    <button class="round-tool" data-go="settings" title="Réglages">•••</button>
   </header>
   ${back?backPill():""}${content}
  </main>${showNav?nav():""}`;
}

async function init(){
 [exercises,programs,masters]=await Promise.all([
  fetch("./data/exercises.json?v=81").then(r=>r.json()),
  fetch("./data/programs.json?v=81").then(r=>r.json()),
  fetch("./data/master-movements.json?v=81").then(r=>r.json())
 ]);
 if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
 addEventListener("hashchange",render); render();
}

function home(){
 const a=active(), recent=state.sessions[0], completed=state.sessions.filter(s=>s.completedAt).length;
 const tip=contextTip(a);
 return shell(`
  <section class="home-hero">
   <div class="hero-copy"><p class="eyebrow">FAFA · TON ESPACE COACH</p><h1>Simple devant.<br>Puissant derrière.</h1>
    <p>Gère tes coachés, crée une séance adaptée et partage-la sans chercher dans dix menus.</p>
    <div class="actions"><button class="primary" data-go="create">Créer une séance</button><button class="secondary" data-go="clients">Mes coachés</button></div>
   </div>
   <div class="hero-visual"><img src="${visual("avatar-action.jpeg")}"></div>
  </section>
  <section class="home-actions">
   <button class="home-tile main" data-go="create"><span>＋</span><div><b>Créer une séance</b><small>Coaché → objectif → contexte → séance</small></div><i>›</i></button>
   <button class="home-tile" data-go="clients"><span>♙</span><div><b>${state.athletes.length} coaché(s)</b><small>Profils, programmes, historique et partage</small></div><i>›</i></button>
   <button class="home-tile" data-go="library"><span>▦</span><div><b>${masters.length} mouvements</b><small>${exercises.length} variantes regroupées intelligemment</small></div><i>›</i></button>
   <button class="home-tile" data-go="progress"><span>⌁</span><div><b>${completed} séance(s) terminée(s)</b><small>Volume, temps et progression</small></div><i>›</i></button>
  </section>
  ${recent?`<section class="recent-strip"><div><p class="eyebrow">DERNIÈRE SÉANCE</p><b>${esc(recent.title)}</b><small>${new Date(recent.date).toLocaleDateString("fr-FR")} · ${recent.duration} min</small></div><button class="small-pill" data-open-session="${recent.id}">Ouvrir</button></section>`:""}
  ${tip}
 `);
}
function contextTip(a){
 if(!a) return "";
 const missing=[]; if(!a.level)missing.push("niveau");if(!a.equipment?.length)missing.push("matériel");if(!a.primaryGoal)missing.push("objectif");
 if(missing.length) return `<aside class="coach-tip"><img src="${visual("avatar-coach.jpeg")}"><div><p class="eyebrow">FAFA TE CONSEILLE</p><h3>Complète ${missing.join(", ")}</h3><p>Ces informations servent directement à adapter les séances de ce coaché.</p><button class="small-pill" data-client="${a.id}">Ouvrir le profil</button></div></aside>`;
 const h=historyFor(a.id);
 if(!h.length) return `<aside class="coach-tip"><img src="${visual("avatar-coach.jpeg")}"><div><p class="eyebrow">FAFA TE CONSEILLE</p><h3>Commence par une séance repère</h3><p>Elle permettra ensuite de proposer des charges et une progression à partir de données réelles.</p><button class="small-pill" data-create-client="${a.id}">Créer sa séance</button></div></aside>`;
 return "";
}

function clients(){
 return shell(`
  <header class="page-head"><div><p class="eyebrow">MES COACHÉS</p><h1>Une personne = un espace clair.</h1><p>Ils n’ont pas besoin d’avoir l’application. Tu peux tout gérer et leur partager leur séance.</p></div><button class="primary" data-new-client>＋ Ajouter un coaché</button></header>
  ${state.athletes.length?`<section class="client-list">${state.athletes.map(clientRow).join("")}</section>`:
  `<section class="empty"><h2>Aucun coaché pour le moment</h2><p>Ajoute une personne, puis crée et partage ses séances depuis ton espace coach.</p><button class="primary" data-new-client>Ajouter mon premier coaché</button></section>`}
 `);
}
function clientRow(a){
 const h=historyFor(a.id), last=h[0], p=programFor(a.primaryGoal);
 return `<article class="client-row">
  <div class="client-avatar">${esc((a.firstName||"?").slice(0,1).toUpperCase())}</div>
  <div class="client-main"><b>${esc(a.firstName||"Sans nom")}</b><small>${esc(a.level||"Niveau non défini")} · ${esc(p?.name||"Objectif non défini")}</small></div>
  <div class="client-status"><b>${h.filter(s=>s.completedAt).length}</b><small>séances</small></div>
  <div class="client-status"><b>${last?new Date(last.date).toLocaleDateString("fr-FR"):"—"}</b><small>dernière</small></div>
  <div class="client-actions"><button class="icon-pill" data-client="${a.id}" title="Ouvrir">›</button><button class="icon-pill" data-create-client="${a.id}" title="Créer séance">＋</button><button class="icon-pill danger" data-delete-client="${a.id}" title="Supprimer">×</button></div>
 </article>`;
}
function clientPage(){
 const id=param("id"), a=state.athletes.find(x=>x.id===id); if(!a)return clients();
 const h=historyFor(id), st=progressStats(h), p=programFor(a.primaryGoal), b=bmi(a.weight,a.height);
 return shell(`
  <header class="client-hero">
   <div><p class="eyebrow">COACHÉ</p><h1>${esc(a.firstName)}</h1><p>${esc(a.level)} · ${esc(p.name)} · ${a.duration||30} min habituellement</p></div>
   <div class="actions"><button class="primary" data-create-client="${a.id}">Créer sa séance</button><button class="secondary" data-edit-client="${a.id}">Modifier</button></div>
  </header>
  <section class="metric-grid">${metric("Séances",st.completed)}${metric("Temps",`${st.totalMinutes} min`)}${metric("Volume",`${st.volume.toLocaleString("fr-FR")} kg`)}${metric("IMC",b.value||"—")}</section>
  <section class="panel">
   <div class="section-title"><div><h2>Profil utile au moteur</h2><p>Une donnée n’est saisie qu’ici, pas à chaque séance.</p></div></div>
   <div class="profile-summary">${summary("Objectif",p.name)}${summary("Objectif secondaire",a.secondaryGoal||"—")}${summary("Niveau",a.level||"—")}${summary("Lieu",a.place||"—")}${summary("Matériel",(a.equipment||[]).join(", ")||"—")}${summary("Zones à protéger",(a.injuries||[]).join(", ")||"Aucune")}</div>
  </section>
  <section class="panel"><div class="section-title"><div><h2>Historique</h2></div></div>
   ${h.length?h.slice(0,8).map(s=>`<div class="history-row"><div><b>${esc(s.title)}</b><small>${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.duration} min</small></div><div><button class="small-pill" data-open-session="${s.id}">Ouvrir</button><button class="small-pill" data-share-session="${s.id}">Partager</button></div></div>`).join(""):`<div class="empty compact">Aucune séance créée pour ce coaché.</div>`}
  </section>
 `,{back:true});
}
function clientForm(){
 const id=param("id"), edit=state.athletes.find(x=>x.id===id);
 const a=edit||clientDraft||{};
 return shell(`
  <header class="page-head"><div><p class="eyebrow">${edit?"MODIFIER":"NOUVEAU COACHÉ"}</p><h1>${edit?"Mettre à jour le profil":"Créer son espace"}</h1><p>On garde seulement les informations qui servent réellement à programmer.</p></div></header>
  <section class="panel form-panel">
   <div class="form-grid">
    ${field("c_name","Prénom / nom",a.firstName||"")}
    ${field("c_age","Âge",a.age||"","number")}
    ${field("c_height","Taille (cm)",a.height||"","number")}
    ${field("c_weight","Poids (kg)",a.weight||"","number")}
    ${selectField("c_level","Niveau",["Débutant","Intermédiaire","Avancé","Expert"],a.level||"Débutant")}
    ${selectField("c_goal","Objectif principal",programs.map(p=>[p.goal,p.name]),a.primaryGoal||"remise_en_forme")}
    ${field("c_secondary","Objectif secondaire",a.secondaryGoal||"")}
    ${selectField("c_place","Lieu habituel",["Maison","Salle","Extérieur","Gymnase","Mixte"],a.place||"Mixte")}
    ${selectField("c_duration","Durée habituelle",[[20,"20 min"],[30,"30 min"],[45,"45 min"],[60,"60 min"]],a.duration||30)}
   </div>
   <div class="form-section"><b>Matériel habituel</b><div class="chip-wrap">${equipmentOptions().map(x=>`<button class="chip ${(a.equipment||[]).includes(x)?"on":""}" data-form-equipment="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
   <div class="form-section"><b>Zones à protéger</b><div class="chip-wrap">${["Épaule","Genou","Dos / lombaires","Cheville","Poignet","Hanches"].map(x=>`<button class="chip ${(a.injuries||[]).includes(x)?"on":""}" data-form-injury="${x}">${x}</button>`).join("")}</div></div>
   <div class="actions"><button class="primary" data-save-client="${edit?.id||""}">Enregistrer</button><button class="secondary" data-back>Annuler</button></div>
  </section>
 `,{back:true});
}

function createPage(){
 const selected=builder.athleteId?state.athletes.find(a=>a.id===builder.athleteId):null;
 const steps=["Pour qui ?","Quel objectif ?","Aujourd’hui","Validation"];
 return shell(`
  <header class="create-head"><p class="eyebrow">CRÉATION DE SÉANCE</p><h1>${steps[createStep]}</h1><div class="step-dots">${steps.map((s,i)=>`<i class="${i<=createStep?"on":""}"></i>`).join("")}</div></header>
  <section class="create-card">${createContent(selected)}</section>
 `,{back:true});
}
function createContent(selected){
 if(createStep===0){
  return `<h2>Choisis la personne</h2><p>Les données du profil seront utilisées automatiquement. Pour une séance ponctuelle, choisis “Séance libre”.</p>
   <div class="selector-grid"><button class="select-card ${builder.athleteId==="free"?"on":""}" data-pick-client="free"><span>⚡</span><b>Séance libre</b><small>Sans adhérent enregistré</small></button>
   ${state.athletes.map(a=>`<button class="select-card ${builder.athleteId===a.id?"on":""}" data-pick-client="${a.id}"><span>${esc(a.firstName.slice(0,1).toUpperCase())}</span><b>${esc(a.firstName)}</b><small>${esc(a.level||"—")} · ${esc(programFor(a.primaryGoal).name)}</small></button>`).join("")}</div>
   <div class="wizard-actions"><span></span><button class="primary" data-create-next ${builder.athleteId?"":"disabled"}>Continuer</button></div>`;
 }
 if(createStep===1){
  return `<h2>Objectif et style</h2><p>Le style modifie vraiment le format de séance.</p>
   <div class="program-selector">${programs.map(p=>`<button class="program-mini ${builder.goal===p.goal?"on":""}" data-pick-goal="${p.goal}"><img src="${visual(p.visual)}"><div><b>${p.icon} ${p.name}</b><small>${p.benefit}</small></div></button>`).join("")}</div>
   ${builder.goal?`<div class="form-section"><b>Style précis</b><div class="chip-wrap">${(STYLES[builder.goal]||[["standard","Standard"]]).map(([v,l])=>`<button class="chip ${builder.style===v?"on":""}" data-pick-style="${v}">${l}</button>`).join("")}</div></div>`:""}
   ${wizardNav()}`;
 }
 if(createStep===2){
  const a=selected||{level:"Débutant",duration:30,equipment:["poids du corps"]};
  ensureBuilderFromAthlete(a);
  const ready=readiness(a,{fatigue:builder.fatigue,stress:builder.stress,sleep:builder.sleep,pain:builder.pain});
  return `<h2>Ce qui change aujourd’hui</h2><p>Le reste est déjà dans le profil.</p>
   <div class="duration-row">${[20,30,45,60].map(x=>`<button class="duration ${Number(builder.duration)===x?"on":""}" data-duration="${x}"><b>${x}</b><small>min</small></button>`).join("")}</div>
   <div class="today-grid">${range("fatigue","Fatigue",builder.fatigue,1)}${range("stress","Stress",builder.stress,1)}${range("sleep","Sommeil",builder.sleep,1)}${range("pain","Douleur",builder.pain,0)}</div>
   <div class="readiness"><span>Disponibilité du jour</span><b>${ready}%</b><small>${ready<55?"Le moteur allégera automatiquement le volume.":ready>85?"Très bonne disponibilité : haut de fourchette possible.":"Charge de travail normale et progressive."}</small></div>
   <div class="form-section"><b>Matériel disponible aujourd’hui</b><div class="chip-wrap">${equipmentOptions().map(x=>`<button class="chip ${(builder.equipment||[]).includes(x)?"on":""}" data-builder-equipment="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
   ${wizardNav()}`;
 }
 const a=selected||{firstName:"Séance libre",level:builder.level||"Débutant",age:30,equipment:builder.equipment};
 const p=programFor(builder.goal);
 return `<h2>Tout est prêt</h2><p>Vérifie uniquement l’essentiel. Ensuite le moteur construit la séance complète.</p>
  <div class="review">${summary("Pour",a.firstName||"Séance libre")}${summary("Univers",p.name)}${summary("Style",(STYLES[builder.goal]||[]).find(x=>x[0]===builder.style)?.[1]||"Standard")}${summary("Durée",`${builder.duration} min`)}${summary("Niveau",a.level||builder.level||"Débutant")}${summary("Matériel",(builder.equipment||[]).join(", ")||"Poids du corps")}</div>
  <div class="wizard-actions"><button class="secondary" data-create-prev>Retour</button><button class="primary" data-generate>Générer la séance</button></div>`;
}
function wizardNav(){return `<div class="wizard-actions"><button class="secondary" data-create-prev>Retour</button><button class="primary" data-create-next>Continuer</button></div>`}
function ensureBuilderFromAthlete(a){
 if(builder._synced)return;
 builder.duration=builder.duration||a.duration||30;builder.level=a.level||"Débutant";builder.equipment=[...(a.equipment||["poids du corps"])];
 builder.fatigue=3;builder.stress=3;builder.sleep=3;builder.pain=0;builder._synced=true;
}
function range(k,label,v,min){return `<label class="range-box"><header><b>${label}</b><span id="${k}v">${v}</span></header><input type="range" min="${min}" max="5" value="${v}" data-range="${k}"><small>${min===0?"0 = aucune · 5 = forte":"1 = bas · 5 = élevé"}</small></label>`}

function generate(){
 let a=builder.athleteId==="free"?{id:"free",firstName:"Séance libre",level:builder.level||"Débutant",age:30,duration:builder.duration,equipment:builder.equipment||["poids du corps"],injuries:[],primaryGoal:builder.goal}:state.athletes.find(x=>x.id===builder.athleteId);
 if(!a)return;
 currentSession=generateSession({athlete:a,daily:builder,choice:{...builder,secondaryGoal:a.secondaryGoal||""},exercises,history:builder.athleteId==="free"?[]:historyFor(a.id)});
 currentSession.clientName=a.firstName||"Séance libre";
 state.sessions.unshift(currentSession);saveState(state);go(`session?id=${currentSession.id}`);
}

function sessionPage(){
 const id=param("id");currentSession=state.sessions.find(s=>s.id===id)||currentSession;
 if(!currentSession)return shell(`<div class="empty">Séance introuvable.</div>`,{back:true});
 const p=programFor(currentSession.goal);
 return shell(`
  <section class="session-cover"><div class="session-copy"><p class="eyebrow">${esc(currentSession.format)} · ${currentSession.duration} MIN</p><h1>${esc(currentSession.title)}</h1><p>${esc(currentSession.coachNote)}</p>
   <div class="session-badges"><span>${currentSession.readiness}% disponibilité</span><span>${currentSession.exerciseIds.length} exercices</span><span>score ${currentSession.score}/100</span></div>
  </div><img src="${visual(p.visual)}"></section>
  <div class="session-toolbar no-print"><button class="primary" data-live>▶ Démarrer</button><button class="secondary" data-adapt>↻ Adapter</button><button class="secondary" data-share>⌁ Partager</button><button class="secondary" data-print>⌑ Imprimer / PDF</button></div>
  <section class="equipment-line"><b>Matériel</b><span>${esc((currentSession.equipment||[]).join(" · ")||"Poids du corps")}</span></section>
  <div class="session-blocks">${currentSession.blocks.map(sessionBlock).join("")}</div>
 `,{back:true});
}
function sessionBlock(b){
 return `<section class="session-block"><header><div><b>${esc(b.label)}</b><small>${b.minutes} min</small></div></header>
 ${b.exercises.map((e,i)=>`<article class="exercise-row"><div class="order">${i+1}</div><div class="exercise-copy"><b>${esc(e.name)}</b><small>${esc(e.cues)}</small><div class="micro"><span>RPE ${e.prescription.rpe}</span><span>repos ${esc(e.prescription.rest)}</span><span>${e.suggestedLoad?`${e.suggestedLoad} kg suggérés`:"charge selon RPE"}</span></div></div><div class="prescription"><b>${e.prescription.sets} × ${esc(e.prescription.reps)}</b><small>${esc(e.prescription.tempo)}</small></div><button class="swap no-print" data-swap="${e.id}" data-block="${b.key}">Changer</button></article>`).join("")}</section>`;
}
async function shareSession(s=currentSession){
 if(!s)return;
 const text=sessionText(s);
 if(navigator.share){try{await navigator.share({title:`FAFATRAINING — ${s.title}`,text});return}catch(e){}}
 try{await navigator.clipboard.writeText(text);toast("Programme copié. Tu peux le coller dans Mail, Messages ou WhatsApp.")}catch(e){toast("Partage non disponible sur ce navigateur.")}
}
function sessionText(s){
 return `FAFATRAINING — ${s.title}\n${s.duration} min\n\n`+s.blocks.map(b=>`${b.label} (${b.minutes} min)\n`+b.exercises.map(e=>`• ${e.name} — ${e.prescription.sets} × ${e.prescription.reps} — repos ${e.prescription.rest} — RPE ${e.prescription.rpe}`).join("\n")).join("\n\n");
}

function libraryPage(){
 const families=["Tous",...new Set(masters.map(m=>m.family))], levels=["Tous","Débutant","Intermédiaire","Avancé","Expert"], eq=["Tous",...new Set(masters.flatMap(m=>m.equipment))];
 const list=masters.filter(m=>(!library.q||(`${m.name} ${m.search}`).includes(library.q.toLowerCase()))&&(library.family==="Tous"||m.family===library.family)&&(library.level==="Tous"||m.levels.includes(library.level))&&(library.equipment==="Tous"||m.equipment.includes(library.equipment)));
 return shell(`
  <header class="page-head"><div><p class="eyebrow">BIBLIOTHÈQUE COACH</p><h1>${masters.length} mouvements maîtres</h1><p>${exercises.length} variantes sont regroupées par mouvement, niveau et matériel pour éviter les faux doublons.</p></div></header>
  <section class="filter-bar">
   <input id="libq" value="${esc(library.q)}" placeholder="Rechercher un mouvement, muscle, matériel…">
   ${select("libfamily",families,library.family)}${select("liblevel",levels,library.level)}${select("libeq",eq,library.equipment)}
   <button class="reset-filter" data-reset-filter>Effacer les filtres</button>
  </section>
  <p class="result-count">${list.length} mouvement(s)</p>
  <section class="master-grid">${list.map(masterCard).join("")}</section>
 `);
}
function masterCard(m){
 return `<button class="master-card" data-movement="${m.id}"><div><span class="family">${esc(m.family)}</span><h3>${esc(m.name)}</h3><p>${esc(m.muscles.slice(0,4).join(" · "))}</p><small>${m.variants.length} variante(s) · ${esc(m.levels.join(" · "))}</small></div><i>›</i></button>`;
}
function movementPage(){
 const id=param("id"), m=masters.find(x=>x.id===id);if(!m)return libraryPage();
 return shell(`
  <header class="movement-head"><p class="eyebrow">${esc(m.family)}</p><h1>${esc(m.name)}</h1><p>Une seule fiche, toutes les progressions utiles à l’intérieur.</p></header>
  <section class="movement-summary">${summary("Muscles",m.muscles.join(" · "))}${summary("Matériel",m.equipment.join(" · "))}${summary("Niveaux",m.levels.join(" · "))}${summary("Variantes",m.variants.length)}</section>
  <section class="level-tabs">${m.levels.map(l=>`<button class="level-tab" data-level-jump="${esc(l)}">${esc(l)}</button>`).join("")}</section>
  <section class="variant-list">${m.levels.map(level=>`<div class="level-section" id="level-${slug(level)}"><h2>${level}</h2>${m.variants.filter(v=>v.level===level).map(variantCard).join("")}</div>`).join("")}</section>
 `,{back:true});
}
function variantCard(v){
 return `<article class="variant-card"><header><div><b>${esc(v.name)}</b><small>${esc(v.equipment.join(" · "))}</small></div><span>${esc(v.mode)}</span></header>
  <div class="howto"><div><b>Comment faire</b><p>${esc(v.cues)}</p></div><div><b>À éviter</b><p>${esc(v.error)}</p></div></div>
  <footer><small>${esc(v.muscles.join(" · "))}</small></footer></article>`;
}
function slug(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")}

function progress(){
 const id=state.activeAthleteId||state.athletes[0]?.id, a=state.athletes.find(x=>x.id===id), h=id?historyFor(id):state.sessions, st=progressStats(h);
 return shell(`
  <header class="page-head"><div><p class="eyebrow">SUIVI</p><h1>La progression, sans écran inutile.</h1><p>${a?`Coaché affiché : ${esc(a.firstName)}`:"Toutes les séances locales"}</p></div>${state.athletes.length?`<select id="progressClient" class="client-select">${state.athletes.map(x=>`<option value="${x.id}" ${x.id===id?"selected":""}>${esc(x.firstName)}</option>`).join("")}</select>`:""}</header>
  <section class="metric-grid">${metric("Séances",st.completed)}${metric("Temps",`${st.totalMinutes} min`)}${metric("Volume",`${st.volume.toLocaleString("fr-FR")} kg`)}${metric("1RM estimé",st.best1rm?`${st.best1rm} kg`:"—")}</section>
  <section class="panel"><div class="section-title"><div><h2>Historique</h2></div></div>${h.length?h.slice(0,15).map(s=>`<div class="history-row"><div><b>${esc(s.title)}</b><small>${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.duration} min · ${s.completedAt?"terminée":"préparée"}</small></div><button class="small-pill" data-open-session="${s.id}">Ouvrir</button></div>`).join(""):`<div class="empty compact">Pas encore de données.</div>`}</section>
 `);
}
function settings(){
 return shell(`<header class="page-head"><div><p class="eyebrow">RÉGLAGES</p><h1>FAFA · espace coach</h1><p>Sauvegarde locale, export et import.</p></div></header>
 <section class="panel"><h2>Données</h2><p class="muted">Sur GitHub Pages, les données restent sur cet appareil. Exporte-les pour les sauvegarder.</p><div class="actions"><button class="secondary" data-export>Exporter</button><label class="secondary file-button">Importer<input hidden type="file" id="importFile" accept="application/json"></label></div></section>`,{back:true});
}

function live(){
 const id=param("id");currentSession=state.sessions.find(s=>s.id===id)||currentSession;if(!currentSession)return sessionPage();
 const all=currentSession.blocks.flatMap(b=>b.exercises.map(e=>({...e,block:b.label})));
 return shell(`<header class="live-head"><div><p class="eyebrow">SÉANCE EN DIRECT</p><h1>${esc(currentSession.title)}</h1></div><button class="primary" data-finish>Terminer</button></header>
  <div class="timer-box"><div><small>REPOS</small><b id="timer">00:00</b></div><button class="small-pill" data-timer="60">1:00</button><button class="small-pill" data-timer="90">1:30</button><button class="small-pill" data-timer="120">2:00</button><button class="small-pill" data-timer-stop>Stop</button></div>
  <section class="live-list">${all.map(e=>`<article class="live-ex"><div class="live-name"><b>${esc(e.name)}</b><small>${esc(e.block)} · cible ${e.prescription.sets} × ${esc(e.prescription.reps)}</small></div><label>Séries<input type="number" value="${e.prescription.sets}" data-log-sets="${e.id}"></label><label>Reps<input type="number" data-log-reps="${e.id}"></label><label>kg<input type="number" step=".5" value="${e.suggestedLoad||""}" data-log-weight="${e.id}"></label><label>RPE<input type="number" step=".5" min="1" max="10" value="${e.prescription.rpe}" data-log-rpe="${e.id}"></label><button class="done" data-log="${e.id}">✓</button></article>`).join("")}</section>
 `,{back:true});
}

function metric(k,v){return `<article class="metric"><small>${esc(k)}</small><b>${esc(v)}</b></article>`}
function summary(k,v){return `<article><small>${esc(k)}</small><b>${esc(v)}</b></article>`}
function field(id,label,value,type="text"){return `<label class="field"><span>${label}</span><input id="${id}" type="${type}" value="${esc(value)}"></label>`}
function selectField(id,label,opts,value){return `<label class="field"><span>${label}</span><select id="${id}">${opts.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return `<option value="${esc(v)}" ${String(v)===String(value)?"selected":""}>${esc(l)}</option>`}).join("")}</select></label>`}
function select(id,arr,val){return `<select id="${id}">${arr.map(x=>`<option ${x===val?"selected":""}>${esc(x)}</option>`).join("")}</select>`}
function equipmentOptions(){return ["poids du corps","tapis","mur","chaise","banc","haltères","barre","kettlebell","élastique","machine","poulie","barre traction","box","step","medecine ball","sandbag","battle rope","sac","pattes d’ours","corde","rameur","vélo","skierg","sled","cônes","extérieur"]}

function saveClient(id){
 const existing=state.athletes.find(x=>x.id===id)||{};
 const equipment=clientDraft.equipment??existing.equipment??[], injuries=clientDraft.injuries??existing.injuries??[];
 const a={...existing,id:existing.id||uid("athlete"),firstName:$("#c_name").value.trim()||"Sans nom",age:Number($("#c_age").value)||null,height:Number($("#c_height").value)||null,weight:Number($("#c_weight").value)||null,level:$("#c_level").value,primaryGoal:$("#c_goal").value,secondaryGoal:$("#c_secondary").value.trim(),place:$("#c_place").value,duration:Number($("#c_duration").value)||30,equipment:equipment.length?equipment:["poids du corps"],injuries,createdAt:existing.createdAt||new Date().toISOString()};
 upsertAthlete(state,a);clientDraft={};toast("Coaché enregistré");go(`client?id=${a.id}`);
}
function swap(blockKey,id){
 const block=currentSession.blocks.find(b=>b.key===blockKey),ix=block?.exercises.findIndex(e=>e.id===id);if(ix<0)return;
 const old=block.exercises[ix], c=exercises.filter(e=>e.id!==id&&e.family===old.family&&(e.equipment.includes("poids du corps")||e.equipment.some(x=>currentSession.equipment.includes(x))));
 if(!c.length){toast("Pas d’alternative compatible.");return}
 const n=c[Math.floor(Math.random()*c.length)];block.exercises[ix]={...n,prescription:old.prescription,suggestedLoad:null};currentSession.exerciseIds=currentSession.blocks.flatMap(b=>b.exercises.map(e=>e.id));
 const si=state.sessions.findIndex(s=>s.id===currentSession.id);if(si>=0)state.sessions[si]=currentSession;saveState(state);render();
}
function startTimer(sec){clearInterval(timer);timerSeconds=sec;updateTimer();timer=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){clearInterval(timer);toast("Repos terminé")}},1000)}
function updateTimer(){const t=$("#timer");if(t)t.textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,"0")}:${String(timerSeconds%60).padStart(2,"0")}`}

function bind(){
 $$("[data-go]").forEach(x=>x.onclick=()=>{if(x.dataset.go==="create"){createStep=0;builder={};}go(x.dataset.go)});
 $$("[data-back]").forEach(x=>x.onclick=()=>history.length>1?history.back():go("home"));
 $$("[data-open-session]").forEach(x=>x.onclick=()=>go(`session?id=${x.dataset.openSession}`));
 $$("[data-share-session]").forEach(x=>x.onclick=()=>shareSession(state.sessions.find(s=>s.id===x.dataset.shareSession)));
 $$("[data-client]").forEach(x=>x.onclick=()=>go(`client?id=${x.dataset.client}`));
 $$("[data-edit-client]").forEach(x=>x.onclick=()=>{clientDraft={};go(`client-form?id=${x.dataset.editClient}`)});
 $$("[data-create-client]").forEach(x=>x.onclick=()=>{builder={athleteId:x.dataset.createClient};createStep=1;go("create")});
 $$("[data-new-client]").forEach(x=>x.onclick=()=>{clientDraft={equipment:["poids du corps"],injuries:[]};go("client-form")});
 $$("[data-delete-client]").forEach(x=>x.onclick=()=>{if(confirm("Supprimer ce coaché et son historique ?")){removeAthlete(state,x.dataset.deleteClient);toast("Coaché supprimé");render()}});
 $$("[data-form-equipment]").forEach(x=>x.onclick=()=>{clientDraft.equipment=clientDraft.equipment??(state.athletes.find(a=>a.id===param("id"))?.equipment||[]);const v=x.dataset.formEquipment;clientDraft.equipment=clientDraft.equipment.includes(v)?clientDraft.equipment.filter(z=>z!==v):[...clientDraft.equipment,v];x.classList.toggle("on")});
 $$("[data-form-injury]").forEach(x=>x.onclick=()=>{clientDraft.injuries=clientDraft.injuries??(state.athletes.find(a=>a.id===param("id"))?.injuries||[]);const v=x.dataset.formInjury;clientDraft.injuries=clientDraft.injuries.includes(v)?clientDraft.injuries.filter(z=>z!==v):[...clientDraft.injuries,v];x.classList.toggle("on")});
 $("[data-save-client]")?.addEventListener("click",e=>saveClient(e.currentTarget.dataset.saveClient));
 $$("[data-pick-client]").forEach(x=>x.onclick=()=>{builder={athleteId:x.dataset.pickClient};render()});
 $$("[data-pick-goal]").forEach(x=>x.onclick=()=>{builder.goal=x.dataset.pickGoal;builder.style=(STYLES[builder.goal]||[["standard"]])[0][0];render()});
 $$("[data-pick-style]").forEach(x=>x.onclick=()=>{builder.style=x.dataset.pickStyle;render()});
 $$("[data-create-next]").forEach(x=>x.onclick=()=>{if(createStep===1&&!builder.goal){toast("Choisis un objectif.");return}createStep=Math.min(3,createStep+1);render()});
 $$("[data-create-prev]").forEach(x=>x.onclick=()=>{createStep=Math.max(0,createStep-1);render()});
 $$("[data-duration]").forEach(x=>x.onclick=()=>{builder.duration=Number(x.dataset.duration);render()});
 $$("[data-range]").forEach(x=>x.oninput=()=>{builder[x.dataset.range]=Number(x.value);const t=$("#"+x.dataset.range+"v");if(t)t.textContent=x.value});
 $$("[data-builder-equipment]").forEach(x=>x.onclick=()=>{builder.equipment=builder.equipment||[];const v=x.dataset.builderEquipment;builder.equipment=builder.equipment.includes(v)?builder.equipment.filter(z=>z!==v):[...builder.equipment,v];x.classList.toggle("on")});
 $("[data-generate]")?.addEventListener("click",generate);
 $("[data-live]")?.addEventListener("click",()=>go(`live?id=${currentSession.id}`));
 $("[data-share]")?.addEventListener("click",()=>shareSession());
 $("[data-print]")?.addEventListener("click",()=>print());
 $("[data-adapt]")?.addEventListener("click",()=>{const s=currentSession;builder={athleteId:s.athleteId==="free"?"free":s.athleteId,goal:s.goal,style:s.style,duration:s.duration,_synced:false};createStep=2;go("create")});
 $$("[data-swap]").forEach(x=>x.onclick=()=>swap(x.dataset.block,x.dataset.swap));
 $("#libq")?.addEventListener("input",e=>{library.q=e.target.value;render()});
 $("#libfamily")?.addEventListener("change",e=>{library.family=e.target.value;render()});
 $("#liblevel")?.addEventListener("change",e=>{library.level=e.target.value;render()});
 $("#libeq")?.addEventListener("change",e=>{library.equipment=e.target.value;render()});
 $("[data-reset-filter]")?.addEventListener("click",()=>{library={q:"",family:"Tous",level:"Tous",equipment:"Tous"};render()});
 $$("[data-movement]").forEach(x=>x.onclick=()=>go(`movement?id=${x.dataset.movement}`));
 $$("[data-level-jump]").forEach(x=>x.onclick=()=>document.getElementById("level-"+slug(x.dataset.levelJump))?.scrollIntoView({behavior:"smooth"}));
 $("#progressClient")?.addEventListener("change",e=>{state.activeAthleteId=e.target.value;saveState(state);render()});
 $$("[data-timer]").forEach(x=>x.onclick=()=>startTimer(Number(x.dataset.timer)));
 $("[data-timer-stop]")?.addEventListener("click",()=>{clearInterval(timer);timerSeconds=0;updateTimer()});
 $$("[data-log]").forEach(x=>x.onclick=()=>{const id=x.dataset.log,current={exerciseId:id,sets:Number($(`[data-log-sets="${id}"]`).value)||0,reps:Number($(`[data-log-reps="${id}"]`).value)||0,weight:Number($(`[data-log-weight="${id}"]`).value)||0,rpe:Number($(`[data-log-rpe="${id}"]`).value)||0};currentSession.logs=(currentSession.logs||[]).filter(l=>l.exerciseId!==id);currentSession.logs.unshift(current);x.classList.add("on");toast("Enregistré")});
 $("[data-finish]")?.addEventListener("click",()=>{currentSession.completedAt=new Date().toISOString();const i=state.sessions.findIndex(s=>s.id===currentSession.id);if(i>=0)state.sessions[i]=currentSession;saveState(state);toast("Séance terminée");go("progress")});
 $("[data-export]")?.addEventListener("click",()=>exportState(state));
 $("#importFile")?.addEventListener("change",async e=>{try{state=await importState(e.target.files[0]);toast("Import terminé");render()}catch(e){toast("Fichier invalide")}});
}
function render(){
 clearInterval(timer);timer=null;
 const pages={home,clients,client:clientPage,"client-form":clientForm,create:createPage,session:sessionPage,live,library:libraryPage,movement:movementPage,progress,settings};
 document.getElementById("app").innerHTML=(pages[route()]||home)();bind();
}
init();
