package com.kosh.backend.model;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String voucherId;
    private String idempotencyKey;
    private String requestFingerprint;
    private LocalDate date;
    private String status; // "Success", "Frozen"

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String userName;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    private String type; // e.g. "Savings (Credit)"
    @Column(precision = 18, scale = 2)
    private BigDecimal amount;
    
    @Column(length = 1000)
    private String narration;

    private Long applicationId;
    private String applicationType;

    // --- NEW: Ledger Snapshot Fields ---
    @Column(precision = 18, scale = 2)
    private BigDecimal networkReserve; // Snapshot of (Savings + FD - Loan) at this moment

    // --- Flattened Details Fields ---
    private String mode; // "member" or "network"
    
    @Column(name = "fy_type")
    private String fyType; // "Current FY" or "Opening Balance" (NEW)
    
    private String accountHead; // "Savings", "Loan", "Fixed Deposit", "Office Rent"
    private String networkLedger; // "Cash", "Bank"
    private String direction; // "Credit", "Debit"
    private String paymentMethod;
    private String chequeNo;
    private String bankName;
    private String receivedBy;
    @Column(length = 20)
    private String approvalStatus = "NOT_REQUIRED";
    @ManyToOne @JoinColumn(name = "maker_id") private User maker;
    private Instant madeAt;
    @ManyToOne @JoinColumn(name = "checker_id") private User checker;
    private Instant checkedAt;
    @Column(length = 1000) private String checkerNotes;
    private Long packageId;
    private Integer requestedTerm;

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVoucherId() { return voucherId; }
    public void setVoucherId(String voucherId) { this.voucherId = voucherId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getRequestFingerprint() { return requestFingerprint; }
    public void setRequestFingerprint(String requestFingerprint) { this.requestFingerprint = requestFingerprint; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getApplicationType() { return applicationType; }
    public void setApplicationType(String applicationType) { this.applicationType = applicationType; }

    public BigDecimal getNetworkReserve() { return networkReserve; }
    public void setNetworkReserve(BigDecimal networkReserve) { this.networkReserve = networkReserve; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getFyType() { return fyType; }
    public void setFyType(String fyType) { this.fyType = fyType; }

    public String getAccountHead() { return accountHead; }
    public void setAccountHead(String accountHead) { this.accountHead = accountHead; }

    public String getNetworkLedger() { return networkLedger; }
    public void setNetworkLedger(String networkLedger) { this.networkLedger = networkLedger; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getChequeNo() { return chequeNo; }
    public void setChequeNo(String chequeNo) { this.chequeNo = chequeNo; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String value) { this.approvalStatus = value; }
    public User getMaker() { return maker; }
    public void setMaker(User value) { this.maker = value; }
    public Instant getMadeAt() { return madeAt; }
    public void setMadeAt(Instant value) { this.madeAt = value; }
    public User getChecker() { return checker; }
    public void setChecker(User value) { this.checker = value; }
    public Instant getCheckedAt() { return checkedAt; }
    public void setCheckedAt(Instant value) { this.checkedAt = value; }
    public String getCheckerNotes() { return checkerNotes; }
    public void setCheckerNotes(String value) { this.checkerNotes = value; }
    public Long getPackageId() { return packageId; }
    public void setPackageId(Long value) { this.packageId = value; }
    public Integer getRequestedTerm() { return requestedTerm; }
    public void setRequestedTerm(Integer value) { this.requestedTerm = value; }
}
