package com.kosh.backend.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SessionValidationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) 
            throws Exception {
        
        String path = request.getRequestURI();
        
        // Skip validation for public endpoints
        if (path.equals("/api/auth/login") || 
            path.equals("/api/auth/signup") || 
            path.equals("/") || 
            path.equals("/signup")) {
            return true;
        }

        HttpSession session = request.getSession(false);
        
        // Check if session exists and has userEmail
        if (session == null || session.getAttribute("userEmail") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Please login first\"}");
            return false;
        }

        // Role-based path validation
        String userRole = (String) session.getAttribute("userRole");
        
        if (path.startsWith("/admin") || path.startsWith("/api/admin") || path.startsWith("/api/finance")) {
            if (!"admin".equals(userRole)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Admin access required\"}");
                return false;
            }
        }
        
        if (path.startsWith("/superadmin") || path.startsWith("/api/superadmin")) {
            if (!"superadmin".equals(userRole)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Superadmin access required\"}");
                return false;
            }
        }
        
        if (path.startsWith("/home") || path.startsWith("/api/user")) {
            if (!"user".equals(userRole)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"User access required\"}");
                return false;
            }
        }

        return true;
    }
}