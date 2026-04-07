
let EXERCISES = [];
const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['dumbbell','Haltères'],['barbell','Barre olympique / standard'],['bench','Banc'],['rack','Rack / cage'],
  ['cable','Poulie / vis-à-vis'],['machine','Machines guidées'],['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],
  ['treadmill','Tapis de course'],['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],
  ['med_ball','Medicine ball'],['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],
  ['ladder','Échelle de rythme'],['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],
  ['skierg','SkiErg'],['dip_bars','Barres dips'],['landmine','Landmine'],['box','Plyo box / step']
];
const ENV_LABELS = {
  gym:'Salle de musculation',
  crossfit_box:'Salle CrossFit / Hyrox',
  boxing_gym:'Salle de boxe',
  home:'Maison',
  outdoor:'Extérieur',
  bodyweight_only:'Poids du corps'
};
const PRESETS = {
  gym:['barbell','bench','rack','cable','machine','dumbbell','treadmill','bike','elliptical','rower','landmine','dip_bars'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball'],
  home:['bodyweight','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel'],
  outdoor:['bodyweight','band','ladder','rope','sled','med_ball','box'],
  bodyweight_only:['bodyweight']
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
  recovery:'Bien-être / récupération'
};

function $(sel){ return document.querySelector(sel); }
function $$(sel){ return [...document.querySelectorAll(sel)]; }
function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function levelValue(v){ return ({beginner:1, intermediate:2, advanced:3}[v] || 1); }
function rootName(name){ return name.replace(/\s+—\s+.*$/,'').trim(); }

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
function labelForGoal(v){ return goalLabels[v] || v; }

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
  };
  return [...new Set(goals.flatMap(g=>map[g]||['musculation']))];
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

function baseFilter(ex, env, level, equipment, area, focus){
  const envOk = ex.environments.includes(env) ||
    (env==='crossfit_box' && (ex.environments.includes('gym')||ex.environments.includes('crossfit_box'))) ||
    (env==='boxing_gym' && (ex.environments.includes('gym')||ex.environments.includes('boxing_gym')));
  const levelOk = levelValue(ex.level) <= levelValue(level);
  const equipOk = ex.equipment.some(eq => equipment.includes(eq) || eq==='bodyweight');
  const areaOk = !area || (ex.areas||[]).includes(area);
  const focusOk = !focus || (ex.focus||[]).includes(focus);
  return envOk && levelOk && equipOk && areaOk && focusOk;
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
function fallbackByArea(area){
  if(area==='haut_du_corps') return ['pectoraux','dos','épaules','bras'];
  if(area==='bas_du_corps') return ['jambes'];
  if(area==='abdos_core') return ['abdos'];
  return ['global','cardio','jambes','pectoraux','dos','abdos'];
}
function buildDayBlueprints(freq, mainGoal, secondGoal, area, focus){
  const hasCombat = mainGoal==='boxing' || secondGoal==='boxing';
  const hasConditioning = ['conditioning','hyrox','fat_loss','endurance'].includes(mainGoal) || ['conditioning','hyrox','fat_loss','endurance'].includes(secondGoal);

  if(area==='haut_du_corps'){
    if(freq===2) return [
      {title:'Haut du corps 1', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'pectoraux'},
      {title:'Haut du corps 2', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'dos'}
    ];
    if(freq===3) return [
      {title:'Push / haut du corps', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'pectoraux'},
      {title:'Pull / haut du corps', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'dos'},
      {title:'Épaules / bras / core', cats:['musculation','core'], areas:['haut_du_corps','abdos_core'], focus:focus || 'épaules'}
    ];
  }
  if(area==='bas_du_corps'){
    if(freq===2) return [
      {title:'Bas du corps 1', cats:['musculation','core'], areas:['bas_du_corps'], focus:focus || 'jambes'},
      {title:'Bas du corps 2', cats:['musculation','core','mobilité'], areas:['bas_du_corps','abdos_core'], focus:focus || 'jambes'}
    ];
    if(freq===3) return [
      {title:'Quadriceps / fentes', cats:['musculation','core'], areas:['bas_du_corps'], focus:focus || 'jambes'},
      {title:'Chaîne postérieure', cats:['musculation','core'], areas:['bas_du_corps'], focus:focus || 'jambes'},
      {title:'Jambes + core + mobilité', cats:['musculation','core','mobilité'], areas:['bas_du_corps','abdos_core'], focus:focus || 'jambes'}
    ];
  }
  if(area==='abdos_core'){
    return Array.from({length:freq}, (_,i)=>({
      title: `Core / abdos ${i+1}`,
      cats:['core','mobilité','bien_etre'],
      areas:['abdos_core'],
      focus:'abdos'
    }));
  }

  if(hasCombat && hasConditioning && freq>=4){
    return [
      {title:'Technique boxe', cats:['boxe','core'], areas:['haut_du_corps','full_body'], focus:'global'},
      {title:'Bas du corps / force', cats:['musculation','core'], areas:['bas_du_corps'], focus:'jambes'},
      {title:'Conditioning / HIIT', cats:['hiit','cardio','hyrox'], areas:['full_body'], focus:'cardio'},
      {title:'Haut du corps / puissance', cats:['musculation','boxe','core'], areas:['haut_du_corps'], focus:'dos'}
    ].slice(0,freq);
  }

  if(mainGoal==='muscle_gain' || mainGoal==='strength'){
    if(freq===2) return [
      {title:'Full body 1', cats:['musculation','core'], areas:['full_body'], focus:focus || ''},
      {title:'Full body 2', cats:['musculation','core'], areas:['full_body'], focus:focus || ''}
    ];
    if(freq===3) return [
      {title:'Full body 1', cats:['musculation','core'], areas:['full_body'], focus:focus || ''},
      {title:'Full body 2', cats:['musculation','core'], areas:['full_body'], focus:focus || ''},
      {title:'Full body 3', cats:['musculation','core','mobilité'], areas:['full_body','abdos_core'], focus:focus || ''}
    ];
    return [
      {title:'Bas du corps', cats:['musculation','core'], areas:['bas_du_corps','abdos_core'], focus:focus || 'jambes'},
      {title:'Haut du corps 1', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'pectoraux'},
      {title:'Bas du corps 2 / core', cats:['musculation','core'], areas:['bas_du_corps','abdos_core'], focus:focus || 'jambes'},
      {title:'Haut du corps 2', cats:['musculation','core'], areas:['haut_du_corps'], focus:focus || 'dos'},
      {title:'Rappel / mobilité', cats:['musculation','core','mobilité'], areas:['full_body','abdos_core'], focus:focus || ''}
    ].slice(0,freq);
  }

  if(mainGoal==='fat_loss' || mainGoal==='conditioning'){
    const base = [
      {title:'Circuit full body', cats:['hiit','musculation','core'], areas:['full_body','abdos_core'], focus:focus || 'global'},
      {title:'Cardio / intervalles', cats:['cardio','hiit'], areas:['full_body'], focus:'cardio'},
      {title:'Renfo + core', cats:['musculation','core'], areas:['full_body','abdos_core'], focus:focus || 'abdos'},
      {title:'Conditioning mix', cats:['hiit','hyrox','cardio'], areas:['full_body'], focus:'cardio'}
    ];
    return base.slice(0,freq);
  }

  if(mainGoal==='boxing'){
    const base = [
      {title:'Technique / appuis', cats:['boxe','core'], areas:['full_body','abdos_core'], focus:focus || 'global'},
      {title:'Cardio boxe', cats:['boxe','hiit','cardio'], areas:['full_body'], focus:'cardio'},
      {title:'Renforcement boxeur', cats:['musculation','core','boxe'], areas:['haut_du_corps','abdos_core'], focus:focus || 'épaules'},
      {title:'Rounds / puissance', cats:['boxe','hiit','core'], areas:['full_body'], focus:'global'}
    ];
    return base.slice(0,freq);
  }

  if(mainGoal==='hyrox'){
    const base = [
      {title:'Jambes / charge', cats:['musculation','hyrox','core'], areas:['bas_du_corps','abdos_core'], focus:'jambes'},
      {title:'Machines / cardio', cats:['cardio','hyrox'], areas:['full_body'], focus:'cardio'},
      {title:'Carry / sled / wall ball', cats:['hyrox','core'], areas:['full_body'], focus:'global'},
      {title:'Mix complet Hyrox', cats:['hyrox','cardio','musculation'], areas:['full_body'], focus:'cardio'}
    ];
    return base.slice(0,freq);
  }

  if(mainGoal==='endurance'){
    return [
      {title:'Endurance 1', cats:['cardio','mobilité'], areas:['full_body'], focus:'cardio'},
      {title:'Intervalles', cats:['cardio','hiit'], areas:['full_body'], focus:'cardio'},
      {title:'Renfo coureur', cats:['musculation','core','mobilité'], areas:['bas_du_corps','abdos_core'], focus:'jambes'}
    ].slice(0,freq);
  }

  if(mainGoal==='mobility' || mainGoal==='recovery'){
    return Array.from({length:freq}, (_,i)=>({
      title:`Mobilité / récupération ${i+1}`,
      cats:['mobilité','bien_etre','core'],
      areas:['full_body','abdos_core'],
      focus:focus || ''
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
  return EXERCISES.filter(ex =>
    bp.cats.includes(ex.category) &&
    bp.areas.some(a => (ex.areas||[]).includes(a)) &&
    (!bp.focus || (ex.focus||[]).includes(bp.focus)) &&
    baseFilter(ex, env, level, equipment, '', '')
  );
}
function buildWarmup(mainGoal, secondGoal, area){
  const lines = ['3 à 5 min de mise en route progressive'];
  if(mainGoal==='boxing' || secondGoal==='boxing') lines.push('Corde à sauter ou shadow boxing léger 2 à 4 min');
  if(mainGoal==='hyrox' || secondGoal==='hyrox') lines.push('Activation hanches / chevilles + locomotion');
  if(mainGoal==='muscle_gain' || mainGoal==='strength') lines.push('2 à 3 séries de chauffe progressives sur le 1er mouvement');
  if(area==='haut_du_corps') lines.push('Mobilité épaules / scapulas / T-spine');
  if(area==='bas_du_corps') lines.push('Mobilité hanches / chevilles / genoux');
  if(area==='abdos_core') lines.push('Respiration / gainage basse intensité');
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
function generateProgram(){
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
    if(!pool.length){
      // progressively relax focus/area
      pool = EXERCISES.filter(ex => bp.cats.includes(ex.category) && baseFilter(ex, env, level, equipment, '', ''));
    }
    if(!pool.length){
      pool = EXERCISES.filter(ex => bp.cats.includes(ex.category));
    }

    // split selection by type to avoid generic programs
    const categoryBias = bp.cats;
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
    chosen = chosen.slice(0, perDay).map(ex => ({...ex, prescription: buildPrescription(ex, mainGoal, level, hiitFormat, rmMap)}));
    return {title: bp.title, items: chosen};
  });

  const athleteLink = `${location.origin}${location.pathname}?client=${encodeURIComponent(code)}`;
  const program = {name, code, level, freq, duration, env, mainGoal, secondGoal, bodyArea, focusTarget, hiitFormat, warmup, cooldown, days, rmMap, athleteLink, createdAt:new Date().toISOString()};
  window.currentProgram = program;
  $('#programOutput').innerHTML = renderProgram(program, true);
}
function renderProgram(p, coachView){
  return `
    <div class="summary">
      <h3>${esc(p.name)} · ${esc(p.code)}</h3>
      <p><strong>Objectif principal :</strong> ${esc(labelForGoal(p.mainGoal))} ${p.secondGoal ? `· <strong>objectif secondaire :</strong> ${esc(labelForGoal(p.secondGoal))}`:''}</p>
      <p><strong>Niveau :</strong> ${esc(p.level)} · <strong>Fréquence :</strong> ${p.freq} / semaine · <strong>Durée :</strong> ${p.duration} min · <strong>Environnement :</strong> ${esc(ENV_LABELS[p.env] || p.env)}</p>
      ${(p.bodyArea || p.focusTarget) ? `<p><strong>Zone :</strong> ${esc(p.bodyArea || 'mix complet')} · <strong>Focus :</strong> ${esc(p.focusTarget || 'aucun')}</p>` : ''}
      <div class="meta">${p.warmup.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</div>
      ${coachView ? `<div class="actions" style="margin-top:12px"><button class="ghost" onclick="generateShareLink()">Copier le lien adhérent</button><button class="ghost" onclick="saveForAthlete()">Enregistrer pour l’adhérent</button></div>` : ''}
    </div>
    <div class="program-days">
      ${p.days.map((day,idx)=>`
        <article class="day-card">
          <h4>${esc(day.title)}</h4>
          ${day.items.map(ex=>`
            <div class="ex-item">
              <div class="meta">
                <span class="badge">${esc(ex.category)}</span>
                <span class="badge">${esc(ex.subcategory)}</span>
                <span class="badge">${esc(ex.level)}</span>
              </div>
              <strong>${esc(ex.name)}</strong><br>
              Muscles : ${esc(ex.muscles)}<br>
              Séries : <strong>${esc(ex.prescription.series)}</strong> · Rép / temps : <strong>${esc(ex.prescription.reps)}</strong> · Repos : <strong>${esc(ex.prescription.rest)}</strong>${ex.prescription.tempo ? ` · Tempo : <strong>${esc(ex.prescription.tempo)}</strong>`:''}<br>
              Intensité : ${esc(ex.prescription.intensity)}${coachView ? ` · Charge : ${esc(ex.prescription.loadText)}`:''}<br>
              Consigne : ${esc(ex.cue)}<br>
              Variante facile : ${esc(ex.easy)} · Variante avancée : ${esc(ex.hard)}
            </div>
          `).join('')}
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
  alert(`Programme enregistré pour l’adhérent : ${window.currentProgram.code}`);
}
function generateShareLink(){
  if(!window.currentProgram){ alert('Génère d’abord un programme.'); return; }
  if(navigator.clipboard){
    navigator.clipboard.writeText(window.currentProgram.athleteLink);
    alert(`Lien adhérent copié : ${window.currentProgram.athleteLink}`);
  } else {
    alert(window.currentProgram.athleteLink);
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
        Niveau : ${window.currentProgram.level} · Fréquence : ${window.currentProgram.freq}/semaine · Durée : ${window.currentProgram.duration} min · Environnement : ${ENV_LABELS[window.currentProgram.env] || window.currentProgram.env}
      </div>
      ${window.currentProgram.days.map(d=>`<div class="day"><h2>${d.title}</h2>${d.items.map(ex=>`<div class="item">
        <div><span class="tag">${ex.category}</span><span class="tag">${ex.subcategory}</span></div>
        <strong>${ex.name}</strong><br>
        Séries : ${ex.prescription.series} · Rép / temps : ${ex.prescription.reps} · Repos : ${ex.prescription.rest}${ex.prescription.tempo ? ' · Tempo : '+ex.prescription.tempo : ''}<br>
        Consigne : ${ex.cue}<br>
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
  const q = ($('#libSearch').value||'').toLowerCase().trim();
  const lvl = {beginner:1, intermediate:2, advanced:3};
  const arr = EXERCISES.filter(ex => 
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level] <= lvl[level]) &&
    (!env || ex.environments.includes(env)) &&
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,...(ex.tags||[]),...(ex.focus||[])].join(' ').toLowerCase().includes(q))
  );
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
      <p><strong>Matériel :</strong> ${esc(ex.equipment.map(v => (EQUIPMENTS.find(x=>x[0]===v)||[v,v])[1]).join(', '))}</p>
      <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
      <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
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
    <p><strong>Variante facile :</strong> ${esc(ex.easy)} · <strong>Variante avancée :</strong> ${esc(ex.hard)}</p>
  `;
}
function nextExercise(){ if(window.liveIndex < window.liveFlat.length-1){ window.liveIndex++; renderLive(); } }
function prevExercise(){ if(window.liveIndex > 0){ window.liveIndex--; renderLive(); } }
function backProgram(){ $('#liveSession').classList.add('hidden'); }

function generateQuickSession(){
  const type = $('#quickType').value, level = $('#quickLevel').value, duration = Number($('#quickDuration').value||45), env = $('#quickEnv').value;
  const map = {
    muscle_gain:['musculation','core'],
    conditioning:['hiit','cardio','core'],
    boxing:['boxe','hiit','core'],
    hyrox:['hyrox','cardio','hiit','musculation'],
    mobility:['mobilité','bien_etre','core']
  };
  const cats = map[type] || ['musculation'];
  const arr = EXERCISES.filter(e => cats.includes(e.category) && (e.environments.includes(env) || env==='bodyweight_only' || e.environments.includes('home')));
  const count = duration>=60 ? 6 : duration>=45 ? 5 : 4;
  const chosen = pickUniqueFrom(arr, count);
  $('#quickOutput').innerHTML = `
    <div class="summary">
      <h3>Session rapide ${esc(type)}</h3>
      <p><strong>Niveau :</strong> ${esc(level)} · <strong>Durée :</strong> ${duration} min · <strong>Lieu :</strong> ${esc(ENV_LABELS[env]||env)}</p>
    </div>
    <div class="program-days">
      <article class="day-card">
        <h4>Déroulé</h4>
        ${chosen.map((ex,i)=>{
          const p = buildPrescription(ex, type, level, '30/30', {squat:0,bench:0,deadlift:0});
          return `<div class="ex-item"><strong>Bloc ${i+1} : ${esc(ex.name)}</strong><br>${esc(p.series)} · ${esc(p.reps)} · repos ${esc(p.rest)}<br>Consigne : ${esc(ex.cue)}</div>`;
        }).join('')}
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
  $('#trackingOutput').innerHTML = rows.map(r=>`<article class="library-card"><h4>${esc(r.code)}</h4><p><strong>Date :</strong> ${esc(r.date)}</p><p><strong>Poids :</strong> ${esc(r.weight || '-')} kg</p><p><strong>Note :</strong> ${esc(r.note || '')}</p></article>`).join('');
}
init();
