package com.invoicing.service;

/**
 * ServiceException – thrown by service methods for business-rule violations
 * that are NOT validation errors (e.g. record not found).
 * Controllers map this to HTTP 404 / 409 as appropriate.
 */
public class ServiceException extends RuntimeException {
    public ServiceException(String message) {
        super(message);
    }
}
