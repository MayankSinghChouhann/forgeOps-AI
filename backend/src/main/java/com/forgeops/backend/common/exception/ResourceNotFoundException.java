package com.forgeops.backend.common.exception;

/**
 * Thrown when a requested resource does not exist in the database.
 *
 * Design Note:
 *  This is a domain-specific exception that maps to HTTP 404.
 *  Using typed exceptions instead of RuntimeException gives us:
 *  1. Self-documenting code — the intent is clear from the type
 *  2. Precise exception handling in @ControllerAdvice
 *  3. The ability to add domain-specific fields (e.g., resourceId, resourceType)
 *
 * SOLID — Open/Closed: New exception types can be added without
 *  modifying the GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getFieldValue() {
        return fieldValue;
    }
}
