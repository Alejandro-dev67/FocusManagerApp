const usuario = JSON.parse(localStorage.getItem("fm_usuario"));
if (!usuario) location.href = "/login";

// UI elements
const userNameDisplay = document.getElementById("userNameDisplay");
const userBtn = document.getElementById("userBtn");
const userDropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");

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

userNameDisplay.textContent = usuario.nombre || usuario.correo;

// toggle user dropdown
userBtn.addEventListener("click", (e) => {
  userDropdown.classList.toggle("hidden");
});
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  location.href = "/login";
});

// modal open/close
function openModal(editTask = null) {
  taskModal.classList.add("show");
  taskModal.classList.remove("hidden");
  // prefill if editTask provided
  if (editTask) {
    titleInput.value = editTask.titulo || "";
    descInput.value = editTask.descripcion || "";
    dateInput.value = editTask.fecha || "";
    prioSelect.value = editTask.prioridad || "Media";
    saveTaskBtn.dataset.editId = editTask._id;
    document.querySelector(".modal-title").textContent = "Editar tarea";
  } else {
    titleInput.value = "";
    descInput.value = "";
    dateInput.value = "";
    prioSelect.value = "Media";
    delete saveTaskBtn.dataset.editId;
    document.querySelector(".modal-title").textContent = "Crear nueva tarea";
  }
  setTimeout(()=> modalBox.scrollTop = 0, 10);
}
function closeModal(){
  taskModal.classList.remove("show");
  taskModal.classList.add("hidden");
  delete saveTaskBtn.dataset.editId;
}
cancelBtn.onclick = closeModal;
taskModal.addEventListener("click", (e) => {
  if (e.target === taskModal) closeModal(); // click fuera
});

// add button opens modal
addTaskCard.addEventListener("click", () => openModal());

// API helpers
const API_BASE = "/api/tareas";
const headersWithUser = (extra={}) => Object.assign({
  "Content-Type":"application/json",
  "X-User": usuario.correo
}, extra);

// load tasks from backend and render grouped by date
async function cargarTareas(){
  try {
    const res = await fetch(API_BASE, { headers: headersWithUser() });
    const tareas = await res.json();
    // group by fecha (fecha string)
    const groups = {};
    tareas.forEach(t => {
      const fecha = t.fecha || "Sin fecha";
      if (!groups[fecha]) groups[fecha] = [];
      groups[fecha].push(t);
    });
    // sort dates ascending (strings YYYY-MM-DD will sort correctly)
    const fechas = Object.keys(groups).sort();
    renderColumns(fechas, groups);
  } catch(err){
    console.error("Error cargando tareas:", err);
    // fallback: empty board
    renderColumns([], {});
  }
}

// render columns
function renderColumns(fechas, groups){
  columnsContainer.innerHTML = "";
  // for each date generate a column
  fechas.forEach(fecha => {
    const col = document.createElement("div");
    col.className = "column";
    col.dataset.fecha = fecha;

    const header = document.createElement("div");
    header.className = "column-header";
    header.textContent = fecha;
    col.appendChild(header);

    const stack = document.createElement("div");
    stack.className = "card-stack";
    stack.dataset.fecha = fecha;

    // make stack a valid drop zone
    stack.addEventListener("dragover", e => e.preventDefault());
    stack.addEventListener("drop", async (e) => {
      e.preventDefault();
      const dragId = e.dataTransfer.getData("text/task-id");
      const srcFecha = e.dataTransfer.getData("text/from-fecha");
      const targetFecha = stack.dataset.fecha;
      // only allow reordering within same fecha
      if (srcFecha !== targetFecha) return;
      const afterEl = getDragAfterElement(stack, e.clientY);
      const draggedEl = document.querySelector(`[data-id="${dragId}"]`);
      if (!draggedEl) return;
      if (afterEl == null) stack.appendChild(draggedEl);
      else stack.insertBefore(draggedEl, afterEl);

      // Optionally, update order on backend (not implemented because no order field)
    });

    // add cards
    (groups[fecha] || []).forEach(t => {
      const card = createCardElement(t);
      stack.appendChild(card);
    });

    col.appendChild(stack);
    columnsContainer.appendChild(col);
  });

  // if no columns, show nothing (user can click add)
}

// create card DOM
function createCardElement(t){
  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.id = t._id;

  // draggable for reordering inside column
  card.draggable = true;
  card.addEventListener("dragstart", e => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/task-id", t._id);
    e.dataTransfer.setData("text/from-fecha", t.fecha || "");
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  const head = document.createElement("div");
  head.className = "card-head";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";

  const prio = document.createElement("span");
  prio.className = "prio " + (t.prioridad === "Alta" ? "high" : (t.prioridad === "Media" ? "medium" : "low"));
  left.appendChild(prio);

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = t.titulo || "(Sin título)";
  left.appendChild(title);

  head.appendChild(left);

  // Right side: completed checkbox (chulo)
  const right = document.createElement("div");
  // check button
  const checkBtn = document.createElement("button");
  checkBtn.className = "icon-btn check";
  checkBtn.title = "Marcar completa";
  checkBtn.innerHTML = t.completada ? "✔" : "✓";
  checkBtn.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/${t._id}`, {
        method: "PUT",
        headers: headersWithUser(),
        body: JSON.stringify({ completada: !t.completada })
      });
      cargarTareas();
    } catch(e){ console.error(e); }
  });
  right.appendChild(checkBtn);

  head.appendChild(right);
  card.appendChild(head);

  const desc = document.createElement("div");
  desc.className = "card-desc";
  desc.textContent = t.descripcion || "";
  card.appendChild(desc);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.textContent = "Fecha límite: " + (t.fecha || "—");
  card.appendChild(meta);

  // actions row: edit + delete
  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.title = "Editar";
  editBtn.innerHTML = "✏️";
  editBtn.addEventListener("click", () => openEdit(t));
  actions.appendChild(editBtn);

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn del";
  delBtn.title = "Eliminar";
  delBtn.innerHTML = "🗑";
  delBtn.addEventListener("click", async () => {
    if (!confirm("¿Eliminar tarea?")) return;
    try {
      await fetch(`${API_BASE}/${t._id}`, { method: "DELETE", headers: headersWithUser() });
      cargarTareas();
    } catch(e){ console.error(e); }
  });
  actions.appendChild(delBtn);

  card.appendChild(actions);
  return card;
}

function openEdit(t){
  openModal(t);
}

// utility to find insertion point while dragging vertically
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* MODAL save -> create or edit */
saveTaskBtn.addEventListener("click", async () => {
  const payload = {
    titulo: titleInput.value.trim(),
    descripcion: descInput.value.trim(),
    fecha: dateInput.value || "",
    prioridad: prioSelect.value || "Media"
  };
  // validation
  if (!payload.titulo || !payload.fecha) {
    alert("El título y la fecha límite son obligatorios.");
    return;
  }

  // if edit
  const editId = saveTaskBtn.dataset.editId;
  try {
    if (editId) {
      await fetch(`${API_BASE}/${editId}`, {
        method: "PUT",
        headers: headersWithUser(),
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(API_BASE, {
        method: "POST",
        headers: headersWithUser(),
        body: JSON.stringify(payload)
      });
    }
    closeModal();
    cargarTareas();
  } catch(e){
    console.error(e);
    alert("Error al guardar. Revisa la consola.");
  }
});

// initial load
cargarTareas();
