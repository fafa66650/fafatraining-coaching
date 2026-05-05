
const Engine=(()=>{
const blockLabels={activation:'ENTRÉE',main:'PLAT',assistance:'ACCOMPAGNEMENT',finisher:'DESSERT'};
const blockObjectives={
 activation:'Activer le corps, monter progressivement en température et préparer les gestes.',
 main:'Travailler le cœur de la séance avec un format clair et mesurable.',
 assistance:'Compléter le travail, renforcer les zones utiles et sécuriser les mouvements.',
 finisher:'Finir avec intensité contrôlée et garder une technique propre.'
};
const themes={
 force:{title:'MUSCULATION',icons:['💪 Force','🎯 Progression','🧠 Contrôle','⏱ Discipline'],objective:'Développer la force propre avec charges adaptées, repos clair et technique prioritaire.'},
 renfo:{title:'RENFORCEMENT',icons:['🛡 Posture','💪 Tonus','🧠 Contrôle','⚡ Énergie'],objective:'Renforcer le corps, améliorer le gainage et protéger les articulations.'},
 full:{title:'FULL BODY',icons:['⚡ Complet','💪 Force','🏃 Cardio','🧠 Mental'],objective:'Travailler haut, bas, core et cardio dans une séance équilibrée.'},
 hiit:{title:'HIIT',icons:['🔥 Intensité','🏃 Cardio','⚡ Explosif','⏱ Chrono'],objective:'Monter l’intensité, travailler le souffle et brûler un maximum en peu de temps.'},
 circuit:{title:'CIRCUIT TRAINING',icons:['🔁 Tours','💪 Renfo','🏃 Cardio','🎯 Rythme'],objective:'Enchaîner plusieurs exercices avec des tours précis et un rythme régulier.'},
 boxe:{title:'BOXE CONDITIONING',icons:['🥊 Boxe','🏃 Cardio','🦶 Appuis','🧠 Mental'],objective:'Améliorer technique, appuis, endurance et explosivité spécifique boxe.'},
 crossfit:{title:'CROSSFIT',icons:['🏋 WOD','🔥 AMRAP','⏱ EMOM','🧠 Mental'],objective:'Créer un WOD lisible, chronométré, avec intensité et contrôle technique.'},
 cross:{title:'CROSS TRAINING',icons:['🏃 Terrain','💪 Force','🔥 Endurance','🎯 Discipline'],objective:'Développer endurance, force utile, mental et capacité à enchaîner.'},
 hyrox:{title:'HYROX',icons:['🏁 Stations','🏃 Cardio','🎒 Carries','🧠 Mental'],objective:'Travailler stations, transitions, cardio et endurance de force.'},
 mobilite:{title:'MOBILITÉ',icons:['🧘 Souplesse','🌬 Respiration','🛡 Prévention','🧠 Calme'],objective:'Améliorer souplesse, respiration, amplitude et récupération.'},
 reeducation:{title:'PRÉVENTION',icons:['🧩 Activation','🛡 Sécurité','🧠 Contrôle','🌬 Respiration'],objective:'Activer, protéger et renforcer sans douleur.'},
 explosivite:{title:'EXPLOSIVITÉ',icons:['💥 Vitesse','⚡ Puissance','🎯 Réactivité','🧠 Mental'],objective:'Développer vitesse, puissance, appuis et coordination.'}
};
const recipes={
 force:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['core','cardio']},
 renfo:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps','core'],assistance:['core','reeducation'],finisher:['mobilite','cardio']},
 full:{activation:['mobilite','cardio'],main:['haut_du_corps','bas_du_corps','core'],assistance:['core','reeducation'],finisher:['cardio']},
 hiit:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},
 circuit:{activation:['mobilite','cardio'],main:['cardio','haut_du_corps','bas_du_corps','core'],assistance:['core','bas_du_corps'],finisher:['cardio']},
 boxe:{activation:['boxe','cardio','mobilite'],main:['boxe'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['boxe','cardio']},
 crossfit:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps','core'],assistance:['core','reeducation'],finisher:['cardio']},
 cross:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core','bas_du_corps','haut_du_corps'],finisher:['cardio']},
 hyrox:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','haut_du_corps'],finisher:['cardio']},
 mobilite:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite','reeducation'],finisher:['mobilite']},
 reeducation:{activation:['mobilite','reeducation'],main:['reeducation','mobilite'],assistance:['core','reeducation'],finisher:['mobilite','reeducation']},
 explosivite:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','reeducation'],finisher:['cardio']}
};
const subRules={
 force_hypertrophie:{activation:['mobilite'],main:['haut_du_corps','bas_du_corps'],assistance:['haut_du_corps','bas_du_corps','core'],finisher:['core']},
 force_force:{activation:['mobilite'],main:['haut_du_corps','bas_du_corps'],assistance:['core'],finisher:['cardio']},
 boxe_pure:{activation:['boxe','mobilite'],main:['boxe'],assistance:['boxe','core'],finisher:['boxe']},
 boxe_renfo:{activation:['boxe','mobilite'],main:['boxe'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['boxe','cardio']},
 boxe_cardio:{activation:['boxe','cardio'],main:['boxe','cardio'],assistance:['core'],finisher:['cardio','boxe']},
 cardio_boxing:{activation:['cardio','boxe'],main:['boxe','cardio'],assistance:['cardio','core'],finisher:['cardio']},
 crossfit_wod:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},crossfit_emom:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},crossfit_fortime:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},
 crossfit_force:{activation:['mobilite'],main:['haut_du_corps','bas_du_corps'],assistance:['core'],finisher:['cardio']},
 crossfit_skill:{activation:['mobilite'],main:['cardio','core'],assistance:['reeducation','core'],finisher:['mobilite']},
 mobilite_bas:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite'],finisher:['mobilite']},
 mobilite_haut:{activation:['mobilite'],main:['mobilite','reeducation'],assistance:['mobilite'],finisher:['mobilite']},
 mobilite_relax:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite'],finisher:['mobilite']}
};
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v63_hist')||'[]')}catch(e){return[]}}
function saveHist(keys){localStorage.setItem('fafa_v63_hist',JSON.stringify(keys.slice(-260)))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function safeFor(e,inj){return !inj||!(e.contraindications||[]).includes(inj)}
function hasEq(e,eqs){if(!eqs||!eqs.length||eqs.includes('tous'))return true;let q=e.equipment||[];return q.includes('poids du corps')||eqs.some(x=>q.includes(x))}
function allowed(cfg,block){let r=subRules[cfg.subgoal]||recipes[cfg.goal]||recipes.full;return r[block]||[]}
function score(e,cfg,block,h){
 let s=0,a=allowed(cfg,block),obj=e.objectives||[];
 if(a.includes(e.group))s+=30;
 if(cfg.goal==='mobilite'&&!['mobilite','reeducation'].includes(e.group))s-=120;
 if(cfg.goal==='reeducation'&&!['mobilite','reeducation','core'].includes(e.group))s-=90;
 if(cfg.goal==='boxe'&&e.group==='boxe')s+=18;
 if(cfg.goal==='crossfit'&&(obj.includes('crossfit')||e.pattern==='CrossFit'))s+=14;
 if(cfg.goal==='hyrox'&&(obj.includes('hyrox')||e.pattern==='Hyrox'))s+=14;
 if(h.includes(e.id))s-=18;
 if(cfg.fatigue>=4&&['power','cardio','cross'].includes(e.type))s-=6;
 if(cfg.stress>=4&&['mobilite','reeducation'].includes(e.group))s+=7;
 if(cfg.age && cfg.age<14 && ['power','gym'].includes(e.type))s-=12;
 if(cfg.age && cfg.age>65 && ['power','cross'].includes(e.type))s-=14;
 if(cfg.people>1&&(e.equipment||[]).includes('machine'))s-=4;
 return s;
}
function adapt(e,l){let v=e.levels?.[l]||e.levels?.intermediaire||e.name;return {...e,displayName:e.name,instruction:v,shortTip:e.tips,shortMistake:e.mistake}}
function split(goal,total){
 if(goal==='mobilite'||goal==='reeducation') return {activation:4,main:Math.max(8,total-12),assistance:5,finisher:3};
 if(total<=20)return{activation:4,main:10,assistance:4,finisher:2};
 if(total<=30)return{activation:5,main:14,assistance:7,finisher:4};
 if(total<=45)return{activation:7,main:22,assistance:10,finisher:6};
 return{activation:8,main:30,assistance:14,finisher:8};
}
function details(block,cfg,count){
 let m=split(cfg.goal,cfg.duration)[block];
 if(cfg.goal==='boxe'){
  if(block==='main')return cfg.subgoal==='boxe_pure'?{format:'3 rounds x 3 min',work:'3 min / round',rest:'1 min entre rounds',reps:'jab-cross-crochet / défense / appuis'}:{format:'4 rounds x 2 min',work:'2 min / round',rest:'1 min',reps:'sac ou shadow + renfo court'};
  if(block==='activation')return{format:`${m} min progressif`,work:'appuis + mobilité + shadow',rest:'aucun',reps:'30-45 sec par atelier'};
  if(block==='finisher')return{format:'6 x 30 sec',work:'30 sec intense',rest:'30 sec',reps:'garde haute'};
 }
 if(cfg.goal==='crossfit'){
  if(block==='main'){
    if(cfg.subgoal==='crossfit_force')return{format:'Force + WOD',work:'5 séries x 5 reps puis WOD court',rest:'90 sec force / 30 sec WOD',reps:'charge propre'};
    if(cfg.subgoal==='crossfit_emom')return{format:`EMOM ${m} min`,work:'1 exercice au début de chaque minute',rest:'reste de la minute',reps:'6-12 reps selon mouvement'};
    if(cfg.subgoal==='crossfit_fortime')return{format:`For Time ${m} min`,work:'finir la liste le plus propre possible',rest:'courts repos contrôlés',reps:'10-20 reps selon mouvement'};
    if(cfg.subgoal==='crossfit_skill')return{format:`Skill ${m} min`,work:'technique + contrôle',rest:'45-60 sec',reps:'5-8 reps propres'};
    return{format:`AMRAP ${m} min`,work:'enchaîner les exercices',rest:'si besoin',reps:'8-12 reps par mouvement'};
  }
  if(block==='activation')return{format:`${m} min progressif`,work:'mobilité + montée cardio',rest:'aucun',reps:'30-45 sec par mouvement'};
  if(block==='finisher')return{format:`For Time ${m} min`,work:'finir propre sans casser la technique',rest:'minimum propre',reps:'qualité avant vitesse'};
 }
 if(cfg.goal==='hiit')return{format:block==='main'?`${m} min HIIT`:`${m} min`,work:'40 sec travail',rest:'20 sec repos',reps:'rythme soutenu'};
 if(cfg.goal==='mobilite'||cfg.goal==='reeducation')return{format:`${m} min contrôle`,work:'45-60 sec par mouvement',rest:'respiration lente',reps:'aucune douleur'};
 if(cfg.goal==='force')return{format:block==='main'?`${m} min force`:`${m} min`,work:block==='main'?'3-5 séries x 8-12 reps':'2-3 séries x 10-15 reps',rest:block==='main'?'60-90 sec':'45-60 sec',reps:'RPE adapté'};
 if(cfg.goal==='explosivite')return{format:`${m} min explosif`,work:'3-6 reps rapides',rest:'60 sec',reps:'qualité maximale'};
 if(cfg.goal==='hyrox')return{format:`${m} min stations`,work:'3 min station',rest:'1 min transition',reps:'rythme régulier'};
 return{format:`${m} min`,work:`${count} exercices`,rest:'repos adapté',reps:'qualité avant vitesse'};
}
function prescription(e,cfg,block,idx){
 if(cfg.goal==='boxe') return block==='main'?'round 2-3 min':'30-45 sec';
 if(cfg.goal==='crossfit'){
   if(cfg.subgoal==='crossfit_emom') return '6-10 reps / minute';
   if(cfg.subgoal==='crossfit_fortime') return '10-20 reps';
   if(cfg.subgoal==='crossfit_force'&&block==='main') return idx<2?'5 x 5 reps':'8-12 reps';
   return block==='main'?'8-12 reps':'30-45 sec';
 }
 if(cfg.goal==='hiit') return '40 sec travail / 20 sec repos';
 if(cfg.goal==='mobilite'||cfg.goal==='reeducation') return '45-60 sec contrôlé';
 if(cfg.goal==='force') return block==='main'?'3-5 séries x 8-12 reps':'2-3 séries x 10-15 reps';
 if(cfg.goal==='explosivite') return '3-6 reps explosives';
 return block==='main'?'10-15 reps':'30-45 sec';
}
function charge(e,l,g){let eq=(e.equipment||[]).join(' ');if(eq.match(/barre|haltères|kettlebell|machine|poulie/)){if(g==='force')return l==='debutant'?'léger technique · RPE 5-6':l==='intermediaire'?'60-75% effort · RPE 7':l==='avance'?'70-85% effort · RPE 8':'80-90% effort · RPE 8-9';return 'charge modérée contrôlable'}return 'poids du corps / contrôle'}
function isComposite(e){
 let n=(e.name||'').toLowerCase();
 return n.includes('circuit ')||n.includes('amrap ')||n.includes('emom ')||n.includes('for time ')||n.includes('wod ');
}
function pick(exs,n,block,cfg,used,h){
 let ranked=shuffle(exs).filter(e=>!used.has(e.id)&&!isComposite(e)&&safeFor(e,cfg.injury)&&hasEq(e,cfg.equipmentList)).map(e=>({e,s:score(e,cfg,block,h)})).filter(x=>x.s>-60).sort((a,b)=>b.s-a.s).map(x=>x.e);
 if(ranked.length<n)ranked=ranked.concat(shuffle(exs).filter(e=>!used.has(e.id)&&!isComposite(e)&&!ranked.includes(e)&&safeFor(e,cfg.injury)));
 let out=ranked.slice(0,n);out.forEach(e=>used.add(e.id));
 return out.map((e,idx)=>{let a=adapt(e,cfg.level);a.charge=charge(a,cfg.level,cfg.goal);a.prescription=prescription(a,cfg,block,idx);return a});
}
function generate(cfg,exs){
 let c={...cfg,level:cfg.level==='choisir'?'intermediaire':cfg.level,duration:cfg.duration==='choisir'?30:Number(cfg.duration),equipmentList:cfg.equipmentList?.length?cfg.equipmentList:['poids du corps'],people:Number(cfg.people||1),age:Number(cfg.age||0)};
 let used=new Set(),h=hist(),mainCount=c.duration>=45?5:4;if(c.goal==='mobilite'||c.goal==='reeducation')mainCount=4;if(c.duration<=20)mainCount=3;
 let theme=themes[c.goal]||themes.full, s={title:`${theme.title} · ${c.level}`,theme,objective:theme.objective,meta:{goal:c.goal,subgoal:c.subgoal||'',level:c.level,duration:`${c.duration} min`,durationReal:c.duration,equipment:c.equipmentList.join(', '),injury:c.injury||'aucune',age:c.age||'non renseigné',people:c.people,stress:c.stress,fatigue:c.fatigue},blocks:{},blockInfos:{}};
 s.blocks.activation=pick(exs,2,'activation',c,used,h);s.blocks.main=pick(exs,mainCount,'main',c,used,h);s.blocks.assistance=pick(exs,c.duration<=20?2:3,'assistance',c,used,h);s.blocks.finisher=pick(exs,(c.goal==='mobilite'||c.goal==='reeducation')?1:2,'finisher',c,used,h);
 let mins=split(c.goal,c.duration);Object.keys(mins).forEach(k=>s.blockInfos[k]={minutes:mins[k],objective:blockObjectives[k],...details(k,c,s.blocks[k].length)});
 saveHist([...h,...Object.values(s.blocks).flat().map(e=>e.id)]);return s;
}
return{generate,blockLabels};
})();
