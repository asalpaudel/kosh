package com.kosh.backend.controller;

import com.kosh.backend.model.*;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.FileSecurity;
import com.kosh.backend.service.FileSecurity.StoredFile;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FixedDepositRepository fixedDepositRepo;
    private final SavingAccountRepository savingAccountRepo;
    private final LoanPackageRepository loanPackageRepo;
    private final NetworkRepository networkRepo;
    private final NetworkAccessService access;

    public FinanceController(FixedDepositRepository fixedDepositRepo,
                             SavingAccountRepository savingAccountRepo,
                             LoanPackageRepository loanPackageRepo,
                             NetworkRepository networkRepo,
                             NetworkAccessService access) {
        this.fixedDepositRepo = fixedDepositRepo;
        this.savingAccountRepo = savingAccountRepo;
        this.loanPackageRepo = loanPackageRepo;
        this.networkRepo = networkRepo;
        this.access = access;
    }

    private ResponseEntity<Object> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not permitted for this cooperative");
    }

    private ResponseEntity<Object> notFound(String what) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(what + " not found");
    }

    // ============================================================================
    // FIXED DEPOSIT
    // ============================================================================

    @GetMapping("/fixed-deposits/{networkId}")
    public ResponseEntity<Object> getFixedDeposits(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(fixedDepositRepo.findByNetworkId(networkId));
    }

    @PostMapping("/fixed-deposits/{networkId}")
    public ResponseEntity<Object> addFixedDeposit(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("minDuration") Integer minDuration,
            @RequestParam("minAmount") BigDecimal minAmount,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        try {
            Network network = networkRepo.findById(networkId).orElse(null);
            if (network == null) return notFound("Network");

            FixedDeposit fd = new FixedDeposit();
            fd.setNetwork(network);
            fd.setName(name);
            fd.setInterestRate(interestRate);
            fd.setMinDuration(minDuration);
            fd.setMinAmount(minAmount);
            fd.setDescription(description);
            applyBanner(fd::setBannerData, fd::setBannerName, fd::setBannerType, banner);

            return ResponseEntity.ok(fixedDepositRepo.save(fd));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to create financial product");
        }
    }

    @GetMapping("/fixed-deposits/{id}/banner")
    public ResponseEntity<byte[]> getFixedDepositBanner(@PathVariable Long id, HttpSession session) {
        FixedDeposit fd = fixedDepositRepo.findById(id).orElse(null);
        if (fd == null || fd.getBannerData() == null) return ResponseEntity.notFound().build();
        if (access.isForeign(fd.getNetwork(), session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return bannerResponse(fd.getBannerData(), fd.getBannerName());
    }

    @PutMapping(value = "/fixed-deposits/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateFixedDeposit(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("minDuration") Integer minDuration,
            @RequestParam("minAmount") BigDecimal minAmount,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "removeBanner", required = false, defaultValue = "false") Boolean removeBanner,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {

        FixedDeposit fd = fixedDepositRepo.findById(id).orElse(null);
        if (fd == null) return notFound("Fixed Deposit");
        if (access.isForeign(fd.getNetwork(), session)) return forbidden();

        try {
            fd.setName(name);
            fd.setInterestRate(interestRate);
            fd.setMinDuration(minDuration);
            fd.setMinAmount(minAmount);
            fd.setDescription(description);
            if (Boolean.TRUE.equals(removeBanner)) {
                fd.setBannerData(null);
                fd.setBannerName(null);
                fd.setBannerType(null);
            } else {
                applyBanner(fd::setBannerData, fd::setBannerName, fd::setBannerType, banner);
            }
            return ResponseEntity.ok(fixedDepositRepo.save(fd));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to update financial product");
        }
    }

    @DeleteMapping("/fixed-deposits/{id}")
    public ResponseEntity<Object> deleteFixedDeposit(@PathVariable Long id, HttpSession session) {
        FixedDeposit fd = fixedDepositRepo.findById(id).orElse(null);
        if (fd == null) return notFound("Fixed Deposit");
        if (access.isForeign(fd.getNetwork(), session)) return forbidden();
        fixedDepositRepo.delete(fd);
        return ResponseEntity.ok().build();
    }

    // ============================================================================
    // SAVING ACCOUNT
    // ============================================================================

    @GetMapping("/saving-accounts/{networkId}")
    public ResponseEntity<Object> getSavingAccounts(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(savingAccountRepo.findByNetworkId(networkId));
    }

    @PostMapping("/saving-accounts/{networkId}")
    public ResponseEntity<Object> addSavingAccount(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("minBalance") BigDecimal minBalance,
            @RequestParam(value = "interestBasis", required = false, defaultValue = "DAILY_PRODUCT") String interestBasis,
            @RequestParam(value = "capitalizationFrequency", required = false, defaultValue = "MONTHLY") String capitalizationFrequency,
            @RequestParam(value = "dayCountConvention", required = false, defaultValue = "ACTUAL_365") String dayCountConvention,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        try {
            Network network = networkRepo.findById(networkId).orElse(null);
            if (network == null) return notFound("Network");

            SavingAccount sa = new SavingAccount();
            sa.setNetwork(network);
            sa.setName(name);
            sa.setInterestRate(interestRate);
            sa.setMinBalance(minBalance);
            applyInterestConfiguration(sa, interestBasis, capitalizationFrequency, dayCountConvention);
            sa.setDescription(description);
            applyBanner(sa::setBannerData, sa::setBannerName, sa::setBannerType, banner);

            return ResponseEntity.ok(savingAccountRepo.save(sa));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to create financial product");
        }
    }

    @GetMapping("/saving-accounts/{id}/banner")
    public ResponseEntity<byte[]> getSavingAccountBanner(@PathVariable Long id, HttpSession session) {
        SavingAccount sa = savingAccountRepo.findById(id).orElse(null);
        if (sa == null || sa.getBannerData() == null) return ResponseEntity.notFound().build();
        if (access.isForeign(sa.getNetwork(), session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return bannerResponse(sa.getBannerData(), sa.getBannerName());
    }

    @PutMapping(value = "/saving-accounts/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateSavingAccount(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("minBalance") BigDecimal minBalance,
            @RequestParam(value = "interestBasis", required = false) String interestBasis,
            @RequestParam(value = "capitalizationFrequency", required = false) String capitalizationFrequency,
            @RequestParam(value = "dayCountConvention", required = false) String dayCountConvention,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "removeBanner", required = false, defaultValue = "false") Boolean removeBanner,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {

        SavingAccount sa = savingAccountRepo.findById(id).orElse(null);
        if (sa == null) return notFound("Saving Account");
        if (access.isForeign(sa.getNetwork(), session)) return forbidden();

        try {
            sa.setName(name);
            sa.setInterestRate(interestRate);
            sa.setMinBalance(minBalance);
            applyInterestConfiguration(sa,
                    interestBasis == null ? sa.getInterestBasis() : interestBasis,
                    capitalizationFrequency == null ? sa.getCapitalizationFrequency() : capitalizationFrequency,
                    dayCountConvention == null ? sa.getDayCountConvention() : dayCountConvention);
            sa.setDescription(description);
            if (Boolean.TRUE.equals(removeBanner)) {
                sa.setBannerData(null);
                sa.setBannerName(null);
                sa.setBannerType(null);
            } else {
                applyBanner(sa::setBannerData, sa::setBannerName, sa::setBannerType, banner);
            }
            return ResponseEntity.ok(savingAccountRepo.save(sa));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to update financial product");
        }
    }

    @DeleteMapping("/saving-accounts/{id}")
    public ResponseEntity<Object> deleteSavingAccount(@PathVariable Long id, HttpSession session) {
        SavingAccount sa = savingAccountRepo.findById(id).orElse(null);
        if (sa == null) return notFound("Saving Account");
        if (access.isForeign(sa.getNetwork(), session)) return forbidden();
        savingAccountRepo.delete(sa);
        return ResponseEntity.ok().build();
    }

    // ============================================================================
    // LOAN PACKAGE
    // ============================================================================

    @GetMapping("/loan-packages/{networkId}")
    public ResponseEntity<Object> getLoanPackages(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(loanPackageRepo.findByNetworkId(networkId));
    }

    @PostMapping("/loan-packages/{networkId}")
    public ResponseEntity<Object> addLoanPackage(
            @PathVariable Long networkId,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("maxAmount") BigDecimal maxAmount,
            @RequestParam("maxDuration") Integer maxDuration,
            @RequestParam(value = "maxLoanToValuePercent", required = false, defaultValue = "70.00") BigDecimal maxLoanToValuePercent,
            @RequestParam(value = "guarantorExposureLimit", required = false, defaultValue = "1000000.00") BigDecimal guarantorExposureLimit,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        try {
            Network network = networkRepo.findById(networkId).orElse(null);
            if (network == null) return notFound("Network");

            LoanPackage lp = new LoanPackage();
            lp.setNetwork(network);
            lp.setName(name);
            lp.setInterestRate(interestRate);
            lp.setMaxAmount(maxAmount);
            lp.setMaxDuration(maxDuration);
            applyLoanSecurityConfiguration(lp, maxLoanToValuePercent, guarantorExposureLimit);
            lp.setDescription(description);
            applyBanner(lp::setBannerData, lp::setBannerName, lp::setBannerType, banner);

            return ResponseEntity.ok(loanPackageRepo.save(lp));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to create financial product");
        }
    }

    @GetMapping("/loan-packages/{id}/banner")
    public ResponseEntity<byte[]> getLoanPackageBanner(@PathVariable Long id, HttpSession session) {
        LoanPackage lp = loanPackageRepo.findById(id).orElse(null);
        if (lp == null || lp.getBannerData() == null) return ResponseEntity.notFound().build();
        if (access.isForeign(lp.getNetwork(), session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return bannerResponse(lp.getBannerData(), lp.getBannerName());
    }

    @PutMapping(value = "/loan-packages/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateLoanPackage(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("interestRate") BigDecimal interestRate,
            @RequestParam("maxAmount") BigDecimal maxAmount,
            @RequestParam("maxDuration") Integer maxDuration,
            @RequestParam(value = "maxLoanToValuePercent", required = false) BigDecimal maxLoanToValuePercent,
            @RequestParam(value = "guarantorExposureLimit", required = false) BigDecimal guarantorExposureLimit,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "removeBanner", required = false, defaultValue = "false") Boolean removeBanner,
            @RequestParam(value = "banner", required = false) MultipartFile banner,
            HttpSession session) {

        LoanPackage lp = loanPackageRepo.findById(id).orElse(null);
        if (lp == null) return notFound("Loan Package");
        if (access.isForeign(lp.getNetwork(), session)) return forbidden();

        try {
            lp.setName(name);
            lp.setInterestRate(interestRate);
            lp.setMaxAmount(maxAmount);
            lp.setMaxDuration(maxDuration);
            applyLoanSecurityConfiguration(lp,
                    maxLoanToValuePercent == null ? lp.getMaxLoanToValuePercent() : maxLoanToValuePercent,
                    guarantorExposureLimit == null ? lp.getGuarantorExposureLimit() : guarantorExposureLimit);
            lp.setDescription(description);
            if (Boolean.TRUE.equals(removeBanner)) {
                lp.setBannerData(null);
                lp.setBannerName(null);
                lp.setBannerType(null);
            } else {
                applyBanner(lp::setBannerData, lp::setBannerName, lp::setBannerType, banner);
            }
            return ResponseEntity.ok(loanPackageRepo.save(lp));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid financial product data or banner");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to update financial product");
        }
    }

    @DeleteMapping("/loan-packages/{id}")
    public ResponseEntity<Object> deleteLoanPackage(@PathVariable Long id, HttpSession session) {
        LoanPackage lp = loanPackageRepo.findById(id).orElse(null);
        if (lp == null) return notFound("Loan Package");
        if (access.isForeign(lp.getNetwork(), session)) return forbidden();
        loanPackageRepo.delete(lp);
        return ResponseEntity.ok().build();
    }

    // ============================================================================
    // SHARED HELPERS
    // ============================================================================

    private void applyInterestConfiguration(SavingAccount account, String basis, String frequency, String dayCount) {
        account.setInterestBasis(switch (basis) {
            case "MINIMUM_MONTHLY_BALANCE", "DAILY_PRODUCT", "AVERAGE_BALANCE" -> basis;
            default -> throw new IllegalArgumentException("Unsupported savings interest basis");
        });
        account.setCapitalizationFrequency(switch (frequency) {
            case "DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY" -> frequency;
            default -> throw new IllegalArgumentException("Unsupported capitalization frequency");
        });
        account.setDayCountConvention(switch (dayCount) {
            case "ACTUAL_365", "ACTUAL_366", "THIRTY_360" -> dayCount;
            default -> throw new IllegalArgumentException("Unsupported day-count convention");
        });
    }

    private void applyLoanSecurityConfiguration(LoanPackage product, BigDecimal ltv, BigDecimal exposureLimit) {
        if (ltv == null || ltv.signum() <= 0 || ltv.compareTo(new BigDecimal("100")) > 0
                || exposureLimit == null || exposureLimit.signum() <= 0) {
            throw new IllegalArgumentException("Invalid loan security configuration");
        }
        product.setMaxLoanToValuePercent(ltv);
        product.setGuarantorExposureLimit(exposureLimit);
    }

    private interface BytesSetter { void accept(byte[] value); }

    private interface TextSetter { void accept(String value); }

    private void applyBanner(BytesSetter data, TextSetter name, TextSetter type, MultipartFile banner)
            throws java.io.IOException {
        if (banner == null || banner.isEmpty()) return;
        StoredFile safe = FileSecurity.validate(banner, FileSecurity.Kind.IMAGE);
        data.accept(safe.data());
        name.accept(safe.filename());
        type.accept(safe.contentType());
    }

    private ResponseEntity<byte[]> bannerResponse(byte[] data, String name) {
        HttpHeaders headers = new HttpHeaders();
        String detectedType = FileSecurity.detectedContentType(data);
        if (!detectedType.startsWith("image/")) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).build();
        }
        headers.setContentType(MediaType.parseMediaType(detectedType));
        headers.setContentDisposition(ContentDisposition.inline()
                .filename(FileSecurity.safeStoredFilename(name, data), java.nio.charset.StandardCharsets.UTF_8)
                .build());
        headers.setCacheControl(CacheControl.noStore().cachePrivate());
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}
