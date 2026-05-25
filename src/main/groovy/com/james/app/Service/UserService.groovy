package com.james.app.Service

import com.james.app.Repository.UserRepository
import com.james.app.model.User.*
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.ThreadLocalRandom

@Service
@Transactional
class UserService {

    private final UserRepository userRepository
    
    UserService(UserRepository userRepository) {
        this.userRepository = userRepository
    }

    @PostConstruct
    void garantirCodigosUsuarios() {
        userRepository.findAll().each { user ->
            if (!user.usuario) {
                user.usuario = gerarUsuarioUnico(user)
            }
            if (!user.codigoUsuario) {
                user.codigoUsuario = gerarCodigoUsuarioUnico()
            }
            userRepository.save(user)
        }
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
            if (user.usuario) {
                userRepository.findByUsuarioIgnoreCase(user.usuario).ifPresent {
                    throw new IllegalArgumentException("Usuário já cadastrado!")
                }
            }
        }
        if (!user.usuario?.trim()) {
            user.usuario = gerarUsuarioUnico(user)
        }
        if (!user.codigoUsuario) {
            user.codigoUsuario = gerarCodigoUsuarioUnico()
        }
        return userRepository.save(user)
    }

    User login(String identificador, String senha) {
        String valor = identificador?.trim()
        if (!valor) throw new RuntimeException("Informe usuário ou e-mail")

        User user = valor.contains('@') ? userRepository.findByEmail(valor)
                .orElseThrow { new RuntimeException("E-mail não encontrado") } :
                userRepository.findByUsuarioIgnoreCase(valor)
                .orElseThrow { new RuntimeException("Usuário não encontrado") }
        if (user.senha != senha) throw new RuntimeException("Senha incorreta")
        return user
    }

    UserLoginResponse toLoginResponse(User user) {
        new UserLoginResponse(
            id: user.id,
            nome: user.nome,
            email: user.email,
            usuario: user.usuario,
            codigoUsuario: user.codigoUsuario,
            role: user.role,
            responsaveis: user.responsaveis?.collect { r ->
                new UserSimple(id: r.id, nome: r.nome, email: r.email, usuario: r.usuario, codigoUsuario: r.codigoUsuario, role: r.role)
            }
        )
    }

    User update(Long id, User data) {
        User user = userRepository.findById(id).orElseThrow { new RuntimeException("Usuário não encontrado") }
        user.nome = data.nome
        user.email = data.email
        user.role = data.role
        if (data.senha) user.senha = data.senha
        if (!user.codigoUsuario) user.codigoUsuario = gerarCodigoUsuarioUnico()
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

    User findByCodigoUsuario(String codigoUsuario) {
        userRepository.findByCodigoUsuario(codigoUsuario)
            .orElseThrow { new RuntimeException("Usuário não encontrado") }
    }

    private String gerarUsuarioUnico(User user) {
        String base = (user.nome ?: user.email ?: 'usuario')
                .toLowerCase()
                .replaceAll(/[^a-z0-9]+/, '.')
            .replaceAll(/^\.+|\.+$/, '')
        if (!base) base = 'usuario'

        String candidato = base
        int sufixo = 1
        while (userRepository.findByUsuarioIgnoreCase(candidato).present) {
            candidato = "${base}${sufixo}"
            sufixo++
        }
        return candidato
    }

    Map<String, Object> linkByCodigoUsuario(Long userId, String codigoUsuario) {
        User responsavel = userRepository.findById(userId).orElseThrow { new RuntimeException("Usuário não encontrado") }
        User idoso = findByCodigoUsuario(codigoUsuario)

        if (idoso.role != UserRole.IDOSO) {
            throw new IllegalArgumentException("O código informado não pertence a um idoso.")
        }

        addResponsavel(idoso.id, responsavel.id)

        return [
            message: "Vínculo realizado com sucesso",
            target: [
                id: idoso.id,
                nome: idoso.nome,
                email: idoso.email,
                codigoUsuario: idoso.codigoUsuario,
                role: idoso.role
            ]
        ]
    }

    private String gerarCodigoUsuarioUnico() {
        for (int tentativa = 0; tentativa < 1000; tentativa++) {
            String codigo = String.format('%04d', ThreadLocalRandom.current().nextInt(10000))
            if (!userRepository.findByCodigoUsuario(codigo).present) {
                return codigo
            }
        }
        throw new IllegalStateException('Não foi possível gerar um código de usuário único.')
    }
}