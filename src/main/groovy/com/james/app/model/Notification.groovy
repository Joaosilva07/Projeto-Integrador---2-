package com.james.app.model

import com.james.app.model.User.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notification")
class Notification {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  User user

  @Column(nullable = false, length = 500)
  String mensagem

  @Column(name = "tipo")
  String tipo // 'estoque-baixo', 'tarefa-hoje', 'evento-criado', etc

  @Column(name = "is_read")
  Boolean isRead = false

  @Column(name = "created_at", nullable = false)
  LocalDateTime criadoEm = LocalDateTime.now()

  @Column(name = "related_id")
  Long relatedId // ID do medicamento, evento, etc (opcional)

  Notification() {}

  Notification(User user, String mensagem, String tipo, Long relatedId = null) {
    this.user = user
    this.mensagem = mensagem
    this.tipo = tipo
    this.relatedId = relatedId
    this.isRead = false
    this.criadoEm = LocalDateTime.now()
  }
}
