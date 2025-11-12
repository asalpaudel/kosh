package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FixedDepositRepository fixedDepositRepo;

    @Autowired
    private SavingAccountRepository savingAccountRepo;

    @Autowired
    private LoanPackageRepository loanPackageRepo;

    // --- FIXED DEPOSIT ---
    @GetMapping("/fixed-deposits/{networkId}")
    public List<FixedDeposit> getFixedDeposits(@PathVariable Long networkId) {
        return fixedDepositRepo.findByNetworkId(networkId);
    }

    @PostMapping("/fixed-deposits")
    public FixedDeposit addFixedDeposit(@RequestBody FixedDeposit fd) {
        return fixedDepositRepo.save(fd);
    }

    @DeleteMapping("/fixed-deposits/{id}")
    public void deleteFixedDeposit(@PathVariable Long id) {
        fixedDepositRepo.deleteById(id);
    }

    // --- SAVING ACCOUNT ---
    @GetMapping("/saving-accounts/{networkId}")
    public List<SavingAccount> getSavingAccounts(@PathVariable Long networkId) {
        return savingAccountRepo.findByNetworkId(networkId);
    }

    @PostMapping("/saving-accounts")
    public SavingAccount addSavingAccount(@RequestBody SavingAccount sa) {
        return savingAccountRepo.save(sa);
    }

    @DeleteMapping("/saving-accounts/{id}")
    public void deleteSavingAccount(@PathVariable Long id) {
        savingAccountRepo.deleteById(id);
    }

    // --- LOAN PACKAGE ---
    @GetMapping("/loan-packages/{networkId}")
    public List<LoanPackage> getLoanPackages(@PathVariable Long networkId) {
        return loanPackageRepo.findByNetworkId(networkId);
    }

    @PostMapping("/loan-packages")
    public LoanPackage addLoanPackage(@RequestBody LoanPackage lp) {
        return loanPackageRepo.save(lp);
    }

    @DeleteMapping("/loan-packages/{id}")
    public void deleteLoanPackage(@PathVariable Long id) {
        loanPackageRepo.deleteById(id);
    }
}
