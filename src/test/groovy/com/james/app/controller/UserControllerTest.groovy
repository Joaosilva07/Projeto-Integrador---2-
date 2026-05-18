package com.james.app.controller

import com.james.app.model.User.User
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {
    @Autowired
    MockMvc mockMvc

    @Test
    void deveCadastrarUsuario() throws Exception {
        def json = '{"nome":"Teste","email":"teste@exemplo.com","senha":"123456","role":"PARENTE"}'
        mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath('$.id').exists())
    }

    @Test
    void deveFazerLogin() throws Exception {
        def json = '{"identificador":"teste@exemplo.com","senha":"123456"}'
        mockMvc.perform(post("/api/user/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath('$.id').exists())
    }

    @Test
    void deveExcluirUsuario() throws Exception {
        // Cria usuário
        def json = '{"nome":"Excluir","email":"excluir@exemplo.com","senha":"123456","role":"PARENTE"}'
        def result = mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andReturn()
        def id = new groovy.json.JsonSlurper().parseText(result.response.contentAsString).id
        // Exclui
        mockMvc.perform(delete("/api/user/$id"))
                .andExpect(status().isNoContent())
    }
}
