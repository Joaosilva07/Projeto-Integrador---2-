let notificacoes = [];
let usuarioLogadoNotif = null;

function setUsuarioLogado(user) {
  usuarioLogadoNotif = user;
  carregarNotificacoesDoBackend();
  // Recarregar a cada 30 segundos para manter sincronizado
  setInterval(() => carregarNotificacoesDoBackend(), 30000);
}

async function carregarNotificacoesDoBackend() {
  if (!usuarioLogadoNotif || !usuarioLogadoNotif.id) return;
  try {
    const res = await fetch(`/api/notifications?userId=${usuarioLogadoNotif.id}`);
    const data = await res.json();
    notificacoes = Array.isArray(data) ? data : [];
    renderNotificacoes();
  } catch (e) {
    console.error('Erro ao carregar notificações', e);
  }
}

function renderNotificacoes() {
  const list = document.getElementById("notif-list");
  const count = document.getElementById("notif-count");
  if (!list || !count) return;

  list.innerHTML = "";
  const naoLidas = notificacoes.filter(n => !n.isRead);
  const recentes = (naoLidas.length > 0 ? naoLidas : notificacoes).slice(0, 5);
  
  recentes.forEach((n) => {
    const dataFormatada = new Date(n.criadoEm).toLocaleTimeString();
    list.innerHTML += `
      <div class="notif-item" data-id="${n.id}" style="opacity:${n.isRead ? '0.6' : '1'}">
        <div>${n.mensagem}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <small>${dataFormatada}</small>
          <button class="notif-action" onclick="fecharNotificacao(${n.id})" style="background:none;border:none;color:#999;cursor:pointer;padding:0;font-size:12px">Fechar</button>
        </div>
      </div>
    `;
  });

  count.textContent = naoLidas.length;
}

async function fecharNotificacao(notifId) {
  if (!usuarioLogadoNotif) return;
  try {
    await fetch(`/api/notifications/${notifId}?userId=${usuarioLogadoNotif.id}`, { method: 'DELETE' });
    carregarNotificacoesDoBackend();
  } catch (e) {
    console.error('Erro ao deletar notificação', e);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notif-dropdown");
  if (dropdown) dropdown.classList.toggle("active");
}

function verificarAlertas() {
  // Alertas são disparados automaticamente pelo backend ao salvar
  // Apenas recarregamos as notificações aqui
  carregarNotificacoesDoBackend();
}

function atualizarDashboard() {
  const alertCount = document.getElementById("alert-count");
  if (alertCount) {
    const naoLidas = notificacoes.filter(n => !n.isRead);
    alertCount.textContent = naoLidas.length;
  }
}
