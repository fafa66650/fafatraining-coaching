export const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export const chip=(text,onClick='',active=false)=>`<button class="chip ${active?'active':''}" ${onClick?`onclick="${onClick}"`:''}>${esc(text)}</button>`;
export const metric=(label,value,note='')=>`<article class="metric"><small>${esc(label)}</small><b>${esc(value)}</b>${note?`<span>${esc(note)}</span>`:''}</article>`;
export const logo=()=>`<img class="brand-logo" src="assets/logo/logo-fafatraining.jpg" alt="FAFATRAINING">`;
