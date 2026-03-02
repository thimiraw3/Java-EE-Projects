package com.invoicing.service;

import com.invoicing.dao.CustomerDAO;
import com.invoicing.dao.InvoiceDAO;
import com.invoicing.dto.CustomerDTO;
import com.invoicing.dto.InvoiceItemDTO;
import com.invoicing.dto.InvoiceRequestDTO;
import com.invoicing.dto.InvoiceResponseDTO;
import com.invoicing.model.Customer;
import com.invoicing.model.Invoice;
import com.invoicing.model.InvoiceItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class InvoiceService {

    private final InvoiceDAO invoiceDAO = new InvoiceDAO();
    private final CustomerDAO customerDAO = new CustomerDAO();

    public List<InvoiceResponseDTO> getAllInvoices() {
        return invoiceDAO.findAll().stream().map(this::toResponseDTO).toList();
    }

    public List<InvoiceResponseDTO> searchInvoices(String keyword) {
        if (keyword == null || keyword.isBlank()) return getAllInvoices();
        return invoiceDAO.search(keyword).stream().map(this::toResponseDTO).toList();
    }

    public Optional<InvoiceResponseDTO> getInvoiceById(int id) {
        return invoiceDAO.findById(id).map(this::toResponseDTO);
    }

    public String generateNextNumber() {
        return invoiceDAO.generateInvoiceNumber();
    }

    public InvoiceResponseDTO createInvoice(InvoiceRequestDTO req) {
        validate(req);
        Invoice invoice = buildEntity(req);
        invoice.setInvoiceNumber(invoiceDAO.generateInvoiceNumber());
        invoiceDAO.save(invoice);
        return toResponseDTO(invoice);
    }

    public InvoiceResponseDTO updateInvoice(int id, InvoiceRequestDTO req) {
        Invoice existing = invoiceDAO.findById(id)
                .orElseThrow(() -> new ServiceException("Invoice not found with id: " + id));
        validate(req);
        Invoice updated = buildEntity(req);
        updated.setId(id);
        updated.setInvoiceNumber(existing.getInvoiceNumber());
        invoiceDAO.save(updated);
        return toResponseDTO(updated);
    }

    public void deleteInvoice(int id) {
        if (invoiceDAO.findById(id).isEmpty()) {
            throw new ServiceException("Invoice not found with id: " + id);
        }
        invoiceDAO.delete(id);
    }

    private void validate(InvoiceRequestDTO req) {
        List<String> errors = new ArrayList<>();

        if (req.getCustomerId() == null) {
            errors.add("Customer is required.");
        } else if (customerDAO.findById(req.getCustomerId()).isEmpty()) {
            errors.add("Customer with id " + req.getCustomerId() + " does not exist.");
        }

        if (req.getIssueDate() == null)
            errors.add("Issue date is required.");

        if (req.getDueDate() == null) {
            errors.add("Due date is required.");
        } else if (req.getIssueDate() != null && req.getDueDate().isBefore(req.getIssueDate())) {
            errors.add("Due date cannot be before issue date.");
        }

        if (req.getItems() == null || req.getItems().isEmpty()) {
            errors.add("At least one line item is required.");
        } else {
            boolean anyWithDescription = req.getItems().stream()
                    .anyMatch(i -> i.getDescription() != null && !i.getDescription().isBlank());
            if (!anyWithDescription)
                errors.add("Each line item must have a description.");

            for (int i = 0; i < req.getItems().size(); i++) {
                InvoiceItemDTO item = req.getItems().get(i);
                if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0)
                    errors.add("Item " + (i + 1) + ": quantity must be greater than zero.");
                if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) < 0)
                    errors.add("Item " + (i + 1) + ": unit price cannot be negative.");
            }
        }

        if (!errors.isEmpty()) throw new ValidationException(errors);
    }

    private Invoice buildEntity(InvoiceRequestDTO req) {
        Invoice invoice = new Invoice();

        Customer customer = customerDAO.findById(req.getCustomerId())
                .orElseThrow(() -> new ServiceException("Customer not found"));
        invoice.setCustomer(customer);

        invoice.setIssueDate(req.getIssueDate());
        invoice.setDueDate(req.getDueDate());

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            try {
                invoice.setStatus(Invoice.Status.valueOf(req.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                invoice.setStatus(Invoice.Status.DRAFT);
            }
        }

        invoice.setNotes(req.getNotes());
        invoice.setTaxRate(req.getTaxRate() != null ? req.getTaxRate() : BigDecimal.ZERO);

        for (InvoiceItemDTO itemDTO : req.getItems()) {
            if (itemDTO.getDescription() == null || itemDTO.getDescription().isBlank()) continue;
            InvoiceItem item = new InvoiceItem(
                    itemDTO.getDescription().trim(),
                    itemDTO.getQuantity() != null ? itemDTO.getQuantity() : BigDecimal.ONE,
                    itemDTO.getUnitPrice() != null ? itemDTO.getUnitPrice() : BigDecimal.ZERO
            );
            invoice.addItem(item);
        }

        return invoice;
    }

    public InvoiceResponseDTO toResponseDTO(Invoice inv) {
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(inv.getId());
        dto.setInvoiceNumber(inv.getInvoiceNumber());
        dto.setIssueDate(inv.getIssueDate());
        dto.setDueDate(inv.getDueDate());
        dto.setStatus(inv.getStatus() != null ? inv.getStatus().name() : "DRAFT");
        dto.setNotes(inv.getNotes());
        dto.setSubtotal(inv.getSubtotal());
        dto.setTaxRate(inv.getTaxRate());
        dto.setTaxAmount(inv.getTaxAmount());
        dto.setTotalAmount(inv.getTotalAmount());
        dto.setCreatedAt(inv.getCreatedAt());
        dto.setUpdatedAt(inv.getUpdatedAt());

        if (inv.getCustomer() != null) {
            CustomerDTO c = new CustomerDTO();
            c.setId(inv.getCustomer().getId());
            c.setName(inv.getCustomer().getName());
            c.setEmail(inv.getCustomer().getEmail());
            c.setPhone(inv.getCustomer().getPhone());
            dto.setCustomer(c);
        }

        if (inv.getItems() != null) {
            dto.setItems(inv.getItems().stream().map(item -> {
                InvoiceItemDTO i = new InvoiceItemDTO();
                i.setId(item.getId());
                i.setDescription(item.getDescription());
                i.setQuantity(item.getQuantity());
                i.setUnitPrice(item.getUnitPrice());
                i.setLineTotal(item.getLineTotal());
                return i;
            }).toList());
        }

        return dto;
    }
}
