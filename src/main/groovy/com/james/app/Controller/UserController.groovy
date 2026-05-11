package com.james.app.Controller

import com.james.app.Service.UserService
import com.james.app.model.User.User
import com.james.app.model.User.UserLoginResponse
import com.james.app.model.User.UserSimple
import org.springframework.web.bind.annotation.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.MediaType
import org.springframework.web.multipart.MultipartFile
import java.util.Map

@RestController
@RequestMapping("/api/user")
class UserController {

    private final UserService userService
    UserController(UserService userService) { this.userService = userService }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    User create(@RequestBody User u) { userService.save(u) }

    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    User createAdmin(@RequestBody Map<String, String> body, @RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        // Validação simples: secret deve corresponder a uma variável de ambiente
        final String ADMIN_SECRET = System.getenv("JAMES_ADMIN_SECRET") ?: "dev-secret-change-me"
        if (secret == null || secret != ADMIN_SECRET) {
            throw new IllegalArgumentException("Código de administrador inválido.")
        }
        User u = new User()
        u.nome = body.get("nome")
        u.email = body.get("email")
        u.senha = body.get("senha")
        u.role = UserRole.ADMIN
        userService.save(u)
    }

    @GetMapping
    List<User> list() { userService.userRepository.findAll() }

    @GetMapping("/{id}")
    User getById(@PathVariable("id") Long id) {
        userService.userRepository.findById(id).orElseThrow {
            new RuntimeException("Usuário não encontrado")
        }
    }

    @PutMapping("/{id}")
    User update(@PathVariable("id") Long id, @RequestBody User u) {
        userService.update(id, u)
    }

    // Corrigindo o 400: Adicionado ("id")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable("id") Long id) {
        userService.delete(id)
    }

    @PatchMapping("/{idosoId}/link/{responsavelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void link(@PathVariable("idosoId") Long idosoId, @PathVariable("responsavelId") Long responsavelId) {
        userService.addResponsavel(idosoId, responsavelId)
    }

    @GetMapping("/{id}/idosos")
    ResponseEntity<?> getIdososDoResponsavel(@PathVariable("id") Long id) {
        def responsavel = userService.userRepository.findById(id).orElse(null)
        if (!responsavel) return ResponseEntity.status(HttpStatus.NOT_FOUND).body([erro: 'Usuário não encontrado'])
        def idosos = userService.userRepository.findByResponsaveis_Id(id)
        def result = idosos.collect { idoso ->
            def cuidadores = idoso.responsaveis.findAll { r -> r.role?.name() == 'CUIDADOR' }
            [
                id: idoso.id,
                nome: idoso.nome,
                email: idoso.email,
                role: idoso.role,
                cuidadores: cuidadores.collect { c -> [id: c.id, nome: c.nome, email: c.email] }
            ]
        }
        ResponseEntity.ok(result)
    }

    @PostMapping("/login")
    UserLoginResponse login(@RequestBody Map<String, String> body) {
        User user = userService.login(body.get("email"), body.get("senha"))
        new UserLoginResponse(
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            responsaveis: user.responsaveis?.collect { r ->
                new UserSimple(id: r.id, nome: r.nome, email: r.email, role: r.role)
            }
        )
    }

    @PostMapping("/{userId}/request-link/{targetUserId}")
    Map<String, Object> requestLink(@PathVariable("userId") Long userId, @PathVariable("targetUserId") Long targetUserId) {
        userService.requestLinkConfirmation(userId, targetUserId)
    }

    @PostMapping("/{userId}/confirm-link/{targetUserId}")
    Map<String, Object> confirmLink(@PathVariable("userId") Long userId, @PathVariable("targetUserId") Long targetUserId, @RequestBody Map<String, String> body) {
        String code = body.get("code")
        userService.confirmLink(userId, targetUserId, code)
        [message: "Vínculo confirmado com sucesso"]
    }

    @PostMapping("/{id}/avatar")
    ResponseEntity<?> uploadAvatar(@PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body([erro: "Arquivo vazio"])
            }
            byte[] avatarData = file.bytes
            User user = userService.userRepository.findById(id).orElse(null)
            if (!user) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body([erro: "Usuário não encontrado"])
            }
            user.avatar = avatarData
            userService.save(user)
            return ResponseEntity.ok([message: "Avatar salvo com sucesso", id: user.id])
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body([erro: e.message ?: "Erro ao salvar avatar"])
        }
    }

    @GetMapping("/{id}/avatar")
    ResponseEntity<?> getAvatar(@PathVariable("id") Long id) {
        try {
            User user = userService.userRepository.findById(id).orElse(null)
            if (!user || !user.avatar) {
                return ResponseEntity.noContent().build()
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(user.avatar)
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body([erro: e.message ?: "Erro ao recuperar avatar"])
        }
    }
}