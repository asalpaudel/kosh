package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.NetworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
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

    // ============================================================================
    // FIXED DEPOSIT
    // ============================================================================
    
    @GetMapping("/fixed-deposits/{networkId}")
    public ResponseEntity<List<FixedDeposit>> getFixedDeposits(@PathVariable Long networkId) {
        List<FixedDeposit> deposits = fixedDepositRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(deposits);
    }

    @PostMapping("/fixed-deposits/{networkId}")
    public ResponseEntity<?> addFixedDeposit(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("minDuration") Integer minDuration,
            @RequestParam("minAmount") Double minAmount,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        try {
            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            FixedDeposit fd = new FixedDeposit();
            fd.setNetwork(network);
            fd.setName(name);
            fd.setInterestRate(interestRate);
            fd.setMinDuration(minDuration);
            fd.setMinAmount(minAmount);
            fd.setDescription(description);

            if (banner != null && !banner.isEmpty()) {
                fd.setBannerData(banner.getBytes());
                fd.setBannerName(banner.getOriginalFilename());
                fd.setBannerType(banner.getContentType());
            }

            return ResponseEntity.ok(fixedDepositRepo.save(fd));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/fixed-deposits/{id}/banner")
    public ResponseEntity<byte[]> getFixedDepositBanner(@PathVariable Long id) {
        return fixedDepositRepo.findById(id)
                .filter(fd -> fd.getBannerData() != null)
                .map(fd -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(fd.getBannerType()));
                    headers.setContentDisposition(ContentDisposition.inline().filename(fd.getBannerName()).build());
                    return new ResponseEntity<>(fd.getBannerData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/fixed-deposits/{id}")
    public ResponseEntity<?> updateFixedDeposit(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("minDuration") Integer minDuration,
            @RequestParam("minAmount") Double minAmount,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        
        return fixedDepositRepo.findById(id)
                .map(fd -> {
                    try {
                        fd.setName(name);
                        fd.setInterestRate(interestRate);
                        fd.setMinDuration(minDuration);
                        fd.setMinAmount(minAmount);
                        fd.setDescription(description);
                        
                        if (banner != null && !banner.isEmpty()) {
                            fd.setBannerData(banner.getBytes());
                            fd.setBannerName(banner.getOriginalFilename());
                            fd.setBannerType(banner.getContentType());
                        }
                        
                        return ResponseEntity.ok((Object) fixedDepositRepo.save(fd));
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body((Object) ("Error: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Fixed Deposit not found"));
    }

    @DeleteMapping("/fixed-deposits/{id}")
    public ResponseEntity<Void> deleteFixedDeposit(@PathVariable Long id) {
        fixedDepositRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ============================================================================
    // SAVING ACCOUNT
    // ============================================================================
    
    @GetMapping("/saving-accounts/{networkId}")
    public ResponseEntity<List<SavingAccount>> getSavingAccounts(@PathVariable Long networkId) {
        List<SavingAccount> accounts = savingAccountRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/saving-accounts/{networkId}")
    public ResponseEntity<?> addSavingAccount(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("minBalance") Double minBalance,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        try {
            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            SavingAccount sa = new SavingAccount();
            sa.setNetwork(network);
            sa.setName(name);
            sa.setInterestRate(interestRate);
            sa.setMinBalance(minBalance);
            sa.setDescription(description);

            if (banner != null && !banner.isEmpty()) {
                sa.setBannerData(banner.getBytes());
                sa.setBannerName(banner.getOriginalFilename());
                sa.setBannerType(banner.getContentType());
            }

            return ResponseEntity.ok(savingAccountRepo.save(sa));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/saving-accounts/{id}/banner")
    public ResponseEntity<byte[]> getSavingAccountBanner(@PathVariable Long id) {
        return savingAccountRepo.findById(id)
                .filter(sa -> sa.getBannerData() != null)
                .map(sa -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(sa.getBannerType()));
                    headers.setContentDisposition(ContentDisposition.inline().filename(sa.getBannerName()).build());
                    return new ResponseEntity<>(sa.getBannerData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/saving-accounts/{id}")
    public ResponseEntity<?> updateSavingAccount(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("minBalance") Double minBalance,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        
        return savingAccountRepo.findById(id)
                .map(sa -> {
                    try {
                        sa.setName(name);
                        sa.setInterestRate(interestRate);
                        sa.setMinBalance(minBalance);
                        sa.setDescription(description);
                        
                        if (banner != null && !banner.isEmpty()) {
                            sa.setBannerData(banner.getBytes());
                            sa.setBannerName(banner.getOriginalFilename());
                            sa.setBannerType(banner.getContentType());
                        }
                        
                        return ResponseEntity.ok((Object) savingAccountRepo.save(sa));
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body((Object) ("Error: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Saving Account not found"));
    }

    @DeleteMapping("/saving-accounts/{id}")
    public ResponseEntity<Void> deleteSavingAccount(@PathVariable Long id) {
        savingAccountRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ============================================================================
    // LOAN PACKAGE
    // ============================================================================
    
    @GetMapping("/loan-packages/{networkId}")
    public ResponseEntity<List<LoanPackage>> getLoanPackages(@PathVariable Long networkId) {
        List<LoanPackage> packages = loanPackageRepo.findByNetworkId(networkId);
        return ResponseEntity.ok(packages);
    }

    @PostMapping("/loan-packages/{networkId}")
    public ResponseEntity<?> addLoanPackage(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("maxAmount") Double maxAmount,
            @RequestParam("maxDuration") Integer maxDuration,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        try {
            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            LoanPackage lp = new LoanPackage();
            lp.setNetwork(network);
            lp.setName(name);
            lp.setInterestRate(interestRate);
            lp.setMaxAmount(maxAmount);
            lp.setMaxDuration(maxDuration);
            lp.setDescription(description);

            if (banner != null && !banner.isEmpty()) {
                lp.setBannerData(banner.getBytes());
                lp.setBannerName(banner.getOriginalFilename());
                lp.setBannerType(banner.getContentType());
            }

            return ResponseEntity.ok(loanPackageRepo.save(lp));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/loan-packages/{id}/banner")
    public ResponseEntity<byte[]> getLoanPackageBanner(@PathVariable Long id) {
        return loanPackageRepo.findById(id)
                .filter(lp -> lp.getBannerData() != null)
                .map(lp -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(lp.getBannerType()));
                    headers.setContentDisposition(ContentDisposition.inline().filename(lp.getBannerName()).build());
                    return new ResponseEntity<>(lp.getBannerData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/loan-packages/{id}")
    public ResponseEntity<?> updateLoanPackage(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") Double interestRate,
            @RequestParam("maxAmount") Double maxAmount,
            @RequestParam("maxDuration") Integer maxDuration,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        
        return loanPackageRepo.findById(id)
                .map(lp -> {
                    try {
                        lp.setName(name);
                        lp.setInterestRate(interestRate);
                        lp.setMaxAmount(maxAmount);
                        lp.setMaxDuration(maxDuration);
                        lp.setDescription(description);
                        
                        if (banner != null && !banner.isEmpty()) {
                            lp.setBannerData(banner.getBytes());
                            lp.setBannerName(banner.getOriginalFilename());
                            lp.setBannerType(banner.getContentType());
                        }
                        
                        return ResponseEntity.ok((Object) loanPackageRepo.save(lp));
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body((Object) ("Error: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Loan Package not found"));
    }

    @DeleteMapping("/loan-packages/{id}")
    public ResponseEntity<Void> deleteLoanPackage(@PathVariable Long id) {
        loanPackageRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}