package com.kosh.backend.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * One side of a journal entry: an amount on exactly one of the debit or credit columns.
 *
 * <p>{@code member} is set on lines that belong to a member's own savings, deposit or loan
 * position, which is what lets a member statement be derived from the ledger instead of
 * kept alongside it.
 */
@Entity
@Table(name = "journal_lines")
public class JournalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    @JsonIgnore
    private JournalEntry entry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    @JsonIgnore
    private User member;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(name = "line_memo", length = 500)
    private String lineMemo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public JournalEntry getEntry() { return entry; }
    public void setEntry(JournalEntry entry) { this.entry = entry; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }

    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit; }

    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit; }

    public String getLineMemo() { return lineMemo; }
    public void setLineMemo(String lineMemo) { this.lineMemo = lineMemo; }
}
