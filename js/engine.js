
const Engine=(()=>{
const blockLabels={activation:'ENTRÉE',main:'PLAT',assistance:'ACCOMPAGNEMENT',finisher:'DESSERT'};
const blockSub={activation:'Activation',main:'Bloc principal',assistance:'Assistance / Core',finisher:'Finisher'};
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hist(){try{return JSON.parse(localStorage.getItem('fafa_v604_hist')||'[]')}catch(e){return[]}}
function saveHist(keys){localStorage.setItem('fafa_v604_hist',JSON.stringify(keys.slice(-120)))}
function safeFor(e,inj){return !inj||!(e.contraindications||[]).includes(inj)}
function hasEq(e,eq){return !eq||eq==='choisir'||eq==='tous'||(e.equipment||[]).includes(eq)||(e.equipment||[]).includes('poids du corps')}
function goalMatch(e,g){
 if(!g||g==='full')return true;
 if(g==='force')return ['force','musculation','hypertrophie'].some(x=>(e.objectives||[]).includes(x))||['Push','Pull','Legs','Hinge'].includes(e.pattern);
 if(g==='hiit')return e.group==='cardio'||['hiit','perte_de_poids','conditioning','cardio'].some(x=>(e.objectives||[]).includes(x));
 if(g==='boxe')return ['boxe','cardio','core'].includes(e.group);
 if(g==='cross')return ['cardio','bas_du_corps','haut_du_corps','core'].includes(e.group)||['Cross Training','Carry','Hinge'].includes(e.pattern);
 if(g==='hyrox')return ['cardio','bas_du_corps','core'].includes(e.group)||['Carry','Cross Training'].includes(e.pattern)||['hyrox'].some(x=>(e.objectives||[]).includes(x));
 if(g==='mobilite')return ['mobilite','core'].includes(e.group);
 if(g==='circuit'||g==='renfo')return ['haut_du_corps','bas_du_corps','core','cardio'].includes(e.group);
 if(g==='explosivite')return ['power','cardio'].includes(e.type)||['explosivité','puissance'].some(x=>(e.objectives||[]).includes(x));
 return true;
}
function adapt(e,l){let v=e.levels?.[l]||e.levels?.intermediaire||e.name;return {...e,displayName:e.name,version:v,instruction:v,shortTip:e.tips,shortMistake:e.mistake}}
function score(e,c,h){
 let s=0;
 if(goalMatch(e,c.goal))s+=10;
 if(hasEq(e,c.equipment))s+=4;
 if(h.includes(e.id))s-=20;
 if(c.fatigue>=4&&['power','cardio'].includes(e.type))s-=3;
 if(c.stress>=4&&e.group==='mobilite')s+=4;
 return s;
}
function pick(pool,n,l,used,c,h){
 let ranked=shuffle(pool).filter(e=>!used.has(e.id)).map(e=>({e,s:score(e,c,h)})).sort((a,b)=>b.s-a.s).map(x=>x.e);
 let out=ranked.slice(0,n); out.forEach(e=>used.add(e.id)); return out.map(e=>adapt(e,l));
}
function prescription(block,goal,level,duration){
 if(goal==='boxe') return block==='main'?'4 à 6 rounds · 2 min · repos 45 sec':block==='finisher'?'3 rounds explosifs · repos 30 sec':block==='activation'?'6 min technique + appuis':'3 séries · 30 sec';
 if(goal==='cross'||goal==='hyrox') return block==='main'?(duration>=45?'AMRAP 18 min / EMOM 16 min':'AMRAP 12 min'):block==='finisher'?'For Time 6 min':block==='activation'?'6 min progressif':'3 tours · repos 45 sec';
 if(goal==='hiit') return block==='main'?'40 sec effort / 20 sec repos · 4 tours':block==='finisher'?'Tabata 4 min':block==='activation'?'5 min montée progressive':'3 tours';
 if(goal==='mobilite') return block==='main'?'45 à 60 sec par mouvement':block==='finisher'?'respiration 3 min':block==='activation'?'mobilité douce 5 min':'2 tours lent';
 if(level==='expert') return block==='main'?'5 séries · 8-12 reps · repos 60 sec':block==='finisher'?'8 min haute intensité':'3-4 séries';
 return block==='main'?'3-4 séries · 10-15 reps · repos 45 sec':block==='finisher'?'6 min contrôlé':block==='activation'?'5 min progressif':'3 séries · 30-45 sec';
}
function titleFor(g,l){let m={full:'Full Body intelligent',force:'Force / Musculation',hiit:'HIIT brûle graisse',boxe:'Boxe conditioning',cross:'Cross Training terrain',hyrox:'Hyrox / Conditioning',mobilite:'Mobilité recovery',circuit:'Circuit Training',renfo:'Renforcement complet',explosivite:'Explosivité'};return `${m[g]||'Séance FAFATRAINING'} · ${l}`}
function generate(cfg,exs){
 let level=cfg.level&&cfg.level!=='choisir'?cfg.level:'intermediaire',goal=cfg.goal||'full',used=new Set(),h=hist();
 let base=exs.filter(e=>safeFor(e,cfg.injury)&&hasEq(e,cfg.equipment));
 if(base.length<12)base=exs.filter(e=>safeFor(e,cfg.injury));
 let activation=base.filter(e=>e.group==='mobilite'||e.group==='cardio');
 let main=base.filter(e=>goalMatch(e,goal)&&e.group!=='mobilite');
 let core=base.filter(e=>e.group==='core');
 let fin=base.filter(e=> goal==='boxe'?['boxe','cardio'].includes(e.group): goal==='mobilite'?e.group==='mobilite': e.group==='cardio'||['Cross Training','Carry','Hinge'].includes(e.pattern));
 let mainCount=cfg.duration>=45?6:4;if(cfg.fatigue>=4)mainCount=Math.max(3,mainCount-1);if(level==='expert')mainCount+=1;
 let s={title:titleFor(goal,level),meta:{goal,level,duration:`${cfg.duration||30} min`,equipment:cfg.equipment||'tous',injury:cfg.injury||'aucune',stress:cfg.stress||3,fatigue:cfg.fatigue||3},blocks:{}};
 s.blocks.activation=pick(activation.length?activation:base,3,level,used,cfg,h).map(e=>({...e,prescription:prescription('activation',goal,level,cfg.duration)}));
 s.blocks.main=pick(main.length?main:base,mainCount,level,used,cfg,h).map(e=>({...e,prescription:prescription('main',goal,level,cfg.duration)}));
 s.blocks.assistance=pick(core.length?core:base,3,level,used,cfg,h).map(e=>({...e,prescription:prescription('assistance',goal,level,cfg.duration)}));
 s.blocks.finisher=pick(fin.length?fin:base,cfg.fatigue>=4?2:3,level,used,cfg,h).map(e=>({...e,prescription:prescription('finisher',goal,level,cfg.duration)}));
 saveHist([...h,...Object.values(s.blocks).flat().map(e=>e.id)]);
 return s;
}
function flatten(s){return Object.entries(s.blocks).flatMap(([block,items])=>items.map(e=>({...e,block})))}
return {generate,flatten,blockLabels,blockSub};
})();
