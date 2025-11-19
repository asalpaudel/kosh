package com.kosh.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.util.SessionUtil;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/networks")
public class NetworkController {

    private final NetworkRepository repo;
    private static final String UPLOAD_DIR = "uploads/network-documents/";

    public NetworkController(NetworkRepository repo) {
        this.repo = repo;
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            System.out.println("Upload directory created/verified: " + UPLOAD_DIR);
        } catch (IOException e) {
            System.err.println("Failed to create upload directory: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PostMapping
    public ResponseEntity<?> createNetwork(
            @RequestParam("registeredId") String registeredId,
            @RequestParam("name") String name,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "createdAt", required = false) String createdAt,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam("packageType") String packageType,
            @RequestParam("packagePrice") String packagePrice,
            @RequestParam("staffCount") String staffCount,
            @RequestParam("userCount") String userCount,
            @RequestParam("adminLimit") String adminLimit,
            @RequestParam("userLimit") String userLimit,
            @RequestParam(value = "document", required = false) MultipartFile document,
            HttpSession session) {

        // Only superadmin can create networks
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can create networks"));
        }

        try {
            System.out.println("POST /api/networks hit by: " + SessionUtil.getUserEmail(session));
            System.out.println("Creating network: " + name);

            Network network = new Network();
            network.setRegisteredId(registeredId);
            network.setName(name);
            network.setAddress(address);
            network.setCreatedAt(createdAt);
            network.setPhone(phone);
            network.setPackageType(packageType);

            try {
                network.setPackagePrice(Double.parseDouble(packagePrice));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid package price format"));
            }

            try {
                network.setStaffCount(Integer.parseInt(staffCount));
                network.setUserCount(Integer.parseInt(userCount));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid staff or user count format"));
            }

            try {
                int parsedAdminLimit = Integer.parseInt(adminLimit);
                int parsedUserLimit = Integer.parseInt(userLimit);
                network.setAdminLimit(parsedAdminLimit);
                network.setUserLimit(parsedUserLimit);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid admin or user limit format"));
            }

            if (document != null && !document.isEmpty()) {
                String originalFilename = document.getOriginalFilename();
                if (originalFilename == null || originalFilename.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
                }

                String fileExtension = "";
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = originalFilename.substring(dotIndex);
                }

                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
                Path uploadPath = Paths.get(UPLOAD_DIR + uniqueFilename);
                Files.copy(document.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);

                network.setDocumentPath(uniqueFilename);
                System.out.println("Document uploaded successfully: " + uniqueFilename);
            }

            Network saved = repo.save(network);
            System.out.println("Network saved with ID: " + saved.getId());

            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            System.err.println("Error saving file: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Error uploading document: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error creating network: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating network: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllNetworks(HttpSession session) {
        // Only superadmin can view all networks
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can view networks"));
        }

        System.out.println("GET /api/networks by: " + SessionUtil.getUserEmail(session));
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNetworkById(@PathVariable Long id, HttpSession session) {
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can view network details"));
        }

        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNetwork(
            @PathVariable Long id,
            @RequestBody Network updatedNetwork,
            HttpSession session) {

        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can update networks"));
        }

        return repo.findById(id)
                .map(existing -> {
                    existing.setRegisteredId(updatedNetwork.getRegisteredId());
                    existing.setName(updatedNetwork.getName());
                    existing.setAddress(updatedNetwork.getAddress());
                    existing.setCreatedAt(updatedNetwork.getCreatedAt());
                    existing.setPhone(updatedNetwork.getPhone());
                    existing.setPackageType(updatedNetwork.getPackageType());
                    existing.setPackagePrice(updatedNetwork.getPackagePrice());
                    existing.setStaffCount(updatedNetwork.getStaffCount());
                    existing.setUserCount(updatedNetwork.getUserCount());
                    existing.setAdminLimit(updatedNetwork.getAdminLimit());
                    existing.setUserLimit(updatedNetwork.getUserLimit());

                    Network saved = repo.save(existing);
                    System.out.println("Network updated with ID: " + saved.getId());
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNetwork(@PathVariable Long id, HttpSession session) {
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can delete networks"));
        }

        try {
            Network network = repo.findById(id).orElse(null);

            if (network == null) {
                return ResponseEntity.notFound().build();
            }

            if (network.getDocumentPath() != null && !network.getDocumentPath().isEmpty()) {
                try {
                    Path filePath = Paths.get(UPLOAD_DIR + network.getDocumentPath());
                    Files.deleteIfExists(filePath);
                } catch (IOException e) {
                    System.err.println("Error deleting document file: " + e.getMessage());
                }
            }

            repo.deleteById(id);
            System.out.println("Network deleted with ID: " + id);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("Error deleting network: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Error deleting network: " + e.getMessage()));
        }
    }
}