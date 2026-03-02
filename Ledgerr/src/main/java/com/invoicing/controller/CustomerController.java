package com.invoicing.controller;

import com.invoicing.dto.CustomerDTO;
import com.invoicing.service.CustomerService;
import com.invoicing.service.ServiceException;
import com.invoicing.service.ValidationException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/customers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerController {

    private final CustomerService service = new CustomerService();

    @GET
    public Response getAll() {
        List<CustomerDTO> customers = service.getAllCustomers();
        return Response.ok(customers).build();
    }

    @GET
    @Path("/search")
    public Response search(@QueryParam("q") String keyword) {
        List<CustomerDTO> results = service.searchCustomers(keyword);
        return Response.ok(results).build();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") int id) {
        Optional<CustomerDTO> customer = service.getCustomerById(id);
        return customer
                .map(dto -> Response.ok(dto).build())
                .orElse(notFound("Customer not found with id: " + id));
    }

    @POST
    public Response create(CustomerDTO request) {
        try {
            CustomerDTO created = service.createCustomer(request);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (ValidationException e) {
            return badRequest(e.getErrors());
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") int id, CustomerDTO request) {
        try {
            CustomerDTO updated = service.updateCustomer(id, request);
            return Response.ok(updated).build();
        } catch (ValidationException e) {
            return badRequest(e.getErrors());
        } catch (ServiceException e) {
            return notFound(e.getMessage());
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") int id) {
        try {
            service.deleteCustomer(id);
            return Response.ok(Map.of("success", true)).build();
        } catch (ServiceException e) {
            return notFound(e.getMessage());
        }
    }


    private Response notFound(String message) {
        return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", message))
                .build();
    }

    private Response badRequest(List<String> errors) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("errors", errors))
                .build();
    }
}
