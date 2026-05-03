
(function(){
'use strict';

const app = document.getElementById('app');

const state = {
  programs: [],
  exercises: [],
  quickGoals: {},
  programFamilies: {},
  muscleGroups: {},
  tab: 'home',
  family: '',
  muscle: '',
  session: [],
  current: 0,
  seconds: 30,
  running: false,
  phase: 'work',
  timer: null
};

function safe(x){
  return String(x ?? '').replace(/[<>&]/g, function(s){
    return {'<':'&lt;','>':'&gt;','&':'&amp;'}[s];
  });
}

async function getJSON(url, fallback){
  try{
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(url + ' ' + res.status);
    return await res.json();
  }catch(e){
    console.warn('JSON fallback:', url, e);
    return fallback;
  }
}

function fallbackData(){
  state.exercises = [
    {key:'pompes', name:'Pompes', category:'push', muscleGroup:'Pectoraux', muscles:'Pectoraux · triceps', simple:'Corps gainé, descends puis pousse.', mistake:'Bassin qui tombe.', styles:['renforcement'], coachCue:['Corps gainé, respiration, contrôle.']},
    {key:'squat', name:'Squat', category:'legs', muscleGroup:'Jambes / fessiers', muscles:'Quadriceps · fessiers', simple:'Genoux alignés, dos droit.', mistake:'Genoux qui rentrent.', styles:['renforcement'], coachCue:['Genoux alignés, pousse dans les talons.']},
    {key:'gainage', name:'Gainage', category:'core', muscleGroup:'Abdos / gainage', muscles:'Abdos · tronc', simple:'Corps droit, ventre serré.', mistake:'Bassin qui tombe.', styles:['core'], coachCue:['Ventre serré, respire.']}
  ];
  state.programs = [{id:'full_body_start', name:'Full Body Start', duration:'30 min', style:'renforcement', family:'START', level:'Débutant', audience:'Solo', categories:['push','legs','core'], description:'Séance simple et complète.'}];
  state.quickGoals = {auto:{label:'Mode auto', program:'full_body_start', duration:'30', desc:'Séance automatique.'}};
  state.programFamilies = {START:['full_body_start']};
  state.muscleGroups = {'Pectoraux':['pompes'], 'Jambes / fessiers':['squat'], 'Abdos / gainage':['gainage']};
}

async function boot(){
  app.innerHTML = '<div class="boot"><b>FAFATRAINING</b><span>Chargement V47...</span></div>';
  try{
    const data = await Promise.all([
      getJSON('data/programs.json', []),
      getJSON('data/exercises.json', []),
      getJSON('data/quick_goals.json', {}),
      getJSON('data/program_families.json', {}),
      getJSON('data/muscle_groups.json', {})
    ]);

    state.programs = Array.isArray(data[0]) ? data[0] : [];
    state.exercises = Array.isArray(data[1]) ? data[1] : [];
    state.quickGoals = data[2] || {};
    state.programFamilies = data[3] || {};
    state.muscleGroups = data[4] || {};

    if(!state.programs.length || !state.exercises.length) fallbackData();

    if(!Object.keys(state.quickGoals).length){
      state.quickGoals = {auto:{label:'Mode auto', program:state.programs[0].id, duration:'30', desc:'Séance automatique.'}};
    }
    if(!Object.keys(state.programFamilies).length){
      state.programFamilies = {'START': state.programs.slice(0,40).map(p=>p.id)};
    }
    if(!Object.keys(state.muscleGroups).length){
      state.exercises.forEach(e => {
        const g = e.muscleGroup || 'Full body';
        if(!state.muscleGroups[g]) state.muscleGroups[g] = [];
        state.muscleGroups[g].push(e.key);
      });
    }

    state.family = Object.keys(state.programFamilies)[0] || '';
    state.muscle = Object.keys(state.muscleGroups)[0] || '';
    render();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    }
  }catch(err){
    console.error(err);
    fallbackData();
    state.family = 'START';
    state.muscle = 'Pectoraux';
    render();
  }
}

function top(){
  const tabs = [
    ['home','Accueil'],
    ['start','Séance'],
    ['coach','Coach'],
    ['arsenal','Exercices'],
    ['programs','Programmes']
  ];
  return '<header class="top"><div class="brand"><div class="logo">FT</div><div><b>FAFATRAINING COACHING</b><small>V47 Coach réel · '+state.programs.length+' programmes</small></div></div><div class="topActions">'+
    tabs.map(t=>'<button class="'+(state.tab===t[0]?'active':'')+'" onclick="FAFA.go(\''+t[0]+'\')">'+t[1]+'</button>').join('')+
  '</div></header>';
}

function bottom(){
  return '<nav class="bottom">'+
    '<button onclick="FAFA.go(\'home\')">🏠<small>Accueil</small></button>'+
    '<button onclick="FAFA.go(\'start\')">⚡<small>Séance</small></button>'+
    '<button onclick="FAFA.go(\'coach\')">🧠<small>Coach</small></button>'+
    '<button onclick="FAFA.go(\'arsenal\')">🏋️<small>Exos</small></button>'+
    '<button onclick="FAFA.go(\'programs\')">📋<small>Prog.</small></button>'+
  '</nav>';
}

function layout(content){
  app.innerHTML = top() + '<main>' + content + '</main>' + bottom();
}

function quickForm(){
  const opts = Object.entries(state.quickGoals).map(([k,v]) => '<option value="'+safe(k)+'">'+safe(v.label || k)+'</option>').join('');
  return '<div class="quick">'+
    '<label>Personnes<input id="qPeople" type="number" min="1" placeholder="ex : 12"></label>'+
    '<label>Format / objectif<select id="qFormat"><option value="">Choisir</option>'+opts+'</select></label>'+
    '<label>Durée<select id="qDuration"><option value="auto">Auto selon objectif</option><option value="10">10 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label>'+
    '<label>Niveau<select id="qLevel"><option value="">Auto</option><option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Expert</option></select></label>'+
    '<label>Lieu<select id="qPlace"><option value="">Choisir</option><option>Maison</option><option>Salle</option><option>Extérieur</option><option>Gymnase</option><option>Box</option></select></label>'+
    '<button class="primary" onclick="FAFA.generateSession()">Générer coach réel</button>'+
  '</div>';
}

function home(){
  layout('<section class="hero"><div><p class="kicker">V47 COACH RÉEL</p><h1>Coach interactif. Menu imprimable.</h1><p>Flow séance avec timer, guidage, pause, suivant, série validée et export visuel façon Menu Séance FAFATRAINING.</p><div class="modeGrid"><button class="modeCard" onclick="FAFA.go(\'start\')"><b>⚡ START</b><span>Séance rapide solo/groupe.</span></button><button class="modeCard" onclick="FAFA.go(\'coach\')"><b>🧠 COACH</b><span>Profil, fatigue, adaptation.</span></button><button class="modeCard" onclick="FAFA.go(\'programs\')"><b>📋 PROGRAMMES</b><span>'+state.programs.length+' séances variées.</span></button></div></div><div class="startPanel"><h2>⚡ Séance rapide</h2><p>Aucun champ prérempli. Choisis ton contexte.</p>'+quickForm()+'</div></section><section class="panel"><h2>Coach réel</h2><p>Timer effort/repos · pause · suivant/précédent · série validée · guidage coach · export A4/PDF style menu.</p></section>');
}

function start(){
  layout('<section class="panel"><h1>⚡ Séance rapide IA</h1><p>Choisis le contexte et lance directement le coach interactif.</p>'+quickForm()+'</section>');
}

function coach(){
  layout('<section class="panel"><h1>🧠 Coach profil</h1><div class="quick"><label>Âge<input placeholder="ex : 35"></label><label>Taille cm<input id="height" type="number" placeholder="ex : 175"></label><label>Poids kg<input id="weight" type="number" placeholder="ex : 80"></label><label>Fatigue<select><option>1 très frais</option><option>2 léger</option><option>3 moyen</option><option>4 fatigué</option><option>5 très fatigué</option></select></label><label>Stress<select><option>1 calme</option><option>2 léger</option><option>3 moyen</option><option>4 élevé</option><option>5 très stressé</option></select></label><button class="primary" onclick="FAFA.go(\'start\')">Créer séance adaptée</button></div><p class="cue"><b>IMC automatique :</b> renseigne taille + poids. La séance reste adaptable selon fatigue/stress/blessures.</p></section>');
}

function generateSession(){
  const f = document.getElementById('qFormat')?.value || 'auto';
  const q = state.quickGoals[f] || state.quickGoals.auto || Object.values(state.quickGoals)[0];
  let p = state.programs.find(x => x.id === q.program) || state.programs.find(x => x.style === f) || state.programs[0];
  buildSessionFromProgram(p);
  state.tab = 'coachFlow';
  state.current = 0;
  state.seconds = 30;
  state.phase = 'work';
  state.running = false;
  render();
}

function pickProgram(pid){
  const p = state.programs.find(x => x.id === pid) || state.programs[0];
  buildSessionFromProgram(p);
  state.tab = 'coachFlow';
  state.current = 0;
  state.seconds = 30;
  state.phase = 'work';
  state.running = false;
  render();
}

function buildSessionFromProgram(p){
  const cats = p.categories || [];
  let pool = state.exercises.filter(e => cats.includes(e.category));
  if(pool.length < 8) pool = state.exercises.filter(e => (e.styles || []).includes(p.style));
  if(pool.length < 8) pool = state.exercises;
  state.session = pool.slice(0, 10).map((e,i) => Object.assign({}, e, {prescription: i<2 ? '1 min' : i<6 ? '12–20 reps' : '30 sec'}));
}

function programsView(){
  const ids = state.programFamilies[state.family] || [];
  const list = ids.map(id => state.programs.find(p => p.id === id)).filter(Boolean).slice(0,80);
  const tabs = Object.keys(state.programFamilies).map(f => '<button class="'+(f===state.family?'active':'')+'" onclick="FAFA.setFamily(\''+safe(f)+'\')">'+safe(f)+'</button>').join('');
  layout('<section class="panel"><h1>Programmes <span class="tag">'+state.programs.length+'</span></h1><div class="tabs">'+tabs+'</div><div class="grid">'+list.map(p => '<button class="card" onclick="FAFA.pickProgram(\''+p.id+'\')"><b>'+safe(p.name)+'</b><p>'+safe(p.duration)+' · '+safe(p.level||'')+' · '+safe(p.audience||'')+'</p><small>'+safe(p.description)+'</small></button>').join('')+'</div></section>');
}

function arsenal(){
  const ids = state.muscleGroups[state.muscle] || [];
  const list = ids.map(id => state.exercises.find(e => e.key === id)).filter(Boolean);
  const tabs = Object.keys(state.muscleGroups).map(m => '<button class="'+(m===state.muscle?'active':'')+'" onclick="FAFA.setMuscle(\''+safe(m)+'\')">'+safe(m)+'</button>').join('');
  layout('<section class="panel"><h1>Arsenal <span class="tag">'+state.exercises.length+'</span></h1><div class="tabs">'+tabs+'</div><div class="grid">'+list.map(e => '<div class="card"><b>'+safe(e.name)+'</b><p>'+safe(e.muscles)+'</p>'+((e.styles||[]).slice(0,3).map(s => '<span class="tag">'+safe(s)+'</span>').join(''))+'<br><small><b>Consigne :</b> '+safe(e.simple||e.novice||'')+'<br><b>Erreur :</b> '+safe(e.mistake||'')+'</small></div>').join('')+'</div></section>');
}

function coachFlow(){
  const ex = state.session[state.current] || state.session[0] || state.exercises[0] || {};
  app.innerHTML = top() + '<main class="coachWrap"><section class="coachCard"><div class="coachHead"><button onclick="FAFA.prevEx()">←</button><div><span class="badge">'+(state.current+1)+'/'+state.session.length+'</span><span id="phase" class="badge">'+(state.phase==='rest'?'Repos':'Effort')+'</span></div><button onclick="FAFA.nextEx()">→</button></div><div class="visual"><span>VISUEL MOUVEMENT À AJOUTER</span></div><div class="info"><h1>'+safe(ex.name||'Séance')+'</h1><p>'+safe(ex.muscles||'')+'</p><div id="timer" class="timer">'+fmt(state.seconds)+'</div><div class="cue"><b>Coach :</b> '+safe((ex.coachCue||[])[state.current % Math.max(1,(ex.coachCue||[]).length)] || ex.simple || 'Posture propre, respiration, contrôle.')+'<br><small>À éviter : '+safe(ex.mistake||'mouvement bâclé')+'</small></div></div><div class="controls"><button class="primary" onclick="FAFA.startTimer(30,\'work\')">Démarrer</button><button id="pauseBtn" onclick="FAFA.pauseTimer()">Pause</button><button onclick="FAFA.validateSet()">Série validée</button><button onclick="FAFA.exportMenu()">Menu séance</button></div></section></main>' + bottom();
  paintTimer();
}

function fmt(s){
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}
function paintTimer(){
  const t = document.getElementById('timer');
  if(t) t.textContent = fmt(state.seconds);
  const ph = document.getElementById('phase');
  if(ph) ph.textContent = state.phase === 'rest' ? 'Repos' : 'Effort';
  const b = document.getElementById('pauseBtn');
  if(b) b.textContent = state.running ? 'Pause' : 'Reprendre';
}
function startTimer(sec, ph){
  clearInterval(state.timer);
  state.seconds = sec;
  state.phase = ph;
  state.running = true;
  state.timer = setInterval(function(){
    if(!state.running) return;
    state.seconds--;
    if(state.seconds <= 0){
      clearInterval(state.timer);
      state.running = false;
      if(navigator.vibrate) navigator.vibrate([120,70,120]);
      if(state.phase === 'work') startTimer(20,'rest');
      else nextEx();
    }
    paintTimer();
  },1000);
  paintTimer();
}
function pauseTimer(){
  state.running = !state.running;
  paintTimer();
}
function nextEx(){
  state.current = Math.min(state.current + 1, Math.max(0, state.session.length - 1));
  state.seconds = 30;
  state.phase = 'work';
  state.running = false;
  clearInterval(state.timer);
  render();
}
function prevEx(){
  state.current = Math.max(state.current - 1, 0);
  state.seconds = 30;
  state.phase = 'work';
  state.running = false;
  clearInterval(state.timer);
  render();
}
function validateSet(){
  if(navigator.vibrate) navigator.vibrate(70);
  nextEx();
}

function exportMenu(){
  if(!state.session.length) buildSessionFromProgram(state.programs[0]);
  const blocks = [
    ['1. ENTRÉE','ACTIVATION TOTALE','Élever la température corporelle et préparer mentalement.',state.session.slice(0,5)],
    ['2. PLAT','CIRCUIT CHALLENGE','Dépenser, renforcer, tenir le rythme.',state.session.slice(0,6)],
    ['3. ACCOMPAGNEMENT','RÉSISTANCE & CORE','Renforcer le centre du corps et prévenir les blessures.',state.session.slice(2,7)],
    ['4. DESSERT','FINISHER ULTIME','Finir fort et prouver ta discipline.',state.session.slice(0,5)]
  ];
  const css = '@page{size:A4 portrait;margin:8mm}body{margin:0;background:#050505;color:#fff;font-family:Impact,Arial Black,Arial,sans-serif}.menu{width:210mm;min-height:297mm;margin:auto;background:#050505;padding:8mm;box-sizing:border-box;border:3px solid #b6ff20}header{display:flex;gap:18px;align-items:center;border-bottom:2px solid #b6ff20;padding-bottom:10px}.logo{width:82px;height:82px;border:3px solid #b6ff20;border-radius:50%;display:grid;place-items:center;font-size:34px;color:#b6ff20}h1{font-size:58px;line-height:.82;margin:0}h1 span,h2,aside h3,footer h3,h4{color:#b6ff20}.badges{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:12px 0}.badges b{text-align:center;border:1px solid #b6ff20;padding:7px;font-size:12px}.row{display:grid;grid-template-columns:1fr 46mm;gap:8px;margin:8px 0}.mainBlock,aside,footer>div{border:2px solid #b6ff20;border-radius:8px;padding:8px}h2{font-size:26px;margin:0 0 8px}h2 em{color:#ddd;font-size:18px}.items{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.item{min-height:86px;border-left:1px solid #b6ff20;text-align:center;padding:4px}.pic{margin:auto;width:34px;height:34px;border-radius:50%;background:#b6ff20;color:#111;display:grid;place-items:center}.item strong{font-size:12px;display:block}.item span{font-family:Arial;color:#b6ff20;font-weight:900;font-size:12px}p{font-family:Arial,sans-serif;font-weight:800;font-size:13px;line-height:1.32}footer{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}h4{text-align:center;font-size:22px;margin:10px 0 0}.print{position:fixed;right:14px;bottom:14px;padding:12px 18px;border-radius:99px;background:#b6ff20;border:0;font-weight:900}@media print{.print{display:none}}';
  const rows = blocks.map(function(b){
    const items = b[3].map(function(e,i){
      return '<div class="item"><div class="pic">'+(i+1)+'</div><strong>'+safe(e.name)+'</strong><span>'+safe(e.prescription||'30 sec')+'</span></div>';
    }).join('');
    return '<div class="row"><div class="mainBlock"><h2>'+b[0]+' <em>— '+b[1]+'</em></h2><div class="items">'+items+'</div></div><aside><h3>OBJECTIF</h3><p>'+b[2]+'</p></aside></div>';
  }).join('');
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Menu séance FAFATRAINING</title><style>'+css+'</style></head><body><section class="menu"><header><div class="logo">FT</div><div><h1>MENU<br><span>SÉANCE SPORT</span></h1><p>Challenge FAFATRAINING — chrono, discipline, mental.</p></div></header><div class="badges"><b>FORCE</b><b>ENDURANCE</b><b>PUISSANCE</b><b>BRÛLE GRAISSE</b><b>MENTAL</b><b>DISCIPLINE</b></div>'+rows+'<footer><div><h3>CONSEILS DU COACH</h3><p>Hydrate-toi, adapte si douleur, garde une posture propre, respire.</p></div><div><h3>MATÉRIEL</h3><p>Poids du corps, corde, kettlebell, élastique selon séance.</p></div></footer><h4>PAS D’EXCUSES. PROGRESSE CHAQUE JOUR.</h4></section><button class="print" onclick="window.print()">Imprimer / PDF</button></body></html>';
  const w = window.open('', '_blank');
  if(w){
    w.document.open();
    w.document.write(html);
    w.document.close();
  }else{
    alert('Pop-up bloquée : autorise les fenêtres pour exporter le menu.');
  }
}

function render(){
  if(state.tab === 'home') home();
  else if(state.tab === 'start') start();
  else if(state.tab === 'coach') coach();
  else if(state.tab === 'programs') programsView();
  else if(state.tab === 'arsenal') arsenal();
  else if(state.tab === 'coachFlow') coachFlow();
  else home();
}

window.FAFA = {
  go:function(t){state.tab=t; render();},
  setFamily:function(f){state.family=f; render();},
  setMuscle:function(m){state.muscle=m; render();},
  generateSession:generateSession,
  pickProgram:pickProgram,
  startTimer:startTimer,
  pauseTimer:pauseTimer,
  nextEx:nextEx,
  prevEx:prevEx,
  validateSet:validateSet,
  exportMenu:exportMenu
};

boot();
})();
