package com.ems.controller;

import com.ems.auth.Secured;
import com.ems.entities.Employee;
import com.ems.services.EmployeeService;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/employees")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmployeeController {

    private final EmployeeService employeeService = new EmployeeService();

    @GET
    @Secured
    public Response getEmployees(
            @QueryParam("name") String name,
            @QueryParam("position") String position,
            @QueryParam("department") String department,
            @QueryParam("hireDate") String hireDate,
            @QueryParam("status") String status,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("10") int size) {

        Map<String, Object> result =employeeService.getEmployees(name, position, department, hireDate, status, page, size);
        return Response.ok(result).build();
    }

    @GET
    @Path("/{id}")
    @Secured
    public Response getEmployee(@PathParam("id") Long id) {
        Employee employee = employeeService.getEmployeeById(id);
        return Response.ok(employee).build();
    }

    @POST
    @Secured(roles = {"ADMIN", "USER"})
    public Response createEmployee(Employee employee) {
        Employee created = employeeService.createEmployee(employee);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @Secured(roles = {"ADMIN", "USER"})
    public Response updateEmployee(
            @PathParam("id") Long id,
            Employee employee) {
        Employee updated = employeeService.updateEmployee(id, employee);
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    @Secured(roles = {"ADMIN"})
    public Response deleteEmployee(@PathParam("id") Long id) {
        employeeService.deleteEmployee(id);
        return Response.ok(Map.of("message", "Employee deleted successfully")).build();
    }

    @GET
    @Path("/stats/dashboard")
    @Secured
    public Response getDashboardStats() {
        return Response.ok(employeeService.getDashboardStats()).build();
    }

    @GET
    @Path("/meta/departments")
    @Secured
    public Response getDepartments() {
        List<String> result = employeeService.getAllDepartments();
        return Response.ok(result).build();
    }

    @GET
    @Path("/meta/positions")
    @Secured
    public Response getPositions() {
        List<String> result = employeeService.getAllPositions();
        return Response.ok(result).build();
    }

}