package com.james.app.Service

import com.james.app.Repository.EventRepository
import com.james.app.model.Event.Event
import org.springframework.stereotype.Service

@Service
class EventService {
    private final EventRepository eventRepository

    EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository
    }

    Event creatEvent(Event event){
         return eventRepository.save(event)
    }

    Event updateEvent(Long id,Event newEvent){
        Event event
        event = eventRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Evento não encontrado")
        )
        event.setTitulo(newEvent.getTitulo())
        event.setData(newEvent.getData())
        event.setHora(newEvent.getHora())
        event.setTipo(newEvent.getTipo())
        event.setPaciente(newEvent.getPaciente())
        return eventRepository.save(event)
    }
    void deleteEvent(Long id){
        Event event = EventRepository.findById(id).orElseThrow(
                ()-> new RuntimeException("Evento não encontrado")
        )
        eventRepository.delete(event)
    }
    List<Event> getAllEvent(){
        return eventRepository.findAll();
    }
    Event findById(Long id){
        return eventRepository.findById(id).orElseThrow(
                ()-> new RuntimeException("Evento não encontrado")
        );
    }

}
