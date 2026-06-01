package com.james.app.Repository

import com.james.app.model.Event.EventHistory
import org.springframework.data.jpa.repository.JpaRepository

interface EventHistoryRepository extends JpaRepository<EventHistory, Long> {
    List<EventHistory> findByPacienteIdOrderByRegistradoEmDesc(Long pacienteId)
    List<EventHistory> findByPacienteIdInOrderByRegistradoEmDesc(List<Long> pacienteIds)
    List<EventHistory> findAllByOrderByRegistradoEmDesc()
    void deleteByPacienteId(Long pacienteId)
}