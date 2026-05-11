package com.james.app.Repository

import com.james.app.model.Notification
import com.james.app.model.User.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NotificationRepository extends JpaRepository<Notification, Long> {
  List<Notification> findByUserOrderByCriadoEmDesc(User user)
  List<Notification> findByUserAndIsReadOrderByCriadoEmDesc(User user, Boolean isRead)
  long countByUserAndIsReadFalse(User user)
  void deleteByUserAndId(User user, Long id)
}
