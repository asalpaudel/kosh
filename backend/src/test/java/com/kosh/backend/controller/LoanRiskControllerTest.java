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

import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.LoanRiskService;
import com.kosh.backend.service.NetworkAccessService;

@ExtendWith(MockitoExtension.class)
class LoanRiskControllerTest {
    @Mock LoanRiskService risk;
    @Mock NetworkRepository networks;

    @Test
    void adminCannotReadAnotherCooperativesRiskReport() {
        var controller = new LoanRiskController(risk, networks, new NetworkAccessService());
        var session = new MockHttpSession(); session.setAttribute("sahakariId", 10L);

        assertThat(controller.report(20L, null, session).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(networks, never()).findById(20L);
    }
}
