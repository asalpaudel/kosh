package com.kosh.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fixed_deposit_applications")
public class FixedDepositApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "fixed_deposit_id", nullable = false)
    private FixedDeposit fixedDeposit;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    private Double depositAmount;
    private Integer depositTerm; // in months

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    private LocalDateTime applicationDate;
    private LocalDateTime reviewDate;
    
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

    public FixedDeposit getFixedDeposit() { return fixedDeposit; }
    public void setFixedDeposit(FixedDeposit fixedDeposit) { this.fixedDeposit = fixedDeposit; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public Double getDepositAmount() { return depositAmount; }
    public void setDepositAmount(Double depositAmount) { this.depositAmount = depositAmount; }

    public Integer getDepositTerm() { return depositTerm; }
    public void setDepositTerm(Integer depositTerm) { this.depositTerm = depositTerm; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public LocalDateTime getApplicationDate() { return applicationDate; }
    public void setApplicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; }

    public LocalDateTime getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDateTime reviewDate) { this.reviewDate = reviewDate; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
}