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

import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;

    public UserController(UserRepository repo, NetworkRepository networkRepo) {
        this.repo = repo;
        this.networkRepo = networkRepo;
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("dob") String dob,
            @RequestParam("address") String address,  
            @RequestParam("role") String role,
            @RequestParam("sahakari") String sahakari,
            @RequestParam("password") String password,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "citizenship", required = false) MultipartFile citizenship,
            @RequestParam(value = "signature", required = false) MultipartFile signature) {

        System.out.println("POST /api/users hit!");
        System.out.println("User: " + name + ", " + email);
        System.out.println("Role: " + role + ", Sahakari: " + sahakari);

        Network network = networkRepo.findAll().stream()
                .filter(n -> sahakari.equalsIgnoreCase(n.getName()))
                .findFirst()
                .orElse(null);

        if (network == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Network not found: " + sahakari));
        }

        if ("member".equalsIgnoreCase(role)) {
            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> sahakari.equalsIgnoreCase(u.getSahakari()))
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

        if ("admin".equalsIgnoreCase(role)) {
            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> sahakari.equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Admin limit reached for " + sahakari +
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
            user.setRole(role);
            user.setSahakari(sahakari);
            user.setPassword(password);
            user.setStatus((status != null && !status.isBlank()) ? status : "Pending");

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
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create user: " + e.getMessage()));
        }
    }

    @GetMapping("/network/{networkId}")
    public ResponseEntity<?> getUsersByNetworkId(@PathVariable Long networkId) {
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
    public List<User> getPendingUsers(@RequestParam String sahakari) {
        return repo.findAll().stream()
                .filter(u -> "Pending".equals(u.getStatus()) && sahakari.equals(u.getSahakari()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        User user = repo.findById(id).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
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

    // ⭐ Get User Photo
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getUserPhoto(@PathVariable int id) {
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

    // ⭐ Get User Citizenship
    @GetMapping("/{id}/citizenship")
    public ResponseEntity<byte[]> getUserCitizenship(@PathVariable int id) {
        return repo.findById(id)
                .filter(user -> user.getCitizenshipData() != null)
                .map(user -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(user.getCitizenshipType()));
                    headers.setContentDisposition(
                        ContentDisposition.inline()
                            .filename(user.getCitizenshipName())
                            .build()
                    );
                    return new ResponseEntity<>(user.getCitizenshipData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get User Signature
    @GetMapping("/{id}/signature")
    public ResponseEntity<byte[]> getUserSignature(@PathVariable int id) {
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
    public ResponseEntity<?> getUserPhotoBase64(@PathVariable int id) {
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
    public ResponseEntity<?> getUserCitizenshipBase64(@PathVariable int id) {
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
    public ResponseEntity<?> getUserSignatureBase64(@PathVariable int id) {
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
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updatedUser) {
        User existingUser = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        boolean isBecomingAdmin = "admin".equalsIgnoreCase(updatedUser.getRole()) &&
                !"admin".equalsIgnoreCase(existingUser.getRole());
        boolean isAdminChangingSahakari = "admin".equalsIgnoreCase(updatedUser.getRole()) &&
                !existingUser.getSahakari().equals(updatedUser.getSahakari());
        boolean isBecomingMember = "member".equalsIgnoreCase(updatedUser.getRole()) &&
                !"member".equalsIgnoreCase(existingUser.getRole());
        boolean isMemberChangingSahakari = "member".equalsIgnoreCase(updatedUser.getRole()) &&
                !existingUser.getSahakari().equals(updatedUser.getSahakari());

        if (isBecomingAdmin || isAdminChangingSahakari) {
            String targetSahakari = updatedUser.getSahakari();
            Network network = networkRepo.findAll().stream()
                    .filter(n -> targetSahakari.equals(n.getName()))
                    .findFirst()
                    .orElse(null);

            if (network == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Network not found: " + targetSahakari));
            }

            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> u.getId() != id)
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> targetSahakari.equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Admin limit reached"));
            }
        }

        if (isBecomingMember || isMemberChangingSahakari) {
            String targetSahakari = updatedUser.getSahakari();
            Network network = networkRepo.findAll().stream()
                    .filter(n -> targetSahakari.equals(n.getName()))
                    .findFirst()
                    .orElse(null);

            if (network == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Network not found: " + targetSahakari));
            }

            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> u.getId() != id)
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> targetSahakari.equals(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Member limit reached"));
                }
            }
        }

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setSahakari(updatedUser.getSahakari());
        existingUser.setStatus(updatedUser.getStatus());

        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existingUser.setPassword(updatedUser.getPassword());
        }

        return ResponseEntity.ok(repo.save(existingUser));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable int id) {
        User user = repo.findById(id).orElseThrow();

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
        return ResponseEntity.ok(repo.save(user));
    }

    @PatchMapping("/{id}/reject")
    public User rejectUser(@PathVariable int id) {
        User user = repo.findById(id).orElseThrow();
        user.setStatus("Rejected");
        return repo.save(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable int id) {
        repo.deleteById(id);
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

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "role", user.getRole(),
                "sahakari", user.getSahakari(),
                "balance", user.getBalance() != null ? user.getBalance() : 0.0,
                "status", user.getStatus(),
                "hasPhoto", user.getPhotoData() != null,
                "hasCitizenship", user.getCitizenshipData() != null,
                "hasSignature", user.getSignatureData() != null));
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
}