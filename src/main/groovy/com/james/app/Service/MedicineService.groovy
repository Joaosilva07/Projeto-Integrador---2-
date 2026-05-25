package com.james.app.Service

import com.james.app.Repository.MedicineRepository
import com.james.app.Repository.UserRepository
import com.james.app.model.Medicine.Medicine
import com.james.app.model.User.User
import com.james.app.model.User.UserRole
import org.springframework.stereotype.Service

@Service
class MedicineService {
    private final MedicineRepository medicineRepository
    private final UserRepository userRepository
    private final NotificationService notificationService

    MedicineService(MedicineRepository medicineRepository, UserRepository userRepository, NotificationService notificationService) {
        this.medicineRepository = medicineRepository
        this.userRepository = userRepository
        this.notificationService = notificationService
    }

    Medicine saveMedicine(Medicine medicine) {
        medicine.Paciente = resolvePaciente(medicine.Paciente)
        medicine.Responsavel = resolveResponsavel(medicine.Responsavel)
        def saved = medicineRepository.save(medicine)
        
        // Verificar estoque baixo e notificar responsáveis
        if ((saved.Unidades ?: 0) <= 5) {
            notificarEstoqueBaixo(saved)
        }
        
        return saved
    }

    Medicine update(Long id, Medicine newMedicine) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"))

        medicine.Nome = newMedicine.Nome
        medicine.Horario = newMedicine.Horario
        medicine.Unidades = newMedicine.Unidades
        medicine.Paciente = resolvePaciente(newMedicine.Paciente)
        medicine.Responsavel = resolveResponsavel(newMedicine.Responsavel)

        def updated = medicineRepository.save(medicine)
        
        // Verificar estoque baixo e notificar responsáveis
        if ((updated.Unidades ?: 0) <= 5) {
            notificarEstoqueBaixo(updated)
        }
        
        return updated
    }

    void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"))

        medicineRepository.delete(medicine)
    }

    Medicine getById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"))
    }

    List<Medicine> getAllMedicines(Long pacienteId, Long responsavelId) {
        if (pacienteId != null) {
            return medicineRepository.findByPacienteId(pacienteId)
        }

        if (responsavelId != null) {
            List<Long> pacienteIds = userRepository.findByResponsaveis_Id(responsavelId)
                    .findAll { it?.id != null }
                    .collect { it.id }

            if (pacienteIds.isEmpty()) {
                return []
            }

            return medicineRepository.findByPacienteIds(pacienteIds)
        }

        return medicineRepository.findAll()
    }

    private User resolvePaciente(User pacienteRef) {
        if (pacienteRef?.id == null) {
            throw new IllegalArgumentException("Medicamento deve estar vinculado a um paciente idoso.")
        }

        User paciente = userRepository.findById(pacienteRef.id)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"))

        if (paciente.role != UserRole.IDOSO) {
            throw new IllegalArgumentException("Paciente do medicamento deve ser do tipo IDOSO.")
        }

        return paciente
    }

    private User resolveResponsavel(User responsavelRef) {
        if (responsavelRef?.id == null) {
            return null
        }

        return userRepository.findById(responsavelRef.id)
                .orElseThrow(() -> new RuntimeException("Responsável não encontrado"))
    }
    
    private void notificarEstoqueBaixo(Medicine medicine) {
        // Notificar o paciente
        notificationService.criar(
            medicine.Paciente,
            "⚠️ ${medicine.Nome} com estoque baixo (${medicine.Unidades} unid.)",
            "estoque-baixo",
            medicine.id
        )
        
        // Notificar todos os responsáveis do paciente
        medicine.Paciente?.responsaveis?.each { responsavel ->
            notificationService.criar(
                responsavel,
                "⚠️ ${medicine.Nome} do paciente ${medicine.Paciente.nome} com estoque baixo",
                "estoque-baixo",
                medicine.id
            )
        }
    }
}
