package com.kosh.backend.config;

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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF remains a tracked blocker until token bootstrapping is rolled out to
            // every mutating frontend request.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .addFilterBefore(new SessionAuthenticationFilter(), AnonymousAuthenticationFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()
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
                    "/api/users/me/**", "/api/users/change-password").authenticated()

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

                .requestMatchers("/api/analytics/admin/**", "/api/history/admin").hasRole("ADMIN")
                .requestMatchers("/api/analytics/**", "/api/history/superadmin").hasRole("SUPERADMIN")
                .anyRequest().denyAll()
            );
        
        return http.build();
    }
}
