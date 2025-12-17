package com.kosh.backend.model;

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

    private Double principalAmount; // The part of EMI that pays off the loan
    private Double interestAmount;  // The part of EMI that is profit for network
    private Double totalDue;        // principal + interest

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

    public Double getPrincipalAmount() { return principalAmount; }
    public void setPrincipalAmount(Double principalAmount) { this.principalAmount = principalAmount; }

    public Double getInterestAmount() { return interestAmount; }
    public void setInterestAmount(Double interestAmount) { this.interestAmount = interestAmount; }

    public Double getTotalDue() { return totalDue; }
    public void setTotalDue(Double totalDue) { this.totalDue = totalDue; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
}