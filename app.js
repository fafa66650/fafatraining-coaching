
let EXERCISES=[], PROGRAMS=[], CURRENT=null, PAGE='home', LIB='haut_du_corps';
const S={
 goal:'full',style:'equilibre',level:'choisir',duration:'30',place:'choisir',
 age:'',people:'1',injury:'',fatigue:3,stress:3,
 equipment:['poids du corps']
};
const equipGroups=[
 ['Poids du corps / simple', [['poids du corps','🤸','Poids'],['tapis','🟩','Tapis'],['mur','🧱','Mur'],['chaise','🪑','Chaise'],['box','⬛','Box'],['step','🧱','Step']]],
 ['Charges libres', [['haltères','🏋️','Haltères'],['barre','🏋️‍♂️','Barre'],['kettlebell','🔔','Kettlebell'],['medecine ball','🏀','Med ball'],['slam ball','💣','Slam'],['sandbag','🎒','Sandbag']]],
 ['Salle / machines', [['machine','⚙️','Machines'],['poulie','🧵','Poulie'],['banc','🪑','Banc'],['barre traction','🧗','Traction'],['presse','🦵','Presse'],['leg curl','🦵','Leg curl']]],
 ['Cardio / terrain', [['sac','🥊','Sac'],['corde','〰️','Corde'],['rameur','🚣','Rameur'],['vélo','🚲','Vélo'],['tapis course','🏃','Tapis'],['extérieur','🌳','Extérieur'],['cônes','🔺','Cônes'],['escaliers','🪜','Escaliers'],['battle rope','🌊','Ropes']]]
];
const defaultEquip={
 musculation:['haltères','barre','banc'],renfo:['poids du corps','élastique','haltères'],full:['poids du corps','haltères'],hiit:['poids du corps','tapis'],
 circuit:['poids du corps','haltères'],boxe:['poids du corps','sac','corde'],crossfit:['poids du corps','haltères','kettlebell','barre','box'],
 cross:['poids du corps','extérieur','haltères'],hyrox:['rameur','sandbag','haltères','extérieur'],mobilite:['tapis','mur','poids du corps'],
 prevention:['tapis','élastique','poids du corps'],explosivite:['extérieur','box','medecine ball','poids du corps']
};
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logo=()=> 'assets/logo/logo-fafa.jpg';
async function init(){
 EXERCISES=await fetch('data/exercises.json?v=64').then(r=>r.json());
 PROGRAMS=await fetch('data/programs.json?v=64').then(r=>r.json());
 route('home');
}
function route(p){PAGE=p;document.body.dataset.page=p;document.body.innerHTML=(p==='home'?home():p==='create'?create():p==='library'?library():p==='session'?session():p==='export'?exportMenu():home())+nav();}
function nav(){return `<nav class="iosNav"><button class="${PAGE==='home'?'on':''}" onclick="route('home')">🏠<small>Accueil</small></button><button class="${PAGE==='create'?'on':''}" onclick="route('create')">⚡<small>Générer</small></button><button class="${PAGE==='library'?'on':''}" onclick="route('library')">🏋️<small>Bibliothèque</small></button></nav>`}
function back(){return `<button class="back" onclick="route('home')">‹</button>`}
function selectGoal(g,render=true){
 S.goal=g; let styles=V64Engine.styleMap[g]||V64Engine.styleMap.full; S.style=styles[0][0]; S.equipment=[...(defaultEquip[g]||['poids du corps'])]; if(render) route(PAGE==='home'?'create':'create');
}
function home(){
 return `<main class="home">
 <section class="homeHero">
  <div class="homeText">
   <img class="brand" src="${logo()}" onerror="this.style.display='none'">
   <b class="kicker">FAFATRAINING PRO</b>
   <h1>Coach<br>terrain.</h1>
   <p>Construis une séance claire, chronométrée et adaptée : objectif, style, lieu, niveau, âge, matériel, fatigue et contraintes.</p>
   <button class="primary" onclick="route('create')">Créer une séance</button>
  </div>
  <div class="homeDots">${PROGRAMS.map(p=>dot(p.goal,p.icon,p.name,p.description,'selectGoal')).join('')}</div>
 </section>
 </main>`;
}
function dot(goal,icon,name,desc,fn='setGoalOnly'){
 return `<button class="round ${S.goal===goal?'on':''}" onclick="${fn}('${goal}')"><span>${icon}</span><strong>${safe(name)}</strong><small>${safe(desc||'')}</small></button>`;
}
function create(){
 const styles=V64Engine.styleMap[S.goal]||V64Engine.styleMap.full;
 return `<main>${back()}
 <section class="creator">
  <header class="pageHead"><img src="${logo()}" onerror="this.style.display='none'"><div><h1>Générateur coach</h1><p>Objectif → style → profil → matériel → séance terrain → menu exportable.</p></div></header>
  <h2>Objectif</h2>
  <div class="roundGrid goals">${PROGRAMS.map(p=>dot(p.goal,p.icon,p.name,p.description,'selectGoal')).join('')}</div>
  <h2>Style précis</h2>
  <div class="roundGrid styles">${styles.map(st=>`<button class="round style ${S.style===st[0]?'on':''}" onclick="S.style='${st[0]}'; route('create')"><strong>${safe(st[1])}</strong><small>${safe(st[2])}</small></button>`).join('')}</div>
  <div class="form">
   ${select('level','Niveau',[['choisir','Choisir'],['debutant','Débutant'],['intermediaire','Intermédiaire'],['avance','Avancé'],['expert','Expert']])}
   ${select('duration','Durée réelle',[['20','20 min'],['30','30 min'],['45','45 min'],['60','60 min']])}
   ${select('place','Lieu',[['choisir','Choisir'],['maison','Maison'],['salle','Salle'],['terrain','Terrain / gymnase'],['exterieur','Extérieur']])}
   ${select('injury','Zone à protéger',[['','Aucune'],['épaule','Épaule'],['genou','Genou'],['lombaires','Dos/lombaires'],['cheville','Cheville'],['poignet','Poignet'],['cervicales','Cervicales'],['hanches','Hanches']])}
   ${input('age','Âge','11 à 99')}
   ${input('people','Personnes','1')}
  </div>
  <h2>Matériel par catégorie</h2>
  <p class="hint">Les pastilles se pré-remplissent selon l’objectif. Tu peux ajouter ou enlever le matériel.</p>
  ${equipGroups.map(g=>equipBlock(g[0],g[1])).join('')}
  <div class="rangeGrid">
   ${range('fatigue','Fatigue','1 frais · 5 très fatigué')}
   ${range('stress','Stress','1 calme · 5 stress élevé')}
  </div>
  <button class="primary full" onclick="generate()">Générer ma séance</button>
 </section></main>`;
}
function setGoalOnly(g){S.goal=g; S.equipment=[...(defaultEquip[g]||S.equipment)]; route('home')}
function select(k,l,opts){return `<label><b>${l}</b><select onchange="S.${k}=this.value">${opts.map(o=>`<option value="${o[0]}" ${String(S[k])===String(o[0])?'selected':''}>${o[1]}</option>`).join('')}</select></label>`}
function input(k,l,ph){return `<label><b>${l}</b><input value="${safe(S[k])}" placeholder="${ph}" oninput="S.${k}=this.value"></label>`}
function equipBlock(title,items){return `<div class="equipBlock"><h3>${safe(title)}</h3><div class="equipRoundGrid">${items.map(i=>equip(i)).join('')}</div></div>`}
function equip(i){let on=S.equipment.includes(i[0]);return `<button class="equipRound ${on?'on':''}" onclick="toggleEquip('${i[0]}')"><span>${i[1]}</span><strong>${i[2]}</strong></button>`}
function toggleEquip(v){S.equipment=S.equipment.includes(v)?S.equipment.filter(x=>x!==v):[...S.equipment,v];route('create')}
function range(k,l,help){return `<label class="range"><b>${l} : ${S[k]}</b><small>${help}</small><input type="range" min="1" max="5" value="${S[k]}" oninput="S.${k}=Number(this.value);route('create')"></label>`}
function generate(){
 const cfg={...S, equipment:S.equipment};
 CURRENT=V64Engine.generate(cfg,EXERCISES);
 route('session');
}
function session(){
 if(!CURRENT) return create();
 return `<main>${back()}
 <section class="sessionTop">
  <img src="${logo()}" onerror="this.style.display='none'">
  <div><h1>${safe(CURRENT.title)}</h1><p>${safe(CURRENT.meta.duration)} min · ${safe(CURRENT.meta.level)} · ${safe(CURRENT.meta.equipment)}</p><p><b>Objectif :</b> ${safe(CURRENT.objective)}</p></div>
  <button class="primary" onclick="route('export')">Menu séance</button><button class="ghost" onclick="generate()">Regénérer</button>
 </section>
 ${V64Engine.blocks.map(b=>sessionBlock(b)).join('')}
 </main>`;
}
function sessionBlock(b){
 const items=CURRENT.blocks[b.id]||[], info=CURRENT.infos[b.id]||{};
 return `<section class="sBlock"><h2>${b.title}</h2><p>${safe(b.role)}</p><div class="sGrid">${items.map((e,i)=>`<article><b>${i+1}. ${safe(e.displayName)}</b><small>${safe(e.instruction)}</small><span>${safe(e.prescription)}</span><em>${safe(e.tips)} · Erreur : ${safe(e.mistake)}</em></article>`).join('')}</div><aside><b>${safe(info.format)}</b><span>${safe(info.rounds)}</span><span>Travail : ${safe(info.work)}</span><span>Repos : ${safe(info.rest)}</span><span>Répétitions : ${safe(info.reps)}</span></aside></section>`;
}
function library(){
 const cats=[['haut_du_corps','Haut'],['bas_du_corps','Bas'],['core','Core'],['cardio','Cardio'],['boxe','Boxe'],['mobilite','Mobilité'],['reeducation','Prévention']];
 const list=EXERCISES.filter(e=>e.group===LIB);
 return `<main>${back()}<section class="library"><header class="pageHead"><img src="${logo()}" onerror="this.style.display='none'"><div><h1>Bibliothèque</h1><p>${EXERCISES.length} mouvements classés par type, niveau, matériel et bénéfice.</p></div></header><div class="tabs">${cats.map(c=>`<button class="${LIB===c[0]?'on':''}" onclick="LIB='${c[0]}';route('library')">${c[1]}</button>`).join('')}</div><input class="search" placeholder="Rechercher un exercice..." oninput="filterLib(this.value)"><div id="libList" class="libList">${libCards(list)}</div></section></main>`;
}
function libCards(list){return list.map(e=>`<article class="lib"><b>${safe(e.name)}</b><small>${safe(e.pattern)} · ${safe((e.muscles||[]).join(' / '))}</small><p>${safe(e.tips)}</p><em>Erreur : ${safe(e.mistake)}</em><span>Déb. ${safe(e.levels.debutant)}</span><span>Inter. ${safe(e.levels.intermediaire)}</span><span>Av. ${safe(e.levels.avance)}</span><span>Expert. ${safe(e.levels.expert)}</span></article>`).join('')}
function filterLib(q){q=q.toLowerCase();document.getElementById('libList').innerHTML=libCards(EXERCISES.filter(e=>e.group===LIB&&(e.name.toLowerCase().includes(q)||e.pattern.toLowerCase().includes(q)||(e.muscles||[]).join(' ').toLowerCase().includes(q))))}
function exportMenu(){
 if(!CURRENT) return create();
 return `<main>${back()}<section id="menu" class="menu">
  <header class="menuHead"><img src="${logo()}" onerror="this.style.display='none'"><div><h1>MENU<br><span>SÉANCE</span></h1><b>${safe(CURRENT.title)}</b><p>${safe(CURRENT.meta.duration)} min · ${safe(CURRENT.meta.level)} · ${safe(CURRENT.meta.equipment)}</p></div><div class="avatar">AVATAR</div></header>
  <div class="menuObjective"><b>OBJECTIF</b><span>${safe(CURRENT.objective)}</span></div>
  <div class="menuBadges">${CURRENT.theme.badges.map(b=>`<span>${safe(b)}</span>`).join('')}</div>
  ${V64Engine.blocks.map(b=>menuBlock(b)).join('')}
  <footer>FORGE TON CORPS. ÉLÈVE TON MENTAL.</footer>
 </section><div class="actions"><button class="primary" onclick="saveSvg()">Enregistrer image</button><button class="ghost" onclick="window.print()">PDF</button></div></main>`;
}
function menuBlock(b){
 const items=CURRENT.blocks[b.id]||[], info=CURRENT.infos[b.id]||{};
 return `<section class="mBlock"><div class="mLeft"><h2>${b.title}</h2><small>${safe(b.role)}</small><div class="mItems">${items.map((e,i)=>`<p><b>${i+1}</b><strong>${safe(e.displayName)}</strong><span>${safe(e.prescription)} · ${safe(e.instruction)}</span></p>`).join('')}</div></div><aside><b>INFOS</b><span>${safe(info.minutes)} min</span><em>${safe(info.format)} · ${safe(info.rounds)}</em><i>Travail : ${safe(info.work)}</i><i>Repos : ${safe(info.rest)}</i><i>Répétitions : ${safe(info.reps)}</i></aside></section>`;
}
function saveSvg(){
 const n=document.getElementById('menu');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${n.offsetWidth}" height="${n.offsetHeight}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(n)}</foreignObject></svg>`;
 const blob=new Blob([svg],{type:'image/svg+xml'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='FAFATRAINING-menu-seance.svg';a.click();
}
init();
