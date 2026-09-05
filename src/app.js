
import {loadState,saveState,uid,upsertAthlete,removeAthlete,sessionsFor,exportState,importState} from "./storage.js";
import {bmi,readiness,generateSession,generateProgram,generateGroupClass,progressStats} from "./coach-engine.js";

let state=loadState();
let EX=[],MASTERS=[],CAT={disciplines:[],goals:[],formats:[]},EQUIP=[],PLACES=[];
let draft={},current=null,lib={q:"",type:"Tous",level:"Tous",place:"Tous",equipment:[],muscle:"Tous"};
let timerHandle=null,timerSec=0;

const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const logo="./assets/logo/logo-fafatraining.jpg";
const vis=n=>`./assets/visuals/${n||"coaching.jpeg"}`;
const route=()=>((location.hash||"#home").slice(1).split("?")[0]||"home");
const params=()=>new URLSearchParams(location.hash.split("?")[1]||"");
const go=x=>location.hash=x;
const discipline=id=>CAT.disciplines.find(x=>x.id===id)||CAT.disciplines[0];
const formatBy=id=>CAT.formats.find(x=>x.id===id)||CAT.formats[0];
const goalBy=id=>CAT.goals.find(x=>x.id===id)||CAT.goals[0];
const clients=()=>state.athletes||[];
const client=id=>clients().find(x=>x.id===id);
const history=id=>sessionsFor(state,id);
const allEquipment=()=>EQUIP.flatMap(g=>g.items.map(x=>({id:x[0],name:x[1],group:g.group})));
const equipName=id=>allEquipment().find(x=>x.id===id)?.name||id;
const placeName=id=>PLACES.find(x=>x.id===id)?.name||id;
const levelList=["Débutant","Intermédiaire","Avancé"];

function toast(t){const e=document.createElement("div");e.className="toast";e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2300)}
function backPill(){return `<button class="back-pill no-print" data-back><span>‹</span>Retour</button>`}
function topbar(){return `<header class="topbar no-print"><button class="brand" data-go="home"><img src="${logo}"><span>FAFATRAINING<small>BY FAFA</small></span></button><button class="round-tool" data-go="settings">•••</button></header>`}
function coachNav(){
 const r=route(),item=(to,icon,label)=>`<button class="${r===to?"active":""}" data-go="${to}"><b>${icon}</b><small>${label}</small></button>`;
 return `<nav class="bottom-nav no-print">${item("studio","⌂","Studio")}${item("clients","♙","Adhérents")}${item("build","＋","Créer")}${item("library","▦","Mouvements")}${item("progress","⌁","Suivi")}</nav>`;
}
function shell(body,{nav=true,back=false}={}){
 return `<main class="shell">${topbar()}${back?backPill():""}${body}</main>${nav?coachNav():""}`;
}
function publicShell(body,{back=false}={}){
 return `<main class="shell public-shell">${topbar()}${back?backPill():""}${body}</main>`;
}

async function init(){
 [EX,MASTERS,CAT,EQUIP,PLACES]=await Promise.all([
  fetch("./data/exercises.json?v=83").then(r=>r.json()),fetch("./data/master-movements.json?v=83").then(r=>r.json()),
  fetch("./data/training-catalog.json?v=83").then(r=>r.json()),fetch("./data/equipment-catalog.json?v=83").then(r=>r.json()),
  fetch("./data/places.json?v=83").then(r=>r.json())
 ]);
 if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
 addEventListener("hashchange",render);render();
}

/* ---------- PUBLIC HOME ---------- */
function home(){
 const showcases=["musculation","boxe","hiit","running","mobilite","cross_training"].map(id=>discipline(id));
 return publicShell(`
 <section class="landing-hero">
   <div class="landing-copy"><p class="eyebrow">FAFATRAINING · COACHING & PERFORMANCE</p>
    <h1>Une séance claire.<br>Un programme qui évolue.</h1>
    <p>FAFATRAINING réunit coaching individuel, programmes progressifs, cours collectifs et une bibliothèque pédagogique pensée pour comprendre quoi faire — et pourquoi.</p>
    <div class="hero-actions"><button class="primary xl" data-go="studio">Entrer dans l’application</button><button class="secondary xl" data-go="library-public">Découvrir les mouvements</button></div>
    <div class="platform-note">Téléphone · Android · iPhone · tablette · ordinateur · navigateur moderne</div>
   </div>
   <div class="landing-media"><img src="${vis("coaching.jpeg")}"><span class="hero-sign">FAFA</span></div>
 </section>
 <section class="value-row">
   <article><b>3 usages</b><span>Séance · Programme · Cours collectif</span></article>
   <article><b>${MASTERS.length}</b><span>familles de mouvements</span></article>
   <article><b>${EX.length}</b><span>variantes pédagogiques</span></article>
   <article><b>100 %</b><span>GitHub Pages</span></article>
 </section>
 <div class="section-title"><div><p class="eyebrow">UNIVERS</p><h2>Choisir sans connaître le jargon.</h2><p>Chaque univers explique simplement ce qu’il apporte avant d’entrer dans les détails.</p></div></div>
 <section class="showcase-grid">${showcases.map(d=>`<button class="showcase" data-public-type="${d.id}"><img src="${vis(d.visual)}"><div><span>${d.icon}</span><b>${esc(d.name)}</b><p>${esc(d.desc)}</p></div></button>`).join("")}</section>
 <section class="about-fafa"><img src="${vis("avatar-coach.jpeg")}"><div><p class="eyebrow">L’IDENTITÉ FAFATRAINING</p><h2>Une application conçue autour du terrain.</h2><p>FAFA accompagne la navigation, les explications et les séances. L’interface reste neutre pour que chacun puisse l’utiliser, tandis que le Studio permet au coach de préparer et suivre son travail.</p></div></section>
 `,{nav:false});
}

/* ---------- COACH STUDIO ---------- */
function studio(){
 return shell(`
 <section class="studio-hero"><div><p class="eyebrow">STUDIO FAFATRAINING</p><h1>Qu’est-ce que tu prépares ?</h1><p>Choisis le résultat à obtenir. L’application n’affiche ensuite que les réglages utiles.</p></div><img src="${vis("avatar-action.jpeg")}"></section>
 <section class="build-mode-grid">
  ${modeCard("session","⚡","Une séance","Préparer rapidement une séance pour une personne ou en libre.")}
  ${modeCard("program","▤","Un programme","Construire plusieurs semaines ou plusieurs mois avec progression et variété.")}
  ${modeCard("class","◌","Un cours collectif","Préparer un groupe, des stations, des niveaux mixtes et le matériel disponible.")}
 </section>
 <section class="studio-tools">
  <button data-go="guide"><span>?</span><div><b>Je ne sais pas quoi choisir</b><small>Quelques questions et FAFATRAINING propose les formats adaptés.</small></div><i>›</i></button>
  <button data-go="clients"><span>♙</span><div><b>${clients().length} adhérent(s)</b><small>Profils, historique, séances et programmes.</small></div><i>›</i></button>
  <button data-go="library"><span>▦</span><div><b>Bibliothèque pédagogique</b><small>Rechercher par mouvement, muscle, niveau, lieu, matériel ou discipline.</small></div><i>›</i></button>
 </section>
 `);
}
function modeCard(id,icon,title,txt){return `<button class="mode-card" data-mode="${id}"><span>${icon}</span><b>${title}</b><p>${txt}</p><i>Commencer ›</i></button>`}

/* ---------- GUIDE ---------- */
function guide(){
 const step=Number(draft.guideStep||0);
 if(step===0)return shell(guideCard("Ton objectif principal","On commence par ce que tu veux obtenir.",CAT.goals.slice(0,15).map(x=>[x.id,x.name,x.desc]),"guideGoal"),{back:true});
 if(step===1)return shell(guideCard("Où vas-tu t’entraîner ?","Le lieu élimine déjà beaucoup de choix inutiles.",PLACES.map(x=>[x.id,x.name,x.desc]),"guidePlace"),{back:true});
 if(step===2)return shell(guideCard("Quel rythme tu veux ?","Le format recommandé dépend aussi de l’intensité que tu recherches.",[["calme","Calme / technique","Je veux surtout bien bouger et contrôler."],["modere","Soutenu","Je veux travailler sérieusement sans être à fond."],["intense","Intense","Je veux une séance dynamique et exigeante."]],"guideIntensity"),{back:true});
 const goal=draft.guideGoal,intensity=draft.guideIntensity;
 let types=CAT.disciplines.filter(d=>{
  if(goal==="boxing_tech"||goal==="boxing_conditioning")return ["boxe","cardio_boxing"].includes(d.id);
  if(goal==="endurance"||goal==="speed")return ["running","trail","hiit","aerobic"].includes(d.id);
  if(goal==="mobility"||goal==="recovery")return ["mobilite","souplesse","recovery","prevention"].includes(d.id);
  if(["strength","hypertrophy","chest","back","shoulders","arms","biceps","triceps","glutes","legs","quads","hamstrings"].includes(goal))return ["musculation","poids_corps","functional","kettlebell","suspension"].includes(d.id);
  return ["functional","cross_training","hiit","poids_corps","musculation"].includes(d.id);
 }).slice(0,4);
 return shell(`<header class="page-head"><div><p class="eyebrow">FAFA T’AIDE À CHOISIR</p><h1>Voici les options les plus cohérentes.</h1><p>Tu peux lire l’explication puis lancer directement la création.</p></div></header>
 <section class="recommend-grid">${types.map(d=>`<article><img src="${vis(d.visual)}"><div><b>${d.icon} ${d.name}</b><p>${d.desc}</p><button class="primary small" data-guide-start="${d.id}">Choisir</button></div></article>`).join("")}</section>`,{back:true});
}
function guideCard(title,sub,items,key){return `<section class="wizard"><p class="eyebrow">AIDE AU CHOIX</p><h1>${title}</h1><p>${sub}</p><div class="choice-grid">${items.map(([id,n,d])=>`<button class="choice ${draft[key]===id?"on":""}" data-guide-choice="${key}" data-value="${id}"><b>${esc(n)}</b><small>${esc(d)}</small></button>`).join("")}</div><div class="wizard-actions"><span></span><button class="primary" data-guide-next>Continuer</button></div></section>`}

/* ---------- CLIENTS ---------- */
function clientsPage(){
 return shell(`<header class="page-head"><div><p class="eyebrow">ADHÉRENTS</p><h1>Chaque personne a son espace.</h1><p>Le profil sert au moteur : niveau, objectif, matériel habituel et contraintes ne sont pas redemandés à chaque séance.</p></div><button class="primary" data-new-client>＋ Ajouter</button></header>
 ${clients().length?`<section class="client-list">${clients().map(clientRow).join("")}</section>`:`<section class="empty"><h2>Aucun adhérent</h2><p>Ajoute ton premier profil pour commencer un coaching personnalisé.</p><button class="primary" data-new-client>Ajouter un adhérent</button></section>`}`);
}
function clientRow(a){
 const h=history(a.id),ps=(state.programs||[]).filter(p=>p.athleteId===a.id);
 return `<article class="client-row"><div class="client-avatar">${esc((a.firstName||"?")[0].toUpperCase())}</div><div><b>${esc(a.firstName||"Sans nom")}</b><small>${esc(a.level||"—")} · ${esc(goalBy(a.primaryGoal)?.name||a.primaryGoal||"Objectif à définir")}</small></div><div class="client-stat"><b>${h.filter(x=>x.completedAt).length}</b><small>séances</small></div><div class="client-stat"><b>${ps.length}</b><small>programmes</small></div><div class="row-actions"><button class="round-action" data-client="${a.id}">›</button><button class="round-action" data-build-client="${a.id}">＋</button><button class="round-action danger" data-delete-client="${a.id}">×</button></div></article>`;
}
function clientView(){
 const a=client(params().get("id"));if(!a)return clientsPage();
 const h=history(a.id),ps=(state.programs||[]).filter(p=>p.athleteId===a.id),st=progressStats(h),imc=bmi(a.weight,a.height);
 return shell(`<header class="client-head"><div><p class="eyebrow">ADHÉRENT</p><h1>${esc(a.firstName)}</h1><p>${esc(a.level)} · ${esc(goalBy(a.primaryGoal)?.name||"Objectif libre")}</p></div><div class="hero-actions"><button class="primary" data-build-client="${a.id}">Créer</button><button class="secondary" data-edit-client="${a.id}">Modifier</button></div></header>
 <section class="metric-grid">${metric("Séances",st.completed)}${metric("Temps",`${st.totalMinutes} min`)}${metric("Programmes",ps.length)}${metric("IMC",imc.value||"—")}</section>
 <section class="panel"><div class="section-title"><div><h2>Programmes</h2></div></div>${ps.length?ps.map(p=>historyRow(p.name,`${p.weeks} semaines · ${p.perWeek} séance(s)/sem.`,`program?id=${p.id}`)).join(""):`<div class="empty compact">Aucun programme enregistré.</div>`}</section>
 <section class="panel"><div class="section-title"><div><h2>Séances récentes</h2></div></div>${h.length?h.slice(0,8).map(s=>historyRow(s.title,`${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.duration} min`,`session?id=${s.id}`)).join(""):`<div class="empty compact">Aucune séance.</div>`}</section>
 `,{back:true});
}
function historyRow(title,sub,href){return `<div class="history-row"><div><b>${esc(title)}</b><small>${esc(sub)}</small></div><button class="small-pill" data-go="${href}">Ouvrir</button></div>`}
function clientForm(){
 const id=params().get("id"),a=client(id)||draft.client||{equipment:[],injuries:[]};
 return shell(`<header class="page-head"><div><p class="eyebrow">${id?"MODIFIER":"NOUVEL ADHÉRENT"}</p><h1>Les informations utiles au coaching.</h1><p>Pas de champs décoratifs : chaque donnée doit servir au programme ou au suivi.</p></div></header>
 <section class="panel">
 <div class="form-grid">
 ${field("cf_name","Prénom / nom",a.firstName||"")}${field("cf_age","Âge",a.age||"","number")}${field("cf_height","Taille cm",a.height||"","number")}${field("cf_weight","Poids kg",a.weight||"","number")}
 ${selectField("cf_level","Niveau",levelList,a.level||"Débutant")}${selectField("cf_goal","Objectif principal",CAT.goals.map(x=>[x.id,x.name]),a.primaryGoal||"full_body")}
 ${field("cf_secondary","Objectif secondaire / précision",a.secondaryGoal||"")}${selectField("cf_place","Lieu habituel",PLACES.map(x=>[x.id,x.name]),a.place||"mixed")}
 ${selectField("cf_duration","Durée habituelle",[[20,"20 min"],[30,"30 min"],[45,"45 min"],[60,"60 min"],[75,"75 min"]],a.duration||45)}
 </div>
 <div class="form-section"><b>Matériel habituel</b><p>Tu peux en sélectionner plusieurs.</p>${equipmentPicker("client",a.equipment||[])}</div>
 <div class="form-section"><b>Zones à protéger</b><div class="chip-wrap">${["Épaule","Genou","Dos / lombaires","Cheville","Poignet","Hanches"].map(x=>`<button class="chip ${(a.injuries||[]).includes(x)?"on":""}" data-client-injury="${x}">${x}</button>`).join("")}</div></div>
 <div class="hero-actions"><button class="primary" data-save-client="${id||""}">Enregistrer</button><button class="secondary" data-back>Annuler</button></div>
 </section>`,{back:true});
}

/* ---------- BUILD CHOOSER ---------- */
function build(){
 return shell(`<header class="page-head"><div><p class="eyebrow">CRÉER</p><h1>Un seul point de départ, trois résultats.</h1><p>Pas de doublon : choisis ce que tu veux construire.</p></div></header>
 <section class="build-mode-grid">${modeCard("session","⚡","Une séance","Une séance ponctuelle, libre ou pour un adhérent.")}${modeCard("program","▤","Un programme","Plusieurs semaines avec variation et progression.")}${modeCard("class","◌","Un cours collectif","Groupe, stations, niveaux mixtes et quantités de matériel.")}</section>`);
}

/* ---------- SESSION BUILDER ---------- */
function sessionBuilder(){
 const step=Number(draft.step||0),profile=draft.clientId?client(draft.clientId):null;
 if(step===0)return shell(wizardHead("Séance","Pour qui est la séance ?","Choisis un adhérent ou une séance libre.")+`<div class="person-grid"><button class="person-card ${draft.clientId==="free"?"on":""}" data-session-person="free"><span>⚡</span><b>Séance libre</b><small>Sans profil enregistré</small></button>${clients().map(a=>`<button class="person-card ${draft.clientId===a.id?"on":""}" data-session-person="${a.id}"><span>${esc(a.firstName[0])}</span><b>${esc(a.firstName)}</b><small>${esc(a.level||"—")}</small></button>`).join("")}</div>${nextBack(false,"session")}`,{back:true});
 if(step===1)return shell(wizardHead("Séance","Quel univers ?","Lis l’explication avant de choisir.")+disciplineGrid(draft.trainingType)+nextBack(true,"session"),{back:true});
 if(step===2)return shell(wizardHead("Séance","Que veux-tu cibler ?","Un objectif global ou plusieurs muscles précis.")+multiGoals(draft.targets||[])+`<div class="form-section"><b>Format de séance</b><p>Le format change la façon d’organiser le travail.</p>${formatGrid(draft.format)}</div>`+nextBack(true,"session"),{back:true});
 if(step===3){
  hydrateDraft(profile);
  return shell(wizardHead("Séance","Aujourd’hui","Seules les informations qui peuvent changer sont demandées.")+
   `<div class="quick-select"><b>Durée</b>${[20,30,45,60,75].map(x=>`<button class="chip ${Number(draft.duration)===x?"on":""}" data-duration="${x}">${x} min</button>`).join("")}</div>
   <div class="form-section"><b>Lieu</b><div class="chip-wrap">${PLACES.map(x=>`<button class="chip ${draft.place===x.id?"on":""}" data-place="${x.id}">${x.name}</button>`).join("")}</div></div>
   <div class="today-grid">${range("fatigue","Fatigue",draft.fatigue??3,1)}${range("stress","Stress",draft.stress??3,1)}${range("sleep","Sommeil",draft.sleep??3,1)}${range("pain","Douleur",draft.pain??0,0)}</div>
   <div class="form-section"><b>Matériel disponible aujourd’hui</b><p>Plusieurs choix possibles.</p>${equipmentPicker("draft",draft.equipment||[])}</div>${nextBack(true,"session")}`,{back:true});
 }
 return shell(wizardHead("Séance","Vérification","Tout est prêt. Tu peux encore revenir sans perdre tes choix.")+reviewSession(profile)+`<div class="wizard-actions"><button class="secondary" data-builder-prev>Retour</button><button class="primary xl" data-generate-session>Générer la séance</button></div>`,{back:true});
}

/* ---------- PROGRAM BUILDER ---------- */
function programBuilder(){
 const step=Number(draft.step||0),a=draft.clientId?client(draft.clientId):null;
 if(step===0)return shell(wizardHead("Programme","Pour quel adhérent ?","Un programme long doit être rattaché à un profil.")+`<div class="person-grid">${clients().map(x=>`<button class="person-card ${draft.clientId===x.id?"on":""}" data-program-person="${x.id}"><span>${esc(x.firstName[0])}</span><b>${esc(x.firstName)}</b><small>${esc(x.level||"—")}</small></button>`).join("")}</div>${!clients().length?`<div class="empty">Ajoute d’abord un adhérent.</div>`:""}${nextBack(false,"program")}`,{back:true});
 if(step===1)return shell(wizardHead("Programme","Objectif et univers","Le plan varie les séances tout en gardant un fil conducteur.")+disciplineGrid(draft.trainingType)+`<div class="form-section">${multiGoals(draft.targets||[])}</div>${nextBack(true,"program")}`,{back:true});
 if(step===2)return shell(wizardHead("Programme","Durée du plan","Choisis une durée et une fréquence réalistes.")+`<div class="form-grid">${field("prog_name","Nom du programme",draft.name||`Programme ${a?.firstName||""}`)}${selectField("prog_weeks","Durée",[[4,"1 mois · 4 semaines"],[6,"6 semaines"],[8,"2 mois · 8 semaines"],[12,"3 mois · 12 semaines"],[16,"4 mois · 16 semaines"],[24,"6 mois · 24 semaines"]],draft.weeks||8)}${selectField("prog_freq","Séances / semaine",[[2,"2"],[3,"3"],[4,"4"],[5,"5"]],draft.sessionsPerWeek||3)}${selectField("prog_duration","Durée / séance",[[30,"30 min"],[45,"45 min"],[60,"60 min"],[75,"75 min"]],draft.duration||a?.duration||45)}</div><div class="form-section"><b>Formats autorisés</b><p>En sélectionner plusieurs crée de la variété d’une séance à l’autre.</p>${formatMulti(draft.formats||["series"])}</div>${nextBack(true,"program")}`,{back:true});
 if(step===3){hydrateDraft(a);return shell(wizardHead("Programme","Contexte habituel","Matériel et lieu servent à créer toutes les semaines.")+`<div class="form-section"><b>Lieu principal</b><div class="chip-wrap">${PLACES.map(x=>`<button class="chip ${draft.place===x.id?"on":""}" data-place="${x.id}">${x.name}</button>`).join("")}</div></div><div class="form-section"><b>Matériel</b>${equipmentPicker("draft",draft.equipment||[])}</div>${nextBack(true,"program")}`,{back:true})}
 return shell(wizardHead("Programme","Prêt à construire","Le moteur va varier les séances et intégrer des semaines de progression/consolidation.")+reviewProgram(a)+`<div class="wizard-actions"><button class="secondary" data-builder-prev>Retour</button><button class="primary xl" data-generate-program>Construire le programme</button></div>`,{back:true});
}

/* ---------- GROUP CLASS BUILDER ---------- */
function classBuilder(){
 const step=Number(draft.step||0);
 if(step===0)return shell(wizardHead("Cours collectif","Quel type de cours ?","Choisis l’univers avant le format.")+disciplineGrid(draft.trainingType)+nextBack(false,"class"),{back:true});
 if(step===1)return shell(wizardHead("Cours collectif","Cible et format","Le même cours pourra avoir une option Débutant, Intermédiaire et Avancé à chaque atelier.")+multiGoals(draft.targets||["full_body"])+`<div class="form-section">${formatGrid(draft.format||"stations")}</div>${nextBack(true,"class")}`,{back:true});
 if(step===2)return shell(wizardHead("Cours collectif","Ton groupe","Le nombre de personnes et d’ateliers détermine les rotations.")+`<div class="form-grid">${field("class_name","Nom du cours",draft.name||"Cours FAFATRAINING")}${field("class_people","Participants",draft.participants||10,"number")}${selectField("class_duration","Durée",[[30,"30 min"],[45,"45 min"],[60,"60 min"],[75,"75 min"]],draft.duration||45)}${selectField("class_stations","Nombre d’ateliers",[[3,"3"],[4,"4"],[5,"5"],[6,"6"],[8,"8"],[10,"10"]],draft.stations||6)}${selectField("class_rounds","Tours",[[2,"2"],[3,"3"],[4,"4"],[5,"5"]],draft.rounds||3)}</div>${nextBack(true,"class")}`,{back:true});
 if(step===3)return shell(wizardHead("Cours collectif","Lieu et matériel","Sélectionne le matériel puis indique les quantités réellement disponibles.")+`<div class="form-section"><b>Lieu</b><div class="chip-wrap">${PLACES.map(x=>`<button class="chip ${draft.place===x.id?"on":""}" data-place="${x.id}">${x.name}</button>`).join("")}</div></div><div class="form-section"><b>Matériel disponible</b>${equipmentPicker("draft",draft.equipment||[])}</div>${quantityEditor(draft.equipment||[],draft.equipmentQuantities||{})}${nextBack(true,"class")}`,{back:true});
 return shell(wizardHead("Cours collectif","Prêt à créer","Le moteur vérifiera aussi si la quantité de matériel convient au nombre de personnes par atelier.")+reviewClass()+`<div class="wizard-actions"><button class="secondary" data-builder-prev>Retour</button><button class="primary xl" data-generate-class>Créer le cours</button></div>`,{back:true});
}

/* ---------- LIBRARY ---------- */
function libraryPage(publicMode=false){
 const types=["Tous",...CAT.disciplines.map(x=>x.id)],places=["Tous",...PLACES.map(x=>x.id)],levels=["Tous",...levelList];
 const muscles=["Tous",...new Set(MASTERS.flatMap(m=>m.muscles))].sort((a,b)=>a.localeCompare(b,"fr"));
 const list=MASTERS.filter(m=>{
  const qok=!lib.q||(`${m.name} ${m.search}`).includes(lib.q.toLowerCase());
  const tok=lib.type==="Tous"||(m.trainingTypes||[]).includes(lib.type);
  const lok=lib.level==="Tous"||Boolean(m.adaptations?.[lib.level]);
  const pok=lib.place==="Tous"||(m.places||[]).includes(placeName(lib.place));
  const mok=lib.muscle==="Tous"||(m.muscles||[]).includes(lib.muscle);
  const eok=!lib.equipment.length||lib.equipment.some(x=>m.equipment.includes(x));
  return qok&&tok&&lok&&pok&&mok&&eok;
 });
 const body=`<header class="page-head"><div><p class="eyebrow">BIBLIOTHÈQUE PÉDAGOGIQUE</p><h1>${MASTERS.length} mouvements · ${EX.length} variantes</h1><p>Une fiche = un mouvement. Les variantes, niveaux, matériels et explications restent à l’intérieur.</p></div></header>
 <section class="library-controls">
  <input id="lib_q" value="${esc(lib.q)}" placeholder="Rechercher : pompes, triceps, sac, TRX…">
  ${select("lib_type",types.map(x=>x==="Tous"?["Tous","Toutes disciplines"]:[x,discipline(x)?.name||x]),lib.type)}
  ${select("lib_level",levels,lib.level)}
  ${select("lib_place",places.map(x=>x==="Tous"?["Tous","Tous lieux"]:[x,placeName(x)]),lib.place)}
  ${select("lib_muscle",muscles,lib.muscle)}
  <button class="equipment-button ${lib.equipment.length?"on":""}" data-library-equipment>Matériel ${lib.equipment.length?`(${lib.equipment.length})`:""}</button>
  <button class="reset-filter" data-reset-library>Effacer</button>
 </section>
 ${draft.libEquipmentOpen?`<section class="equipment-drawer"><header><div><b>Matériel</b><small>Sélection multiple : un mouvement est affiché s’il est compatible avec au moins un matériel choisi.</small></div><button class="round-action" data-close-library-equipment>×</button></header>${equipmentPicker("library",lib.equipment)}</section>`:""}
 <p class="result-count">${list.length} résultat(s)</p>
 <section class="master-grid">${list.map(m=>masterCard(m,publicMode)).join("")}</section>`;
 return publicMode?publicShell(body,{back:true}):shell(body,{back:true});
}
function masterCard(m,publicMode=false){return `<button class="master-card" ${publicMode?`data-movement-public="${m.id}"`:`data-movement="${m.id}"`}><div><span class="family">${esc(m.family)}</span><h3>${esc(m.name)}</h3><p>${esc(m.muscles.slice(0,4).join(" · "))}</p><small>${m.variants.length} variante(s) · ${m.levels.join(" · ")}</small></div><i>›</i></button>`}
function movement(publicMode=false){
 const m=MASTERS.find(x=>x.id===params().get("id"));if(!m)return libraryPage(publicMode);
 const body=`<header class="movement-head"><p class="eyebrow">${esc(m.family)}</p><h1>${esc(m.name)}</h1><p>Choisis ton niveau. L’application montre une version concrète, sa technique et les variantes possibles.</p></header>
 <section class="movement-summary">${summary("Muscles",m.muscles.join(" · "))}${summary("Lieux",m.places.join(" · "))}${summary("Matériel",m.equipment.join(" · "))}</section>
 <div class="level-pills">${levelList.map(l=>`<button class="chip" data-scroll-level="${l}">${l}</button>`).join("")}</div>
 <section class="level-stack">${levelList.map(l=>levelCard(m,l)).join("")}</section>
 <div class="section-title"><div><h2>Autres variantes</h2><p>Chaque variante possède sa propre explication, pas un texte copié.</p></div></div>
 <section class="variant-grid">${m.variants.map(v=>variantCard(v)).join("")}</section>`;
 return publicMode?publicShell(body,{back:true}):shell(body,{back:true});
}
function levelCard(m,l){const a=m.adaptations[l];return `<article class="level-card" id="lvl-${slug(l)}"><header><span>${l}</span><b>${esc(a.variantName)}</b></header><p class="plain">${esc(a.explanation)}</p><div class="howto"><div><b>Comment faire</b><p>${esc(a.cues)}</p></div><div><b>À éviter</b><p>${esc(a.error)}</p></div></div><div class="info-strip"><span>${esc(a.prescription)}</span><span>${esc((a.equipment||[]).map(equipName).join(" · ")||"Sans matériel")}</span></div></article>`}
function variantCard(v){return `<article class="variant-card"><header><div><b>${esc(v.name)}</b><small>${esc(v.level3)} · ${esc((v.equipment||[]).map(equipName).join(" · "))}</small></div></header><p>${esc(v.explanation)}</p><div class="howto"><div><b>Exécution</b><p>${esc(v.cues)}</p></div><div><b>Erreur fréquente</b><p>${esc(v.error)}</p></div></div></article>`}

/* ---------- RESULTS ---------- */
function sessionView(){
 const s=(state.sessions||[]).find(x=>x.id===params().get("id"));if(!s)return shell(`<div class="empty">Séance introuvable.</div>`,{back:true});
 current=s;const d=discipline(s.trainingType);
 return shell(`<section class="result-hero print-head"><div><img class="print-logo" src="${logo}"><p class="eyebrow">${esc(d?.name||"Séance")} · ${esc(formatBy(s.format)?.name||s.format)}</p><h1>${esc(s.title)}</h1><p>${esc(s.coachNote)}</p><div class="result-badges"><span>${s.duration} min</span><span>${s.level}</span><span>${s.readiness}% disponibilité</span></div></div><img src="${vis(d?.visual)}"></section>
 <div class="result-actions no-print"><button class="primary" data-live="${s.id}">▶ Démarrer</button><button class="secondary" data-share-kind="session" data-share-id="${s.id}">⌁ Partager</button><button class="secondary" data-download-kind="session" data-download-id="${s.id}">⇩ Fiche</button><button class="secondary" data-print>⌑ Imprimer / PDF</button></div>
 <div class="result-meta">${summary("Cibles",(s.targets||[]).map(x=>goalBy(x)?.name||x).join(" · "))}${summary("Lieu",placeName(s.place))}${summary("Matériel",(s.equipment||[]).map(equipName).join(" · ")||"Sans matériel")}</div>
 <section class="session-blocks">${s.blocks.map(sessionBlock).join("")}</section>
 <footer class="print-signature"><img src="${logo}"><div><b>FAFATRAINING</b><small>Programme préparé avec FAFATRAINING · FAFA</small></div></footer>`,{back:true});
}
function sessionBlock(b){return `<article class="session-block"><header><div><b>${esc(b.label)}</b><small>${b.minutes} min</small></div></header>${b.exercises.map((e,i)=>`<div class="exercise-row"><span class="order">${i+1}</span><div><b>${esc(e.name)}</b><small>${esc(e.cues)}</small><div class="mini-tags"><span>RPE ${e.prescription.rpe}</span><span>repos ${esc(e.prescription.rest)}</span>${e.suggestedLoad?`<span>${e.suggestedLoad} kg suggérés</span>`:""}</div></div><div class="rx"><b>${e.prescription.sets} × ${esc(e.prescription.reps)}</b><small>${esc(e.prescription.tempo)}</small></div></div>`).join("")}</article>`}
function programView(){
 const p=(state.programs||[]).find(x=>x.id===params().get("id"));if(!p)return shell(`<div class="empty">Programme introuvable.</div>`,{back:true});
 current=p;const a=client(p.athleteId);
 return shell(`<section class="program-cover print-head"><div><img class="print-logo" src="${logo}"><p class="eyebrow">PROGRAMME PERSONNALISÉ</p><h1>${esc(p.name)}</h1><p>${esc(a?.firstName||"Adhérent")} · ${p.weeks} semaines · ${p.perWeek} séance(s) / semaine</p></div><img src="${vis(discipline(p.choice.trainingType)?.visual)}"></section>
 <div class="result-actions no-print"><button class="secondary" data-share-kind="program" data-share-id="${p.id}">⌁ Partager</button><button class="secondary" data-download-kind="program" data-download-id="${p.id}">⇩ Fiche complète</button><button class="secondary" data-print>⌑ Imprimer / PDF</button></div>
 <section class="program-weeks">${p.schedule.map(w=>`<article class="week-card"><header><div><span>Semaine ${w.number}</span><b>${esc(w.phase)}</b></div></header><div class="week-sessions">${w.sessions.map(s=>`<button data-program-session="${p.id}" data-week="${w.number}" data-session-index="${s.day-1}"><b>${esc(s.title)}</b><small>${esc(formatBy(s.format)?.name||s.format)} · ${s.duration} min · ${s.exerciseIds.length} exercices</small><i>›</i></button>`).join("")}</div></article>`).join("")}</section>
 <footer class="print-signature"><img src="${logo}"><div><b>FAFATRAINING</b><small>Programme personnalisé · FAFA</small></div></footer>`,{back:true});
}
function classView(){
 const c=(state.groupClasses||[]).find(x=>x.id===params().get("id"));if(!c)return shell(`<div class="empty">Cours introuvable.</div>`,{back:true});
 current=c;
 return shell(`<section class="program-cover print-head"><div><img class="print-logo" src="${logo}"><p class="eyebrow">COURS COLLECTIF</p><h1>${esc(c.name)}</h1><p>${c.participants} participants · ${c.duration} min · ${c.rounds} tours · ${esc(formatBy(c.format)?.name||c.format)}</p></div><img src="${vis(discipline(c.trainingType)?.visual)}"></section>
 <div class="result-actions no-print"><button class="secondary" data-share-kind="class" data-share-id="${c.id}">⌁ Partager</button><button class="secondary" data-download-kind="class" data-download-id="${c.id}">⇩ Fiche cours</button><button class="secondary" data-print>⌑ Imprimer / PDF</button></div>
 <section class="station-grid">${c.stations.map(s=>`<article class="station-card"><header><span>${s.number}</span><div><b>${esc(s.exercise.name)}</b><small>${s.people} personne(s) · ${s.work} / ${s.rest}</small></div></header><p>${esc(s.exercise.cues)}</p><div class="level-mini"><span><b>Débutant</b>${esc(s.levels.Débutant)}</span><span><b>Intermédiaire</b>${esc(s.levels.Intermédiaire)}</span><span><b>Avancé</b>${esc(s.levels.Avancé)}</span></div><footer>${esc(s.equipmentNote)}</footer></article>`).join("")}</section>
 <footer class="print-signature"><img src="${logo}"><div><b>FAFATRAINING</b><small>Fiche cours collectif · FAFA</small></div></footer>`,{back:true});
}
function liveView(){
 const s=(state.sessions||[]).find(x=>x.id===params().get("id"));if(!s)return sessionView();current=s;
 const all=s.blocks.flatMap(b=>b.exercises.map(e=>({...e,block:b.label})));
 return shell(`<header class="page-head"><div><p class="eyebrow">SÉANCE EN DIRECT</p><h1>${esc(s.title)}</h1></div><button class="primary" data-finish-session>Terminer</button></header>
 <div class="timer-box"><div><small>REPOS</small><b id="timerText">00:00</b></div><button class="small-pill" data-timer="60">1:00</button><button class="small-pill" data-timer="90">1:30</button><button class="small-pill" data-timer="120">2:00</button><button class="small-pill" data-timer-stop>Stop</button></div>
 <section class="live-list">${all.map(e=>`<article><div><b>${esc(e.name)}</b><small>${esc(e.block)} · cible ${e.prescription.sets} × ${esc(e.prescription.reps)}</small></div><label>Séries<input data-log-sets="${e.id}" type="number" value="${e.prescription.sets}"></label><label>Reps<input data-log-reps="${e.id}" type="number"></label><label>kg<input data-log-weight="${e.id}" type="number" step=".5" value="${e.suggestedLoad||""}"></label><label>RPE<input data-log-rpe="${e.id}" type="number" step=".5" min="1" max="10" value="${e.prescription.rpe}"></label><button class="done" data-log="${e.id}">✓</button></article>`).join("")}</section>`,{back:true});
}

/* ---------- PROGRESS ---------- */
function progress(){
 const id=state.activeAthleteId||clients()[0]?.id,a=client(id),h=a?history(a.id):[],st=progressStats(h);
 return shell(`<header class="page-head"><div><p class="eyebrow">SUIVI</p><h1>Voir ce qui progresse réellement.</h1><p>Séances terminées, temps, volume et estimation de force.</p></div>${clients().length?select("progress_client",clients().map(x=>[x.id,x.firstName]),id):""}</header>
 <section class="metric-grid">${metric("Séances",st.completed)}${metric("Temps",`${st.totalMinutes} min`)}${metric("Volume",`${st.volume.toLocaleString("fr-FR")} kg`)}${metric("1RM estimé",st.best1rm?`${st.best1rm} kg`:"—")}</section>
 <section class="panel">${h.length?h.slice(0,15).map(s=>historyRow(s.title,`${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.duration} min`, `session?id=${s.id}`)).join(""):`<div class="empty compact">Aucune séance enregistrée pour ce profil.</div>`}</section>`);
}

/* ---------- SETTINGS ---------- */
function settings(){
 return shell(`<header class="page-head"><div><p class="eyebrow">RÉGLAGES</p><h1>FAFATRAINING local.</h1><p>Les données restent dans ce navigateur. Export/import permet de les sauvegarder.</p></div></header><section class="panel"><div class="hero-actions"><button class="secondary" data-export>Exporter les données</button><label class="secondary file-label">Importer<input id="importFile" hidden type="file" accept="application/json"></label></div><p class="muted">GitHub Pages est volontairement conservé sans serveur ni authentification externe.</p></section>`,{back:true});
}

/* ---------- HELPERS ---------- */
function wizardHead(k,title,sub){return `<section class="wizard"><p class="eyebrow">${k.toUpperCase()}</p><h1>${title}</h1><p>${sub}</p></section>`}
function nextBack(showBack,kind){return `<div class="wizard-actions">${showBack?`<button class="secondary" data-builder-prev>Retour</button>`:"<span></span>"}<button class="primary" data-builder-next="${kind}">Continuer</button></div>`}
function disciplineGrid(selected){return `<div class="discipline-grid">${CAT.disciplines.map(d=>`<button class="discipline-card ${selected===d.id?"on":""}" data-discipline="${d.id}"><img src="${vis(d.visual)}"><div><span>${d.icon}</span><b>${esc(d.name)}</b><p>${esc(d.desc)}</p></div></button>`).join("")}</div>`}
function multiGoals(selected){return `<div class="form-section"><b>Cible</b><p>Tu peux sélectionner plusieurs zones ou objectifs.</p><div class="goal-grid">${CAT.goals.map(g=>`<button class="goal-card ${selected.includes(g.id)?"on":""}" data-goal="${g.id}"><b>${esc(g.name)}</b><small>${esc(g.desc)}</small></button>`).join("")}</div></div>`}
function formatGrid(selected){return `<div class="format-grid">${CAT.formats.map(f=>`<button class="format-card ${selected===f.id?"on":""}" data-format="${f.id}"><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></button>`).join("")}</div>`}
function formatMulti(selected){return `<div class="format-grid">${CAT.formats.map(f=>`<button class="format-card ${selected.includes(f.id)?"on":""}" data-format-multi="${f.id}"><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></button>`).join("")}</div>`}
function equipmentPicker(scope,selected){return `<div class="equipment-groups">${EQUIP.map(g=>`<details><summary>${esc(g.group)}<span>${g.items.filter(x=>selected.includes(x[0])).length||""}</span></summary><div class="chip-wrap">${g.items.map(([id,n])=>`<button class="chip ${selected.includes(id)?"on":""}" data-equipment-scope="${scope}" data-equipment="${id}">${esc(n)}</button>`).join("")}</div></details>`).join("")}</div>`}
function quantityEditor(selected,qty){if(!selected.length)return`<div class="empty compact">Sélectionne le matériel avant d’indiquer les quantités.</div>`;return `<div class="quantity-grid">${selected.filter(x=>!["poids du corps","mur","sol","piste","terrain"].includes(x)).map(id=>`<label><span>${esc(equipName(id))}</span><input data-equip-qty="${id}" type="number" min="0" value="${qty[id]??1}"></label>`).join("")}</div>`}
function range(k,label,v,min){return `<label class="range-box"><header><b>${label}</b><span id="${k}_value">${v}</span></header><input data-range="${k}" type="range" min="${min}" max="5" value="${v}"><small>${min===0?"0 = aucune · 5 = forte":"1 = bas · 5 = élevé"}</small></label>`}
function hydrateDraft(a){if(draft._hydrated)return;draft.duration=draft.duration||a?.duration||45;draft.level=draft.level||a?.level||"Débutant";draft.place=draft.place||a?.place||"mixed";draft.equipment=draft.equipment?.length?draft.equipment:[...(a?.equipment||[])];draft.fatigue=3;draft.stress=3;draft.sleep=3;draft.pain=0;draft._hydrated=true}
function reviewSession(a){const r=readiness(a||{},draft);return `<div class="review-grid">${summary("Pour",a?.firstName||"Séance libre")}${summary("Univers",discipline(draft.trainingType)?.name)}${summary("Cible",(draft.targets||[]).map(x=>goalBy(x)?.name).join(" · "))}${summary("Format",formatBy(draft.format)?.name)}${summary("Durée",`${draft.duration} min`)}${summary("Niveau",a?.level||draft.level||"Débutant")}${summary("Lieu",placeName(draft.place))}${summary("Disponibilité",`${r}%`)}${summary("Matériel",(draft.equipment||[]).map(equipName).join(" · ")||"Sans matériel")}</div>`}
function reviewProgram(a){return `<div class="review-grid">${summary("Adhérent",a?.firstName)}${summary("Programme",draft.name||"Programme")}${summary("Durée",`${draft.weeks} semaines`)}${summary("Fréquence",`${draft.sessionsPerWeek} / semaine`)}${summary("Univers",discipline(draft.trainingType)?.name)}${summary("Formats",(draft.formats||[]).map(x=>formatBy(x)?.name).join(" · "))}${summary("Cibles",(draft.targets||[]).map(x=>goalBy(x)?.name).join(" · "))}${summary("Matériel",(draft.equipment||[]).map(equipName).join(" · ")||"Sans matériel")}</div>`}
function reviewClass(){return `<div class="review-grid">${summary("Cours",draft.name||"Cours FAFATRAINING")}${summary("Participants",draft.participants||10)}${summary("Durée",`${draft.duration||45} min`)}${summary("Ateliers",draft.stations||6)}${summary("Tours",draft.rounds||3)}${summary("Univers",discipline(draft.trainingType)?.name)}${summary("Format",formatBy(draft.format)?.name)}${summary("Matériel",(draft.equipment||[]).map(equipName).join(" · ")||"Sans matériel")}</div>`}
function metric(k,v){return `<article class="metric"><small>${esc(k)}</small><b>${esc(v)}</b></article>`}
function summary(k,v){return `<article><small>${esc(k)}</small><b>${esc(v||"—")}</b></article>`}
function field(id,label,val,type="text"){return `<label class="field"><span>${label}</span><input id="${id}" type="${type}" value="${esc(val)}"></label>`}
function selectField(id,label,opts,val){return `<label class="field"><span>${label}</span>${select(id,opts,val)}</label>`}
function select(id,opts,val){return `<select id="${id}">${opts.map(o=>{const [v,n]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}" ${String(v)===String(val)?"selected":""}>${esc(n)}</option>`}).join("")}</select>`}
function slug(s){return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")}
function captureInputs(){
 [["prog_name","name"],["prog_weeks","weeks"],["prog_freq","sessionsPerWeek"],["prog_duration","duration"],["class_name","name"],["class_people","participants"],["class_duration","duration"],["class_stations","stations"],["class_rounds","rounds"]].forEach(([id,k])=>{const e=$("#"+id);if(e)draft[k]=e.value});
}
function resetBuild(mode){draft={mode,step:0,targets:mode==="class"?["full_body"]:[],formats:["series"],equipment:[],equipmentQuantities:{}}}
function toggle(arr,v){return arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]}

/* ---------- SHARING / EXPORT ---------- */
async function brandedHtml(kind,obj){
 let body="",logoData="";
 try{
   const blob=await fetch(logo).then(r=>r.blob());
   logoData=await new Promise(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.readAsDataURL(blob)});
 }catch(e){logoData=new URL(logo,location.href).href}
 if(kind==="session")body=`<h1>${esc(obj.title)}</h1><p>${obj.duration} min · ${esc(discipline(obj.trainingType)?.name)}</p>`+obj.blocks.map(b=>`<h2>${esc(b.label)} — ${b.minutes} min</h2><table>${b.exercises.map(e=>`<tr><td><b>${esc(e.name)}</b><br><small>${esc(e.cues)}</small></td><td>${e.prescription.sets} × ${esc(e.prescription.reps)}<br>Repos ${esc(e.prescription.rest)} · RPE ${e.prescription.rpe}</td></tr>`).join("")}</table>`).join("");
 if(kind==="program")body=`<h1>${esc(obj.name)}</h1><p>${obj.weeks} semaines · ${obj.perWeek} séance(s)/semaine</p>`+obj.schedule.map(w=>`<h2>Semaine ${w.number} — ${esc(w.phase)}</h2>`+w.sessions.map(s=>`<h3>${esc(s.title)}</h3><ul>${s.blocks.flatMap(b=>b.exercises).map(e=>`<li><b>${esc(e.name)}</b> — ${e.prescription.sets} × ${esc(e.prescription.reps)}</li>`).join("")}</ul>`).join("")).join("");
 if(kind==="class")body=`<h1>${esc(obj.name)}</h1><p>${obj.participants} participants · ${obj.duration} min · ${obj.rounds} tours</p>`+obj.stations.map(s=>`<h2>Atelier ${s.number} — ${esc(s.exercise.name)}</h2><p>${esc(s.exercise.cues)}</p><ul><li>Débutant : ${esc(s.levels.Débutant)}</li><li>Intermédiaire : ${esc(s.levels.Intermédiaire)}</li><li>Avancé : ${esc(s.levels.Avancé)}</li></ul>`).join("");
 return `<!doctype html><html lang="fr"><meta charset="utf-8"><title>FAFATRAINING</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:auto;padding:28px;color:#111}header{display:flex;align-items:center;gap:14px;border-bottom:4px solid #9be000;padding-bottom:14px}header img{width:76px;height:76px;object-fit:contain}h1{font-size:32px}h2{color:#527900;border-bottom:1px solid #ccc;padding-bottom:5px}table{width:100%;border-collapse:collapse}td{padding:9px;border-bottom:1px solid #ddd;vertical-align:top}td:last-child{text-align:right;width:230px}.sign{margin-top:34px;padding-top:12px;border-top:2px solid #9be000;font-weight:bold}</style><header><img src="${logoData}"><div><b>FAFATRAINING</b><br><small>Programme préparé par FAFA</small></div></header>${body}<div class="sign">FAFATRAINING · FAFA</div></html>`;
}
async function shareObject(kind,obj){
 const html=await brandedHtml(kind,obj),file=new File([html],`FAFATRAINING-${kind}.html`,{type:"text/html"});
 if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:"FAFATRAINING",text:"Programme FAFATRAINING",files:[file]});return}catch(e){}}
 const text=kind==="session"?`${obj.title} · ${obj.duration} min\n`+obj.blocks.flatMap(b=>b.exercises.map(e=>`${e.name}: ${e.prescription.sets}×${e.prescription.reps}`)).join("\n"):`FAFATRAINING — ${obj.name}`;
 if(navigator.share){try{await navigator.share({title:"FAFATRAINING",text});return}catch(e){}}
 await navigator.clipboard?.writeText(text);toast("Résumé copié. Tu peux le coller dans Mail, Messages ou WhatsApp.");
}
async function downloadObject(kind,obj){
 const html=await brandedHtml(kind,obj),blob=new Blob([html],{type:"text/html"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`FAFATRAINING-${kind}-${new Date().toISOString().slice(0,10)}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

/* ---------- EVENTS ---------- */
function bind(){
 $$("[data-go]").forEach(x=>x.onclick=()=>go(x.dataset.go));
 $$("[data-back]").forEach(x=>x.onclick=()=>history.length>1?history.back():go("home"));
 $$("[data-mode]").forEach(x=>x.onclick=()=>{resetBuild(x.dataset.mode);go(x.dataset.mode==="session"?"session-builder":x.dataset.mode==="program"?"program-builder":"class-builder")});
 $$("[data-public-type]").forEach(x=>x.onclick=()=>{lib={q:"",type:x.dataset.publicType,level:"Tous",place:"Tous",equipment:[],muscle:"Tous"};go("library-public")});
 $$("[data-guide-choice]").forEach(x=>x.onclick=()=>{draft[x.dataset.guideChoice]=x.dataset.value;render()});
 $("[data-guide-next]")?.addEventListener("click",()=>{draft.guideStep=Number(draft.guideStep||0)+1;render()});
 $$("[data-guide-start]").forEach(x=>x.onclick=()=>{resetBuild("session");draft.trainingType=x.dataset.guideStart;draft.targets=[draft.guideGoal||"full_body"];draft.place=draft.guidePlace||"mixed";draft.step=2;go("session-builder")});
 $$("[data-new-client]").forEach(x=>x.onclick=()=>{draft.client={equipment:[],injuries:[]};go("client-form")});
 $$("[data-client]").forEach(x=>x.onclick=()=>go(`client?id=${x.dataset.client}`));
 $$("[data-build-client]").forEach(x=>x.onclick=()=>{resetBuild("session");draft.clientId=x.dataset.buildClient;go("session-builder")});
 $$("[data-edit-client]").forEach(x=>x.onclick=()=>go(`client-form?id=${x.dataset.editClient}`));
 $$("[data-delete-client]").forEach(x=>x.onclick=()=>{if(confirm("Supprimer cet adhérent, ses séances et ses programmes ?")){removeAthlete(state,x.dataset.deleteClient);toast("Adhérent supprimé");render()}});
 $$("[data-client-injury]").forEach(x=>x.onclick=()=>{draft.client=draft.client||structuredClone(client(params().get("id"))||{equipment:[],injuries:[]});draft.client.injuries=toggle(draft.client.injuries||[],x.dataset.clientInjury);x.classList.toggle("on")});
 $("[data-save-client]")?.addEventListener("click",e=>saveClient(e.currentTarget.dataset.saveClient));
 $$("[data-session-person]").forEach(x=>x.onclick=()=>{draft.clientId=x.dataset.sessionPerson;render()});
 $$("[data-program-person]").forEach(x=>x.onclick=()=>{draft.clientId=x.dataset.programPerson;render()});
 $$("[data-discipline]").forEach(x=>x.onclick=()=>{draft.trainingType=x.dataset.discipline;if(!draft.format){const f=CAT.formats.find(f=>f.best?.includes(draft.trainingType));draft.format=f?.id||"series"}render()});
 $$("[data-goal]").forEach(x=>x.onclick=()=>{draft.targets=toggle(draft.targets||[],x.dataset.goal);render()});
 $$("[data-format]").forEach(x=>x.onclick=()=>{draft.format=x.dataset.format;render()});
 $$("[data-format-multi]").forEach(x=>x.onclick=()=>{draft.formats=toggle(draft.formats||[],x.dataset.formatMulti);render()});
 $$("[data-builder-next]").forEach(x=>x.onclick=()=>{captureInputs();if(!validateStep(x.dataset.builderNext))return;draft.step=Number(draft.step||0)+1;render()});
 $$("[data-builder-prev]").forEach(x=>x.onclick=()=>{captureInputs();draft.step=Math.max(0,Number(draft.step||0)-1);render()});
 $$("[data-duration]").forEach(x=>x.onclick=()=>{draft.duration=Number(x.dataset.duration);render()});
 $$("[data-place]").forEach(x=>x.onclick=()=>{draft.place=x.dataset.place;render()});
 $$("[data-range]").forEach(x=>x.oninput=()=>{draft[x.dataset.range]=Number(x.value);const t=$("#"+x.dataset.range+"_value");if(t)t.textContent=x.value});
 $$("[data-equipment]").forEach(x=>x.onclick=()=>{const scope=x.dataset.equipmentScope,id=x.dataset.equipment;if(scope==="library"){lib.equipment=toggle(lib.equipment,id);render()}else if(scope==="client"){draft.client=draft.client||structuredClone(client(params().get("id"))||{equipment:[],injuries:[]});draft.client.equipment=toggle(draft.client.equipment||[],id);x.classList.toggle("on")}else{draft.equipment=toggle(draft.equipment||[],id);render()}});
 $$("[data-equip-qty]").forEach(x=>x.oninput=()=>{draft.equipmentQuantities=draft.equipmentQuantities||{};draft.equipmentQuantities[x.dataset.equipQty]=Number(x.value)||0});
 $("[data-generate-session]")?.addEventListener("click",createSession);
 $("[data-generate-program]")?.addEventListener("click",createProgram);
 $("[data-generate-class]")?.addEventListener("click",createClass);
 $("#lib_q")?.addEventListener("change",e=>{lib.q=e.target.value;render()});$("#lib_q")?.addEventListener("keydown",e=>{if(e.key==="Enter"){lib.q=e.target.value;render()}});
 $("#lib_type")?.addEventListener("change",e=>{lib.type=e.target.value;render()});$("#lib_level")?.addEventListener("change",e=>{lib.level=e.target.value;render()});$("#lib_place")?.addEventListener("change",e=>{lib.place=e.target.value;render()});$("#lib_muscle")?.addEventListener("change",e=>{lib.muscle=e.target.value;render()});
 $("[data-library-equipment]")?.addEventListener("click",()=>{draft.libEquipmentOpen=true;render()});$("[data-close-library-equipment]")?.addEventListener("click",()=>{draft.libEquipmentOpen=false;render()});$("[data-reset-library]")?.addEventListener("click",()=>{lib={q:"",type:"Tous",level:"Tous",place:"Tous",equipment:[],muscle:"Tous"};render()});
 $$("[data-movement]").forEach(x=>x.onclick=()=>go(`movement?id=${x.dataset.movement}`));$$("[data-movement-public]").forEach(x=>x.onclick=()=>go(`movement-public?id=${x.dataset.movementPublic}`));$$("[data-scroll-level]").forEach(x=>x.onclick=()=>document.getElementById("lvl-"+slug(x.dataset.scrollLevel))?.scrollIntoView({behavior:"smooth"}));
 $$("[data-live]").forEach(x=>x.onclick=()=>go(`live?id=${x.dataset.live}`));
 $$("[data-share-kind]").forEach(x=>x.onclick=()=>shareObject(x.dataset.shareKind,objectBy(x.dataset.shareKind,x.dataset.shareId)));
 $$("[data-download-kind]").forEach(x=>x.onclick=()=>downloadObject(x.dataset.downloadKind,objectBy(x.dataset.downloadKind,x.dataset.downloadId)));
 $("[data-print]")?.addEventListener("click",()=>print());
 $$("[data-program-session]").forEach(x=>x.onclick=()=>{const p=(state.programs||[]).find(z=>z.id===x.dataset.programSession),s=p?.schedule[Number(x.dataset.week)-1]?.sessions[Number(x.dataset.sessionIndex)];if(s){if(!(state.sessions||[]).some(z=>z.id===s.id))state.sessions.unshift(s);saveState(state);go(`session?id=${s.id}`)}});
 $("#progress_client")?.addEventListener("change",e=>{state.activeAthleteId=e.target.value;saveState(state);render()});
 $$("[data-timer]").forEach(x=>x.onclick=()=>startTimer(Number(x.dataset.timer)));$("[data-timer-stop]")?.addEventListener("click",()=>{clearInterval(timerHandle);timerSec=0;updateTimer()});
 $$("[data-log]").forEach(x=>x.onclick=()=>logExercise(x.dataset.log,x));
 $("[data-finish-session]")?.addEventListener("click",finishSession);
 $("[data-export]")?.addEventListener("click",()=>exportState(state));$("#importFile")?.addEventListener("change",async e=>{try{state=await importState(e.target.files[0]);toast("Données importées");render()}catch(e){toast("Fichier invalide")}});
}
function validateStep(kind){
 if(kind==="session"&&Number(draft.step)===0&&!draft.clientId){toast("Choisis une personne ou Séance libre.");return false}
 if(["session","program","class"].includes(kind)&&Number(draft.step)===1&&!draft.trainingType){toast("Choisis un univers.");return false}
 if(kind==="program"&&Number(draft.step)===0&&!draft.clientId){toast("Choisis un adhérent.");return false}
 if(kind==="class"&&Number(draft.step)===0&&!draft.trainingType){toast("Choisis un type de cours.");return false}
 return true;
}
function saveClient(id){
 const old=client(id)||{},d=draft.client||old;
 const a={...old,id:old.id||uid("athlete"),firstName:$("#cf_name").value.trim()||"Sans nom",age:Number($("#cf_age").value)||null,height:Number($("#cf_height").value)||null,weight:Number($("#cf_weight").value)||null,level:$("#cf_level").value,primaryGoal:$("#cf_goal").value,secondaryGoal:$("#cf_secondary").value.trim(),place:$("#cf_place").value,duration:Number($("#cf_duration").value)||45,equipment:d.equipment||old.equipment||[],injuries:d.injuries||old.injuries||[],createdAt:old.createdAt||new Date().toISOString()};upsertAthlete(state,a);draft={};toast("Profil enregistré");go(`client?id=${a.id}`)
}
function profileForSession(){if(draft.clientId==="free")return{id:"free",firstName:"Séance libre",level:draft.level||"Intermédiaire",duration:draft.duration||45,equipment:draft.equipment||[],place:draft.place||"mixed",injuries:[]};return client(draft.clientId)}
function createSession(){const a=profileForSession();const s=generateSession({profile:a,daily:draft,choice:draft,exercises:EX,history:a.id==="free"?[]:history(a.id),seed:`manual-${Date.now()}`});s.title=`${discipline(draft.trainingType)?.name||"Séance"} · ${(draft.targets||[]).map(x=>goalBy(x)?.name).slice(0,2).join(" + ")||"Corps entier"}`;state.sessions.unshift(s);saveState(state);draft={};go(`session?id=${s.id}`)}
function createProgram(){captureInputs();const a=client(draft.clientId);const p=generateProgram({profile:a,choice:{...draft,weeks:Number(draft.weeks)||8,sessionsPerWeek:Number(draft.sessionsPerWeek)||3,duration:Number(draft.duration)||45},exercises:EX,history:history(a.id)});state.programs=state.programs||[];state.programs.unshift(p);saveState(state);draft={};go(`program?id=${p.id}`)}
function createClass(){captureInputs();const c=generateGroupClass({choice:{...draft,participants:Number(draft.participants)||10,stations:Number(draft.stations)||6,rounds:Number(draft.rounds)||3,duration:Number(draft.duration)||45},exercises:EX,seed:`class-${Date.now()}`});state.groupClasses=state.groupClasses||[];state.groupClasses.unshift(c);saveState(state);draft={};go(`class?id=${c.id}`)}
function objectBy(kind,id){return kind==="session"?(state.sessions||[]).find(x=>x.id===id):kind==="program"?(state.programs||[]).find(x=>x.id===id):(state.groupClasses||[]).find(x=>x.id===id)}
function startTimer(s){clearInterval(timerHandle);timerSec=s;updateTimer();timerHandle=setInterval(()=>{timerSec--;updateTimer();if(timerSec<=0){clearInterval(timerHandle);toast("Repos terminé")}},1000)}
function updateTimer(){const e=$("#timerText");if(e)e.textContent=`${String(Math.floor(timerSec/60)).padStart(2,"0")}:${String(timerSec%60).padStart(2,"0")}`}
function logExercise(id,btn){const l={exerciseId:id,sets:Number($(`[data-log-sets="${id}"]`)?.value)||0,reps:Number($(`[data-log-reps="${id}"]`)?.value)||0,weight:Number($(`[data-log-weight="${id}"]`)?.value)||0,rpe:Number($(`[data-log-rpe="${id}"]`)?.value)||0};current.logs=(current.logs||[]).filter(x=>x.exerciseId!==id);current.logs.unshift(l);btn.classList.add("on");toast("Exercice enregistré")}
function finishSession(){current.completedAt=new Date().toISOString();const i=state.sessions.findIndex(x=>x.id===current.id);if(i>=0)state.sessions[i]=current;saveState(state);toast("Séance terminée");go("progress")}

/* ---------- ROUTER ---------- */
function render(){
 clearInterval(timerHandle);timerHandle=null;
 const pages={home,studio,guide,clients:clientsPage,client:clientView,"client-form":clientForm,build,"session-builder":sessionBuilder,"program-builder":programBuilder,"class-builder":classBuilder,library:()=>libraryPage(false),"library-public":()=>libraryPage(true),movement,"movement-public":()=>movement(true),session:sessionView,program:programView,class:classView,live:liveView,progress,settings};
 document.getElementById("app").innerHTML=(pages[route()]||home)();bind();
}
init();
