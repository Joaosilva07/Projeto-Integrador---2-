package com.james.app.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "confirmation_codes")
class ConfirmationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id
    
    @Column(unique = true, nullable = false)
    String code
    
    @Column(nullable = false)
    Long userId
    
    @Column(nullable = false)
    Long targetUserId
    
    @Column(nullable = false)
    LocalDateTime expiresAt
    
    Boolean used = false
    
    LocalDateTime createdAt = LocalDateTime.now()
}
