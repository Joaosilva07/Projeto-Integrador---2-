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
  if (!list || !count) return;

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
  const dropdown = document.getElementById("notif-dropdown");
  if (dropdown) dropdown.classList.toggle("active");
}

function verificarAlertas() {
  const baixoEstoque = medicamentosGlobal.filter((m) => (m.Unidades || 0) <= 5);
  if (baixoEstoque.length > 0) adicionarNotificacao(`⚠️ ${baixoEstoque.length} medicamento(s) com estoque baixo`);

  const hoje = new Date().toISOString().split("T")[0];
  const hojeEvs = eventos.filter((e) => e.data === hoje);
  if (hojeEvs.length > 0) adicionarNotificacao(`📅 ${hojeEvs.length} tarefa(s) para hoje`);
}

function atualizarDashboard() {
  const alertCount = document.getElementById("alert-count");
  if (alertCount) alertCount.textContent = notificacoes.length;
}
