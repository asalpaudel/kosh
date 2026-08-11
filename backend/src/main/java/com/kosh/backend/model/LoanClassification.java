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
@Table(name = "loan_classifications")
public class LoanClassification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    @ManyToOne(optional = false) @JoinColumn(name = "loan_application_id") private LoanApplication loanApplication;
    private LocalDate classificationDate;
    private LocalDate oldestOverdueDate;
    private Integer daysPastDue;
    @Column(length = 20) private String classification;
    @Column(precision = 18, scale = 2) private BigDecimal outstandingPrincipal;
    @Column(precision = 5, scale = 2) private BigDecimal provisionRate;
    @Column(precision = 18, scale = 2) private BigDecimal requiredProvision;
    @Column(precision = 18, scale = 2) private BigDecimal previousProvision;
    @Column(precision = 18, scale = 2) private BigDecimal provisionChange;
    @ManyToOne @JoinColumn(name = "journal_entry_id") private JournalEntry journalEntry;
    private Instant createdAt;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network value) { this.network = value; }
    public LoanApplication getLoanApplication() { return loanApplication; }
    public void setLoanApplication(LoanApplication value) { this.loanApplication = value; }
    public LocalDate getClassificationDate() { return classificationDate; }
    public void setClassificationDate(LocalDate value) { this.classificationDate = value; }
    public LocalDate getOldestOverdueDate() { return oldestOverdueDate; }
    public void setOldestOverdueDate(LocalDate value) { this.oldestOverdueDate = value; }
    public Integer getDaysPastDue() { return daysPastDue; }
    public void setDaysPastDue(Integer value) { this.daysPastDue = value; }
    public String getClassification() { return classification; }
    public void setClassification(String value) { this.classification = value; }
    public BigDecimal getOutstandingPrincipal() { return outstandingPrincipal; }
    public void setOutstandingPrincipal(BigDecimal value) { this.outstandingPrincipal = value; }
    public BigDecimal getProvisionRate() { return provisionRate; }
    public void setProvisionRate(BigDecimal value) { this.provisionRate = value; }
    public BigDecimal getRequiredProvision() { return requiredProvision; }
    public void setRequiredProvision(BigDecimal value) { this.requiredProvision = value; }
    public BigDecimal getPreviousProvision() { return previousProvision; }
    public void setPreviousProvision(BigDecimal value) { this.previousProvision = value; }
    public BigDecimal getProvisionChange() { return provisionChange; }
    public void setProvisionChange(BigDecimal value) { this.provisionChange = value; }
    public JournalEntry getJournalEntry() { return journalEntry; }
    public void setJournalEntry(JournalEntry value) { this.journalEntry = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
}
