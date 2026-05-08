
const PremiumEngine=(()=>{
const BLOCKS=[
 ['warmup','Échauffement','Préparer le corps sans fatigue.','🔥'],
 ['main','Bloc principal','Travailler l’objectif de la séance.','⚡'],
 ['support','Renfort utile','Stabiliser, renforcer, corriger.','🛡️'],
 ['finish','Retour / Finisher','Finir propre ou récupérer.','🌙']
];
const GOALS={
 musculation:['Musculation','Force, charge, technique et progression.',['haut_du_corps','bas_du_corps','core'],['Force','Charge','Repos','Tempo']],
 renfo:['Renforcement','Posture, gainage, contrôle et sécurité.',['haut_du_corps','bas_du_corps','core','reeducation'],['Posture','Gainage','Contrôle','Sécurité']],
 full:['Full Body','Séance complète haut, bas, core et cardio.',['haut_du_corps','bas_du_corps','core','cardio'],['Complet','Énergie','Cardio','Mental']],
 hiit:['HIIT','Intervalles, souffle et intensité.',['cardio','bas_du_corps','haut_du_corps','core'],['Intensité','Chrono','Cardio','Calories']],
 circuit:['Circuit Training','Ateliers, tours et rythme.',['cardio','haut_du_corps','bas_du_corps','core'],['Tours','Rythme','Renfo','Cardio']],
 boxe:['Boxe','Technique, appuis, rounds et cardio.',['boxe','cardio','core','haut_du_corps','bas_du_corps'],['Technique','Appuis','Rounds','Mental']],
 crossfit:['CrossFit','WOD clair : AMRAP, EMOM, For Time ou Skill.',['cardio','bas_du_corps','haut_du_corps','core'],['WOD','AMRAP','EMOM','Mental']],
 cross:['Cross Training','Terrain, endurance et force utile.',['cardio','bas_du_corps','haut_du_corps','core'],['Terrain','Force','Endurance','Discipline']],
 hyrox:['Hyrox','Stations, course, portés et transitions.',['cardio','bas_du_corps','core','haut_du_corps'],['Stations','Course','Carries','Transitions']],
 mobilite:['Mobilité','Amplitude, respiration et récupération.',['mobilite','reeducation','core'],['Souplesse','Respiration','Amplitude','Calme']],
 prevention:['Prévention','Activer, protéger, renforcer sans douleur.',['reeducation','mobilite','core'],['Sécurité','Activation','Contrôle','Récup']],
 explosivite:['Explosivité','Puissance, vitesse, appuis et réactivité.',['cardio','bas_du_corps','haut_du_corps','core'],['Puissance','Vitesse','Appuis','Réactivité']]
};
const STYLES={
 musculation:[['force','Force','3-6 reps'],['hypertrophie','Hypertrophie','8-12 reps'],['endurance_force','Endurance force','15-20 reps'],['jambes','Jambes','bas'],['haut','Haut du corps','push/pull']],
 renfo:[['posture','Posture','contrôle'],['core','Core','gainage'],['dos','Dos protecteur','prévention'],['senior','Adapté','sécurité']],
 full:[['equilibre','Équilibré','global'],['cardio_renfo','Cardio + renfo','mix'],['force_full','Force complète','charges'],['terrain','Terrain','extérieur']],
 hiit:[['tabata','Tabata','20/10'],['interval','40/20','chrono'],['brule','Brûle graisse','intense'],['boxing','Cardio boxing','rythme']],
 circuit:[['tours','Tours','3-5 tours'],['stations','Stations','ateliers'],['groupe','Groupe','équipes'],['cardio','Cardio mix','alternance']],
 boxe:[['pure','Boxe pure','rounds'],['sac','Travail sac','impact'],['renfo','Boxe + renfo','mix'],['cardio','Boxe cardio','30/30'],['appuis','Appuis défense','technique']],
 crossfit:[['wod','WOD','complet'],['amrap','AMRAP','max tours'],['emom','EMOM','minute'],['fortime','For Time','chrono'],['skill','Skill','technique']],
 cross:[['terrain','Terrain','course + renfo'],['endurance','Endurance','long'],['force','Force terrain','charges'],['team','Équipe','ateliers']],
 hyrox:[['stations','Stations','course + atelier'],['carries','Carries','portés'],['cardio','Cardio','rameur/course'],['simulation','Simulation','format']],
 mobilite:[['bas','Bas du corps','hanches'],['haut','Haut du corps','épaules'],['colonne','Colonne','dos'],['respiration','Respiration','calme']],
 prevention:[['epaule','Épaules','coiffe'],['genou','Genoux','contrôle'],['dos','Dos','gainage'],['cheville','Chevilles','stabilité']],
 explosivite:[['vitesse','Vitesse','appuis'],['puissance','Puissance','sauts'],['reactivite','Réactivité','changements'],['athlete','Athlète','haut niveau']]
};
function profile(){try{return JSON.parse(localStorage.getItem('fafa72_profile')||'{}')}catch(e){return{}}}
function saveProfile(p){localStorage.setItem('fafa72_profile',JSON.stringify(p||{}))}
function history(){try{return JSON.parse(localStorage.getItem('fafa72_history')||'[]')}catch(e){return[]}}
function saveSession(s){let h=history();h.unshift({id:s.id,date:s.date,title:s.title,goal:s.meta.goal,duration:s.meta.duration});localStorage.setItem('fafa72_history',JSON.stringify(h.slice(0,60)))}
function fmt(goal,style){
 if(style==='tabata')return['TABATA','8 rounds','20 sec','10 sec','max propre'];
 if(style==='emom')return['EMOM','12 min','début minute','reste minute','6-12 reps'];
 if(style==='amrap')return['AMRAP','14 min','enchaîner','si besoin','8-15 reps'];
 if(style==='fortime')return['FOR TIME','cap 14 min','finir la liste','court','10-20 reps'];
 if(goal==='boxe')return['ROUNDS','3-5 rounds','2-3 min','1 min','thème technique'];
 if(goal==='mobilite')return['MOBILITÉ','2-3 tours','45-60 sec','respiration','sans douleur'];
 if(goal==='prevention')return['PRÉVENTION','2-3 séries','10-15 reps','30-45 sec','contrôle'];
 if(goal==='explosivite')return['PUISSANCE','4-6 séries','3-6 reps','60-90 sec','explosif propre'];
 if(goal==='musculation')return['SÉRIES','3-5 séries','8-12 reps','60-90 sec','charge adaptée'];
 return['CIRCUIT','3-5 tours','10-15 reps ou 40 sec','60 sec/tour','affichées'];
}
function split(d,goal){d=+d||30;if(goal==='mobilite'||goal==='prevention'){if(d<=20)return{warmup:3,main:10,support:5,finish:2};if(d<=30)return{warmup:4,main:15,support:8,finish:3};if(d<=45)return{warmup:6,main:22,support:12,finish:5};return{warmup:8,main:30,support:16,finish:6}}if(d<=20)return{warmup:4,main:9,support:5,finish:2};if(d<=30)return{warmup:5,main:14,support:7,finish:4};if(d<=45)return{warmup:7,main:22,support:10,finish:6};return{warmup:8,main:30,support:14,finish:8}}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function allowed(goal,block){if(block==='warmup')return['mobilite','reeducation','cardio','boxe'];if(goal==='mobilite')return['mobilite','reeducation'];if(goal==='prevention')return['reeducation','mobilite','core'];if(goal==='boxe')return block==='main'?['boxe']:['boxe','cardio','core','reeducation'];if(block==='support')return['core','reeducation','haut_du_corps','bas_du_corps'];if(block==='finish')return goal==='mobilite'||goal==='prevention'?['mobilite','reeducation']:['cardio','boxe','core'];return GOALS[goal]?.[2]||GOALS.full[2]}
function equipmentOk(e,eq){if(!eq||!eq.length)return true;let q=e.equipment||[];if(q.includes('poids du corps'))return true;return eq.some(x=>q.includes(x))}
function score(e,cfg,block,used){let s=0,p=profile(),g=allowed(cfg.goal,block),obj=e.objectives||[];if(g.includes(e.group))s+=40;if(used.has(e.id))s-=120;if(!equipmentOk(e,cfg.equipment))s-=18;if(cfg.injury&&(e.contraindications||[]).includes(cfg.injury))s-=120;if(cfg.goal==='boxe'&&e.group==='boxe')s+=20;if(cfg.goal==='crossfit'&&obj.includes('crossfit'))s+=14;if(cfg.goal==='hyrox'&&obj.includes('hyrox'))s+=14;if(Number(p.age||cfg.age)>60&&['mobilite','reeducation','core'].includes(e.group))s+=8;if(Number(cfg.fatigue)>=4&&e.group==='cardio')s-=8;if(Number(cfg.stress)>=4&&['mobilite','reeducation'].includes(e.group))s+=8;return s}
function count(block,d,goal,fatigue){d=+d||30;let c=block==='main'?(d<=20?3:4):block==='warmup'?(d<=20?2:3):block==='support'?(d<=20?2:3):(goal==='mobilite'||goal==='prevention'?1:2);if(+fatigue>=4&&c>2)c-=1;return c}
function pres(cfg,block,i){let f=fmt(cfg.goal,cfg.style);if(block==='warmup')return'30-45 sec';if(block==='support')return'2-3 séries';if(block==='finish')return cfg.goal==='boxe'?'30/30 sec':'30-45 sec';if(f[0]==='AMRAP')return i%2?'12 reps':'10 reps';if(f[0]==='EMOM')return'6-12 reps/min';if(f[0]==='TABATA')return'20 sec';if(f[0]==='FOR TIME')return i%2?'15 reps':'10 reps';if(f[0]==='ROUNDS')return'round 2-3 min';if(f[0]==='SÉRIES')return'3-5 x 8-12';if(f[0]==='PUISSANCE')return'3-6 reps';if(f[0]==='MOBILITÉ')return'45-60 sec';if(f[0]==='PRÉVENTION')return'10-15 reps';return'10-15 reps ou 40 sec'}
function adapt(e,cfg,block,i){let lvl=cfg.level==='auto'?'intermediaire':cfg.level;return{...e,displayName:e.name,instruction:e.levels?.[lvl]||e.levels?.intermediaire||e.name,prescription:pres(cfg,block,i)}}
function pick(exs,cfg,block,used){let n=count(block,cfg.duration,cfg.goal,cfg.fatigue);let list=shuffle(exs).map(e=>({e,s:score(e,cfg,block,used)})).filter(x=>x.s>-35).sort((a,b)=>b.s-a.s).map(x=>x.e);if(list.length<n)list=shuffle(exs).filter(e=>!used.has(e.id));let out=list.slice(0,n);out.forEach(e=>used.add(e.id));return out.map((e,i)=>adapt(e,cfg,block,i))}
function info(cfg,block,items){let t=split(cfg.duration,cfg.goal),f=fmt(cfg.goal,cfg.style),m=t[block];if(block==='warmup')return{format:'Activation',structure:`${m} min`,work:'30-45 sec/exercice',rest:'enchaîner',reps:'amplitude + respiration'};if(block==='support')return{format:'Renfort utile',structure:`${m} min`,work:`${items.length} exercices`,rest:'30-45 sec',reps:'contrôle'};if(block==='finish')return{format:cfg.goal==='mobilite'||cfg.goal==='prevention'?'Retour au calme':'Finisher',structure:`${m} min`,work:'court et propre',rest:'adapté',reps:'finir propre'};return{format:f[0],structure:f[0]==='AMRAP'?`AMRAP ${m} min`:f[0]==='EMOM'?`EMOM ${m} min`:f[0]==='FOR TIME'?`For Time ${m} min`:f[1],work:f[2],rest:f[3],reps:f[4]}}
function adaptation(cfg){let p=profile(),a=[];if(p.name)a.push(p.name);if(p.goal)a.push(`objectif ${p.goal}`);if(cfg.injury)a.push(`attention ${cfg.injury}`);if(+cfg.fatigue>=4)a.push('volume réduit');if(+cfg.stress>=4)a.push('respiration renforcée');return a.join(' · ')||'séance équilibrée'}
function generate(cfg,exs){cfg={goal:'full',style:'equilibre',level:'auto',duration:30,equipment:['poids du corps'],age:'',fatigue:3,stress:3,injury:'',...cfg};let used=new Set(),g=GOALS[cfg.goal]||GOALS.full,s={id:Date.now(),date:new Date().toISOString(),title:g[0],objective:g[1],badges:g[3],adaptation:adaptation(cfg),meta:cfg,blocks:{},infos:{}};BLOCKS.forEach(b=>{s.blocks[b[0]]=pick(exs,cfg,b[0],used);s.infos[b[0]]=info(cfg,b[0],s.blocks[b[0]])});return s}
return{goals:GOALS,styles:STYLES,blocks:BLOCKS,generate,profile,saveProfile,history,saveSession};
})();
