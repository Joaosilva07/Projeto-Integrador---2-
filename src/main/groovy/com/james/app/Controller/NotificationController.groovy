package com.james.app.Controller

import com.james.app.model.Notification
import com.james.app.model.User.User
import com.james.app.Service.NotificationService
import com.james.app.Service.UserService
import com.james.app.Service.EmailService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
class NotificationController {
  @Autowired
  NotificationService notificationService

  @Autowired
  UserService userService

  @Autowired
  EmailService emailService

  // Listar todas as notificações do usuário
  @GetMapping
  ResponseEntity<?> listar(@RequestParam(value = "userId", required = true) Long userId) {
    def user = userService.userRepository.findById(userId).orElse(null)
    if (!user) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
    }
    def notifs = notificationService.listarPorUsuario(user)
    return ResponseEntity.ok(notifs)
  }

  // Listar apenas notificações não lidas
  @GetMapping("/nao-lidas")
  ResponseEntity<?> listarNaoLidas(@RequestParam(value = "userId", required = true) Long userId) {
    def user = userService.userRepository.findById(userId).orElse(null)
    if (!user) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
    }
    def notifs = notificationService.listarNaoLidas(user)
    return ResponseEntity.ok(notifs)
  }

  // Contar não lidas
  @GetMapping("/nao-lidas/count")
  ResponseEntity<?> contarNaoLidas(@RequestParam(value = "userId", required = true) Long userId) {
    def user = userService.userRepository.findById(userId).orElse(null)
    if (!user) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
    }
    def count = notificationService.contarNaoLidas(user)
    return ResponseEntity.ok([count: count])
  }

  // Marcar uma notificação como lida
  @PutMapping("/{id}/ler")
  ResponseEntity<?> marcarComoLida(@PathVariable("id") Long id, @RequestParam(value = "userId", required = true) Long userId) {
    def user = userService.userRepository.findById(userId).orElse(null)
    if (!user) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
    }
    def notif = notificationService.marcarComoLida(id, user)
    if (notif) {
      return ResponseEntity.ok(notif)
    }
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body([erro: 'Notificação não encontrada'])
  }

  // Marcar todas como lidas
  @PutMapping("/marcar-todas-lidas")
  ResponseEntity<?> marcarTodasLidas(@RequestParam(value = "userId", required = true) Long userId) {
    def user = userService.userRepository.findById(userId).orElse(null)
    if (!user) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
    }
    notificationService.marcarTodasComoLidas(user)
    return ResponseEntity.ok([mensagem: 'Todas marcadas como lidas'])
  }

  // Deletar notificação
  @DeleteMapping("/{id}")
  ResponseEntity<?> deletar(@PathVariable("id") Long id, @RequestParam(value = "userId", required = false) Long userId) {
    try {
      if (!userId) {
        return ResponseEntity.badRequest().body([erro: 'userId é obrigatório'])
      }
      def user = userService.userRepository.findById(userId).orElse(null)
      if (!user) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body([erro: 'Usuário não encontrado'])
      }
      notificationService.deletar(id, user)
      return ResponseEntity.ok([mensagem: 'Notificação deletada'])
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body([erro: e.message ?: 'Erro ao deletar notificação'])
    }
  }

  // Criar notificação de ajuda urgente
  @PostMapping("/ajuda-urgente")
  ResponseEntity<?> criarAjudaUrgente(@RequestParam(value = "idosoId", required = true) Long idosoId) {
    try {
      def idoso = userService.userRepository.findById(idosoId).orElse(null)
      if (!idoso) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body([erro: 'Idoso não encontrado'])
      }

      def responsaveis = idoso.responsaveis ?: []
      if (responsaveis.isEmpty()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body([erro: 'Nenhum responsável cadastrado'])
      }

      responsaveis.each { responsavel ->
        try {
          // Criar notificação para o responsável
          notificationService.criar(
            responsavel,
            "🚨 ${idoso.nome} solicitou ajuda urgente!",
            'ajuda-urgente',
            idoso.id
          )
          
          // Enviar email
          if (responsavel.email) {
            emailService.sendUrgentHelpAlert(responsavel.email, idoso.nome)
          }
        } catch (Exception e) {
          System.err.println("Erro ao notificar responsável ${responsavel.email}: ${e.message}")
        }
      }

      return ResponseEntity.ok([mensagem: "Ajuda solicitada para ${responsaveis.size()} responsável(is)"])
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body([erro: e.message ?: 'Erro ao criar notificação de ajuda'])
    }
  }

  // Criar notificação de medicamento tomado
  @PostMapping("/medicamento-tomado")
  ResponseEntity<?> notificarMedicamentoTomado(@RequestBody Map<String, Object> body) {
    try {
      def idosoId = body.idosoId as Long
      def medNome = body.medicamentoNome as String ?: 'Medicamento'
      def hora = body.hora as String ?: '--:--'

      def idoso = userService.userRepository.findById(idosoId).orElse(null)
      if (!idoso) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body([erro: 'Idoso não encontrado'])
      }

      def responsaveis = idoso.responsaveis ?: []
      if (responsaveis.isEmpty()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body([erro: 'Nenhum responsável cadastrado'])
      }

      responsaveis.each { responsavel ->
        try {
          // Criar notificação para o responsável
          notificationService.criar(
            responsavel,
            "✓ ${idoso.nome} tomou ${medNome} às ${hora}",
            'medicamento-tomado',
            (body.medicamentoId as Long) ?: null
          )
          
          // Enviar email
          if (responsavel.email) {
            emailService.sendMedicationTakenAlert(responsavel.email, idoso.nome, medNome, hora)
          }
        } catch (Exception e) {
          System.err.println("Erro ao notificar responsável sobre medicamento: ${e.message}")
        }
      }

      return ResponseEntity.ok([mensagem: "Medicamento registrado para ${responsaveis.size()} responsável(is)"])
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body([erro: e.message ?: 'Erro ao registrar medicamento'])
    }
  }
}
