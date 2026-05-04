const titles = {
        dashboard: "Visão Geral",
        usuarios: "Usuários",
        medicamentos: "Medicamentos & Prescrições",
        historico: "Histórico de Cuidados",
        agenda: "Agenda de Tarefas",
      };

      const btnLabels = {
        dashboard: "+ Novo Registro",
        usuarios: "+ Novo Usuário",
        medicamentos: "+ Novo Medicamento",
        historico: "+ Novo Registro",
        agenda: "+ Nova Tarefa",
      };

      // ═══════════════════════════════════════════════════════
      // CALENDÁRIO SEMANAL - Integração Front-end
      // ═══════════════════════════════════════════════════════

      let eventos = [];
      let medicamentosGlobal = [];
      let usuariosGlobal = [];
      let usuarioLogado = null;
      const selectedIdosoFromUrl = new URLSearchParams(window.location.search).get('idosoId');
      let currentWeekStart = getWeekStart(new Date());
      let calendarViewMode = "week";
      let currentDayCursor = new Date();

      const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const eventTypes = {
        medication: { label: "Medicamento", color: "medication" },
        health: { label: "Saúde", color: "health" },
        activity: { label: "Atividade", color: "activity" },
        meal: { label: "Alimentação", color: "meal" },
        hygiene: { label: "Higiene", color: "hygiene" },
        other: { label: "Outro", color: "other" },
      };

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
        const sel = document.getElementById('agenda-filtro-idoso');
        return sel ? sel.value : '';
      }

      function renderWeeklyCalendar() {
        const timeColumn = document.getElementById("time-column");
        const weeklyDays = document.getElementById("weekly-days");
        const weekRange = document.getElementById("week-range");

        // Renderizar coluna de horas
        let timeHTML = "";
        for (let h = 8; h <= 18; h++) {
          timeHTML += `<div class="weekly-time-slot">${h.toString().padStart(2, "0")}:00</div>`;
        }
        timeColumn.innerHTML = timeHTML;

        // Renderizar dias da semana
        const today = formatDate(new Date());
        let daysHTML = "";

        const monthNames = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ];
        if (calendarViewMode === "day") {
          const d = new Date(currentDayCursor);
          weekRange.textContent = `${d.getDate().toString().padStart(2, "0")} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        } else {
          weekRange.textContent = `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;
        }

        const totalDays = calendarViewMode === "day" ? 1 : 7;
        for (let i = 0; i < totalDays; i++) {
          const dayDate = calendarViewMode === "day"
            ? new Date(currentDayCursor)
            : new Date(currentWeekStart);
          if (calendarViewMode !== "day") {
            dayDate.setDate(currentWeekStart.getDate() + i);
          }
          const dateStr = formatDate(dayDate);
          const isToday = dateStr === today;
          const dayName = weekDays[dayDate.getDay()];

          daysHTML += `
        <div class="weekly-day-column ${isToday ? "today" : ""}" data-date="${dateStr}">
          <div class="weekly-day-header">
            <div class="weekly-day-name">${dayName}</div>
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
        const headerOffset = 56;

        dayEvents.forEach((ev) => {
          const [hour, minute] = ev.hora.split(":");
          const top = headerOffset + (parseInt(hour) - 8) * 60 + parseInt(minute);
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
        if (calendarViewMode === "day") {
          currentDayCursor.setDate(currentDayCursor.getDate() + direction);
        } else {
          currentWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
        }
        renderWeeklyCalendar();
      }

      function toggleWeeklyView(view) {
        const container = document.getElementById("weekly-calendar-container");
        const buttons = document.querySelectorAll(".view-toggle-btn");

        buttons.forEach((btn) => btn.classList.remove("active"));
        if (window.event && window.event.target) {
          window.event.target.classList.add("active");
        }

        calendarViewMode = view === "day" ? "day" : "week";
        if (container) {
          container.style.display = "block";
        }
        renderWeeklyCalendar();
      }

      function openEventModal() {
        const selModalPaciente = document.getElementById('event-paciente');
        const agendaPaciente = getAgendaPacienteSelecionado();
        if (selModalPaciente) {
          preencherSelectPacientesEvento();
          if (agendaPaciente) selModalPaciente.value = agendaPaciente;
        }
        if (usuarioLogado && usuarioLogado.role === 'CUIDADOR' && !selModalPaciente?.value) {
          alert('Selecione o idoso na agenda antes de criar um evento.');
          return;
        }
        const modal = document.getElementById("event-modal");
        if (modal) {
          modal.classList.add("active");
        }
      }

      function closeEventModal() {
        const modal = document.getElementById("event-modal");
        if (modal) {
          modal.classList.remove("active");
        }
      }

      function saveEvent() {
        const titulo = document.getElementById("event-title").value;
        const data = document.getElementById("event-date").value;
        const hora = document.getElementById("event-time").value;
        const tipo = document.getElementById("event-type").value;

        if (!titulo || !data || !hora) {
          alert("Preencha todos os campos!");
          return;
        }

        eventos.push({ titulo, data, hora, tipo });
        localStorage.setItem("eventos", JSON.stringify(eventos));

        closeEventModal();
        renderWeeklyCalendar();

        // Limpar campos
        document.getElementById("event-title").value = "";
        document.getElementById("event-date").value = "";
        document.getElementById("event-time").value = "";
        document.getElementById("event-type").value = "medication";
      }

      // Inicializar calendário quando a view agenda for carregada
      const originalShowView = showView;
      showView = function (name, navEl) {
        originalShowView(name, navEl);
        if (name === "agenda") {
          renderWeeklyCalendar();
          carregarEventos();
        }
      };

      function showView(name, navEl) {
        document
          .querySelectorAll(".view")
          .forEach((v) => v.classList.remove("active"));
        document.getElementById("view-" + name).classList.add("active");
        document
          .querySelectorAll(".nav-item")
          .forEach((n) => n.classList.remove("active"));
        if (navEl) navEl.classList.add("active");
        document.getElementById("topbar-title").textContent = titles[name];
        document.getElementById("topbar-btn").textContent = btnLabels[name];
      }

      // ===============================
      // SISTEMA DE NOTIFICAÇÕES
      // ===============================

      let notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

      function adicionarNotificacao(msg) {
        notificacoes.unshift({
          mensagem: msg,
          data: new Date().toLocaleTimeString(),
        });

        localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
        renderNotificacoes();
      }

      function renderNotificacoes() {
        const list = document.getElementById("notif-list");
        const count = document.getElementById("notif-count");

        list.innerHTML = "";

        notificacoes.slice(0, 5).forEach((n) => {
          list.innerHTML += `
      <div class="notif-item">
        ${n.mensagem}<br>
        <small>${n.data}</small>
      </div>
    `;
        });

        count.textContent = notificacoes.length;
      }

      function toggleNotifications() {
        document.getElementById("notif-dropdown").classList.toggle("active");
      }

      // ===============================
      // ALERTAS AUTOMÁTICOS (DASHBOARD)
      // ===============================

      function verificarAlertas() {
        const baixoEstoque = medicamentosGlobal.filter(m => (m.Unidades || 0) <= 5);
        if (baixoEstoque.length > 0) adicionarNotificacao(`⚠️ ${baixoEstoque.length} medicamento(s) com estoque baixo`);
        const hoje = new Date().toISOString().split('T')[0];
        const hojeEvs = eventos.filter(e => e.data === hoje);
        if (hojeEvs.length > 0) adicionarNotificacao(`📅 ${hojeEvs.length} tarefa(s) para hoje`);
      }

      function atualizarDashboard() {
        document.getElementById("alert-count").textContent = notificacoes.length;
      }

      window.onload = () => {
        // ── Auth ──────────────────────────────────────────────
        const userJson = sessionStorage.getItem('jamesUser');
        if (!userJson) { window.location.href = '/Loguin.html'; return; }
        const me = JSON.parse(userJson);

        if (me.role === 'IDOSO') { window.location.href = '/idoso.html'; return; }
        if (me.role === 'PARENTE') { window.location.href = '/parente.html'; return; }
        usuarioLogado = me;
        document.querySelector('.user-name').textContent = me.nome || 'Usuário';
        document.querySelector('.user-role').textContent = me.role || '';
        const initials = (me.nome || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        document.querySelector('.user-avatar').textContent = initials;

        // ── Controle de acesso por role (só ADMIN gerencia usuários) ──
        if (me.role !== 'ADMIN') {
          const usuariosNavBtn = document.querySelector('[onclick*="usuarios"]');
          if (usuariosNavBtn) {
            usuariosNavBtn.style.display = 'none';
            const prevEl = usuariosNavBtn.previousElementSibling;
            if (prevEl && prevEl.classList.contains('nav-section-label')) prevEl.style.display = 'none';
          }
          const viewUsuarios = document.getElementById('view-usuarios');
          if (viewUsuarios) viewUsuarios.style.display = 'none';
        }

        // ── Notificações ───────────────────────────────────────
        renderNotificacoes();
        atualizarDashboard();

        // ── Limpar mocks ───────────────────────────────────────
        const tlMock = document.getElementById('timeline-cuidados');
        if (tlMock) tlMock.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Carregando...</div>';
        const agendaGrid = document.querySelector('#view-agenda .agenda-grid');
        if (agendaGrid) agendaGrid.innerHTML = '';
        const historicoTbody = document.getElementById('tbody-historico');
        if (historicoTbody) historicoTbody.innerHTML = '';

        // ── Carregar dados da API ──────────────────────────────
        carregarUsuarios();
        carregarMedicamentos();
        carregarEventos();
      };

      // ═══════════════════════════════════════════════════════
      // USUÁRIOS
      // ═══════════════════════════════════════════════════════
      async function carregarUsuarios() {
        try {
          const res = await fetch('/api/user');
          const users = await res.json();
          usuariosGlobal = users;
          renderTabelaUsuarios(users);
          atualizarStatsUsuarios(users);
          preencherFiltrosPacientes(users);
          preencherSelectPacientes();
          preencherSelectPacientesEvento();
        } catch(e) { console.error('Erro ao carregar usuários', e); }
      }

      function preencherFiltrosPacientes(users) {
        const idosos = users.filter(u => u.role === 'IDOSO');
        const historicoSel = document.getElementById('historico-filtro-paciente');
        const agendaSel = document.getElementById('agenda-filtro-idoso');

        if (historicoSel) {
          const atual = historicoSel.value;
          historicoSel.innerHTML = '<option value="">Todos os pacientes</option>';
          idosos.forEach(i => { historicoSel.innerHTML += `<option value="${i.id}">${i.nome}</option>`; });
          const preferidoHistorico = idosos.some(i => String(i.id) === String(selectedIdosoFromUrl))
            ? String(selectedIdosoFromUrl)
            : (idosos.some(i => String(i.id) === String(atual)) ? atual : '');
          historicoSel.value = preferidoHistorico;
        }

        if (agendaSel) {
          const atual = agendaSel.value;
          agendaSel.innerHTML = '<option value="">Todos os idosos</option>';
          idosos.forEach(i => { agendaSel.innerHTML += `<option value="${i.id}">${i.nome}</option>`; });
          const preferidoAgenda = idosos.some(i => String(i.id) === String(selectedIdosoFromUrl))
            ? String(selectedIdosoFromUrl)
            : atual;
          if (usuarioLogado && usuarioLogado.role === 'CUIDADOR') {
            agendaSel.value = idosos.some(i => String(i.id) === String(preferidoAgenda)) ? preferidoAgenda : (idosos[0] ? String(idosos[0].id) : '');
          } else {
            agendaSel.value = idosos.some(i => String(i.id) === String(preferidoAgenda)) ? preferidoAgenda : '';
          }
        }
      }

      function atualizarStatsUsuarios(users) {
        const idosos = users.filter(u => u.role === 'IDOSO').length;
        const cuidadores = users.filter(u => u.role === 'CUIDADOR').length;
        const parentes = users.filter(u => u.role === 'PARENTE').length;
        const statsCards = document.querySelectorAll('#view-usuarios .stat-card .stat-value');
        if (statsCards[0]) statsCards[0].textContent = idosos;
        if (statsCards[1]) statsCards[1].textContent = cuidadores;
        if (statsCards[2]) statsCards[2].textContent = parentes;
        const dashIdosos = document.getElementById('dash-idosos');
        if (dashIdosos) dashIdosos.textContent = idosos;
      }

      function renderTabelaUsuarios(users) {
        const tbody = document.getElementById('tbody-usuarios') || document.querySelector('#view-usuarios table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px">Nenhum usuário cadastrado.</td></tr>';
          return;
        }
        const roleColors = { ADMIN: 'av-terra', IDOSO: 'av-blue', CUIDADOR: 'av-green', PARENTE: 'av-amber' };
        const roleBadge = { ADMIN: 'badge-idoso', IDOSO: 'badge-idoso', CUIDADOR: 'badge-cuidador', PARENTE: 'badge-parente' };
        const roleLabel = { ADMIN: 'Admin', IDOSO: 'Idoso', CUIDADOR: 'Cuidador', PARENTE: 'Parente' };
        users.forEach(u => {
          const initials = (u.nome || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          const vinculados = (u.responsaveis || []).map(r => r.nome).join(', ') || '—';
          tbody.innerHTML += `<tr>
            <td><div class="flex-cell"><div class="avatar ${roleColors[u.role] || 'av-blue'}">${initials}</div><div><div class="name">${u.nome}</div><div class="sub">${u.email}</div></div></div></td>
            <td><span class="badge ${roleBadge[u.role] || ''}">${roleLabel[u.role] || u.role}</span></td>
            <td>${u.email}</td>
            <td>${vinculados}</td>
            <td><button class="btn btn-ghost" style="padding:5px 12px;font-size:12px;color:var(--terracotta)" onclick="excluirUsuario(${u.id})">Excluir</button></td>
          </tr>`;
        });
      }

      async function excluirUsuario(id) {
        if (!confirm('Excluir este usuário?')) return;
        await fetch('/api/user/' + id, { method: 'DELETE' });
        carregarUsuarios();
      }

      function abrirModalUsuario() {
        document.getElementById('modal-usuario').classList.add('active');
      }
      function fecharModalUsuario() {
        document.getElementById('modal-usuario').classList.remove('active');
      }

      async function salvarUsuario() {
        const nome = document.getElementById('u-nome').value.trim();
        const email = document.getElementById('u-email').value.trim();
        const senha = document.getElementById('u-senha').value.trim();
        const role = document.getElementById('u-role').value;
        const erroEl = document.getElementById('u-erro');
        erroEl.style.display = 'none';
        if (!nome || !email || !senha) { erroEl.textContent = 'Preencha todos os campos.'; erroEl.style.display='block'; return; }
        try {
          const res = await fetch('/api/user', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ nome, email, senha, role })
          });
          if (!res.ok) { const t = await res.text(); throw new Error(t); }
          fecharModalUsuario();
          document.getElementById('u-nome').value=''; document.getElementById('u-email').value='';
          document.getElementById('u-senha').value='';
          carregarUsuarios();
        } catch(e) { erroEl.textContent = e.message; erroEl.style.display='block'; }
      }

      // ═══════════════════════════════════════════════════════
      // MEDICAMENTOS
      // ═══════════════════════════════════════════════════════
      async function carregarMedicamentos() {
        try {
          const res = await fetch('/Medicines');
          const meds = await res.json();
          medicamentosGlobal = meds;
          renderCardsMedicamentos(meds);
          renderEstoqueCritico(meds);
          const dashMeds = document.getElementById('dash-meds');
          const dashMedsSub = document.getElementById('dash-meds-sub');
          if (dashMeds) dashMeds.textContent = meds.length;
          const baixoCount = meds.filter(m => (m.Unidades || 0) <= 5).length;
          if (dashMedsSub) dashMedsSub.textContent = baixoCount > 0 ? `${baixoCount} com estoque baixo` : '';
        } catch(e) { console.error('Erro ao carregar medicamentos', e); }
      }

      function renderCardsMedicamentos(meds) {
        const grid = document.querySelector('#view-medicamentos .cards-grid');
        if (!grid) return;
        // Manter o card "+" no final
        const addCard = grid.querySelector('[style*="dashed"]');
        grid.innerHTML = '';
        meds.forEach(m => {
          const baixo = (m.Unidades || 0) <= 5;
          grid.innerHTML += `<div class="card">
            <div class="card-header">
              <div>
                <div class="card-icon" style="background:var(--terracotta-light);font-size:18px;margin-bottom:8px;">💊</div>
                <div class="card-name">${m.Nome || 'Sem nome'}</div>
                <div class="card-detail">${m.Horario || ''}</div>
              </div>
              <span class="badge ${baixo ? 'badge-estoque-baixo' : 'badge-estoque-ok'}">${baixo ? 'Estoque baixo' : 'OK'}</span>
            </div>
            <div class="card-row"><span class="card-row-label">Horário</span><span class="card-row-value">${m.Horario || '—'}</span></div>
            <div class="card-row"><span class="card-row-label">Paciente</span><span class="card-row-value">${m.Paciente ? m.Paciente.nome : '—'}</span></div>
            <div class="card-row"><span class="card-row-label">Estoque</span><span class="card-row-value" style="color:${baixo ? 'var(--terracotta)' : 'var(--sage-600)'}">${m.Unidades ?? '?'} unid.</span></div>
            <button class="btn btn-ghost" style="margin-top:8px;width:100%;font-size:12px;color:var(--terracotta)" onclick="excluirMedicamento(${m.id})">Excluir</button>
          </div>`;
        });
        if (addCard) grid.appendChild(addCard);
        else grid.innerHTML += `<div class="card" style="border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:200px;cursor:pointer;background:var(--sand-50);" onclick="abrirModalMedicamento()"><div style="text-align:center;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px;font-weight:500">Adicionar medicamento</div></div></div>`;
      }

      async function excluirMedicamento(id) {
        if (!confirm('Excluir este medicamento?')) return;
        await fetch('/Medicines/' + id, { method: 'DELETE' });
        carregarMedicamentos();
      }

      function abrirModalMedicamento() {
        document.getElementById('modal-med').classList.add('active');
      }
      function fecharModalMedicamento() {
        document.getElementById('modal-med').classList.remove('active');
      }

      async function salvarMedicamento() {
        const nome = document.getElementById('m-nome').value.trim();
        const horario = document.getElementById('m-horario').value.trim();
        const unidades = parseInt(document.getElementById('m-unidades').value) || 0;
        const pacienteId = document.getElementById('m-paciente').value;
        const erroEl = document.getElementById('m-erro');
        erroEl.style.display = 'none';
        if (!nome) { erroEl.textContent = 'Informe o nome do medicamento.'; erroEl.style.display='block'; return; }
        const body = { Nome: nome, Horario: horario, Unidades: unidades };
        if (pacienteId) body.Paciente = { id: parseInt(pacienteId) };
        try {
          const res = await fetch('/Medicines/create_medicine', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(body)
          });
          if (!res.ok) throw new Error('Erro ao salvar.');
          fecharModalMedicamento();
          document.getElementById('m-nome').value=''; document.getElementById('m-horario').value='';
          document.getElementById('m-unidades').value=''; document.getElementById('m-paciente').value='';
          carregarMedicamentos();
        } catch(e) { erroEl.textContent = e.message; erroEl.style.display='block'; }
      }

      // ═══════════════════════════════════════════════════════
      // AGENDA / EVENTOS
      // ═══════════════════════════════════════════════════════
      async function carregarEventos() {
        try {
          const res = await fetch('/Eventos/listaEventos');
          const evs = await res.json();
          eventos = evs.map(e => ({ ...e, tipo: e.tipo || 'other' }));
          renderAgendaLista(evs);
          renderCuidadosRecentes(evs);
          renderProximasTarefas(evs);
          renderHistorico(evs);
          const hoje = new Date().toISOString().split('T')[0];
          const hojeEvs = evs.filter(e => e.data === hoje);
          const dashPend = document.getElementById('dash-pendencias');
          const dashTar = document.getElementById('dash-tarefas');
          if (dashPend) dashPend.textContent = hojeEvs.length;
          if (dashTar) dashTar.textContent = evs.length;
          verificarAlertas();
          renderWeeklyCalendar();
        } catch(e) { console.error('Erro ao carregar eventos', e); }
      }

      function renderEstoqueCritico(meds) {
        const tbody = document.getElementById('tbody-estoque-critico');
        if (!tbody) return;
        const sorted = [...meds].sort((a, b) => (a.Unidades || 0) - (b.Unidades || 0)).slice(0, 6);
        if (sorted.length === 0) {
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--text-muted);padding:12px">Nenhum medicamento cadastrado.</td></tr>';
          return;
        }
        tbody.innerHTML = sorted.map(m => {
          const baixo = (m.Unidades || 0) <= 5;
          return `<tr><td><div class="name">${m.Nome || '—'}</div><div class="sub">${m.Paciente ? m.Paciente.nome : '—'}</div></td><td><span class="badge badge-estoque-${baixo ? 'baixo' : 'ok'}">${m.Unidades ?? '?'} unid.</span></td></tr>`;
        }).join('');
      }

      function renderCuidadosRecentes(evs) {
        const tl = document.getElementById('timeline-cuidados');
        if (!tl) return;
        const recentes = [...evs].reverse().slice(0, 4);
        if (recentes.length === 0) {
          tl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Nenhum evento registrado.</div>';
          return;
        }
        const colors = { medication: 'var(--sage-500)', health: 'var(--blue-muted)', activity: 'var(--sage-500)', meal: 'var(--amber)', hygiene: 'var(--blue-muted)', other: 'var(--terracotta)' };
        tl.innerHTML = recentes.map((e, i) => `
          <div class="tl-item">
            <div class="tl-dot-wrap">
              <div class="tl-dot" style="background:${colors[e.tipo] || 'var(--sage-500)'}"></div>
              ${i < recentes.length - 1 ? '<div class="tl-line"></div>' : ''}
            </div>
            <div class="tl-content">
              <div class="tl-title">${e.titulo}</div>
              <div class="tl-meta">${e.data || ''} ${e.hora || ''} <span class="badge badge-realizado" style="margin-left:6px">Registrado</span></div>
            </div>
          </div>`).join('');
      }

      function renderProximasTarefas(evs) {
        const container = document.getElementById('lista-proximas-tarefas');
        if (!container) return;
        const hoje = new Date().toISOString().split('T')[0];
        const hojeEvs = evs.filter(e => e.data === hoje).sort((a, b) => (a.hora || '').localeCompare(b.hora || '')).slice(0, 5);
        if (hojeEvs.length === 0) {
          container.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">Nenhuma tarefa para hoje.</div>';
          return;
        }
        const colors = { medication: 'var(--sage-500)', health: 'var(--blue-muted)', activity: 'var(--sage-500)', meal: 'var(--amber)', hygiene: 'var(--terracotta)', other: 'var(--terracotta)' };
        container.innerHTML = hojeEvs.map(e => `
          <div class="agenda-item">
            <div class="agenda-time">${e.hora || '—'}</div>
            <div class="agenda-dot" style="background:${colors[e.tipo] || 'var(--sage-500)'}"></div>
            <div><div class="agenda-desc">${e.titulo}</div><div class="agenda-type">${e.tipo || 'Evento'}</div></div>
          </div>`).join('');
      }

      function renderHistorico(evs) {
        const tbody = document.getElementById('tbody-historico');
        if (!tbody) return;
        const pacienteId = document.getElementById('historico-filtro-paciente')?.value || '';
        const filtrados = filtrarEventosPorPaciente(evs, pacienteId);
        if (filtrados.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:16px">Nenhum evento registrado.</td></tr>';
          return;
        }
        tbody.innerHTML = [...filtrados].reverse().map(e => `<tr>
          <td>${e.paciente ? e.paciente.nome : '—'}</td><td>—</td>
          <td><div class="name" style="font-size:13px">${e.data || '—'}</div><div class="sub">${e.hora || ''}</div></td>
          <td>${e.titulo || '—'}</td>
          <td><span class="badge badge-realizado">Registrado</span></td>
          <td style="font-size:12.5px;font-style:italic;color:var(--text-muted)">${e.tipo || '—'}</td>
        </tr>`).join('');
      }

      function renderAgendaLista(evs) {
        const hoje = new Date().toISOString().split('T')[0];
        const container = document.getElementById('agenda-grid') || document.querySelector('#view-agenda .agenda-grid');
        if (!container) return;
        const pacienteId = getAgendaPacienteSelecionado();
        const hojeEvs = filtrarEventosPorPaciente(evs, pacienteId).filter(e => e.data === hoje);
        container.innerHTML = '';
        if (hojeEvs.length === 0) {
          container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Nenhum evento para hoje. Clique em "+ Nova Tarefa" para adicionar.</div>';
          return;
        }
        hojeEvs.forEach(e => {
          container.innerHTML += `<div class="agenda-card">
            <div class="agenda-card-header">
              <div class="agenda-patient-dot" style="background:var(--sage-500)"></div>
              <div>
                <div class="agenda-patient-name">${e.titulo}</div>
                <div class="agenda-patient-age">${e.hora} · ${e.tipo || ''} · ${e.paciente ? e.paciente.nome : ''}</div>
              </div>
            </div>
            <div style="padding:8px 0">
              <button class="btn btn-ghost" style="font-size:12px;color:var(--terracotta)" onclick="excluirEvento(${e.id})">Excluir evento</button>
            </div>
          </div>`;
        });
        container.innerHTML += `<div class="agenda-card" style="border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:120px;cursor:pointer;background:var(--sand-50);" onclick="openEventModal()"><div style="text-align:center;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px;font-weight:500">Adicionar evento</div></div></div>`;
      }

      async function excluirEvento(id) {
        if (!confirm('Excluir este evento?')) return;
        await fetch('/Eventos/' + id, { method: 'DELETE' });
        carregarEventos();
      }

      // Override saveEvent para também chamar a API
      const _saveEventOriginal = saveEvent;
      saveEvent = async function() {
        const titulo = document.getElementById('event-title').value;
        const data = document.getElementById('event-date').value;
        const hora = document.getElementById('event-time').value;
        const tipo = document.getElementById('event-type').value;
        const pacienteId = document.getElementById('event-paciente').value;
        if (!titulo || !data || !hora) { alert('Preencha todos os campos!'); return; }
        if (usuarioLogado && usuarioLogado.role === 'CUIDADOR' && !pacienteId) { alert('Selecione o idoso para criar o evento.'); return; }
        try {
          const body = { titulo, data, hora, tipo };
          if (pacienteId) body.paciente = { id: parseInt(pacienteId) };
          const res = await fetch('/Eventos/criarEvent', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(body)
          });
          if (res.ok) {
            closeEventModal();
            document.getElementById('event-title').value='';
            document.getElementById('event-date').value='';
            document.getElementById('event-time').value='';
            document.getElementById('event-type').value='medication';
            document.getElementById('event-paciente').value='';
            carregarEventos();
          }
        } catch(e) { alert('Erro ao salvar evento.'); }
      };

      // Carregar lista de pacientes no select do modal de medicamentos
      function preencherSelectPacientes() {
        const sel = document.getElementById('m-paciente');
        if (!sel) return;
        sel.innerHTML = '<option value="">Nenhum</option>';
        usuariosGlobal.filter(u => u.role === 'IDOSO').forEach(u => {
          sel.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
        });
      }

      function preencherSelectPacientesEvento() {
        const sel = document.getElementById('event-paciente');
        if (!sel) return;
        const atual = sel.value;
        sel.innerHTML = '<option value="">Selecione o idoso</option>';
        usuariosGlobal.filter(u => u.role === 'IDOSO').forEach(u => {
          sel.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
        });
        sel.value = usuariosGlobal.some(u => u.role === 'IDOSO' && String(u.id) === String(atual)) ? atual : '';
      }

      // Sobrescrever abrirModalMedicamento para preencher select
      const _abrirModalMed = abrirModalMedicamento;
      abrirModalMedicamento = function() {
        preencherSelectPacientes();
        document.getElementById('modal-med').classList.add('active');
      };

      // Botão "topbar-btn" chama ação da view ativa
      document.getElementById('topbar-btn').addEventListener('click', () => {
        const activeView = document.querySelector('.view.active');
        if (!activeView) return;
        const id = activeView.id;
        if (id === 'view-usuarios') abrirModalUsuario();
        else if (id === 'view-medicamentos') abrirModalMedicamento();
        else if (id === 'view-agenda' || id === 'view-historico' || id === 'view-dashboard') openEventModal();
      });

      // Botão "+ Novo Usuário" na seção usuarios
      document.querySelectorAll('#view-usuarios .btn-primary').forEach(btn => {
        btn.onclick = abrirModalUsuario;
      });
      // Botão "+ Novo Medicamento"
      document.querySelectorAll('#view-medicamentos .btn-primary').forEach(btn => {
        btn.onclick = abrirModalMedicamento;
      });
      // Botão "+ Nova Tarefa"
      document.querySelectorAll('#view-agenda .btn-primary').forEach(btn => {
        btn.onclick = openEventModal;
      });
      // Botão "+ Novo Registro" no histórico
      document.querySelectorAll('#view-historico .btn-primary').forEach(btn => {
        btn.onclick = openEventModal;
      });

      const historicoFiltro = document.getElementById('historico-filtro-paciente');
      if (historicoFiltro) historicoFiltro.addEventListener('change', () => renderHistorico(eventos));

      const agendaFiltro = document.getElementById('agenda-filtro-idoso');
      if (agendaFiltro) agendaFiltro.addEventListener('change', () => {
        renderAgendaLista(eventos);
        renderWeeklyCalendar();
      });

      // Logout
      function logout() {
        sessionStorage.removeItem('jamesUser');
        window.location.href = '/Loguin.html';
      }