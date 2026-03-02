package com.invoicing.dao;

import com.invoicing.model.Invoice;
import com.invoicing.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public class InvoiceDAO {

    public Invoice save(Invoice invoice) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
            invoice.recalculate();
            session.merge(invoice);
            tx.commit();
            return invoice;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("InvoiceDAO.save failed: " + e.getMessage(), e);
        }
    }

    public Optional<Invoice> findById(int id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.get(Invoice.class, id));
        }
    }

    public List<Invoice> findAll() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery(
                    "FROM Invoice i JOIN FETCH i.customer ORDER BY i.createdAt DESC",
                    Invoice.class).list();
        }
    }

    public List<Invoice> search(String keyword) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Invoice> q = session.createQuery(
                    "FROM Invoice i JOIN FETCH i.customer c " +
                    "WHERE LOWER(i.invoiceNumber)    LIKE :kw " +
                    "   OR LOWER(c.name)             LIKE :kw " +
                    "   OR LOWER(CAST(i.status AS string)) LIKE :kw " +
                    "ORDER BY i.createdAt DESC",
                    Invoice.class);
            q.setParameter("kw", "%" + keyword.toLowerCase() + "%");
            return q.list();
        }
    }

    public List<Invoice> findByCustomer(int customerId) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Invoice> q = session.createQuery(
                    "FROM Invoice i JOIN FETCH i.customer c WHERE c.id = :cid ORDER BY i.createdAt DESC",
                    Invoice.class);
            q.setParameter("cid", customerId);
            return q.list();
        }
    }

    public void delete(int id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Invoice inv = session.get(Invoice.class, id);
            if (inv != null) session.remove(inv);
            tx.commit();
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("InvoiceDAO.delete failed: " + e.getMessage(), e);
        }
    }

    public String generateInvoiceNumber() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Long count = session.createQuery("SELECT COUNT(i) FROM Invoice i", Long.class)
                                .uniqueResult();
            int year = LocalDate.now().getYear();
            return String.format("INV-%d-%04d", year, (count == null ? 0 : count) + 1);
        }
    }
}
