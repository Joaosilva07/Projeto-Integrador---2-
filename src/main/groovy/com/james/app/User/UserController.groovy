package com.james.app.User

import com.james.app.model.User.User
import org.springframework.web.bind.annotation.*
import org.springframework.http.HttpStatus

@RestController
@RequestMapping("/api/user")
class UserController {

    private final UserService userService

    UserController(UserService userService) {
        this.userService = userService
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    User create(@RequestBody User usuario) {
        return userService.save(usuario)
    }

    @GetMapping
    List<User> listAll() {
        return userService.findAll()
    }

    @PatchMapping("/{idosoId}/link/{cuidadorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void link(
            @PathVariable("idosoId") Long idosoId,
            @PathVariable("cuidadorId") Long cuidadorId
    ) {
        userService.linkElderlyToCaregiver(idosoId, cuidadorId)
    }
}