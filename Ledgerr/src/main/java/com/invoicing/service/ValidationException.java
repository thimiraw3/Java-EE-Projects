package com.invoicing.service;

import java.util.List;

/**
 * ValidationException – thrown when one or more validation rules fail.
 * Carries the full list of error messages.
 * Controllers map this to HTTP 400 with { "errors": [...] }.
 */
public class ValidationException extends RuntimeException {

    private final List<String> errors;

    public ValidationException(List<String> errors) {
        super("Validation failed: " + String.join("; ", errors));
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
