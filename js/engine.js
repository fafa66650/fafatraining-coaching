
const Engine=(()=>{
const blockLabels={activation:'ENTRÉE',main:'PLAT',assistance:'ACCOMPAGNEMENT',finisher:'DESSERT'};
const blockSub={activation:'Préparer le corps',main:'Cœur de séance',assistance:'Renfo utile',finisher:'Finir propre'};
const recipes={
 full:{activation:['mobilite','cardio'],main:['haut_du_corps','bas_du_corps'],assistance:['core','reeducation'],finisher:['cardio','core']},
 force:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps'],assistance:['core','haut_du_corps','bas_du_corps'],finisher:['core','cardio']},
 hiit:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core'],finisher:['cardio']},
 boxe:{activation:['boxe','cardio','mobilite'],main:['boxe'],assistance:['core','bas_du_corps','haut_du_corps','reeducation'],finisher:['boxe','cardio']},
 cross:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps','haut_du_corps'],assistance:['core','bas_du_corps'],finisher:['cardio']},
 hyrox:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','haut_du_corps'],finisher:['cardio']},
 mobilite:{activation:['mobilite'],main:['mobilite'],assistance:['mobilite','reeducation'],finisher:['mobilite']},
 renfo:{activation:['mobilite','reeducation'],main:['haut_du_corps','bas_du_corps','core'],assistance:['core','reeducation'],finisher:['core','mobilite']},
 explosivite:{activation:['mobilite','cardio'],main:['cardio','bas_du_corps'],assistance:['core','reeducation'],finisher:['cardio']},
 reeducation:{activation:['mobilite','reeducation'],main:['reeducation','mobilite'],assistance:['core','reeducation'],finisher:['mobilite','reeducation']}
};
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v61_hist')||'[]')}catch(e){return[]}}
function saveHist(keys){localStorage.setItem('fafa_v61_hist',JSON.stringify(keys.slice(-150)))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function safeFor(e,inj){return !inj||!(e.contraindications||[]).includes(inj)}
function hasAnyEq(e,eqs){
 if(!eqs||!eqs.length||eqs.includes('tous')) return true;
 let equip=e.equipment||[];
 return equip.includes('poids du corps') || eqs.some(x=>equip.includes(x));
}
function goalFit(e,goal,block){
 let r=recipes[goal]||recipes.full;
 let allowed=r[block]||[];
 if(allowed.includes(e.group)) return 12;
 if(goal==='boxe' && (e.group==='boxe'||e.objectives?.includes('boxe'))) return 12;
 if(goal==='mobilite' && e.group!=='mobilite' && e.group!=='reeducation') return -100;
 if(goal==='reeducation' && !['reeducation','mobilite','core'].includes(e.group)) return -80;
 if(goal==='cross' && ['Cross Training','Carry','Hinge'].includes(e.pattern)) return 8;
 if(goal==='hyrox' && (e.objectives||[]).includes('hyrox')) return 10;
 if(goal==='explosivite' && (e.type==='power'||(e.objectives||[]).includes('explosivité')||(e.objectives||[]).includes('puissance'))) return 10;
 return 0;
}
function adapt(e,l){let v=e.levels?.[l]||e.levels?.intermediaire||e.name;return {...e,displayName:e.name,version:v,instruction:v,shortTip:e.tips,shortMistake:e.mistake}}
function chargeAdvice(e,level,goal){
 let equip=(e.equipment||[]).join(' ');
 if(equip.includes('barre')||equip.includes('haltères')||equip.includes('kettlebell')||equip.includes('machine')){
   if(goal==='force') return level==='debutant'?'charge légère technique · RPE 5-6':level==='intermediaire'?'60-75% effort · RPE 7':level==='avance'?'70-85% effort · RPE 8':'80-90% effort · RPE 8-9';
   if(goal==='hiit'||goal==='cross'||goal==='hyrox') return 'charge modérée contrôlable · qualité avant vitesse';
   return level==='debutant'?'léger, technique propre':'charge modérée adaptée';
 }
 return 'poids du corps · qualité du mouvement';
}
function prescription(block,goal,level,duration){
 if(goal==='boxe') return block==='main'?'4 à 6 rounds · 2 min · repos 45 sec':block==='finisher'?'6 x 30 sec intense · repos 30 sec':block==='activation'?'6 min corde/appuis/shadow':'3 séries · 30-45 sec';
 if(goal==='cross') return block==='main'?(duration>=45?'AMRAP 18 min ou EMOM 16 min':'AMRAP 12 min'):block==='finisher'?'For Time 6 min':block==='activation'?'6 min progressif':'3 tours · repos 45 sec';
 if(goal==='hyrox') return block==='main'?'4 stations · 3 min effort / 1 min récup':block==='finisher'?'1 bloc cardio 6 min':'3 tours contrôlés';
 if(goal==='hiit') return block==='main'?'40 sec effort / 20 sec repos · 4 tours':block==='finisher'?'Tabata 4 min':block==='activation'?'5 min montée progressive':'3 tours';
 if(goal==='mobilite'||goal==='reeducation') return block==='main'?'45 à 60 sec par mouvement':block==='finisher'?'respiration 3 min':block==='activation'?'mobilité douce 5 min':'2 tours lents';
 if(goal==='explosivite') return block==='main'?'5 séries · 3-6 reps explosives · repos 60 sec':block==='finisher'?'sprints courts ou appuis 6 min':'activation dynamique';
 if(level==='expert') return block==='main'?'5 séries · 8-12 reps · repos 60-90 sec':block==='finisher'?'8 min haute intensité':'3-4 séries';
 return block==='main'?'3-4 séries · 10-15 reps · repos 45-60 sec':block==='finisher'?'6 min contrôlé':block==='activation'?'5 min progressif':'3 séries · 30-45 sec';
}
function titleFor(g,l){let m={full:'Full Body intelligent',force:'Force / Musculation',hiit:'HIIT brûle graisse',boxe:'Boxe conditioning',cross:'Cross Training terrain',hyrox:'Hyrox / Conditioning',mobilite:'Mobilité recovery',renfo:'Renforcement complet',explosivite:'Explosivité',reeducation:'Prévention / Récupération'};return `${m[g]||'Séance FAFATRAINING'} · ${l}`}
function pick(exs,n,block,cfg,used,h){
 let level=cfg.level||'intermediaire',goal=cfg.goal||'full';
 let ranked=shuffle(exs).filter(e=>!used.has(e.id)&&safeFor(e,cfg.injury)&&hasAnyEq(e,cfg.equipmentList))
 .map(e=>{
   let s=goalFit(e,goal,block);
   if(h.includes(e.id)) s-=18;
   if(cfg.fatigue>=4 && ['power','cardio'].includes(e.type)) s-=3;
   if(cfg.stress>=4 && ['mobilite','reeducation'].includes(e.group)) s+=4;
   if((e.equipment||[]).includes('poids du corps')) s+=1;
   return {e,s};
 }).filter(x=>x.s>-50).sort((a,b)=>b.s-a.s).map(x=>x.e);
 if(ranked.length<n){
   ranked=ranked.concat(shuffle(exs).filter(e=>!used.has(e.id)&&!ranked.includes(e)&&safeFor(e,cfg.injury)));
 }
 let out=ranked.slice(0,n);
 out.forEach(e=>used.add(e.id));
 return out.map(e=> {
   let a=adapt(e,level);
   a.prescription=prescription(block,goal,level,cfg.duration);
   a.charge=chargeAdvice(e,level,goal);
   return a;
 });
}
function generate(cfg,exs){
 let level=cfg.level&&cfg.level!=='choisir'?cfg.level:'intermediaire';
 let goal=cfg.goal||'full';
 let duration=cfg.duration&&cfg.duration!=='choisir'?Number(cfg.duration):30;
 let used=new Set(), h=hist();
 let clean={...cfg,level,goal,duration,equipmentList:cfg.equipmentList&&cfg.equipmentList.length?cfg.equipmentList:['tous']};
 let countMain=duration>=45?6:4;
 if(clean.fatigue>=4) countMain=Math.max(3,countMain-1);
 if(level==='expert') countMain+=1;
 let s={title:titleFor(goal,level),meta:{goal,level,duration:`${duration} min`,equipment:clean.equipmentList.join(', '),injury:cfg.injury||'aucune',stress:cfg.stress||3,fatigue:cfg.fatigue||3},blocks:{}};
 s.blocks.activation=pick(exs,3,'activation',clean,used,h);
 s.blocks.main=pick(exs,countMain,'main',clean,used,h);
 s.blocks.assistance=pick(exs,3,'assistance',clean,used,h);
 s.blocks.finisher=pick(exs, goal==='mobilite'||goal==='reeducation'?2:3,'finisher',clean,used,h);
 saveHist([...h,...Object.values(s.blocks).flat().map(e=>e.id)]);
 return s;
}
return {generate,blockLabels,blockSub};
})();
