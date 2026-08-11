package com.kosh.backend.ledger;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.calendar.BikramSambatCalendar;
import com.kosh.backend.calendar.BsDate;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.Limit;

/**
 * Read access to the books, plus the one write a posted entry allows: a reversal.
 *
 * <p>Every endpoint is scoped to the session's own cooperative — the ledger is the most
 * sensitive data in the system, so nothing here takes a cooperative id from the caller.
 */
@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private final LedgerReports reports;
    private final LedgerService ledger;
    private final JournalEntryRepository entryRepo;
    private final NetworkRepository networkRepo;
    private final com.kosh.backend.repository.AccountRepository accountRepo;
    private final NetworkAccessService access;
    private final BikramSambatCalendar calendar;

    public LedgerController(LedgerReports reports,
                            LedgerService ledger,
                            JournalEntryRepository entryRepo,
                            NetworkRepository networkRepo,
                            com.kosh.backend.repository.AccountRepository accountRepo,
                            NetworkAccessService access,
                            BikramSambatCalendar calendar) {
        this.reports = reports;
        this.ledger = ledger;
        this.entryRepo = entryRepo;
        this.networkRepo = networkRepo;
        this.accountRepo = accountRepo;
        this.access = access;
        this.calendar = calendar;
    }

    @GetMapping("/accounts")
    @Transactional
    public ResponseEntity<?> chartOfAccounts(HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();

        // A cooperative that has never posted still deserves to see its chart.
        networkRepo.findById(networkId).ifPresent(ledger::ensureChartOfAccounts);
        return ResponseEntity.ok(accountRepo.findByNetworkIdOrderByCodeAsc(networkId));
    }

    @GetMapping("/journal")
    public ResponseEntity<?> journal(@RequestParam(defaultValue = "100") int limit, HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();

        List<JournalEntry> entries = entryRepo.findByNetworkIdOrderBySequenceNoDesc(
                networkId, Limit.of(Math.max(1, Math.min(limit, 500))));
        return ResponseEntity.ok(entries.stream().map(this::describe).toList());
    }

    @GetMapping("/trial-balance")
    public ResponseEntity<?> trialBalance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf,
            HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();
        LocalDate effective = asOf != null ? asOf : LocalDate.now();
        Map<String, Object> report = reports.trialBalance(networkId, effective);
        addCalendarContext(report, effective);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/income-statement")
    public ResponseEntity<?> incomeStatement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();

        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : calendar.fiscalYearFor(end).startAd();
        Map<String, Object> report = reports.incomeStatement(networkId, start, end);
        report.put("fromBs", calendar.toBs(start).toString());
        report.put("toBs", calendar.toBs(end).toString());
        report.put("fiscalYear", calendar.fiscalYearFor(end).label());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<?> balanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf,
            HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();
        LocalDate effective = asOf != null ? asOf : LocalDate.now();
        Map<String, Object> report = reports.balanceSheet(networkId, effective);
        addCalendarContext(report, effective);
        return ResponseEntity.ok(report);
    }

    /** Walks the hash chain and reports the first break, or the current checkpoint hash. */
    @GetMapping("/verify")
    public ResponseEntity<?> verify(HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();
        return ResponseEntity.ok(reports.verifyChain(networkId));
    }

    /** Members whose cached balance disagrees with the journal. Should always be empty. */
    @GetMapping("/balance-drift")
    public ResponseEntity<?> balanceDrift(HttpSession session) {
        Long networkId = networkId(session);
        String sahakari = (String) session.getAttribute("sahakari");
        if (networkId == null || sahakari == null) return unauthorised();
        return ResponseEntity.ok(reports.balanceDrift(networkId, sahakari));
    }

    /**
     * One-time onboarding: recognises the savings members already held before the ledger
     * existed. Safe to re-run — members already backed by the journal are skipped.
     */
    @PostMapping("/opening-balances")
    @Transactional
    public ResponseEntity<?> openingBalances(@RequestBody(required = false) Map<String, String> body,
                                             HttpSession session) {
        Long networkId = networkId(session);
        String sahakari = (String) session.getAttribute("sahakari");
        if (networkId == null || sahakari == null) return unauthorised();

        String asOfText = body != null ? body.get("asOf") : null;
        String asOfBs = body != null ? body.get("asOfBs") : null;
        LocalDate asOf = asOfBs != null && !asOfBs.isBlank()
                ? calendar.toAd(parseBs(asOfBs))
                : asOfText != null && !asOfText.isBlank() ? LocalDate.parse(asOfText) : LocalDate.now();

        return networkRepo.findById(networkId)
                .map(network -> ResponseEntity.ok(reports.postOpeningBalances(
                        network, sahakari, asOf, (String) session.getAttribute("userName"))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/entries/{id}/reverse")
    @Transactional
    public ResponseEntity<?> reverse(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body,
                                     HttpSession session) {
        Long networkId = networkId(session);
        if (networkId == null) return unauthorised();

        JournalEntry original = entryRepo.findById(id).orElse(null);
        if (original == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Entry not found"));
        }
        if (access.isForeign(original.getNetwork(), session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Not permitted for this cooperative"));
        }

        String reason = body != null ? body.get("reason") : null;
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A reversal needs a reason"));
        }

        // Checked here rather than caught from the service: letting the service's exception
        // cross the transaction boundary would mark the whole request rollback-only, and the
        // caller would see a 500 instead of the conflict this actually is.
        if (entryRepo.existsByReversesEntryId(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Entry " + id + " has already been reversed"));
        }

        return ResponseEntity.ok(describe(
                ledger.reverse(original, reason, (String) session.getAttribute("userName"))));
    }

    private Map<String, Object> describe(JournalEntry entry) {
        return Map.of(
                "id", entry.getId(),
                "sequenceNo", entry.getSequenceNo(),
                "date", entry.getEntryDate(),
                "narration", entry.getNarration(),
                "voucherRef", entry.getVoucherRef() != null ? entry.getVoucherRef() : "",
                "postedBy", entry.getPostedBy() != null ? entry.getPostedBy() : "",
                "reversesEntryId", entry.getReversesEntry() != null ? entry.getReversesEntry().getId() : "",
                "entryHash", entry.getEntryHash(),
                "lines", entry.getLines().stream().map(line -> Map.of(
                        "account", line.getAccount().getCode(),
                        "accountName", line.getAccount().getName(),
                        "memberId", line.getMember() != null ? line.getMember().getId() : "",
                        "debit", line.getDebit(),
                        "credit", line.getCredit(),
                        "memo", line.getLineMemo() != null ? line.getLineMemo() : "")).toList());
    }

    private Long networkId(HttpSession session) {
        return (Long) session.getAttribute("sahakariId");
    }

    private void addCalendarContext(Map<String, Object> report, LocalDate date) {
        report.put("asOfBs", calendar.toBs(date).toString());
        report.put("fiscalYear", calendar.fiscalYearFor(date).label());
    }

    private BsDate parseBs(String value) {
        String[] parts = value.trim().split("-");
        if (parts.length != 3) throw new IllegalArgumentException("BS date must be YYYY-MM-DD");
        return new BsDate(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));
    }

    private ResponseEntity<?> unauthorised() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
    }
}
