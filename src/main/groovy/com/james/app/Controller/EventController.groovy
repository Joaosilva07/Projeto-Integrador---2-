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
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/Eventos")
@Transactional
class EventController {

    private final EventService eventService;

    EventController(EventService eventService) {
        this.eventService = eventService
    }

    @PostMapping("/criarEvent")
    Event create(@RequestBody Event event){
        return eventService.creatEvent(event)
    }
    @GetMapping("/listaEventos")
    List<Event> getAll(){
        return eventService.getAllEvent()
    }
    @GetMapping("/{id}")
    Event Evento(@PathVariable Event event){
        return eventService.findById(event);
    }
    @PutMapping("/{id}")
    Event updateEvent(@PathVariable Event event){
        return eventService.updateEvent(event);
    }
    @DeleteMapping("/{id}")
    void deleteEvent(@PathVariable Event event){
        eventService.deleteEvent(event);
    }
}
