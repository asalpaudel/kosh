package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.CloseService;
import com.kosh.backend.service.NetworkAccessService;

@ExtendWith(MockitoExtension.class)
class CloseControllerAuthorizationTest {
    @Mock CloseService closeService;
    @Mock NetworkRepository networks;
    @Mock NetworkAccessService access;

    @Test
    void foreignPeriodListIsRejectedBeforeRepositoryAccess() {
        MockHttpSession session = new MockHttpSession();
        when(access.canViewNetwork(9L, session)).thenReturn(false);
        CloseController controller = new CloseController(closeService, networks, access);

        var response = controller.periods(9L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(closeService, never()).periods(9L);
    }
}
