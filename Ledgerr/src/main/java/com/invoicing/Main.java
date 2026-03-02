package com.invoicing;

import com.invoicing.config.AppConfig;
import com.invoicing.util.HibernateUtil;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.startup.Tomcat;
import org.glassfish.jersey.servlet.ServletContainer;

import java.io.File;

public class Main {

    private static final int    PORT         = 8080;
    private static final String CONTEXT_PATH = "/invoicing";

    public static void main(String[] args) {

        HibernateUtil.getSessionFactory();

        try {
            Tomcat tomcat = new Tomcat();
            tomcat.setPort(PORT);
            tomcat.getConnector();

            Context context = tomcat.addWebapp(
                    CONTEXT_PATH,
                    new File("src/main/webapp/").getAbsolutePath()
            );

            Tomcat.addServlet(context, "JerseyServlet",
                    new ServletContainer(new AppConfig()));
            context.addServletMappingDecoded("/api/*", "JerseyServlet");

            tomcat.start();
            System.out.println("================================================");
            System.out.println("  Ledgrr running!");
            System.out.println("  URL : http://localhost:" + PORT + CONTEXT_PATH);
            System.out.println("================================================");
            tomcat.getServer().await();

        } catch (LifecycleException e) {
            throw new RuntimeException("Embedded Tomcat failed to start: " + e.getMessage(), e);
        }
    }
}
