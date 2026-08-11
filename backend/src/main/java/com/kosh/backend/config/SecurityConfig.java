package com.kosh.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Origins allowed to call the API with session cookies. The frontend is served from a
     * different port in development and may be a different host in production, so the list
     * is configuration rather than a constant. Credentials are sent, so no wildcard.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"))
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER))
                .permissionsPolicyHeader(permissions -> permissions.policy(
                    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31_536_000)))
            // Sessions are cookie-based, so every mutating request from an authenticated
            // user must carry a CSRF token. The token cookie is readable by JavaScript on
            // purpose: the SPA copies it into the X-XSRF-TOKEN header.
            //
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .cors(cors -> {})
            .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
            .addFilterBefore(new SessionAuthenticationFilter(), AnonymousAuthenticationFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/csrf").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/login",
                    "/api/auth/verify-2fa",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/superadmin-auth/login",
                    "/api/superadmin-auth/verify-otp",
                    "/api/users").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/networks").permitAll()

                .requestMatchers("/api/superadmin-auth/session", "/api/superadmin-auth/logout")
                    .hasRole("SUPERADMIN")
                .requestMatchers("/api/auth/logout", "/api/session", "/api/users/me",
                    "/api/users/me/**", "/api/users/change-password", "/api/calendar/**").authenticated()

                .requestMatchers("/api/users/all", "/api/users/count").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.GET, "/api/users").hasAnyRole("ADMIN", "SUPERADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasAnyRole("ADMIN", "SUPERADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/*/superadmin").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAnyRole("ADMIN", "SUPERADMIN")
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("ADMIN", "SUPERADMIN")

                .requestMatchers(HttpMethod.POST, "/api/networks/**").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/networks/**").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/networks/**").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.GET, "/api/networks/*/logo", "/api/networks/*/logo/base64").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/networks/stats", "/api/networks/recent",
                    "/api/networks/*/document", "/api/networks/*/document/base64").hasRole("SUPERADMIN")
                .requestMatchers(HttpMethod.GET, "/api/networks/*").authenticated()

                .requestMatchers(HttpMethod.GET, "/api/finance/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/finance/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/finance/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/finance/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/applications/**").hasRole("MEMBER")
                .requestMatchers(HttpMethod.GET, "/api/applications/*/user").hasRole("MEMBER")
                .requestMatchers(HttpMethod.GET, "/api/applications/*/network/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/applications/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/transactions").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/transactions/sahakari").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/transactions").authenticated()

                .requestMatchers(HttpMethod.GET, "/api/shares/me/**").hasRole("MEMBER")
                .requestMatchers("/api/shares/network/**").hasRole("ADMIN")

                // The books are readable by the cooperative's own admin; a posted entry can
                // only ever be reversed, never edited, so that is the single write allowed.
                .requestMatchers(HttpMethod.GET, "/api/ledger/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/ledger/entries/*/reverse",
                    "/api/ledger/opening-balances").hasRole("ADMIN")

                .requestMatchers("/api/analytics/admin/**", "/api/history/admin").hasRole("ADMIN")
                .requestMatchers("/api/analytics/**", "/api/history/superadmin").hasRole("SUPERADMIN")
                .anyRequest().denyAll()
            );
        
        return http.build();
    }
}
