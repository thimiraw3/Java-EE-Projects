package com.ems;

import com.ems.config.AppConfig;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.startup.Tomcat;
import org.glassfish.jersey.servlet.ServletContainer;

import java.io.File;

public class Main {

    private static final int SERVER_PORT = 8080;
    private static final String CONTEXT_PATH = "/ems";

    public static void main(String[] args) {

        try {
            Tomcat tomcat = new Tomcat();
            tomcat.setPort(SERVER_PORT);
            tomcat.getConnector();

            Context context = tomcat.addWebapp(
                    CONTEXT_PATH,
                    new File("src/main/webapp/").getAbsolutePath()
            );

            Tomcat.addServlet(context, "JerseyServlet",
                    new ServletContainer(new AppConfig()));
            context.addServletMappingDecoded("/api/*", "JerseyServlet");

            tomcat.start();
            System.out.println("╔══════════════════════════════════════════════╗");
            System.out.println("║     Employee Management System — RUNNING     ║");
            System.out.println("╠══════════════════════════════════════════════╣");
            System.out.println("║  URL  : http://localhost:" + SERVER_PORT + CONTEXT_PATH + "            ║");
            System.out.println("║                                              ║");
            System.out.println("╚══════════════════════════════════════════════╝");
            tomcat.getServer().await();

        } catch (LifecycleException e) {
            throw new RuntimeException("Embedded Tomcat failed to start: " + e.getMessage(), e);
        }
    }
}
