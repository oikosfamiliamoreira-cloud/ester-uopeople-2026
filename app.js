
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY = "ester-uop-v2";

const state = JSON.parse(localStorage.getItem(KEY) || "{}");
state.done = state.done || {};
state.notes = state.notes || {};
state.alerts = state.alerts || [];
state.habits = state.habits || {};
state.devotional = state.devotional || {};
state.profile = state.profile || {name:"Ester Moreira", program:"University of the People — Computer Science", goal:"60 créditos • 20 disciplinas • 10 termos"};

const courses = window.COURSES;

function save(){localStorage.setItem(KEY, JSON.stringify(state));}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}

function progress(){
  const total=courses.length, done=courses.filter(c=>state.done[c.code]).length;
  return {done,total,pct:Math.round(done/total*100),credits:done*3};
}

function render(){
  const p=progress();
  $("#progressText").textContent=`${p.done}/${p.total} disciplinas • ${p.credits}/60 créditos`;
  $("#progressBar").style.width=p.pct+"%";
  renderCourses();
  renderTerms();
  renderAlerts();
  $("#today").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date());
}
function renderCourses(){
  const q=($("#courseSearch").value||"").toLowerCase();
  const filter=$("#courseFilter").value;
  const list=courses.filter(c=>(!q||`${c.code} ${c.name} ${c.objective}`.toLowerCase().includes(q))&&(filter==="Todas"||c.type===filter));
  $("#courseList").innerHTML=list.map(c=>`
    <article class="course ${state.done[c.code]?"is-done":""}">
      <div class="courseTop"><span class="code">${esc(c.code)}</span><span>${c.credits} créditos</span></div>
      <h3>${esc(c.name)}</h3>
      <div class="meta">Termo ${c.term} • ${esc(c.type)}</div>
      <p><b>Objetivo:</b> ${esc(c.objective)}</p>
      ${c.description?`<p class="muted">${esc(c.description)}</p>`:""}
      <div class="courseActions">
        <button class="primary" data-done="${esc(c.code)}">${state.done[c.code]?"✓ Concluída":"Marcar como concluída"}</button>
        <button data-note="${esc(c.code)}">📝 Anotação</button>
      </div>
    </article>`).join("") || `<div class="empty">Nenhuma disciplina encontrada.</div>`;
  $$("[data-done]").forEach(b=>b.onclick=()=>{state.done[b.dataset.done]=!state.done[b.dataset.done];save();render();});
  $$("[data-note]").forEach(b=>b.onclick=()=>openNote(b.dataset.note));
}
function renderTerms(){
  $("#terms").innerHTML=Array.from({length:10},(_,i)=>i+1).map(t=>{
    const cs=courses.filter(c=>c.term===t), done=cs.filter(c=>state.done[c.code]).length;
    return `<section class="term"><div class="termHead"><div><span class="eyebrow">TERMO ${String(t).padStart(2,"0")}</span><h3>${done}/${cs.length} concluídas</h3></div><span class="pill">${cs.length*3} créditos</span></div>
      <div class="termCourses">${cs.map(c=>`<button class="${state.done[c.code]?"checked":""}" data-jump="${esc(c.code)}"><span>${state.done[c.code]?"✓":"○"}</span><span><b>${esc(c.code)}</b><br>${esc(c.name)}</span></button>`).join("")}</div></section>`;
  }).join("");
  $$("[data-jump]").forEach(b=>b.onclick=()=>{$("#disciplinas").scrollIntoView({behavior:"smooth"});$("#courseSearch").value=b.dataset.jump;renderCourses();});
}
function renderAlerts(){
  $("#alertList").innerHTML=state.alerts.map((a,i)=>`<div class="alert"><div><b>${esc(a.title)}</b><small>${esc(a.date||"Sem data")}</small></div><button data-del-alert="${i}">×</button></div>`).join("") || `<div class="empty">Nenhum alerta cadastrado.</div>`;
  $$("[data-del-alert]").forEach(b=>b.onclick=()=>{state.alerts.splice(+b.dataset.delAlert,1);save();renderAlerts();});
}
function openNote(code){
  const value=prompt(`Anotação — ${code}`,state.notes[code]||"");
  if(value!==null){state.notes[code]=value;save();}
}
function nav(id){
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  $$(".navBtn").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".navBtn").forEach(b=>b.onclick=()=>nav(b.dataset.page));
$("#courseSearch").oninput=renderCourses;
$("#courseFilter").onchange=renderCourses;

$("#addAlert").onclick=()=>{
  const title=prompt("Título do alerta");
  if(!title)return;
  const date=prompt("Data ou horário (opcional)");
  state.alerts.push({title,date});save();renderAlerts();
};

const devKey=new Date().toISOString().slice(0,10);
$("#devSave").onclick=()=>{state.devotional[devKey]={verse:$("#devVerse").value,reflection:$("#devReflection").value,prayer:$("#devPrayer").value};save();toast("Devocional salvo.");};
function loadDev(){const d=state.devotional[devKey]||{};$("#devVerse").value=d.verse||"";$("#devReflection").value=d.reflection||"";$("#devPrayer").value=d.prayer||"";}
loadDev();

$$("[data-habit]").forEach(b=>b.onclick=()=>{state.habits[b.dataset.habit]=!state.habits[b.dataset.habit];b.classList.toggle("done",!!state.habits[b.dataset.habit]);save();});
$("#clearProgress").onclick=()=>{if(confirm("Limpar o progresso das disciplinas?")){state.done={};save();render();}};

let timer=null, seconds=25*60;
function drawTimer(){let m=Math.floor(seconds/60),s=seconds%60;$("#timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
$("#timerStart").onclick=()=>{if(timer)return;timer=setInterval(()=>{seconds--;drawTimer();if(seconds<=0){clearInterval(timer);timer=null;alert("Tempo concluído! Faça uma pausa.");seconds=25*60;drawTimer();}},1000);};
$("#timerPause").onclick=()=>{clearInterval(timer);timer=null;};
$("#timerReset").onclick=()=>{clearInterval(timer);timer=null;seconds=25*60;drawTimer();};
drawTimer();

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800);}
render();
