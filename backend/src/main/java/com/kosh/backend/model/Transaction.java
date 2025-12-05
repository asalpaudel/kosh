package com.kosh.backend.model;

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
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String voucherId;
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
    private Double amount;
    
    @Column(length = 1000)
    private String narration;

    private Long applicationId;
    private String applicationType;

    // --- NEW: Ledger Snapshot Fields ---
    private Double networkReserve; // Snapshot of (Savings + FD - Loan) at this moment

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

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVoucherId() { return voucherId; }
    public void setVoucherId(String voucherId) { this.voucherId = voucherId; }

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

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getApplicationType() { return applicationType; }
    public void setApplicationType(String applicationType) { this.applicationType = applicationType; }

    public Double getNetworkReserve() { return networkReserve; }
    public void setNetworkReserve(Double networkReserve) { this.networkReserve = networkReserve; }

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
}