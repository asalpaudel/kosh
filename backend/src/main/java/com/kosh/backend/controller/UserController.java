package com.kosh.backend.controller;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository repo, NetworkRepository networkRepo, ActivityLogRepository logRepo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.passwordEncoder = passwordEncoder;
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

                System.out.println("Current members: " + currentMembers + " / " + maxMembers);

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "error", "Member limit reached. This network allows only " +
                                            maxMembers + " members."));
                }
            } else {
                System.out.println("No member limit set for this network (unlimited)");
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
            user.setStatus(requestedStatus);

            // ⭐ Handle photo upload
            if (photo != null && !photo.isEmpty()) {
                user.setPhotoData(photo.getBytes());
                user.setPhotoName(photo.getOriginalFilename());
                user.setPhotoType(photo.getContentType());
                System.out.println("Photo uploaded: " + photo.getOriginalFilename());
            }

            // ⭐ Handle citizenship upload
            if (citizenship != null && !citizenship.isEmpty()) {
                user.setCitizenshipData(citizenship.getBytes());
                user.setCitizenshipName(citizenship.getOriginalFilename());
                user.setCitizenshipType(citizenship.getContentType());
                System.out.println("Citizenship uploaded: " + citizenship.getOriginalFilename());
            }

            // ⭐ Handle signature upload
            if (signature != null && !signature.isEmpty()) {
                user.setSignatureData(signature.getBytes());
                user.setSignatureName(signature.getOriginalFilename());
                user.setSignatureType(signature.getContentType());
                System.out.println("Signature uploaded: " + signature.getOriginalFilename());
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
                    System.out.println("Failed to log user creation: " + e.getMessage());
                }
            }
            // --- ACTIVITY LOGGING END ---

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create user: " + e.getMessage()));
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
    public ResponseEntity<?> getUserById(@PathVariable int id, HttpSession session) {
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
        return getUserPhoto(userId.intValue(), session);
    }

    @GetMapping("/me/citizenship")
    public ResponseEntity<byte[]> getCurrentUserCitizenship(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return getUserCitizenship(userId.intValue(), session);
    }

    @GetMapping("/me/signature")
    public ResponseEntity<byte[]> getCurrentUserSignature(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return getUserSignature(userId.intValue(), session);
    }

    // ⭐ Get User Photo
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getUserPhoto(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return repo.findById(id)
                .filter(user -> user.getPhotoData() != null)
                .map(user -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(user.getPhotoType()));
                    headers.setContentDisposition(
                        ContentDisposition.inline()
                            .filename(user.getPhotoName())
                            .build()
                    );
                    return new ResponseEntity<>(user.getPhotoData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/citizenship")
    public ResponseEntity<byte[]> getUserCitizenship(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return repo.findById(id)
                .filter(user -> user.getCitizenshipData() != null)
                .map(user -> {
                    HttpHeaders headers = new HttpHeaders();
                    
                    // Set proper content type
                    if (user.getCitizenshipType() != null) {
                        headers.setContentType(MediaType.parseMediaType(user.getCitizenshipType()));
                    }
                    
                    // For inline viewing (PDF in iframe)
                    headers.setContentDisposition(
                        ContentDisposition.inline()
                            .filename(user.getCitizenshipName())
                            .build()
                    );
                    
                    // Allow embedding
                    headers.add("X-Frame-Options", "SAMEORIGIN");
                    
                    return new ResponseEntity<>(user.getCitizenshipData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get User Signature
    @GetMapping("/{id}/signature")
    public ResponseEntity<byte[]> getUserSignature(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return repo.findById(id)
                .filter(user -> user.getSignatureData() != null)
                .map(user -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(user.getSignatureType()));
                    headers.setContentDisposition(
                        ContentDisposition.inline()
                            .filename(user.getSignatureName())
                            .build()
                    );
                    return new ResponseEntity<>(user.getSignatureData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Photo as Base64
    @GetMapping("/{id}/photo/base64")
    public ResponseEntity<?> getUserPhotoBase64(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getPhotoData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getPhotoData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", user.getPhotoName());
                    response.put("type", user.getPhotoType());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Citizenship as Base64
    @GetMapping("/{id}/citizenship/base64")
    public ResponseEntity<?> getUserCitizenshipBase64(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getCitizenshipData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getCitizenshipData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", user.getCitizenshipName());
                    response.put("type", user.getCitizenshipType());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Signature as Base64
    @GetMapping("/{id}/signature/base64")
    public ResponseEntity<?> getUserSignatureBase64(@PathVariable int id, HttpSession session) {
        User target = repo.findById(id).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (!canAccessUserDocument(target, session)) return forbidden();
        return repo.findById(id)
                .filter(user -> user.getSignatureData() != null)
                .map(user -> {
                    String base64 = Base64.getEncoder().encodeToString(user.getSignatureData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", user.getSignatureName());
                    response.put("type", user.getSignatureType());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMemberAsAdmin(
            @PathVariable int id,
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
            @PathVariable int id,
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

        User user = repo.findById(userId.intValue()).orElse(null);
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
    public ResponseEntity<?> approveUser(@PathVariable int id, HttpSession session) { // Added HttpSession for logging
        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (!canManageUser(user, session)) return forbidden();

        Network network = networkRepo.findAll().stream()
                .filter(n -> user.getSahakari().equals(n.getName()))
                .findFirst()
                .orElse(null);

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
                System.out.println("Failed to log user approval: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable int id, HttpSession session) { // Added HttpSession for logging
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
                System.out.println("Failed to log user rejection: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id, HttpSession session) { // Added HttpSession for logging
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
                System.out.println("Failed to log user deletion: " + e.getMessage());
            }
        }

        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(value = "search", required = false) String search,
            HttpSession session) {

        System.out.println("=== User Search Request ===");
        System.out.println("Search param: " + search);
        System.out.println("Session ID: " + session.getId());

        String sahakari = (String) session.getAttribute("sahakari");
        System.out.println("Session sahakari: " + sahakari);

        if (sahakari == null) {
            System.out.println("ERROR: Sahakari not found in session");
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Session expired or not authenticated. Please login again."));
        }

        List<User> users;

        if (search != null && !search.trim().isEmpty()) {
            System.out.println("Searching for: '" + search + "' in network: " + sahakari);

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

            System.out.println("Found " + users.size() + " matching users");
        } else {
            users = repo.findAll().stream()
                    .filter(u -> sahakari.equals(u.getSahakari()))
                    .collect(Collectors.toList());

            System.out.println("Returning all users: " + users.size());
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsersForSuperAdmin(
            @RequestParam(value = "search", required = false) String search) {

        System.out.println("=== Super Admin User Search ===");
        System.out.println("Search param: " + search);

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

        System.out.println("Returning " + users.size() + " users");
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        System.out.println("=== Get Current User ===");
        System.out.println("Session User ID: " + userId);

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        User user = repo.findById(userId.intValue()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        System.out.println("User: " + user.getName());
        System.out.println("Balance: " + user.getBalance());

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

        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data. Password must be at least 6 chars."));
        }

        User user = repo.findById(userId.intValue()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Incorrect current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
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
                System.out.println("Failed to log password change: " + e.getMessage());
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
                System.out.println("Failed to log user update: " + e.getMessage());
            }
        }
        return saved;
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
