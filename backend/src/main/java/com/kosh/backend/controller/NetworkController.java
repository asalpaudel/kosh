package com.kosh.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
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
            @RequestParam(value = "document", required = false) MultipartFile document) {
        
        try {
            System.out.println("POST /api/networks hit!");
            System.out.println("Creating network: " + name);
            System.out.println("Package: " + packageType + " - Price: रु" + packagePrice);
            System.out.println("Staff Count: " + staffCount + ", User Count: " + userCount);
            
            Network network = new Network();
            network.setRegisteredId(registeredId);
            network.setName(name);
            network.setAddress(address);
            network.setCreatedAt(createdAt);
            network.setPhone(phone);
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
                    existing.setPackageType(updatedNetwork.getPackageType());
                    existing.setPackagePrice(updatedNetwork.getPackagePrice());
                    existing.setStaffCount(updatedNetwork.getStaffCount());
                    existing.setUserCount(updatedNetwork.getUserCount());
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