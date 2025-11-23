// --- DASHBOARD.JS INTEGRADO ---
const usuario = JSON.parse(localStorage.getItem("fm_usuario"));
if (!usuario) location.href = "/login";

const userNameDisplay = document.getElementById("userNameDisplay");
const userBtn = document.getElementById("userBtn");
const addTaskCard = document.getElementById("addTaskCard");
const columnsContainer = document.getElementById("columnsContainer");
const taskModal = document.getElementById("taskModal");
const modalBox = document.getElementById("modalBox");
const cancelBtn = document.getElementById("cancelBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const titleInput = document.getElementById("titulo");
const descInput = document.getElementById("descripcion");
const dateInput = document.getElementById("fecha");
const prioSelect = document.getElementById("prioridad");
const filterMonth = document.getElementById("filterMonth");
const filterPriorityReports = document.getElementById("filterPriorityReports");
const metricProductivity = document.getElementById("metricProductivity");
const metricCompletedToday = document.getElementById("metricCompletedToday");
const metricPending = document.getElementById("metricPending");
const reportsList = document.getElementById("reportsList");

const API_BASE = "/api/tareas";

// --- Usuario + logout ---
if(userNameDisplay) userNameDisplay.textContent = usuario.nombre || usuario.correo;
if(userBtn){
  function setUserText(text){
    const span = userBtn.querySelector("#userNameDisplay");
    if(span) span.textContent = text; else userBtn.textContent = text;
  }
  setUserText(usuario.nombre||usuario.correo);
  userBtn.addEventListener("mouseenter", ()=> setUserText("Cerrar sesión"));
  userBtn.addEventListener("mouseleave", ()=> setUserText(usuario.nombre||usuario.correo));
  userBtn.addEventListener("click", ()=> { localStorage.clear(); location.href="/login"; });
}

// --- MODAL ---
function openModal(editTask=null){
  if(!taskModal) return;
  taskModal.classList.add("show"); taskModal.classList.remove("hidden");
  if(editTask){
    titleInput.value = editTask.titulo||"";
    descInput.value = editTask.descripcion||"";
    dateInput.value = editTask.fecha||"";
    prioSelect.value = editTask.prioridad||"Media";
    saveTaskBtn.dataset.editId = editTask._id;
    document.querySelector(".modal-title").textContent = "Editar tarea";
  } else {
    titleInput.value = ""; descInput.value = ""; dateInput.value = ""; prioSelect.value = "Media";
    delete saveTaskBtn.dataset.editId;
    document.querySelector(".modal-title").textContent = "Crear nueva tarea";
  }
  setTimeout(()=> modalBox && (modalBox.scrollTop=0),10);
}
function closeModal(){ taskModal.classList.remove("show"); taskModal.classList.add("hidden"); delete saveTaskBtn.dataset.editId; }
if(cancelBtn) cancelBtn.onclick = closeModal;
if(taskModal) taskModal.addEventListener("click", e => { if(e.target===taskModal) closeModal(); });
if(addTaskCard) addTaskCard.addEventListener("click", ()=>openModal());

// --- API helpers ---
const headersWithUser = (extra={})=>Object.assign({"Content-Type":"application/json","X-User":usuario.correo},extra);

// --- Cargar tareas ---
async function cargarTareas(){
  try{
    const res = await fetch(API_BASE, { headers: headersWithUser() });
    const tareas = await res.json();
    const groups = {};
    tareas.forEach(t=>{
      const fecha = t.fecha||"Sin fecha";
      if(!groups[fecha]) groups[fecha]=[];
      groups[fecha].push(t);
    });
    const fechas = Object.keys(groups).sort();
    renderColumns(fechas, groups);
    computeReports(tareas);
    if(filterMonth) populateMonthFilter(fechas);
  } catch(e){ console.error(e); renderColumns([],{}); computeReports([]); }
}

// --- Render columnas ---
function renderColumns(fechas, groups){
  if(!columnsContainer) return;
  const addCol = document.getElementById("addColumn");
  columnsContainer.innerHTML = "";
  if(addCol) columnsContainer.appendChild(addCol);
  fechas.forEach(fecha=>{
    const col = document.createElement("div"); col.className="column"; col.dataset.fecha=fecha;
    const header = document.createElement("div"); header.className="column-header"; header.textContent=fecha;
    const stack = document.createElement("div"); stack.className="card-stack"; stack.dataset.fecha=fecha;

    stack.addEventListener("dragover", e=>e.preventDefault());
    stack.addEventListener("drop", e=>{
      e.preventDefault();
      const dragId = e.dataTransfer.getData("text/task-id");
      const srcFecha = e.dataTransfer.getData("text/from-fecha");
      const targetFecha = stack.dataset.fecha;
      if(srcFecha!==targetFecha) return;
      const afterEl = getDragAfterElement(stack,e.clientY);
      const draggedEl = document.querySelector(`[data-id="${dragId}"]`);
      if(!draggedEl) return;
      if(afterEl==null) stack.appendChild(draggedEl); else stack.insertBefore(draggedEl, afterEl);
    });

    (groups[fecha]||[]).forEach(t=> stack.appendChild(createCardElement(t)));
    col.appendChild(header); col.appendChild(stack); columnsContainer.appendChild(col);
  });
}

// --- Crear tarjeta ---
function createCardElement(t){
  const card=document.createElement("div");
  card.className="task-card"+(t.completada?" completed":""); card.dataset.id=t._id;
  card.draggable=true;
  card.addEventListener("dragstart", e=>{ card.classList.add("dragging"); e.dataTransfer.setData("text/task-id",t._id); e.dataTransfer.setData("text/from-fecha",t.fecha||""); });
  card.addEventListener("dragend", ()=>card.classList.remove("dragging"));

  const head=document.createElement("div"); head.className="card-head";
  const left=document.createElement("div"); left.style.display="flex"; left.style.alignItems="center";
  const prio=document.createElement("span"); prio.className="prio "+(t.prioridad==="Alta"?"high":t.prioridad==="Media"?"medium":"low"); left.appendChild(prio);
  const title=document.createElement("div"); title.className="card-title"; title.textContent=t.titulo||"(Sin título)"; left.appendChild(title);
  head.appendChild(left);

  const right=document.createElement("div");
  const checkBtn=document.createElement("button"); checkBtn.className="icon-btn check"; checkBtn.title="Marcar completa"; checkBtn.innerHTML=t.completada?"✔":"✓";
  checkBtn.addEventListener("click", async (ev)=>{ ev.stopPropagation(); await toggleCompletada(t._id,card,!t.completada); });
  right.appendChild(checkBtn); head.appendChild(right); card.appendChild(head);

  const desc=document.createElement("div"); desc.className="card-desc"; desc.textContent=t.descripcion||""; card.appendChild(desc);
  const meta=document.createElement("div"); meta.className="card-meta"; meta.textContent="Fecha límite: "+(t.fecha||"—"); card.appendChild(meta);

  const actions=document.createElement("div"); actions.className="card-actions";
  const editBtn=document.createElement("button"); editBtn.className="icon-btn"; editBtn.title="Editar"; editBtn.innerHTML="✏️"; editBtn.addEventListener("click", ()=>openModal(t));
  const delBtn=document.createElement("button"); delBtn.className="icon-btn del"; delBtn.title="Eliminar"; delBtn.innerHTML="🗑"; delBtn.addEventListener("click", async ()=>{ if(!confirm("¿Eliminar tarea?")) return; try{ await fetch(`${API_BASE}/${t._id}`,{method:"DELETE",headers:headersWithUser()}); cargarTareas(); }catch(e){console.error(e);alert("No se pudo eliminar");} });
  actions.appendChild(editBtn); actions.appendChild(delBtn); card.appendChild(actions);
  return card;
}

// --- Completar tarea ---
async function toggleCompletada(id, tarjetaEl,newVal){
  try{
    await fetch(`${API_BASE}/${id}`,{method:"PUT",headers:headersWithUser(),body:JSON.stringify({completada:newVal})});
    if(newVal){ tarjetaEl.classList.add("completed"); tarjetaEl.style.transition="transform .4s ease, opacity .4s ease"; setTimeout(()=>{ tarjetaEl.style.opacity="0"; tarjetaEl.style.transform="translateY(-10px)"; },360); setTimeout(()=>{ if(tarjetaEl.parentElement) tarjetaEl.parentElement.removeChild(tarjetaEl); cargarTareas(); },760); } else cargarTareas();
  }catch(err){ console.error(err); alert("No se pudo actualizar el estado."); }
}

// --- Drag helper ---
function getDragAfterElement(container,y){
  const draggableElements=[...container.querySelectorAll(".task-card:not(.dragging)")];
  return draggableElements.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset) return {offset:offset,element:child}; else return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

// --- Guardar tarea ---
if(saveTaskBtn) saveTaskBtn.addEventListener("click", async ()=>{
  const payload={titulo:titleInput.value.trim(),descripcion:descInput.value.trim(),fecha:dateInput.value||"",prioridad:prioSelect.value||"Media"};
  if(!payload.titulo||!payload.fecha){ alert("El título y la fecha límite son obligatorios."); return; }
  const editId=saveTaskBtn.dataset.editId;
  try{
    if(editId){ await fetch(`${API_BASE}/${editId}`,{method:"PUT",headers:headersWithUser(),body:JSON.stringify(payload)}); } 
    else { await fetch(API_BASE,{method:"POST",headers:headersWithUser(),body:JSON.stringify(payload)}); }
    closeModal(); cargarTareas();
  }catch(e){ console.error(e); alert("Error al guardar. Revisa la consola."); }
});

// --- Reportes ---
function populateMonthFilter(fechas){
  if(!filterMonth) return;
  const sel=filterMonth.value||"all"; filterMonth.innerHTML='<option value="all">Todos</option>';
  const meses=[...new Set(fechas.map(f=>(f&&f.length>=7)?f.slice(0,7):f))].filter(Boolean);
  meses.forEach(m=>{ const opt=document.createElement("option"); opt.value=m; opt.textContent=m==="Sin fecha"?"Sin fecha":m; filterMonth.appendChild(opt); });
  if(sel) filterMonth.value=sel;
}
function computeReports(tareas){
  const total=tareas.length;
  const completed=tareas.filter(t=>t.completada).length;
  const pending=total-completed;
  const productivity=total?Math.round((completed/total)*100):0;
  if(metricProductivity) metricProductivity.textContent=productivity+"%";
  if(metricCompletedToday){ const today=new Date().toISOString().slice(0,10); metricCompletedToday.textContent=tareas.filter(t=>t.completada&&t.fecha===today).length; }
  if(metricPending) metricPending.textContent=pending;
  renderReportsList(tareas);
}
function renderReportsList(tareas){
  if(!reportsList) return;
  let filtered=tareas.slice();
  if(filterMonth&&filterMonth.value!=="all") filtered=filtered.filter(t=>(t.fecha||"").startsWith(filterMonth.value));
  if(filterPriorityReports&&filterPriorityReports.value!=="all") filtered=filtered.filter(t=>t.prioridad===filterPriorityReports.value);
  const groups={};
  filtered.forEach(t=>{ const f=t.fecha||"Sin fecha"; if(!groups[f]) groups[f]=[]; groups[f].push(t); });
  reportsList.innerHTML="";
  Object.keys(groups).sort().forEach(f=>{
    const wrap=document.createElement("div"); wrap.className="reports-list-item";
    const h=document.createElement("div"); h.style.fontWeight="700"; h.style.color="var(--text)"; h.textContent=f+" — "+groups[f].length+" tareas"; wrap.appendChild(h);
    groups[f].forEach(t=>{
      const p=document.createElement("div"); p.style.marginTop="6px";
      const dot=document.createElement("span"); dot.style.display="inline-block"; dot.style.width="10px"; dot.style.height="10px"; dot.style.borderRadius="50%"; dot.style.marginRight="8px"; dot.style.verticalAlign="middle"; dot.className="prio "+(t.prioridad==='Alta'?'high':t.prioridad==='Media'?'medium':'low');
      const strong=document.createElement("strong"); strong.style.color="var(--text)"; strong.textContent=t.titulo;
      const status=document.createElement("span"); status.style.marginLeft="8px"; status.innerHTML=t.completada?'<span style="color:var(--accent)">Completada</span>':'Pendiente';
      p.appendChild(dot); p.appendChild(strong); p.appendChild(document.createTextNode(' — ')); p.appendChild(status);
      wrap.appendChild(p);
    });
    reportsList.appendChild(wrap);
  });
}

// --- filtros ---
if(filterMonth) filterMonth.addEventListener("change", ()=>cargarTareas());
if(filterPriorityReports) filterPriorityReports.addEventListener("change", ()=>cargarTareas());

// --- Inicializar ---
cargarTareas();
