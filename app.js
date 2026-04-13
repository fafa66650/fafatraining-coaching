
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

let EXERCISES = [];
let currentProgram = null;

const EQUIPMENTS = [
  ['bodyweight','Poids du corps'],['mat','Tapis de sol'],['dumbbell','Haltères'],['barbell','Barre olympique / standard'],
  ['bench','Banc'],['rack','Rack / cage'],['cable','Poulie / vis-à-vis'],['machine','Machines guidées'],
  ['kettlebell','Kettlebell'],['trx','TRX / sangles'],['battle_rope','Battle rope'],['treadmill','Tapis de course'],
  ['bike','Vélo'],['elliptical','Elliptique'],['rower','Rameur'],['airbike','Air bike'],['med_ball','Medicine ball'],
  ['heavy_bag','Sac de frappe'],['pads','Pattes d’ours'],['gloves','Gants'],['rope','Corde à sauter'],['ladder','Échelle de rythme'],
  ['ab_wheel','Roue abdos'],['trap_bar','Trap bar'],['band','Élastiques'],['sled','Traîneau'],['skierg','SkiErg'],
  ['dip_bars','Barres dips'],['landmine','Landmine'],['box','Plyo box / step'],['chair','Chaise'],['sofa','Canapé / rebord stable'],
  ['stairs','Marches / escalier'],['backpack','Sac à dos lestable'],['water_bottles','Bouteilles d’eau / bidons'],['foam_roller','Foam roller / rouleau'],
  ['towel','Serviette'],['sandbag','Sandbag'],['rings','Anneaux'],['pullup_bar','Barre de traction'],['mini_band','Mini-band'],['cones','Plots / balises']
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
  gym:['barbell','bench','rack','cable','machine','dumbbell','bike','rower','landmine','dip_bars','mat'],
  crossfit_box:['barbell','dumbbell','kettlebell','battle_rope','rower','airbike','med_ball','sled','box','skierg','trap_bar','rope','mat'],
  boxing_gym:['bodyweight','heavy_bag','pads','gloves','rope','ladder','band','med_ball','mat'],
  home:['bodyweight','mat','dumbbell','kettlebell','band','trx','bench','bike','ab_wheel','chair','sofa','stairs','backpack','water_bottles','towel'],
  outdoor:['bodyweight','mat','band','ladder','rope','sled','med_ball','box','stairs','backpack','cones'],
  bodyweight_only:['bodyweight','mat','chair','sofa','stairs','backpack','water_bottles','towel']
};

function esc(v){return String(v ?? '').replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));}
function getMulti(id){ const el=document.getElementById(id); return el ? Array.from(el.selectedOptions).map(o=>o.value).filter(Boolean) : []; }
function setMulti(id, values){ const el=document.getElementById(id); if(!el) return; const set=new Set(values||[]); Array.from(el.options).forEach(o=>o.selected=set.has(o.value));}
function labelForLevel(v){ return v==='beginner'?'Débutant':v==='intermediate'?'Intermédiaire':v==='advanced'?'Avancé':v; }
function labelForGoal(v){
  const m={fat_loss:'Perte de poids',recomposition:'Recomposition corporelle',muscle_gain:'Prise de muscle',strength:'Force',conditioning:'Condition physique',endurance:'Endurance',boxing:'Boxe',hyrox:'Hyrox',trail:'Trail',mobility:'Mobilité',health:'Santé',return_to_play:'Retour de blessure'};
  return m[v]||v;
}
function eqLabel(v){ return (EQUIPMENTS.find(x=>x[0]===v)||[])[1] || v; }
function activityFactorFromProfile(activity,freq){
  if(activity==='sedentary') return 1.2;
  if(activity==='moderate') return freq>=4?1.5:1.4;
  if(activity==='active') return freq>=4?1.65:1.55;
  if(activity==='very_active') return 1.8;
  return 1.45;
}
function calcBMI(weightKg,heightCm,meta={}){
  const h = Number(heightCm)/100;
  if(!weightKg || !h) return null;
  const bmi = Number(weightKg)/(h*h);
  let label='Poids normal', risk='profil standard';
  if(bmi < 18.5){ label='Insuffisance pondérale'; risk='surveiller récupération et apport énergétique'; }
  else if(bmi < 25){ label='Poids normal'; risk='zone de référence'; }
  else if(bmi < 30){ label='Surpoids'; risk='intérêt du travail cardio + nutrition'; }
  else if(bmi < 35){ label='IMC élevé'; risk='lecture à nuancer selon composition corporelle'; }
  else { label='IMC très élevé'; risk='approche santé prioritaire'; }
  if((meta.activityLevel==='very_active' || meta.activityLevel==='active') && meta.level==='advanced' && bmi >= 27){
    label = 'IMC élevé à interpréter avec prudence';
    risk = 'profil potentiellement très musclé : compléter avec mensurations et tour de taille';
  }
  return {value:bmi.toFixed(1), label, risk};
}
function calcCalories({sex, weight, height, age, goal, stress, activityFactor=1.5}){
  weight=Number(weight||0); height=Number(height||0); age=Number(age||0);
  if(!weight || !height || !age) return null;
  const bmr = sex==='female' ? (10*weight + 6.25*height - 5*age - 161) : (10*weight + 6.25*height - 5*age + 5);
  let maintenance = bmr * activityFactor;
  if(stress==='high') maintenance *= 0.97;
  if(goal==='fat_loss') maintenance -= 350;
  if(goal==='muscle_gain') maintenance += 250;
  if(goal==='strength') maintenance += 120;
  if(['endurance','conditioning','hyrox','trail'].includes(goal)) maintenance += 150;
  const kcal = Math.round(maintenance);
  const protein = Math.round(weight * (['muscle_gain','strength'].includes(goal) ? 2.0 : 1.8));
  const fats = Math.round(weight * 0.9);
  const carbs = Math.max(80, Math.round((kcal - protein*4 - fats*9)/4));
  return {kcal, protein, carbs, fats};
}
function saveLocal(key,obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function loadLocal(key, fallback){ try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;} }

function initNav(){
  $$('.navbtn').forEach(btn=>btn.addEventListener('click',()=>goView(btn.dataset.view)));
}
function goView(view){
  $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===view));
}
function initSteps(){
  $$('.step').forEach(btn=>btn.addEventListener('click',()=>showStep(btn.dataset.step)));
}
function showStep(step){
  $$('.step').forEach(b=>b.classList.toggle('active', b.dataset.step===String(step)));
  $$('.step-panel').forEach(p=>p.classList.toggle('active', p.dataset.stepPanel===String(step)));
}
function buildEquipmentSelect(){
  $('#equipmentSelect').innerHTML=EQUIPMENTS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
}
function buildLibraryFilters(){
  const cats=[''].concat([...new Set(EXERCISES.map(e=>e.category).filter(Boolean))].sort());
  $('#libCategory').innerHTML=cats.map(c=>`<option value="${c}">${c || 'Toutes les catégories'}</option>`).join('');
  $('#libEnv').innerHTML=[''].concat(Object.keys(ENV_LABELS)).map(v=>`<option value="${v}">${v?ENV_LABELS[v]:'Tous les contextes'}</option>`).join('');
  $('#libEquipment').innerHTML=[''].concat(EQUIPMENTS.map(x=>x[0])).map(v=>`<option value="${v}">${v?eqLabel(v):'Tout le matériel'}</option>`).join('');
}
function autoFill(){
  const prefs=getMulti('practicePrefs');
  const sport=$('#currentSport').value;
  const goal=$('#mainGoal').value;
  const avail=$('#availabilityWeekly').value;
  const level=$('#clientLevel').value;
  if(!$('#environmentSelect').value){
    if(prefs.includes('gym')) $('#environmentSelect').value='gym';
    else if(prefs.includes('outdoor')) $('#environmentSelect').value='outdoor';
    else if(prefs.includes('home')) $('#environmentSelect').value='home';
    else if(sport==='boxing') $('#environmentSelect').value='boxing_gym';
    else if(sport==='hyrox') $('#environmentSelect').value='crossfit_box';
  }
  if(!$('#clientFreq').value){
    $('#clientFreq').value = avail==='1' ? '2' : avail==='2-3' ? '3' : avail==='4-5' ? '4' : avail==='6+' ? '5' : (level==='beginner' ? '3' : '4');
  }
  if(!$('#clientDuration').value){
    $('#clientDuration').value = level==='beginner' ? '45' : level==='advanced' ? '75' : '60';
  }
  if(goal){
    const cycleMap = {
      fat_loss:['conditioning'],
      recomposition:['hypertrophy','conditioning'],
      muscle_gain:['hypertrophy'],
      strength:['strength'],
      conditioning:['conditioning'],
      boxing:['conditioning','peak'],
      hyrox:['conditioning','peak'],
      trail:['conditioning'],
      mobility:['health'],
      health:['health'],
      return_to_play:['health']
    };
    setMulti('cycleGoals', cycleMap[goal]||['conditioning']);
  }
  const coachTypes=[];
  if(goal==='boxing' || sport==='boxing') coachTypes.push('boxing');
  if(goal==='hyrox' || sport==='hyrox') coachTypes.push('hyrox');
  if(goal==='trail' || sport==='running') coachTypes.push('trail');
  if(['fat_loss','recomposition','muscle_gain','strength','conditioning'].includes(goal)) coachTypes.push('fitness');
  if(['health','return_to_play','mobility'].includes(goal) || getMulti('medicalKnown').length || getMulti('injuryKnown').length) coachTypes.push('health');
  coachTypes.push('general');
  setMulti('coachingTypes',[...new Set(coachTypes)]);
  const mods=[];
  if(goal==='boxing'||sport==='boxing') mods.push('boxing_prep');
  if(goal==='hyrox'||sport==='hyrox') mods.push('hyrox_prep');
  if(goal==='trail'||sport==='running') mods.push('trail_prep');
  if(goal==='return_to_play'||getMulti('injuryKnown').length) mods.push('return_to_play');
  if(goal==='health') mods.push('seniors_health');
  if(goal==='fat_loss') mods.push('express_fat_loss');
  if(goal==='recomposition' || goal==='muscle_gain') mods.push('transformation');
  setMulti('fafaModules',[...new Set(mods)]);
  applyEquipmentPreset();
  updateSummary();
}
function applyEquipmentPreset(){
  const env=$('#environmentSelect').value;
  const preset=PRESETS[env]||[];
  if(preset.length) setMulti('equipmentSelect', preset);
}
function updateSummary(){
  const bmi = calcBMI(Number($('#clientWeight').value||0), Number($('#clientHeight').value||0), {activityLevel:$('#activityLevel').value, level:$('#clientLevel').value});
  const summary=[
    ['Client', $('#clientName').value || '—'],
    ['Objectif', labelForGoal($('#mainGoal').value||'') || '—'],
    ['Contexte', ENV_LABELS[$('#environmentSelect').value] || 'Auto / à définir'],
    ['Fréquence conseillée', $('#clientFreq').value ? $('#clientFreq').value+'/semaine' : 'Auto'],
    ['Durée conseillée', $('#clientDuration').value ? $('#clientDuration').value+' min' : 'Auto'],
    ['IMC', bmi ? `${bmi.value} · ${bmi.label}` : '—'],
    ['Modules', getMulti('fafaModules').map(v=>$('#fafaModules').querySelector(`option[value="${v}"]`)?.textContent||v).join(', ') || '—'],
    ['Statut business', `${$('#bizStatus').value||'—'} / ${Number($('#bizAmount').value||0)>0?'payé':'non payé'}`]
  ];
  $('#coachSummary').innerHTML=summary.map(([k,v])=>`<div><strong>${esc(k)} :</strong> ${esc(v)}</div>`).join('');
}
function buildDayTitles(freq){
  const f=Number(freq||3);
  if(f===2) return ['Jour 1 · Full body','Jour 2 · Full body + cardio'];
  if(f===3) return ['Jour 1 · Haut du corps','Jour 2 · Bas du corps','Jour 3 · Full body / conditioning'];
  if(f===4) return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Conditioning / core'];
  if(f===5) return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Lower + conditioning','Jour 5 · Upper + core'];
  return ['Jour 1 · Push','Jour 2 · Lower','Jour 3 · Pull','Jour 4 · Lower','Jour 5 · Upper','Jour 6 · Conditioning'];
}
function exerciseMatches(ex, level, env, equipment, injuries, medical){
  const lvl={beginner:1,intermediate:2,advanced:3};
  if(lvl[ex.level] > lvl[level||'intermediate']) return false;
  if(env && ex.environments && !ex.environments.includes(env) && env!=='gym') return false;
  if(equipment.length && ex.equipment && !ex.equipment.some(e=>equipment.includes(e))) return false;
  const txt=(ex.name+' '+ex.muscles+' '+ex.cue).toLowerCase();
  if(injuries.includes('epaule') && /(overhead|développé nuque|snatch|jerk)/i.test(txt)) return false;
  if(injuries.includes('dos') && /(soulevé de terre lourd|good morning|deadlift)/i.test(txt)) return false;
  if(injuries.includes('genou') && /(jump squat|saut|pistol)/i.test(txt)) return false;
  if(medical.includes('hypertension') && /(max|sprint all out)/i.test(txt)) return false;
  return true;
}
function buildProgramDays(form){
  const titles=buildDayTitles(form.freq);
  const level=form.level||'intermediate';
  const injuries=getMulti('injuryKnown');
  const medical=getMulti('medicalKnown');
  const filtered=EXERCISES.filter(ex=>exerciseMatches(ex, level, form.env, form.equipment, injuries, medical));
  const pickBy = (keywords, count=5)=>{
    const res=filtered.filter(ex=>{
      const text=(ex.name+' '+ex.subcategory+' '+ex.muscles+' '+(ex.tags||[]).join(' ')).toLowerCase();
      return keywords.some(k=>text.includes(k));
    }).slice(0,count);
    return res.length?res:filtered.slice(0,count);
  };
  return titles.map((title, i)=>{
    let keys=['full body'];
    if(/push/i.test(title)) keys=['pector','épaule','triceps','push'];
    else if(/pull/i.test(title)) keys=['dos','biceps','tirage','pull'];
    else if(/lower|bas/i.test(title)) keys=['quadriceps','fess','ischio','jamb'];
    else if(/conditioning|cardio/i.test(title)) keys=['cardio','course','rameur','conditioning','bike'];
    const items=pickBy(keys, 5).map((ex,idx)=>({
      name:ex.name,
      category:ex.category,
      muscles:ex.muscles,
      cue:ex.cue,
      easy:ex.easy,
      hard:ex.hard,
      substitute: ex.easy || 'Adapter selon matériel',
      prescription:{
        series: i===titles.length-1 && /conditioning|cardio/i.test(title) ? '4 blocs' : '3 à 4 séries',
        reps: ['strength'].includes(form.mainGoal)?'4 à 6 reps': ['muscle_gain','recomposition'].includes(form.mainGoal)?'8 à 12 reps':'10 à 15 reps',
        rest: ['conditioning','boxing','hyrox','trail'].includes(form.mainGoal)?'30 à 60 sec':'60 à 90 sec',
        tempo: idx===0?'contrôlé':'fluide'
      }
    }));
    return {title, items, patternSummary: keys.join(' / ')};
  });
}
function buildWeekSchedule(freq){
  const days=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const f=Number(freq||3);
  const trainIdx = f===2?[1,4]:f===3?[1,3,5]:f===4?[1,2,4,5]:f===5?[1,2,3,5,6]:[1,2,3,4,5,6];
  return days.map((d,idx)=>({day:d, train:trainIdx.includes(idx+1)}));
}
function renderProgram(p, coach=true){
  const week=buildWeekSchedule(p.freq);
  const head = `<div class="panel"><h3>${esc(p.name)} · ${esc(p.code)}</h3>
    <div class="meta">
      <span class="badge">${esc(labelForGoal(p.mainGoal))}</span>
      <span class="badge">${esc(labelForLevel(p.level))}</span>
      <span class="badge">${esc(ENV_LABELS[p.env]||p.env)}</span>
      <span class="badge">${esc(p.freq)}/semaine</span>
      <span class="badge">${esc(p.duration)} min</span>
    </div>
    ${p.bmi?`<p><strong>IMC :</strong> ${esc(p.bmi.value)} · ${esc(p.bmi.label)} — ${esc(p.bmi.risk)}</p>`:''}
    ${p.restrictions?`<p><strong>Contraintes prises en compte :</strong> ${esc(p.restrictions)}</p>`:''}
  </div>`;
  const sched = `<article class="athlete-week"><h3>Semaine type</h3><div class="week-days">${
    week.map(w=>`<div class="daypill ${w.train?'train':'rest'}"><strong>${w.day}</strong><div>${w.train?'Entraînement':'Repos / mobilité'}</div></div>`).join('')
  }</div></article>`;
  const days = p.days.map(day=>`<article class="panel"><h3>${esc(day.title)}</h3><p class="small-muted">Répartition : ${esc(day.patternSummary)}</p>${
    day.items.map(ex=>`<div class="summary-card"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.muscles)}</div>
    <div><strong>${esc(ex.prescription.series)}</strong> · ${esc(ex.prescription.reps)} · repos ${esc(ex.prescription.rest)}</div>
    <div class="small-muted">Consigne : ${esc(ex.cue)}</div>
    <div class="small-muted">Substitution : ${esc(ex.substitute)}</div></div>`).join('')
  }</article>`).join('');
  const actions = coach ? `<div class="actions"><button id="coachSaveAgain">Enregistrer</button><button class="ghost" id="coachCopyLinkAgain">Copier lien adhérent</button><button class="ghost" id="coachExportPdfAgain">Exporter PDF</button></div>`:'';
  return head + sched + days + actions;
}
function buildNutritionView(p){
  const n = p.nutrition;
  if(!n) return '<div class="panel"><p>Impossible de calculer la nutrition sans taille, poids et âge.</p></div>';
  return `<div class="panel"><h3>Nutrition</h3><p><strong>Calories :</strong> ${n.kcal} kcal</p><p><strong>Macros :</strong> protéines ${n.protein} g · glucides ${n.carbs} g · lipides ${n.fats} g</p><p class="small-muted">Lecture simple : point de départ à ajuster selon poids, faim, énergie et assiduité.</p></div>`;
}
function collectRestrictions(){
  const arr=[];
  if(getMulti('medicalKnown').length) arr.push('Pathologies : '+getMulti('medicalKnown').join(', '));
  if(getMulti('injuryKnown').length) arr.push('Blessures : '+getMulti('injuryKnown').join(', '));
  if(getMulti('foodKnown').length) arr.push('Nutrition / allergies : '+getMulti('foodKnown').join(', '));
  if($('#healthNotes').value.trim()) arr.push($('#healthNotes').value.trim());
  return arr.join(' · ');
}
function saveProgram(program){
  const all=loadLocal('fafaPrograms',{});
  all[program.code]=program;
  saveLocal('fafaPrograms', all);
  updateHome();
}
function generateAthleteLink(program){
  return `${location.origin}${location.pathname}?client=${encodeURIComponent(program.code)}`;
}
function buildProgram(){
  const form = {
    name:$('#clientName').value.trim() || 'Client FAFATRAINING',
    code:($('#clientCode').value.trim()||('FT'+Math.floor(Math.random()*9000+1000))).toUpperCase(),
    email:$('#clientEmail').value.trim(),
    age:Number($('#clientAge').value||0),
    sex:$('#clientSex').value,
    height:Number($('#clientHeight').value||0),
    weight:Number($('#clientWeight').value||0),
    level:$('#clientLevel').value || 'intermediate',
    sport:$('#currentSport').value,
    availability:$('#availabilityWeekly').value,
    activityLevel:$('#activityLevel').value,
    mainGoal:$('#mainGoal').value,
    secondGoals:getMulti('secondGoals'),
    env:$('#environmentSelect').value,
    cycleGoals:getMulti('cycleGoals'),
    fafaModules:getMulti('fafaModules'),
    focusTargets:getMulti('focusTargets'),
    coachingTypes:getMulti('coachingTypes'),
    supports:getMulti('supports'),
    equipment:getMulti('equipmentSelect'),
    effortFormats:getMulti('effortFormats'),
    freq:Number($('#clientFreq').value||3),
    duration:Number($('#clientDuration').value||60),
    cycleWeeks:Number($('#cycleWeeks').value||8),
    sleepHours:Number($('#sleepHours').value||7),
    stressLevel:$('#stressLevel').value,
    bizStatus:$('#bizStatus').value,
    bizAmount:Number($('#bizAmount').value||0)
  };
  if(!form.mainGoal){ alert('Choisis un objectif principal.'); showStep(2); return; }
  if(!form.height || !form.weight || !form.age){ alert('Renseigne âge, taille et poids.'); showStep(1); return; }
  form.bmi=calcBMI(form.weight, form.height, {activityLevel:form.activityLevel, level:form.level});
  form.nutrition=calcCalories({sex:form.sex, weight:form.weight, height:form.height, age:form.age, goal:form.mainGoal, stress:form.stressLevel, activityFactor:activityFactorFromProfile(form.activityLevel, form.freq)});
  form.restrictions=collectRestrictions();
  form.days=buildProgramDays(form);
  form.athleteLink=generateAthleteLink(form);
  currentProgram=form;
  saveProgram(form);
  saveBusinessStatus(form.code, form.bizStatus, form.bizAmount, '');
  $('#coachOutput').innerHTML=renderProgram(form,true);
  wireProgramActionButtons();
  updateSummary();
}
function wireProgramActionButtons(){
  $('#coachSaveAgain')?.addEventListener('click', ()=>{ if(currentProgram){ saveProgram(currentProgram); alert('Programme enregistré.'); }});
  $('#coachCopyLinkAgain')?.addEventListener('click', copyAthleteLink);
  $('#coachExportPdfAgain')?.addEventListener('click', exportPdf);
}
function copyAthleteLink(){
  if(!currentProgram){ alert('Génère d’abord un programme.'); return; }
  navigator.clipboard?.writeText(currentProgram.athleteLink).then(()=>{
    const div=document.createElement('div');
    div.className='copyok'; div.textContent='Lien adhérent copié';
    $('#coachOutput').prepend(div); setTimeout(()=>div.remove(),1500);
  }).catch(()=>window.prompt('Copie le lien :', currentProgram.athleteLink));
}
function exportPdf(){
  const p=currentProgram;
  if(!p){ alert('Génère d’abord un programme.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  let y=16;
  const line=(txt,size=10,bold=false)=>{
    doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(size);
    const lines=doc.splitTextToSize(String(txt), 180);
    lines.forEach(l=>{ if(y>280){ doc.addPage(); y=16; } doc.text(l, 15, y); y += size>=14?8:5; });
  };
  line('FAFATRAINING COACHING',16,true);
  line(`${p.name} · ${p.code}`,12,true);
  line(`Profil : ${p.age} ans · ${p.sex==='female'?'Femme':'Homme'} · ${p.height} cm · ${p.weight} kg`,10);
  line(`Objectif principal : ${labelForGoal(p.mainGoal)}`,10,true);
  if(p.secondGoals?.length) line(`Objectifs secondaires : ${p.secondGoals.map(labelForGoal).join(', ')}`,10);
  line(`Contexte : ${ENV_LABELS[p.env]||p.env} · Fréquence : ${p.freq}/semaine · Durée : ${p.duration} min`,10);
  if(p.bmi) line(`IMC : ${p.bmi.value} (${p.bmi.label}) · ${p.bmi.risk}`,10);
  if(p.restrictions) line(`Contraintes : ${p.restrictions}`,10);
  line('Planning semaine',12,true);
  buildWeekSchedule(p.freq).forEach(w=>line(`${w.day} : ${w.train?'Entraînement':'Repos / mobilité'}`,10));
  line('Programme détaillé',12,true);
  p.days.forEach(day=>{
    line(day.title,11,true);
    day.items.forEach(ex=>{
      line(`${ex.name} — ${ex.prescription.series} · ${ex.prescription.reps} · repos ${ex.prescription.rest}`,9,true);
      line(`Consigne : ${ex.cue}`,9);
      line(`Substitution : ${ex.substitute}`,9);
    });
  });
  if(p.nutrition){ line('Lecture nutrition',12,true); line(`${p.nutrition.kcal} kcal · protéines ${p.nutrition.protein} g · glucides ${p.nutrition.carbs} g · lipides ${p.nutrition.fats} g`,10); }
  line('Glossaire débutant',12,true);
  line('Série = blocs à faire. Reps = répétitions. Repos = récupération. RPE = ressenti sur 10.',9);
  doc.save(`${p.code}_FAFATRAINING.pdf`);
}
function renderLibrary(){
  const q=($('#libSearch').value||'').toLowerCase().trim();
  const cat=$('#libCategory').value;
  const level=$('#libLevel').value;
  const env=$('#libEnv').value;
  const equipment=$('#libEquipment').value;
  const lvl={beginner:1,intermediate:2,advanced:3};
  const results=EXERCISES.filter(ex=>
    (!q || [ex.name,ex.subcategory,ex.muscles,ex.cue,(ex.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)) &&
    (!cat || ex.category===cat) &&
    (!level || lvl[ex.level]<=lvl[level]) &&
    (!env || (ex.environments||[]).includes(env)) &&
    (!equipment || (ex.equipment||[]).includes(equipment))
  );
  $('#libraryMeta').innerHTML=`<strong>${results.length}</strong> résultats visibles sur <strong>${EXERCISES.length}</strong> exercices / variantes.`;
  $('#libraryOutput').innerHTML = results.slice(0,150).map(ex=>`<article class="library-card">
    <div class="meta">
      <span class="badge">${esc(ex.category)}</span>
      <span class="badge">${esc(ex.subcategory)}</span>
      <span class="badge">${esc(labelForLevel(ex.level))}</span>
    </div>
    <h3>${esc(ex.name)}</h3>
    <p><strong>Muscles :</strong> ${esc(ex.muscles)}</p>
    <p><strong>Consigne :</strong> ${esc(ex.cue)}</p>
    <p class="small-muted"><strong>Régression :</strong> ${esc(ex.easy)} · <strong>Progression :</strong> ${esc(ex.hard)}</p>
    <p class="small-muted"><strong>Matériel :</strong> ${(ex.equipment||[]).map(eqLabel).join(', ')}</p>
  </article>`).join('') || '<div class="panel">Aucun résultat.</div>';
}
function saveBusinessStatus(code,status,amount,renewal){
  const all=loadLocal('fafaBusiness',{});
  all[code]={code,status,amount,renewal};
  saveLocal('fafaBusiness', all);
  renderBusiness();
}
function openAthletePortal(){
  const code=($('#athleteCode').value||'').trim().toUpperCase();
  const programs=loadLocal('fafaPrograms',{});
  const p=programs[code];
  if(!p){ $('#athleteOutput').innerHTML='<div class="panel">Aucun programme trouvé.</div>'; return; }
  const biz=loadLocal('fafaBusiness',{})[code];
  if(!biz || biz.status!=='actif' || Number(biz.amount||0)<=0){
    $('#athleteOutput').innerHTML='<div class="panel">Accès bloqué : abonnement non actif ou non payé.</div>'; return;
  }
  const tracks=loadLocal('fafaTracking',{})[code]||[];
  $('#athleteOutput').innerHTML = renderProgram(p,false) + 
    `<div class="panel"><h3>Historique / ressenti</h3>${tracks.length?tracks.map(t=>`<div class="summary-card"><strong>${t.date}</strong><div>Poids : ${t.weight||'-'} kg · Énergie : ${t.energy||'-'}/10 · Compliance : ${t.compliance||'-'}%</div><div class="small-muted">${esc(t.note||'')}</div></div>`).join(''):'<p>Aucun suivi pour le moment.</p>'}</div>`;
}
function saveTracking(){
  const code=($('#trackCode').value||'').trim().toUpperCase();
  if(!code){ alert('Ajoute un code adhérent.'); return; }
  const all=loadLocal('fafaTracking',{});
  all[code]=all[code]||[];
  all[code].push({
    date:new Date().toLocaleDateString('fr-FR'),
    weight:Number($('#trackWeight').value||0)||'',
    energy:Number($('#trackEnergy').value||0)||'',
    compliance:Number($('#trackCompliance').value||0)||'',
    note:$('#trackNote').value.trim()
  });
  saveLocal('fafaTracking', all);
  renderProgress(code);
}
function renderProgress(code=''){
  const all=loadLocal('fafaTracking',{});
  const target=code || ($('#trackCode').value||'').trim().toUpperCase();
  if(!target){ $('#progressOutput').innerHTML=''; return; }
  const arr=all[target]||[];
  $('#progressOutput').innerHTML = arr.length?arr.map(x=>`<div class="summary-card"><strong>${x.date}</strong><div>Poids : ${x.weight||'-'} kg · Énergie : ${x.energy||'-'}/10 · Compliance : ${x.compliance||'-'}%</div><div class="small-muted">${esc(x.note||'')}</div></div>`).join(''):'<div class="panel">Aucun suivi pour ce code.</div>';
}
function showNutrition(){
  const code=($('#nutritionCode').value||'').trim().toUpperCase();
  const p=loadLocal('fafaPrograms',{})[code];
  $('#nutritionOutput').innerHTML = p ? buildNutritionView(p) : '<div class="panel">Aucun programme trouvé.</div>';
}
function renderBusiness(){
  const all=loadLocal('fafaBusiness',{});
  const rows=Object.values(all);
  $('#businessOutput').innerHTML = rows.length ? rows.map(r=>`<div class="summary-card"><strong>${esc(r.code)}</strong><div>Statut : ${esc(r.status)} · Montant : ${esc(r.amount)} €</div><div class="small-muted">${r.renewal?`Échéance : ${esc(r.renewal)}`:'Sans échéance'}</div></div>`).join('') : '<div class="panel">Aucun statut enregistré.</div>';
  const due = rows.filter(r=>r.renewal && ((new Date(r.renewal)-new Date())/86400000)<=7 && ((new Date(r.renewal)-new Date())/86400000)>=0).length;
  $('#kpiDue').textContent = due;
  $('#kpiClients').textContent = rows.filter(r=>r.status==='actif' && Number(r.amount||0)>0).length;
}
function quickBuild(){
  const dur=$('#quickDuration').value;
  const style=$('#quickStyle').value;
  const env=$('#quickEnv').value;
  const exs=EXERCISES.filter(ex=>(ex.environments||[]).includes(env)).slice(0,6);
  $('#quickOutput').innerHTML = `<div class="panel"><h3>Séance rapide ${esc(style)}</h3><p>${esc(dur)} minutes · ${esc(ENV_LABELS[env]||env)}</p>${
    exs.map(ex=>`<div class="summary-card"><strong>${esc(ex.name)}</strong><div class="small-muted">${esc(ex.cue)}</div></div>`).join('')
  }</div>`;
}
function renderHome(){
  const programs=loadLocal('fafaPrograms',{});
  const business=loadLocal('fafaBusiness',{});
  $('#kpiPrograms').textContent=Object.keys(programs).length;
  $('#kpiLibrary').textContent=EXERCISES.length;
  renderBusiness();
  const acts=[];
  Object.values(programs).slice(-5).reverse().forEach(p=>acts.push(`<div class="summary-card"><strong>${esc(p.name)}</strong><div class="small-muted">${esc(p.code)} · ${esc(labelForGoal(p.mainGoal))}</div></div>`));
  $('#homeActivity').innerHTML=acts.join('') || '<div class="summary-card">Aucune activité récente.</div>';
}
function wireEvents(){
  ['#clientName','#clientCode','#clientEmail','#clientAge','#clientHeight','#clientWeight','#clientLevel','#currentSport','#availabilityWeekly','#activityLevel','#mainGoal','#environmentSelect','#clientFreq','#clientDuration','#bizStatus','#bizAmount']
    .forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  ['#mainGoal','#currentSport','#availabilityWeekly','#clientLevel','#practicePrefs','#medicalKnown','#injuryKnown','#foodKnown'].forEach(sel=>$(sel)?.addEventListener('change', autoFill));
  $('#buildProgramBtn').addEventListener('click', buildProgram);
  $('#saveProgramBtn').addEventListener('click', ()=>currentProgram && saveProgram(currentProgram));
  $('#copyLinkBtn').addEventListener('click', copyAthleteLink);
  $('#exportPdfBtn').addEventListener('click', exportPdf);
  $('#libSearchBtn').addEventListener('click', renderLibrary);
  $('#libSearch').addEventListener('input', renderLibrary);
  $('#libCategory').addEventListener('change', renderLibrary);
  $('#libLevel').addEventListener('change', renderLibrary);
  $('#libEnv').addEventListener('change', renderLibrary);
  $('#libEquipment').addEventListener('change', renderLibrary);
  $('#openAthleteBtn').addEventListener('click', openAthletePortal);
  $('#saveTrackBtn').addEventListener('click', saveTracking);
  $('#showNutritionBtn').addEventListener('click', showNutrition);
  $('#saveBizBtn').addEventListener('click', ()=>{
    saveBusinessStatus(($('#bizCodeInput').value||'').trim().toUpperCase(), $('#bizStatusInput').value, Number($('#bizAmountInput').value||0), $('#bizRenewalInput').value);
  });
  $('#quickBuildBtn').addEventListener('click', quickBuild);
}
function hydrateLink(){
  const sp=new URLSearchParams(location.search);
  const code=(sp.get('client')||'').trim().toUpperCase();
  if(code){
    goView('athlete');
    $('#athleteCode').value=code;
    openAthletePortal();
  }
}
async function init(){
  EXERCISES = await fetch('data/exercises.json').then(r=>r.json());
  initNav();
  initSteps();
  buildEquipmentSelect();
  buildLibraryFilters();
  wireEvents();
  autoFill();
  renderLibrary();
  renderHome();
  hydrateLink();
}
window.addEventListener('DOMContentLoaded', init);
