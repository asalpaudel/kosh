package com.kosh.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "repayment_schedules")
public class RepaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;

    private Integer installmentNumber;
    private LocalDate dueDate;

    @Column(precision = 18, scale = 2)
    private BigDecimal principalAmount; // The part of EMI that pays off the loan
    @Column(precision = 18, scale = 2)
    private BigDecimal interestAmount;  // The part of EMI that is profit for network
    @Column(precision = 18, scale = 2)
    private BigDecimal totalDue;        // principal + interest

    @Column(name = "interest_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal interestPaid = BigDecimal.ZERO;

    @Column(name = "principal_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalPaid = BigDecimal.ZERO;

    private String status = "PENDING"; // PENDING, PAID, PARTIAL, OVERDUE
    private LocalDate paidDate;
    
    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LoanApplication getLoanApplication() { return loanApplication; }
    public void setLoanApplication(LoanApplication loanApplication) { this.loanApplication = loanApplication; }

    public Integer getInstallmentNumber() { return installmentNumber; }
    public void setInstallmentNumber(Integer installmentNumber) { this.installmentNumber = installmentNumber; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getPrincipalAmount() { return principalAmount; }
    public void setPrincipalAmount(BigDecimal principalAmount) { this.principalAmount = principalAmount; }

    public BigDecimal getInterestAmount() { return interestAmount; }
    public void setInterestAmount(BigDecimal interestAmount) { this.interestAmount = interestAmount; }

    public BigDecimal getTotalDue() { return totalDue; }
    public void setTotalDue(BigDecimal totalDue) { this.totalDue = totalDue; }

    public BigDecimal getInterestPaid() { return interestPaid != null ? interestPaid : BigDecimal.ZERO; }
    public void setInterestPaid(BigDecimal interestPaid) { this.interestPaid = interestPaid; }

    public BigDecimal getPrincipalPaid() { return principalPaid != null ? principalPaid : BigDecimal.ZERO; }
    public void setPrincipalPaid(BigDecimal principalPaid) { this.principalPaid = principalPaid; }

    /** What is still owed on this installment, interest and principal together. */
    public BigDecimal outstanding() {
        return getInterestAmount().subtract(getInterestPaid())
                .add(getPrincipalAmount().subtract(getPrincipalPaid()));
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
}