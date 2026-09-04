const KEY = 'fafatraining_v77_db';
const seed = { members: [], activeMemberId: null, sessions: [], version: 77 };

export function loadDB(){
  try { return {...seed, ...JSON.parse(localStorage.getItem(KEY)||'{}')}; }
  catch { return structuredClone(seed); }
}
export function saveDB(db){ localStorage.setItem(KEY, JSON.stringify(db)); }
export function getActiveMember(){ const db=loadDB(); return db.members.find(m=>m.id===db.activeMemberId)||null; }
export function setActiveMember(id){ const db=loadDB(); db.activeMemberId=id; saveDB(db); }
export function upsertMember(member){
  const db=loadDB();
  member={...member,id:member.id||crypto.randomUUID(),updatedAt:new Date().toISOString()};
  const i=db.members.findIndex(m=>m.id===member.id);
  if(i>=0) db.members[i]=member; else db.members.push(member);
  db.activeMemberId=member.id; saveDB(db); return member;
}
export function deleteMember(id){ const db=loadDB(); db.members=db.members.filter(m=>m.id!==id); db.sessions=db.sessions.filter(s=>s.memberId!==id); if(db.activeMemberId===id)db.activeMemberId=db.members[0]?.id||null; saveDB(db); }
export function saveSession(session){ const db=loadDB(); const i=db.sessions.findIndex(s=>s.id===session.id); if(i>=0)db.sessions[i]=session;else db.sessions.push(session); saveDB(db); }
export function memberSessions(memberId){ return loadDB().sessions.filter(s=>s.memberId===memberId).sort((a,b)=>new Date(b.date)-new Date(a.date)); }
export function exportBackup(){ return JSON.stringify(loadDB(),null,2); }
export function importBackup(text){ const obj=JSON.parse(text); if(!obj || !Array.isArray(obj.members) || !Array.isArray(obj.sessions)) throw new Error('Sauvegarde invalide'); saveDB({...seed,...obj,version:77}); }
