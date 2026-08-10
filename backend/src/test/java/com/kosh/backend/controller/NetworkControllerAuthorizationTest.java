package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import com.kosh.backend.model.Network;
import com.kosh.backend.dto.NetworkRequests.Update;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.NetworkAccessService;

@ExtendWith(MockitoExtension.class)
class NetworkControllerAuthorizationTest {

    @Mock NetworkRepository networkRepository;
    @Mock ActivityLogRepository activityLogRepository;

    private NetworkController controller;

    @BeforeEach
    void setUp() {
        controller = new NetworkController(networkRepository, activityLogRepository, new NetworkAccessService());
    }

    @Test
    void memberCannotReadAnotherCooperativeDetails() {
        MockHttpSession session = session("member", 10L);

        var response = controller.getNetworkById(20L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void cooperativeAdminCannotReadRegistrationDocument() {
        MockHttpSession session = session("admin", 10L);

        var response = controller.downloadDocument(10L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void superAdminCanReadRegistrationDocument() {
        Network network = new Network();
        network.setId(10L);
        network.setDocumentData("document".getBytes());
        network.setDocumentName("registration.txt");
        network.setDocumentType("text/plain");
        when(networkRepository.findById(10L)).thenReturn(Optional.of(network));

        var response = controller.downloadDocument(10L, session("superadmin", null));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("document".getBytes());
    }

    @Test
    void networkUpdateRejectsNegativeLimitsBeforePersistence() {
        var request = new Update("REG-1", "Cooperative", null, null, null, null,
                "basic", new BigDecimal("100.00"), 1, 10, -1, 10);

        var response = controller.updateNetwork(10L, request, session("superadmin", null));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(networkRepository, never()).findById(10L);
    }

    private MockHttpSession session(String role, Long networkId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", role);
        if (networkId != null) session.setAttribute("sahakariId", networkId);
        return session;
    }
}
