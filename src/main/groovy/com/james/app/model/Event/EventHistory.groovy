package com.james.app.model.Event

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "tabela_evento_historico")
class EventHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    @Column(nullable = false)
    Long eventId

    @Column(nullable = false)
    String acao

    @Column
    String titulo

    @Column
    String data

    @Column
    String hora

    @Column
    String tipo

    @Column(length = 1000)
    String observacao

    @Column
    Long pacienteId

    @Column
    String pacienteNome

    @Column
    Long responsavelId

    @Column
    String responsavelNome

    @Column(nullable = false)
    LocalDateTime registradoEm = LocalDateTime.now()
}