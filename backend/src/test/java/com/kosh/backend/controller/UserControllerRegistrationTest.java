package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.ShareCapitalService;

@ExtendWith(MockitoExtension.class)
class UserControllerRegistrationTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private NetworkRepository networkRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ShareCapitalService shareCapitalService;

    @Test
    void anonymousRegistrationCannotSelectRoleOrStatus() {
        var network = new Network();
        network.setId(42L);
        network.setName("Example Cooperative");
        network.setUserLimit(100);

        when(networkRepository.findByName("Example Cooperative")).thenReturn(network);
        when(userRepository.findByEmail("person@example.test")).thenReturn(null);
        when(userRepository.findAll()).thenReturn(List.of());
        when(passwordEncoder.encode("strong-password")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var controller = new UserController(
                userRepository,
                networkRepository,
                activityLogRepository,
                passwordEncoder,
                shareCapitalService);

        var response = controller.createUser(
                "Person",
                "Person@Example.Test",
                "9800000000",
                null,
                null,
                "superadmin",
                "Example Cooperative",
                "strong-password",
                "Active",
                null,
                null,
                null,
                new MockHttpSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        var captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo("member");
        assertThat(captor.getValue().getStatus()).isEqualTo("Pending");
        assertThat(captor.getValue().getEmail()).isEqualTo("person@example.test");
        assertThat(captor.getValue().getSahakariId()).isEqualTo(42L);
    }
}
