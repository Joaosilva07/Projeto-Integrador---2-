package com.james.app.model.Medicine

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Table

@Entity
@Table(name = "medicine_table")
class Medicine {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column
    String Nome;

    @Column
    String dataValidade;
}
