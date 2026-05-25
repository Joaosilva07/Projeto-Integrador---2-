package com.james.app.Controller

import com.james.app.Service.EventService
import com.james.app.model.Event.Event
import jakarta.transaction.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/Eventos")
@Transactional
class EventController {

    private final EventService eventService

    EventController(EventService eventService) {
        this.eventService = eventService
    }

    @PostMapping("/criarEvent")
    Event create(@RequestBody Event event) {
        return eventService.creatEvent(event)
    }

    @GetMapping("/listaEventos")
    List<Event> getAll(
            @RequestParam(value = "pacienteId", required = false) Long pacienteId,
            @RequestParam(value = "responsavelId", required = false) Long responsavelId
    ) {
        return eventService.getAllEvent(pacienteId, responsavelId)
    }

    @GetMapping("/{id}")
    Event Evento(@PathVariable("id") Long id) {
        return eventService.findById(id)
    }

    @PutMapping("/{id}")
    Event updateEvent(@PathVariable("id") Long id, @RequestBody Event event) {
        return eventService.updateEvent(id, event)
    }

    @DeleteMapping("/{id}")
    void deleteEvent(@PathVariable("id") Long id) {
        eventService.deleteEvent(id)
    }
}
