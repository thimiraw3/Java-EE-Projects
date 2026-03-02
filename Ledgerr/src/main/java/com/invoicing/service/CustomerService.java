package com.invoicing.service;

import com.invoicing.dao.CustomerDAO;
import com.invoicing.dto.CustomerDTO;
import com.invoicing.model.Customer;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CustomerService {

    private final CustomerDAO dao = new CustomerDAO();

    public List<CustomerDTO> getAllCustomers() {
        return dao.findAll().stream().map(this::toDTO).toList();
    }

    public List<CustomerDTO> searchCustomers(String keyword) {
        if (keyword == null || keyword.isBlank()) return getAllCustomers();
        return dao.search(keyword).stream().map(this::toDTO).toList();
    }

    public Optional<CustomerDTO> getCustomerById(int id) {
        return dao.findById(id).map(this::toDTO);
    }

    public CustomerDTO createCustomer(CustomerDTO dto) {
        validate(dto, null);
        Customer entity = toEntity(dto);
        dao.save(entity);
        return toDTO(entity);
    }

    public CustomerDTO updateCustomer(int id, CustomerDTO dto) {
        Customer existing = dao.findById(id)
                .orElseThrow(() -> new ServiceException("Customer not found with id: " + id));
        validate(dto, id);
        existing.setName(dto.getName().trim());
        existing.setEmail(dto.getEmail().trim());
        existing.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
        existing.setAddress(dto.getAddress() != null ? dto.getAddress().trim() : null);
        dao.save(existing);
        return toDTO(existing);
    }

    public void deleteCustomer(int id) {
        if (dao.findById(id).isEmpty()) {
            throw new ServiceException("Customer not found with id: " + id);
        }
        dao.delete(id);
    }

    //validation
    private void validate(CustomerDTO dto, Integer excludeId) {
        List<String> errors = new ArrayList<>();

        if (isBlank(dto.getName()))
            errors.add("Name is required.");

        if (isBlank(dto.getEmail())) {
            errors.add("Email is required.");
        } else if (!dto.getEmail().matches("^[\\w.+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")) {
            errors.add("Email address is not valid.");
        } else if (dao.emailExists(dto.getEmail().trim(), excludeId)) {
            errors.add("A customer with this email already exists.");
        }

        if (!errors.isEmpty()) throw new ValidationException(errors);
    }

    //mapping
    public CustomerDTO toDTO(Customer c) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setAddress(c.getAddress());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    private Customer toEntity(CustomerDTO dto) {
        Customer c = new Customer();
        c.setName(dto.getName().trim());
        c.setEmail(dto.getEmail().trim());
        c.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
        c.setAddress(dto.getAddress() != null ? dto.getAddress().trim() : null);
        return c;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
