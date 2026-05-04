const titles = {
  dashboard: "Visao Geral",
  usuarios: "Usuarios",
  medicamentos: "Medicamentos & Prescricoes",
  historico: "Historico de Cuidados",
  agenda: "Agenda de Tarefas",
};

const btnLabels = {
  dashboard: "+ Novo Registro",
  usuarios: "+ Novo Usuario",
  medicamentos: "+ Novo Medicamento",
  historico: "+ Novo Registro",
  agenda: "+ Nova Tarefa",
};

let eventos = [];
let medicamentosGlobal = [];
let usuariosGlobal = [];
let usuarioLogado = null;
let currentWeekStart = getWeekStart(new Date());

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function filtrarEventosPorPaciente(evs, pacienteId) {
  if (!pacienteId) return evs;
  return evs.filter((e) => e.paciente && String(e.paciente.id) === String(pacienteId));
}

function getAgendaPacienteSelecionado() {
  const sel = document.getElementById("agenda-filtro-idoso");
  return sel ? sel.value : "";
}

function showView(name, navEl) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  if (navEl) navEl.classList.add("active");
  document.getElementById("topbar-title").textContent = titles[name];
  document.getElementById("topbar-btn").textContent = btnLabels[name];

  if (name === "agenda") {
    renderWeeklyCalendar();
    carregarEventos();
  }
}

function logout() {
  sessionStorage.removeItem("jamesUser");
  window.location.href = "/Loguin.html";
}
