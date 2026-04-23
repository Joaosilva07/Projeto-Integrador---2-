package com.james.app.Controller

import com.james.app.Service.UserService
import com.james.app.model.User.User
import org.springframework.web.bind.annotation.*
import org.springframework.http.HttpStatus

@RestController
@RequestMapping("/api/user")
class UserController {

    private final UserService userService
    UserController(UserService userService) { this.userService = userService }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    User create(@RequestBody User u) { userService.save(u) }

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
}