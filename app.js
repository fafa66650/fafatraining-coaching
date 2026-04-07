
let EXERCISES = [];
const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],
  ['mat','Tapis de sol'],
  ['dumbbell','Haltères'],
  ['barbell','Barre olympique / standard'],
  ['bench','Banc'],
  ['rack','Rack / cage'],
  ['cable','Poulie / vis-à-vis'],
  ['machine','Machines guidées'],
  ['kettlebell','Kettlebell'],
  ['trx','TRX / sangles'],
  ['battle_rope','Battle rope'],
  ['treadmill','Tapis de course'],
  ['bike','Vélo'],
  ['elliptical','Elliptique'],
  ['rower','Rameur'],
  ['airbike','Air bike'],
  ['med_ball','Medicine ball'],
  ['heavy_bag','Sac de frappe'],
  ['pads','Pattes d’ours'],
  ['gloves','Gants'],
  ['rope','Corde à sauter'],
  ['ladder','Échelle de rythme'],
  ['ab_wheel','Roue abdos'],
  ['trap_bar','Trap bar'],
  ['band','Élastiques'],
  ['sled','Traîneau'],
  ['skierg','SkiErg'],
  ['dip_bars','Barres dips'],
  ['landmine','Landmine'],
  ['box','Plyo box / step'],
  ['chair','Chaise'],
  ['sofa','Canapé / rebord stable'],
  ['stairs','Marches / escalier'],
  ['backpack','Sac à dos lestable'],
  ['water_bottles','Bouteilles d’eau / bidons'],
  ['foam_roller','Foam roller / rouleau'],
  ['towel','Serviette']
];
const ENV_LABELS = {
  gym:'Salle de musculation',
  crossfit_box:'Salle CrossFit / Hyrox',
  boxing_gym:'Salle de boxe',
  home:'Maison / appartement',
  outdoor:'Extérieur',
  bodyweight_only:'Poids du corps uniquement'
};
const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','treadmill','bike','elliptical','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles','towel']
};
const goalLabels = {
  muscle_gain:'Prise de muscle',
  fat_loss:'Perte de poids',
  strength:'Force',
  conditioning:'Condition physique / HIIT',
  boxing:'Boxe',
  hyrox:'Hyrox / fonctionnel',
  endurance:'Cardio / endurance',
  mobility:'Mobilité / souplesse',
  recovery:'Bien-être / récupération',
  core:'Abdos / gainage'
};

function $(sel){ return document.querySelector(sel); }
function $$(sel){ return [...document.querySelectorAll(sel)]; }
function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function levelValue(v){ return ({beginner:1, intermediate:2, advanced:3}[v] || 1); }
function rootName(name){ return name.replace(/\s+—\s+.*$/,'').trim(); }
function eqLabel(v){ return (EQUIPMENTS.find(x=>x[0]===v)||[v,v])[1]; }
function labelForGoal(v){ return goalLabels[v] || v; }

function goView(id){
  $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===id));
}
function initNav(){ $$('.navbtn').forEach(btn=>btn.addEventListener('click', ()=>goView(btn.dataset.view))); }
function bindHeroButtons(){
  const cp = $('#homeCreateProgram');
  const lb = $('#homeOpenLibrary');
  if(cp) cp.addEventListener('click', ()=>goView('coach'));
  if(lb) lb.addEventListener('click', ()=>goView('library'));
}
async function init(){
  EXERCISES = await fetch('data/exercises.json').then(r=>r.json());
  $('#exerciseCount').textContent = EXERCISES.length;
  initNav();
  bindHeroButtons();
  buildEquipmentGrid();
  buildLibraryFilters();
  renderLibrary();
  loadTracking();
  hydrateAthleteFromLink();
}
function buildEquipmentGrid(){
  $('#equipmentGrid').innerHTML = EQUIPMENTS.map(([k,l])=>`<label class="chk"><input type="checkbox" value="${k}"> <span>${l}</span></label>`).join('');
  applyEquipmentPreset();
  $('#environmentSelect').addEventListener('change', applyEquipmentPreset);
}
function applyEquipmentPreset(){
  const env = $('#environmentSelect').value;
  const preset = PRESETS[env] || [];
  $$('#equipmentGrid input').forEach(i => i.checked = preset.includes(i.value));
  $('#presetLabel').textContent = `Préselection : ${ENV_LABELS[env] || env}`;
}
function buildLibraryFilters(){
  const cats = [''].concat([...new Set(EXERCISES.map(e=>e.category))]).filter((v,i,a)=>a.indexOf(v)===i);
  $('#libCategory').innerHTML = cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML = [''].concat(Object.keys(ENV_LABELS)).map(v=>`<option value="${v}">${v ? ENV_LABELS[v] : 'Tous les lieux'}</option>`).join('');
}
function selectedEquipment(){ return $$('#equipmentGrid input:checked').map(i=>i.value); }

function normalizeArea(area){
  if(area==='push') return 'haut_du_corps';
  if(area==='pull') return 'haut_du_corps';
  return area;
}
function categoryMap(main, second){
  const goals=[main, second].filter(Boolean);
  const map={
    muscle_gain:['musculation','core'],
    fat_loss:['hiit','cardio','musculation','core'],
    strength:['musculation','core'],
    conditioning:['hiit','cardio','hyrox','core'],
    boxing:['boxe','hiit','core','cardio'],
    hyrox:['hyrox','cardio','musculation','core','hiit'],
    endurance:['cardio','hiit','mobilité'],
    mobility:['mobilité','bien_etre','core'],
    recovery:['bien_etre','mobilité'],
    core:['core','mobilité','bien_etre']
  };
  return [...new Set(goals.flatMap(g=>map[g]||['musculation']))];
}
function specificityMatches(ex, area, focus){
  const normArea = normalizeArea(area);
  const areaOk = !normArea || (ex.areas||[]).includes(normArea);
  if(!focus) return areaOk;
  const focusOk = (ex.focus||[]).includes(focus);
  return areaOk && focusOk;
}
function buildPrescription(ex, mainGoal, level, hiitFormat, rmMap){
  const isBegin = level==='beginner', isInter=level==='intermediate', isAdv = level==='advanced';
  let series='3 séries', reps='10-12 reps', rest='60 sec', tempo='2-0-2', intensity='modérée', loadText='à ajuster selon technique';
  const lowerName = ex.name.toLowerCase();

  if (ex.category==='hiit'){
    series = hiitFormat==='EMOM' ? '10 à 16 minutes' : hiitFormat==='AMRAP' ? '10 à 20 minutes' : '4 à 8 tours';
    reps = hiitFormat==='EMOM' ? '1 bloc / minute' : hiitFormat==='AMRAP' ? 'enchaîner le plus de tours proprement' : `${hiitFormat} travail / repos`;
    rest = hiitFormat==='EMOM' || hiitFormat==='AMRAP' ? 'intégré au format' : 'inclus dans le format';
    tempo = 'athlétique';
    intensity = isAdv ? 'élevée' : isInter ? 'soutenue' : 'progressive';
  } else if (ex.category==='cardio'){
    series='1 bloc';
    reps = lowerName.includes('sprint') ? '8 à 12 efforts' : (lowerName.includes('intervalles') ? '8 à 20 min' : '12 à 30 min');
    rest = (lowerName.includes('intervalles') || lowerName.includes('sprint')) ? 'selon format' : 'continu';
    tempo = 'cadence régulière';
    intensity = mainGoal==='fat_loss' ? 'modérée à soutenue' : 'endurance contrôlée';
  } else if (ex.category==='boxe'){
    series = isBegin ? '4 rounds' : isInter ? '5 rounds' : '6 rounds';
    reps = isBegin ? '1 min 30 à 2 min / round' : '2 à 3 min / round';
    rest = '45 à 60 sec';
    tempo = 'fluide / explosif';
    intensity = 'technique + cardio';
  } else if (['mobilité','bien_etre'].includes(ex.category)){
    series='2 à 4 séries';
    reps = ex.category==='bien_etre' ? '2 à 8 min' : '30 à 60 sec ou 6 à 10 reps';
    rest='respiration libre';
    tempo='lent et contrôlé';
    intensity='faible';
  } else if (ex.category==='hyrox'){
    series = isBegin ? '3 à 4 séries' : '4 à 5 séries';
    reps = (lowerName.includes('carry') || lowerName.includes('sled')) ? '20 à 40 m' : '10 à 20 reps';
    rest = isBegin ? '75 sec' : '60 sec';
    tempo='athlétique';
    intensity='soutenue';
  } else {
    if (mainGoal==='strength'){
      series = isBegin ? '4 séries' : '5 séries';
      reps = isBegin ? '6 à 8 reps' : '4 à 6 reps';
      rest = isBegin ? '90 sec' : '2 à 3 min';
      tempo='3-1-1';
      intensity='lourde';
    } else if (mainGoal==='muscle_gain'){
      series = isBegin ? '3 à 4 séries' : '4 séries';
      reps = ex.subcategory==='abdos' || ex.category==='core' ? '10 à 15 reps / 20 à 40 sec' : '8 à 12 reps';
      rest = ex.subcategory==='abdos' || ex.category==='core' ? '30 à 45 sec' : '60 à 90 sec';
      tempo='2-0-2';
      intensity='modérée à lourde';
    } else if (mainGoal==='fat_loss'){
      series='3 séries';
      reps='12 à 20 reps';
      rest='30 à 45 sec';
      tempo='contrôlé';
      intensity='modérée';
    } else {
      series = ex.category==='core' ? '3 séries' : '3 à 4 séries';
      reps = ex.category==='core' ? '8 à 15 reps ou 30 à 45 sec' : '8 à 15 reps';
      rest = ex.category==='core' ? '30 à 45 sec' : '60 sec';
      tempo='contrôlé';
      intensity='progressive';
    }

    if (lowerName.includes('squat')){
      const rm = rmMap.squat || 0;
      if (rm > 0 && (lowerName.includes('barre') || lowerName.includes('back squat') || lowerName.includes('front squat'))){
        const pct = mainGoal==='strength' ? 0.80 : mainGoal==='muscle_gain' ? 0.72 : 0.60;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM squat)`;
      }
    }
    if (lowerName.includes('développé couché') || lowerName.includes('bench')){
      const rm = rmMap.bench || 0;
      if (rm > 0){
        const pct = mainGoal==='strength' ? 0.80 : mainGoal==='muscle_gain' ? 0.72 : 0.60;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM bench)`;
      }
    }
    if (lowerName.includes('deadlift') || lowerName.includes('rdl')){
      const rm = rmMap.deadlift || 0;
      if (rm > 0){
        const pct = mainGoal==='strength' ? 0.78 : mainGoal==='muscle_gain' ? 0.70 : 0.58;
        loadText = `${Math.round(rm*pct)} kg environ (${Math.round(pct*100)}% 1RM deadlift)`;
      }
    }
  }
  return {series,reps,rest,tempo,intensity,loadText};
}
function substituteText(ex, env){
  const lower = ex.name.toLowerCase();
  const eq = ex.equipment || [];
  if(env==='home' || env==='bodyweight_only'){
    if(lower.includes('pompes') || lower.includes('dips')) return 'Substitut maison : chaise, canapé stable ou plan de travail';
    if(lower.includes('row') || lower.includes('rowing') || lower.includes('tirage')) return 'Substitut maison : sac à dos, serviette, bouteilles d’eau';
    if(lower.includes('squat') || lower.includes('fente')) return 'Substitut maison : chaise, marches, sac à dos lesté';
    if(ex.category==='core') return 'Substitut maison : tapis, serviette pliée, canapé pour appui';
  }
  if(env==='outdoor'){
    if(lower.includes('sprint') || ex.category==='cardio') return 'Substitut extérieur : côtes, lignes au sol, escaliers';
    if(lower.includes('carry')) return 'Substitut extérieur : sac à dos lesté, bidons';
  }
  return '';
}
function displayMode(level, coachView){
  if(coachView) return 'coach';
  if(level==='beginner') return 'beginner';
  if(level==='advanced') return 'advanced';
  return 'intermediate';
}

function pickUniqueFrom(arr, n){
  const chosen = [];
  const seenRoots = new Set();
  for(const ex of shuffle(arr)){
    const rn = rootName(ex.name);
    if(seenRoots.has(rn)) continue;
    chosen.push(ex);
    seenRoots.add(rn);
    if(chosen.length>=n) break;
  }
  return chosen;
}
function buildDayBlueprints(freq, mainGoal, secondGoal, area, focus){
  const a = normalizeArea(area);
  if(a==='haut_du_corps' && (focus==='pectoraux' || focus==='épaules' || focus==='bras' || focus==='triceps')){
    return Array.from({length:freq}, (_,i)=>({title:`Haut du corps ${i+1}`, cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:focus}));
  }
  if(a==='haut_du_corps' && (focus==='dos' || focus==='biceps')){
    return Array.from({length:freq}, (_,i)=>({title:`Haut du corps ${i+1}`, cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:focus}));
  }
  if(a==='bas_du_corps' || focus==='jambes' || focus==='quadriceps' || focus==='ischios'){
    return Array.from({length:freq}, (_,i)=>({
      title: freq===2 ? `Bas du corps ${i+1}` : i===0 ? 'Quadriceps / poussée jambe' : i===1 ? 'Chaîne postérieure' : `Bas du corps ${i+1}`,
      cats:['musculation','core','mobilité'],
      areas:['bas_du_corps','abdos_core'],
      focus:(focus==='quadriceps' || focus==='ischios' || focus==='jambes') ? focus : 'jambes'
    }));
  }
  if(a==='abdos_core' || focus==='abdos'){
    return Array.from({length:freq}, (_,i)=>({title:`Abdos / core ${i+1}`, cats:['core','mobilité','bien_etre'], areas:['abdos_core'], focus:'abdos'}));
  }

  if(mainGoal==='muscle_gain' || mainGoal==='strength'){
    if(freq===2) return [
      {title:'Full body 1', cats:['musculation','core'], areas:['full_body','abdos_core'], focus:focus || ''},
      {title:'Full body 2', cats:['musculation','core'], areas:['full_body','abdos_core'], focus:focus || ''}
    ];
    if(freq===3) return [
      {title:'Full body 1', cats:['musculation','core'], areas:['full_body','abdos_core'], focus:focus || ''},
      {title:'Haut du corps 1', cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:focus || ''},
      {title:'Bas du corps / core', cats:['musculation','core','mobilité'], areas:['bas_du_corps','abdos_core'], focus:focus || ''}
    ];
    return [
      {title:'Bas du corps 1', cats:['musculation','core'], areas:['bas_du_corps','abdos_core'], focus:'jambes'},
      {title:'Haut du corps 1', cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:'pectoraux'},
      {title:'Bas du corps 2 / core', cats:['musculation','core'], areas:['bas_du_corps','abdos_core'], focus:'ischios'},
      {title:'Haut du corps 2', cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:'dos'},
      {title:'Mix complet', cats:['musculation','core','mobilité'], areas:['full_body','abdos_core'], focus:''}
    ].slice(0,freq);
  }
  if(mainGoal==='boxing'){
    return [
      {title:'Technique / appuis', cats:['boxe','core'], areas:['full_body','abdos_core'], focus:'global'},
      {title:'Cardio boxe', cats:['boxe','hiit','cardio'], areas:['full_body'], focus:'cardio'},
      {title:'Renforcement boxeur', cats:['musculation','core','boxe'], areas:['haut_du_corps','abdos_core'], focus:'épaules'},
      {title:'Rounds / puissance', cats:['boxe','hiit','core'], areas:['full_body'], focus:'global'}
    ].slice(0,freq);
  }
  if(mainGoal==='conditioning' || mainGoal==='fat_loss'){
    return [
      {title:'Circuit full body', cats:['hiit','musculation','core'], areas:['full_body','abdos_core'], focus:'global'},
      {title:'Cardio / intervalles', cats:['cardio','hiit'], areas:['full_body'], focus:'cardio'},
      {title:'Renfo + core', cats:['musculation','core'], areas:['full_body','abdos_core'], focus:'abdos'},
      {title:'Conditioning mix', cats:['hiit','hyrox','cardio'], areas:['full_body'], focus:'cardio'}
    ].slice(0,freq);
  }
  if(mainGoal==='hyrox'){
    return [
      {title:'Jambes / charge', cats:['musculation','hyrox','core'], areas:['bas_du_corps','abdos_core'], focus:'jambes'},
      {title:'Machines / cardio', cats:['cardio','hyrox'], areas:['full_body'], focus:'cardio'},
      {title:'Carry / sled / wall ball', cats:['hyrox','core'], areas:['full_body'], focus:'global'},
      {title:'Mix complet Hyrox', cats:['hyrox','cardio','musculation'], areas:['full_body'], focus:'cardio'}
    ].slice(0,freq);
  }
  if(mainGoal==='endurance'){
    return [
      {title:'Endurance 1', cats:['cardio','mobilité'], areas:['full_body'], focus:'cardio'},
      {title:'Intervalles', cats:['cardio','hiit'], areas:['full_body'], focus:'cardio'},
      {title:'Renfo coureur', cats:['musculation','core','mobilité'], areas:['bas_du_corps','abdos_core'], focus:'jambes'}
    ].slice(0,freq);
  }
  if(mainGoal==='mobility' || mainGoal==='recovery' || mainGoal==='core'){
    return Array.from({length:freq}, (_,i)=>({
      title: mainGoal==='core' ? `Abdos / core ${i+1}` : `Mobilité / récupération ${i+1}`,
      cats: mainGoal==='core' ? ['core','mobilité','bien_etre'] : ['mobilité','bien_etre','core'],
      areas:['full_body','abdos_core'],
      focus: mainGoal==='core' ? 'abdos' : ''
    }));
  }
  return Array.from({length:freq}, (_,i)=>({
    title:`Séance ${i+1}`,
    cats:categoryMap(mainGoal, secondGoal),
    areas:['full_body','abdos_core'],
    focus:focus || ''
  }));
}
function filterPool(bp, env, level, equipment){
  return EXERCISES.filter(ex => {
    const catOk = bp.cats.includes(ex.category);
    const areaOk = bp.areas.some(a => (ex.areas||[]).includes(a));
    const focusOk = !bp.focus || (ex.focus||[]).includes(bp.focus);
    const envOk = ex.environments.includes(env) ||
      (env==='crossfit_box' && (ex.environments.includes('gym')||ex.environments.includes('crossfit_box'))) ||
      (env==='boxing_gym' && (ex.environments.includes('gym')||ex.environments.includes('boxing_gym')));
    const levelOk = levelValue(ex.level) <= levelValue(level);
    const eqOk = ex.equipment.some(eq => equipment.includes(eq) || eq==='bodyweight');
    return catOk && areaOk && focusOk && envOk && levelOk && eqOk;
  });
}
function buildWarmup(mainGoal, secondGoal, area){
  const lines = ['3 à 5 min de mise en route progressive'];
  if(mainGoal==='boxing' || secondGoal==='boxing') lines.push('Corde à sauter ou shadow boxing léger 2 à 4 min');
  if(mainGoal==='hyrox' || secondGoal==='hyrox') lines.push('Activation hanches / chevilles + locomotion');
  if(mainGoal==='muscle_gain' || mainGoal==='strength') lines.push('2 à 3 séries de chauffe progressives sur le 1er mouvement');
  if(normalizeArea(area)==='haut_du_corps') lines.push('Mobilité épaules / scapulas / T-spine');
  if(normalizeArea(area)==='bas_du_corps') lines.push('Mobilité hanches / chevilles / genoux');
  if(normalizeArea(area)==='abdos_core') lines.push('Respiration / gainage basse intensité');
  return [...new Set(lines)];
}
function buildCooldown(mainGoal, secondGoal){
  const lines = ['Retour au calme 3 à 5 min', 'Respiration lente 1 à 2 min'];
  if(['boxing','conditioning','hyrox','fat_loss','endurance'].includes(mainGoal) || ['boxing','conditioning','hyrox','fat_loss','endurance'].includes(secondGoal)){
    lines.push('Mobilité douce + baisse progressive du rythme cardiaque');
  } else {
    lines.push('Étirements doux ciblés sur les zones travaillées');
  }
  return lines;
}
function computeExercisesPerDay(duration, mainGoal){
  const d = Number(duration||60);
  if(['mobility','recovery'].includes(mainGoal)) return d>=60 ? 5 : 4;
  if(d>=90) return 8;
  if(d>=75) return 7;
  if(d>=60) return 6;
  if(d>=45) return 5;
  return 4;
}
function explainAthleteSave(program){
  return `Le programme ${program.code} est maintenant stocké côté application. Tu peux soit donner le code à l’adhérent, soit lui envoyer le lien direct en lecture seule.`;
}

function validateCoachInputs(){
  const mainGoal = $('#mainGoal').value;
  const freq = Number($('#clientFreq').value||0);
  const duration = Number($('#clientDuration').value||0);
  if(!mainGoal){ alert('Choisis un objectif principal.'); return false; }
  if(!freq || !duration){ alert('Renseigne la fréquence et la durée.'); return false; }
  return true;
}

function generateProgram(){
  if(!validateCoachInputs()) return;
  const name = $('#clientName').value.trim() || 'Client FAFATRAINING';
  const code = ($('#clientCode').value.trim() || '').toUpperCase() || ('FT'+Math.floor(Math.random()*9000+1000));
  $('#clientCode').value = code;
  const level = $('#clientLevel').value;
  const freq = Number($('#clientFreq').value||3);
  const duration = Number($('#clientDuration').value||60);
  const env = $('#environmentSelect').value;
  const mainGoal = $('#mainGoal').value;
  const secondGoal = $('#secondGoal').value;
  const hiitFormat = $('#hiitFormat').value;
  const bodyArea = $('#bodyArea') ? $('#bodyArea').value : '';
  const focusTarget = $('#focusTarget') ? $('#focusTarget').value : '';
  const equipment = selectedEquipment();
  const rmMap = {
    squat:Number($('#rmSquat').value||0),
    bench:Number($('#rmBench').value||0),
    deadlift:Number($('#rmDeadlift').value||0)
  };

  const blueprints = buildDayBlueprints(freq, mainGoal, secondGoal, bodyArea, focusTarget);
  const perDay = computeExercisesPerDay(duration, mainGoal);
  const warmup = buildWarmup(mainGoal, secondGoal, bodyArea);
  const cooldown = buildCooldown(mainGoal, secondGoal);

  const days = blueprints.map(bp => {
    let pool = filterPool(bp, env, level, equipment);
    if(!pool.length) pool = EXERCISES.filter(ex => bp.cats.includes(ex.category));
    const prim = pickUniqueFrom(pool.filter(e => ['musculation','hyrox','boxe'].includes(e.category)), Math.max(2, Math.ceil(perDay/3)));
    const support = pickUniqueFrom(pool.filter(e => ['core','mobilité','bien_etre'].includes(e.category)), Math.max(1, Math.floor(perDay/4)));
    const condition = pickUniqueFrom(pool.filter(e => ['hiit','cardio'].includes(e.category)), Math.max(1, Math.floor(perDay/4)));
    let chosen = [...prim, ...support, ...condition];
    if(chosen.length < perDay){
      const avoid = new Set(chosen.map(x=>rootName(x.name)));
      for(const ex of shuffle(pool)){
        if(avoid.has(rootName(ex.name))) continue;
        chosen.push(ex);
        avoid.add(rootName(ex.name));
        if(chosen.length>=perDay) break;
      }
    }
    chosen = chosen.slice(0, perDay).map(ex => ({...ex, prescription: buildPrescription(ex, mainGoal, level, hiitFormat, rmMap), substitute: substituteText(ex, env)}));
    return {title: bp.title, items: chosen};
  });

  const athleteLink = `${location.origin}${location.pathname}?client=${encodeURIComponent(code)}`;
  const program = {name, code, level, freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, hiitFormat, warmup, cooldown, days, rmMap, athleteLink, createdAt:new Date().toISOString()};
  window.currentProgram = program;
  $('#programOutput').innerHTML = renderProgram(program, true);
}
function exerciseHtml(ex, mode){
  const showCoach = mode==='coach';
  const showBeginner = mode==='beginner' || mode==='coach';
  const showIntermediate = mode==='intermediate' || mode==='coach';
  const showAdvanced = mode==='advanced' || mode==='coach';
  return `
    <div class="ex-item">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.subcategory)}</span>
        ${showCoach ? `<span class="badge">${esc(ex.level)}</span>` : ''}
      </div>
      <strong>${esc(ex.name)}</strong><br>
      <span class="line"><strong>${esc(ex.prescription.series)}</strong> · <strong>${esc(ex.prescription.reps)}</strong> · repos <strong>${esc(ex.prescription.rest)}</strong>${showCoach || showAdvanced ? ` · tempo <strong>${esc(ex.prescription.tempo)}</strong>` : ''}</span><br>
      ${showCoach ? `Muscles : ${esc(ex.muscles)}<br>` : ''}
      ${showBeginner ? `Consigne : ${esc(ex.cue)}<br>` : ''}
      ${(showCoach || showIntermediate) && ex.substitute ? `Substitut utile : ${esc(ex.substitute)}<br>` : ''}
      ${(showCoach || showBeginner || showIntermediate) ? `Variante facile : ${esc(ex.easy)} · Variante avancée : ${esc(ex.hard)}<br>` : ''}
      ${showCoach ? `Intensité : ${esc(ex.prescription.intensity)} · Charge : ${esc(ex.prescription.loadText)}` : ''}
    </div>`;
}
function renderProgram(p, coachView){
  const mode = displayMode(p.level, coachView);
  return `
    <div class="summary">
      <h3>${esc(p.name)} · ${esc(p.code)}</h3>
      <p><strong>Objectif principal :</strong> ${esc(labelForGoal(p.mainGoal))} ${p.secondGoal ? `· <strong>objectif secondaire :</strong> ${esc(labelForGoal(p.secondGoal))}`:''}</p>
      <p><strong>Niveau :</strong> ${esc(p.level)} · <strong>Fréquence :</strong> ${p.freq} / semaine · <strong>Durée :</strong> ${p.duration} min · <strong>Contexte :</strong> ${esc(ENV_LABELS[p.env] || p.env)}</p>
      ${(p.bodyArea || p.focusTarget) ? `<p><strong>Zone :</strong> ${esc(p.bodyArea || 'mix complet')} · <strong>Focus :</strong> ${esc(p.focusTarget || 'aucun')}</p>` : ''}
      <div class="meta">${p.warmup.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</div>
      ${coachView ? `<div class="actions" style="margin-top:12px"><button class="ghost" onclick="generateShareLink()">Copier le lien adhérent</button><button class="ghost" onclick="saveForAthlete()">Enregistrer pour l’adhérent</button></div>` : ''}
    </div>
    <div class="program-days">
      ${p.days.map(day=>`
        <article class="day-card">
          <h4>${esc(day.title)}</h4>
          ${day.items.map(ex=>exerciseHtml(ex, mode)).join('')}
          <div class="cooldown-box"><strong>Retour au calme :</strong> ${p.cooldown.map(x=>esc(x)).join(' · ')}</div>
        </article>
      `).join('')}
    </div>`;
}
function saveForAthlete(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  all[window.currentProgram.code] = window.currentProgram;
  localStorage.setItem('fafaPrograms', JSON.stringify(all));
  alert(explainAthleteSave(window.currentProgram));
}
function generateShareLink(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const msg = `Lien adhérent prêt à envoyer. Il ouvre directement le programme en lecture seule : ${window.currentProgram.athleteLink}`;
  if(navigator.clipboard){
    navigator.clipboard.writeText(window.currentProgram.athleteLink);
    alert(msg);
  } else {
    alert(msg);
  }
}
function printProgram(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  const logo = 'assets/logo.jpeg';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Programme FAFATRAINING</title><style>
    body{font-family:Arial,Helvetica,sans-serif;padding:24px;background:#f7f7f7;color:#111}
    .page{max-width:980px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:18px;overflow:hidden}
    .head{position:relative;padding:24px 24px 18px;background:#0c1016;color:#fff}
    .head:after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(142,255,0,.08),transparent 35%,rgba(88,183,255,.07),transparent 70%);pointer-events:none}
    .brand{display:flex;gap:16px;align-items:center}
    .brand img{width:88px;height:88px;border-radius:50%;object-fit:cover}
    .title{font-size:32px;font-weight:800;margin:0}
    .sub{color:#9BFF00;font-weight:700;margin-top:4px}
    .meta{padding:18px 24px;border-bottom:1px solid #e6e6e6}
    .day{margin:18px 24px;padding:16px;border:1px solid #dfe4ea;border-radius:14px}
    .day h2{margin:0 0 10px}
    .item{padding:10px 0;border-top:1px solid #ececec}
    .item:first-child{border-top:none}
    .tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef6e8;color:#244400;font-size:12px;font-weight:700;margin:0 4px 6px 0}
    .notes{margin:20px 24px 24px;padding:14px;border:1px dashed #bbb;border-radius:12px}
  </style></head><body>
    <div class="page">
      <div class="head">
        <div class="brand">
          <img src="${logo}">
          <div>
            <div class="title">FAFATRAINING ELITE SYSTEM</div>
            <div class="sub">Forge ton corps. Élite ton mental.</div>
          </div>
        </div>
      </div>
      <div class="meta">
        <strong>${window.currentProgram.name}</strong> · ${window.currentProgram.code}<br>
        Objectif principal : ${labelForGoal(window.currentProgram.mainGoal)}${window.currentProgram.secondGoal ? ' · Objectif secondaire : '+labelForGoal(window.currentProgram.secondGoal) : ''}<br>
        Niveau : ${window.currentProgram.level} · Fréquence : ${window.currentProgram.freq}/semaine · Durée : ${window.currentProgram.duration} min · Contexte : ${ENV_LABELS[window.currentProgram.env] || window.currentProgram.env}
      </div>
      ${window.currentProgram.days.map(d=>`<div class="day"><h2>${d.title}</h2>${d.items.map(ex=>`<div class="item">
        <div><span class="tag">${ex.category}</span><span class="tag">${ex.subcategory}</span></div>
        <strong>${ex.name}</strong><br>
        Séries : ${ex.prescription.series} · Rép / temps : ${ex.prescription.reps} · Repos : ${ex.prescription.rest}${ex.prescription.tempo ? ' · Tempo : '+ex.prescription.tempo : ''}<br>
        Consigne : ${ex.cue}<br>
        ${ex.substitute ? 'Substitut utile : '+ex.substitute+'<br>' : ''}
        Variante facile : ${ex.easy} · Variante avancée : ${ex.hard}
      </div>`).join('')}</div>`).join('')}
      <div class="notes"><strong>Notes coach / client :</strong><br><br>..........................................................................................................................<br><br>..........................................................................................................................</div>
    </div>
  </body></html>`);
  w.document.close();
  w.focus();
}
function renderLibrary(){
  const cat = $('#libCategory').value;
  const level = $('#libLevel').value;
  const env = $('#libEnv').value;
  const focus = ($('#libFocus') ? $('#libFocus').value : '');
  const q = ($('#libSearch').value||'').toLowerCase().trim();
  const lvl = {beginner:1, intermediate:2, advanced:3};
  const arr = EXERCISES.filter(ex => 
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || ex.environments.includes(env)) &&
    (!focus || (ex.focus||[]).includes(focus)) &&
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...(ex.tags||[]),...(ex.focus||[])].join(' ').toLowerCase().includes(q))
  );
  const statsBox = document.getElementById('libraryStats');
  if(statsBox){ statsBox.textContent = `${arr.length} exercice(s) affiché(s) sur ${EXERCISES.length}.`; }
  $('#libraryOutput').innerHTML = arr.map(ex=>`
    <article class="library-card">
      <div class="meta">
        <span class="badge">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.subcategory)}</span>
        <span class="badge">${esc(ex.level)}</span>
      </div>
      <h4>${esc(ex.name)}</h4>
      <p><strong>Muscles :</strong> ${esc(ex.muscles)}</p>
      <p><strong>Lieux :</strong> ${esc(ex.environments.map(v=>ENV_LABELS[v] || v).join(', '))}</p>
      <p><strong>Matériel :</strong> ${esc((ex.equipment||[]).map(eqLabel).join(', '))}</p>
      <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
      <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
      ${substituteText(ex,'home') ? `<p><strong>Substitut maison :</strong> ${esc(substituteText(ex,'home'))}</p>` : ''}
    </article>
  `).join('');
}
function openAthleteProgram(){
  const code = ($('#athleteCode').value||'').trim().toUpperCase();
  const all = JSON.parse(localStorage.getItem('fafaPrograms')||'{}');
  const p = all[code];
  if(!p){ alert('Aucun programme trouvé pour ce code.'); return; }
  window.athleteProgram = p;
  $('#athleteLobby').classList.add('hidden');
  $('#athleteProgram').classList.remove('hidden');
  $('#athleteProgramOutput').innerHTML = renderProgram(p, false);
}
function hydrateAthleteFromLink(){
  const params = new URLSearchParams(location.search);
  const code = (params.get('client') || '').trim().toUpperCase();
  if(code){
    goView('athlete');
    $('#athleteCode').value = code;
    setTimeout(()=>openAthleteProgram(), 200);
  }
}
function backAthlete(){
  $('#athleteProgram').classList.add('hidden');
  $('#liveSession').classList.add('hidden');
  $('#athleteLobby').classList.remove('hidden');
}
function startLiveSession(){
  if(!window.athleteProgram) return;
  window.liveFlat = window.athleteProgram.days.flatMap(d => d.items.map(x=>({...x, day:d.title})));
  window.liveIndex = 0;
  $('#liveSession').classList.remove('hidden');
  renderLive();
}
function renderLive(){
  const ex = window.liveFlat[window.liveIndex];
  $('#liveCard').innerHTML = `
    <div class="meta"><span class="badge">${esc(ex.day)}</span><span class="badge">${esc(ex.category)}</span></div>
    <h3>${esc(ex.name)}</h3>
    <p class="big">${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</p>
    <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
    ${ex.substitute ? `<p><strong>Substitut utile :</strong> ${esc(ex.substitute)}</p>` : ''}
    <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
  `;
}
function nextExercise(){ if(window.liveIndex < window.liveFlat.length-1){ window.liveIndex++; renderLive(); } }
function prevExercise(){ if(window.liveIndex > 0){ window.liveIndex--; renderLive(); } }
function backProgram(){ $('#liveSession').classList.add('hidden'); }

function generateQuickSession(){
  const type = $('#quickType').value, level = $('#quickLevel').value, duration = Number($('#quickDuration').value||45), env = $('#quickEnv').value;
  const mood = $('#quickMood') ? $('#quickMood').value : 'standard';
  const format = $('#quickFormat') ? $('#quickFormat').value : 'classic';
  const map = {
    muscle_gain:['musculation','core'],
    conditioning:['hiit','cardio','core'],
    boxing:['boxe','hiit','core'],
    hyrox:['hyrox','cardio','hiit','musculation'],
    mobility:['mobilité','bien_etre','core'],
    endurance:['cardio','hiit','mobilité'],
    core:['core','mobilité']
  };
  const cats = map[type] || ['musculation'];
  const arr = EXERCISES.filter(e => cats.includes(e.category) && (e.environments.includes(env) || env==='bodyweight_only' || e.environments.includes('home')));
  const count = duration>=60 ? 6 : duration>=45 ? 5 : 4;
  const chosen = pickUniqueFrom(arr, count).map(ex => ({...ex, prescription: buildPrescription(ex, type, level, '30/30', {squat:0,bench:0,deadlift:0}), substitute: substituteText(ex, env)}));
  $('#quickOutput').innerHTML = `
    <div class="summary">
      <h3>Session rapide ${esc(type)}</h3>
      <p><strong>Niveau :</strong> ${esc(level)} · <strong>Durée :</strong> ${duration} min · <strong>Lieu :</strong> ${esc(ENV_LABELS[env]||env)} · <strong>Ambiance :</strong> ${esc(mood)} · <strong>Format :</strong> ${esc(format)}</p>
    </div>
    <div class="program-days">
      <article class="day-card">
        <h4>Déroulé</h4>
        ${chosen.map((ex,i)=>`
          <div class="ex-item">
            <strong>Bloc ${i+1} : ${esc(ex.name)}</strong><br>
            ${esc(ex.prescription.series)} · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}<br>
            Consigne : ${esc(ex.cue)}${ex.substitute ? `<br>Substitut utile : ${esc(ex.substitute)}` : ''}
          </div>`).join('')}
      </article>
    </div>`;
}
function saveTracking(){
  const code = ($('#trackCode').value||'').trim().toUpperCase();
  const weight = $('#trackWeight').value;
  const note = $('#trackNote').value;
  if(!code){ alert('Ajoute un code.'); return; }
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  all[code] = all[code] || [];
  all[code].push({date:new Date().toLocaleDateString('fr-FR'), weight, note});
  localStorage.setItem('fafaTracking', JSON.stringify(all));
  loadTracking();
}
function loadTracking(){
  const all = JSON.parse(localStorage.getItem('fafaTracking')||'{}');
  const rows = Object.entries(all).flatMap(([code,items]) => items.map(it=>({code,...it}))).reverse();
  const totalClients = Object.keys(all).length;
  const totalEntries = rows.length;
  $('#trackingOutput').innerHTML = `<div class="tracking-summary"><span class="badge">Clients suivis : ${totalClients}</span><span class="badge">Entrées de suivi : ${totalEntries}</span></div>` + rows.map(r=>`<article class="library-card"><h4>${esc(r.code)}</h4><p><strong>Date :</strong> ${esc(r.date)}</p><p><strong>Poids :</strong> ${esc(r.weight || '-')} kg</p><p><strong>Note :</strong> ${esc(r.note || '')}</p></article>`).join('');
}
init();
