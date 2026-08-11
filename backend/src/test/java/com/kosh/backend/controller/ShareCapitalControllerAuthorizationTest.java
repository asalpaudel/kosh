package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import com.kosh.backend.controller.ShareCapitalController.PurchaseRequest;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.ShareCapitalService;

@ExtendWith(MockitoExtension.class)
class ShareCapitalControllerAuthorizationTest {
    @Mock ShareCapitalService shares;
    @Mock NetworkRepository networks;
    @Mock NetworkAccessService access;

    private ShareCapitalController controller;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        controller = new ShareCapitalController(shares, networks, access);
        session = new MockHttpSession();
        session.setAttribute("sahakariId", 4L);
    }

    @Test
    void foreignRegisterIsRejectedBeforeRepositoriesAreTouched() {
        when(access.canViewNetwork(9L, session)).thenReturn(false);

        var response = controller.register(9L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(shares, never()).register(9L);
    }

    @Test
    void foreignPurchaseIsRejectedBeforeNetworkLookup() {
        when(access.canViewNetwork(9L, session)).thenReturn(false);
        var request = new PurchaseRequest(1L, 10, "Cash", null, "request");

        var response = controller.purchase(9L, request, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(networks, never()).findById(9L);
    }
}
