package com.james.app.Repository

import com.james.app.model.Event.Event
import org.springframework.data.jpa.repository.JpaRepository

interface EventRepository extends JpaRepository<Event, Long>{
}