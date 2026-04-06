
const sessions = window.FAFA_SESSIONS || [];
const programs = window.FAFA_PROGRAMS || [];
const state = {
  clients: JSON.parse(localStorage.getItem('fafa-v3-ultra-clients') || '[]'),
  progress: JSON.parse(localStorage.getItem('fafa-v3-ultra-progress') || '[]'),
  generatedHTML: ''
};
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

function escapeHtml(s=''){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function openTab(id){qsa('.tab').forEach(x=>x.classList.toggle('active',x.dataset.target===id));qsa('.tab-panel').forEach(x=>x.classList.toggle('active',x.id===id));}
function applyMode(){
  const mode = qs('#modeSelect').value;
  qsa('.coach-only').forEach(el => el.classList.toggle('coach-hidden', mode !== 'coach'));
  if(mode !== 'coach' && qs('.tab.active').classList.contains('coach-only')) openTab('tab-seances');
}
function filterSessions(){
  const q = qs('#searchInput').value.toLowerCase().trim();
  const goal = qs('#goalSelect').value;
  const sport = qs('#sportSelect').value;
  const level = qs('#levelSelect').value;
  const setting = qs('#settingSelect').value;
  const audience = qs('#audienceSelect').value;
  const sex = qs('#sexSelect').value;
  return sessions.filter(s=>{
    const blob=[s.name,s.sport,s.goal,s.setting,s.level,s.audience,s.sex,s.description,...(s.equipment||[])].join(' ').toLowerCase();
    if(q && !blob.includes(q)) return false;
    if(goal && s.goal !== goal) return false;
    if(sport && s.sport !== sport) return false;
    if(level && s.level !== level) return false;
    if(setting && s.setting !== setting) return false;
    if(audience && s.audience !== audience) return false;
    if(sex && s.sex !== sex) return false;
    return true;
  });
}
function renderSessions(){
  const list = filterSessions();
  qs('#countSessions').textContent = sessions.length;
  qs('#filterSummary').innerHTML = `<strong>Résultats :</strong> ${list.length} séance(s) · <strong>Mode :</strong> ${qs('#modeSelect').value === 'coach' ? 'Coach' : 'Utilisateur'}`;
  qs('#sessionGrid').innerHTML = list.length ? list.map(s => `
    <article class="card">
      <div class="badges">
        <span class="badge">${escapeHtml(s.sport)}</span>
        <span class="badge">${escapeHtml(s.goal)}</span>
        <span class="badge">${escapeHtml(s.level)}</span>
      </div>
      <h3>${escapeHtml(s.name)}</h3>
      <div class="meta">⏱ ${s.durationMin} min · ${escapeHtml(s.setting)} · ${escapeHtml(s.audience)} · ${escapeHtml(s.sex)}</div>
      <p class="desc">${escapeHtml(s.description)}</p>
      <div class="actions"><button onclick="openSession('${s.id}')">Ouvrir</button></div>
    </article>
  `).join('') : '<div class="panel"><strong>Aucune séance trouvée.</strong></div>';
}
function renderPrograms(){
  qs('#countPrograms').textContent = programs.length;
  qs('#programGrid').innerHTML = programs.map(p => `
    <article class="card">
      <div class="badges"><span class="badge">${escapeHtml(p.goal)}</span><span class="badge">${escapeHtml(p.frequency)}</span></div>
      <h3>${escapeHtml(p.name)}</h3>
      <p class="desc">Programme structuré avec logique de progression par semaine.</p>
      <div class="actions"><button onclick="openProgram('${p.id}')">Ouvrir</button></div>
    </article>
  `).join('');
}
function openSession(id){
  const s = sessions.find(x=>x.id===id); if(!s) return;
  qs('#modalContent').innerHTML = `
    <h2>${escapeHtml(s.name)}</h2>
    <div class="badges">
      <span class="badge">${escapeHtml(s.sport)}</span>
      <span class="badge">${escapeHtml(s.goal)}</span>
      <span class="badge">${escapeHtml(s.level)}</span>
      <span class="badge">${escapeHtml(s.setting)}</span>
      <span class="badge">${escapeHtml(s.audience)}</span>
    </div>
    <p>${escapeHtml(s.description)}</p>
    <h3>Repères séance</h3>
    <ul>
      <li>Durée : ${s.durationMin} min</li>
      <li>Matériel : ${escapeHtml((s.equipment||[]).join(', '))}</li>
      <li>Repos : ${escapeHtml(s.rest)}</li>
      <li>Volume / répétitions : ${escapeHtml(s.reps)}</li>
      <li>Charges : ${escapeHtml(s.loadNote || 'à adapter')}</li>
    </ul>
    <h3>Déroulement</h3>
    <ol>${(s.structure||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol>
  `;
  qs('#modal').classList.remove('hidden');
}
function openProgram(id){
  const p = programs.find(x=>x.id===id); if(!p) return;
  qs('#modalContent').innerHTML = `
    <h2>${escapeHtml(p.name)}</h2>
    <div class="badges"><span class="badge">${escapeHtml(p.goal)}</span><span class="badge">${escapeHtml(p.frequency)}</span></div>
    ${p.weeks.map(w => `
      <div class="tool-card" style="margin-bottom:12px">
        <strong>Semaine ${w.week}</strong><br>
        <span>${escapeHtml(w.focus)}</span>
        <ul>${(w.sessions||[]).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      </div>
    `).join('')}
  `;
  qs('#modal').classList.remove('hidden');
}
function closeModal(){qs('#modal').classList.add('hidden');}

function calculateCoach(){
  const age = Number(qs('#age').value||0), height = Number(qs('#height').value||0), weight = Number(qs('#weight').value||0), activity = Number(qs('#activity').value||1.2), oneRm = Number(qs('#oneRm').value||0), percent = Number(qs('#percentLoad').value||0);
  if(!age || !height || !weight){ qs('#calcOutput').innerHTML='Complète âge, taille et poids.'; return; }
  const bmi = weight / ((height/100)**2);
  const bmr = (10*weight)+(6.25*height)-(5*age)+5;
  const tdee = bmr * activity;
  const load = oneRm && percent ? Math.round(oneRm * (percent/100)) : 0;
  qs('#calcOutput').innerHTML = `<strong>IMC</strong> : ${bmi.toFixed(1)}<br><strong>Métabolisme de base</strong> : ${Math.round(bmr)} kcal/jour<br><strong>Dépense journalière</strong> : ${Math.round(tdee)} kcal/jour<br><strong>Charge conseillée</strong> : ${load ? load + ' kg' : 'renseigne 1RM et %'}<br><strong>Repère</strong> : 60-70% volume / 75-85% force / >85% intensification`;
}
function saveClient(){
  const obj = {id:Date.now(),name:qs('#clientName').value.trim(),age:qs('#clientAge').value.trim(),goal:qs('#clientGoal').value.trim(),sport:qs('#clientSport').value.trim(),level:qs('#clientLevel').value.trim(),context:qs('#clientContext').value.trim(),notes:qs('#clientNotes').value.trim()};
  if(!obj.name) return;
  state.clients.unshift(obj);
  localStorage.setItem('fafa-v3-ultra-clients', JSON.stringify(state.clients));
  ['#clientName','#clientAge','#clientGoal','#clientSport','#clientLevel','#clientContext','#clientNotes'].forEach(sel => qs(sel).value='');
  renderClients();
}
function renderClients(){
  qs('#clientList').innerHTML = state.clients.length ? `<div class="client-cards">${state.clients.map(c => `<div class="mini-card"><strong>${escapeHtml(c.name)}</strong><br>Âge : ${escapeHtml(c.age)}<br>Objectif : ${escapeHtml(c.goal)}<br>Sport : ${escapeHtml(c.sport)}<br>Niveau : ${escapeHtml(c.level)}<br>Contexte : ${escapeHtml(c.context)}<br><small>${escapeHtml(c.notes)}</small></div>`).join('')}</div>` : '<p>Aucune fiche client enregistrée.</p>';
}
function saveProgress(){
  const obj = {id:Date.now(),name:qs('#progressName').value.trim(),weight:qs('#progressWeight').value.trim(),waist:qs('#progressWaist').value.trim(),perf:qs('#progressPerf').value.trim(),notes:qs('#progressNotes').value.trim(),date:new Date().toLocaleDateString('fr-FR')};
  if(!obj.name) return;
  state.progress.unshift(obj);
  localStorage.setItem('fafa-v3-ultra-progress', JSON.stringify(state.progress));
  ['#progressName','#progressWeight','#progressWaist','#progressPerf','#progressNotes'].forEach(sel => qs(sel).value='');
  renderProgress();
}
function renderProgress(){
  qs('#progressList').innerHTML = state.progress.length ? `<div class="progress-cards">${state.progress.map(p => `<div class="mini-card"><strong>${escapeHtml(p.name)}</strong><br>Date : ${escapeHtml(p.date)}<br>Poids : ${escapeHtml(p.weight)}<br>Tour de taille : ${escapeHtml(p.waist)}<br>Perf : ${escapeHtml(p.perf)}<br><small>${escapeHtml(p.notes)}</small></div>`).join('')}</div>` : '<p>Aucune entrée enregistrée.</p>';
}
function generateProgram(){
  const goal = qs('#genGoal').value.trim().toLowerCase();
  const sport = qs('#genSport').value.trim().toLowerCase();
  const level = qs('#genLevel').value.trim().toLowerCase();
  const setting = qs('#genSetting').value.trim().toLowerCase();
  const audience = qs('#genAudience').value.trim().toLowerCase();
  const freq = Math.max(1, Number(qs('#genFreq').value||3));
  const weeks = Math.max(1, Number(qs('#genWeeks').value||4));
  const pool = sessions.filter(s => (!goal || s.goal.toLowerCase().includes(goal)) && (!sport || s.sport.toLowerCase().includes(sport)) && (!level || s.level.toLowerCase().includes(level)) && (!setting || s.setting.toLowerCase().includes(setting)) && (!audience || s.audience.toLowerCase().includes(audience)));
  if(!pool.length){ qs('#generatorOutput').innerHTML = '<p>Aucune séance compatible trouvée.</p>'; state.generatedHTML=''; return; }
  let html = '';
  for(let w=1; w<=weeks; w++){
    const picked = [];
    for(let i=0; i<freq; i++){ picked.push(pool[(w+i-1) % pool.length]); }
    html += `<div class="tool-card" style="margin-bottom:12px"><strong>Semaine ${w}</strong><ul>${picked.map(s => `<li>${escapeHtml(s.name)} · ${escapeHtml(s.goal)} · ${escapeHtml(s.setting)} · ${escapeHtml(s.level)}</li>`).join('')}</ul></div>`;
  }
  state.generatedHTML = html;
  qs('#generatorOutput').innerHTML = html;
}
function exportPrintable(title, html){
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial;padding:30px;color:#111}h1{margin-top:0} .card{border:1px solid #ccc;border-radius:12px;padding:14px;margin-bottom:12px}</style></head><body><h1>${title}</h1>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
function exportGeneratedPDF(){
  if(!state.generatedHTML){ generateProgram(); }
  if(state.generatedHTML){ exportPrintable('Programme FAFATRAINING généré', state.generatedHTML); }
}
function exportClientsPDF(){
  const html = state.clients.length ? state.clients.map(c => `<div class="card"><strong>${escapeHtml(c.name)}</strong><br>Âge : ${escapeHtml(c.age)}<br>Objectif : ${escapeHtml(c.goal)}<br>Sport : ${escapeHtml(c.sport)}<br>Niveau : ${escapeHtml(c.level)}<br>Contexte : ${escapeHtml(c.context)}<br>Notes : ${escapeHtml(c.notes)}</div>`).join('') : '<p>Aucune fiche client.</p>';
  exportPrintable('Fiches clients FAFATRAINING', html);
}
function exportProgressPDF(){
  const html = state.progress.length ? state.progress.map(p => `<div class="card"><strong>${escapeHtml(p.name)}</strong><br>Date : ${escapeHtml(p.date)}<br>Poids : ${escapeHtml(p.weight)}<br>Tour de taille : ${escapeHtml(p.waist)}<br>Performance : ${escapeHtml(p.perf)}<br>Notes : ${escapeHtml(p.notes)}</div>`).join('') : '<p>Aucune progression enregistrée.</p>';
  exportPrintable('Suivi progression FAFATRAINING', html);
}
function applyAll(){ renderSessions(); }
function init(){
  applyMode();
  renderSessions();
  renderPrograms();
  renderClients();
  renderProgress();
  calculateCoach();
}
init();
