package com.james.app.exceptions

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import jakarta.servlet.http.HttpServletRequest
import java.time.Instant

@ControllerAdvice
class GlobalExceptionHandler {


    @ExceptionHandler(IllegalArgumentException)
    ResponseEntity<StandardError> illegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        def status = HttpStatus.BAD_REQUEST
        def err = new StandardError(
                timestamp: Instant.now(),
                status: status.value(),
                error: "Erro de Regra de Negócio",
                message: e.message,
                path: request.requestURI
        )
        return ResponseEntity.status(status).body(err)
    }


    @ExceptionHandler(RuntimeException)
    ResponseEntity<StandardError> entityNotFound(RuntimeException e, HttpServletRequest request) {
        def status = HttpStatus.NOT_FOUND
        def err = new StandardError(
                timestamp: Instant.now(),
                status: status.value(),
                error: "Recurso não encontrado",
                message: e.message,
                path: request.requestURI
        )
        return ResponseEntity.status(status).body(err)
    }
}