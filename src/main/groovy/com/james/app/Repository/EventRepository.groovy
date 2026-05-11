package com.james.app.Repository

import com.james.app.model.Event.Event
import org.springframework.data.jpa.repository.JpaRepository

interface EventRepository extends JpaRepository<Event, Long>{
    List<Event> findByPaciente_Id(Long pacienteId)
    List<Event> findByPaciente_IdIn(List<Long> pacienteIds)
}