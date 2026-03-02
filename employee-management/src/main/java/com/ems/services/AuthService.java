package com.ems.services;

import com.ems.auth.JwtUtil;
import com.ems.entities.User;
import com.ems.config.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;
import org.mindrot.jbcrypt.BCrypt;

import java.util.HashMap;
import java.util.Map;

public class AuthService {

    public Map<String, String> login(String username, String password) {

        if (username == null || password == null)
            throw new RuntimeException("Username and password required");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<User> query = session.createQuery("FROM User WHERE username = :username",User.class);

            query.setParameter("username", username);
            User user = query.uniqueResult();

            if (user == null)
                throw new RuntimeException("User not found");

            if (!BCrypt.checkpw(password, user.getPasswordHash()))
                throw new RuntimeException("Invalid password");

            String token = JwtUtil.generateToken(
                    user.getUsername(),
                    user.getRole().name()
            );

            Map<String, String> result = new HashMap<>();
            result.put("token", token);
            result.put("username", user.getUsername());
            result.put("role", user.getRole().name());

            return result;
        }
    }

    public User register(String username, String password, String email, String roleStr) {

        if (username == null || password == null)
            throw new RuntimeException("Username and password required");

        User.Role role = User.Role.USER;

        if ("ADMIN".equalsIgnoreCase(roleStr))
            role = User.Role.ADMIN;

        Transaction tx = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            tx = session.beginTransaction();
            Query<Long> checkQuery = session.createQuery("SELECT COUNT(u) FROM User u WHERE u.username = :username", Long.class);

            checkQuery.setParameter("username", username);

            if (checkQuery.uniqueResult() > 0) {
                throw new RuntimeException("Username already exists");
            }

            String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(12));

            User user = new User(username, hashedPassword, email, role);
            session.save(user);
            tx.commit();
            return user;

        } catch (Exception e) {

            if (tx != null)
                tx.rollback();

            throw new RuntimeException(e.getMessage());
        }

    }

}