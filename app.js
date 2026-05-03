
const app=document.getElementById('app');
const safe=x=>String(x??'').replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
let programs=[],exercises=[],quickGoals={},programFamilies={},muscleGroups={};
let tab='home',family='',muscle='',session=[],current=0,seconds=30,running=false,phase='work',timer=null;

async function boot(){
 [programs,exercises,quickGoals,programFamilies,muscleGroups]=await Promise.all([
  fetch('data/programs.json').then(r=>r.json()),
  fetch('data/exercises.json').then(r=>r.json()),
  fetch('data/quick_goals.json').then(r=>r.json()),
  fetch('data/program_families.json').then(r=>r.json()),
  fetch('data/muscle_groups.json').then(r=>r.json())
 ]);
 family=Object.keys(programFamilies)[0]||''; muscle=Object.keys(muscleGroups)[0]||'';
 render();
 if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
function top(){return `<header class="top"><div class="brand"><div class="logo">FT</div><div><b>FAFATRAINING COACHING</b><small>V47 Coach réel · programmes ${programs.length}</small></div></div><div class="topActions">${['home:Accueil','start:Séance','coach:Coach','arsenal:Exercices','programs:Programmes'].map(x=>{let [k,l]=x.split(':');return `<button class="${tab===k?'active':''}" onclick="go('${k}')">${l}</button>`}).join('')}</div></header>`}
function bottom(){return `<nav class="bottom"><button onclick="go('home')">🏠<small>Accueil</small></button><button onclick="go('start')">⚡<small>Séance</small></button><button onclick="go('coach')">🧠<small>Coach</small></button><button onclick="go('arsenal')">🏋️<small>Exos</small></button><button onclick="go('programs')">📋<small>Prog.</small></button></nav>`}
function layout(c){app.innerHTML=top()+`<main>${c}</main>`+bottom()}
function go(t){tab=t;render()}
function quickForm(){return `<div class="quick">
<label>Personnes<input id="qPeople" type="number" min="1" placeholder="ex : 12"></label>
<label>Format / objectif<select id="qFormat"><option value="">Choisir</option>${Object.entries(quickGoals).map(([k,v])=>`<option value="${k}">${safe(v.label)}</option>`).join('')}</select></label>
<label>Durée<select id="qDuration"><option value="auto">Auto selon objectif</option><option value="10">10 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label>
<label>Niveau<select id="qLevel"><option value="">Auto</option><option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Expert</option></select></label>
<label>Lieu<select id="qPlace"><option value="">Choisir</option><option>Maison</option><option>Salle</option><option>Extérieur</option><option>Gymnase</option><option>Box</option></select></label>
<button class="primary" onclick="generateSession()">Générer coach réel</button></div>`}
function home(){layout(`<section class="hero"><div><p class="kicker">V47 COACH RÉEL</p><h1>Coach interactif. Menu imprimable.</h1><p>Flow séance avec timer, guidage, pause, suivant, série validée et export visuel façon Menu Séance FAFATRAINING.</p><div class="modeGrid"><button class="modeCard" onclick="go('start')"><b>⚡ START</b><span>Séance rapide solo/groupe.</span></button><button class="modeCard" onclick="go('coach')"><b>🧠 COACH</b><span>Profil, fatigue, adaptation.</span></button><button class="modeCard" onclick="go('programs')"><b>📋 PROGRAMMES</b><span>${programs.length} séances variées.</span></button></div></div><div class="startPanel"><h2>⚡ Séance rapide</h2><p>Aucun champ prérempli. Choisis ton contexte.</p>${quickForm()}</div></section><section class="panel"><h2>Ce qui est nouveau</h2><p>Timer effort/repos · pause · suivant/précédent · série validée · guidage coach · export A4/PDF style menu.</p></section>`)}
function start(){layout(`<section class="panel"><h1>⚡ Séance rapide IA</h1><p>Choisis le contexte et lance directement le coach interactif.</p>${quickForm()}</section>`)}
function coach(){layout(`<section class="panel"><h1>🧠 Coach profil</h1><div class="quick"><label>Âge<input placeholder="ex : 35"></label><label>Taille cm<input id="height" type="number" placeholder="ex : 175"></label><label>Poids kg<input id="weight" type="number" placeholder="ex : 80"></label><label>Fatigue<select><option>1 très frais</option><option>2 léger</option><option>3 moyen</option><option>4 fatigué</option><option>5 très fatigué</option></select></label><label>Stress<select><option>1 calme</option><option>2 léger</option><option>3 moyen</option><option>4 élevé</option><option>5 très stressé</option></select></label><button class="primary" onclick="go('start')">Créer séance adaptée</button></div><p class="cue"><b>IMC automatique :</b> renseigne taille + poids. La séance reste adaptable selon fatigue/stress/blessures.</p></section>`)}
function pickProgram(pid){const p=programs.find(x=>x.id===pid); if(!p)return; buildSessionFromProgram(p); tab='coachFlow'; current=0; render()}
function generateSession(){
 const f=document.getElementById('qFormat')?.value;
 const people=parseInt(document.getElementById('qPeople')?.value||'1',10);
 let q=quickGoals[f]||quickGoals.auto||Object.values(quickGoals)[0];
 let p=programs.find(x=>x.id===q.program) || programs.find(x=>x.style===f) || programs[0];
 if(people>=8){
   p = programs.find(x=>(x.audience||'').toLowerCase().includes('groupe') && (f?x.style===f:true)) || p;
 }
 buildSessionFromProgram(p);
 tab='coachFlow'; current=0; seconds=30; phase='work'; running=false; render();
}
function buildSessionFromProgram(p){
 const cats=p.categories||[];
 let pool=exercises.filter(e=>cats.includes(e.category));
 if(pool.length<8) pool=exercises.filter(e=>(e.styles||[]).includes(p.style));
 if(pool.length<8) pool=exercises;
 session=pool.slice(0,10).map((e,i)=>({...e, prescription:i<2?'1 min':i<6?'12–20 reps':'30 sec'}));
}
function programsView(){
 let ids=programFamilies[family]||[]; let list=ids.map(id=>programs.find(p=>p.id===id)).filter(Boolean).slice(0,80);
 layout(`<section class="panel"><h1>Programmes <span class="tag">${programs.length}</span></h1><div class="tabs">${Object.keys(programFamilies).map(f=>`<button class="${f===family?'active':''}" onclick="family='${safe(f)}';render()">${safe(f)}</button>`).join('')}</div><div class="grid">${list.map(p=>`<button class="card" onclick="pickProgram('${p.id}')"><b>${safe(p.name)}</b><p>${safe(p.duration)} · ${safe(p.level||'')} · ${safe(p.audience||'')}</p><small>${safe(p.description)}</small></button>`).join('')}</div></section>`);
}
function arsenal(){
 let ids=muscleGroups[muscle]||[]; let list=ids.map(id=>exercises.find(e=>e.key===id)).filter(Boolean);
 layout(`<section class="panel"><h1>Arsenal <span class="tag">${exercises.length}</span></h1><div class="tabs">${Object.keys(muscleGroups).map(m=>`<button class="${m===muscle?'active':''}" onclick="muscle='${safe(m)}';render()">${safe(m)}</button>`).join('')}</div><div class="grid">${list.map(e=>`<div class="card"><b>${safe(e.name)}</b><p>${safe(e.muscles)}</p>${(e.styles||[]).slice(0,3).map(s=>`<span class="tag">${safe(s)}</span>`).join('')}<br><small><b>Consigne :</b> ${safe(e.simple||e.novice||'')}<br><b>Erreur :</b> ${safe(e.mistake||'')}</small></div>`).join('')}</div></section>`);
}
function coachFlow(){
 const ex=session[current]||session[0]||{};
 app.innerHTML=top()+`<main class="coachWrap"><section class="coachCard"><div class="coachHead"><button onclick="prevEx()">←</button><div><span class="badge">${current+1}/${session.length}</span><span id="phase" class="badge">${phase==='rest'?'Repos':'Effort'}</span></div><button onclick="nextEx()">→</button></div><div class="visual"><span>VISUEL MOUVEMENT À AJOUTER</span></div><div class="info"><h1>${safe(ex.name||'Séance')}</h1><p>${safe(ex.muscles||'')}</p><div id="timer" class="timer">${fmt(seconds)}</div><div class="cue"><b>Coach :</b> ${safe((ex.coachCue||[])[current%(ex.coachCue||['']).length]||ex.simple||'Posture propre, respiration, contrôle.')}<br><small>À éviter : ${safe(ex.mistake||'mouvement bâclé')}</small></div></div><div class="controls"><button class="primary" onclick="startTimer(30,'work')">Démarrer</button><button id="pauseBtn" onclick="pauseTimer()">Pause</button><button onclick="validateSet()">Série validée</button><button onclick="exportMenu()">Menu séance</button></div></section></main>`+bottom(); paintTimer();
}
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function paintTimer(){let t=document.getElementById('timer'); if(t)t.textContent=fmt(seconds); let ph=document.getElementById('phase'); if(ph)ph.textContent=phase==='rest'?'Repos':'Effort'; let b=document.getElementById('pauseBtn'); if(b)b.textContent=running?'Pause':'Reprendre'}
function startTimer(sec=30,ph='work'){clearInterval(timer); seconds=sec; phase=ph; running=true; timer=setInterval(()=>{if(!running)return; seconds--; if(seconds<=0){clearInterval(timer); running=false; if(navigator.vibrate)navigator.vibrate([120,70,120]); phase==='work'?startTimer(20,'rest'):nextEx()} paintTimer()},1000); paintTimer()}
function pauseTimer(){running=!running; paintTimer()}
function nextEx(){current=Math.min(current+1,session.length-1); seconds=30; phase='work'; running=false; clearInterval(timer); render()}
function prevEx(){current=Math.max(current-1,0); seconds=30; phase='work'; running=false; clearInterval(timer); render()}
function validateSet(){if(navigator.vibrate)navigator.vibrate(70); nextEx()}
function exportMenu(){
 if(!session.length) buildSessionFromProgram(programs[0]);
 const blocks=[
  ['1. ENTRÉE','ACTIVATION TOTALE','Élever la température corporelle et préparer mentalement.',session.slice(0,5)],
  ['2. PLAT','CIRCUIT CHALLENGE','Dépenser, renforcer, tenir le rythme.',session.slice(0,6)],
  ['3. ACCOMPAGNEMENT','RÉSISTANCE & CORE','Renforcer le centre du corps et prévenir les blessures.',session.slice(2,7)],
  ['4. DESSERT','FINISHER ULTIME','Finir fort et prouver ta discipline.',session.slice(0,5)]
 ];
 const css=`@page{size:A4 portrait;margin:8mm}body{margin:0;background:#050505;color:#fff;font-family:Impact,Arial Black,Arial,sans-serif}.menu{width:210mm;min-height:297mm;margin:auto;background:#050505;padding:8mm;box-sizing:border-box;border:3px solid #b6ff20}header{display:flex;gap:18px;align-items:center;border-bottom:2px solid #b6ff20;padding-bottom:10px}.logo{width:82px;height:82px;border:3px solid #b6ff20;border-radius:50%;display:grid;place-items:center;font-size:34px;color:#b6ff20}h1{font-size:58px;line-height:.82;margin:0}h1 span,h2,aside h3,footer h3,h4{color:#b6ff20}.badges{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:12px 0}.badges b{text-align:center;border:1px solid #b6ff20;padding:7px;font-size:12px}.row{display:grid;grid-template-columns:1fr 46mm;gap:8px;margin:8px 0}.mainBlock,aside,footer>div{border:2px solid #b6ff20;border-radius:8px;padding:8px}h2{font-size:26px;margin:0 0 8px}h2 em{color:#ddd;font-size:18px}.items{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.item{min-height:86px;border-left:1px solid #b6ff20;text-align:center;padding:4px}.pic{margin:auto;width:34px;height:34px;border-radius:50%;background:#b6ff20;color:#111;display:grid;place-items:center}.item strong{font-size:12px;display:block}.item span{font-family:Arial;color:#b6ff20;font-weight:900;font-size:12px}p{font-family:Arial,sans-serif;font-weight:800;font-size:13px;line-height:1.32}footer{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}h4{text-align:center;font-size:22px;margin:10px 0 0}.print{position:fixed;right:14px;bottom:14px;padding:12px 18px;border-radius:99px;background:#b6ff20;border:0;font-weight:900}@media print{.print{display:none}}`;
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>Menu séance FAFATRAINING</title><style>${css}</style></head><body><section class="menu"><header><div class="logo">FT</div><div><h1>MENU<br><span>SÉANCE SPORT</span></h1><p>Challenge FAFATRAINING — chrono, discipline, mental.</p></div></header><div class="badges"><b>FORCE</b><b>ENDURANCE</b><b>PUISSANCE</b><b>BRÛLE GRAISSE</b><b>MENTAL</b><b>DISCIPLINE</b></div>${blocks.map(b=>`<div class="row"><div class="mainBlock"><h2>${b[0]} <em>— ${b[1]}</em></h2><div class="items">${b[3].map((e,i)=>`<div class="item"><div class="pic">${i+1}</div><strong>${safe(e.name)}</strong><span>${safe(e.prescription||'30 sec')}</span></div>`).join('')}</div></div><aside><h3>OBJECTIF</h3><p>${b[2]}</p></aside></div>`).join('')}<footer><div><h3>CONSEILS DU COACH</h3><p>Hydrate-toi, adapte si douleur, garde une posture propre, respire.</p></div><div><h3>MATÉRIEL</h3><p>Poids du corps, corde, kettlebell, élastique selon séance.</p></div></footer><h4>PAS D’EXCUSES. PROGRESSE CHAQUE JOUR.</h4></section><button class="print" onclick="window.print()">Imprimer / PDF</button></body></html>`;
 const w=window.open('','_blank'); w.document.open(); w.document.write(html); w.document.close();
}
function render(){ if(tab==='home')home(); if(tab==='start')start(); if(tab==='coach')coach(); if(tab==='programs')programsView(); if(tab==='arsenal')arsenal(); if(tab==='coachFlow')coachFlow(); }
boot();
