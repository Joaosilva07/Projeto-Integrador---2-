package com.james.app.Repository

import com.james.app.model.Medicine.Medicine
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface MedicineRepository extends JpaRepository<Medicine,Long> {
    @Query("select m from Medicine m where m.Paciente.id = :pacienteId")
    List<Medicine> findByPacienteId(@Param("pacienteId") Long pacienteId)

    @Query("select m from Medicine m where m.Paciente.id in :pacienteIds")
    List<Medicine> findByPacienteIds(@Param("pacienteIds") List<Long> pacienteIds)
}