
const Coach66=(()=>{
const blocks=[
 {id:'warmup',title:'ÉCHAUFFEMENT',icon:'🔥',role:'Préparer le corps sans se cramer.'},
 {id:'main',title:'BLOC PRINCIPAL',icon:'🎯',role:'Travail central de la séance.'},
 {id:'support',title:'RENFORT UTILE',icon:'🛡️',role:'Compléter, protéger, stabiliser.'},
 {id:'finish',title:'FINISHER / RETOUR',icon:'✅',role:'Finir proprement ou récupérer.'}
];

const goals={
 musculation:{label:'Musculation',objective:'Développer force, masse utile et technique propre.',groups:['haut_du_corps','bas_du_corps','core'],badges:['Force','Progression','Technique','Repos']},
 renfo:{label:'Renforcement',objective:'Solidifier le corps, améliorer posture et gainage.',groups:['haut_du_corps','bas_du_corps','core','reeducation'],badges:['Posture','Gainage','Contrôle','Sécurité']},
 full:{label:'Full Body',objective:'Travailler tout le corps avec une séance équilibrée.',groups:['haut_du_corps','bas_du_corps','core','cardio'],badges:['Complet','Énergie','Cardio','Mental']},
 hiit:{label:'HIIT',objective:'Travailler souffle, intensité et dépense énergétique.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['Intensité','Intervalles','Cardio','Chrono']},
 circuit:{label:'Circuit Training',objective:'Enchaîner des ateliers avec tours, temps et repos clairs.',groups:['cardio','haut_du_corps','bas_du_corps','core'],badges:['Tours','Rythme','Renfo','Cardio']},
 boxe:{label:'Boxe',objective:'Développer technique, appuis, cardio et explosivité boxe.',groups:['boxe','cardio','core','haut_du_corps','bas_du_corps'],badges:['Technique','Appuis','Rounds','Mental']},
 crossfit:{label:'CrossFit',objective:'Construire un WOD clair : AMRAP, EMOM, For Time ou Skill.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['WOD','AMRAP','EMOM','Mental']},
 cross:{label:'Cross Training',objective:'Développer endurance, force utile et capacité à enchaîner.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['Terrain','Force','Endurance','Discipline']},
 hyrox:{label:'Hyrox',objective:'Travailler stations, portés, transitions et endurance de force.',groups:['cardio','bas_du_corps','core','haut_du_corps'],badges:['Stations','Course','Carries','Transitions']},
 mobilite:{label:'Mobilité',objective:'Améliorer amplitude, respiration, récupération et souplesse.',groups:['mobilite','reeducation','core'],badges:['Souplesse','Respiration','Amplitude','Calme']},
 prevention:{label:'Prévention',objective:'Protéger les articulations, activer et renforcer sans douleur.',groups:['reeducation','mobilite','core'],badges:['Sécurité','Activation','Contrôle','Récup']},
 explosivite:{label:'Explosivité',objective:'Développer puissance, vitesse, appuis et réactivité.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['Puissance','Vitesse','Appuis','Réactivité']}
};

const styles={
 musculation:[['force','Force','charges + repos'],['hypertrophie','Hypertrophie','volume propre'],['endurance_force','Endurance force','séries longues'],['push_pull','Push/Pull','haut du corps'],['jambes','Jambes','bas du corps']],
 renfo:[['posture','Posture','contrôle'],['core','Core','gainage'],['dos','Dos protecteur','prévention'],['senior','Adapté senior','sécurisé']],
 full:[['equilibre','Équilibré','haut bas core'],['cardio_renfo','Cardio+renfo','alterné'],['force_full','Force complète','charges'],['terrain','Terrain','extérieur']],
 hiit:[['tabata','Tabata','20/10'],['interval','40/20','intervalles'],['brule','Brûle graisse','intense'],['boxing','Cardio boxing','fitness']],
 circuit:[['tours','Tours','3 à 5 tours'],['stations','Stations','ateliers'],['groupe','Groupe','plusieurs'],['cardio','Cardio mix','alternance']],
 boxe:[['pure','Boxe pure','rounds'],['renfo','Boxe + renfo','mix'],['cardio','Boxe cardio','30/30'],['boxing','Cardio boxing','public'],['appuis','Appuis défense','technique']],
 crossfit:[['wod','WOD','lisible'],['amrap','AMRAP','max tours'],['emom','EMOM','chaque minute'],['fortime','For Time','chrono'],['forcewod','Force + WOD','hybride'],['skill','Skill','technique']],
 cross:[['terrain','Terrain','course+renfo'],['endurance','Endurance','long effort'],['force','Force terrain','charges'],['team','Équipe','ateliers']],
 hyrox:[['stations','Stations','course+atelier'],['carries','Carries','portés'],['cardio','Cardio','rameur/course'],['simulation','Simulation','format course']],
 mobilite:[['bas','Bas du corps','hanches jambes'],['haut','Haut du corps','épaules dos'],['colonne','Colonne','dos respiration'],['relax','Relax','calme']],
 prevention:[['epaule','Épaules','coiffe'],['genou','Genoux','contrôle'],['dos','Dos','gainage doux'],['recup','Récupération','auto-massage']],
 explosivite:[['vitesse','Vitesse','appuis'],['puissance','Puissance','sauts lancers'],['reactivite','Réactivité','changements'],['athlete','Athlète','haut niveau']]
};

function formatFor(goal,style){
 const key=style||'';
 if(key==='tabata')return {name:'TABATA',main:'8 rounds',work:'20 sec',rest:'10 sec',reps:'max propre',coach:'garder le rythme sans perdre la technique'};
 if(key==='emom')return {name:'EMOM',main:'12 min',work:'début de chaque minute',rest:'reste de la minute',reps:'6-12 reps',coach:'finir vite pour récupérer'};
 if(key==='amrap')return {name:'AMRAP',main:'14 min',work:'enchaîner les exercices',rest:'si nécessaire',reps:'8-15 reps',coach:'chercher un rythme constant'};
 if(key==='fortime')return {name:'FOR TIME',main:'cap 14 min',work:'finir la liste',rest:'court',reps:'10-20 reps',coach:'rapide mais propre'};
 if(key==='pure'||goal==='boxe')return {name:'ROUNDS',main:'3 à 5 rounds',work:'2-3 min',rest:'1 min',reps:'thème technique',coach:'garde haute et appuis actifs'};
 if(goal==='mobilite')return {name:'MOBILITÉ',main:'2 à 3 tours',work:'45-60 sec',rest:'respiration',reps:'sans douleur',coach:'amplitude douce'};
 if(goal==='prevention')return {name:'PRÉVENTION',main:'2 à 3 séries',work:'10-15 reps',rest:'30-45 sec',reps:'contrôle',coach:'zéro douleur'};
 if(key==='force'||goal==='musculation')return {name:'SÉRIES',main:'3 à 5 séries',work:'8-12 reps',rest:'60-90 sec',reps:'charge adaptée',coach:'qualité avant charge'};
 if(goal==='explosivite')return {name:'PUISSANCE',main:'4 à 6 séries',work:'3-6 reps',rest:'60-90 sec',reps:'explosif propre',coach:'récupération complète'};
 return {name:'CIRCUIT',main:'3 à 5 tours',work:'10-15 reps ou 40 sec',rest:'60 sec / tour',reps:'affichées',coach:'enchaîner proprement'};
}

function split(duration,goal){
 const d=Number(duration||30);
 if(goal==='mobilite'||goal==='prevention'){
  if(d<=20)return {warmup:3,main:10,support:5,finish:2};
  if(d<=30)return {warmup:4,main:15,support:8,finish:3};
  if(d<=45)return {warmup:6,main:22,support:12,finish:5};
  return {warmup:8,main:30,support:16,finish:6};
 }
 if(d<=20)return {warmup:4,main:9,support:5,finish:2};
 if(d<=30)return {warmup:5,main:14,support:7,finish:4};
 if(d<=45)return {warmup:7,main:22,support:10,finish:6};
 return {warmup:8,main:30,support:14,finish:8};
}

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v66_hist')||'[]')}catch(e){return[]}}
function save(ids){localStorage.setItem('fafa_v66_hist',JSON.stringify(ids.slice(-420)))}

function equipmentOk(e,eq){
 if(!eq||!eq.length)return true;
 const q=e.equipment||[];
 if(q.includes('poids du corps'))return true;
 return eq.some(x=>q.includes(x));
}
function allowed(cfg,block){
 if(block==='warmup')return ['mobilite','reeducation','cardio','boxe'];
 if(cfg.goal==='mobilite')return ['mobilite','reeducation'];
 if(cfg.goal==='prevention')return ['reeducation','mobilite','core'];
 if(cfg.goal==='boxe')return block==='main'?['boxe']:['boxe','cardio','core','reeducation'];
 if(block==='support')return ['core','reeducation','haut_du_corps','bas_du_corps'];
 if(block==='finish')return cfg.goal==='mobilite'||cfg.goal==='prevention'?['mobilite','reeducation']:['cardio','boxe','core','bas_du_corps'];
 return goals[cfg.goal]?.groups || goals.full.groups;
}
function score(e,cfg,block,used,h){
 let s=0, g=allowed(cfg,block), obj=e.objectives||[];
 if(g.includes(e.group))s+=35;
 if(used.has(e.id))s-=120;
 if(h.includes(e.id))s-=10;
 if(!equipmentOk(e,cfg.equipment))s-=18;
 if(cfg.injury && (e.contraindications||[]).includes(cfg.injury))s-=120;
 if(cfg.goal==='boxe'&&e.group==='boxe')s+=25;
 if(cfg.goal==='crossfit'&&obj.includes('crossfit'))s+=20;
 if(cfg.goal==='hyrox'&&obj.includes('hyrox'))s+=20;
 if(cfg.goal==='mobilite'&&e.group==='mobilite')s+=20;
 if(cfg.goal==='prevention'&&e.group==='reeducation')s+=20;
 if(cfg.style==='jambes'&&e.group==='bas_du_corps')s+=25;
 if(cfg.style==='push_pull'&&e.group==='haut_du_corps')s+=25;
 if(cfg.style==='core'&&e.group==='core')s+=25;
 if(Number(cfg.age)>60 && ['mobilite','reeducation','core'].includes(e.group))s+=8;
 if(Number(cfg.age)<15 && ['mobilite','reeducation','core'].includes(e.group))s+=5;
 if(Number(cfg.fatigue)>=4 && e.group==='cardio')s-=7;
 if(Number(cfg.stress)>=4 && ['mobilite','reeducation'].includes(e.group))s+=8;
 return s;
}
function count(block,duration,goal){
 const d=Number(duration||30);
 if(block==='warmup')return d<=20?2:3;
 if(block==='main')return d<=20?3:5;
 if(block==='support')return d<=20?2:3;
 if(block==='finish')return goal==='mobilite'||goal==='prevention'?1:2;
 return 2;
}
function pick(exs,cfg,block,used,h){
 const n=count(block,cfg.duration,cfg.goal);
 let list=shuffle(exs).map(e=>({e,s:score(e,cfg,block,used,h)})).filter(x=>x.s>-35).sort((a,b)=>b.s-a.s).map(x=>x.e);
 if(list.length<n)list=shuffle(exs).filter(e=>!used.has(e.id));
 const out=list.slice(0,n);out.forEach(e=>used.add(e.id));return out.map((e,i)=>adapt(e,cfg,block,i));
}
function prescription(e,cfg,block,i){
 const f=formatFor(cfg.goal,cfg.style);
 if(block==='warmup')return '30-45 sec propre';
 if(block==='main'){
  if(f.name==='AMRAP')return i%2?'12 reps':'10 reps';
  if(f.name==='EMOM')return '6-12 reps / minute';
  if(f.name==='TABATA')return '20 sec travail';
  if(f.name==='FOR TIME')return i%2?'15 reps':'10 reps';
  if(f.name==='ROUNDS')return 'round 2-3 min';
  if(f.name==='SÉRIES')return '3-5 séries x 8-12 reps';
  if(f.name==='PUISSANCE')return '3-6 reps explosives';
  if(f.name==='MOBILITÉ')return '45-60 sec';
  if(f.name==='PRÉVENTION')return '10-15 reps contrôlées';
  return '10-15 reps ou 40 sec';
 }
 if(block==='support')return '2-3 séries · contrôle';
 return f.name==='ROUNDS'?'30/30 sec':'30-45 sec';
}
function charge(e,cfg){
 const q=(e.equipment||[]).join(' ');
 if(q.match(/barre|haltères|kettlebell|machine|poulie/)){
  if(cfg.level==='debutant'||cfg.level==='choisir')return 'charge légère à modérée';
  if(cfg.level==='intermediaire')return 'RPE 7 · 2 reps en réserve';
  if(cfg.level==='avance')return 'RPE 8 · technique stricte';
  return 'RPE 8-9 · uniquement si maîtrisé';
 }
 return 'poids du corps / contrôle';
}
function adapt(e,cfg,block,i){
 const lvl=cfg.level==='choisir'?'intermediaire':cfg.level;
 return {...e,displayName:e.name,instruction:e.levels?.[lvl]||e.levels?.intermediaire||e.name,prescription:prescription(e,cfg,block,i),charge:charge(e,cfg)};
}
function blockInfo(cfg,block,items){
 const t=split(cfg.duration,cfg.goal), f=formatFor(cfg.goal,cfg.style), mins=t[block];
 if(block==='warmup')return {minutes:mins,format:'Activation',structure:`${mins} min`,work:'30-45 sec par exercice',rest:'enchaîner propre',reps:'amplitude + respiration',coach:'préparer sans fatigue'};
 if(block==='support')return {minutes:mins,format:'Renfort utile',structure:`${mins} min`,work:`${items.length} exercices`,rest:'30-45 sec',reps:'contrôle + posture',coach:'renforcer les points faibles'};
 if(block==='finish')return {minutes:mins,format:cfg.goal==='mobilite'||cfg.goal==='prevention'?'Retour au calme':'Finisher',structure:`${mins} min`,work:'court et propre',rest:'adapté',reps:'finir sans casser la technique',coach:f.coach};
 return {minutes:mins,format:f.name,structure:f.name==='AMRAP'?`AMRAP ${mins} min`:f.name==='EMOM'?`EMOM ${mins} min`:f.name==='FOR TIME'?`For Time ${mins} min`:f.name==='TABATA'?'8 rounds':f.main,work:f.work,rest:f.rest,reps:f.reps,coach:f.coach};
}
function adaptMessage(cfg){
 let msg=[];
 if(Number(cfg.age)>60)msg.push('profil senior : amplitude, contrôle et récup augmentée');
 if(Number(cfg.age)<15 && cfg.age)msg.push('profil ado : technique, sécurité et intensité progressive');
 if(Number(cfg.fatigue)>=4)msg.push('fatigue élevée : volume cardio réduit');
 if(Number(cfg.stress)>=4)msg.push('stress élevé : respiration et mobilité favorisées');
 if(cfg.injury)msg.push(`zone à protéger : ${cfg.injury}`);
 return msg.length?msg.join(' · '):'profil standard : progression propre et séance équilibrée';
}
function generate(raw,exs){
 const cfg={goal:'full',style:'equilibre',level:'intermediaire',duration:30,equipment:['poids du corps'],age:'',people:1,fatigue:3,stress:3,injury:'',place:'',experience:'',...raw};
 const used=new Set(), h=hist(), g=goals[cfg.goal]||goals.full;
 const session={title:g.label,objective:g.objective,adaptation:adaptMessage(cfg),theme:g,meta:{...cfg,equipment:(cfg.equipment||[]).join(', ')},blocks:{},infos:{}};
 blocks.forEach(b=>{session.blocks[b.id]=pick(exs,cfg,b.id,used,h);session.infos[b.id]=blockInfo(cfg,b.id,session.blocks[b.id])});
 save([...h,...Object.values(session.blocks).flat().map(e=>e.id)]);
 return session;
}
return {blocks,goals,styles,generate,formatFor};
})();
