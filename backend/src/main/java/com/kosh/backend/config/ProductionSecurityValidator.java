package com.kosh.backend.config;

import java.net.URI;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Refuses to run a production profile with development-grade security settings.
 * Property placeholders in {@code application-prod.properties} already make secrets
 * mandatory; these checks cover unsafe values that are syntactically present.
 */
@Component
@Profile("prod")
public class ProductionSecurityValidator {

    @Value("${app.cors.allowed-origins:}")
    private String allowedOrigins;

    @Value("${server.servlet.session.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${app.auth.two-factor-enabled:false}")
    private boolean memberTwoFactorEnabled;

    @Value("${app.superadmin.email:}")
    private String superadminEmail;

    @Value("${app.superadmin.password-hash:}")
    private String superadminPasswordHash;

    @PostConstruct
    void validate() {
        if (!secureCookie) {
            throw new IllegalStateException("Production requires Secure session cookies");
        }
        if (!memberTwoFactorEnabled) {
            throw new IllegalStateException("Production requires member two-factor authentication");
        }
        validateOrigins();

        boolean hasEmail = !superadminEmail.isBlank();
        boolean hasPassword = !superadminPasswordHash.isBlank();
        if (hasEmail != hasPassword) {
            throw new IllegalStateException(
                    "Superadmin email and password hash must either both be configured or both be absent");
        }
        if (hasPassword && !superadminPasswordHash.startsWith("$2")) {
            throw new IllegalStateException("Superadmin password must be configured as a BCrypt hash");
        }
    }

    private void validateOrigins() {
        if (allowedOrigins.isBlank()) {
            throw new IllegalStateException("Production requires an explicit CORS origin allowlist");
        }

        Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .forEach(origin -> {
                    URI uri;
                    try {
                        uri = URI.create(origin);
                    } catch (IllegalArgumentException exception) {
                        throw new IllegalStateException("Production CORS allowlist contains an invalid origin", exception);
                    }
                    if (!"https".equalsIgnoreCase(uri.getScheme())
                            || uri.getHost() == null
                            || origin.contains("*")
                            || uri.getUserInfo() != null
                            || uri.getPath() != null && !uri.getPath().isEmpty()) {
                        throw new IllegalStateException(
                                "Production CORS origins must be exact HTTPS origins without paths or wildcards");
                    }
                });
    }
}
