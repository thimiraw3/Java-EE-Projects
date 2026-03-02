package com.ems.controller;

import com.ems.entities.User;
import com.ems.services.AuthService;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    private final AuthService authService = new AuthService();

    @POST
    @Path("/login")
    public Response login(Map<String, String> credentials) {
        Map<String, String> result = authService.login(credentials.get("username"),credentials.get("password"));
        return Response.ok(result).build();
    }

    @POST
    @Path("/register")
    public Response register(Map<String, String> data) {
        User user = authService.register(
                data.get("username"),
                data.get("password"),
                data.get("email"),
                data.get("role")
        );
        return Response.status(Response.Status.CREATED).entity(user).build();
    }

}