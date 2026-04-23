package com.james.app.Service

import com.james.app.Repository.UserRepository
import com.james.app.model.User.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class UserService {

    private final UserRepository userRepository
    UserService(UserRepository userRepository) { this.userRepository = userRepository }

    User save(User user) {
        if (user.id == null) {
            userRepository.findByEmail(user.email).ifPresent {
                throw new IllegalArgumentException("E-mail já cadastrado!")
            }
        }
        userRepository.save(user)
    }

    User update(Long id, User data) {
        User user = userRepository.findById(id).orElseThrow { new RuntimeException("Usuário não encontrado") }
        user.nome = data.nome
        user.email = data.email
        user.role = data.role
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
}