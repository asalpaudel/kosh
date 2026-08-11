package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.NetworkAccessService;

class PlatformDashboardEndpointTest {

    @Test
    void recentNetworksReturnsNewestFiveWithoutBinaryData() {
        NetworkRepository networks = mock(NetworkRepository.class);
        Network newest = network(8L, "Newest Cooperative", "premium", "1200.00");
        newest.setDocumentData(new byte[] { 1, 2, 3 });
        Network older = network(7L, "Older Cooperative", "basic", "500.00");
        when(networks.findTop5ByOrderByIdDesc()).thenReturn(List.of(newest, older));

        NetworkController controller = new NetworkController(
                networks, mock(ActivityLogRepository.class), new NetworkAccessService());

        var response = controller.getRecentNetworks();

        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0))
                .containsEntry("id", 8L)
                .containsEntry("name", "Newest Cooperative")
                .containsEntry("packagePrice", new BigDecimal("1200.00"))
                .containsEntry("hasDocument", true)
                .doesNotContainKey("documentData");
        verify(networks).findTop5ByOrderByIdDesc();
    }

    @Test
    void recentNetworksReturnsAnEmptyCollectionForANewPlatform() {
        NetworkRepository networks = mock(NetworkRepository.class);
        when(networks.findTop5ByOrderByIdDesc()).thenReturn(List.of());
        NetworkController controller = new NetworkController(
                networks, mock(ActivityLogRepository.class), new NetworkAccessService());

        assertThat(controller.getRecentNetworks().getBody()).isEmpty();
    }

    @Test
    void networkSnapshotCountsOnlySchemaSupportedRoles() {
        NetworkRepository networks = mock(NetworkRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(networks.count()).thenReturn(4L);
        when(users.countByRoleIgnoreCase("admin")).thenReturn(6L);
        when(users.countByRoleIgnoreCase("member")).thenReturn(240L);

        AnalyticsController controller = new AnalyticsController(
                networks, mock(TransactionRepository.class), users, mock(LedgerReports.class));

        assertThat(controller.getNetworkSnapshot()).containsExactlyInAnyOrderEntriesOf(
                java.util.Map.of("networks", 4L, "admins", 6L, "members", 240L));
        verify(users).countByRoleIgnoreCase("admin");
        verify(users).countByRoleIgnoreCase("member");
    }

    @Test
    void networkSnapshotReturnsZeroCountsForAnEmptyPlatform() {
        AnalyticsController controller = new AnalyticsController(
                mock(NetworkRepository.class), mock(TransactionRepository.class),
                mock(UserRepository.class), mock(LedgerReports.class));

        assertThat(controller.getNetworkSnapshot()).containsExactlyInAnyOrderEntriesOf(
                java.util.Map.of("networks", 0L, "admins", 0L, "members", 0L));
    }

    private Network network(Long id, String name, String packageType, String price) {
        Network network = new Network();
        network.setId(id);
        network.setRegisteredId("REG-" + id);
        network.setName(name);
        network.setCreatedAt("2026-08-11");
        network.setPackageType(packageType);
        network.setPackagePrice(new BigDecimal(price));
        network.setStaffCount(0);
        network.setUserCount(0);
        return network;
    }
}
