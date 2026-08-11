package com.kosh.backend.controller;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.FileSecurity;
import com.kosh.backend.service.FileSecurity.StoredFile;
import com.kosh.backend.service.ShareCapitalService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserController.class);

    private final UserRepository repo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder passwordEncoder;
    private final ShareCapitalService shareCapital;

    public UserController(UserRepository repo, NetworkRepository networkRepo, ActivityLogRepository logRepo,
            PasswordEncoder passwordEncoder, ShareCapitalService shareCapital) {
        this.repo = repo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.passwordEncoder = passwordEncoder;
        this.shareCapital = shareCapital;
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam(value = "dob", required = false) String dob, // Made optional to prevent errors if missing in some flows
            @RequestParam(value = "address", required = false) String address,  
            @RequestParam(value = "role", required = false) String role,
            @RequestParam("sahakari") String sahakari,
            @RequestParam("password") String password,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "citizenship", required = false) MultipartFile citizenship,
            @RequestParam(value = "signature", required = false) MultipartFile signature,
            HttpSession session) { // Added HttpSession for logging

        String actorRole = (String) session.getAttribute("userRole");
        String requestedStatus = (status != null && !status.isBlank()) ? status : "Pending";
        Network network;

        if (actorRole == null) {
            role = "member";
            requestedStatus = "Pending";
            network = networkRepo.findByName(sahakari);
        } else if ("admin".equalsIgnoreCase(actorRole)) {
            if (!"member".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Cooperative administrators may only create member accounts"));
            }

            Long actorNetworkId = (Long) session.getAttribute("sahakariId");
            if (actorNetworkId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Authenticated cooperative context is required"));
            }

            network = networkRepo.findById(actorNetworkId).orElse(null);
            role = "member";
            if (network != null) {
                sahakari = network.getName();
            }
        } else if ("superadmin".equalsIgnoreCase(actorRole)) {
            if (!"admin".equalsIgnoreCase(role) && !"member".equalsIgnoreCase(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Unsupported account role"));
            }
            network = networkRepo.findByName(sahakari);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "This account cannot create users"));
        }

        if (actorRole != null
                && !"Pending".equals(requestedStatus)
                && !"Active".equals(requestedStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported account status"));
        }

        if (network == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Network not found: " + sahakari));
        }

        final String targetRole = role;
        final String targetSahakari = network.getName();

        email = email == null ? null : email.trim().toLowerCase();
        if (email == null || email.isBlank() || password == null || password.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "A valid email and a password of at least 8 characters are required"));
        }
        if (repo.findByEmail(email) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with that email already exists"));
        }

        if ("member".equalsIgnoreCase(targetRole)) {
            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> targetSahakari.equalsIgnoreCase(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "error", "Member limit reached. This network allows only " +
                                            maxMembers + " members."));
                }
            }
        }

        if ("admin".equalsIgnoreCase(targetRole)) {
            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> targetSahakari.equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Admin limit reached for " + targetSahakari +
                                        ". Maximum allowed: " + network.getAdminLimit()));
            }
        }

        try {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);
            user.setDob(dob);
            user.setAddress(address); 
            user.setRole(targetRole);
            user.setSahakari(targetSahakari);
            // Link sahakari ID immediately if available
            user.setSahakariId(network.getId());
            user.setPassword(passwordEncoder.encode(password));
            user.setStatus("member".equalsIgnoreCase(targetRole) ? "Pending" : requestedStatus);

            // ⭐ Handle photo upload
            if (photo != null && !photo.isEmpty()) {
                applyFile(user::setPhotoData, user::setPhotoName, user::setPhotoType,
                        FileSecurity.validate(photo, FileSecurity.Kind.IMAGE));
            }

            // ⭐ Handle citizenship upload
            if (citizenship != null && !citizenship.isEmpty()) {
                applyFile(user::setCitizenshipData, user::setCitizenshipName, user::setCitizenshipType,
                        FileSecurity.validate(citizenship, FileSecurity.Kind.DOCUMENT));
            }

            // ⭐ Handle signature upload
            if (signature != null && !signature.isEmpty()) {
                applyFile(user::setSignatureData, user::setSignatureName, user::setSignatureType,
                        FileSecurity.validate(signature, FileSecurity.Kind.IMAGE));
            }

            User saved = repo.save(user);

            // --- ACTIVITY LOGGING START ---
            // Only log if an Admin/Superadmin is logged in (creating the user)
            String adminName = (String) session.getAttribute("userName");
            String userRole = (String) session.getAttribute("userRole");
            
            if (adminName != null && ("admin".equals(userRole) || "superadmin".equals(userRole))) {
                try {
                    Long sahakariId = (Long) session.getAttribute("sahakariId");
                    ActivityLog log = new ActivityLog(
                        adminName, 
                        userRole, 
                        sahakariId, 
                        "CREATE_USER", 
                        "Created user: " + saved.getName() + " (" + saved.getRole() + ")"
                    );
                    logRepo.save(log);
                } catch (Exception e) {
                    LOGGER.warn("Unable to persist CREATE_USER audit event");
                }
            }
            // --- ACTIVITY LOGGING END ---

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid account data or upload"));
        }
    }

    @GetMapping("/network/{networkId}")
    public ResponseEntity<?> getUsersByNetworkId(@PathVariable Long networkId, HttpSession session) {
        if (!isSuperAdmin(session) && !networkId.equals(session.getAttribute("sahakariId"))) {
            return forbidden();
        }
        Network network = networkRepo.findById(networkId).orElse(null);

        if (network == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Network not found"));
        }

        List<User> users = repo.findAll().stream()
                .filter(u -> network.getName().equals(u.getSahakari()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingUsers(@RequestParam String sahakari, HttpSession session) {
        if (!isSuperAdmin(session) && !sahakari.equals(session.getAttribute("sahakari"))) {
            return forbidden();
        }
        return ResponseEntity.ok(repo.findAll().stream()
                .filter(u -> "Pending".equals(u.getStatus()) && sahakari.equals(u.getSahakari()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpSession session) {
        User user = repo.findById(id).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (!canManageUser(user, session)) {
            return forbidden();
        }

        // Return user without binary data
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("role", user.getRole());
        userData.put("sahakari", user.getSahakari());
        userData.put("sahakariId", user.getSahakariId());
        userData.put("status", user.getStatus());
        userData.put("balance", user.getBalance());
        
        // Include metadata about files
        userData.put("hasPhoto", user.getPhotoData() != null);
        userData.put("photoName", user.getPhotoName());
        userData.put("hasCitizenship", user.getCitizenshipData() != null);
        userData.put("citizenshipName", user.getCitizenshipName());
        userData.put("hasSignature", user.getSignatureData() != null);
        userData.put("signatureName", user.getSignatureName());

        return ResponseEntity.ok(userData);
    }

    @GetMapping("/me/photo")
    public ResponseEntity<byte[]> getCurrentUserPhoto(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return getUserPhoto(userId, session);
    }

    @GetMapping("/me/citizenship")
    public ResponseEntity<byte[]> getCurrentUserCitizenship(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return getUserCitizenship(userId, session);
    }

    @GetMapping("/me/signature")
    public ResponseEntity<byte[]> getCurrentUserSignature(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return getUserSignature(userId, session);
    }

    // ⭐ Get User Photo
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getUserPhoto(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return target.getPhotoData() == null ? ResponseEntity.notFound().build()
                : fileResponse(target.getPhotoData(), target.getPhotoName(), true);
    }

    @GetMapping("/{id}/citizenship")
    public ResponseEntity<byte[]> getUserCitizenship(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return target.getCitizenshipData() == null ? ResponseEntity.notFound().build()
                : fileResponse(target.getCitizenshipData(), target.getCitizenshipName(), false);
    }

    // ⭐ Get User Signature
    @GetMapping("/{id}/signature")
    public ResponseEntity<byte[]> getUserSignature(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return target.getSignatureData() == null ? ResponseEntity.notFound().build()
                : fileResponse(target.getSignatureData(), target.getSignatureName(), true);
    }

    // ⭐ Get Photo as Base64
    @GetMapping("/{id}/photo/base64")
    public ResponseEntity<?> getUserPhotoBase64(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getPhotoData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getPhotoData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", FileSecurity.safeStoredFilename(
                            user.getPhotoName(), user.getPhotoData()));
                    response.put("type", FileSecurity.detectedContentType(user.getPhotoData()));
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Citizenship as Base64
    @GetMapping("/{id}/citizenship/base64")
    public ResponseEntity<?> getUserCitizenshipBase64(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getCitizenshipData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getCitizenshipData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", FileSecurity.safeStoredFilename(
                            user.getCitizenshipName(), user.getCitizenshipData()));
                    response.put("type", FileSecurity.detectedContentType(user.getCitizenshipData()));
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Signature as Base64
    @GetMapping("/{id}/signature/base64")
    public ResponseEntity<?> getUserSignatureBase64(@PathVariable Long id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getSignatureData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getSignatureData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", FileSecurity.safeStoredFilename(
                            user.getSignatureName(), user.getSignatureData()));
                    response.put("type", FileSecurity.detectedContentType(user.getSignatureData()));
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMemberAsAdmin(
            @PathVariable Long id,
            @RequestBody AdminMemberUpdateRequest request,
            HttpSession session) {
        User existingUser = repo.findById(id).orElse(null);
        if (existingUser == null) return ResponseEntity.notFound().build();
        if (!"admin".equalsIgnoreCase((String) session.getAttribute("userRole"))
                || !canManageUser(existingUser, session)) {
            return forbidden();
        }

        applyBasicUserChanges(existingUser, request.name(), request.email(), request.phone(), request.password());
        return ResponseEntity.ok(saveAndLogUpdate(existingUser, session));
    }

    @PutMapping("/{id}/superadmin")
    public ResponseEntity<?> updateUserAsSuperAdmin(
            @PathVariable Long id,
            @RequestBody SuperAdminUserUpdateRequest request,
            HttpSession session) {
        if (!isSuperAdmin(session)) return forbidden();

        User existingUser = repo.findById(id).orElse(null);
        if (existingUser == null) return ResponseEntity.notFound().build();
        if ("superadmin".equalsIgnoreCase(existingUser.getRole())) return forbidden();
        if (!"admin".equalsIgnoreCase(request.role()) && !"member".equalsIgnoreCase(request.role())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admin and member roles are supported"));
        }
        if (!"Active".equals(request.status()) && !"Pending".equals(request.status())
                && !"Rejected".equals(request.status())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported account status"));
        }
        if ("member".equalsIgnoreCase(request.role()) && "Active".equals(request.status())
                && !"Active".equals(existingUser.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Approve membership through the share-capital approval flow"));
        }

        Network network = networkRepo.findByName(request.sahakari());
        if (network == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Network not found"));
        }

        applyBasicUserChanges(existingUser, request.name(), request.email(), request.phone(), request.password());
        existingUser.setRole(request.role().toLowerCase());
        existingUser.setStatus(request.status());
        existingUser.setSahakari(network.getName());
        existingUser.setSahakariId(network.getId());
        return ResponseEntity.ok(saveAndLogUpdate(existingUser, session));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @RequestBody Map<String, String> request,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        User user = repo.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.containsKey("name") && request.get("name") != null && !request.get("name").isBlank()) {
            user.setName(request.get("name").trim());
            session.setAttribute("userName", user.getName());
        }
        if (request.containsKey("phone")) user.setPhone(request.get("phone"));
        if (request.containsKey("dob")) user.setDob(request.get("dob"));
        if (request.containsKey("address")) user.setAddress(request.get("address"));

        User saved = repo.save(user);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "phone", saved.getPhone() == null ? "" : saved.getPhone(),
                "dob", saved.getDob() == null ? "" : saved.getDob(),
                "address", saved.getAddress() == null ? "" : saved.getAddress(),
                "role", saved.getRole(),
                "sahakari", saved.getSahakari(),
                "sahakariId", saved.getSahakariId(),
                "status", saved.getStatus()));
    }

    @PatchMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveUser(@PathVariable Long id,
            @RequestBody(required = false) ApprovalRequest request, HttpSession session) {
        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (!canManageUser(user, session)) return forbidden();

        Network network = user.getSahakariId() == null ? null : networkRepo.findById(user.getSahakariId()).orElse(null);

        if (network == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Network not found"));
        }

        if ("admin".equalsIgnoreCase(user.getRole())) {
            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> u.getId() != id)
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> user.getSahakari().equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Admin limit reached"));
            }
        }

        if ("member".equalsIgnoreCase(user.getRole())) {
            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> u.getId() != id)
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> user.getSahakari().equals(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Member limit reached"));
                }
            }

            if (request == null || request.initialShares() == null || request.requestRef() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Initial share count and request reference are required for membership approval"));
            }
            shareCapital.issueInitialShares(network, user, request.initialShares(), request.paymentMethod(),
                    request.date(), request.requestRef(), (String) session.getAttribute("userName"));
        }

        user.setStatus("Active");
        // Also update the Sahakari ID if it's not set
        if (user.getSahakariId() == null && network != null) {
            user.setSahakariId(network.getId());
        }
        
        User saved = repo.save(user);

        // --- ACTIVITY LOGGING START ---
        String adminName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");
        if (adminName != null) {
            try {
                Long sahakariId = (Long) session.getAttribute("sahakariId");
                ActivityLog log = new ActivityLog(
                    adminName, 
                    userRole != null ? userRole : "admin", 
                    sahakariId, 
                    "APPROVE_USER", 
                    "Approved user: " + saved.getName()
                );
                logRepo.save(log);
            } catch (Exception e) {
                LOGGER.warn("Unable to persist APPROVE_USER audit event");
            }
        }

        return ResponseEntity.ok(saved);
    }

    public record ApprovalRequest(Integer initialShares, String paymentMethod,
            java.time.LocalDate date, String requestRef) {}

    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    public ResponseEntity<Map<String, String>> businessRuleError(RuntimeException exception) {
        return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id, HttpSession session) { // Added HttpSession for logging
        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (!canManageUser(user, session)) return forbidden();
        user.setStatus("Rejected");
        User saved = repo.save(user);

        String adminName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");
        if (adminName != null) {
            try {
                Long sahakariId = (Long) session.getAttribute("sahakariId");
                ActivityLog log = new ActivityLog(
                    adminName, 
                    userRole != null ? userRole : "admin", 
                    sahakariId, 
                    "REJECT_USER", 
                    "Rejected user: " + saved.getName()
                );
                logRepo.save(log);
            } catch (Exception e) {
                LOGGER.warn("Unable to persist REJECT_USER audit event");
            }
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) { // Added HttpSession for logging
        User user = repo.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (!canManageUser(user, session)) {
            return forbidden();
        }

        // --- ACTIVITY LOGGING START ---
        String adminName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");
        if (adminName != null) {
            try {
                Long sahakariId = (Long) session.getAttribute("sahakariId");
                ActivityLog log = new ActivityLog(
                    adminName, 
                    userRole != null ? userRole : "admin", 
                    sahakariId, 
                    "DELETE_USER", 
                    "Deleted user: " + user.getName() + " (ID: " + id + ")"
                );
                logRepo.save(log);
            } catch (Exception e) {
                LOGGER.warn("Unable to persist DELETE_USER audit event");
            }
        }

        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(value = "search", required = false) String search,
            HttpSession session) {

        String sahakari = (String) session.getAttribute("sahakari");

        if (sahakari == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Session expired or not authenticated. Please login again."));
        }

        List<User> users;

        if (search != null && !search.trim().isEmpty()) {
            users = repo.findAll().stream()
                    .filter(u -> sahakari.equals(u.getSahakari()))
                    .filter(u -> {
                        String lowerSearch = search.toLowerCase();
                        boolean nameMatch = u.getName() != null &&
                                u.getName().toLowerCase().contains(lowerSearch);
                        boolean phoneMatch = u.getPhone() != null &&
                                u.getPhone().contains(search);
                        return nameMatch || phoneMatch;
                    })
                    .collect(Collectors.toList());

        } else {
            users = repo.findAll().stream()
                    .filter(u -> sahakari.equals(u.getSahakari()))
                    .collect(Collectors.toList());

        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsersForSuperAdmin(
            @RequestParam(value = "search", required = false) String search) {

        List<User> users;

        if (search != null && !search.trim().isEmpty()) {
            String lowerSearch = search.toLowerCase();

            users = repo.findAll().stream()
                    .filter(u -> {
                        boolean nameMatch = u.getName() != null &&
                                u.getName().toLowerCase().contains(lowerSearch);
                        boolean phoneMatch = u.getPhone() != null &&
                                u.getPhone().contains(search);
                        return nameMatch || phoneMatch;
                    })
                    .collect(Collectors.toList());
        } else {
            users = repo.findAll();
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        User user = repo.findById(userId).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        Map<String, Object> response = new HashMap<>();
        
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("dob", user.getDob());
        response.put("address", user.getAddress());
        response.put("role", user.getRole());
        response.put("sahakari", user.getSahakari());
        response.put("balance", user.getBalance());
        response.put("status", user.getStatus());
        response.put("hasPhoto", user.getPhotoData() != null);
        response.put("hasCitizenship", user.getCitizenshipData() != null);
        response.put("hasSignature", user.getSignatureData() != null);

        return ResponseEntity.ok(response);

    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUserCounts() {

        long total = repo.count();
        long admins = repo.countByRole("admin");
        long members = repo.countByRole("member");

        Map<String, Long> map = new HashMap<>();
        map.put("total", total);
        map.put("admins", admins);
        map.put("users", members);

        return ResponseEntity.ok(map);
    }
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("newPassword");

        if (oldPassword == null || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }

        User user = repo.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Incorrect current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTrustedDeviceToken(null);
        user.setTrustedDeviceExpiry(null);
        repo.save(user);

        // Log Activity
        String adminName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");
        Long sahakariId = (Long) session.getAttribute("sahakariId");
        
        if (adminName != null) {
             try {
                ActivityLog log = new ActivityLog(
                    adminName, 
                    userRole, 
                    sahakariId, 
                    "CHANGE_PASSWORD", 
                    "User changed their password."
                );
                logRepo.save(log);
            } catch (Exception e) {
                LOGGER.warn("Unable to persist CHANGE_PASSWORD audit event");
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }

    private boolean canManageUser(User target, HttpSession session) {
        String actorRole = (String) session.getAttribute("userRole");
        if ("superadmin".equalsIgnoreCase(actorRole)) {
            return !"superadmin".equalsIgnoreCase(target.getRole());
        }
        if (!"admin".equalsIgnoreCase(actorRole) || !"member".equalsIgnoreCase(target.getRole())) {
            return false;
        }
        Long actorNetworkId = (Long) session.getAttribute("sahakariId");
        return actorNetworkId != null && actorNetworkId.equals(target.getSahakariId());
    }

    private boolean canAccessUserDocument(User target, HttpSession session) {
        Long actorUserId = (Long) session.getAttribute("userId");
        return (actorUserId != null && actorUserId.equals(target.getId()))
                || canManageUser(target, session);
    }

    private boolean isSuperAdmin(HttpSession session) {
        return "superadmin".equalsIgnoreCase((String) session.getAttribute("userRole"));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "You cannot manage users outside your role or cooperative"));
    }

    private void applyBasicUserChanges(User user, String name, String email, String phone, String password) {
        if (name != null && !name.isBlank()) user.setName(name.trim());
        if (email != null && !email.isBlank()) user.setEmail(email.trim().toLowerCase());
        user.setPhone(phone);
        if (password != null && !password.isBlank()) {
            if (password.length() < 8) throw new IllegalArgumentException("Password must be at least 8 characters");
            user.setPassword(passwordEncoder.encode(password));
        }
    }

    private User saveAndLogUpdate(User user, HttpSession session) {
        User saved = repo.save(user);
        String actorName = (String) session.getAttribute("userName");
        String actorRole = (String) session.getAttribute("userRole");
        if (actorName != null) {
            try {
                logRepo.save(new ActivityLog(
                        actorName,
                        actorRole,
                        (Long) session.getAttribute("sahakariId"),
                        "UPDATE_USER",
                        "Updated user details: " + saved.getName()));
            } catch (Exception e) {
                LOGGER.warn("Unable to persist UPDATE_USER audit event");
            }
        }
        return saved;
    }

    private interface BytesSetter { void accept(byte[] value); }
    private interface TextSetter { void accept(String value); }

    private void applyFile(BytesSetter data, TextSetter name, TextSetter type, StoredFile file) {
        data.accept(file.data());
        name.accept(file.filename());
        type.accept(file.contentType());
    }

    private ResponseEntity<byte[]> fileResponse(byte[] data, String name, boolean inline) {
        HttpHeaders headers = new HttpHeaders();
        String detectedType = FileSecurity.detectedContentType(data);
        if (inline && !detectedType.startsWith("image/")) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).build();
        }
        headers.setContentType(MediaType.parseMediaType(detectedType));
        var disposition = inline ? ContentDisposition.inline() : ContentDisposition.attachment();
        headers.setContentDisposition(disposition
                .filename(FileSecurity.safeStoredFilename(name, data), java.nio.charset.StandardCharsets.UTF_8)
                .build());
        headers.setCacheControl(org.springframework.http.CacheControl.noStore().cachePrivate());
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    public record AdminMemberUpdateRequest(String name, String email, String phone, String password) {}

    public record SuperAdminUserUpdateRequest(
            String name,
            String email,
            String phone,
            String password,
            String role,
            String sahakari,
            String status) {}
}
