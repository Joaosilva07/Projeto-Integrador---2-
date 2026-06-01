package com.james.app.Service

import com.james.app.Repository.EventHistoryRepository
import com.james.app.Repository.MedicineRepository
import com.james.app.Repository.UserRepository
import com.james.app.model.Event.EventHistory
import com.james.app.model.Medicine.Medicine
import com.james.app.model.User.User
import com.james.app.model.User.UserRole
import org.springframework.stereotype.Service

@Service
class MedicineService {
    private final EventHistoryRepository eventHistoryRepository
    private final MedicineRepository medicineRepository
    private final UserRepository userRepository
    private final NotificationService notificationService

    MedicineService(EventHistoryRepository eventHistoryRepository, MedicineRepository medicineRepository, UserRepository userRepository, NotificationService notificationService) {
        this.eventHistoryRepository = eventHistoryRepository
        this.medicineRepository = medicineRepository
        this.userRepository = userRepository
        this.notificationService = notificationService
    }

    Medicine saveMedicine(Medicine medicine) {
        medicine.Paciente = resolvePaciente(medicine.Paciente)
        medicine.Responsavel = resolveResponsavel(medicine.Responsavel)
        def saved = medicineRepository.save(medicine)
        registrarHistorico(saved, "CRIACAO", montarResumoMedicamento(saved))
        
        // Verificar estoque baixo e notificar responsáveis
        if ((saved.Unidades ?: 0) <= 5) {
            notificarEstoqueBaixo(saved)
        }
        
        return saved
    }

    Medicine update(Long id, Medicine newMedicine) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"))

        User novoPaciente = resolvePaciente(newMedicine.Paciente)
        User novoResponsavel = resolveResponsavel(newMedicine.Responsavel)
        String detalhesAlteracao = montarDetalhesAlteracao(
                medicine,
                newMedicine,
                novoPaciente,
                novoResponsavel
        )

        medicine.Nome = newMedicine.Nome
        medicine.Horario = newMedicine.Horario
        medicine.Unidades = newMedicine.Unidades
        medicine.observacao = newMedicine.observacao
        medicine.Paciente = novoPaciente
        medicine.Responsavel = novoResponsavel

        def updated = medicineRepository.save(medicine)
        registrarHistorico(updated, "ALTERACAO", detalhesAlteracao)
        
        // Verificar estoque baixo e notificar responsáveis
        if ((updated.Unidades ?: 0) <= 5) {
            notificarEstoqueBaixo(updated)
        }
        
        return updated
    }

    void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"))

        registrarHistorico(medicine, "EXCLUSAO", montarResumoMedicamento(medicine))
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

    private void registrarHistorico(Medicine medicine, String acao, String detalhes) {
        if (medicine == null || medicine.id == null) {
            return
        }

        EventHistory history = new EventHistory(
                eventId: medicine.id,
                acao: acao,
                titulo: medicine.Nome,
                hora: medicine.Horario,
                tipo: "medication",
                observacao: detalhes,
                pacienteId: medicine.Paciente?.id,
                pacienteNome: medicine.Paciente?.nome,
                responsavelId: medicine.Responsavel?.id,
                responsavelNome: medicine.Responsavel?.nome
        )
        eventHistoryRepository.save(history)
    }

    private String montarResumoMedicamento(Medicine medicine) {
        if (medicine == null) {
            return ""
        }

        List<String> detalhes = []
        detalhes << "Nome: ${valorOuTraco(medicine.Nome)}"
        detalhes << "Horario: ${valorOuTraco(medicine.Horario)}"
        detalhes << "Quantidade: ${quantidadeLabel(medicine.Unidades)}"
        detalhes << "Paciente: ${valorOuTraco(medicine.Paciente?.nome)}"
        if (medicine.Responsavel?.nome) {
            detalhes << "Responsavel: ${medicine.Responsavel.nome}"
        }
        if (medicine.observacao) {
            detalhes << "Observacao: ${medicine.observacao.trim()}"
        }
        return detalhes.join(" • ")
    }

    private String montarDetalhesAlteracao(Medicine atual, Medicine novo, User novoPaciente, User novoResponsavel) {
        List<String> mudancas = []
        adicionarMudanca(mudancas, "Nome", atual?.Nome, novo?.Nome)
        adicionarMudanca(mudancas, "Horario", atual?.Horario, novo?.Horario)
        adicionarMudanca(mudancas, "Quantidade", quantidadeLabel(atual?.Unidades), quantidadeLabel(novo?.Unidades))
        adicionarMudanca(mudancas, "Paciente", atual?.Paciente?.nome, novoPaciente?.nome)
        adicionarMudanca(mudancas, "Responsavel", atual?.Responsavel?.nome, novoResponsavel?.nome)
        adicionarMudanca(mudancas, "Observacao", atual?.observacao, novo?.observacao)
        return mudancas ? mudancas.join(" • ") : "Nenhum campo alterado."
    }

    private void adicionarMudanca(List<String> mudancas, String campo, Object anterior, Object novo) {
        String valorAnterior = valorOuTraco(anterior)
        String valorNovo = valorOuTraco(novo)
        if (valorAnterior != valorNovo) {
            mudancas << "${campo}: ${valorAnterior} -> ${valorNovo}"
        }
    }

    private String quantidadeLabel(Integer quantidade) {
        return quantidade == null ? "—" : "${quantidade} unid."
    }

    private String valorOuTraco(Object valor) {
        String texto = valor == null ? "" : String.valueOf(valor).trim()
        return texto ? texto : "—"
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
