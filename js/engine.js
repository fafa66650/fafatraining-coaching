
const FafaEngine=(()=>{
const blocks=[
 {id:'activation',title:'1. ENTRÉE',role:'Préparer le corps, la respiration et les articulations.'},
 {id:'main',title:'2. PLAT',role:'Bloc principal : objectif de la séance.'},
 {id:'assistance',title:'3. ACCOMPAGNEMENT',role:'Renforcement utile, posture et sécurité.'},
 {id:'finisher',title:'4. DESSERT',role:'Finisher, retour au calme ou récupération selon objectif.'}
];
const configs={
 musculation:{label:'MUSCULATION',objective:'Force, hypertrophie et progression avec charges adaptées.',groups:['haut_du_corps','bas_du_corps','core'],badges:['💪 Force','🎯 Progression','🧠 Contrôle','⏱ Tempo']},
 renfo:{label:'RENFORCEMENT',objective:'Tonus, gainage, posture et corps solide.',groups:['haut_du_corps','bas_du_corps','core','reeducation'],badges:['🛡 Posture','💪 Tonus','🧠 Contrôle','⚡ Énergie']},
 full:{label:'FULL BODY',objective:'Séance complète haut, bas, core et cardio.',groups:['haut_du_corps','bas_du_corps','core','cardio'],badges:['⚡ Complet','💪 Force','🏃 Cardio','🧠 Mental']},
 hiit:{label:'HIIT',objective:'Intervalles intenses, souffle et dépense énergétique.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['🔥 Intensité','⏱ Intervalles','🏃 Cardio','⚡ Explosif']},
 circuit:{label:'CIRCUIT TRAINING',objective:'Tours clairs, rythme, ateliers et alternance musculaire.',groups:['cardio','haut_du_corps','bas_du_corps','core'],badges:['🔁 Tours','💪 Renfo','🏃 Cardio','🎯 Rythme']},
 boxe:{label:'BOXE',objective:'Technique, appuis, rounds, cardio et explosivité boxe.',groups:['boxe','cardio','core','haut_du_corps','bas_du_corps'],badges:['🥊 Technique','🦶 Appuis','🏃 Cardio','🧠 Mental']},
 crossfit:{label:'CROSSFIT',objective:'WOD structuré : AMRAP, EMOM, For Time, Skill ou Force + WOD.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['🏋 WOD','🔥 AMRAP','⏱ EMOM','🧠 Mental']},
 cross:{label:'CROSS TRAINING',objective:'Terrain, force utile, endurance et capacité à enchaîner.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['🏃 Terrain','💪 Force','🔥 Endurance','🎯 Discipline']},
 hyrox:{label:'HYROX',objective:'Stations, carries, course, transitions et endurance de force.',groups:['cardio','bas_du_corps','core','haut_du_corps'],badges:['🏁 Stations','🏃 Course','🎒 Carries','🧠 Mental']},
 mobilite:{label:'MOBILITÉ',objective:'Souplesse, amplitude, respiration et récupération.',groups:['mobilite','reeducation','core'],badges:['🧘 Souplesse','🌬 Respiration','🛡 Prévention','🧠 Calme']},
 prevention:{label:'PRÉVENTION',objective:'Activer, protéger, renforcer sans douleur et récupérer.',groups:['reeducation','mobilite','core'],badges:['🧩 Activation','🛡 Sécurité','🧠 Contrôle','🌬 Respiration']},
 explosivite:{label:'EXPLOSIVITÉ',objective:'Puissance, vitesse, appuis et réactivité.',groups:['cardio','bas_du_corps','haut_du_corps','core'],badges:['💥 Puissance','⚡ Vitesse','🎯 Réactivité','🧠 Mental']}
};
const styles={
 musculation:[['force_pure','Force pure','3-5 séries','series_force'],['hypertrophie','Hypertrophie','8-12 reps','series'],['endurance_force','Endurance force','15-20 reps','series_endurance'],['push_pull','Push/Pull','haut du corps','series'],['jambes','Jambes','bas du corps','series']],
 renfo:[['posture','Posture','contrôle','prehab'],['core','Core','gainage','core'],['dos_protecteur','Dos','protection','prehab'],['senior_safe','Senior safe','sécurisé','prehab']],
 full:[['equilibre','Équilibré','haut/bas/core','circuit'],['cardio_renfo','Cardio+renfo','alterné','interval'],['force_complete','Force complète','charges','series'],['terrain','Terrain','extérieur','circuit']],
 hiit:[['tabata','Tabata','20/10','tabata'],['interval_40_20','40/20','intervalles','interval'],['brule_graisse','Brûle graisse','intense','hiit'],['cardio_boxing','Cardio boxing','boxe fitness','round']],
 circuit:[['tours','Tours','3-5 tours','circuit'],['stations','Stations','ateliers','stations'],['groupe','Groupe','plusieurs','stations'],['cardio_mix','Cardio mix','alternance','interval']],
 boxe:[['boxe_pure','Boxe pure','3 min','round'],['boxe_renfo','Boxe+renfo','hybride','hybrid'],['boxe_cardio','Boxe cardio','30/30','interval'],['cardio_boxing','Cardio boxing','public','round'],['appuis_defense','Appuis','défense','skill']],
 crossfit:[['wod','WOD','lisible','wod'],['amrap','AMRAP','max tours','amrap'],['emom','EMOM','chaque minute','emom'],['for_time','For Time','chrono','fortime'],['force_wod','Force+WOD','charge+cardio','hybrid'],['skill','Skill','technique','skill']],
 cross:[['terrain','Terrain','course+renfo','circuit'],['endurance','Endurance','long effort','interval'],['force_terrain','Force terrain','charges','circuit'],['team','Équipe','ateliers','stations']],
 hyrox:[['stations','Stations','course+atelier','stations'],['carries','Carries','portés','circuit'],['cardio','Cardio','rameur/course','interval'],['simulation','Simulation','format course','stations']],
 mobilite:[['bas','Bas du corps','hanches/jambes','mobility'],['haut','Haut du corps','épaules/dos','mobility'],['colonne','Colonne','dos/respiration','mobility'],['relax','Relax','calme','breath']],
 prevention:[['epaule','Épaules','coiffe','prehab'],['genou','Genoux','contrôle','prehab'],['dos','Dos','gainage doux','prehab'],['recup','Récup','auto-massage','recovery']],
 explosivite:[['vitesse','Vitesse','appuis','agility'],['puissance','Puissance','sauts/lancers','power'],['reactivite','Réactivité','changements','agility'],['athlete','Athlète','haut niveau','power']]
};
const profiles={
 tabata:{format:'TABATA',rounds:'8 rounds',work:'20 sec',rest:'10 sec',reps:'max propre',intensity:'haute'},
 interval:{format:'INTERVAL',rounds:'8 à 12 séries',work:'40 sec',rest:'20 sec',reps:'rythme soutenu',intensity:'haute'},
 hiit:{format:'HIIT',rounds:'3 à 4 tours',work:'35-45 sec',rest:'15-25 sec',reps:'propre + rapide',intensity:'haute'},
 amrap:{format:'AMRAP',rounds:'12 à 18 min',work:'enchaîner',rest:'si besoin',reps:'8-15 reps',intensity:'contrôlée'},
 emom:{format:'EMOM',rounds:'10 à 16 min',work:'début de minute',rest:'reste de minute',reps:'6-12 reps',intensity:'technique'},
 fortime:{format:'FOR TIME',rounds:'cap temps',work:'finir la liste',rest:'court',reps:'10-20 reps',intensity:'haute propre'},
 wod:{format:'WOD',rounds:'AMRAP ou For Time',work:'bloc structuré',rest:'court',reps:'reps affichées',intensity:'progressive'},
 hybrid:{format:'HYBRIDE',rounds:'force + cardio',work:'séries puis circuit',rest:'60-90 sec puis court',reps:'5-12 reps',intensity:'mixte'},
 round:{format:'ROUNDS',rounds:'3 à 5 rounds',work:'2-3 min',rest:'1 min',reps:'combo / thème',intensity:'technique'},
 skill:{format:'SKILL',rounds:'qualité technique',work:'5-8 reps',rest:'45-60 sec',reps:'contrôle',intensity:'modérée'},
 circuit:{format:'CIRCUIT',rounds:'3 à 5 tours',work:'10-15 reps ou 40 sec',rest:'60 sec/tour',reps:'affichées',intensity:'modérée+'},
 stations:{format:'STATIONS',rounds:'4 à 6 stations',work:'2-4 min/station',rest:'1 min transition',reps:'distance ou temps',intensity:'endurance'},
 series:{format:'SÉRIES',rounds:'3 à 5 séries',work:'8-12 reps',rest:'60-90 sec',reps:'charge adaptée',intensity:'progressive'},
 series_force:{format:'FORCE',rounds:'4 à 6 séries',work:'3-6 reps',rest:'90-150 sec',reps:'lourd propre',intensity:'haute qualité'},
 series_endurance:{format:'ENDURANCE FORCE',rounds:'3 à 4 séries',work:'15-20 reps',rest:'45-60 sec',reps:'contrôle',intensity:'moyenne'},
 mobility:{format:'MOBILITÉ',rounds:'2 à 3 tours',work:'45-60 sec',rest:'respiration',reps:'aucune douleur',intensity:'douce'},
 prehab:{format:'PRÉVENTION',rounds:'2 à 3 séries',work:'10-15 reps',rest:'30-45 sec',reps:'contrôle',intensity:'douce'},
 recovery:{format:'RÉCUP',rounds:'routine',work:'45-90 sec',rest:'respiration',reps:'pression douce',intensity:'douce'},
 breath:{format:'RESPIRATION',rounds:'routine calme',work:'2-5 min',rest:'libre',reps:'respiration lente',intensity:'très douce'},
 power:{format:'PUISSANCE',rounds:'4 à 6 séries',work:'3-6 reps',rest:'60-90 sec',reps:'explosif propre',intensity:'haute qualité'},
 agility:{format:'RÉACTIVITÉ',rounds:'6 à 10 séquences',work:'10-20 sec',rest:'40-60 sec',reps:'vitesse propre',intensity:'nerveuse'},
 core:{format:'CORE',rounds:'3 à 4 séries',work:'30-45 sec',rest:'30 sec',reps:'gainage propre',intensity:'contrôle'}
};
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v65_hist')||'[]')}catch(e){return[]}}
function save(ids){localStorage.setItem('fafa_v65_hist',JSON.stringify(ids.slice(-360)))}
function styleType(cfg){let a=styles[cfg.goal]||styles.full;return (a.find(x=>x[0]===cfg.style)||a[0])[3]}
function profile(cfg){return profiles[styleType(cfg)]||profiles.circuit}
function equipmentOk(e,eq){if(!eq||!eq.length)return true;let q=e.equipment||[];if(q.includes('poids du corps'))return true;if(eq.includes('machines')&&q.includes('machine'))return true;return eq.some(x=>q.includes(x))}
function safe(e,inj){return !inj||!(e.contraindications||[]).includes(inj)}
function allowedGroups(cfg,block){
 if(block==='activation')return ['mobilite','reeducation','cardio','boxe'];
 if(cfg.goal==='mobilite')return ['mobilite','reeducation'];
 if(cfg.goal==='prevention')return ['reeducation','mobilite','core'];
 if(cfg.goal==='boxe')return block==='main'?['boxe']:['boxe','cardio','core','reeducation','haut_du_corps','bas_du_corps'];
 return (configs[cfg.goal]||configs.full).groups;
}
function score(e,cfg,block,used,h){
 let s=0,g=allowedGroups(cfg,block),obj=e.objectives||[];
 if(g.includes(e.group))s+=30;
 if(used.has(e.id))s-=100;
 if(h.includes(e.id))s-=10;
 if(!safe(e,cfg.injury))s-=100;
 if(!equipmentOk(e,cfg.equipment))s-=14;
 if(cfg.goal==='boxe'&&e.group==='boxe')s+=25;
 if(cfg.goal==='crossfit'&&obj.includes('crossfit'))s+=18;
 if(cfg.goal==='hyrox'&&obj.includes('hyrox'))s+=18;
 if(cfg.goal==='mobilite'&&e.group==='mobilite')s+=20;
 if(cfg.goal==='prevention'&&e.group==='reeducation')s+=20;
 if(cfg.style?.includes('core')&&e.group==='core')s+=20;
 if(cfg.style?.includes('jambes')&&e.group==='bas_du_corps')s+=20;
 if(cfg.style?.includes('haut')&&e.group==='haut_du_corps')s+=20;
 if(+cfg.age>65&&['mobilite','reeducation'].includes(e.group))s+=8;
 if(+cfg.age<15&&['mobilite','reeducation','core'].includes(e.group))s+=4;
 if(+cfg.fatigue>=4&&e.group==='cardio')s-=5;
 if(+cfg.stress>=4&&['mobilite','reeducation'].includes(e.group))s+=6;
 return s;
}
function duration(cfg){
 let d=+cfg.duration||30;
 if(cfg.goal==='mobilite'||cfg.goal==='prevention'){
  if(d<=20)return{activation:3,main:10,assistance:5,finisher:2};
  if(d<=30)return{activation:4,main:15,assistance:8,finisher:3};
  if(d<=45)return{activation:6,main:22,assistance:12,finisher:5};
  return{activation:8,main:30,assistance:16,finisher:6};
 }
 if(d<=20)return{activation:4,main:9,assistance:5,finisher:2};
 if(d<=30)return{activation:5,main:14,assistance:7,finisher:4};
 if(d<=45)return{activation:7,main:22,assistance:10,finisher:6};
 return{activation:8,main:30,assistance:14,finisher:8};
}
function count(cfg,block){
 let d=+cfg.duration||30;
 if(block==='activation')return d<=20?2:3;
 if(block==='main')return d<=20?3:5;
 if(block==='assistance')return d<=20?2:3;
 if(block==='finisher')return cfg.goal==='mobilite'||cfg.goal==='prevention'?1:2;
 return 2;
}
function pick(exs,cfg,block,used,h){
 let n=count(cfg,block), list=shuffle(exs).map(e=>({e,s:score(e,cfg,block,used,h)})).filter(x=>x.s>-40).sort((a,b)=>b.s-a.s).map(x=>x.e);
 if(list.length<n)list=shuffle(exs).filter(e=>!used.has(e.id)&&safe(e,cfg.injury));
 let out=list.slice(0,n);out.forEach(e=>used.add(e.id));return out.map((e,i)=>adapt(e,cfg,block,i));
}
function adapt(e,cfg,block,i){let lvl=cfg.level==='choisir'?'intermediaire':cfg.level;return{...e,displayName:e.name,instruction:e.levels?.[lvl]||e.levels?.intermediaire||e.name,prescription:prescription(e,cfg,block,i),charge:charge(e,cfg)}}
function prescription(e,cfg,block,i){let st=styleType(cfg),p=profile(cfg);if(block==='activation')return '30-45 sec technique';if(st==='tabata')return '20 sec travail / 10 sec repos';if(st==='emom')return '6-12 reps au début de minute';if(st==='amrap')return i%2?'12 reps':'10 reps';if(st==='fortime')return i%2?'15 reps':'10 reps';if(st==='round')return block==='main'?'round 2-3 min':'30-45 sec';if(st==='power'||st==='agility')return '3-6 reps explosives';if(['mobility','prehab','recovery','breath'].includes(st))return p.work;if(st==='series_force')return '4-6 séries x 3-6 reps';if(st==='series')return block==='main'?'3-5 séries x 8-12 reps':'2-3 séries x 10-15 reps';if(st==='series_endurance')return '3-4 séries x 15-20 reps';if(st==='stations')return '2-4 min / station';return block==='main'?'10-15 reps ou 40 sec':'30-45 sec'}
function charge(e,cfg){let q=(e.equipment||[]).join(' '),lvl=cfg.level;if(q.match(/barre|haltères|kettlebell|machine|poulie/)){if(cfg.goal==='musculation'){if(lvl==='debutant')return 'charge légère · technique';if(lvl==='intermediaire'||lvl==='choisir')return 'charge modérée · RPE 7';if(lvl==='avance')return 'charge lourde contrôlée · RPE 8';return 'charge lourde maîtrisée · RPE 8-9'}return 'charge contrôlable'}return 'poids du corps / contrôle'}
function info(cfg,block,items){let m=duration(cfg)[block],p=profile(cfg);if(block==='activation')return{minutes:m,format:'Activation',rounds:`${m} min`,work:'30-45 sec par exercice',rest:'enchaîner propre',reps:'amplitude + respiration',intensity:'progressive'};if(block==='assistance')return{minutes:m,format:'Renforcement utile',rounds:`${m} min`,work:`${items.length} exercices`,rest:'30-45 sec',reps:'contrôle + posture',intensity:'contrôle'};if(block==='finisher')return{minutes:m,format:cfg.goal==='mobilite'||cfg.goal==='prevention'?'Retour au calme':'Finisher',rounds:`${m} min`,work:p.format==='ROUNDS'?'30/30':'enchaînement court',rest:'adapté',reps:'finir propre',intensity:p.intensity};let rounds=p.rounds;if(p.format==='AMRAP')rounds=`AMRAP ${m} min`;if(p.format==='EMOM')rounds=`EMOM ${m} min`;if(p.format==='FOR TIME')rounds=`For Time ${m} min`;if(p.format==='TABATA')rounds='8 rounds';if(p.format==='ROUNDS')rounds=cfg.level==='expert'?'5 rounds x 3 min':'3 rounds x 2-3 min';return{minutes:m,format:p.format,rounds,work:p.work,rest:p.rest,reps:p.reps,intensity:p.intensity}}
function generate(cfg,exs){cfg={goal:'full',style:'equilibre',level:'intermediaire',duration:30,equipment:['poids du corps'],age:'',people:1,fatigue:3,stress:3,injury:'',place:'',...cfg};let used=new Set(),h=hist(),conf=configs[cfg.goal]||configs.full,s={title:conf.label,objective:conf.objective,theme:conf,style:cfg.style,meta:{...cfg,equipment:(cfg.equipment||[]).join(', ')},blocks:{},infos:{}};blocks.forEach(b=>{s.blocks[b.id]=pick(exs,cfg,b.id,used,h);s.infos[b.id]=info(cfg,b.id,s.blocks[b.id])});save([...h,...Object.values(s.blocks).flat().map(e=>e.id)]);return s}
return{blocks,configs,styles,generate,profile};
})();
