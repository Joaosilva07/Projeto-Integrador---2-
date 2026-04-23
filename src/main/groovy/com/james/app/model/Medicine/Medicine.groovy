package com.james.app.model.Medicine

import com.james.app.model.User.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "medicine_table")
class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column
    String Nome;

    @Column
    String Horario;

    @ManyToOne
    @JoinColumn(name = "paciente_id")
    User Paciente;

    @Column
    Integer Unidades;
}
