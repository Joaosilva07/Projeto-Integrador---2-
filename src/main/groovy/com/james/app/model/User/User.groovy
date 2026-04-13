package com.james.app.model.User

import jakarta.persistence.*
import groovy.transform.Canonical

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

    @Enumerated(EnumType.STRING)
    UserRole role

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuidador_id")
    User cuidador

    @OneToMany(mappedBy = "cuidador", cascade = CascadeType.ALL)
    List<User> idososVinculados = []
}

