
const ASSETS = window.FAFA_ASSETS || {};
const LOGO = ASSETS.logo || 'assets/logo/logo-fafa.jpg';
const AVATAR = ASSETS.avatar || 'assets/avatar/avatar-officiel.jpg';
const STORE='fafatraining_v30_ultra_clean';
let exercises=[],methods=[],mapping={},session=[];
let state={
  tab:'home', method:'poids_corps', duration:'standard', visual:'mix',
  exIndex:0, setDone:0, timeLeft:0, running:false, history:[],
  profile:{name:'Membre 1',level:'debutant',goal:'remise_forme',place:'salle',fatigue:2,sleep:7,stress:2,injuries:[],equipment:['poids du corps','haltères','barre','banc','machine','poulie','corde','rameur','bike','extérieur','gants','sac de frappe','kettlebell','box','sled']}
};
const LEVELS={"debutant": {"label": "Débutant", "difficulty": "Facile", "sets": 2, "reps_strength": "8–10", "reps_time": "30s", "rest": 45, "count": {"express": 4, "standard": 5, "long": 6}}, "actif": {"label": "Actif", "difficulty": "Moyen", "sets": 3, "reps_strength": "10–12", "reps_time": "35s", "rest": 60, "count": {"express": 5, "standard": 7, "long": 8}}, "confirme": {"label": "Confirmé", "difficulty": "Difficile", "sets": 4, "reps_strength": "8–12", "reps_time": "40s", "rest": 75, "count": {"express": 6, "standard": 8, "long": 10}}, "athlete": {"label": "Athlète FAFATRAINING", "difficulty": "Très dur", "sets": 5, "reps_strength": "6–10", "reps_time": "45s", "rest": 90, "count": {"express": 7, "standard": 10, "long": 12}}};
function $(s){return document.querySelector(s)}
function safe(x){return String(x??'').replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}
async function boot(){
  try{
    exercises=await fetch('data/exercices.json',{cache:'no-store'}).then(r=>r.json());
    methods=await fetch('data/programmes.json',{cache:'no-store'}).then(r=>r.json());
    mapping=await fetch('data/mapping_images.json',{cache:'no-store'}).then(r=>r.json());
    const stored=localStorage.getItem(STORE); if(stored) state={...state,...JSON.parse(stored)};
    buildSession(); render();
  }catch(e){document.body.innerHTML='<pre style="color:white;padding:20px">Erreur chargement : '+e.message+'</pre>'}
}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function method(){return methods.find(m=>m.id===state.method)||methods[0]}
function level(){return LEVELS[state.profile.level]||LEVELS.debutant}
function readiness(){let p=state.profile;let s=100-p.fatigue*12-p.stress*7+Math.max(0,p.sleep-6)*4;if(p.injuries?.length)s-=8;return Math.max(30,Math.min(100,Math.round(s)))}
function countForSession(){let c=level().count[state.duration]||level().count.standard;if(readiness()<60)c=Math.max(4,c-2);return c}
function okExercise(e){
  let p=state.profile,m=method();
  const byMethod=m.categories.includes(e.pattern)||m.style.includes(e.style);
  const byEquip=e.equipment.some(eq=>p.equipment.includes(eq));
  const byInjury=!(e.injuries||[]).some(i=>p.injuries.includes(i));
  return byMethod && byEquip && byInjury;
}
function buildSession(){
  let pool=exercises.filter(okExercise);
  if(pool.length<4) pool=exercises.filter(e=>method().categories.includes(e.pattern));
  const wanted=countForSession();
  const blocks={warm:[],main:[],assist:[],finisher:[]};
  const warm=exercises.filter(e=>['stretch','core','cardio'].includes(e.pattern)&&okExercise(e)).slice(0,2);
  const main=pool.filter(e=>!['stretch'].includes(e.pattern)).slice(0,Math.max(2,wanted-3));
  const assist=pool.filter(e=>['core','lunge','pull'].includes(e.pattern)).slice(0,2);
  const fin=pool.filter(e=>['cardio','core'].includes(e.pattern)).slice(0,1);
  session=[...warm,...main,...assist,...fin].filter((v,i,a)=>a.findIndex(x=>x.key===v.key)===i).slice(0,wanted);
  state.exIndex=Math.min(state.exIndex,Math.max(0,session.length-1));
}
function setTab(t){state.tab=t; if(t==='session'){buildSession();} save(); render()}
function layout(content,side=true){
  return `<div class="app" style="--logo:url('${LOGO}')">
  <header class="top"><div class="topin"><div class="brand"><img src="${LOGO}"><div><h1>FAFATRAINING COACHING</h1><p>Force ton corps · élève ton mental</p></div></div><nav class="tabs">${['home:Accueil','session:Séance','library:Exercices','tracking:Suivi','coach:Coach'].map(v=>{let [id,l]=v.split(':');return `<button class="tab ${state.tab===id?'active':''}" onclick="setTab('${id}')">${l}</button>`}).join('')}</nav></div></header>
  <main class="main">${side?`<div class="layout"><section>${content}</section>${sidePanel()}</div>`:content}</main>
  <nav class="bottom">${['home:🏠:Accueil','session:▶:Séance','library:🔎:Exos','tracking:📊:Suivi','coach:👤:Coach'].map(v=>{let [id,ic,l]=v.split(':');return `<button onclick="setTab('${id}')">${ic}<small>${l}</small></button>`}).join('')}</nav>
  </div>`
}
function sidePanel(){
  let p=state.profile,m=method();
  return `<aside class="side"><button class="btn secondary" onclick="setTab('home')">← Retour accueil</button><h2>${safe(p.name)}</h2><p class="muted">${LEVELS[p.level].label} · ${goalLabel(p.goal)}</p><span class="pill p-green">${p.place}</span><span class="pill p-lime">forme ${readiness()}%</span><div class="progress"><span style="width:${readiness()}%"></span></div><hr style="border-color:var(--line)"><h3>Séance</h3><p><b>${safe(m.name)}</b><br><span class="muted">${safe(m.duration)} · ${safe(m.label)}</span></p><button class="btn" onclick="setTab('session')">Lancer</button><button class="btn secondary" onclick="exportPDF()">Exporter PDF A4</button><button class="btn secondary" onclick="setTab('tracking')">Exporter carré Insta</button></aside>`
}
function goalLabel(g){return {perte_poids:'Perte de poids',prise_masse:'Prise de masse',remise_forme:'Remise en forme',performance:'Performance'}[g]||g}
function home(){
  let m=method();
  return layout(`<div class="hero"><div class="card"><div class="tag">V30 ULTRA CLEAN</div><h2 class="heroTitle">Coach clair. Séance prête. Terrain.</h2><p>Une app pensée pour créer, adapter et envoyer une séance lisible à un client, sans perdre de temps.</p><div class="actions"><button class="btn" onclick="setTab('session')">▶ Lancer la séance</button><button class="btn secondary" onclick="setTab('coach')">Modifier</button></div></div><div class="today"><img class="coachIcon" src="${AVATAR}"><small>Séance du jour</small><h2>${safe(m.name)}</h2><p>${safe(m.duration)} · ${safe(m.label)}</p></div></div><div class="stats"><div class="stat"><b>${countForSession()}</b>Exos adaptés</div><div class="stat"><b>${readiness()}%</b>Forme</div><div class="stat"><b>${exercises.length}</b>Exercices</div><div class="stat"><b>${state.history.length}</b>Séances</div></div><div class="card"><h2>À quoi sert l’application ?</h2><p>Créer vite une séance cohérente, l’adapter au niveau, au matériel et aux blessures, puis l’envoyer au client en PDF A4 ou visuel carré.</p></div>`)
}
function visual(e){
  return `<div class="visual">${state.visual!=='avatar'?`<img class="photo" src="${e.photo}" onerror="this.remove()">`:''}${state.visual!=='photo'?`<img class="avatar" src="${e.avatar}" onerror="this.src='${AVATAR}'">`:''}<span class="label pill p-green">${state.visual==='mix'?'Photo + avatar':state.visual}</span></div>`
}
function sessionView(){
  let e=session[state.exIndex]||session[0]; if(!e)return layout('<div class="card"><h2>Aucune séance disponible</h2></div>');
  let l=level();
  let isTime=['cardio','stretch'].includes(e.pattern);
  let reps=isTime?l.reps_time:l.reps_strength+' répétitions';
  return layout(`<div class="sessionFull"><section class="exerciseScreen">${visual(e)}<div class="exerciseInfo"><span class="pill p-green">${state.exIndex+1}/${session.length}</span><span class="pill p-blue">${l.difficulty}</span><span class="pill p-orange">${e.category}</span><h2>${safe(e.name)}</h2><p class="muted">${safe(e.muscles.join(' · '))}</p><div class="numbers"><div class="num"><b>${l.sets}</b>Séries</div><div class="num"><b>${safe(reps)}</b>À faire</div><div class="num"><b>${l.rest}s</b>Repos</div><div class="num"><b>${state.setDone}/${l.sets}</b>Fait</div></div><div class="coachBox"><b>Consigne simple</b><p>${safe(e.tip)}</p><b>À éviter</b><p>${safe(e.avoid)}</p></div><div class="actions"><button class="btn" onclick="startRest(${l.rest})">⏱ Démarrer repos</button><button class="btn secondary" onclick="doneSet()">✓ Série faite</button><button class="btn secondary" onclick="nextEx()">Suivant →</button></div></div></section><aside class="timerPanel"><h2>Chrono</h2><div class="timer" id="timer">${state.timeLeft||l.rest}s</div><p class="muted">Repos automatique.</p><div class="actions"><button class="btn secondary" onclick="pauseTimer()">Pause</button><button class="btn red" onclick="resetTimer()">Reset</button></div><hr style="border-color:var(--line)"><h3>Visuel</h3><div class="actions"><button class="btn secondary" onclick="state.visual='photo';save();render()">Photo</button><button class="btn" onclick="state.visual='mix';save();render()">Mix</button><button class="btn secondary" onclick="state.visual='avatar';save();render()">Avatar</button></div></aside></div>`,false)
}
function startRest(sec){state.timeLeft=sec;state.running=true;save();clearInterval(window.t);window.t=setInterval(()=>{if(!state.running)return;state.timeLeft--;let el=$('#timer');if(el)el.textContent=state.timeLeft+'s';if(state.timeLeft<=0){state.running=false;clearInterval(window.t);save()}},1000);render()}
function pauseTimer(){state.running=false;save()}
function resetTimer(){state.timeLeft=level().rest;state.running=false;save();render()}
function doneSet(){state.setDone++;if(state.setDone>=level().sets)nextEx();else{state.timeLeft=level().rest;save();render()}}
function nextEx(){state.exIndex++;state.setDone=0;state.running=false;if(state.exIndex>=session.length){state.history.push({date:new Date().toLocaleDateString('fr-FR'),method:method().name,count:session.length,form:readiness()});state.exIndex=0;alert('Séance terminée ✅')}save();render()}
function library(){
  let unique=exercises;
  return layout(`<div class="card"><h2>Bibliothèque propre</h2><p class="muted">Un exercice = une fiche. Pas de doublons par style.</p><div class="form"><label>Recherche<input id="q" oninput="filterLib()" placeholder="squat, pompes, boxe..."></label><label>Catégorie<select id="cat" onchange="filterLib()"><option value="">Toutes</option>${[...new Set(unique.map(e=>e.pattern))].map(c=>`<option>${c}</option>`).join('')}</select></label><label>Matériel<select id="eq" onchange="filterLib()"><option value="">Tous</option>${[...new Set(unique.flatMap(e=>e.equipment))].sort().map(c=>`<option>${c}</option>`).join('')}</select></label></div></div><div class="grid grid2">${unique.map(e=>`<div class="libItem" data-t="${safe((e.name+' '+e.pattern+' '+e.equipment.join(' ')).toLowerCase())}"><div class="thumb"><img src="${e.photo}" onerror="this.remove()">Photo</div><div><b>${safe(e.name)}</b><p class="muted">${safe(e.category)} · ${safe(e.equipment[0])}</p><span class="pill p-green">${safe(e.pattern)}</span></div></div>`).join('')}</div>`)
}
function filterLib(){let q=($('#q')?.value||'').toLowerCase(),cat=$('#cat')?.value||'',eq=$('#eq')?.value||'';document.querySelectorAll('.libItem').forEach(it=>{let txt=it.dataset.t;it.style.display=(txt.includes(q)&&(!cat||txt.includes(cat))&&(!eq||txt.includes(eq)))?'grid':'none'})}
function tracking(){
  return layout(`<div class="card"><h2>Suivi utile</h2><div class="stats"><div class="stat"><b>${state.history.length}</b>Séances</div><div class="stat"><b>${readiness()}%</b>Forme</div><div class="stat"><b>${session.length}</b>Exos</div><div class="stat"><b>${level().label}</b>Niveau</div></div></div><div class="card"><h2>Historique</h2>${state.history.slice().reverse().map(h=>`<p>✅ ${h.date} · ${safe(h.method)} · ${h.count} exos · forme ${h.form}%</p>`).join('')||'<p class="muted">Aucune séance terminée.</p>'}</div><div class="card"><h2>Export carré Insta</h2><div class="exportPreview">${posterHTML()}</div><button class="btn" onclick="printPoster()">Imprimer / enregistrer le carré</button></div>`)
}
function posterHTML(){
  let blocks=[['ENTRÉE','Activation',...session.slice(0,3)],['PLAT','Bloc principal',...session.slice(3,7)],['FINISHER','Explosif',...session.slice(7,10)]];
  return `<div class="poster"><h2>MENU SÉANCE</h2><p>FAFATRAINING · ${safe(method().name)}</p>${blocks.map(b=>`<div class="posterRow"><div class="posterCell"><b>${b[0]}</b><br>${b[1]}</div>${b.slice(2).map(e=>`<div class="posterCell">${e?'<b>'+safe(e.name)+'</b><br>'+safe(e.muscles[0]||''):'-'}</div>`).join('')}</div>`).join('')}</div>`
}
function printPoster(){let w=window.open('','_blank');w.document.write(`<html><head><title>Export carré</title><link rel="stylesheet" href="style.css"><style>body{padding:20px;background:#050805}.poster{width:1080px;height:1080px}</style></head><body>${posterHTML()}<script>setTimeout(()=>print(),500)<\/script></body></html>`);w.document.close()}
function coach(){
  let p=state.profile;
  return layout(`<div class="card"><h2>Coach</h2><p class="muted">Réglages simples. L’app adapte ensuite la séance.</p><div class="form"><label>Nom<input id="name" value="${safe(p.name)}"></label><label>Niveau<select id="level"><option value="debutant">Débutant</option><option value="actif">Actif</option><option value="confirme">Confirmé</option><option value="athlete">Athlète FAFATRAINING</option></select></label><label>Objectif<select id="goal"><option value="remise_forme">Remise en forme</option><option value="perte_poids">Perte de poids</option><option value="prise_masse">Prise de masse</option><option value="performance">Performance</option></select></label><label>Durée<select id="duration"><option value="express">Express 20 min</option><option value="standard">Standard 45 min</option><option value="long">Longue 1h+</option></select></label><label>Méthode<select id="method">${methods.map(m=>`<option value="${m.id}">${safe(m.name)} · ${safe(m.duration)}</option>`).join('')}</select></label><label>Lieu<select id="place"><option>salle</option><option>domicile</option><option>extérieur</option></select></label><label>Fatigue 1-5<input id="fatigue" type="number" min="1" max="5" value="${p.fatigue}"></label><label>Sommeil h<input id="sleep" type="number" value="${p.sleep}"></label><label>Stress 1-5<input id="stress" type="number" min="1" max="5" value="${p.stress}"></label></div><button class="btn" onclick="saveCoach()">Enregistrer et régénérer</button></div><div class="card"><h2>Blessures / limitations</h2><div class="grid grid3">${['épaule','coude','poignet','dos','lombaires','hanche','genou','cheville','cardio'].map(i=>`<label><input class="inj" type="checkbox" value="${i}" ${p.injuries.includes(i)?'checked':''}> ${i}</label>`).join('')}</div></div><div class="card"><h2>Matériel</h2><div class="grid grid3">${['poids du corps','haltères','barre','banc','machine','poulie','corde','rameur','bike','extérieur','gants','sac de frappe','kettlebell','box','sled','élastique'].map(i=>`<label><input class="eq" type="checkbox" value="${i}" ${p.equipment.includes(i)?'checked':''}> ${i}</label>`).join('')}</div></div>`)
}
function saveCoach(){let p=state.profile;p.name=name.value;p.level=level.value;p.goal=goal.value;p.place=place.value;p.fatigue=+fatigue.value;p.sleep=+sleep.value;p.stress=+stress.value;p.injuries=[...document.querySelectorAll('.inj:checked')].map(x=>x.value);p.equipment=[...document.querySelectorAll('.eq:checked')].map(x=>x.value);state.method=method.value;state.duration=duration.value;buildSession();save();setTab('home')}
function exportPDF(){
  let rows=session.map((e,i)=>`<tr><td>${i+1}</td><td><b>${safe(e.name)}</b><br>${safe(e.category)}</td><td>${level().sets}</td><td>${['cardio','stretch'].includes(e.pattern)?level().reps_time:level().reps_strength}</td><td>${level().rest}s</td><td>${safe(e.tip)}</td></tr>`).join('');
  let html=`<html><head><title>FAFATRAINING PDF</title><style>body{font-family:Arial;padding:28px;background:#fff;color:#111}.head{display:flex;gap:14px;align-items:center}.head img{width:90px;height:90px;border-radius:50%;object-fit:cover}h1{font-size:30px;margin:0}.box{border:1px solid #ddd;border-radius:14px;padding:12px;margin:14px 0}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#050805;color:#62ff69;padding:8px;text-align:left}td{border-bottom:1px solid #ddd;padding:8px;vertical-align:top}.green{color:#169c2a;font-weight:900}</style></head><body><div class="head"><img src="${LOGO}"><div><div class="green">FAFATRAINING COACHING</div><h1>${safe(method().name)}</h1><p>Force ton corps · élève ton mental</p></div></div><div class="box">${safe(state.profile.name)} · ${LEVELS[state.profile.level].label} · ${goalLabel(state.profile.goal)} · ${safe(method().duration)}</div><table><tr><th>#</th><th>Exercice</th><th>Séries</th><th>Répétitions</th><th>Repos</th><th>Consigne</th></tr>${rows}</table><script>setTimeout(()=>print(),500)<\/script></body></html>`;
  let w=window.open('','_blank');w.document.write(html);w.document.close()
}
function goalLabel(g){return {remise_forme:'Remise en forme',perte_poids:'Perte de poids',prise_masse:'Prise de masse',performance:'Performance'}[g]||g}
function render(){if(state.tab==='home')app.innerHTML=home();if(state.tab==='session')app.innerHTML=sessionView();if(state.tab==='library')app.innerHTML=library();if(state.tab==='tracking')app.innerHTML=tracking();if(state.tab==='coach')app.innerHTML=coach();setTimeout(()=>{if($('#level'))level.value=state.profile.level;if($('#goal'))goal.value=state.profile.goal;if($('#place'))place.value=state.profile.place;if($('#duration'))duration.value=state.duration;if($('#method'))method.value=state.method},0)}
document.addEventListener('DOMContentLoaded',boot);
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
