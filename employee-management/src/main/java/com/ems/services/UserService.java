package com.ems.services;

import com.ems.entities.User;
import com.ems.config.HibernateUtil;

import org.hibernate.Session;
import org.hibernate.Transaction;

import org.mindrot.jbcrypt.BCrypt;

import java.util.*;

public class UserService {

    public List<Map<String,Object>> getAllUsers(){

        try(Session session = HibernateUtil.getSessionFactory().openSession()){

            List<User> users = session.createQuery("FROM User ORDER BY createdAt DESC", User.class).list();
            List<Map<String,Object>> safe = new ArrayList<>();

            for(User u : users){
                Map<String,Object> m = new HashMap<>();

                m.put("id",u.getId());
                m.put("username",u.getUsername());
                m.put("email",u.getEmail());
                m.put("role",u.getRole());
                m.put("createdAt",u.getCreatedAt());
                safe.add(m);
            }
            return safe;
        }
    }

    public void changePassword(Long id, String password){

        if(password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        Transaction tx = null;

        try(Session session =HibernateUtil.getSessionFactory().openSession()){

            tx =session.beginTransaction();
            User user =session.get(User.class,id);

            if(user == null)throw new RuntimeException("User not found");

            user.setPasswordHash(BCrypt.hashpw(password,BCrypt.gensalt(12)));

            session.update(user);
            tx.commit();
        }


        catch(Exception e){

            if(tx != null)
                tx.rollback();


            throw new RuntimeException(
                    e.getMessage());
        }
    }

    public void deleteUser(Long id){

        Transaction tx = null;

        try(Session session =HibernateUtil.getSessionFactory().openSession()){
            tx =session.beginTransaction();
            User user =session.get( User.class, id);

            if(user == null)throw new RuntimeException("User not found");

            session.delete(user);
            tx.commit();

        } catch(Exception e){
            if(tx != null) tx.rollback();
            throw new RuntimeException(e.getMessage());
        }
    }

}