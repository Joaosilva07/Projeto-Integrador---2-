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
class ComentarioTest {
    @Autowired
    MockMvc mockMvc

    @Test
    void deveCriarEListarEventoComObservacao() throws Exception {
        // Cria idoso
        def idosoJson = '{"nome":"Idoso Evento","email":"idosoevento@exemplo.com","senha":"123456","role":"IDOSO"}'
        def idosoResult = mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(idosoJson))
                .andExpect(status().isCreated())
                .andReturn()
        def idosoId = new groovy.json.JsonSlurper().parseText(idosoResult.response.contentAsString).id

        // Cria evento
        def eventoJson = """
        {
          \"nome\": \"Banho\",
          \"dataHora\": \"2026-05-18T10:00:00\",
          \"paciente\": {\"id\": $idosoId},
          \"observacao\": \"Banho realizado sem intercorrências.\"
        }
        """
        mockMvc.perform(post("/Eventos/criarEvent")
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventoJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath('$.observacao').value("Banho realizado sem intercorrências."))
    }
}
