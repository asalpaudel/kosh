package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.NetworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FixedDepositRepository fixedDepositRepo;

    @Autowired
    private SavingAccountRepository savingAccountRepo;

    @Autowired
    private LoanPackageRepository loanPackageRepo;

    @Autowired
    private NetworkRepository networkRepo;

    // --- FIXED DEPOSIT ---
    @GetMapping("/fixed-deposits/{networkId}")
    public List<FixedDeposit> getFixedDeposits(@PathVariable Long networkId) {
        return fixedDepositRepo.findByNetworkId(networkId);
    }

    @PostMapping("/fixed-deposits/{networkId}")
    public ResponseEntity<?> addFixedDeposit(@PathVariable Long networkId, @RequestBody FixedDeposit fd) {
        try {
            System.out.println("=== POST /fixed-deposits/" + networkId + " ===");
            System.out.println("Received data: " + fd);
            System.out.println("Name: " + fd.getName());
            System.out.println("Interest Rate: " + fd.getInterestRate());
            System.out.println("Min Duration: " + fd.getMinDuration());
            System.out.println("Min Amount: " + fd.getMinAmount());

            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> {
                        System.out.println("ERROR: Network not found with ID: " + networkId);
                        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found");
                    });

            System.out.println("Found network: " + network.getName());
            fd.setNetwork(network);

            FixedDeposit saved = fixedDepositRepo.save(fd);
            System.out.println("SUCCESS: Saved Fixed Deposit with ID: " + saved.getId());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addFixedDeposit: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
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

    @PostMapping("/saving-accounts/{networkId}")
    public ResponseEntity<?> addSavingAccount(@PathVariable Long networkId, @RequestBody SavingAccount sa) {
        try {
            System.out.println("=== POST /saving-accounts/" + networkId + " ===");
            System.out.println("Received data: " + sa.getName());

            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            sa.setNetwork(network);
            SavingAccount saved = savingAccountRepo.save(sa);
            System.out.println("SUCCESS: Saved Saving Account with ID: " + saved.getId());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addSavingAccount: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
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

    @PostMapping("/loan-packages/{networkId}")
    public ResponseEntity<?> addLoanPackage(@PathVariable Long networkId, @RequestBody LoanPackage lp) {
        try {
            System.out.println("=== POST /loan-packages/" + networkId + " ===");
            System.out.println("Received data: " + lp.getName());

            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            lp.setNetwork(network);
            LoanPackage saved = loanPackageRepo.save(lp);
            System.out.println("SUCCESS: Saved Loan Package with ID: " + saved.getId());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addLoanPackage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/loan-packages/{id}")
    public void deleteLoanPackage(@PathVariable Long id) {
        loanPackageRepo.deleteById(id);
    }
}