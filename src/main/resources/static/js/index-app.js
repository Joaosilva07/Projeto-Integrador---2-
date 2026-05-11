const titles = {
        dashboard: "Visão Geral",
        usuarios: "Usuários",
        medicamentos: "Medicamentos & Prescrições",
        historico: "Histórico de Cuidados",
        agenda: "Agenda de Tarefas",
        config: "Configurações",
      };

      const btnLabels = {
        dashboard: "+ Novo Registro",
        usuarios: "+ Novo Usuário",
        medicamentos: "+ Novo Medicamento",
        historico: "+ Novo Registro",
        agenda: "+ Novo Evento",
        config: "",
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

      function buildScopeQuery() {
        if (!usuarioLogado || !usuarioLogado.id) return '';
        if (usuarioLogado.role === 'ADMIN') return '';
        if (usuarioLogado.role === 'IDOSO') return `?pacienteId=${encodeURIComponent(usuarioLogado.id)}`;
        return `?responsavelId=${encodeURIComponent(usuarioLogado.id)}`;
      }

      function getIdososPermitidos(users) {
        const idosos = users.filter((u) => u.role === 'IDOSO');
        if (!usuarioLogado || usuarioLogado.role === 'ADMIN') return idosos;
        if (usuarioLogado.role === 'IDOSO') return idosos.filter((u) => String(u.id) === String(usuarioLogado.id));
        return idosos.filter((u) => (u.responsaveis || []).some((r) => String(r.id) === String(usuarioLogado.id)));
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
        if (name === 'config') {
          carregarConfiguracoesUsuario();
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
        const topBtn = document.getElementById("topbar-btn");
        if (topBtn) {
          topBtn.textContent = btnLabels[name] || '';
          topBtn.style.display = (name === 'agenda' || name === 'config') ? 'none' : 'inline-flex';
        }
      }

      async function carregarAvatarDoBackend() {
        if (!usuarioLogado?.id) return null;
        try {
          const res = await fetch(`/api/user/${usuarioLogado.id}/avatar`);
          if (!res.ok) return null;
          const blob = await res.blob();
          if (blob.size === 0) return null;
          const url = URL.createObjectURL(blob);
          return url;
        } catch (e) {
          console.error('Erro ao carregar avatar:', e);
          return null;
        }
      }

      function aplicarFotoPerfilUI(dataUrl) {
        const preview = document.getElementById('cfg-avatar-preview');
        const profileBtn = document.getElementById('topbar-profile-btn');
        const initials = (usuarioLogado?.nome || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        
        if (preview) {
          if (dataUrl) {
            preview.style.backgroundImage = `url('${dataUrl}')`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.textContent = '';
          } else {
            preview.style.backgroundImage = '';
            preview.textContent = initials;
          }
        }

        if (profileBtn) {
          if (dataUrl) {
            profileBtn.style.backgroundImage = `url('${dataUrl}')`;
            profileBtn.style.backgroundSize = 'cover';
            profileBtn.style.backgroundPosition = 'center';
            profileBtn.textContent = '';
          } else {
            profileBtn.style.backgroundImage = '';
            profileBtn.textContent = initials;
          }
        }

        document.querySelectorAll('.user-avatar').forEach((el) => {
          if (dataUrl) {
            el.style.backgroundImage = `url('${dataUrl}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
          } else {
            el.style.backgroundImage = '';
            el.textContent = initials;
          }
        });
      }

      async function atualizarFotoPerfil(event) {
        const file = event?.target?.files?.[0];
        if (!file || !usuarioLogado?.id) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const res = await fetch(`/api/user/${usuarioLogado.id}/avatar`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) {
            throw new Error('Erro ao fazer upload do avatar');
          }
          const avatarUrl = await carregarAvatarDoBackend();
          if (avatarUrl) {
            aplicarFotoPerfilUI(avatarUrl);
          }
        } catch (e) {
          console.error('Erro ao salvar avatar:', e);
          alert('Erro ao salvar a foto. Tente novamente.');
        }
      }

      function renderMeusIdososConfig() {
        const container = document.getElementById('cfg-idosos-list');
        if (!container) return;
        const idosos = getIdososPermitidos(usuariosGlobal || []);
        if (!idosos.length) {
          container.innerHTML = '<div style="padding:12px;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;">Nenhum idoso vinculado.</div>';
          return;
        }
        container.innerHTML = idosos.map((i) => `
          <div style="padding:12px;border:1px solid var(--border);border-radius:10px;display:flex;justify-content:space-between;gap:10px;align-items:center;">
            <div>
              <div style="font-weight:600;color:var(--text-primary);font-size:13px;">${i.nome || 'Sem nome'}</div>
              <div style="color:var(--text-muted);font-size:12px;">${i.email || 'Sem e-mail'}</div>
            </div>
            <span class="badge badge-idoso">IDOSO</span>
          </div>
        `).join('');
      }

      async function carregarConfiguracoesUsuario() {
        if (!usuarioLogado) return;
        const nomeEl = document.getElementById('cfg-nome');
        const emailEl = document.getElementById('cfg-email');
        const roleEl = document.getElementById('cfg-role');
        const senhaEl = document.getElementById('cfg-senha');
        const erroEl = document.getElementById('cfg-erro');
        const okEl = document.getElementById('cfg-ok');

        if (nomeEl) nomeEl.value = usuarioLogado.nome || '';
        if (emailEl) emailEl.value = usuarioLogado.email || '';
        if (roleEl) roleEl.value = usuarioLogado.role || '';
        if (senhaEl) senhaEl.value = '';
        if (erroEl) erroEl.style.display = 'none';
        if (okEl) okEl.style.display = 'none';

        const avatarUrl = await carregarAvatarDoBackend();
        aplicarFotoPerfilUI(avatarUrl || '');
        renderMeusIdososConfig();
      }

      async function salvarConfiguracoesUsuario() {
        if (!usuarioLogado?.id) return;
        const nome = document.getElementById('cfg-nome')?.value?.trim();
        const email = document.getElementById('cfg-email')?.value?.trim();
        const novaSenha = document.getElementById('cfg-senha')?.value?.trim();
        const erroEl = document.getElementById('cfg-erro');
        const okEl = document.getElementById('cfg-ok');

        if (erroEl) erroEl.style.display = 'none';
        if (okEl) okEl.style.display = 'none';

        if (!nome || !email) {
          if (erroEl) {
            erroEl.textContent = 'Nome e e-mail são obrigatórios.';
            erroEl.style.display = 'block';
          }
          return;
        }

        const payload = {
          nome,
          email,
          role: usuarioLogado.role,
          senha: novaSenha || usuarioLogado.senha || undefined,
        };

        try {
          const res = await fetch(`/api/user/${encodeURIComponent(usuarioLogado.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            throw new Error(await extrairMensagemErro(res, 'Erro ao salvar configurações.'));
          }
          const updated = await res.json();
          usuarioLogado = updated;
          sessionStorage.setItem('jamesUser', JSON.stringify(updated));
          document.querySelectorAll('.user-name').forEach((el) => { el.textContent = updated.nome || 'Usuário'; });
          document.querySelectorAll('.user-role').forEach((el) => { el.textContent = updated.role || ''; });
          const avatarUrl = await carregarAvatarDoBackend();
          aplicarFotoPerfilUI(avatarUrl || '');
          if (okEl) {
            okEl.textContent = 'Configurações salvas com sucesso.';
            okEl.style.display = 'block';
          }
        } catch (e) {
          if (erroEl) {
            erroEl.textContent = e.message || 'Erro ao salvar configurações.';
            erroEl.style.display = 'block';
          }
        }
      }

      async function extrairMensagemErro(res, fallbackMsg) {
        try {
          const data = await res.json();
          if (data?.message) return data.message;
          if (data?.erro) return data.erro;
          if (data?.error) return data.error;
        } catch (_) {
          try {
            const txt = await res.text();
            if (txt) return txt;
          } catch (_) {}
        }
        return fallbackMsg;
      }

      function atualizarBadgeHistorico(total) {
        const badge = document.getElementById('historico-nav-badge');
        if (!badge) return;
        const valor = Number.isFinite(total) ? total : 0;
        badge.textContent = String(valor);
        badge.style.display = valor > 0 ? 'inline-flex' : 'none';
      }

      // ===============================
      // SISTEMA DE NOTIFICAÇÕES
      // ===============================

      let notificacoes = [];
      let notifPollTimer = null;

      async function carregarNotificacoesDoBackend() {
        if (!usuarioLogado || !usuarioLogado.id) return;
        try {
          const res = await fetch(`/api/notifications?userId=${encodeURIComponent(usuarioLogado.id)}`);
          if (!res.ok) return;
          const data = await res.json();
          notificacoes = Array.isArray(data) ? data : [];
          renderNotificacoes();
          atualizarDashboard();
        } catch (e) {
          console.error('Erro ao carregar notificações', e);
        }
      }

      async function fecharNotificacao(id) {
        if (!usuarioLogado || !usuarioLogado.id) return;
        try {
          await fetch(`/api/notifications/${encodeURIComponent(id)}?userId=${encodeURIComponent(usuarioLogado.id)}`, {
            method: 'DELETE'
          });
          carregarNotificacoesDoBackend();
        } catch (e) {
          console.error('Erro ao remover notificação', e);
        }
      }

      function renderNotificacoes() {
        const list = document.getElementById("notif-list");
        const count = document.getElementById("notif-count");
        if (!list || !count) return;

        list.innerHTML = "";

        const naoLidas = notificacoes.filter((n) => !n.isRead);
        const exibidas = (naoLidas.length > 0 ? naoLidas : notificacoes).slice(0, 5);

        exibidas.forEach((n) => {
          const horario = n.criadoEm ? new Date(n.criadoEm).toLocaleTimeString() : '';
          list.innerHTML += `
      <div class="notif-item">
        <div>${n.mensagem || ''}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;gap:8px;">
          <small>${horario}</small>
          <button class="btn btn-ghost" style="padding:2px 6px;font-size:11px;" onclick="fecharNotificacao(${n.id})">Fechar</button>
        </div>
      </div>
    `;
        });

        count.textContent = naoLidas.length;
      }

      function toggleNotifications() {
        document.getElementById("notif-dropdown").classList.toggle("active");
      }

      // ===============================
      // ALERTAS AUTOMÁTICOS (DASHBOARD)
      // ===============================

      function verificarAlertas() {
        // As notificações são persistidas no backend ao criar/alterar dados.
        // Aqui só sincronizamos a interface para evitar duplicatas no refresh.
        carregarNotificacoesDoBackend();
      }

      function atualizarDashboard() {
        const alertEl = document.getElementById("alert-count");
        if (!alertEl) return;
        const naoLidas = notificacoes.filter((n) => !n.isRead);
        alertEl.textContent = naoLidas.length;
      }

      async function obterUsuarioAtualizado(sessaoUsuario) {
        if (!sessaoUsuario || !sessaoUsuario.id) return null;
        try {
          const res = await fetch(`/api/user/${encodeURIComponent(sessaoUsuario.id)}`);
          if (!res.ok) return null;
          const userDb = await res.json();
          if (!userDb || !userDb.id) return null;
          return userDb;
        } catch (e) {
          console.error('Erro ao validar sessão do usuário', e);
          return null;
        }
      }

      window.onload = async () => {
        // ── Auth ──────────────────────────────────────────────
        const userJson = sessionStorage.getItem('jamesUser');
        if (!userJson) { window.location.href = '/Loguin.html'; return; }
        let me = null;
        try {
          me = JSON.parse(userJson);
        } catch (_) {
          sessionStorage.removeItem('jamesUser');
          window.location.href = '/Loguin.html';
          return;
        }

        const userAtualizado = await obterUsuarioAtualizado(me);
        if (!userAtualizado) {
          sessionStorage.removeItem('jamesUser');
          window.location.href = '/Loguin.html';
          return;
        }
        me = userAtualizado;
        sessionStorage.setItem('jamesUser', JSON.stringify(me));

        if (me.role === 'IDOSO') { window.location.href = '/idoso.html'; return; }
        if (me.role === 'PARENTE') { window.location.href = '/parente.html'; return; }
        usuarioLogado = me;
        localStorage.removeItem('notificacoes'); // limpar legado antigo que causava números errados
        if (typeof setUsuarioLogado === 'function') {
          setUsuarioLogado(me);  // Inicializar notificações do backend, se disponível
        }
        document.querySelectorAll('.user-name').forEach((el) => { el.textContent = me.nome || 'Usuário'; });
        document.querySelectorAll('.user-role').forEach((el) => { el.textContent = me.role || ''; });
        const initials = (me.nome || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        document.querySelectorAll('.user-avatar').forEach((el) => { el.textContent = initials; });
        const avatarUrl = await carregarAvatarDoBackend();
        if (avatarUrl) aplicarFotoPerfilUI(avatarUrl);

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
        carregarNotificacoesDoBackend();
        if (!notifPollTimer) {
          notifPollTimer = setInterval(() => carregarNotificacoesDoBackend(), 30000);
        }

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
        carregarConfiguracoesUsuario();
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
        const idosos = getIdososPermitidos(users);
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
        // Contar apenas idosos que o usuário tem acesso
        const idosos = getIdososPermitidos(users).length;
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
          if (!res.ok) {
            throw new Error(await extrairMensagemErro(res, 'Erro ao salvar usuário.'));
          }
          fecharModalUsuario();
          document.getElementById('u-nome').value=''; document.getElementById('u-email').value='';
          document.getElementById('u-senha').value='';
          await carregarUsuarios();
        } catch(e) { erroEl.textContent = e.message; erroEl.style.display='block'; }
      }

      // ═══════════════════════════════════════════════════════
      // MEDICAMENTOS
      // ═══════════════════════════════════════════════════════
      async function carregarMedicamentos() {
        try {
          const res = await fetch('/Medicines' + buildScopeQuery());
          const meds = await res.json();
          medicamentosGlobal = meds;
          renderCardsMedicamentos(meds);
          renderEstoqueCritico(meds);
          const dashMeds = document.getElementById('dash-meds');
          const dashMedsSub = document.getElementById('dash-meds-sub');
          if (dashMeds) dashMeds.textContent = meds.length;
          const baixoCount = meds.filter(m => (m.Unidades || 0) <= 5).length;
          if (dashMedsSub) dashMedsSub.textContent = baixoCount > 0 ? `${baixoCount} com estoque baixo` : '';
          verificarAlertas();
        } catch(e) { console.error('Erro ao carregar medicamentos', e); }
      }

      function renderCardsMedicamentos(meds) {
        const grid = document.querySelector('#view-medicamentos .cards-grid');
        if (!grid) return;
        // Manter o card "+" no final
        const addCard = grid.querySelector('[style*="dashed"]');
        let html = '';
        meds.forEach(m => {
          const baixo = (m.Unidades || 0) <= 5;
          html += `<div class="card">
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
        if (addCard) {
          grid.innerHTML = html;
          grid.appendChild(addCard);
        } else {
          html += `<div class="card" style="border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:200px;cursor:pointer;background:var(--sand-50);" onclick="abrirModalMedicamento()"><div style="text-align:center;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px;font-weight:500">Adicionar medicamento</div></div></div>`;
          grid.innerHTML = html;
        }
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
        if (!pacienteId) { erroEl.textContent = 'Selecione o idoso para este medicamento.'; erroEl.style.display='block'; return; }
        const body = { Nome: nome, Horario: horario, Unidades: unidades, Paciente: { id: parseInt(pacienteId) } };
        try {
          const res = await fetch('/Medicines/create_medicine', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(body)
          });
          if (!res.ok) {
            throw new Error(await extrairMensagemErro(res, 'Erro ao salvar medicamento.'));
          }
          fecharModalMedicamento();
          document.getElementById('m-nome').value=''; document.getElementById('m-horario').value='';
          document.getElementById('m-unidades').value=''; document.getElementById('m-paciente').value='';
          await carregarMedicamentos();
          await carregarEventos();
        } catch(e) { erroEl.textContent = e.message; erroEl.style.display='block'; }
      }

      // ═══════════════════════════════════════════════════════
      // AGENDA / EVENTOS
      // ═══════════════════════════════════════════════════════
      async function carregarEventos() {
        try {
          const res = await fetch('/Eventos/listaEventos' + buildScopeQuery());
          const evs = await res.json();
          eventos = evs.map(e => ({ ...e, tipo: e.tipo || 'other' }));
          renderAgendaLista(evs);
          renderCuidadosRecentes(evs);
          renderProximasTarefas(evs);
          atualizarBadgeHistorico(evs.length);
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
        atualizarBadgeHistorico(filtrados.length);
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
          container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Nenhum evento para hoje. Clique em "+ Novo Evento" para adicionar.</div>';
          container.innerHTML += `<div class="agenda-card" style="border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:120px;cursor:pointer;background:var(--sand-50);" onclick="openEventModal()"><div style="text-align:center;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px;font-weight:500">+ Novo Evento</div></div></div>`;
          return;
        }
        let html = '';
        hojeEvs.forEach(e => {
          html += `<div class="agenda-card">
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
        html += `<div class="agenda-card" style="border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:120px;cursor:pointer;background:var(--sand-50);" onclick="openEventModal()"><div style="text-align:center;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px;font-weight:500">+ Novo Evento</div></div></div>`;
        container.innerHTML = html;
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
        if (!pacienteId) { alert('Selecione o idoso para criar o evento.'); return; }
        try {
          const body = { titulo, data, hora, tipo };
          if (pacienteId) body.paciente = { id: parseInt(pacienteId) };
          const res = await fetch('/Eventos/criarEvent', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(body)
          });
          if (!res.ok) {
            throw new Error(await extrairMensagemErro(res, 'Erro ao salvar evento.'));
          }
          closeEventModal();
          document.getElementById('event-title').value='';
          document.getElementById('event-date').value='';
          document.getElementById('event-time').value='';
          document.getElementById('event-type').value='medication';
          document.getElementById('event-paciente').value='';
          await carregarEventos();
        } catch(e) { alert(e.message || 'Erro ao salvar evento.'); }
      };

      // Carregar lista de pacientes no select do modal de medicamentos
      function preencherSelectPacientes() {
        const sel = document.getElementById('m-paciente');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione o idoso</option>';
        getIdososPermitidos(usuariosGlobal).forEach(u => {
          sel.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
        });
      }

      function preencherSelectPacientesEvento() {
        const sel = document.getElementById('event-paciente');
        if (!sel) return;
        const atual = sel.value;
        const idososPermitidos = getIdososPermitidos(usuariosGlobal);
        sel.innerHTML = '<option value="">Selecione o idoso</option>';
        idososPermitidos.forEach(u => {
          sel.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
        });
        sel.value = idososPermitidos.some(u => String(u.id) === String(atual)) ? atual : '';
      }

      // Sobrescrever abrirModalMedicamento para preencher select
      const _abrirModalMed = abrirModalMedicamento;
      abrirModalMedicamento = function() {
        preencherSelectPacientes();
        document.getElementById('modal-med').classList.add('active');
      };

      // Botão "topbar-btn" removido - agora usando avatar/perfil no topo

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
      function logout(e) {
        if (e) e.preventDefault();
        sessionStorage.removeItem('jamesUser');
        window.location.href = '/Loguin.html';
      }

      function toggleProfileMenu() {
        const menu = document.getElementById('topbar-profile-menu');
        if (menu) {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
      }

      document.addEventListener('click', (e) => {
        const menu = document.getElementById('topbar-profile-menu');
        const btn = document.getElementById('topbar-profile-btn');
        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
          menu.style.display = 'none';
        }
      });