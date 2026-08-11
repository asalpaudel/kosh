package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipInputStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.AccountingPeriodRepository;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.TransactionRepository;

@ExtendWith(MockitoExtension.class)
class AuditPackServiceTest {
    @Mock TransactionRepository transactions;
    @Mock JournalEntryRepository entries;
    @Mock JournalLineRepository lines;
    @Mock ActivityLogRepository activities;
    @Mock AccountingPeriodRepository periods;

    @Test
    void exportsCompletePortableAuditPack() throws Exception {
        Network network = new Network(); network.setId(7L); network.setName("Evidence Cooperative");
        when(transactions.findByNetworkIdOrderByDateDesc(7L)).thenReturn(List.of());
        when(entries.findByNetworkIdOrderBySequenceNoAsc(7L)).thenReturn(List.of());
        when(activities.findBySahakariIdOrderByTimestampDesc(7L)).thenReturn(List.of());
        when(periods.findByNetworkIdOrderByPeriodEndDescIdDesc(7L)).thenReturn(List.of());
        AuditPackService service = new AuditPackService(transactions, entries, lines, activities, periods,
                new ObjectMapper().findAndRegisterModules());

        byte[] exported = service.export(network);
        List<String> names = new ArrayList<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(exported))) {
            for (var entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) names.add(entry.getName());
        }

        assertThat(names).containsExactly("manifest.json", "transactions.csv", "journal.csv",
                "activity-log.csv", "accounting-periods.csv");
    }
}
