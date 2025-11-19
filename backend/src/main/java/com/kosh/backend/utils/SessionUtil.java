package com.kosh.backend.util;

import jakarta.servlet.http.HttpSession;

public class SessionUtil {
    
    public static boolean isAuthenticated(HttpSession session) {
        return session != null && session.getAttribute("userEmail") != null;
    }
    
    public static String getUserEmail(HttpSession session) {
        return (String) session.getAttribute("userEmail");
    }
    
    public static String getUserRole(HttpSession session) {
        return (String) session.getAttribute("userRole");
    }
    
    public static Long getSahakariId(HttpSession session) {
        Object sahakariIdObj = session.getAttribute("sahakariId");
        if (sahakariIdObj == null) {
            return null;
        }
        if (sahakariIdObj instanceof Integer) {
            return ((Integer) sahakariIdObj).longValue();
        }
        return (Long) sahakariIdObj;
    }
    
    public static boolean hasRole(HttpSession session, String role) {
        String userRole = getUserRole(session);
        return userRole != null && userRole.equals(role);
    }
    
    public static boolean isAdmin(HttpSession session) {
        return hasRole(session, "admin");
    }
    
    public static boolean isSuperadmin(HttpSession session) {
        return hasRole(session, "superadmin");
    }
    
    public static boolean isUser(HttpSession session) {
        return hasRole(session, "user");
    }
}