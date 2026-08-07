package com.forgeops.backend.common.exception;

/**
 * Thrown when a business rule is violated (e.g., duplicate email on register,
 * expired refresh token, invalid log target type).
 *
 * Maps to HTTP 409 Conflict or HTTP 400 Bad Request depending on context.
 *
 * Design Note:
 *  Separating BusinessRuleViolationException from ResourceNotFoundException
 *  gives the GlobalExceptionHandler precise control to return the correct
 *  HTTP status code per exception type — a clean API contract for consumers.
 */
public class BusinessRuleViolationException extends RuntimeException {

    public BusinessRuleViolationException(String message) {
        super(message);
    }

    public BusinessRuleViolationException(String message, Throwable cause) {
        super(message, cause);
    }
}
