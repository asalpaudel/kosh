package com.kosh.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "saving_account_applications")
public class SavingAccountApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "saving_account_id", nullable = false)
    private SavingAccount savingAccount;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    @Column(precision = 18, scale = 2)
    private BigDecimal initialDeposit;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType = TransactionType.DEPOSIT;

    private Instant applicationDate;
    private Instant reviewDate;
    
    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(length = 1000)
    private String reviewNotes;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public SavingAccount getSavingAccount() { return savingAccount; }
    public void setSavingAccount(SavingAccount savingAccount) { this.savingAccount = savingAccount; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public BigDecimal getInitialDeposit() { return initialDeposit; }
    public void setInitialDeposit(BigDecimal initialDeposit) { this.initialDeposit = initialDeposit; }

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
}
