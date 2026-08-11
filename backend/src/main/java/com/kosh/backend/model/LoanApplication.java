package com.kosh.backend.model;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "loan_applications")
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "loan_package_id", nullable = false)
    private LoanPackage loanPackage;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    @Column(precision = 18, scale = 2)
    private BigDecimal requestedAmount;
    
    @Column(precision = 18, scale = 2)
    private BigDecimal approvedAmount;   // Admin might approve less
    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;     // Snapshot of rate at time of approval
    private Integer durationInMonths; // Snapshot of duration
    private LocalDate startDate;
    private LocalDate nextPaymentDate; 
    
    @Column(length = 2000)
    private String purpose;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType = TransactionType.WITHDRAW;

    private Instant applicationDate;
    private Instant reviewDate;
    
    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(length = 1000)
    private String reviewNotes;
    private String riskClassification = "PASS";
    @Column(precision = 18, scale = 2)
    private BigDecimal provisionBalance = BigDecimal.ZERO;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LoanPackage getLoanPackage() { return loanPackage; }
    public void setLoanPackage(LoanPackage loanPackage) { this.loanPackage = loanPackage; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }

    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }

    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }

    public Integer getDurationInMonths() { return durationInMonths; }
    public void setDurationInMonths(Integer durationInMonths) { this.durationInMonths = durationInMonths; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getNextPaymentDate() { return nextPaymentDate; }
    public void setNextPaymentDate(LocalDate nextPaymentDate) { this.nextPaymentDate = nextPaymentDate; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }

    public Instant getApplicationDate() { return applicationDate; }
    public void setApplicationDate(Instant applicationDate) { this.applicationDate = applicationDate; }

    public Instant getReviewDate() { return reviewDate; }
    public void setReviewDate(Instant reviewDate) { this.reviewDate = reviewDate; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
    public String getRiskClassification() { return riskClassification; }
    public void setRiskClassification(String value) { this.riskClassification = value; }
    public BigDecimal getProvisionBalance() { return provisionBalance == null ? BigDecimal.ZERO : provisionBalance; }
    public void setProvisionBalance(BigDecimal value) { this.provisionBalance = value == null ? BigDecimal.ZERO : value; }
}
