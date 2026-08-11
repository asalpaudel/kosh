package com.kosh.backend.model;

import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * One balanced journal entry.
 *
 * <p>Entries are append-only — the database refuses updates and deletes. A mistake is
 * corrected by posting a reversing entry that points back here through
 * {@code reversesEntry}. Each entry stores the hash of the previous entry for its
 * cooperative, so the whole history forms a chain that cannot be quietly rewritten.
 */
@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "network_id", nullable = false)
    @JsonIgnore
    private Network network;

    /** Position in this cooperative's chain, starting at 1. */
    @Column(name = "sequence_no", nullable = false)
    private Long sequenceNo;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false, length = 1000)
    private String narration;

    @Column(name = "voucher_ref", length = 100)
    private String voucherRef;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "posted_at", nullable = false)
    private Instant postedAt;

    @Column(name = "posted_by")
    private String postedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reverses_entry_id")
    @JsonIgnore
    private JournalEntry reversesEntry;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "entry_hash", nullable = false, length = 64)
    private String entryHash;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<JournalLine> lines = new ArrayList<>();

    public void addLine(JournalLine line) {
        line.setEntry(this);
        lines.add(line);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public Long getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Long sequenceNo) { this.sequenceNo = sequenceNo; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }

    public String getVoucherRef() { return voucherRef; }
    public void setVoucherRef(String voucherRef) { this.voucherRef = voucherRef; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }

    public Instant getPostedAt() { return postedAt; }
    public void setPostedAt(Instant postedAt) { this.postedAt = postedAt; }

    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }

    public JournalEntry getReversesEntry() { return reversesEntry; }
    public void setReversesEntry(JournalEntry reversesEntry) { this.reversesEntry = reversesEntry; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getEntryHash() { return entryHash; }
    public void setEntryHash(String entryHash) { this.entryHash = entryHash; }

    public List<JournalLine> getLines() { return lines; }
    public void setLines(List<JournalLine> lines) { this.lines = lines; }
}
