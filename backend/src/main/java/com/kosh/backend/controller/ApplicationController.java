package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private FixedDepositApplicationRepository fdAppRepo;

    @Autowired
    private SavingAccountApplicationRepository saAppRepo;

    @Autowired
    private LoanApplicationRepository loanAppRepo;

    @Autowired
    private FixedDepositRepository fixedDepositRepo;

    @Autowired
    private SavingAccountRepository savingAccountRepo;

    @Autowired
    private LoanPackageRepository loanPackageRepo;

    @Autowired
    private NetworkRepository networkRepo;

    @Autowired
    private UserRepository userRepo;

    // ===== FIXED DEPOSIT APPLICATIONS =====
    
    @PostMapping("/fixed-deposit")
    public ResponseEntity<?> applyForFixedDeposit(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            Double depositAmount = Double.valueOf(request.get("depositAmount").toString());
            Integer depositTerm = Integer.valueOf(request.get("depositTerm").toString());

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            FixedDeposit fixedDeposit = fixedDepositRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            // Validate amounts
            if (depositAmount < fixedDeposit.getMinAmount()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit amount below minimum required"));
            }
            if (depositTerm < fixedDeposit.getMinDuration()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit term below minimum duration"));
            }

            FixedDepositApplication application = new FixedDepositApplication();
            application.setUser(user);
            application.setFixedDeposit(fixedDeposit);
            application.setNetwork(network);
            application.setDepositAmount(depositAmount);
            application.setDepositTerm(depositTerm);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            FixedDepositApplication saved = fdAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/fixed-deposit/user")
    public ResponseEntity<?> getUserFixedDepositApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(fdAppRepo.findByUserId(userId));
    }

    @GetMapping("/fixed-deposit/network/{networkId}")
    public ResponseEntity<List<FixedDepositApplication>> getNetworkFixedDepositApplications(
            @PathVariable Long networkId) {
        return ResponseEntity.ok(fdAppRepo.findByNetworkId(networkId));
    }

    @PutMapping("/fixed-deposit/{id}/review")
    public ResponseEntity<?> reviewFixedDepositApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            FixedDepositApplication application = fdAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            application.setStatus(status);
            application.setReviewDate(LocalDateTime.now());
            application.setReviewedBy(admin);
            application.setReviewNotes(notes);

            return ResponseEntity.ok(fdAppRepo.save(application));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ===== SAVING ACCOUNT APPLICATIONS =====
    
    @PostMapping("/saving-account")
    public ResponseEntity<?> applyForSavingAccount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            Double initialDeposit = Double.valueOf(request.get("initialDeposit").toString());

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            SavingAccount savingAccount = savingAccountRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (initialDeposit < savingAccount.getMinBalance()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Initial deposit below minimum balance"));
            }

            SavingAccountApplication application = new SavingAccountApplication();
            application.setUser(user);
            application.setSavingAccount(savingAccount);
            application.setNetwork(network);
            application.setInitialDeposit(initialDeposit);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            SavingAccountApplication saved = saAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/saving-account/user")
    public ResponseEntity<?> getUserSavingAccountApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(saAppRepo.findByUserId(userId));
    }

    @GetMapping("/saving-account/network/{networkId}")
    public ResponseEntity<List<SavingAccountApplication>> getNetworkSavingAccountApplications(
            @PathVariable Long networkId) {
        return ResponseEntity.ok(saAppRepo.findByNetworkId(networkId));
    }

    @PutMapping("/saving-account/{id}/review")
    public ResponseEntity<?> reviewSavingAccountApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            SavingAccountApplication application = saAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            application.setStatus(status);
            application.setReviewDate(LocalDateTime.now());
            application.setReviewedBy(admin);
            application.setReviewNotes(notes);

            return ResponseEntity.ok(saAppRepo.save(application));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ===== LOAN APPLICATIONS =====
    
    @PostMapping("/loan")
    public ResponseEntity<?> applyForLoan(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            Double requestedAmount = Double.valueOf(request.get("requestedAmount").toString());
            String purpose = request.get("purpose").toString();

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            LoanPackage loanPackage = loanPackageRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (requestedAmount > loanPackage.getMaxAmount()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Requested amount exceeds maximum"));
            }

            LoanApplication application = new LoanApplication();
            application.setUser(user);
            application.setLoanPackage(loanPackage);
            application.setNetwork(network);
            application.setRequestedAmount(requestedAmount);
            application.setPurpose(purpose);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            LoanApplication saved = loanAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/loan/user")
    public ResponseEntity<?> getUserLoanApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(loanAppRepo.findByUserId(userId));
    }

    @GetMapping("/loan/network/{networkId}")
    public ResponseEntity<List<LoanApplication>> getNetworkLoanApplications(
            @PathVariable Long networkId) {
        return ResponseEntity.ok(loanAppRepo.findByNetworkId(networkId));
    }

    @PutMapping("/loan/{id}/review")
    public ResponseEntity<?> reviewLoanApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            LoanApplication application = loanAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            application.setStatus(status);
            application.setReviewDate(LocalDateTime.now());
            application.setReviewedBy(admin);
            application.setReviewNotes(notes);

            return ResponseEntity.ok(loanAppRepo.save(application));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}