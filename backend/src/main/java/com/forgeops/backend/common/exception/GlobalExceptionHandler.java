package com.forgeops.backend.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/** Converts application errors to consistent Problem Detail responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String ERROR_TYPE_BASE = "https://forgeops.ai/errors/";

    // -------------------------------------------------------------------------
    // 400 BAD REQUEST — Validation failures (@Valid annotation violations)
    // -------------------------------------------------------------------------
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "One or more fields failed validation. See 'fieldErrors' for details."
        );
        problem.setTitle("Validation Failed");
        problem.setType(URI.create(ERROR_TYPE_BASE + "validation-failed"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("fieldErrors", fieldErrors);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[Validation] {} field errors for {}: {}", fieldErrors.size(), request.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 BAD REQUEST — Path/query parameter type mismatch (e.g., UUID parse error)
    // -------------------------------------------------------------------------
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        String detail = String.format("Parameter '%s' should be of type '%s'.",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        problem.setTitle("Invalid Parameter Type");
        problem.setType(URI.create(ERROR_TYPE_BASE + "invalid-parameter"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[TypeMismatch] {} → {}", request.getRequestURI(), detail);
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 BAD REQUEST — Business rule violations (duplicate email, invalid state)
    // -------------------------------------------------------------------------
    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ProblemDetail> handleBusinessRuleViolation(
            BusinessRuleViolationException ex,
            HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setType(URI.create(ERROR_TYPE_BASE + "business-rule-violation"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[BusinessRule] {} → {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 BAD REQUEST — Constraint violations (e.g. @Validated on service layer)
    // -------------------------------------------------------------------------
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        Map<String, String> violations = new HashMap<>();
        ex.getConstraintViolations().forEach(cv ->
            violations.put(cv.getPropertyPath().toString(), cv.getMessage())
        );

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Constraint validation failed."
        );
        problem.setTitle("Constraint Violation");
        problem.setType(URI.create(ERROR_TYPE_BASE + "constraint-violation"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("violations", violations);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[Constraint] {} violations at {}: {}", violations.size(), request.getRequestURI(), violations);
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // 404 NOT FOUND — Resource doesn't exist in the database
    // -------------------------------------------------------------------------
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create(ERROR_TYPE_BASE + "resource-not-found"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("resourceName", ex.getResourceName());
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[NotFound] {} → {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    // -------------------------------------------------------------------------
    // 401 UNAUTHORIZED — Not authenticated (wrong credentials)
    // -------------------------------------------------------------------------
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed. Verify your credentials and try again."
        );
        problem.setTitle("Authentication Failed");
        problem.setType(URI.create(ERROR_TYPE_BASE + "authentication-failed"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[Auth] Authentication failure at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    // -------------------------------------------------------------------------
    // 403 FORBIDDEN — Authenticated but lacks permission
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "You do not have permission to access this resource."
        );
        problem.setTitle("Access Denied");
        problem.setType(URI.create(ERROR_TYPE_BASE + "access-denied"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[Access] Forbidden at {} for user: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 BAD REQUEST — Generic IllegalArgumentException from service layer
    // -------------------------------------------------------------------------
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Invalid Request");
        problem.setType(URI.create(ERROR_TYPE_BASE + "invalid-request"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[IllegalArg] {} → {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // 500 INTERNAL SERVER ERROR — Final safety net (unexpected errors)
    // SECURITY: Stack trace is NEVER returned to the client.
    // -------------------------------------------------------------------------
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleAllUnhandledExceptions(
            Exception ex,
            HttpServletRequest request) {

        // Log full stack trace internally for debugging
        log.error("[Unhandled] Unexpected exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Our team has been notified. Please try again later."
        );
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create(ERROR_TYPE_BASE + "internal-server-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now().toString());
        // Intentionally NOT including ex.getMessage() — it may leak implementation details

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
