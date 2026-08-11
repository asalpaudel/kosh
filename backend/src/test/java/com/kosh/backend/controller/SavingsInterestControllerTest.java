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

import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.SavingsInterestService;

@ExtendWith(MockitoExtension.class)
class SavingsInterestControllerTest {
    @Mock SavingsInterestService interest;

    @Test
    void adminCannotReadAnotherCooperativesAccruals() {
        SavingsInterestController controller = new SavingsInterestController(interest, new NetworkAccessService());
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("role", "ADMIN");
        session.setAttribute("sahakariId", 10L);

        assertThat(controller.accruals(20L, session).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(interest, never()).history(20L);
    }
}
