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
@Table(name = "savings_interest_accruals")
public class SavingsInterestAccrual {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    @ManyToOne(optional = false) @JoinColumn(name = "saving_account_id") private SavingAccount savingAccount;
    @ManyToOne(optional = false) @JoinColumn(name = "member_id") private User member;
    private LocalDate accrualDate;
    private String interestBasis;
    private String capitalizationFrequency;
    private String dayCountConvention;
    private LocalDate capitalizationPeriodStart;
    @Column(precision = 18, scale = 2) private BigDecimal basisAmount;
    @Column(precision = 7, scale = 4) private BigDecimal annualRate;
    @Column(precision = 18, scale = 2) private BigDecimal accruedAmount;
    @ManyToOne @JoinColumn(name = "journal_entry_id") private JournalEntry journalEntry;
    private Instant createdAt;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public SavingAccount getSavingAccount() { return savingAccount; }
    public void setSavingAccount(SavingAccount savingAccount) { this.savingAccount = savingAccount; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public LocalDate getAccrualDate() { return accrualDate; }
    public void setAccrualDate(LocalDate accrualDate) { this.accrualDate = accrualDate; }
    public String getInterestBasis() { return interestBasis; }
    public void setInterestBasis(String interestBasis) { this.interestBasis = interestBasis; }
    public String getCapitalizationFrequency() { return capitalizationFrequency; }
    public void setCapitalizationFrequency(String capitalizationFrequency) { this.capitalizationFrequency = capitalizationFrequency; }
    public String getDayCountConvention() { return dayCountConvention; }
    public void setDayCountConvention(String dayCountConvention) { this.dayCountConvention = dayCountConvention; }
    public LocalDate getCapitalizationPeriodStart() { return capitalizationPeriodStart; }
    public void setCapitalizationPeriodStart(LocalDate capitalizationPeriodStart) { this.capitalizationPeriodStart = capitalizationPeriodStart; }
    public BigDecimal getBasisAmount() { return basisAmount; }
    public void setBasisAmount(BigDecimal basisAmount) { this.basisAmount = basisAmount; }
    public BigDecimal getAnnualRate() { return annualRate; }
    public void setAnnualRate(BigDecimal annualRate) { this.annualRate = annualRate; }
    public BigDecimal getAccruedAmount() { return accruedAmount; }
    public void setAccruedAmount(BigDecimal accruedAmount) { this.accruedAmount = accruedAmount; }
    public JournalEntry getJournalEntry() { return journalEntry; }
    public void setJournalEntry(JournalEntry journalEntry) { this.journalEntry = journalEntry; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
