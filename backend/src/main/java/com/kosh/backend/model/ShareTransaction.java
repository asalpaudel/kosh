package com.kosh.backend.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "share_transactions")
public class ShareTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    private String requestRef;
    private String transactionNumber;
    private String transactionType;
    @ManyToOne @JoinColumn(name = "from_member_id") private User fromMember;
    @ManyToOne @JoinColumn(name = "to_member_id") private User toMember;
    private Integer shareCount;
    @Column(precision = 18, scale = 2) private BigDecimal unitPrice;
    @Column(precision = 18, scale = 2) private BigDecimal totalAmount;
    private LocalDate transactionDate;
    @ManyToOne(optional = false) @JoinColumn(name = "journal_entry_id") private JournalEntry journalEntry;
    private String narration;
    private String createdBy;
    private Instant createdAt;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public String getRequestRef() { return requestRef; }
    public void setRequestRef(String requestRef) { this.requestRef = requestRef; }
    public String getTransactionNumber() { return transactionNumber; }
    public void setTransactionNumber(String transactionNumber) { this.transactionNumber = transactionNumber; }
    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
    public User getFromMember() { return fromMember; }
    public void setFromMember(User fromMember) { this.fromMember = fromMember; }
    public User getToMember() { return toMember; }
    public void setToMember(User toMember) { this.toMember = toMember; }
    public Integer getShareCount() { return shareCount; }
    public void setShareCount(Integer shareCount) { this.shareCount = shareCount; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    public JournalEntry getJournalEntry() { return journalEntry; }
    public void setJournalEntry(JournalEntry journalEntry) { this.journalEntry = journalEntry; }
    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
