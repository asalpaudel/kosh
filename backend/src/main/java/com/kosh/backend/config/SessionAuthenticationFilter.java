package com.kosh.backend.config;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public class SessionAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                String role = normalizedRole(session.getAttribute("userRole"));
                String email = stringValue(session.getAttribute("userEmail"));

                if (role != null && email != null) {
                    var authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT));
                    var authentication = UsernamePasswordAuthenticationToken.authenticated(
                            email,
                            null,
                            List.of(authority));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String normalizedRole(Object value) {
        String role = stringValue(value);
        if (role == null) {
            return null;
        }

        return switch (role.toLowerCase(Locale.ROOT)) {
            case "member", "admin", "auditor", "superadmin" -> role.toLowerCase(Locale.ROOT);
            default -> null;
        };
    }

    private String stringValue(Object value) {
        if (!(value instanceof String stringValue) || stringValue.isBlank()) {
            return null;
        }
        return stringValue;
    }
}
