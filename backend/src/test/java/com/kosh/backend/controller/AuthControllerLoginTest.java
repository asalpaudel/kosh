package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.EmailService;
import com.kosh.backend.service.LoginThrottleService;

@ExtendWith(MockitoExtension.class)
class AuthControllerLoginTest {

    @Mock UserRepository userRepository;
    @Mock NetworkRepository networkRepository;
    @Mock ActivityLogRepository activityLogRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(userRepository, networkRepository, activityLogRepository,
                passwordEncoder, emailService, new LoginThrottleService());
    }

    @Test
    void loginLooksUpTheAccountByItsStoredLowercaseEmail() {
        ReflectionTestUtils.setField(controller, "twoFactorEnabled", false);
        User user = activeMember();
        when(userRepository.findByEmail("asal@example.test")).thenReturn(user);
        when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);

        MockHttpSession session = new MockHttpSession();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);

        var response = controller.login(loginRequest("  Asal@Example.TEST ", "secret"), request, session);

        var body = (AuthController.LoginResponse) response.getBody();
        assertThat(body.success).isTrue();
    }

    @Test
    void aWrongTwoFactorCodeBurnsTheStoredCode() {
        User user = activeMember();
        user.setTwoFactorCode("123456");
        user.setTwoFactorExpiry(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findById(7)).thenReturn(Optional.of(user));

        assertThat(success(submitOtp(user.getId(), "000000"))).isFalse();
        assertThat(user.getTwoFactorCode()).isNull();
        verify(userRepository, times(1)).save(user);

        // The real code must no longer work: one guess per issued code, not a million.
        assertThat(success(submitOtp(user.getId(), "123456"))).isFalse();
        verify(userRepository, times(1)).save(any(User.class));
    }

    private Object submitOtp(Long userId, String otp) {
        return controller.verify2FA(
                Map.of("userId", userId, "otp", otp),
                new MockHttpServletResponse(),
                new MockHttpServletRequest(),
                new MockHttpSession()).getBody();
    }

    @SuppressWarnings("unchecked")
    private boolean success(Object body) {
        return Boolean.TRUE.equals(((Map<String, Object>) body).get("success"));
    }

    private AuthController.LoginRequest loginRequest(String email, String password) {
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.email = email;
        request.password = password;
        return request;
    }

    private User activeMember() {
        User user = new User();
        user.setId(7L);
        user.setEmail("asal@example.test");
        user.setName("Asal");
        user.setRole("member");
        user.setStatus("Active");
        user.setSahakari("Kosh Cooperative");
        user.setPassword("hashed");
        return user;
    }
}
