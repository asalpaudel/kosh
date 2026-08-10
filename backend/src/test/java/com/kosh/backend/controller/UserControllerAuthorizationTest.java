package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kosh.backend.controller.UserController.AdminMemberUpdateRequest;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserControllerAuthorizationTest {

    @Mock UserRepository userRepository;
    @Mock NetworkRepository networkRepository;
    @Mock ActivityLogRepository activityLogRepository;
    @Mock PasswordEncoder passwordEncoder;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(userRepository, networkRepository, activityLogRepository, passwordEncoder);
    }

    @Test
    void adminCannotUpdateMemberFromAnotherCooperative() {
        User target = member(17, 200L);
        when(userRepository.findById(17L)).thenReturn(Optional.of(target));

        var response = controller.updateMemberAsAdmin(
                17L,
                new AdminMemberUpdateRequest("Attacker controlled", "new@example.test", null, null),
                adminSession(100L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).save(any());
    }

    @Test
    void adminCannotManageCooperativeAdministrator() {
        User target = member(18, 100L);
        target.setRole("admin");
        when(userRepository.findById(18L)).thenReturn(Optional.of(target));

        var response = controller.updateMemberAsAdmin(
                18L,
                new AdminMemberUpdateRequest("Changed", "new@example.test", null, null),
                adminSession(100L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).save(any());
    }

    @Test
    void adminBasicUpdatePreservesRoleCooperativeAndStatus() {
        User target = member(19, 100L);
        target.setSahakari("Cooperative A");
        target.setStatus("Pending");
        when(userRepository.findById(19L)).thenReturn(Optional.of(target));
        when(userRepository.save(target)).thenReturn(target);

        var response = controller.updateMemberAsAdmin(
                19L,
                new AdminMemberUpdateRequest("Updated Name", "UPDATED@EXAMPLE.TEST", "9800", null),
                adminSession(100L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(target.getRole()).isEqualTo("member");
        assertThat(target.getSahakari()).isEqualTo("Cooperative A");
        assertThat(target.getSahakariId()).isEqualTo(100L);
        assertThat(target.getStatus()).isEqualTo("Pending");
        assertThat(target.getEmail()).isEqualTo("updated@example.test");
    }

    @Test
    void adminCannotApproveMemberFromAnotherCooperative() {
        User target = member(20, 200L);
        when(userRepository.findById(20L)).thenReturn(Optional.of(target));

        var response = controller.approveUser(20L, adminSession(100L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).save(any());
    }

    private User member(int id, Long networkId) {
        User user = new User();
        user.setId((long) id);
        user.setName("Member");
        user.setEmail("member@example.test");
        user.setRole("member");
        user.setSahakariId(networkId);
        return user;
    }

    private MockHttpSession adminSession(Long networkId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", "admin");
        session.setAttribute("userName", "Admin");
        session.setAttribute("sahakariId", networkId);
        return session;
    }
}
