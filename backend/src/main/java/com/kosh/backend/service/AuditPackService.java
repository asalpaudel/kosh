package com.kosh.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kosh.backend.model.AccountingPeriod;
import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.repository.AccountingPeriodRepository;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.TransactionRepository;

@Service
public class AuditPackService {
    private final TransactionRepository transactions;
    private final JournalEntryRepository entries;
    private final JournalLineRepository lines;
    private final ActivityLogRepository activities;
    private final AccountingPeriodRepository periods;
    private final ObjectMapper json;

    public AuditPackService(TransactionRepository transactions, JournalEntryRepository entries,
            JournalLineRepository lines, ActivityLogRepository activities,
            AccountingPeriodRepository periods, ObjectMapper json) {
        this.transactions = transactions; this.entries = entries; this.lines = lines;
        this.activities = activities; this.periods = periods; this.json = json;
    }

    @Transactional(readOnly = true)
    public Overview overview(Network network) {
        List<Transaction> transactionRows = transactions.findByNetworkIdOrderByDateDesc(network.getId());
        List<JournalEntry> journalRows = entries.findByNetworkIdOrderBySequenceNoAsc(network.getId());
        return new Overview(network.getId(), network.getName(), Instant.now(), transactionRows.size(),
                transactionRows.stream().filter(value -> "PENDING".equals(value.getApprovalStatus())).count(),
                journalRows.size(), journalRows.isEmpty() ? 0L : journalRows.get(journalRows.size() - 1).getSequenceNo(),
                journalRows.isEmpty() ? null : journalRows.get(journalRows.size() - 1).getEntryHash(),
                activities.findBySahakariIdOrderByTimestampDesc(network.getId()).size(),
                periods.findByNetworkIdOrderByPeriodEndDescIdDesc(network.getId()).size());
    }

    @Transactional(readOnly = true)
    public byte[] export(Network network) {
        try {
            List<Transaction> transactionRows = transactions.findByNetworkIdOrderByDateDesc(network.getId());
            List<JournalEntry> journalRows = entries.findByNetworkIdOrderBySequenceNoAsc(network.getId());
            List<ActivityLog> activityRows = activities.findBySahakariIdOrderByTimestampDesc(network.getId());
            List<AccountingPeriod> periodRows = periods.findByNetworkIdOrderByPeriodEndDescIdDesc(network.getId());
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
                add(zip, "manifest.json", json.writeValueAsBytes(Map.of(
                        "networkId", network.getId(), "networkName", network.getName(),
                        "generatedAt", Instant.now().toString(), "transactionCount", transactionRows.size(),
                        "journalEntryCount", journalRows.size(), "activityCount", activityRows.size(),
                        "periodCount", periodRows.size())));
                add(zip, "transactions.csv", transactionCsv(transactionRows));
                add(zip, "journal.csv", journalCsv(journalRows));
                add(zip, "activity-log.csv", activityCsv(activityRows));
                add(zip, "accounting-periods.csv", periodCsv(periodRows));
            }
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Audit pack could not be generated", exception);
        }
    }

    private byte[] transactionCsv(List<Transaction> values) {
        StringBuilder csv = new StringBuilder("id,voucher,date,status,approval_status,maker,checker,member,type,amount,account,direction\n");
        values.forEach(value -> row(csv, value.getId(), value.getVoucherId(), value.getDate(), value.getStatus(),
                value.getApprovalStatus(), value.getMaker() == null ? null : value.getMaker().getName(),
                value.getChecker() == null ? null : value.getChecker().getName(), value.getUserName(),
                value.getType(), value.getAmount(), value.getAccountHead(), value.getDirection()));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] journalCsv(List<JournalEntry> values) {
        StringBuilder csv = new StringBuilder("sequence,date,voucher,source,source_id,account,member,debit,credit,previous_hash,entry_hash\n");
        for (JournalEntry entry : values) {
            lines.findByEntryIdOrderByIdAsc(entry.getId()).forEach(line -> row(csv, entry.getSequenceNo(),
                    entry.getEntryDate(), entry.getVoucherRef(), entry.getSourceType(), entry.getSourceId(),
                    line.getAccount().getCode(), line.getMember() == null ? null : line.getMember().getId(),
                    line.getDebit(), line.getCredit(), entry.getPreviousHash(), entry.getEntryHash()));
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] activityCsv(List<ActivityLog> values) {
        StringBuilder csv = new StringBuilder("timestamp,actor,role,action,details\n");
        values.forEach(value -> row(csv, value.getTimestamp(), value.getActorName(), value.getRole(),
                value.getAction(), value.getDetails()));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] periodCsv(List<AccountingPeriod> values) {
        StringBuilder csv = new StringBuilder("type,start,end,closed_at,closed_by,reopened_at,reopened_by,reopen_reason\n");
        values.forEach(value -> row(csv, value.getPeriodType(), value.getPeriodStart(), value.getPeriodEnd(),
                value.getClosedAt(), value.getClosedBy(), value.getReopenedAt(), value.getReopenedBy(),
                value.getReopenReason()));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void row(StringBuilder output, Object... values) {
        for (int index = 0; index < values.length; index++) {
            if (index > 0) output.append(',');
            String value = values[index] == null ? "" : values[index].toString();
            output.append('"').append(value.replace("\"", "\"\"").replace("\r", " ").replace("\n", " ")).append('"');
        }
        output.append('\n');
    }

    private void add(ZipOutputStream zip, String name, byte[] data) throws IOException {
        zip.putNextEntry(new ZipEntry(name)); zip.write(data); zip.closeEntry();
    }

    public record Overview(Long networkId, String networkName, Instant generatedAt, int transactionCount,
            long pendingApprovals, int journalEntryCount, long latestSequence, String latestEntryHash,
            int activityCount, int accountingPeriodCount) {}
}
