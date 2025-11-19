package com.kosh.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;

@RestController
@RequestMapping("/api/networks")
public class NetworkController {

    private final NetworkRepository repo;

    // Define upload directory (make sure this directory exists)
    private static final String UPLOAD_DIR = "uploads/network-documents/";

    public NetworkController(NetworkRepository repo) {
        this.repo = repo;
        // Create upload directory if it doesn't exist
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            System.out.println("Upload directory created/verified: " + UPLOAD_DIR);
        } catch (IOException e) {
            System.err.println("Failed to create upload directory: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ⭐ NEW ENDPOINT: Handle Base64 JSON uploads
    @PostMapping("/base64")
    public ResponseEntity<?> createNetworkBase64(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("POST /api/networks/base64 hit!");
            System.out.println("Creating network from Base64 data");

            Network network = new Network();
            
            // Set basic fields
            network.setRegisteredId((String) payload.get("registeredId"));
            network.setName((String) payload.get("name"));
            network.setAddress((String) payload.get("address"));
            network.setCreatedAt((String) payload.get("createdAt"));
            network.setPhone((String) payload.get("phone"));
            network.setPanNumber((String) payload.get("panNumber"));
            network.setPackageType((String) payload.get("packageType"));
            
            // Parse numeric fields
            network.setPackagePrice(((Number) payload.get("packagePrice")).doubleValue());
            network.setStaffCount(((Number) payload.get("staffCount")).intValue());
            network.setUserCount(((Number) payload.get("userCount")).intValue());
            network.setAdminLimit(((Number) payload.get("adminLimit")).intValue());
            network.setUserLimit(((Number) payload.get("userLimit")).intValue());

            System.out.println("Limits set - Admin: " + network.getAdminLimit() + ", User: " + network.getUserLimit());

            // Decode Base64 document and save as file
            Map<String, String> documentData = (Map<String, String>) payload.get("document");
            if (documentData != null && documentData.get("data") != null) {
                byte[] documentBytes = Base64.getDecoder().decode(documentData.get("data"));
                String filename = documentData.get("filename");
                
                // Get file extension
                String fileExtension = "";
                int dotIndex = filename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = filename.substring(dotIndex);
                }
                
                // Generate unique filename
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
                Path documentPath = Paths.get(UPLOAD_DIR + uniqueFilename);
                
                // Write bytes to file
                Files.write(documentPath, documentBytes);
                network.setDocumentPath(uniqueFilename);
                
                System.out.println("Document saved: " + uniqueFilename);
            }

            // Decode Base64 logo and save as file
            Map<String, String> logoData = (Map<String, String>) payload.get("logo");
            if (logoData != null && logoData.get("data") != null) {
                byte[] logoBytes = Base64.getDecoder().decode(logoData.get("data"));
                String filename = logoData.get("filename");
                
                // Get file extension
                String fileExtension = "";
                int dotIndex = filename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = filename.substring(dotIndex);
                }
                
                // Generate unique filename
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
                Path logoPath = Paths.get(UPLOAD_DIR + uniqueFilename);
                
                // Write bytes to file
                Files.write(logoPath, logoBytes);
                network.setLogoPath(uniqueFilename);
                
                System.out.println("Logo saved: " + uniqueFilename);
            }

            // Save to database
            Network saved = repo.save(network);
            System.out.println("Network saved with ID: " + saved.getId());

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            System.err.println("Error creating network from Base64: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating network: " + e.getMessage());
        }
    }

    // Original MultipartFile endpoint
    @PostMapping
    public ResponseEntity<?> createNetwork(
            @RequestParam("registeredId") String registeredId,
            @RequestParam("name") String name,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "createdAt", required = false) String createdAt,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "panNumber", required = false) String panNumber,
            @RequestParam("packageType") String packageType,
            @RequestParam("packagePrice") String packagePrice,
            @RequestParam("staffCount") String staffCount,
            @RequestParam("userCount") String userCount,
            @RequestParam("adminLimit") String adminLimit,
            @RequestParam("userLimit") String userLimit,
            @RequestParam(value = "document", required = false) MultipartFile document,
            @RequestParam(value = "logo", required = false) MultipartFile logo) {

        try {
            System.out.println("POST /api/networks hit!");
            System.out.println("Creating network: " + name);
            System.out.println("Package: " + packageType + " - Price: रु" + packagePrice);
            System.out.println("Staff Count: " + staffCount + ", User Count: " + userCount);
            System.out.println("Received Admin Limit: " + adminLimit + ", User Limit: " + userLimit);

            Network network = new Network();
            network.setRegisteredId(registeredId);
            network.setName(name);
            network.setAddress(address);
            network.setCreatedAt(createdAt);
            network.setPhone(phone);
            network.setPanNumber(panNumber);
            network.setPackageType(packageType);

            // Parse packagePrice safely
            try {
                network.setPackagePrice(Double.parseDouble(packagePrice));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid package price format");
            }

            // Parse staffCount and userCount safely
            try {
                network.setStaffCount(Integer.parseInt(staffCount));
                network.setUserCount(Integer.parseInt(userCount));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid staff or user count format");
            }

            // Parse and SET adminLimit and userLimit safely
            try {
                int parsedAdminLimit = Integer.parseInt(adminLimit);
                int parsedUserLimit = Integer.parseInt(userLimit);
                network.setAdminLimit(parsedAdminLimit);
                network.setUserLimit(parsedUserLimit);
                System.out.println("Limits set - Admin: " + parsedAdminLimit + ", User: " + parsedUserLimit);
            } catch (NumberFormatException e) {
                System.err.println("Error parsing limits: " + e.getMessage());
                return ResponseEntity.badRequest().body("Invalid admin or user limit format");
            }

            // Handle document upload
            if (document != null && !document.isEmpty()) {
                String originalFilename = document.getOriginalFilename();
                System.out.println("Document received: " + originalFilename);

                // Validate file
                if (originalFilename == null || originalFilename.isEmpty()) {
                    return ResponseEntity.badRequest().body("Invalid file name");
                }

                // Get file extension
                String fileExtension = "";
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = originalFilename.substring(dotIndex);
                }

                // Generate unique filename
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

                // Save file to disk
                Path uploadPath = Paths.get(UPLOAD_DIR + uniqueFilename);
                Files.copy(document.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);

                network.setDocumentPath(uniqueFilename);
                System.out.println("Document uploaded successfully: " + uniqueFilename);
            } else {
                System.out.println("No document uploaded");
            }

            // Handle logo upload
            if (logo != null && !logo.isEmpty()) {
                String originalFilename = logo.getOriginalFilename();
                System.out.println("Logo received: " + originalFilename);

                // Validate file
                if (originalFilename == null || originalFilename.isEmpty()) {
                    return ResponseEntity.badRequest().body("Invalid logo file name");
                }

                // Get file extension
                String fileExtension = "";
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = originalFilename.substring(dotIndex);
                }

                // Generate unique filename
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

                // Save file to disk
                Path uploadPath = Paths.get(UPLOAD_DIR + uniqueFilename);
                Files.copy(logo.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);

                network.setLogoPath(uniqueFilename);
                System.out.println("Logo uploaded successfully: " + uniqueFilename);
            } else {
                System.out.println("No logo uploaded");
            }

            // Verify all values before saving
            System.out.println("About to save network with:");
            System.out.println("  - Admin Limit: " + network.getAdminLimit());
            System.out.println("  - User Limit: " + network.getUserLimit());
            System.out.println("  - Staff Count: " + network.getStaffCount());
            System.out.println("  - User Count: " + network.getUserCount());

            Network saved = repo.save(network);
            System.out.println("Network saved with ID: " + saved.getId());

            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            System.err.println("Error saving file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error uploading document: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error creating network: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating network: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Network> getAllNetworks() {
        System.out.println("GET /api/networks hit!");
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNetworkById(@PathVariable Long id) {
        System.out.println("GET /api/networks/" + id + " hit!");
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNetwork(
            @PathVariable Long id,
            @RequestBody Network updatedNetwork) {

        System.out.println("PUT /api/networks/" + id + " hit!");

        return repo.findById(id)
                .map(existing -> {
                    existing.setRegisteredId(updatedNetwork.getRegisteredId());
                    existing.setName(updatedNetwork.getName());
                    existing.setAddress(updatedNetwork.getAddress());
                    existing.setCreatedAt(updatedNetwork.getCreatedAt());
                    existing.setPhone(updatedNetwork.getPhone());
                    existing.setPanNumber(updatedNetwork.getPanNumber());
                    existing.setPackageType(updatedNetwork.getPackageType());
                    existing.setPackagePrice(updatedNetwork.getPackagePrice());
                    existing.setStaffCount(updatedNetwork.getStaffCount());
                    existing.setUserCount(updatedNetwork.getUserCount());
                    existing.setAdminLimit(updatedNetwork.getAdminLimit());
                    existing.setUserLimit(updatedNetwork.getUserLimit());
                    // Note: Document is not updated here (would need separate endpoint for that)

                    Network saved = repo.save(existing);
                    System.out.println("Network updated with ID: " + saved.getId());
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> {
                    System.out.println("Network not found with ID: " + id);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNetwork(@PathVariable Long id) {
        System.out.println("DELETE /api/networks/" + id + " hit!");

        try {
            // Find the network first to get document path
            Network network = repo.findById(id).orElse(null);

            if (network == null) {
                System.out.println("Network not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }

            // Delete associated document file if it exists
            if (network.getDocumentPath() != null && !network.getDocumentPath().isEmpty()) {
                try {
                    Path filePath = Paths.get(UPLOAD_DIR + network.getDocumentPath());
                    boolean deleted = Files.deleteIfExists(filePath);
                    if (deleted) {
                        System.out.println("Document file deleted: " + network.getDocumentPath());
                    } else {
                        System.out.println("Document file not found: " + network.getDocumentPath());
                    }
                } catch (IOException e) {
                    System.err.println("Error deleting document file: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            // Delete associated logo file if it exists
            if (network.getLogoPath() != null && !network.getLogoPath().isEmpty()) {
                try {
                    Path filePath = Paths.get(UPLOAD_DIR + network.getLogoPath());
                    boolean deleted = Files.deleteIfExists(filePath);
                    if (deleted) {
                        System.out.println("Logo file deleted: " + network.getLogoPath());
                    } else {
                        System.out.println("Logo file not found: " + network.getLogoPath());
                    }
                } catch (IOException e) {
                    System.err.println("Error deleting logo file: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            // Delete the network from database
            repo.deleteById(id);
            System.out.println("Network deleted with ID: " + id);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("Error deleting network: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error deleting network: " + e.getMessage());
        }
    }
}