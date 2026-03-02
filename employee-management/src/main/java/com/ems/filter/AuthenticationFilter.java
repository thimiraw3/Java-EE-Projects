package com.ems.filter;

import com.ems.auth.JwtUtil;
import com.ems.auth.Secured;
import io.jsonwebtoken.Claims;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Secured
@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    @Context
    private ResourceInfo resourceInfo;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            abortUnauthorized(requestContext, "Authorization header missing or invalid");
            return;
        }

        String token = authHeader.substring("Bearer ".length()).trim();

        if (!JwtUtil.isTokenValid(token)) {
            abortUnauthorized(requestContext, "Invalid or expired token");
            return;
        }

        // Check role annotations
        Secured secured = resourceInfo.getResourceMethod().getAnnotation(Secured.class);

        if (secured == null) {
            secured = resourceInfo.getResourceClass().getAnnotation(Secured.class);
        }

        if (secured != null && secured.roles().length > 0) {
            String role = JwtUtil.extractRole(token);
            boolean authorized = false;
            for (String requiredRole : secured.roles()) {
                if (requiredRole.equalsIgnoreCase(role)) {
                    authorized = true;
                    break;
                }
            }
            if (!authorized) {
                requestContext.abortWith(
                    Response.status(Response.Status.FORBIDDEN)
                        .entity("{\"error\": \"Insufficient permissions\"}")
                        .type("application/json")
                        .build()
                );
            }
        }
    }

    private void abortUnauthorized(ContainerRequestContext ctx, String message) {
        ctx.abortWith(
            Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"error\": \"" + message + "\"}")
                .type("application/json")
                .build()
        );
    }
}
