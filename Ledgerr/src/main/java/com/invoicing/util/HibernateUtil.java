package com.invoicing.util;

import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;

public class HibernateUtil {

    private static volatile SessionFactory sessionFactory;

    private HibernateUtil() {}

    public static SessionFactory getSessionFactory() {
        if (sessionFactory == null) {
            synchronized (HibernateUtil.class) {
                if (sessionFactory == null) {
                    StandardServiceRegistry registry =
                            new StandardServiceRegistryBuilder()
                                    .configure("hibernate.cfg.xml")
                                    .build();
                    try {
                        sessionFactory = new MetadataSources(registry)
                                .buildMetadata()
                                .buildSessionFactory();
                    } catch (Exception e) {
                        StandardServiceRegistryBuilder.destroy(registry);
                        throw new RuntimeException("Failed to build SessionFactory: " + e.getMessage(), e);
                    }
                }
            }
        }
        return sessionFactory;
    }

    public static void shutdown() {
        if (sessionFactory != null && !sessionFactory.isClosed()) {
            sessionFactory.close();
        }
    }
}
