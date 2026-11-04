package com.fpis.backend.controller;
import com.fpis.backend.service.*;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    public record ErrorResponse(OffsetDateTime timestamp, int status, String error, String message, Map<String,String> fieldErrors) {}
    @ExceptionHandler(NotFoundException.class) ResponseEntity<ErrorResponse> notFound(NotFoundException ex) { return error(HttpStatus.NOT_FOUND, ex.getMessage(), Map.of()); }
    @ExceptionHandler(ConflictException.class) ResponseEntity<ErrorResponse> conflict(ConflictException ex) { return error(HttpStatus.CONFLICT, ex.getMessage(), Map.of()); }
    @ExceptionHandler(IllegalArgumentException.class) ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException ex) { return error(HttpStatus.BAD_REQUEST, ex.getMessage(), Map.of()); }
    @ExceptionHandler(AuthenticationException.class) ResponseEntity<ErrorResponse> unauthorized(AuthenticationException ex) { return error(HttpStatus.UNAUTHORIZED, "Invalid email or password", Map.of()); }
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex) {
        Map<String,String> fields = new TreeMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return error(HttpStatus.BAD_REQUEST, "Request validation failed", fields);
    }
    @ExceptionHandler(Exception.class) ResponseEntity<ErrorResponse> unexpected(Exception ex) {
        log.error("Unexpected API error", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected server error occurred", Map.of());
    }
    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, Map<String,String> fields) {
        return ResponseEntity.status(status).body(new ErrorResponse(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message, fields));
    }
}
