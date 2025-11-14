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
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" }, allowCredentials = "true")
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
    public ResponseEntity<List<FixedDeposit>> getFixedDeposits(@PathVariable Long networkId) {
        List<FixedDeposit> deposits = fixedDepositRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(deposits);
    }

    @PostMapping(value = "/fixed-deposits/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addFixedDeposit(@PathVariable Long networkId, @RequestBody FixedDeposit fd) {
        try {
            System.out.println("=== POST /fixed-deposits/" + networkId + " ===");
            System.out.println("Received data: " + fd);

            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            fd.setNetwork(network);
            FixedDeposit saved = fixedDepositRepo.save(fd);
            System.out.println("SUCCESS: Saved Fixed Deposit with ID: " + saved.getId());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addFixedDeposit: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/fixed-deposits/{id}")
    public ResponseEntity<?> updateFixedDeposit(@PathVariable Long id, @RequestBody FixedDeposit updatedFD) {
        return fixedDepositRepo.findById(id)
                .map(existingFD -> {
                    existingFD.setName(updatedFD.getName());
                    existingFD.setInterestRate(updatedFD.getInterestRate());
                    existingFD.setMinDuration(updatedFD.getMinDuration());
                    existingFD.setMinAmount(updatedFD.getMinAmount());
                    existingFD.setDescription(updatedFD.getDescription());
                    FixedDeposit saved = fixedDepositRepo.save(existingFD);
                    System.out.println("UPDATED Fixed Deposit ID: " + id);
                    return ResponseEntity.ok((Object) saved);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body((Object) "Fixed Deposit not found"));
    }

    @DeleteMapping("/fixed-deposits/{id}")
    public ResponseEntity<Void> deleteFixedDeposit(@PathVariable Long id) {
        fixedDepositRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- SAVING ACCOUNT ---
    @GetMapping("/saving-accounts/{networkId}")
    public ResponseEntity<List<SavingAccount>> getSavingAccounts(@PathVariable Long networkId) {
        List<SavingAccount> accounts = savingAccountRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(accounts);
    }

    @PostMapping(value = "/saving-accounts/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addSavingAccount(@PathVariable Long networkId, @RequestBody SavingAccount sa) {
        try {
            System.out.println("=== POST /saving-accounts/" + networkId + " ===");
            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            sa.setNetwork(network);
            SavingAccount saved = savingAccountRepo.save(sa);
            System.out.println("SUCCESS: Saved Saving Account with ID: " + saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addSavingAccount: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/saving-accounts/{id}")
    public ResponseEntity<?> updateSavingAccount(@PathVariable Long id, @RequestBody SavingAccount updatedSA) {
        return savingAccountRepo.findById(id)
                .map(existingSA -> {
                    existingSA.setName(updatedSA.getName());
                    existingSA.setInterestRate(updatedSA.getInterestRate());
                    existingSA.setMinBalance(updatedSA.getMinBalance());
                    existingSA.setDescription(updatedSA.getDescription());
                    SavingAccount saved = savingAccountRepo.save(existingSA);
                    System.out.println("UPDATED Saving Account ID: " + id);
                    return ResponseEntity.ok((Object) saved);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body((Object) "Saving Account not found"));
    }

    @DeleteMapping("/saving-accounts/{id}")
    public ResponseEntity<Void> deleteSavingAccount(@PathVariable Long id) {
        savingAccountRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- LOAN PACKAGE ---
    @GetMapping("/loan-packages/{networkId}")
    public ResponseEntity<List<LoanPackage>> getLoanPackages(@PathVariable Long networkId) {
        List<LoanPackage> packages = loanPackageRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(packages);
    }

    @PostMapping(value = "/loan-packages/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addLoanPackage(@PathVariable Long networkId, @RequestBody LoanPackage lp) {
        try {
            System.out.println("=== POST /loan-packages/" + networkId + " ===");
            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            lp.setNetwork(network);
            LoanPackage saved = loanPackageRepo.save(lp);
            System.out.println("SUCCESS: Saved Loan Package with ID: " + saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("ERROR in addLoanPackage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/loan-packages/{id}")
    public ResponseEntity<?> updateLoanPackage(@PathVariable Long id, @RequestBody LoanPackage updatedLP) {
        return loanPackageRepo.findById(id)
                .map(existingLP -> {
                    existingLP.setName(updatedLP.getName());
                    existingLP.setInterestRate(updatedLP.getInterestRate());
                    existingLP.setMaxAmount(updatedLP.getMaxAmount());
                    existingLP.setMaxDuration(updatedLP.getMaxDuration());
                    existingLP.setDescription(updatedLP.getDescription());
                    LoanPackage saved = loanPackageRepo.save(existingLP);
                    System.out.println("UPDATED Loan Package ID: " + id);
                    return ResponseEntity.ok((Object) saved);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body((Object) "Loan Package not found"));
    }

    @DeleteMapping("/loan-packages/{id}")
    public ResponseEntity<Void> deleteLoanPackage(@PathVariable Long id) {
        loanPackageRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}