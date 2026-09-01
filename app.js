
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="ester-uop-v3";
const state=JSON.parse(localStorage.getItem(KEY)||"{}");
Object.assign(state,{
 done:state.done||{},notes:state.notes||{},alerts:state.alerts||[],
 habits:state.habits||{},devotional:state.devotional||{},
 personal:state.personal||{}
});
let courses=[], catalog={};

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(v){return String(v??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function fmtDate(v){if(!v)return "Data a confirmar";return new Intl.DateTimeFormat("pt-BR",{dateStyle:"medium"}).format(new Date(v+"T12:00:00"))}
function progress(){
 const total=courses.length||20, done=courses.filter(c=>state.done[c.code]).length;
 return {done,total,pct:Math.round(done/total*100),credits:done*3};
}
function render(){
 const p=progress();
 $("#progressText").textContent=`${p.done}/${p.total} disciplinas • ${p.credits}/${catalog.credits_goal||60} créditos`;
 $("#progressPercent").textContent=p.pct+"%"; $("#progressBar").style.width=p.pct+"%";
 $("#statCredits").textContent=catalog.credits_goal||60; $("#statCourses").textContent=catalog.courses_goal||courses.length||20;
 $("#statTerms").textContent=(catalog.terms||[]).length||10;
 $("#today").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date());
 renderCourses();renderTerms();renderAlerts();
}
function renderCourses(){
 const q=($("#courseSearch").value||"").toLowerCase(), f=$("#courseFilter").value;
 const list=courses.filter(c=>{
   const hay=`${c.code} ${c.name} ${c.objective} ${c.description} ${c.type}`.toLowerCase();
   const major=f==="Major"?c.type.includes("Major"):f==="General Education"?c.type.includes("General Education"):true;
   return (!q||hay.includes(q))&&major;
 });
 $("#courseList").innerHTML=list.map(c=>`
 <article class="course ${state.done[c.code]?"is-done":""}">
  <div class="courseTop"><span class="code">${esc(c.code)}</span><span>${c.credits} créditos</span></div>
  <h3>${esc(c.name)}</h3><div class="meta">Termo ${c.term} • ${esc(c.type)}</div>
  <p><b>Objetivo:</b> ${esc(c.objective)}</p>
  <p class="muted"><b>Descrição:</b> ${esc(c.description||"Descrição não cadastrada.")}</p>
  <div class="courseMeta"><span class="pill">Pré-requisito: ${esc(c.prereq||"Nenhum")}</span>${c.proctored?'<span class="pill">Proctored</span>':""}</div>
  <div class="courseActions"><button class="primary" data-done="${esc(c.code)}">${state.done[c.code]?"✓ Concluída":"Marcar como concluída"}</button><button data-note="${esc(c.code)}">📝 Anotação</button></div>
 </article>`).join("")||`<div class="empty">Nenhuma disciplina encontrada.</div>`;
 $$("[data-done]").forEach(b=>b.onclick=()=>{state.done[b.dataset.done]=!state.done[b.dataset.done];save();render()});
 $$("[data-note]").forEach(b=>b.onclick=()=>openNote(b.dataset.note));
}
function renderTerms(){
 const terms=catalog.terms||Array.from({length:10},(_,i)=>({term:i+1,label:`Termo ${i+1}`,start:null,end:null,courses:courses.filter(c=>c.term===i+1).map(c=>c.order)}));
 $("#terms").innerHTML=terms.map(t=>{
  const cs=courses.filter(c=>c.term===t.term), done=cs.filter(c=>state.done[c.code]).length;
  return `<section class="term">
   <div class="termHead"><div><span class="eyebrow">TERMO ${String(t.term).padStart(2,"0")}</span><h3>${esc(t.label||"Termo")}</h3><small class="muted">${fmtDate(t.start)} → ${fmtDate(t.end)}</small></div><span class="pill">${cs.length*3} créditos</span></div>
   <p class="muted">${esc(t.note||"")}</p><div class="termProgress">${done}/${cs.length} concluídas</div>
   <div class="termCourses">${cs.map(c=>`<button class="${state.done[c.code]?"checked":""}" data-jump="${esc(c.code)}"><span>${state.done[c.code]?"✓":"○"}</span><span><b>${esc(c.code)}</b><br>${esc(c.name)}</span></button>`).join("")}</div>
  </section>`
 }).join("");
 $$("[data-jump]").forEach(b=>b.onclick=()=>{nav("disciplinas");$("#courseSearch").value=b.dataset.jump;renderCourses()});
}
function renderAlerts(){
 $("#alertList").innerHTML=state.alerts.map((a,i)=>`<div class="alert"><div><b>${esc(a.title)}</b><small>${esc(a.date||"Sem data")}</small></div><button data-del-alert="${i}">×</button></div>`).join("")||`<div class="empty">Nenhum alerta cadastrado.</div>`;
 $$("[data-del-alert]").forEach(b=>b.onclick=()=>{state.alerts.splice(+b.dataset.delAlert,1);save();renderAlerts()});
}
function openNote(code){const v=prompt(`Anotação — ${code}`,state.notes[code]||"");if(v!==null){state.notes[code]=v;save();toast("Anotação salva.")}}
function nav(id){$$(".page").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");$$(".navBtn").forEach(x=>x.classList.toggle("active",x.dataset.page===id));window.scrollTo({top:0,behavior:"smooth"})}
$$(".navBtn").forEach(b=>b.onclick=()=>nav(b.dataset.page));
$("#focusBtn").onclick=()=>document.body.classList.toggle("focus");
$("#courseSearch").oninput=renderCourses;$("#courseFilter").onchange=renderCourses;
$("#addAlert").onclick=()=>{const title=prompt("Título do alerta");if(!title)return;const date=prompt("Data ou horário (opcional)");state.alerts.push({title,date});save();renderAlerts();toast("Alerta salvo.")};
const devKey=()=>new Date().toISOString().slice(0,10);
function loadDev(){const d=state.devotional[devKey()]||{};$("#devVerse").value=d.verse||"";$("#devReflection").value=d.reflection||"";$("#devPrayer").value=d.prayer||""}
$("#devSave").onclick=()=>{state.devotional[devKey()]={verse:$("#devVerse").value,reflection:$("#devReflection").value,prayer:$("#devPrayer").value};save();toast("Devocional salvo.");};
$$("[data-habit]").forEach(b=>b.onclick=()=>{const k=b.dataset.habit;state.habits[k]=!state.habits[k];b.classList.toggle("done",!!state.habits[k]);save()});
$("#emotionSave").onclick=()=>{state.personal.emotion=$("#emotionNote").value;save();toast("Registro emocional salvo.")};
$("#supportSave").onclick=()=>{state.personal.support=$("#supportNote").value;save();toast("Apoios salvos.")};
$("#clearProgress").onclick=()=>{if(confirm("Limpar o progresso das disciplinas?")){state.done={};save();render()}};

let timer=null,seconds=1500;
function drawTimer(){const m=Math.floor(seconds/60),s=seconds%60;$("#timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
$("#timerStart").onclick=()=>{if(timer)return;timer=setInterval(()=>{seconds--;drawTimer();if(seconds<=0){clearInterval(timer);timer=null;seconds=1500;drawTimer();alert("Tempo concluído! Faça uma pausa.")}},1000)};
$("#timerPause").onclick=()=>{clearInterval(timer);timer=null};
$("#timerReset").onclick=()=>{clearInterval(timer);timer=null;seconds=1500;drawTimer()};

async function init(){
 try{
  const r=await fetch("./courses.json",{cache:"no-store"});
  catalog=await r.json(); courses=catalog.courses||[];
  $("#programName").textContent=catalog.university||"University of the People";
  $("#programPath").textContent=catalog.program||"Programa acadêmico";
  $("#programObjective").textContent=catalog.pathway_note||"Acompanhar sua formação acadêmica.";
 }catch(e){
  $("#programPath").textContent="Não foi possível carregar courses.json. Recarregue o app.";
  courses=[];
 }
 loadDev();
 $("#emotionNote").value=state.personal.emotion||"";
 $("#supportNote").value=state.personal.support||"";
 drawTimer();render();
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
init();
