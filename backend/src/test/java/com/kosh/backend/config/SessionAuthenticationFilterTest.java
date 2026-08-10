package com.kosh.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class SessionAuthenticationFilterTest {

    private final SessionAuthenticationFilter filter = new SessionAuthenticationFilter();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesKnownRoleFromServerSession() throws Exception {
        var request = new MockHttpServletRequest();
        request.getSession().setAttribute("userEmail", "member@example.test");
        request.getSession().setAttribute("userRole", "member");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getName()).isEqualTo("member@example.test");
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_MEMBER");
    }

    @Test
    void rejectsUnknownRoleStoredInSession() throws Exception {
        var request = new MockHttpServletRequest();
        request.getSession().setAttribute("userEmail", "attacker@example.test");
        request.getSession().setAttribute("userRole", "owner");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
