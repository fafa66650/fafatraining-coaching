
const Engine=(()=>{
const blockLabels={activation:'ENTRÉE',main:'PLAT',assistance:'ACCOMPAGNEMENT',finisher:'DESSERT'};
const blockSub={activation:'Préparer sans cramer',main:'Travail principal',assistance:'Renforcer utile',finisher:'Finir propre'};
const recipes={
 force:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['core']},
 renfo:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps','core'],assistance:['core','reeducation'],finisher:['mobilite']},
 full:{activation:['mobilite','cardio'],main:['haut_du_corps','bas_du_corps','core'],assistance:['core','reeducation'],finisher:['cardio']},
 hiit:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},
 circuit:{activation:['mobilite','cardio'],main:['cardio','haut_du_corps','bas_du_corps','core'],assistance:['core'],finisher:['cardio']},
 boxe:{activation:['boxe','cardio','mobilite'],main:['boxe'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['boxe','cardio']},
 crossfit:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps','core'],assistance:['core','reeducation'],finisher:['cardio']},
 cross:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core','bas_du_corps'],finisher:['cardio']},
 hyrox:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','haut_du_corps'],finisher:['cardio']},
 mobilite:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite','reeducation'],finisher:['mobilite']},
 reeducation:{activation:['mobilite','reeducation'],main:['reeducation','mobilite'],assistance:['core','reeducation'],finisher:['mobilite']},
 explosivite:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','reeducation'],finisher:['cardio']}
};
const subRules={
 boxe_pure:{activation:['boxe','cardio'],main:['boxe'],assistance:['boxe','core'],finisher:['boxe']},
 boxe_renfo:{activation:['boxe','mobilite'],main:['boxe'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['cardio','boxe']},
 boxe_cardio:{activation:['boxe','cardio'],main:['boxe','cardio'],assistance:['core'],finisher:['cardio','boxe']},
 cardio_boxing:{activation:['cardio','boxe'],main:['boxe','cardio'],assistance:['cardio','core'],finisher:['cardio']},
 crossfit_wod:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},
 crossfit_force:{activation:['mobilite'],main:['haut_du_corps','bas_du_corps'],assistance:['core'],finisher:['cardio']},
 crossfit_skill:{activation:['mobilite'],main:['cardio','core'],assistance:['reeducation','core'],finisher:['mobilite']},
 mobilite_bas:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite'],finisher:['mobilite']},
 mobilite_haut:{activation:['mobilite'],main:['mobilite','reeducation'],assistance:['mobilite'],finisher:['mobilite']},
 mobilite_relax:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite'],finisher:['mobilite']}
};
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v612_hist')||'[]')}catch(e){return[]}}
function saveHist(keys){localStorage.setItem('fafa_v612_hist',JSON.stringify(keys.slice(-200)))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function safeFor(e,inj){return !inj||!(e.contraindications||[]).includes(inj)}
function hasEq(e,eqs){if(!eqs||!eqs.length||eqs.includes('tous'))return true;let q=e.equipment||[];return q.includes('poids du corps')||eqs.some(x=>q.includes(x))}
function allowed(cfg,block){let r=subRules[cfg.subgoal]||recipes[cfg.goal]||recipes.full;return r[block]||[]}
function score(e,cfg,block,h){
 let s=0, a=allowed(cfg,block), obj=e.objectives||[];
 if(a.includes(e.group))s+=25;
 if(cfg.goal==='mobilite'&&!['mobilite','reeducation'].includes(e.group))s-=100;
 if(cfg.goal==='boxe'&&e.group==='boxe')s+=10;
 if(cfg.goal==='crossfit'&&(obj.includes('crossfit')||e.pattern==='CrossFit'))s+=12;
 if(cfg.goal==='hyrox'&&(obj.includes('hyrox')||e.pattern==='Hyrox'))s+=12;
 if(h.includes(e.id))s-=18;
 if(cfg.fatigue>=4&&['power','cardio','cross'].includes(e.type))s-=4;
 if(cfg.stress>=4&&['mobilite','reeducation'].includes(e.group))s+=5;
 if(cfg.age && cfg.age<14 && ['power','gym'].includes(e.type))s-=8;
 if(cfg.age && cfg.age>65 && ['power','cross'].includes(e.type))s-=8;
 if(cfg.people>1&&(e.equipment||[]).includes('machine'))s-=4;
 return s;
}
function adapt(e,l){let v=e.levels?.[l]||e.levels?.intermediaire||e.name;return {...e,displayName:e.name,instruction:v,shortTip:e.tips,shortMistake:e.mistake}}
function blockMinutes(block,goal,total){
 if(goal==='mobilite'||goal==='reeducation') return block==='activation'?4:block==='main'?Math.max(8,total-12):block==='assistance'?5:3;
 if(total<=20) return block==='activation'?4:block==='main'?10:block==='assistance'?4:2;
 if(total<=30) return block==='activation'?5:block==='main'?14:block==='assistance'?7:4;
 if(total<=45) return block==='activation'?7:block==='main'?22:block==='assistance'?10:6;
 return block==='activation'?8:block==='main'?30:block==='assistance'?14:8;
}
function prescription(block,cfg,count){
 let m=blockMinutes(block,cfg.goal,cfg.duration);
 if(cfg.goal==='boxe'){
   if(cfg.subgoal==='boxe_pure' && block==='main') return `3 rounds · 3 min · récup 1 min (${m} min bloc)`;
   if(block==='main') return `3 à 4 rounds · 2-3 min · récup 1 min (${m} min bloc)`;
   if(block==='activation') return `${m} min corde / appuis / shadow`;
   if(block==='finisher') return `6 x 30 sec · récup 30 sec (${m} min)`;
 }
 if(cfg.goal==='crossfit'){
   if(block==='main') return cfg.duration>=45?`WOD ${m} min : AMRAP ou EMOM`:`WOD ${m} min : AMRAP court`;
   if(block==='finisher') return `For Time ${m} min maximum`;
 }
 if(cfg.goal==='hiit') return block==='main'?`${m} min · 40 sec travail / 20 sec repos`:block==='finisher'?`${m} min Tabata ou sprint court`:`${m} min progressif`;
 if(cfg.goal==='mobilite'||cfg.goal==='reeducation') return `${m} min · 45-60 sec par mouvement · respiration lente`;
 if(cfg.goal==='hyrox') return block==='main'?`${m} min · stations 3 min / récup 1 min`:`${m} min contrôlé`;
 if(cfg.goal==='force') return block==='main'?`${m} min · 3-5 séries · repos 60-90 sec`:`${m} min · 2-3 séries`;
 return `${m} min · ${count} exercice(s) · repos adapté`;
}
function charge(e,l,g){let equip=(e.equipment||[]).join(' ');if(equip.match(/barre|haltères|kettlebell|machine|poulie/)){if(g==='force')return l==='debutant'?'léger technique · RPE 5-6':l==='intermediaire'?'60-75% effort · RPE 7':l==='avance'?'70-85% effort · RPE 8':'80-90% effort · RPE 8-9';return 'charge modérée contrôlable';}return 'poids du corps / contrôle'}
function pick(exs,n,block,cfg,used,h){let ranked=shuffle(exs).filter(e=>!used.has(e.id)&&safeFor(e,cfg.injury)&&hasEq(e,cfg.equipmentList)).map(e=>({e,s:score(e,cfg,block,h)})).filter(x=>x.s>-50).sort((a,b)=>b.s-a.s).map(x=>x.e);if(ranked.length<n)ranked=ranked.concat(shuffle(exs).filter(e=>!used.has(e.id)&&!ranked.includes(e)&&safeFor(e,cfg.injury)));let out=ranked.slice(0,n);out.forEach(e=>used.add(e.id));return out.map(e=>{let a=adapt(e,cfg.level);a.prescription=prescription(block,cfg,out.length);a.charge=charge(e,cfg.level,cfg.goal);a.blockMinutes=blockMinutes(block,cfg.goal,cfg.duration);return a})}
function titleFor(c){let m={force:'Musculation',renfo:'Renforcement',full:'Full Body',hiit:'HIIT',circuit:'Circuit Training',boxe:'Boxe',crossfit:'CrossFit style',cross:'Cross Training',hyrox:'Hyrox',mobilite:'Mobilité',reeducation:'Prévention',explosivite:'Explosivité'};return `${m[c.goal]||'Séance'} · ${c.level}`}
function generate(cfg,exs){let c={...cfg,level:cfg.level==='choisir'?'intermediaire':cfg.level,duration:cfg.duration==='choisir'?30:Number(cfg.duration),equipmentList:cfg.equipmentList?.length?cfg.equipmentList:['poids du corps'],people:Number(cfg.people||1),age:Number(cfg.age||0)};let used=new Set(),h=hist();let mainCount=c.duration>=45?5:4;if(c.goal==='mobilite'||c.goal==='reeducation')mainCount=4;if(c.duration<=20)mainCount=3;let s={title:titleFor(c),meta:{goal:c.goal,subgoal:c.subgoal||'',level:c.level,duration:`${c.duration} min`,durationReal:c.duration,equipment:c.equipmentList.join(', '),injury:c.injury||'aucune',age:c.age||'non renseigné',people:c.people,stress:c.stress,fatigue:c.fatigue},blocks:{}};s.blocks.activation=pick(exs,2,'activation',c,used,h);s.blocks.main=pick(exs,mainCount,'main',c,used,h);s.blocks.assistance=pick(exs,c.duration<=20?2:3,'assistance',c,used,h);s.blocks.finisher=pick(exs,(c.goal==='mobilite'||c.goal==='reeducation')?1:2,'finisher',c,used,h);saveHist([...h,...Object.values(s.blocks).flat().map(e=>e.id)]);return s}
return{generate,blockLabels,blockSub};
})();
