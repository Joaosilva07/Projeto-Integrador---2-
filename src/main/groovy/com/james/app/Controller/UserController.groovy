package com.james.app.Controller

import com.james.app.Service.UserService
import com.james.app.model.User.User
import org.springframework.web.bind.annotation.*
import org.springframework.http.HttpStatus
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

    @PostMapping("/login")
    User login(@RequestBody Map<String, String> body) {
        userService.login(body.get("email"), body.get("senha"))
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
}