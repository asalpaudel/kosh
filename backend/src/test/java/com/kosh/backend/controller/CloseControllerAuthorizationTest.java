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
import com.kosh.backend.service.CheckpointPublicationService;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.AccountingPeriod;
import com.kosh.backend.model.ProcessingDateLock;
import com.kosh.backend.service.CloseService.CloseType;
import java.time.LocalDate;
import java.time.Instant;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class CloseControllerAuthorizationTest {
    @Mock CloseService closeService;
    @Mock NetworkRepository networks;
    @Mock NetworkAccessService access;
    @Mock CheckpointPublicationService checkpoints;

    @Test
    void foreignPeriodListIsRejectedBeforeRepositoryAccess() {
        MockHttpSession session = new MockHttpSession();
        when(access.canViewNetwork(9L, session)).thenReturn(false);
        CloseController controller = new CloseController(closeService, networks, access, checkpoints);

        var response = controller.periods(9L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(closeService, never()).periods(9L);
    }

    @Test
    void completedMonthClosePublishesExternalCheckpointAfterCloseReturns() {
        LocalDate date = LocalDate.of(2026, 4, 13);
        Network network = new Network(); network.setId(9L);
        AccountingPeriod period = new AccountingPeriod(); period.setId(3L); period.setNetwork(network);
        period.setPeriodType("MONTH_END"); period.setPeriodStart(date.withDayOfMonth(1)); period.setPeriodEnd(date);
        period.setClosedAt(Instant.now()); period.setClosedBy("Admin");
        MockHttpSession session = new MockHttpSession(); session.setAttribute("userName", "Admin");
        when(access.canViewNetwork(9L, session)).thenReturn(true);
        when(networks.findById(9L)).thenReturn(Optional.of(network));
        when(closeService.close(network, date, CloseType.MONTH_END, "Admin"))
                .thenReturn(new CloseService.CloseResult(period, new ProcessingDateLock(), false, 2));
        CloseController controller = new CloseController(closeService, networks, access, checkpoints);

        var response = controller.close(9L, new CloseController.CloseRequest(date, CloseType.MONTH_END), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(checkpoints).publish(network, date);
    }
}
