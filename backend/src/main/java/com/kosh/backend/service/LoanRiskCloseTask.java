package com.kosh.backend.service;

import java.time.LocalDate;
import org.springframework.stereotype.Component;
import com.kosh.backend.model.Network;

@Component
public class LoanRiskCloseTask implements CloseTask {
    private final LoanRiskService risk;
    public LoanRiskCloseTask(LoanRiskService risk) { this.risk = risk; }
    @Override public boolean supports(CloseService.CloseType type) { return true; }
    @Override public void execute(Network network, LocalDate processingDate) {
        risk.classifyNetwork(network, processingDate, "System close");
    }
}
