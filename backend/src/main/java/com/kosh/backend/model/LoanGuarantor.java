package com.kosh.backend.model;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "loan_guarantors")
public class LoanGuarantor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    @ManyToOne(optional = false) @JoinColumn(name = "loan_application_id") private LoanApplication loanApplication;
    @ManyToOne(optional = false) @JoinColumn(name = "guarantor_id") private User guarantor;
    @Column(precision = 18, scale = 2) private BigDecimal liabilityAmount;
    @Column(length = 500) private String consentReference;
    private Instant consentedAt;
    @Column(length = 20) private String status;
    private Instant releasedAt;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public LoanApplication getLoanApplication() { return loanApplication; }
    public void setLoanApplication(LoanApplication loanApplication) { this.loanApplication = loanApplication; }
    public User getGuarantor() { return guarantor; }
    public void setGuarantor(User guarantor) { this.guarantor = guarantor; }
    public BigDecimal getLiabilityAmount() { return liabilityAmount; }
    public void setLiabilityAmount(BigDecimal liabilityAmount) { this.liabilityAmount = liabilityAmount; }
    public String getConsentReference() { return consentReference; }
    public void setConsentReference(String consentReference) { this.consentReference = consentReference; }
    public Instant getConsentedAt() { return consentedAt; }
    public void setConsentedAt(Instant consentedAt) { this.consentedAt = consentedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }
}
