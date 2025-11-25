package com.kosh.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.HashMap;
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

    private final NetworkRepository networkRepository;

    private static final String UPLOAD_DIR = "uploads/network-documents/";

    public NetworkController(NetworkRepository networkRepository) {
        this.networkRepository = networkRepository;

        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            System.out.println("Upload directory created/verified: " + UPLOAD_DIR);
        } catch (IOException e) {
            System.err.println("Failed to create upload directory: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ⭐ Base64 Upload Endpoint
    @PostMapping("/base64")
    public ResponseEntity<?> createNetworkBase64(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("POST /api/networks/base64 hit!");

            Network network = new Network();

            network.setRegisteredId((String) payload.get("registeredId"));
            network.setName((String) payload.get("name"));
            network.setAddress((String) payload.get("address"));
            network.setCreatedAt((String) payload.get("createdAt"));
            network.setPhone((String) payload.get("phone"));
            network.setPanNumber((String) payload.get("panNumber"));
            network.setPackageType((String) payload.get("packageType"));

            network.setPackagePrice(((Number) payload.get("packagePrice")).doubleValue());
            network.setStaffCount(((Number) payload.get("staffCount")).intValue());
            network.setUserCount(((Number) payload.get("userCount")).intValue());
            network.setAdminLimit(((Number) payload.get("adminLimit")).intValue());
            network.setUserLimit(((Number) payload.get("userLimit")).intValue());

            // Handle Base64 document
            Map<String, String> documentData = (Map<String, String>) payload.get("document");
            if (documentData != null && documentData.get("data") != null) {
                byte[] documentBytes = Base64.getDecoder().decode(documentData.get("data"));
                String filename = documentData.get("filename");

                String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf(".")) : "";
                String unique = UUID.randomUUID().toString() + ext;

                Files.write(Paths.get(UPLOAD_DIR + unique), documentBytes);
                network.setDocumentPath(unique);
            }

            // Handle Base64 logo
            Map<String, String> logoData = (Map<String, String>) payload.get("logo");
            if (logoData != null && logoData.get("data") != null) {
                byte[] logoBytes = Base64.getDecoder().decode(logoData.get("data"));
                String filename = logoData.get("filename");

                String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf(".")) : "";
                String unique = UUID.randomUUID().toString() + ext;

                Files.write(Paths.get(UPLOAD_DIR + unique), logoBytes);
                network.setLogoPath(unique);
            }

            Network saved = networkRepository.save(network);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating network: " + e.getMessage());
        }
    }

    // ⭐ Multipart Upload
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
            Network network = new Network();

            network.setRegisteredId(registeredId);
            network.setName(name);
            network.setAddress(address);
            network.setCreatedAt(createdAt);
            network.setPhone(phone);
            network.setPanNumber(panNumber);
            network.setPackageType(packageType);

            network.setPackagePrice(Double.parseDouble(packagePrice));
            network.setStaffCount(Integer.parseInt(staffCount));
            network.setUserCount(Integer.parseInt(userCount));
            network.setAdminLimit(Integer.parseInt(adminLimit));
            network.setUserLimit(Integer.parseInt(userLimit));

            // Document file
            if (document != null && !document.isEmpty()) {
                String original = document.getOriginalFilename();
                String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
                String unique = UUID.randomUUID().toString() + ext;

                Files.copy(document.getInputStream(), Paths.get(UPLOAD_DIR + unique),
                        StandardCopyOption.REPLACE_EXISTING);

                network.setDocumentPath(unique);
            }

            // Logo file
            if (logo != null && !logo.isEmpty()) {
                String original = logo.getOriginalFilename();
                String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
                String unique = UUID.randomUUID().toString() + ext;

                Files.copy(logo.getInputStream(), Paths.get(UPLOAD_DIR + unique),
                        StandardCopyOption.REPLACE_EXISTING);

                network.setLogoPath(unique);
            }

            return ResponseEntity.ok(networkRepository.save(network));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating network: " + e.getMessage());
        }
    }

    // ⭐ Get All Networks
    @GetMapping
    public List<Network> getAllNetworks() {
        return networkRepository.findAll();
    }

    // ⭐ Get Network by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getNetworkById(@PathVariable Long id) {
        return networkRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Update Network
    @PutMapping("/{id}")
    public ResponseEntity<?> updateNetwork(
            @PathVariable Long id,
            @RequestBody Network updatedNetwork) {

        return networkRepository.findById(id).map(existing -> {

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

            return ResponseEntity.ok(networkRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Delete Network
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNetwork(@PathVariable Long id) {
        try {
            Network network = networkRepository.findById(id).orElse(null);
            if (network == null)
                return ResponseEntity.notFound().build();

            if (network.getDocumentPath() != null) {
                Files.deleteIfExists(Paths.get(UPLOAD_DIR + network.getDocumentPath()));
            }
            if (network.getLogoPath() != null) {
                Files.deleteIfExists(Paths.get(UPLOAD_DIR + network.getLogoPath()));
            }

            networkRepository.deleteById(id);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting network: " + e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getNetworkStats() {

        long total = networkRepository.count();
        long totalBasic = networkRepository.countByPackageType("basic");
        long totalPremium = networkRepository.countByPackageType("premium");
        long totalCustom = networkRepository.countByPackageType("custom");

        Map<String, Long> map = new HashMap<>();
        map.put("total", total);
        map.put("totalBasic", totalBasic);
        map.put("totalPremium", totalPremium);
        map.put("totalCustom", totalCustom);

        return ResponseEntity.ok(map);
    }

}