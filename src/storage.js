
const KEY="fafatraining_v83_ultimate_coach_studio";
const defaults={
  athletes:[],
  activeAthleteId:null,
  sessions:[],
  programs:[],
  groupClasses:[],
  draft:{},
  preferences:{theme:"dark"},
  schemaVersion:83
};

export function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||"null");
    return raw ? {...defaults,...raw,schemaVersion:83,programs:raw.programs||[],groupClasses:raw.groupClasses||[]} : structuredClone(defaults);
  }catch(e){ return structuredClone(defaults); }
}
export function saveState(state){ localStorage.setItem(KEY,JSON.stringify(state)); }
export function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

export function upsertAthlete(state,athlete){
  const ix=state.athletes.findIndex(a=>a.id===athlete.id);
  if(ix>=0) state.athletes[ix]=athlete;
  else state.athletes.push(athlete);
  state.activeAthleteId=athlete.id;
  saveState(state);
}
export function activeAthlete(state){
  return state.athletes.find(a=>a.id===state.activeAthleteId)||state.athletes[0]||null;
}
export function removeAthlete(state,id){
  state.athletes=state.athletes.filter(a=>a.id!==id);
  state.sessions=state.sessions.filter(s=>s.athleteId!==id);
  state.programs=(state.programs||[]).filter(p=>p.athleteId!==id);
  if(state.activeAthleteId===id) state.activeAthleteId=state.athletes[0]?.id||null;
  saveState(state);
}
export function sessionsFor(state,athleteId){
  return state.sessions.filter(s=>s.athleteId===athleteId).sort((a,b)=>new Date(b.date)-new Date(a.date));
}
export function exportState(state){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`fafatraining-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
export async function importState(file){
  const txt=await file.text();
  const data=JSON.parse(txt);
  if(!Array.isArray(data.athletes)||!Array.isArray(data.sessions)) throw new Error("Fichier invalide");
  saveState({...defaults,...data,schemaVersion:83});
  return loadState();
}
