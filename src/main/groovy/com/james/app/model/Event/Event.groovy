package com.james.app.model.Event

import com.james.app.model.User.User;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "tabela_evento")
class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column
    String titulo;

    @Column
    String data;

    @Column
    String hora;

    @Column
    String tipo;

    @ManyToOne
    @JoinColumn(name = "paciente_id")
    User paciente;

    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    @JsonIgnoreProperties(["responsaveis"])
    User responsavel;

    @Column(length = 1000)
    String observacao;
}
