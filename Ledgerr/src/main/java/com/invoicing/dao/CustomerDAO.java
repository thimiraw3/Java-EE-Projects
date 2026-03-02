package com.invoicing.dao;

import com.invoicing.model.Customer;
import com.invoicing.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.util.List;
import java.util.Optional;

public class CustomerDAO {

    public Customer save(Customer customer) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.merge(customer);
            tx.commit();
            return customer;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("CustomerDAO.save failed: " + e.getMessage(), e);
        }
    }

    public Optional<Customer> findById(int id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.get(Customer.class, id));
        }
    }

    public List<Customer> findAll() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery(
                    "FROM Customer ORDER BY name", Customer.class).list();
        }
    }

    public List<Customer> search(String keyword) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Customer> q = session.createQuery(
                    "FROM Customer WHERE LOWER(name) LIKE :kw OR LOWER(email) LIKE :kw ORDER BY name",
                    Customer.class);
            q.setParameter("kw", "%" + keyword.toLowerCase() + "%");
            return q.list();
        }
    }

    public void delete(int id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Customer c = session.get(Customer.class, id);
            if (c != null) session.remove(c);
            tx.commit();
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("CustomerDAO.delete failed: " + e.getMessage(), e);
        }
    }

    public boolean emailExists(String email, Integer excludeId) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Long> q = session.createQuery(
                    "SELECT COUNT(c) FROM Customer c WHERE c.email = :email AND (:excludeId IS NULL OR c.id <> :excludeId)",
                    Long.class);
            q.setParameter("email", email);
            q.setParameter("excludeId", excludeId);
            return q.uniqueResult() > 0;
        }
    }
}
