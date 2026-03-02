package com.invoicing.servlet;

import jakarta.servlet.*;

import java.io.IOException;

public class EncodingFilter implements Filter {
    private String encoding = "UTF-8";

    @Override
    public void init(FilterConfig cfg) {
        String enc = cfg.getInitParameter("encoding");
        if (enc != null) encoding = enc;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        req.setCharacterEncoding(encoding);
        resp.setCharacterEncoding(encoding);
        chain.doFilter(req, resp);
    }

    @Override
    public void destroy() {
    }
}
