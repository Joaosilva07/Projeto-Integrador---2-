package com.james.app.controller

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
class VinculacaoTest {
    @Autowired
    MockMvc mockMvc

    @Test
    void deveVincularParenteIdoso() throws Exception {
        // Cria idoso
        def idosoJson = '{"nome":"Idoso Vinculo","email":"idosovinculo@exemplo.com","senha":"123456","role":"IDOSO"}'
        def idosoResult = mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(idosoJson))
                .andExpect(status().isCreated())
                .andReturn()
        def idosoId = new groovy.json.JsonSlurper().parseText(idosoResult.response.contentAsString).id

        // Cria parente
        def parenteJson = '{"nome":"Parente Vinculo","email":"parentevinculo@exemplo.com","senha":"123456","role":"PARENTE"}'
        def parenteResult = mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(parenteJson))
                .andExpect(status().isCreated())
                .andReturn()
        def parenteId = new groovy.json.JsonSlurper().parseText(parenteResult.response.contentAsString).id

        // Vincula
        mockMvc.perform(patch("/api/user/${idosoId}/link/${parenteId}"))
                .andExpect(status().isNoContent())
    }
}
