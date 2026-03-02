package com.invoicing.controller;

import com.invoicing.dto.InvoiceRequestDTO;
import com.invoicing.dto.InvoiceResponseDTO;
import com.invoicing.service.InvoiceService;
import com.invoicing.service.ServiceException;
import com.invoicing.service.ValidationException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/invoices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InvoiceController {

    private final InvoiceService service = new InvoiceService();

    @GET
    public Response getAll() {
        List<InvoiceResponseDTO> invoices = service.getAllInvoices();
        return Response.ok(invoices).build();
    }

    @GET
    @Path("/search")
    public Response search(@QueryParam("q") String keyword) {
        List<InvoiceResponseDTO> results = service.searchInvoices(keyword);
        return Response.ok(results).build();
    }

    @GET
    @Path("/next-number")
    public Response nextNumber() {
        return Response.ok(Map.of("invoiceNumber", service.generateNextNumber())).build();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") int id) {
        Optional<InvoiceResponseDTO> invoice = service.getInvoiceById(id);
        return invoice
                .map(dto -> Response.ok(dto).build())
                .orElse(notFound("Invoice not found with id: " + id));
    }

    @POST
    public Response create(InvoiceRequestDTO request) {
        try {
            InvoiceResponseDTO created = service.createInvoice(request);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (ValidationException e) {
            return badRequest(e.getErrors());
        } catch (ServiceException e) {
            return notFound(e.getMessage());
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") int id, InvoiceRequestDTO request) {
        try {
            InvoiceResponseDTO updated = service.updateInvoice(id, request);
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
            service.deleteInvoice(id);
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
