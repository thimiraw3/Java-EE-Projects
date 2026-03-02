package com.ems.controller;

import com.ems.services.UserService;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserController {

    private final UserService userService = new UserService();

    @GET
    public Response getAllUsers() {
        return Response.ok(userService.getAllUsers()).build();
    }

    @PUT
    @Path("/{id}/password")
    public Response changePassword(@PathParam("id") Long id, Map<String,String> body){
        userService.changePassword(id,body.get("password"));
        return Response.ok(Map.of("message","Password updated successfully")).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteUser(@PathParam("id") Long id){
        userService.deleteUser(id);
        return Response.ok(Map.of("message", "User deleted successfully")).build();
    }

}