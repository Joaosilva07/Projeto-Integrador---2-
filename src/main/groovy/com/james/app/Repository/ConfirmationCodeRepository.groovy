package com.james.app.Repository

import com.james.app.model.ConfirmationCode
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional

@Repository
interface ConfirmationCodeRepository extends JpaRepository<ConfirmationCode, Long> {
    Optional<ConfirmationCode> findByCodeAndUserIdAndUsedFalse(String code, Long userId)
    
    Optional<ConfirmationCode> findByUserIdAndTargetUserIdAndUsedFalse(Long userId, Long targetUserId)
}
