
const KEY='ester-uopeople-2026';
const state=JSON.parse(localStorage.getItem(KEY)||'{}');
state.courses=state.courses||{};
state.tasks=state.tasks||[];
state.checkins=state.checkins||[];
state.dev=state.dev||[];
state.days=state.days||{};
let courseData=null,timerSec=1500,timerId=null;

const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function today(){return new Date().toISOString().slice(0,10)}
function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}

document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(id){document.querySelectorAll('.tab').forEach(x=>x.hidden=true);$(id).hidden=false;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'});}
showTab('overview'); $('todayLabel').textContent=fmtDate(today());

fetch('data/courses.json').then(r=>r.json()).then(d=>{courseData=d;renderAll();}).catch(()=>{});

function renderAll(){renderCourses();renderRoutine();renderTasks();renderSources();renderHistory();updateStats();}
function renderCourses(){
 let html='';
 courseData.courses.forEach(c=>{
  const done=!!state.courses[c.order];
  const badge=c.status==='verified'?'<span class="badge">Fonte oficial</span>':'<span class="badge red">A confirmar</span>';
  html+=`<div class="course ${done?'done':''}"><div class="row between"><div><b>${c.order}. ${c.code}</b> · ${c.name}</div><input class="check" type="checkbox" ${done?'checked':''} onchange="toggleCourse(${c.order})"></div><p class="small muted">${c.credits} créditos · Pré-requisito: ${c.prereq} · ${badge}</p><p class="small">${c.source}</p></div>`;
 });
 $('courseList').innerHTML=html;
}
function toggleCourse(n){state.courses[n]=!state.courses[n]; if(!state.courses[n])delete state.courses[n]; save();renderAll();}
function resetCourses(){if(confirm('Limpar todas as marcações de cursos?')){state.courses={};save();renderAll();}}
function updateStats(){
 const done=Object.values(state.courses).filter(Boolean).length;
 $('doneCourses').textContent=done;$('doneCredits').textContent=done*3;$('courseBar').style.width=(done/20*100)+'%';$('progressText').textContent=`${done} de 20 cursos marcados`;
 const td=state.tasks.filter(t=>t.done).length;$('taskDone').textContent=td;
 let streak=0,d=new Date();for(let i=0;i<366;i++){let k=d.toISOString().slice(0,10);if(state.days[k]){streak++;d.setDate(d.getDate()-1)}else break}$('streak').textContent=streak;
}
const routine=[
['07:00','Acordar + água + higiene','Corpo','Comece pequeno; sem exigir produtividade imediata.'],
['07:30','Tempo devocional','Devocional','Leitura curta + oração + uma aplicação.'],
['08:00','Café da manhã','Corpo','Alimentar-se antes de exigir concentração.'],
['09:00','Foco acadêmico 1 · 25–45 min','Estudo','Uma tarefa concreta.'],
['10:00','Pausa + movimento','Saúde','Levante, respire, caminhe ou alongue conforme puder.'],
['10:30','Foco acadêmico 2','Estudo','Leitura, fórum, escrita ou revisão.'],
['12:30','Almoço + descanso','Corpo','Pausa real.'],
['15:00','Bloco leve / tarefas','Vida','Administração, revisão ou tarefa curta.'],
['18:00','Desacelerar','Mente','Reduzir pendências e preparar amanhã.'],
['21:30','Encerramento','Mente','Anote o próximo passo e pare de estudar.']
];
function renderRoutine(){$('routineList').innerHTML=routine.map((r,i)=>`<div class="course"><div class="row between"><b>${r[0]} · ${r[1]}</b><span class="badge">${r[2]}</span></div><p class="small muted">${r[3]}</p><label><input type="checkbox" ${state.days[today()+'-'+i]?'checked':''} onchange="toggleRoutine('${today()}-${i}')"> feito</label></div>`).join('');}
function toggleRoutine(k){state.days[k]=!state.days[k];if(!state.days[k])delete state.days[k];save();renderRoutine();updateStats();}
function saveWeek(){state.week={goal:$('weekGoal').value,results:$('weekResults').value};save();$('weekSaved').textContent='Salvo localmente.'}

function addTask(){let text=$('taskInput').value.trim();if(!text)return;state.tasks.unshift({id:Date.now(),text,cat:$('taskCat').value,done:false});$('taskInput').value='';save();renderTasks();updateStats();}
function toggleTask(id){let t=state.tasks.find(x=>x.id===id);if(t)t.done=!t.done;save();renderTasks();updateStats();}
function deleteTask(id){state.tasks=state.tasks.filter(x=>x.id!==id);save();renderTasks();updateStats();}
function quickTask(){showTab('tasks');setTimeout(()=>$('taskInput').focus(),200)}
function renderTasks(){if(!$('taskList'))return;$('taskList').innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="course"><div class="row between"><label style="margin:0"><input class="check" type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${t.id})"> ${t.text}</label><button class="btn ghost small" onclick="deleteTask(${t.id})">excluir</button></div><span class="badge">${t.cat}</span></div>`).join(''):'<p class="muted">Nenhuma tarefa. Adicione uma só para começar.</p>';}

function setTimer(min){timerSec=min*60;renderTimer();}
function renderTimer(){let m=Math.floor(timerSec/60),s=timerSec%60,txt=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;$('timer').textContent=txt;$('modalTimer').textContent=txt;}
function startTimer(){if(timerId)return;timerId=setInterval(()=>{if(timerSec<=0){clearInterval(timerId);timerId=null;alert('Bloco concluído. Pare, respire e escolha conscientemente o próximo passo.');return}timerSec--;renderTimer()},1000)}
function pauseTimer(){clearInterval(timerId);timerId=null}
function resetTimer(){pauseTimer();timerSec=1500;renderTimer()}
function openFocus(){$('focusModal').classList.add('show')}
function closeFocus(){$('focusModal').classList.remove('show')}

function saveCheckin(){state.checkins.unshift({date:today(),energy:+$('energy').value,overload:+$('overload').value,care:$('care').value});state.checkins=state.checkins.slice(0,30);save();$('checkSaved').textContent='Check-in registrado.';renderHistory();}
function renderHistory(){if(!$('checkHistory'))return;$('checkHistory').innerHTML=state.checkins.length?'<table><tr><th>Data</th><th>Energia</th><th>Sobrecarga</th><th>Cuidado</th></tr>'+state.checkins.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${x.energy}/10</td><td>${x.overload}/10</td><td>${x.care}</td></tr>`).join('')+'</table>':'<p class="muted">Ainda não há registros.</p>';}

function saveDev(){let ref=$('bibleRef').value.trim(),note=$('devNote').value.trim();if(!ref&&!note)return;state.dev.unshift({date:today(),ref,note});state.dev=state.dev.slice(0,30);save();$('bibleRef').value='';$('devNote').value='';$('devSaved').textContent='Reflexão salva localmente.';renderDev();}
function renderDev(){if(!$('devHistory'))return;$('devHistory').innerHTML=state.dev.length?state.dev.map(x=>`<div class="course"><b>${fmtDate(x.date)} · ${x.ref||'Reflexão'}</b><p>${(x.note||'').replaceAll('<','&lt;')}</p></div>`).join(''):'<p class="muted">Nenhuma reflexão registrada.</p>'}
renderDev();

function renderSources(){$('sourcesList').innerHTML=courseData.sources.map(s=>`<div class="source"><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><p class="small muted">${s.use}</p></div>`).join('')}
if(state.week){$('weekGoal').value=state.week.goal||'';$('weekResults').value=state.week.results||''}
renderTimer();
