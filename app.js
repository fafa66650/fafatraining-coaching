
const STORE='fafatraining_v29_visual_elite';
let state={tab:'home',member:0,method:'poids_corps',exerciseIndex:0,setDone:0,timeLeft:0,running:false,history:[],members:[],visualMode:'mix'};
let exercises=[],methods=[],session=[];
const $=s=>document.querySelector(s);
function safe(x){return String(x??'').replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}
async function boot(){
  try{
    const manifest=await fetch('data/manifest.json',{cache:'no-store'}).then(r=>r.json());
    const packs=await Promise.all(manifest.exercise_packs.map(p=>fetch(p,{cache:'no-store'}).then(r=>r.json())));
    exercises=packs.flat();
    methods=await fetch('data/methods.json',{cache:'no-store'}).then(r=>r.json());
    const stored=localStorage.getItem(STORE);
    if(stored) state={...state,...JSON.parse(stored)};
    if(!state.members.length) state.members=await fetch('data/members.json',{cache:'no-store'}).then(r=>r.json());
    buildSession(); render();
  }catch(e){document.body.innerHTML='<pre style="color:white;padding:20px">Erreur : '+e.message+'</pre>'}
}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function m(){return state.members[state.member]||state.members[0]}
function method(){return methods.find(x=>x.id===state.method)||methods[0]}
function labelLevel(l){return {debutant:'Débutant',actif:'Actif',confirme:'Confirmé',athlete:'Athlète FAFATRAINING'}[l]||l}
function labelGoal(g){return {perte_poids:'Perte de poids',prise_masse:'Prise de masse',remise_forme:'Remise en forme',performance:'Performance'}[g]||g}
function beginnerMode(){return m().level==='debutant'}
function readiness(){let x=m();let score=100-(x.fatigue*12)-(x.stress*8)+Math.max(0,x.sleep-6)*5;if(x.injuries?.length)score-=8;return Math.max(30,Math.min(100,Math.round(score)))}
function filteredPool(){
  const x=m(), mt=method();
  return exercises.filter(e=>{
    const okMethod=e.style===mt.style || e.category===mt.category || (mt.id==='poids_corps'&&e.equipment.includes('poids du corps'));
    const okLevel=e.level===x.level || x.level==='athlete' || (x.level==='confirme'&&['actif','confirme'].includes(e.level)) || (x.level==='actif'&&['debutant','actif'].includes(e.level)) || (x.level==='debutant'&&e.level==='debutant');
    const okEquip=e.equipment.some(eq=>(x.equipment||[]).includes(eq));
    const safeOk=!(e.injuryFilters||[]).some(i=>(x.injuries||[]).includes(i));
    return okMethod && okLevel && okEquip && safeOk;
  });
}
function buildSession(){
  let mt=method(), pool=filteredPool();
  if(pool.length<9) pool=exercises.filter(e=>e.category===mt.category).slice(0,90);
  pool=[...pool].sort((a,b)=>(a.id>b.id?1:-1));
  session=pool.slice(0,9);
  if(state.exerciseIndex>=session.length)state.exerciseIndex=0;
}
function setTab(t){state.tab=t;state.exerciseIndex=0;state.setDone=0;state.running=false;save();buildSession();render()}
function layout(content,side=true){
  return `<div class="app"><header class="top"><div class="topin"><div class="brand"><img src="assets/logo/logo_officiel.jpg"><div><h1>FAFATRAINING COACHING</h1><p>Force ton corps · élève ton mental</p></div></div><nav class="tabs">${['home:Accueil','session:Séance','library:Exercices','tracking:Suivi','coach:Coach'].map(v=>{let [id,l]=v.split(':');return `<button class="tab ${state.tab===id?'active':''}" onclick="setTab('${id}')">${l}</button>`}).join('')}</nav></div></header><main class="main">${side?`<div class="page"><section>${content}</section>${sidePanel()}</div>`:content}</main><nav class="bottom">${['home:🏠:Accueil','session:▶:Séance','library:🔎:Exos','tracking:📊:Suivi','coach:👤:Coach'].map(v=>{let [id,ic,l]=v.split(':');return `<button onclick="setTab('${id}')">${ic}<small>${l}</small></button>`}).join('')}</nav></div>`
}
function sidePanel(){let x=m(), mt=method();return `<aside class="side"><button class="btn secondary" onclick="setTab('home')">← Retour accueil</button><h3>${safe(x.name)}</h3><p class="muted">${labelLevel(x.level)} · ${labelGoal(x.goal)}</p><p>${x.place} · forme ${readiness()}%</p><div class="progressbar"><span style="width:${readiness()}%"></span></div><hr style="border-color:var(--line)"><h3>Séance</h3><p>${safe(mt.name)}<br><span class="muted">${safe(mt.duration)}</span></p><button class="btn" onclick="setTab('session')">Lancer</button><button class="btn secondary" onclick="exportPDF()">Exporter PDF</button></aside>`}
function home(){
  let mt=method();
  return layout(`<section class="hero"><div><div class="tag">VISUAL ELITE</div><h2>Simple. Beau. Prêt terrain.</h2><p>Un accueil utile : séance du jour, lancement rapide, progression. Tout le reste est rangé dans Coach.</p><div class="actions"><button class="btn" onclick="setTab('session')">▶ Lancer la séance</button><button class="btn secondary" onclick="setTab('coach')">Modifier</button></div></div><div class="today"><img class="coachAvatar" src="assets/avatar/avatar_officiel.jpg"><small>Séance du jour</small><h3>${safe(mt.name)}</h3><p>${safe(mt.duration)} · ${safe(mt.label)}</p></div></section><div class="stats"><div class="stat"><b>${state.members.length}</b>Membre</div><div class="stat"><b>${session.length}</b>Exos</div><div class="stat"><b>${exercises.length}</b>Bibliothèque</div><div class="stat"><b>${state.history.length}</b>Faites</div></div><div class="card"><h2>Coach IA</h2><p>${readiness()<60?'Allège aujourd’hui : forme basse.':'Profil prêt : séance cohérente générée.'}</p></div>`)
}
function visual(ex){
  const showPhoto=state.visualMode==='photo'||state.visualMode==='mix';
  const showAvatar=state.visualMode==='avatar'||state.visualMode==='mix';
  return `<div class="visual">${showPhoto?`<img class="photo" src="${ex.photo}" onerror="this.remove()">`:''}${showAvatar?`<img class="avatar" src="${ex.avatar}" onerror="this.src='assets/avatar/avatar_officiel.jpg'">`:''}<span class="badge chip">${state.visualMode==='mix'?'PHOTO + AVATAR':state.visualMode.toUpperCase()}</span></div>`
}
function sessionView(){
  const ex=session[state.exerciseIndex]||session[0];
  if(!ex)return layout('<div class="card"><h2>Aucune séance</h2></div>');
  return layout(`<div class="workout"><section class="exerciseFocus">${visual(ex)}<div class="exerciseBody"><span class="pill">${state.exerciseIndex+1}/${session.length}</span><span class="pill">${beginnerMode()?ex.difficulty:'Difficulté '+ex.difficulty}</span><h2>${safe(ex.name)}</h2><p class="muted">${safe(ex.categoryLabel)} · ${safe(method().name)}</p><div class="stats"><div class="stat"><b>${ex.sets}</b>Séries</div><div class="stat"><b>${safe(ex.reps)}</b>${beginnerMode()?'Répétitions':'Reps'}</div><div class="stat"><b>${ex.restLabel}</b>Repos</div><div class="stat"><b>${state.setDone}/${ex.sets}</b>Fait</div></div><div class="coachBox"><b>Consigne simple</b><p>${safe(ex.beginnerText)}</p><b>À éviter</b><p>${ex.avoid.slice(0,3).map(safe).join(' · ')}</p></div><div class="actions"><button class="btn" onclick="startRest(${ex.restSeconds})">⏱ Démarrer repos</button><button class="btn secondary" onclick="validateSet()">Valider série</button><button class="btn secondary" onclick="nextExercise()">Suivant →</button></div></div></section><aside class="timerBox"><h2>Chrono</h2><div class="timer" id="timer">${state.timeLeft||ex.restSeconds}s</div><p class="muted">Repos intégré pour éviter de réfléchir.</p><div class="setButtons"><button class="btn secondary" onclick="pauseTimer()">Pause</button><button class="btn danger" onclick="resetTimer()">Reset</button></div><hr style="border-color:var(--line)"><h3>Visuel</h3><div class="mode"><button class="${state.visualMode==='photo'?'on':''}" onclick="state.visualMode='photo';save();render()">Photo</button><button class="${state.visualMode==='mix'?'on':''}" onclick="state.visualMode='mix';save();render()">Mix</button><button class="${state.visualMode==='avatar'?'on':''}" onclick="state.visualMode='avatar';save();render()">Avatar</button></div></aside></div>`,false)
}
function startRest(sec){state.timeLeft=sec;state.running=true;save();clearInterval(window._timer);window._timer=setInterval(()=>{if(!state.running)return;state.timeLeft--;const t=document.getElementById('timer');if(t)t.textContent=state.timeLeft+'s';if(state.timeLeft<=0){clearInterval(window._timer);state.running=false;save()}},1000);render()}
function pauseTimer(){state.running=false;save()}
function resetTimer(){const ex=session[state.exerciseIndex];state.timeLeft=ex?ex.restSeconds:60;state.running=false;save();render()}
function validateSet(){const ex=session[state.exerciseIndex];state.setDone++;if(state.setDone>=ex.sets)nextExercise();else{state.timeLeft=ex.restSeconds;save();render()}}
function nextExercise(){state.exerciseIndex++;state.setDone=0;state.running=false;if(state.exerciseIndex>=session.length){state.history.push({date:new Date().toLocaleDateString('fr-FR'),method:method().name,member:m().name,exos:session.length,readiness:readiness()});state.exerciseIndex=0;alert('Séance terminée ✅')}save();render()}
function library(){
  const cats=[...new Set(exercises.map(e=>e.categoryLabel))];
  return layout(`<div class="card"><h2>Bibliothèque</h2><div class="form"><label>Recherche<input id="search" oninput="filterLib()" placeholder="squat, boxe, haltères..."></label><label>Style<select id="styleFilter" onchange="filterLib()"><option value="">Tous</option>${[...new Set(exercises.map(e=>e.style))].map(s=>`<option>${s}</option>`).join('')}</select></label><label>Niveau<select id="levelFilter" onchange="filterLib()"><option value="">Tous</option><option value="debutant">Débutant</option><option value="actif">Actif</option><option value="confirme">Confirmé</option><option value="athlete">Athlète</option></select></label></div></div>${cats.map(c=>`<div class="card"><h2>${safe(c)}</h2><div class="grid grid2">${exercises.filter(e=>e.categoryLabel===c).slice(0,70).map(e=>`<div class="libraryCard libItem" data-text="${safe((e.name+' '+e.style+' '+e.level+' '+e.equipment.join(' ')).toLowerCase())}" data-style="${e.style}" data-level="${e.level}"><div class="thumb"><img src="${e.photo}" onerror="this.remove()">Photo</div><div><b>${safe(e.name)}</b><p class="muted">${safe(e.style)} · ${safe(e.levelLabel)}</p><span class="pill">${safe(e.equipment[0])}</span></div></div>`).join('')}</div></div>`).join('')}`)
}
function filterLib(){let q=($('#search')?.value||'').toLowerCase(),s=$('#styleFilter')?.value||'',l=$('#levelFilter')?.value||'';document.querySelectorAll('.libItem').forEach(it=>{let ok=it.dataset.text.includes(q)&&(!s||it.dataset.style===s)&&(!l||it.dataset.level===l);it.style.display=ok?'grid':'none'})}
function tracking(){return layout(`<div class="card"><h2>Suivi</h2><div class="stats"><div class="stat"><b>${state.history.length}</b>Séances</div><div class="stat"><b>${readiness()}%</b>Forme</div><div class="stat"><b>${session.length}</b>Exos</div><div class="stat"><b>${exercises.length}</b>Bibliothèque</div></div></div><div class="card"><h2>Historique</h2>${state.history.slice().reverse().map(h=>`<p>✅ ${h.date} · ${safe(h.method)} · ${h.exos} exos · forme ${h.readiness}%</p>`).join('')||'<p class="muted">Aucune séance terminée.</p>'}</div><div class="card"><h2>Exemple style programme</h2><img class="programPreview" src="assets/programmes/exemple_programme_fafatraining.jpg"></div>`)}
function coach(){
  const x=m();
  return layout(`<div class="card"><h2>Coach</h2><p class="muted">Réglages rangés ici pour garder l’accueil propre.</p><div class="form"><label>Membre<input id="memberName" value="${safe(x.name)}"></label><label>Niveau<select id="memberLevel"><option value="debutant">Débutant</option><option value="actif">Actif</option><option value="confirme">Confirmé</option><option value="athlete">Athlète FAFATRAINING</option></select></label><label>Objectif<select id="goal"><option value="perte_poids">Perte de poids</option><option value="prise_masse">Prise de masse</option><option value="remise_forme">Remise en forme</option><option value="performance">Performance</option></select></label><label>Lieu<select id="place"><option>salle</option><option>domicile</option><option>extérieur</option><option>studio</option></select></label><label>Fatigue 1-5<input type="number" min="1" max="5" id="fatigue" value="${x.fatigue}"></label><label>Sommeil h<input type="number" id="sleep" value="${x.sleep}"></label><label>Méthode<select id="methodSelect">${methods.map(mt=>`<option value="${mt.id}">${safe(mt.name)} · ${safe(mt.duration)}</option>`).join('')}</select></label></div><button class="btn" onclick="saveCoach()">Enregistrer & régénérer</button></div><div class="card"><h2>Blessures / limitations</h2><div class="grid grid3">${['épaule','coude','poignet','dos','lombaires','hanche','genou','cheville','cardio'].map(i=>`<label><input class="inj" type="checkbox" value="${i}" ${(x.injuries||[]).includes(i)?'checked':''}> ${i}</label>`).join('')}</div></div><div class="card"><h2>Matériel</h2><div class="grid grid3">${['poids du corps','haltères','barre','banc','machine','poulie','cardio','kettlebell','box','corde','gants','sac de frappe','rameur','bike','ski erg','sled','extérieur','élastique','battle rope'].map(eq=>`<label><input class="eq" type="checkbox" value="${eq}" ${(x.equipment||[]).includes(eq)?'checked':''}> ${eq}</label>`).join('')}</div></div>`)
}
function saveCoach(){let x=m();x.name=memberName.value;x.level=memberLevel.value;x.goal=goal.value;x.place=place.value;x.fatigue=+fatigue.value;x.sleep=+sleep.value;x.injuries=[...document.querySelectorAll('.inj:checked')].map(i=>i.value);x.equipment=[...document.querySelectorAll('.eq:checked')].map(i=>i.value);state.method=methodSelect.value;buildSession();save();setTab('home')}
function exportPDF(){
  let rows=session.map((e,i)=>`<tr><td>${i+1}</td><td><b>${safe(e.name)}</b><br>${safe(e.categoryLabel)}</td><td>${e.sets}</td><td>${safe(e.reps)}</td><td>${safe(e.restLabel)}</td><td>${safe(e.beginnerText)}</td></tr>`).join('');
  let html=`<html><head><title>FAFATRAINING PDF</title><style>body{font-family:Arial;padding:28px;background:#050805;color:#fff}.head{display:flex;gap:18px;align-items:center}.head img{width:86px;height:86px;border-radius:50%;object-fit:cover}h1{font-size:32px}.box{border:1px solid #333;border-radius:16px;padding:14px;margin:14px 0;background:#101713}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#62ff69;color:#031305;padding:8px;text-align:left}td{border-bottom:1px solid #333;padding:8px;vertical-align:top}.green{color:#62ff69;font-weight:900}</style></head><body><div class="head"><img src="assets/logo/logo_officiel.jpg"><div><div class="green">FAFATRAINING COACHING</div><h1>${safe(method().name)}</h1></div></div><div class="box">${safe(m().name)} · ${labelLevel(m().level)} · ${labelGoal(m().goal)} · ${safe(method().duration)}</div><table><tr><th>#</th><th>Exercice</th><th>Séries</th><th>Répétitions</th><th>Repos</th><th>Consigne</th></tr>${rows}</table><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  let w=window.open('','_blank');w.document.write(html);w.document.close()
}
function render(){if(state.tab==='home')document.getElementById('app').innerHTML=home();if(state.tab==='session')document.getElementById('app').innerHTML=sessionView();if(state.tab==='library')document.getElementById('app').innerHTML=library();if(state.tab==='tracking')document.getElementById('app').innerHTML=tracking();if(state.tab==='coach')document.getElementById('app').innerHTML=coach();setTimeout(()=>{if($('#memberLevel'))memberLevel.value=m().level;if($('#goal'))goal.value=m().goal;if($('#place'))place.value=m().place;if($('#methodSelect'))methodSelect.value=state.method},0)}
document.addEventListener('DOMContentLoaded',boot);
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}))}
