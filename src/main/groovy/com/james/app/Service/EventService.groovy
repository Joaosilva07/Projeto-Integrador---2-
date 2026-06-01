package com.james.app.Service

import com.james.app.Repository.EventRepository
import com.james.app.Repository.EventHistoryRepository
import com.james.app.Repository.UserRepository
import com.james.app.model.Event.Event
import com.james.app.model.Event.EventHistory
import com.james.app.model.User.User
import com.james.app.model.User.UserRole
import org.springframework.stereotype.Service

@Service
class EventService {
    private final EventRepository eventRepository
    private final EventHistoryRepository eventHistoryRepository
    private final UserRepository userRepository
    private final NotificationService notificationService

    EventService(EventRepository eventRepository, EventHistoryRepository eventHistoryRepository, UserRepository userRepository, NotificationService notificationService) {
        this.eventRepository = eventRepository
        this.eventHistoryRepository = eventHistoryRepository
        this.userRepository = userRepository
        this.notificationService = notificationService
    }

    Event creatEvent(Event event) {
        event.setPaciente(resolvePaciente(event.getPaciente()))
        event.setResponsavel(resolveResponsavel(event.getResponsavel()))
        def saved = eventRepository.save(event)
        registrarHistorico(saved, "CRIACAO", montarResumoEvento(saved))
        
        // Notificar paciente e responsáveis sobre novo evento
        notificarNovoEvento(saved)
        
        return saved
    }

    Event updateEvent(Long id, Event newEvent) {
        Event event = eventRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Evento não encontrado")
        )

        User novoPaciente = resolvePaciente(newEvent.getPaciente())
        User novoResponsavel = resolveResponsavel(newEvent.getResponsavel())
        String detalhesAlteracao = montarDetalhesAlteracao(
                event,
                newEvent,
                novoPaciente,
                novoResponsavel
        )

        event.setTitulo(newEvent.getTitulo())
        event.setData(newEvent.getData())
        event.setHora(newEvent.getHora())
        event.setTipo(newEvent.getTipo())
        event.setPaciente(novoPaciente)
        event.setResponsavel(novoResponsavel)
        event.setObservacao(newEvent.getObservacao())

        def updated = eventRepository.save(event)
        registrarHistorico(updated, "ALTERACAO", detalhesAlteracao)
        return updated
    }

    void deleteEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Evento não encontrado")
        )
        registrarHistorico(event, "EXCLUSAO", montarResumoEvento(event))
        eventRepository.delete(event)
    }

    List<Event> getAllEvent(Long pacienteId, Long responsavelId) {
        if (pacienteId != null) {
            return eventRepository.findByPaciente_Id(pacienteId)
        }

        if (responsavelId != null) {
            List<Long> pacienteIds = userRepository.findByResponsaveis_Id(responsavelId)
                    .findAll { it?.id != null }
                    .collect { it.id }

            if (pacienteIds.isEmpty()) {
                return []
            }

            return eventRepository.findByPaciente_IdIn(pacienteIds)
        }

        return eventRepository.findAll()
    }

    Event findById(Long id) {
        return eventRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Evento não encontrado")
        )
    }

    List<EventHistory> getHistorico(Long pacienteId, Long responsavelId) {
        if (pacienteId != null) {
            return eventHistoryRepository.findByPacienteIdOrderByRegistradoEmDesc(pacienteId)
        }

        if (responsavelId != null) {
            List<Long> pacienteIds = userRepository.findByResponsaveis_Id(responsavelId)
                    .findAll { it?.id != null }
                    .collect { it.id }

            if (pacienteIds.isEmpty()) {
                return []
            }

            return eventHistoryRepository.findByPacienteIdInOrderByRegistradoEmDesc(pacienteIds)
        }

        return eventHistoryRepository.findAllByOrderByRegistradoEmDesc()
    }

    private User resolvePaciente(User pacienteRef) {
        if (pacienteRef?.id == null) {
            throw new IllegalArgumentException("Evento deve estar vinculado a um paciente idoso.")
        }

        User paciente = userRepository.findById(pacienteRef.id)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"))

        if (paciente.role != UserRole.IDOSO) {
            throw new IllegalArgumentException("Paciente do evento deve ser do tipo IDOSO.")
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

    private void registrarHistorico(Event event, String acao, String detalhes) {
        if (event == null || event.id == null) {
            return
        }

        EventHistory history = new EventHistory(
                eventId: event.id,
                acao: acao,
                titulo: event.titulo,
                data: event.data,
                hora: event.hora,
                tipo: event.tipo,
                observacao: detalhes,
                pacienteId: event.paciente?.id,
                pacienteNome: event.paciente?.nome,
                responsavelId: event.responsavel?.id,
                responsavelNome: event.responsavel?.nome
        )
        eventHistoryRepository.save(history)
    }

    private String montarResumoEvento(Event event) {
        if (event == null) {
            return ""
        }

        List<String> detalhes = []
        detalhes << "Titulo: ${valorOuTraco(event.titulo)}"
        detalhes << "Data: ${valorOuTraco(event.data)}"
        detalhes << "Hora: ${valorOuTraco(event.hora)}"
        detalhes << "Tipo: ${tipoEventoLabel(event.tipo)}"
        detalhes << "Paciente: ${valorOuTraco(event.paciente?.nome)}"
        if (event.responsavel?.nome) {
            detalhes << "Responsavel: ${event.responsavel.nome}"
        }
        if (event.observacao) {
            detalhes << "Observacao: ${event.observacao.trim()}"
        }
        return detalhes.join(" • ")
    }

    private String montarDetalhesAlteracao(Event atual, Event novo, User novoPaciente, User novoResponsavel) {
        List<String> mudancas = []
        adicionarMudanca(mudancas, "Titulo", atual?.titulo, novo?.titulo)
        adicionarMudanca(mudancas, "Data", atual?.data, novo?.data)
        adicionarMudanca(mudancas, "Hora", atual?.hora, novo?.hora)
        adicionarMudanca(mudancas, "Tipo", tipoEventoLabel(atual?.tipo), tipoEventoLabel(novo?.tipo))
        adicionarMudanca(mudancas, "Paciente", atual?.paciente?.nome, novoPaciente?.nome)
        adicionarMudanca(mudancas, "Responsavel", atual?.responsavel?.nome, novoResponsavel?.nome)
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

    private String valorOuTraco(Object valor) {
        String texto = valor == null ? "" : String.valueOf(valor).trim()
        return texto ? texto : "—"
    }

    private String tipoEventoLabel(String tipo) {
        switch ((tipo ?: "").toLowerCase()) {
            case "medication":
                return "Medicamento"
            case "health":
                return "Saude"
            case "activity":
                return "Atividade Fisica"
            case "meal":
                return "Alimentacao"
            case "hygiene":
                return "Higiene"
            case "other":
                return "Outro"
            default:
                return valorOuTraco(tipo)
        }
    }
    
    private void notificarNovoEvento(Event event) {
        def dataFormatada = event.getData() ?: '—'
        def horaFormatada = event.getHora() ?: '—'
        
        // Notificar o paciente
        notificationService.criar(
            event.getPaciente(),
            "📅 Nova tarefa: ${event.getTitulo()} em ${dataFormatada} às ${horaFormatada}",
            "tarefa-criada",
            event.getId()
        )
        
        // Notificar todos os responsáveis do paciente
        event.getPaciente()?.getResponsaveis()?.each { responsavel ->
            notificationService.criar(
                responsavel,
                "📅 Nova tarefa para ${event.getPaciente().nome}: ${event.getTitulo()}",
                "tarefa-criada",
                event.getId()
            )
        }
    }
}
