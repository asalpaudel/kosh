package com.kosh.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sahakariId;
    private Long networkId;

    private String voucherId;
    private String transactionId;
    private String date;
    private String status;

    private Integer userId;
    private String userName;

    // Type: one of Savings, Fixed Deposit, Loan, Interest
    private String type;

    // Signed amount: deposit -> positive, withdraw -> negative
    private Double amountValue;

    private String narration;

    @Column(columnDefinition = "TEXT")
    private String detailsJson;

    public Transaction() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSahakariId() { return sahakariId; }
    public void setSahakariId(Long sahakariId) { this.sahakariId = sahakariId; }

    public Long getNetworkId() { return networkId; }
    public void setNetworkId(Long networkId) { this.networkId = networkId; }

    public String getVoucherId() { return voucherId; }
    public void setVoucherId(String voucherId) { this.voucherId = voucherId; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getAmountValue() { return amountValue; }
    public void setAmountValue(Double amountValue) { this.amountValue = amountValue; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }

    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }
}
