package com.kosh.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.repository.RepaymentScheduleRepository;

@Service
public class LoanService {

    private final RepaymentScheduleRepository scheduleRepo;

    public LoanService(RepaymentScheduleRepository scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }

    public void generateRepaymentSchedule(LoanApplication loan) {
        double principal = loan.getApprovedAmount();
        double annualRate = loan.getInterestRate(); // e.g., 12.0 for 12%
        int months = loan.getDurationInMonths();
        LocalDate startDate = loan.getStartDate();

        
        
        double monthlyRate = annualRate / 12.0 / 100.0;
        double emi;
        
        if (monthlyRate == 0) {
            emi = principal / months;
        } else {
            emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
        }

        double outstandingBalance = principal;
        List<RepaymentSchedule> schedules = new ArrayList<>();

        for (int i = 1; i <= months; i++) {
            double interestPart = outstandingBalance * monthlyRate;
            double principalPart = emi - interestPart;

            // Handle last installment rounding
            if (i == months) {
                principalPart = outstandingBalance;
                emi = principalPart + interestPart;
            }

            outstandingBalance -= principalPart;

            RepaymentSchedule schedule = new RepaymentSchedule();
            schedule.setLoanApplication(loan);
            schedule.setInstallmentNumber(i);
            schedule.setDueDate(startDate.plusMonths(i));
            schedule.setPrincipalAmount(Math.round(principalPart * 100.0) / 100.0);
            schedule.setInterestAmount(Math.round(interestPart * 100.0) / 100.0);
            schedule.setTotalDue(Math.round(emi * 100.0) / 100.0);
            schedule.setStatus("PENDING");

            schedules.add(schedule);
        }

        scheduleRepo.saveAll(schedules);
        
        // Update loan with next payment date
        if (!schedules.isEmpty()) {
            loan.setNextPaymentDate(schedules.get(0).getDueDate());
        }
    }
}