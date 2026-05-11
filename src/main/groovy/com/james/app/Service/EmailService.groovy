package com.james.app.Service

import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class EmailService {
    private final JavaMailSender mailSender
    private final String mailUsername
    
    EmailService(JavaMailSender mailSender, @Value('${spring.mail.username:}') String mailUsername) {
        this.mailSender = mailSender
        this.mailUsername = mailUsername
    }
    
    void sendConfirmationCode(String to, String userName, String code) {
        if (!mailUsername?.trim()) {
            throw new RuntimeException("Configuração de e-mail ausente: defina MAIL_USERNAME no ambiente.")
        }

        SimpleMailMessage message = new SimpleMailMessage()
        // Para Gmail/SMTP, o remetente deve ser o mesmo usuario autenticado.
        message.setFrom(mailUsername)
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

    void sendUrgentHelpAlert(String to, String idosoNome) {
        if (!mailUsername?.trim()) {
            throw new RuntimeException("Configuração de e-mail ausente: defina MAIL_USERNAME no ambiente.")
        }

        SimpleMailMessage message = new SimpleMailMessage()
        message.setFrom(mailUsername)
        message.setTo(to)
        message.setSubject("🚨 ALERTA: Ajuda Urgente - ${idosoNome}")
        message.setText("""
⚠️ ALERTA DE AJUDA URGENTE

${idosoNome} solicitou ajuda urgente no sistema JAMES!

Acesse o painel para mais informações e entre em contato assim que possível.

---
JAMES — Gestão de Cuidados
Recebido em: ${new java.util.Date()}
""".toString())
        
        try {
            mailSender.send(message)
        } catch (Exception e) {
            // Log silencioso - não falha a criação da notificação se o email falhar
            System.err.println("Erro ao enviar email de ajuda urgente: " + e.message)
        }
    }

    void sendMedicationTakenAlert(String to, String idosoNome, String medicamentoNome, String hora) {
        if (!mailUsername?.trim()) {
            throw new RuntimeException("Configuração de e-mail ausente: defina MAIL_USERNAME no ambiente.")
        }

        SimpleMailMessage message = new SimpleMailMessage()
        message.setFrom(mailUsername)
        message.setTo(to)
        message.setSubject("✓ Medicamento tomado - ${idosoNome}")
        message.setText("""
✓ MEDICAMENTO REGISTRADO

${idosoNome} registrou que tomou:
📋 ${medicamentoNome}
🕐 Horário: ${hora}

Você pode acompanhar todos os registros no painel do JAMES.

---
JAMES — Gestão de Cuidados
Recebido em: ${new java.util.Date()}
""".toString())
        
        try {
            mailSender.send(message)
        } catch (Exception e) {
            // Log silencioso - não falha a criação da notificação se o email falhar
            System.err.println("Erro ao enviar email de medicamento: " + e.message)
        }
    }
}
