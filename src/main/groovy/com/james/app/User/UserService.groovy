package com.james.app.User


import com.james.app.model.User.User
import com.james.app.model.User.UserRole
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService {

    private final UserRepository userRepository

    UserService(UserRepository userRepository) {
        this.userRepository = userRepository
    }

    @Transactional
    User save(User usuario) {
        return userRepository.save(usuario)
    }

    @Transactional
    void linkElderlyToCaregiver(Long idosoId, Long cuidadorId) {
        def idoso = userRepository.findById(idosoId).orElseThrow {
            new RuntimeException("Idoso não encontrado!")
        }
        def cuidador = userRepository.findById(cuidadorId).orElseThrow {
            new RuntimeException("Cuidador não encontrado!")
        }

        if (cuidador.role != UserRole.CUIDADOR) {
            throw new IllegalArgumentException("O usuário destino não é um cuidador cadastrado.")
        }

        idoso.cuidador = cuidador
        userRepository.save(idoso)
    }

    List<User> findAll() {
        return userRepository.findAll()
    }
}