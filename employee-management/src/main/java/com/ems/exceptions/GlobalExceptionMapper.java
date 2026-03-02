package com.ems.exceptions;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.HashMap;
import java.util.Map;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception exception) {
        Map<String, String> error = new HashMap<>();

        if (exception instanceof WebApplicationException) {
            WebApplicationException wae = (WebApplicationException) exception;
            int status = wae.getResponse().getStatus();
            error.put("error", exception.getMessage());
            return Response.status(status).entity(error).type(MediaType.APPLICATION_JSON).build();
        }

        error.put("error", exception.getMessage() != null ? exception.getMessage() : "An unexpected error occurred");
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(error).type(MediaType.APPLICATION_JSON).build();
    }
}
