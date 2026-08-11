package com.kosh.backend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.kosh.backend.model.Network;

@Component
public class SavingsInterestCloseTask implements CloseTask {
    private final SavingsInterestService interest;

    public SavingsInterestCloseTask(SavingsInterestService interest) {
        this.interest = interest;
    }

    @Override
    public boolean supports(CloseService.CloseType type) {
        return type == CloseService.CloseType.DAY_END || type == CloseService.CloseType.MONTH_END;
    }

    @Override
    public void execute(Network network, LocalDate processingDate) {
        interest.accrueNetwork(network, processingDate, "System close");
    }
}
