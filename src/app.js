import {loadDB,getActiveMember,setActiveMember,upsertMember,deleteMember,saveSession,memberSessions,exportBackup,importBackup} from './core/storage.js';
import {generateSession,bmi,progression} from './services/coach-engine.js';
import {esc,metric,logo} from './components/ui.js';

let EX=[],PROGRAMS=[],currentSession=null,libFilter={q:'',group:'Tous',equipment:'Tous'};
const VIS={remise_en_forme:'assets/visuals/coaching.jpeg',force:'assets/visuals/kettlebell.jpeg',hypertrophie:'assets/visuals/fullbody.jpeg',perte_gras:'assets/visuals/hiit.jpeg',boxe:'assets/visuals/boxing.jpeg',cardio_boxing:'assets/visuals/boxing.jpeg',trail:'assets/visuals/cardio.jpeg',aerobic:'assets/visuals/cardio.jpeg',bodyweight:'assets/visuals/fullbody.jpeg',crossfit:'assets/visuals/battlerope.jpeg',hyrox:'assets/visuals/hyrox.jpeg',mobilite:'assets/visuals/mobility.jpeg',prevention:'assets/visuals/mobility.jpeg',senior:'assets/visuals/coaching.jpeg'};
const visualFor=g=>VIS[g]||'assets/visuals/avatar-coach.jpeg';
const daily={fatigue:3,stress:3,sleep:3,pain:0};
const build={goal:'remise_en_forme',duration:30,place:'Maison',equipment:['poids du corps']};

async function boot(){
  [EX,PROGRAMS]=await Promise.all([fetch('data/exercises.json').then(r=>r.json()),fetch('data/programs.json').then(r=>r.json())]);
  window.build=build; window.daily=daily; window.visualFor=visualFor; window.APP={go,setActive,deleteMemberUI,onboardSave,createMember,selectGoal,toggleEquipment,generate,completeSession,updateLog,feedback,filterLibrary,printSession,backup,restore};
  if(!location.hash) location.hash=getActiveMember()?'#/home':'#/onboarding';
  addEventListener('hashchange',render); render();
}
function path(){return location.hash.replace('#/','').split('?')[0]||'home'}
function go(p){location.hash='#/'+p}
function shell(content){
 const m=getActiveMember();
 return `<header class="topbar"><div class="brand">${logo()}<div><b>FAFATRAINING</b><small>Complete Coach System</small></div></div><div class="member-switch">${m?`<button onclick="APP.go('members')">${esc(m.name)} ▾</button>`:''}</div></header><main>${content}</main><nav class="bottom-nav"><button onclick="APP.go('home')">⌂<small>Accueil</small></button><button onclick="APP.go('create')">＋<small>Créer</small></button><button onclick="APP.go('library')">▦<small>Exercices</small></button><button onclick="APP.go('progress')">↗<small>Progrès</small></button><button onclick="APP.go('members')">◎<small>Adhérents</small></button></nav>`;
}
function render(){
 const p=path(),m=getActiveMember();
 if(!m && p!=='onboarding'){go('onboarding');return}
 const views={home, onboarding, members, create, session, library, progress};
 document.body.innerHTML=p==='onboarding'?onboarding():shell((views[p]||home)());
}
function home(){
 const m=getActiveMember(),stats=progression(m.id),b=bmi(m.weight,m.height);
 return `<section class="hero visual-hero"><div><p class="eyebrow">REAL ATHLETE AI · V78</p><h1>Ton coach.<br>Ta séance.<br>Ton terrain.</h1><p>Le moteur adapte réellement le contenu à ton profil, ton objectif, ton matériel, ton temps disponible et ton état du jour.</p><div class="hero-actions"><button class="primary" onclick="APP.go('create')">Créer ma séance</button><button class="secondary" onclick="APP.go('progress')">Voir mes progrès</button></div></div><img class="coach-hero" src="assets/visuals/avatar-coach.jpeg" alt="Coach FAFATRAINING"></section>
 <section class="coach-strip"><img src="assets/visuals/avatar-action.jpeg" alt="FAFA"><div><b>FAFA te guide</b><span>Choisis un univers : le visuel, les exercices, le volume et l’intensité s’adaptent.</span></div></section>
 <section class="metrics">${metric('IMC',b.value||'—',b.label)}${metric('Séances',stats.count,'historique')}${metric('30 jours',stats.last30,'régularité')}${metric('Volume',stats.volume?stats.volume+' kg':'—','charges enregistrées')}</section>
 <h2>Accès direct</h2><section class="quick-grid">${PROGRAMS.map(p=>`<button class="visual-program" onclick="APP.selectGoal('${p.goal}')" style="--bg:url('${visualFor(p.goal)}')"><span>${p.icon}</span><b>${esc(p.name)}</b><small>${esc(p.sport)}</small></button>`).join('')}</section>`;
}
function onboarding(member=null){
 member=member||{};
 const eq=['poids du corps','tapis','haltères','barre','kettlebell','élastique','banc','machine','poulie','barre traction','sac','pattes d’ours','corde','rameur','vélo','sled','skierg','extérieur'];
 return `<main class="onboard"><section class="onboard-card"><div class="onboard-brand">${logo()}<div><p class="eyebrow">ONBOARDING</p><h1>Créons le bon profil.</h1><p>Tout ce qui est demandé ici sert réellement à adapter les séances.</p></div></div><form id="onboardForm" onsubmit="event.preventDefault();APP.onboardSave()"><input type="hidden" id="memberId" value="${esc(member.id||'')}"><div class="form-grid">
 ${field('name','Prénom / nom',member.name||'','text',true)}${field('age','Âge',member.age||'','number',true)}${field('height','Taille (cm)',member.height||'','number',true)}${field('weight','Poids (kg)',member.weight||'','number',true)}
 ${select('level','Niveau',member.level||'Débutant',['Débutant','Intermédiaire','Avancé','Expert'])}${field('experience','Années de pratique',member.experience||0,'number')}
 ${select('sport','Sport principal',member.sport||'Général',['Général','Musculation','Boxe','Trail','Aérobic','Poids de corps','Cross training','Hyrox','Mobilité','Sport santé'])}
 ${select('goal','Objectif principal',member.goal||'remise_en_forme',['remise_en_forme','force','hypertrophie','perte_gras','boxe','trail','aerobic','crossfit','hyrox','mobilite','prevention','senior'])}
 ${field('secondaryGoal','Objectif secondaire',member.secondaryGoal||'','text')}${select('daysPerWeek','Séances / semaine',member.daysPerWeek||3,[2,3,4,5,6])}${select('defaultDuration','Durée habituelle',member.defaultDuration||30,[20,30,45,60,75])}${select('defaultPlace','Lieu principal',member.defaultPlace||'Maison',['Maison','Salle','Extérieur','Terrain','Gymnase'])}
 ${field('limitations','Blessures / limites / zones à protéger',member.limitations||'','text')}${select('lowImpact','Préférence faible impact',String(member.lowImpact??false),['false','true'])}</div><h3>Matériel disponible</h3><div class="equipment-grid">${eq.map(x=>`<label><input type="checkbox" name="equipment" value="${x}" ${(member.equipment||['poids du corps']).includes(x)?'checked':''}><span>${x}</span></label>`).join('')}</div><button class="primary full">Enregistrer le profil</button></form></section></main>`;
}
function field(id,label,value,type='text',required=false){return `<label><span>${label}</span><input id="${id}" type="${type}" value="${esc(value)}" ${required?'required':''}></label>`}
function select(id,label,value,opts){return `<label><span>${label}</span><select id="${id}">${opts.map(o=>`<option ${String(o)===String(value)?'selected':''}>${o}</option>`).join('')}</select></label>`}
function onboardSave(){
 const equipment=[...document.querySelectorAll('input[name="equipment"]:checked')].map(x=>x.value);
 const member={id:document.querySelector('#memberId').value||undefined,name:val('name'),age:+val('age'),height:+val('height'),weight:+val('weight'),level:val('level'),experience:+val('experience'),sport:val('sport'),goal:val('goal'),secondaryGoal:val('secondaryGoal'),daysPerWeek:+val('daysPerWeek'),defaultDuration:+val('defaultDuration'),defaultPlace:val('defaultPlace'),limitations:val('limitations'),lowImpact:val('lowImpact')==='true',equipment};
 upsertMember(member); go('home');
}
function val(id){return document.querySelector('#'+id)?.value||''}
function members(){
 const db=loadDB(),active=getActiveMember();
 return `<section class="page-head"><div><p class="eyebrow">ADHÉRENTS</p><h1>Profils suivis</h1><p>Les données restent sur cet appareil pour fonctionner sans serveur.</p></div><button class="primary" onclick="APP.createMember()">＋ Ajouter</button></section><section class="member-list">${db.members.map(m=>`<article class="member-card ${m.id===active?.id?'active':''}"><div><b>${esc(m.name)}</b><span>${m.age} ans · ${esc(m.level)} · ${esc(m.sport)}</span><small>${esc(m.goal)}</small></div><div><button onclick="APP.setActive('${m.id}')">Utiliser</button><button onclick="location.hash='#/onboarding?edit=${m.id}';setTimeout(()=>window.__editMember('${m.id}'),0)">Modifier</button><button class="danger" onclick="APP.deleteMemberUI('${m.id}')">Supprimer</button></div></article>`).join('')}</section><section class="backup-card"><h3>Sauvegarde locale</h3><p>Exporte tous les profils et historiques dans un fichier JSON ou réimporte une sauvegarde.</p><div><button class="secondary" onclick="APP.backup()">Exporter</button><label class="secondary file-btn">Importer<input type="file" accept="application/json" onchange="APP.restore(this.files[0])"></label></div></section>`;
}
window.__editMember=id=>{const m=loadDB().members.find(x=>x.id===id);if(m)document.body.innerHTML=onboarding(m)};
function createMember(){document.body.innerHTML=onboarding({})}
function setActive(id){setActiveMember(id);go('home')}
function deleteMemberUI(id){if(confirm('Supprimer ce profil et son historique ?')){deleteMember(id);render()}}
function selectGoal(goal){build.goal=goal; const m=getActiveMember(); build.duration=m.defaultDuration||30; build.place=m.defaultPlace||'Maison'; build.equipment=[...(m.equipment||['poids du corps'])]; go('create')}
function create(){
 const m=getActiveMember(); if(!build.equipment.length)build.equipment=[...(m.equipment||['poids du corps'])];
 const goalOpts=PROGRAMS.map(p=>`<option value="${p.goal}" ${p.goal===build.goal?'selected':''}>${p.name}</option>`).join('');
 return `<section class="page-head create-head"><div><p class="eyebrow">GÉNÉRATEUR COACH</p><h1>Une seule page. Tout utile.</h1><p>FAFA ajuste automatiquement la séance à ton état réel du jour.</p></div><img id="goalVisual" src="${visualFor(build.goal)}" alt="Univers d'entraînement"></section><section class="creator"><div class="creator-grid"><label><span>Objectif / sport</span><select id="goalSel" onchange="build.goal=this.value;document.querySelector('#goalVisual').src=visualFor(this.value)">${goalOpts}</select></label><label><span>Durée</span><select id="durationSel" onchange="build.duration=+this.value">${[20,30,45,60,75].map(x=>`<option ${x===build.duration?'selected':''}>${x}</option>`).join('')}</select></label><label><span>Lieu</span><select id="placeSel" onchange="build.place=this.value">${['Maison','Salle','Extérieur','Terrain','Gymnase'].map(x=>`<option ${x===build.place?'selected':''}>${x}</option>`).join('')}</select></label></div><h3>État du jour</h3><div class="readiness-grid">${slider('fatigue','Fatigue')}${slider('stress','Stress')}${slider('sleep','Sommeil')}${slider('pain','Douleur',0,5)}</div><h3>Matériel aujourd’hui</h3><div class="equipment-grid">${(m.equipment||[]).map(x=>`<label><input type="checkbox" value="${x}" ${build.equipment.includes(x)?'checked':''} onchange="APP.toggleEquipment('${x}')"><span>${x}</span></label>`).join('')}</div><button class="primary full big" onclick="APP.generate()">Générer ma séance adaptée</button></section>`;
}
function slider(k,l,min=1,max=5){return `<label class="slider"><span>${l} <b id="${k}Val">${daily[k]}</b></span><input type="range" min="${min}" max="${max}" value="${daily[k]}" oninput="daily.${k}=+this.value;document.querySelector('#${k}Val').textContent=this.value"></label>`}
function toggleEquipment(x){build.equipment=build.equipment.includes(x)?build.equipment.filter(y=>y!==x):[...build.equipment,x]}
function generate(){currentSession=generateSession({member:getActiveMember(),daily,goal:build.goal,duration:+document.querySelector('#durationSel').value,equipment:build.equipment,place:document.querySelector('#placeSel').value,exercises:EX});go('session')}
function session(){
 if(!currentSession)return `<section class="empty"><h2>Aucune séance générée.</h2><button class="primary" onclick="APP.go('create')">Créer</button></section>`;
 const s=currentSession,m=getActiveMember();
 const boxing=s.boxing?`<div class="boxing-format"><b>${s.boxing.rounds} rounds</b><span>${s.boxing.roundSeconds/60} min travail · ${s.boxing.restSeconds/60} min récup</span></div>`:'';
 return `<section class="session-hero"><div><p class="eyebrow">${esc(m.name)} · ${esc(s.goal)}</p><h1>${s.duration} min · Readiness ${s.readinessScore}/100</h1><p>${esc(s.rx.sets)} · ${esc(s.rx.reps)} · repos ${esc(s.rx.rest)} · RPE ${s.rx.rpe}</p></div><div class="session-actions"><button class="secondary" onclick="APP.printSession()">Imprimer / PDF</button></div></section>${boxing}<section class="session-metrics">${metric('Calories',`~${s.estimatedCalories}`,'estimation')}${metric('Charge',s.rx.pct,'cible')}${metric('Tempo',s.rx.tempo,'principal')}${metric('RPE',s.rx.rpe,'intensité cible')}</section><section class="workout">${Object.entries(s.blocks).map(([k,list])=>workBlock(k,list)).join('')}</section><section class="complete-card"><h3>Fin de séance</h3><p>Enregistre ce qui a réellement été fait pour que la prochaine séance s’adapte.</p><button class="primary full" onclick="APP.completeSession()">Terminer et enregistrer</button></section>`;
}
const blockNames={warmup:'Échauffement',skill:'Technique',main:'Bloc principal',support:'Renfort / prévention',finish:'Retour au calme / finisher'};
function workBlock(k,list){return `<article class="work-block"><header><div><small>${blockNames[k]}</small><h2>${k==='main'?'Travail principal':' '}</h2></div></header>${list.map((e,i)=>`<div class="exercise-row"><div class="exercise-index">${i+1}</div><div class="exercise-main"><b>${esc(e.name)}</b><p>${esc(e.cues)}</p><small>Erreur : ${esc(e.error)}</small>${e.variants?.length?`<em>Variantes : ${e.variants.slice(0,3).map(esc).join(' · ')}</em>`:''}</div><div class="prescription"><strong>${esc(e.sets)}</strong><span>${esc(e.reps)}</span><span>Repos ${esc(e.rest)}</span><span>${esc(e.load)}</span></div><details><summary>Journal</summary><div class="log-grid"><input type="number" placeholder="séries" onchange="APP.updateLog('${e.exerciseId}','loggedSets',this.value)"><input type="number" placeholder="reps" onchange="APP.updateLog('${e.exerciseId}','loggedReps',this.value)"><input type="number" step="0.5" placeholder="kg" onchange="APP.updateLog('${e.exerciseId}','loggedWeight',this.value)"><input type="number" step="0.5" min="1" max="10" placeholder="RPE" onchange="APP.updateLog('${e.exerciseId}','loggedRpe',this.value)"></div></details></div>`).join('')}</article>`}
function updateLog(id,key,value){const e=currentSession.exercises.find(x=>x.exerciseId===id);if(e)e[key]=Number(value)||0}
function completeSession(){
 const difficulty=prompt('Difficulté ressentie 1 à 5 ?','3'); const pain=prompt('Douleur pendant la séance 0 à 5 ?','0');
 currentSession.feedback={difficulty:+difficulty||3,pain:+pain||0}; saveSession(currentSession); alert('Séance enregistrée. Les prochaines charges et choix d’exercices utiliseront cet historique.'); currentSession=null; go('progress');
}
function feedback(){}
function printSession(){window.print()}
function library(){
 const groups=['Tous','haut_du_corps','bas_du_corps','core','cardio','boxe','mobilite','reeducation'];
 const eq=[...new Set(EX.flatMap(e=>e.equipment))].sort();
 const list=EX.filter(e=>(libFilter.group==='Tous'||e.group===libFilter.group)&&(libFilter.equipment==='Tous'||e.equipment.includes(libFilter.equipment))&&(!libFilter.q||e.search.includes(libFilter.q.toLowerCase())));
 return `<section class="page-head"><div><p class="eyebrow">BIBLIOTHÈQUE AVANCÉE</p><h1>${EX.length} mouvements réels</h1><p>Recherche par nom, muscle, matériel, sport, objectif ou variante.</p></div></section><section class="library-tools"><input placeholder="Rechercher…" value="${esc(libFilter.q)}" oninput="APP.filterLibrary('q',this.value)"><select onchange="APP.filterLibrary('group',this.value)">${groups.map(x=>`<option ${x===libFilter.group?'selected':''}>${x}</option>`).join('')}</select><select onchange="APP.filterLibrary('equipment',this.value)"><option>Tous</option>${eq.map(x=>`<option ${x===libFilter.equipment?'selected':''}>${x}</option>`).join('')}</select></section><section class="exercise-grid">${list.map(e=>`<article class="exercise-card"><div class="exercise-card-head"><span>${esc(e.sport)}</span><b>${esc(e.name)}</b></div><p>${esc(e.cues)}</p><small>${esc(e.pattern)} · ${e.muscles.map(esc).join(', ')}</small><div class="tags">${e.equipment.map(x=>`<i>${esc(x)}</i>`).join('')}</div>${e.variants.length?`<details><summary>Variantes</summary><p>${e.variants.map(esc).join(' · ')}</p></details>`:''}<em>Erreur fréquente : ${esc(e.error)}</em></article>`).join('')}</section>`;
}
function filterLibrary(k,v){libFilter[k]=v;render()}
function progress(){
 const m=getActiveMember(),p=progression(m.id),sessions=memberSessions(m.id);
 return `<section class="page-head"><div><p class="eyebrow">PROGRESSION</p><h1>${esc(m.name)}</h1><p>Suivi à partir des séances réellement enregistrées.</p></div></section><section class="metrics">${metric('Séances',p.count,'total')}${metric('30 jours',p.last30,'régularité')}${metric('Volume',p.volume+' kg','si charges saisies')}${metric('PR estimés',p.prs.length,'Epley 1RM')}</section><section class="progress-grid"><article><h3>Records estimés</h3>${p.prs.length?p.prs.map(x=>`<div class="pr-row"><span>${esc(x.name)}</span><b>${x.value} kg</b></div>`).join(''):'<p>Enregistre des poids et répétitions pour faire apparaître les records.</p>'}</article><article><h3>Historique récent</h3>${sessions.slice(0,8).map(s=>`<div class="history-row"><span>${new Date(s.date).toLocaleDateString('fr-FR')}</span><b>${esc(s.goal)} · ${s.duration} min</b><small>readiness ${s.readinessScore}/100</small></div>`).join('')||'<p>Aucune séance enregistrée.</p>'}</article></section>`;
}
function backup(){const blob=new Blob([exportBackup()],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fafatraining-backup.json';a.click();URL.revokeObjectURL(a.href)}
async function restore(file){if(!file)return;try{importBackup(await file.text());alert('Sauvegarde importée');go('home')}catch(e){alert(e.message)}}
boot();
