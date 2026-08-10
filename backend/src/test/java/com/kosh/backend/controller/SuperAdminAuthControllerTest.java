package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.service.EmailService;
import com.kosh.backend.service.LoginThrottleService;

class SuperAdminAuthControllerTest {

    @Test
    void otpVerificationDerivesIdentityFromTheServerChallenge() {
        var controller = new SuperAdminAuthController(
                mock(EmailService.class),
                mock(ActivityLogRepository.class),
                mock(PasswordEncoder.class),
                new LoginThrottleService());
        ReflectionTestUtils.setField(controller, "authorizedEmail", "root@example.test");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("pendingSuperadminEmail", "root@example.test");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);

        var response = controller.verifyOtp(Map.of("otp", "123456"), request, session);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("No OTP found");
    }
}
