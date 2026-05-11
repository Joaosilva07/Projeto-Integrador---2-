package com.james.app.Service

import com.james.app.model.Notification
import com.james.app.model.User.User
import com.james.app.Repository.NotificationRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class NotificationService {
  @Autowired
  NotificationRepository notificationRepository

  // Criar notificação
  void criar(User user, String mensagem, String tipo, Long relatedId = null) {
    def notif = new Notification(user, mensagem, tipo, relatedId)
    notificationRepository.save(notif)
  }

  // Listar notificações do usuário
  List<Notification> listarPorUsuario(User user) {
    return notificationRepository.findByUserOrderByCriadoEmDesc(user)
  }

  // Listar apenas não lidas
  List<Notification> listarNaoLidas(User user) {
    return notificationRepository.findByUserAndIsReadOrderByCriadoEmDesc(user, false)
  }

  // Contar não lidas
  long contarNaoLidas(User user) {
    return notificationRepository.countByUserAndIsReadFalse(user)
  }

  // Marcar como lida
  Notification marcarComoLida(Long notificacaoId, User user) {
    def notif = notificationRepository.findById(notificacaoId).orElse(null)
    if (notif && notif.user.id == user.id) {
      notif.isRead = true
      return notificationRepository.save(notif)
    }
    return null
  }

  // Marcar todas como lidas
  @Transactional
  void marcarTodasComoLidas(User user) {
    def naoLidas = listarNaoLidas(user)
    naoLidas.each { it.isRead = true }
    notificationRepository.saveAll(naoLidas)
  }

  // Deletar notificação
  @Transactional
  void deletar(Long notificacaoId, User user) {
    notificationRepository.deleteByUserAndId(user, notificacaoId)
  }

  // Limpar notificações antigas (mais de 30 dias)
  void limparAntigas() {
    def dataLimite = LocalDateTime.now().minusDays(30)
    def todasNotif = notificationRepository.findAll()
    todasNotif.findAll { it.criadoEm.isBefore(dataLimite) }.each {
      notificationRepository.delete(it)
    }
  }
}
