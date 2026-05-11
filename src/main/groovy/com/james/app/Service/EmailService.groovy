package com.james.app.Service

import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

@Service
class EmailService {
    private final JavaMailSender mailSender
    
    EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender
    }
    
    void sendConfirmationCode(String to, String userName, String code) {
        SimpleMailMessage message = new SimpleMailMessage()
        message.setFrom("noreply@james.com")
        message.setTo(to)
        message.setSubject("Código de Confirmação JAMES")
        message.setText("""
Olá ${userName},

Você solicitou vincular sua conta ao sistema JAMES.

Seu código de confirmação é: ${code}

Este código expira em 15 minutos.

Se você não solicitou isso, ignore este email.

---
JAMES — Gestão de Cuidados
""".toString())
        
        try {
            mailSender.send(message)
        } catch (Exception e) {
            throw new RuntimeException("Erro ao enviar email: " + e.message)
        }
    }
}
