package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.util.SessionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpSession;
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
    public ResponseEntity<List<FixedDeposit>> getFixedDeposits(
            @PathVariable Long networkId,
            HttpSession session) {
        
        // Verify admin can only access their own sahakari's packages
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        if (!networkId.equals(sessionSahakariId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this network data");
        }
        
        List<FixedDeposit> deposits = fixedDepositRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(deposits);
    }

    @PostMapping(value = "/fixed-deposits/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addFixedDeposit(
            @PathVariable Long networkId, 
            @RequestBody FixedDeposit fd,
            HttpSession session) {
        try {
            System.out.println("=== POST /fixed-deposits/" + networkId + " ===");
            System.out.println("Received data: " + fd);

            // Verify admin can only create packages for their sahakari
            Long sessionSahakariId = SessionUtil.getSahakariId(session);
            
            if (!networkId.equals(sessionSahakariId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Cannot create package for another network");
            }

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
    public ResponseEntity<?> updateFixedDeposit(
            @PathVariable Long id, 
            @RequestBody FixedDeposit updatedFD,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        return fixedDepositRepo.findById(id)
                .map(existingFD -> {
                    // Verify ownership
                    if (!existingFD.getNetwork().getId().equals(sessionSahakariId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body((Object) "Cannot update package from another network");
                    }
                    
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
    public ResponseEntity<?> deleteFixedDeposit(
            @PathVariable Long id,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        FixedDeposit fd = fixedDepositRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
        
        // Verify ownership
        if (!fd.getNetwork().getId().equals(sessionSahakariId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Cannot delete package from another network");
        }
        
        fixedDepositRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- SAVING ACCOUNT ---
    @GetMapping("/saving-accounts/{networkId}")
    public ResponseEntity<List<SavingAccount>> getSavingAccounts(
            @PathVariable Long networkId,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        if (!networkId.equals(sessionSahakariId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this network data");
        }
        
        List<SavingAccount> accounts = savingAccountRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(accounts);
    }

    @PostMapping(value = "/saving-accounts/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addSavingAccount(
            @PathVariable Long networkId, 
            @RequestBody SavingAccount sa,
            HttpSession session) {
        try {
            System.out.println("=== POST /saving-accounts/" + networkId + " ===");
            
            Long sessionSahakariId = SessionUtil.getSahakariId(session);
            
            if (!networkId.equals(sessionSahakariId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Cannot create package for another network");
            }
            
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
    public ResponseEntity<?> updateSavingAccount(
            @PathVariable Long id, 
            @RequestBody SavingAccount updatedSA,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        return savingAccountRepo.findById(id)
                .map(existingSA -> {
                    if (!existingSA.getNetwork().getId().equals(sessionSahakariId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body((Object) "Cannot update package from another network");
                    }
                    
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
    public ResponseEntity<?> deleteSavingAccount(
            @PathVariable Long id,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        SavingAccount sa = savingAccountRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
        
        if (!sa.getNetwork().getId().equals(sessionSahakariId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Cannot delete package from another network");
        }
        
        savingAccountRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- LOAN PACKAGE ---
    @GetMapping("/loan-packages/{networkId}")
    public ResponseEntity<List<LoanPackage>> getLoanPackages(
            @PathVariable Long networkId,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        if (!networkId.equals(sessionSahakariId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this network data");
        }
        
        List<LoanPackage> packages = loanPackageRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(packages);
    }

    @PostMapping(value = "/loan-packages/{networkId}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> addLoanPackage(
            @PathVariable Long networkId, 
            @RequestBody LoanPackage lp,
            HttpSession session) {
        try {
            System.out.println("=== POST /loan-packages/" + networkId + " ===");
            
            Long sessionSahakariId = SessionUtil.getSahakariId(session);
            
            if (!networkId.equals(sessionSahakariId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Cannot create package for another network");
            }
            
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
    public ResponseEntity<?> updateLoanPackage(
            @PathVariable Long id, 
            @RequestBody LoanPackage updatedLP,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        return loanPackageRepo.findById(id)
                .map(existingLP -> {
                    if (!existingLP.getNetwork().getId().equals(sessionSahakariId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body((Object) "Cannot update package from another network");
                    }
                    
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
    public ResponseEntity<?> deleteLoanPackage(
            @PathVariable Long id,
            HttpSession session) {
        
        Long sessionSahakariId = SessionUtil.getSahakariId(session);
        
        LoanPackage lp = loanPackageRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
        
        if (!lp.getNetwork().getId().equals(sessionSahakariId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Cannot delete package from another network");
        }
        
        loanPackageRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}