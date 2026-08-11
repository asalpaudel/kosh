package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import com.kosh.backend.service.LoanSecurityService;
import com.kosh.backend.service.NetworkAccessService;

@ExtendWith(MockitoExtension.class)
class LoanSecurityControllerTest {
    @Mock LoanSecurityService security;

    @Test
    void adminCannotReadAnotherCooperativesCollateralRegister() {
        var controller = new LoanSecurityController(security, new NetworkAccessService());
        var session = new MockHttpSession(); session.setAttribute("sahakariId", 10L);

        assertThat(controller.collateralRegister(20L, session).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(security, never()).collateralRegister(20L);
    }
}
