package com.james.app.model.User

import jakarta.persistence.*
import groovy.transform.Canonical
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonIgnore

@Entity
@Table(name = "user_table")
@Canonical
class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    @Column(nullable = false)
    String nome

    @Column(unique = true, nullable = false)
    String email

    @Column(unique = true, nullable = true)
    String usuario

    @Column(unique = true, length = 4)
    String codigoUsuario

    @Column
    String senha

    @Enumerated(EnumType.STRING)
    UserRole role

    @ManyToMany
    @JoinTable(
            name = "user_relations",
            joinColumns = @JoinColumn(name = "idoso_id"),
            inverseJoinColumns = @JoinColumn(name = "responsavel_id")
    )
    @JsonIgnoreProperties("responsaveis")
    List<User> responsaveis = []

    @Transient
    @JsonIgnore
    byte[] avatar
}