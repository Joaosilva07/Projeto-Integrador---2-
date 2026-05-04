const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const eventTypes = {
  medication: { label: "Medicamento", color: "medication" },
  health: { label: "Saude", color: "health" },
  activity: { label: "Atividade", color: "activity" },
  meal: { label: "Alimentacao", color: "meal" },
  hygiene: { label: "Higiene", color: "hygiene" },
  other: { label: "Outro", color: "other" },
};

function renderWeeklyCalendar() {
  const timeColumn = document.getElementById("time-column");
  const weeklyDays = document.getElementById("weekly-days");
  const weekRange = document.getElementById("week-range");
  if (!timeColumn || !weeklyDays || !weekRange) return;

  let timeHTML = "";
  for (let h = 8; h <= 18; h++) {
    timeHTML += `<div class="weekly-time-slot">${h.toString().padStart(2, "0")}:00</div>`;
  }
  timeColumn.innerHTML = timeHTML;

  const today = formatDate(new Date());
  let daysHTML = "";
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  weekRange.textContent = `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(currentWeekStart.getDate() + i);
    const dateStr = formatDate(dayDate);
    const isToday = dateStr === today;

    daysHTML += `
      <div class="weekly-day-column ${isToday ? "today" : ""}" data-date="${dateStr}">
        <div class="weekly-day-header">
          <div class="weekly-day-name">${weekDays[i]}</div>
          <div class="weekly-day-number">${dayDate.getDate()}</div>
        </div>
        <div class="weekly-grid-lines">
          ${Array.from({ length: 11 }, () => '<div class="weekly-grid-line"></div>').join("")}
        </div>
        ${renderEventsForDay(dateStr)}
      </div>
    `;
  }

  weeklyDays.innerHTML = daysHTML;
}

function renderEventsForDay(dateStr) {
  const pacienteId = getAgendaPacienteSelecionado();
  const dayEvents = filtrarEventosPorPaciente(eventos, pacienteId).filter((e) => e.data === dateStr);
  let html = "";

  dayEvents.forEach((ev) => {
    const [hour, minute] = (ev.hora || "08:00").split(":");
    const top = (parseInt(hour, 10) - 8) * 60 + parseInt(minute, 10);
    const typeInfo = eventTypes[ev.tipo] || eventTypes.other;

    html += `
      <div class="weekly-event ${typeInfo.color}" style="top: ${top}px;" title="${ev.titulo} - ${ev.hora}">
        <div class="weekly-event-title">${ev.titulo}</div>
        <div class="weekly-event-time">${ev.hora}</div>
      </div>
    `;
  });

  return html;
}

function changeWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
  renderWeeklyCalendar();
}

function toggleWeeklyView(view) {
  const container = document.getElementById("weekly-calendar-container");
  const buttons = document.querySelectorAll(".view-toggle-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));
  if (window.event && window.event.target) window.event.target.classList.add("active");

  if (container) {
    container.style.display = view === "week" ? "block" : "none";
  }
  if (view === "week") renderWeeklyCalendar();
}

function openEventModal() {
  const selModalPaciente = document.getElementById("event-paciente");
  const agendaPaciente = getAgendaPacienteSelecionado();
  if (selModalPaciente) {
    preencherSelectPacientesEvento();
    if (agendaPaciente) selModalPaciente.value = agendaPaciente;
  }

  if (usuarioLogado && usuarioLogado.role === "CUIDADOR" && !(selModalPaciente && selModalPaciente.value)) {
    alert("Selecione o idoso na agenda antes de criar um evento.");
    return;
  }

  const modal = document.getElementById("event-modal");
  if (modal) modal.classList.add("active");
}

function closeEventModal() {
  const modal = document.getElementById("event-modal");
  if (modal) modal.classList.remove("active");
}
