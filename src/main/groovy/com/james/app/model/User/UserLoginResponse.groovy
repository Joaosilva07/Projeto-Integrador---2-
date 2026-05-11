package com.james.app.model.User

import groovy.transform.Canonical

@Canonical
class UserLoginResponse {
    Long id
    String nome
    String email
    UserRole role
    List<UserSimple> responsaveis = []
}

@Canonical
class UserSimple {
    Long id
    String nome
    String email
    UserRole role
}
