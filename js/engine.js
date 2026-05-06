
const V64Engine=(()=>{
const blocks=[
  {id:'activation',title:'1. ENTRÉE',role:'Préparer le corps et installer la technique.'},
  {id:'main',title:'2. PLAT',role:'Cœur de séance : objectif principal.'},
  {id:'assistance',title:'3. ACCOMPAGNEMENT',role:'Renforcer, corriger, stabiliser.'},
  {id:'finisher',title:'4. FINISHER',role:'Finir propre, intense ou récupérer selon objectif.'}
];

const goalConfig={
 musculation:{label:'MUSCULATION',badges:['💪 Force','🎯 Progression','🧠 Contrôle','⏱ Discipline'],groups:['haut_du_corps','bas_du_corps','core'],objective:'Développer force, masse utile et contrôle technique avec une progression claire.'},
 renfo:{label:'RENFORCEMENT',badges:['🛡 Posture','💪 Tonus','🧠 Contrôle','⚡ Énergie'],groups:['haut_du_corps','bas_du_corps','core','reeducation'],objective:'Renforcer le corps, améliorer la posture et sécuriser les mouvements.'},
 full:{label:'FULL BODY',badges:['⚡ Complet','💪 Force','🏃 Cardio','🧠 Mental'],groups:['haut_du_corps','bas_du_corps','core','cardio'],objective:'Créer une séance complète haut, bas, core et cardio.'},
 hiit:{label:'HIIT',badges:['🔥 HIIT','⏱ Intervalles','🏃 Cardio','⚡ Intensité'],groups:['cardio','bas_du_corps','haut_du_corps','core'],objective:'Travailler le souffle et l’intensité avec des intervalles simples.'},
 circuit:{label:'CIRCUIT TRAINING',badges:['🔁 Tours','💪 Renfo','🏃 Cardio','🎯 Rythme'],groups:['haut_du_corps','bas_du_corps','core','cardio'],objective:'Enchaîner plusieurs ateliers avec tours, repos et consignes claires.'},
 boxe:{label:'BOXE',badges:['🥊 Technique','🦶 Appuis','🏃 Cardio','🧠 Mental'],groups:['boxe','core','cardio','haut_du_corps','bas_du_corps'],objective:'Améliorer technique, appuis, rythme, cardio et condition physique boxe.'},
 crossfit:{label:'CROSSFIT',badges:['🏋 WOD','🔥 AMRAP','⏱ EMOM','🧠 Mental'],groups:['cardio','bas_du_corps','haut_du_corps','core'],objective:'Créer un WOD lisible, chronométré, intense et maîtrisé.'},
 cross:{label:'CROSS TRAINING',badges:['🏃 Terrain','💪 Force','🔥 Endurance','🎯 Discipline'],groups:['cardio','bas_du_corps','haut_du_corps','core'],objective:'Développer endurance, force utile, mental et capacité à enchaîner.'},
 hyrox:{label:'HYROX',badges:['🏁 Stations','🏃 Course','🎒 Carries','🧠 Mental'],groups:['cardio','bas_du_corps','core','haut_du_corps'],objective:'Préparer stations, course, transitions et endurance de force.'},
 mobilite:{label:'MOBILITÉ',badges:['🧘 Souplesse','🌬 Respiration','🛡 Prévention','🧠 Calme'],groups:['mobilite','reeducation','core'],objective:'Améliorer amplitude, respiration, mobilité articulaire et récupération.'},
 prevention:{label:'PRÉVENTION',badges:['🧩 Activation','🛡 Sécurité','🧠 Contrôle','🌬 Respiration'],groups:['reeducation','mobilite','core'],objective:'Protéger les zones fragiles, activer proprement et éviter les douleurs.'},
 explosivite:{label:'EXPLOSIVITÉ',badges:['💥 Puissance','⚡ Vitesse','🎯 Réactivité','🧠 Mental'],groups:['cardio','bas_du_corps','haut_du_corps','core'],objective:'Développer vitesse, puissance, appuis et réactivité.'}
};

const styleMap={
 musculation:[
  ['force_pure','Force pure','3-5 séries','force'],
  ['hypertrophie','Hypertrophie','8-12 reps','series'],
  ['endurance_force','Endurance force','15-20 reps','circuit'],
  ['push_pull','Push / Pull','haut du corps','series'],
  ['jambes','Jambes','bas du corps','series']
 ],
 renfo:[
  ['posture','Posture','contrôle','series'],
  ['core','Core','gainage','circuit'],
  ['dos_protecteur','Dos protecteur','prévention','series'],
  ['senior_safe','Adapté senior','sécurisé','series']
 ],
 full:[
  ['equilibre','Équilibré','haut bas core','circuit'],
  ['cardio_renfo','Cardio + renfo','alterné','circuit'],
  ['force_complete','Force complète','charges','series'],
  ['terrain','Terrain','extérieur','circuit']
 ],
 hiit:[
  ['tabata','Tabata','20/10','tabata'],
  ['interval_40_20','40/20','intervalles','interval'],
  ['brule_graisse','Brûle graisse','intense','hiit'],
  ['cardio_boxing','Cardio boxing','boxe fitness','round']
 ],
 circuit:[
  ['tours','Tours','3 à 5 tours','circuit'],
  ['stations','Stations','ateliers','circuit'],
  ['groupe','Groupe','plusieurs personnes','circuit'],
  ['cardio_mix','Cardio mix','alternance','interval']
 ],
 boxe:[
  ['boxe_pure','Boxe pure','rounds 3 min','round'],
  ['boxe_renfo','Boxe + renfo','technique + force','hybrid'],
  ['boxe_cardio','Boxe cardio','30/30','interval'],
  ['cardio_boxing','Cardio boxing','tout public','round'],
  ['appuis_defense','Appuis défense','technique','skill']
 ],
 crossfit:[
  ['wod','WOD','lisible','wod'],
  ['amrap','AMRAP','max tours','amrap'],
  ['emom','EMOM','chaque minute','emom'],
  ['for_time','For Time','chrono','fortime'],
  ['force_wod','Force + WOD','charge + cardio','hybrid'],
  ['skill','Skill','technique','skill']
 ],
 cross:[
  ['terrain','Terrain','course + renfo','circuit'],
  ['endurance','Endurance','long effort','interval'],
  ['force_terrain','Force terrain','charges','circuit'],
  ['team','Équipe','plusieurs personnes','stations']
 ],
 hyrox:[
  ['stations','Stations','course + atelier','stations'],
  ['carries','Carries','portés','circuit'],
  ['cardio','Cardio','rameur/course','interval'],
  ['simulation','Simulation','format course','stations']
 ],
 mobilite:[
  ['bas','Bas du corps','hanches/jambes','mobility'],
  ['haut','Haut du corps','épaules/dos','mobility'],
  ['colonne','Colonne','dos/respiration','mobility'],
  ['relax','Relax','calme','breath']
 ],
 prevention:[
  ['epaule','Épaules','coiffe/posture','prehab'],
  ['genou','Genoux','contrôle','prehab'],
  ['dos','Dos','gainage doux','prehab'],
  ['recup','Récupération','auto-massage','recovery']
 ],
 explosivite:[
  ['vitesse','Vitesse','appuis','power'],
  ['puissance','Puissance','sauts/lancers','power'],
  ['reactivite','Réactivité','changements','agility'],
  ['athlete','Athlète','haut niveau','power']
 ]
};

const styleProfiles={
 tabata:{format:'TABATA',main:'8 rounds',work:'20 sec',rest:'10 sec',reps:'max propre',intensity:'élevée'},
 interval:{format:'INTERVAL',main:'8 à 12 séries',work:'40 sec',rest:'20 sec',reps:'rythme soutenu',intensity:'élevée'},
 hiit:{format:'HIIT',main:'3 à 4 tours',work:'35-45 sec',rest:'15-25 sec',reps:'qualité + souffle',intensity:'élevée'},
 amrap:{format:'AMRAP',main:'12 à 18 min',work:'enchaîner',rest:'si besoin',reps:'8-15 reps',intensity:'contrôlée'},
 emom:{format:'EMOM',main:'10 à 16 min',work:'début de chaque minute',rest:'reste de la minute',reps:'6-12 reps',intensity:'technique'},
 fortime:{format:'FOR TIME',main:'cap temps',work:'finir la liste',rest:'court',reps:'10-20 reps',intensity:'haute mais propre'},
 wod:{format:'WOD',main:'AMRAP / For Time',work:'selon bloc',rest:'repos court',reps:'reps affichées',intensity:'progressive'},
 hybrid:{format:'HYBRIDE',main:'force + cardio',work:'séries puis circuit',rest:'60-90 sec puis court',reps:'5-12 reps',intensity:'mixte'},
 round:{format:'ROUNDS',main:'rounds boxe',work:'2-3 min',rest:'1 min',reps:'combo / thème',intensity:'technique'},
 skill:{format:'SKILL',main:'qualité technique',work:'5-8 reps',rest:'45-60 sec',reps:'contrôle',intensity:'modérée'},
 circuit:{format:'CIRCUIT',main:'3 à 5 tours',work:'10-15 reps ou 40 sec',rest:'60 sec/tour',reps:'affichées',intensity:'modérée +'},
 series:{format:'SÉRIES',main:'3 à 5 séries',work:'8-12 reps',rest:'60-90 sec',reps:'affichées',intensity:'progressive'},
 stations:{format:'STATIONS',main:'4 à 6 stations',work:'2-4 min/station',rest:'1 min transition',reps:'distance ou temps',intensity:'endurance'},
 mobility:{format:'MOBILITÉ',main:'2 à 3 tours',work:'45-60 sec',rest:'respiration',reps:'aucune douleur',intensity:'douce'},
 prehab:{format:'PRÉVENTION',main:'2 à 3 séries',work:'10-15 reps',rest:'30-45 sec',reps:'contrôle',intensity:'douce'},
 recovery:{format:'RÉCUP',main:'routine',work:'45-90 sec',rest:'respiration',reps:'pression douce',intensity:'douce'},
 breath:{format:'RESPIRATION',main:'routine calme',work:'2-5 min',rest:'libre',reps:'respiration lente',intensity:'très douce'},
 power:{format:'PUISSANCE',main:'4 à 6 séries',work:'3-6 reps',rest:'60-90 sec',reps:'explosif propre',intensity:'haute qualité'},
 agility:{format:'RÉACTIVITÉ',main:'6 à 10 séquences',work:'10-20 sec',rest:'40-60 sec',reps:'vitesse propre',intensity:'nerveuse'}
};

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function history(){try{return JSON.parse(localStorage.getItem('fafa_v64_hist')||'[]')}catch(e){return[]}}
function saveHistory(ids){localStorage.setItem('fafa_v64_hist',JSON.stringify(ids.slice(-320)))}
function safeInjury(e,inj){return !inj || !(e.contraindications||[]).includes(inj)}
function equipmentOk(e,equip){
 if(!equip || !equip.length) return true;
 let q=e.equipment||[];
 if(q.includes('poids du corps')) return true;
 if(equip.includes('machines') && q.includes('machine')) return true;
 return equip.some(x=>q.includes(x));
}
function ageOk(e,age){
 age=Number(age||0);
 if(!age) return 0;
 let s=0;
 if(age<14 && ['cardio','strength'].includes(e.type)) s-=3;
 if(age>65 && ['cardio'].includes(e.type)) s-=2;
 if(age>65 && (e.objectives||[]).includes('prevention')) s+=4;
 return s;
}
function score(e,cfg,block,used,hist){
 let conf=goalConfig[cfg.goal]||goalConfig.full;
 let s=0;
 if((conf.groups||[]).includes(e.group)) s+=30;
 if(used.has(e.id)) s-=100;
 if(hist.includes(e.id)) s-=8;
 if(!safeInjury(e,cfg.injury)) s-=100;
 if(!equipmentOk(e,cfg.equipment)) s-=18;
 s += ageOk(e,cfg.age);
 let obj=e.objectives||[];
 if(cfg.goal==='boxe' && e.group==='boxe') s+=25;
 if(cfg.goal==='mobilite' && e.group==='mobilite') s+=30;
 if(cfg.goal==='prevention' && e.group==='reeducation') s+=30;
 if(cfg.goal==='crossfit' && obj.includes('crossfit')) s+=18;
 if(cfg.goal==='hyrox' && obj.includes('hyrox')) s+=18;
 if(cfg.goal==='explosivite' && (obj.includes('explosivite')||e.pattern==='Plyo'||e.pattern==='Vitesse')) s+=18;
 if(cfg.style && String(cfg.style).includes('boxe') && e.group==='boxe') s+=15;
 if(cfg.style && String(cfg.style).includes('core') && e.group==='core') s+=12;
 if(block==='activation' && ['mobilite','reeducation'].includes(e.group)) s+=18;
 if(block==='main' && ['haut_du_corps','bas_du_corps','cardio','boxe'].includes(e.group)) s+=10;
 if(block==='assistance' && ['core','reeducation'].includes(e.group)) s+=12;
 if(block==='finisher' && ['cardio','boxe','mobilite'].includes(e.group)) s+=10;
 if(Number(cfg.fatigue)>=4 && ['cardio'].includes(e.group)) s-=6;
 if(Number(cfg.stress)>=4 && ['mobilite','reeducation'].includes(e.group)) s+=8;
 return s;
}
function choosePool(cfg,block){
 const g=cfg.goal;
 if(block==='activation') return ['mobilite','reeducation','cardio','boxe'];
 if(g==='mobilite') return ['mobilite','reeducation'];
 if(g==='prevention') return ['reeducation','mobilite','core'];
 if(g==='boxe') return block==='main'?['boxe']: block==='finisher'?['boxe','cardio']:['boxe','core','cardio','reeducation'];
 if(g==='crossfit') return block==='activation'?['mobilite','cardio']: block==='main'?['cardio','bas_du_corps','haut_du_corps']: block==='assistance'?['core','reeducation']:['cardio','bas_du_corps'];
 if(g==='hyrox') return ['cardio','bas_du_corps','core','haut_du_corps'];
 if(g==='explosivite') return block==='main'?['cardio','bas_du_corps']:['mobilite','core','cardio','haut_du_corps'];
 if(g==='musculation') return block==='main'?['haut_du_corps','bas_du_corps']:['core','reeducation','haut_du_corps','bas_du_corps'];
 return goalConfig[g]?.groups || goalConfig.full.groups;
}
function pick(exs,cfg,block,n,used,hist){
 let allowed=choosePool(cfg,block);
 let list=shuffle(exs)
  .filter(e=>allowed.includes(e.group))
  .map(e=>({e,s:score(e,cfg,block,used,hist)}))
  .filter(x=>x.s>-50)
  .sort((a,b)=>b.s-a.s)
  .map(x=>x.e);
 if(list.length<n){
  list=list.concat(shuffle(exs).filter(e=>!list.includes(e)&&!used.has(e.id)&&safeInjury(e,cfg.injury)));
 }
 let out=list.slice(0,n);
 out.forEach(e=>used.add(e.id));
 return out.map((e,i)=>adapt(e,cfg,block,i));
}
function adapt(e,cfg,block,i){
 let lvl=cfg.level||'intermediaire';
 let instruction=e.levels?.[lvl] || e.levels?.intermediaire || e.name;
 return {...e, displayName:e.name, instruction, prescription:prescription(e,cfg,block,i), charge:charge(e,cfg)};
}
function charge(e,cfg){
 let q=(e.equipment||[]).join(' ');
 let lvl=cfg.level||'intermediaire';
 if(q.match(/barre|haltères|kettlebell|machine|poulie/)){
  if(cfg.goal==='musculation'){
   if(lvl==='debutant') return 'charge légère · technique';
   if(lvl==='intermediaire') return 'charge modérée · RPE 7';
   if(lvl==='avance') return 'charge lourde contrôlée · RPE 8';
   return 'charge lourde maîtrisée · RPE 8-9';
  }
  return 'charge contrôlable';
 }
 return 'poids du corps / contrôle';
}
function styleType(cfg){
 let list=styleMap[cfg.goal]||styleMap.full;
 let found=list.find(x=>x[0]===cfg.style) || list[0];
 return found[3];
}
function profile(cfg){return styleProfiles[styleType(cfg)]||styleProfiles.circuit}
function durationSplit(cfg){
 let d=Number(cfg.duration||30);
 if(cfg.goal==='mobilite'||cfg.goal==='prevention'){
  if(d<=20) return {activation:3,main:10,assistance:5,finisher:2};
  if(d<=30) return {activation:4,main:15,assistance:8,finisher:3};
  return {activation:6,main:22,assistance:12,finisher:5};
 }
 if(d<=20) return {activation:4,main:9,assistance:5,finisher:2};
 if(d<=30) return {activation:5,main:14,assistance:7,finisher:4};
 if(d<=45) return {activation:7,main:22,assistance:10,finisher:6};
 return {activation:8,main:30,assistance:14,finisher:8};
}
function countFor(cfg,block){
 let d=Number(cfg.duration||30);
 if(block==='activation') return d<=20?2:3;
 if(block==='main') return d<=20?3:4;
 if(block==='assistance') return d<=20?2:3;
 if(block==='finisher') return (cfg.goal==='mobilite'||cfg.goal==='prevention')?1:2;
 return 2;
}
function prescription(e,cfg,block,i){
 let p=profile(cfg), st=styleType(cfg);
 if(block==='activation') return p.format==='ROUNDS'?'30 sec / geste': '30-45 sec';
 if(st==='tabata') return '20 sec travail / 10 sec repos';
 if(st==='emom') return '6-12 reps au début de minute';
 if(st==='amrap') return i%2?'12 reps':'10 reps';
 if(st==='fortime') return i%2?'15 reps':'10 reps';
 if(st==='round') return block==='main'?'round 2-3 min':'30-45 sec';
 if(st==='power'||st==='agility') return '3-6 reps explosives';
 if(st==='mobility'||st==='prehab'||st==='recovery'||st==='breath') return p.work;
 if(st==='series') return block==='main'?'3-5 séries x 8-12 reps':'2-3 séries x 10-15 reps';
 if(st==='stations') return '2-4 min / station';
 return block==='main'?'10-15 reps ou 40 sec':'30-45 sec';
}
function info(cfg,block,items){
 let mins=durationSplit(cfg)[block], p=profile(cfg);
 let format=p.format, work=p.work, rest=p.rest, reps=p.reps, rounds=p.main;
 if(block==='activation'){format='Activation';rounds=`${mins} min`;work='30-45 sec par exercice';rest='enchaîner propre';reps='amplitude + respiration'}
 if(block==='main'){
   if(p.format==='TABATA') rounds='8 rounds';
   if(p.format==='AMRAP') rounds=`AMRAP ${mins} min`;
   if(p.format==='EMOM') rounds=`EMOM ${mins} min`;
   if(p.format==='FOR TIME') rounds=`For Time ${mins} min`;
   if(p.format==='ROUNDS') rounds= cfg.level==='expert'?'5 rounds x 3 min':'3 rounds x 2-3 min';
 }
 if(block==='assistance'){format='Renforcement utile';rounds=`${mins} min`;work=`${items.length} exercices`;rest='30-45 sec';reps='contrôle + posture'}
 if(block==='finisher'){format=(cfg.goal==='mobilite'||cfg.goal==='prevention')?'Retour au calme':'Finisher';rounds=`${mins} min`;work= p.format==='ROUNDS'?'30/30':'enchaînement court';rest='adapté';reps='finir propre'}
 return {minutes:mins,format,rounds,work,rest,reps,intensity:p.intensity};
}
function generate(cfg,exs){
 cfg={goal:'full',style:'equilibre',level:'intermediaire',duration:30,equipment:['poids du corps'],age:'',people:1,fatigue:3,stress:3,injury:'',place:'',...cfg};
 if(cfg.level==='choisir') cfg.level='intermediaire';
 cfg.duration=Number(cfg.duration||30);
 let used=new Set(), hist=history();
 let conf=goalConfig[cfg.goal]||goalConfig.full;
 let session={title:conf.label,objective:conf.objective,style:cfg.style,theme:conf,meta:{...cfg,equipment:(cfg.equipment||[]).join(', ')},blocks:{},infos:{}};
 blocks.forEach(b=>{
  let n=countFor(cfg,b.id);
  session.blocks[b.id]=pick(exs,cfg,b.id,n,used,hist);
  session.infos[b.id]=info(cfg,b.id,session.blocks[b.id]);
 });
 saveHistory([...hist,...Object.values(session.blocks).flat().map(e=>e.id)]);
 return session;
}
return{blocks,goalConfig,styleMap,generate,profile};
})();
