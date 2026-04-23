package com.james.app.Repository

import com.james.app.model.Medicine.Medicine
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MedicineRepository extends JpaRepository<Medicine,Long> {

}