const usuario = JSON.parse(localStorage.getItem("fm_usuario"));
if (!usuario) window.location.href = "/login";

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login";
});

const modal = document.getElementById("taskModal");
const saveBtn = document.getElementById("saveTaskBtn");
const cancelBtn = document.getElementById("cancelBtn");

document.getElementById("addTaskCard").onclick = () => {
    modal.classList.remove("hidden");
};

cancelBtn.onclick = () => {
    modal.classList.add("hidden");
};

async function cargarTareas() {
    const res = await fetch("/api/tareas", {
        method: "GET",
        headers: { "X-User": usuario.correo }
    });
    const tareas = await res.json();
    mostrarTareas(tareas);
}

function mostrarTareas(lista) {
    const cont = document.getElementById("taskList");
    cont.innerHTML = "";

    lista.forEach(t => {
        const div = document.createElement("div");
        div.className = "task-item";

        div.innerHTML = `
            <h4>${t.titulo}</h4>
            <p>${t.descripcion}</p>
            <small>Fecha: ${t.fecha}</small><br>
            <small>Prioridad: ${t.prioridad}</small>
        `;

        cont.appendChild(div);
    });
}

saveBtn.onclick = async () => {
    const data = {
        titulo: titulo.value,
        descripcion: descripcion.value,
        fecha: fecha.value,
        prioridad: prioridad.value
    };

    await fetch("/api/tareas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-User": usuario.correo
        },
        body: JSON.stringify(data)
    });

    modal.classList.add("hidden");
    cargarTareas();
};

cargarTareas();
