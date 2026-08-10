package com.kosh.backend.config;

import java.io.IOException;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Issues the CSRF cookie on every request.
 *
 * <p>{@code CookieCsrfTokenRepository} only writes the cookie once the token is actually
 * resolved. Reading the token here forces that to happen, so a single-page app always has
 * an {@code XSRF-TOKEN} cookie to copy into the {@code X-XSRF-TOKEN} header — including on
 * the very first GET after a login.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token != null) {
            token.getToken();
        }

        filterChain.doFilter(request, response);
    }
}
