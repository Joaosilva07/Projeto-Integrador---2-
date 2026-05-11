package com.james.app.Service

import com.james.app.Repository.UserRepository
import com.james.app.Repository.ConfirmationCodeRepository
import com.james.app.model.User.*
import com.james.app.model.ConfirmationCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserService {

    private final UserRepository userRepository
    private final ConfirmationCodeRepository confirmationCodeRepository
    private final EmailService emailService
    
    UserService(UserRepository userRepository, ConfirmationCodeRepository confirmationCodeRepository, EmailService emailService) { 
        this.userRepository = userRepository
        this.confirmationCodeRepository = confirmationCodeRepository
        this.emailService = emailService
    }

    User save(User user) {
        if (user.id == null) {
            // Evitar criação de ADMIN via registro público
            if (user.role == UserRole.ADMIN) {
                throw new IllegalArgumentException("Contas Admin não podem ser criadas via registro público.")
            }
            userRepository.findByEmail(user.email).ifPresent {
                throw new IllegalArgumentException("E-mail já cadastrado!")
            }
        }
        userRepository.save(user)
    }

    User login(String email, String senha) {
        User user = userRepository.findByEmail(email)
                .orElseThrow { new RuntimeException("E-mail não encontrado") }
        if (user.senha != senha) throw new RuntimeException("Senha incorreta")
        return user
    }

    User update(Long id, User data) {
        User user = userRepository.findById(id).orElseThrow { new RuntimeException("Usuário não encontrado") }
        user.nome = data.nome
        user.email = data.email
        user.role = data.role
        if (data.senha) user.senha = data.senha
        userRepository.save(user)
    }

    void delete(Long id) {
        User user = userRepository.findById(id).orElseThrow { new RuntimeException("Usuário não encontrado") }

        userRepository.findAll().forEach { u ->
            if (u.responsaveis.removeIf { it.id == id }) {
                userRepository.save(u)
            }
        }
        userRepository.delete(user)
    }

    void addResponsavel(Long idosoId, Long responsavelId) {
        User idoso = userRepository.findById(idosoId).orElseThrow { new RuntimeException("Idoso não encontrado") }
        User resp = userRepository.findById(responsavelId).orElseThrow { new RuntimeException("Responsável não encontrado") }

        if (idoso.role != UserRole.IDOSO) throw new IllegalArgumentException("Apenas IDOSOS podem receber responsáveis.")
        if (resp.role == UserRole.IDOSO) throw new IllegalArgumentException("Um IDOSO não pode ser responsável por outro.")

        if (!idoso.responsaveis.any { it.id == responsavelId }) {
            idoso.responsaveis.add(resp)
            userRepository.save(idoso)
        }
    }

    Map<String, Object> requestLinkConfirmation(Long userId, Long targetUserId) {
        User user = userRepository.findById(userId).orElseThrow { new RuntimeException("Usuário não encontrado") }
        User target = userRepository.findById(targetUserId).orElseThrow { new RuntimeException("Usuário alvo não encontrado") }
        
        // Limpar código anterior se houver
        confirmationCodeRepository.findByUserIdAndTargetUserIdAndUsedFalse(userId, targetUserId).ifPresent {
            confirmationCodeRepository.delete(it)
        }
        
        // Gerar novo código
        String code = (Math.random() * 10000).toInteger().toString().padLeft(4, '0')
        ConfirmationCode confirmCode = new ConfirmationCode(
            code: code,
            userId: userId,
            targetUserId: targetUserId,
            expiresAt: LocalDateTime.now().plusMinutes(15)
        )
        confirmationCodeRepository.save(confirmCode)
        
        // Enviar email para o usuário alvo
        emailService.sendConfirmationCode(target.email, target.nome, code)
        
        return [
            message: "Código de confirmação enviado para ${target.email}",
            targetNome: target.nome,
            targetEmail: target.email
        ]
    }

    void confirmLink(Long userId, Long targetUserId, String code) {
        ConfirmationCode confirmCode = confirmationCodeRepository.findByCodeAndUserIdAndUsedFalse(code, userId)
            .orElseThrow { new RuntimeException("Código inválido ou expirado") }
        
        if (confirmCode.targetUserId != targetUserId) {
            throw new IllegalArgumentException("Código não corresponde ao usuário alvo")
        }
        
        if (confirmCode.expiresAt.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Código expirou")
        }
        
        // Marcar como usado
        confirmCode.used = true
        confirmationCodeRepository.save(confirmCode)
        
        // Vincular usuários
        addResponsavel(targetUserId, userId)
    }
}