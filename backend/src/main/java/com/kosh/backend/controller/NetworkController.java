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
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/networks")
public class NetworkController {

    private final NetworkRepository networkRepository;
    private final ActivityLogRepository logRepo;
    private final NetworkAccessService networkAccessService;

    public NetworkController(NetworkRepository networkRepository, ActivityLogRepository logRepo,
            NetworkAccessService networkAccessService) {
        this.networkRepository = networkRepository;
        this.logRepo = logRepo;
        this.networkAccessService = networkAccessService;
    }

    // ⭐ Base64 Upload Endpoint
    @PostMapping("/base64")
    public ResponseEntity<?> createNetworkBase64(@RequestBody Map<String, Object> payload) {
        try {
            Network network = new Network();

            network.setRegisteredId((String) payload.get("registeredId"));
            network.setName((String) payload.get("name"));
            network.setAddress((String) payload.get("address"));
            network.setCreatedAt((String) payload.get("createdAt"));
            network.setPhone((String) payload.get("phone"));
            network.setPanNumber((String) payload.get("panNumber"));
            network.setPackageType((String) payload.get("packageType"));

            network.setPackagePrice(Money.of(payload.get("packagePrice")));
            network.setStaffCount(((Number) payload.get("staffCount")).intValue());
            network.setUserCount(((Number) payload.get("userCount")).intValue());
            network.setAdminLimit(((Number) payload.get("adminLimit")).intValue());
            network.setUserLimit(((Number) payload.get("userLimit")).intValue());

            // Handle Base64 document
            Map<String, String> documentData = (Map<String, String>) payload.get("document");
            if (documentData != null && documentData.get("data") != null) {
                byte[] documentBytes = Base64.getDecoder().decode(documentData.get("data"));
                network.setDocumentData(documentBytes);
                network.setDocumentName(documentData.get("filename"));
                network.setDocumentType(documentData.get("type")); // MIME type
            }

            // Handle Base64 logo
            Map<String, String> logoData = (Map<String, String>) payload.get("logo");
            if (logoData != null && logoData.get("data") != null) {
                byte[] logoBytes = Base64.getDecoder().decode(logoData.get("data"));
                network.setLogoData(logoBytes);
                network.setLogoName(logoData.get("filename"));
                network.setLogoType(logoData.get("type")); // MIME type
            }

            Network saved = networkRepository.save(network);

            try {
                ActivityLog log = new ActivityLog(
                    "Super Admin", 
                    "superadmin", 
                    saved.getId(), 
                    "CREATE_NETWORK", 
                    "Created new network: " + saved.getName() + " (" + saved.getPackageType() + ")"
                );
                logRepo.save(log);
            } catch (Exception e) {
                System.out.println("Failed to log network creation: " + e.getMessage());
            }

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

            network.setPackagePrice(Money.of(packagePrice));
            network.setStaffCount(Integer.parseInt(staffCount));
            network.setUserCount(Integer.parseInt(userCount));
            network.setAdminLimit(Integer.parseInt(adminLimit));
            network.setUserLimit(Integer.parseInt(userLimit));

            // Store document as binary
            if (document != null && !document.isEmpty()) {
                network.setDocumentData(document.getBytes());
                network.setDocumentName(document.getOriginalFilename());
                network.setDocumentType(document.getContentType());
            }

            // Store logo as binary
            if (logo != null && !logo.isEmpty()) {
                network.setLogoData(logo.getBytes());
                network.setLogoName(logo.getOriginalFilename());
                network.setLogoType(logo.getContentType());
            }

            Network saved = networkRepository.save(network);

            try {
                ActivityLog log = new ActivityLog(
                    "Super Admin", 
                    "superadmin", 
                    saved.getId(), 
                    "CREATE_NETWORK", 
                    "Created new network: " + saved.getName() + " (" + saved.getPackageType() + ")"
                );
                logRepo.save(log);
            } catch (Exception e) {
                System.out.println("Failed to log network creation: " + e.getMessage());
            }

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating network: " + e.getMessage());
        }
    }

    // ⭐ Get All Networks (exclude binary data for performance)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllNetworks() {
        List<Map<String, Object>> networks = networkRepository.findAll().stream()
            .map(this::mapNetworkWithoutBinaryData)
            .collect(Collectors.toList());
        return ResponseEntity.ok(networks);
    }

    // ⭐ Get Network by ID (exclude binary data)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getNetworkById(@PathVariable Long id, HttpSession session) {
        if (!networkAccessService.canViewNetwork(id, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return networkRepository.findById(id)
                .map(network -> ResponseEntity.ok(mapNetworkWithoutBinaryData(network)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Download Document
    @GetMapping("/{id}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id, HttpSession session) {
        if (!networkAccessService.canViewRegistrationDocument(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return networkRepository.findById(id)
                .filter(network -> network.getDocumentData() != null)
                .map(network -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(network.getDocumentType()));
                    headers.setContentDisposition(
                        ContentDisposition.attachment()
                            .filename(network.getDocumentName())
                            .build()
                    );
                    return new ResponseEntity<>(network.getDocumentData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Download Logo
    @GetMapping("/{id}/logo")
    public ResponseEntity<byte[]> downloadLogo(@PathVariable Long id) {
        return networkRepository.findById(id)
                .filter(network -> network.getLogoData() != null)
                .map(network -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(network.getLogoType()));
                    headers.setContentDisposition(
                        ContentDisposition.inline()
                            .filename(network.getLogoName())
                            .build()
                    );
                    return new ResponseEntity<>(network.getLogoData(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Document as Base64 (for frontend display)
    @GetMapping("/{id}/document/base64")
    public ResponseEntity<?> getDocumentBase64(@PathVariable Long id, HttpSession session) {
        if (!networkAccessService.canViewRegistrationDocument(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return networkRepository.findById(id)
                .filter(network -> network.getDocumentData() != null)
                .map(network -> {
                    String base64 = Base64.getEncoder().encodeToString(network.getDocumentData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", network.getDocumentName());
                    response.put("type", network.getDocumentType());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Get Logo as Base64 (for frontend display)
    @GetMapping("/{id}/logo/base64")
    public ResponseEntity<?> getLogoBase64(@PathVariable Long id) {
        return networkRepository.findById(id)
                .filter(network -> network.getLogoData() != null)
                .map(network -> {
                    String base64 = Base64.getEncoder().encodeToString(network.getLogoData());
                    Map<String, String> response = new HashMap<>();
                    response.put("data", base64);
                    response.put("filename", network.getLogoName());
                    response.put("type", network.getLogoType());
                    return ResponseEntity.ok(response);
                })
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

            Network saved = networkRepository.save(existing);

            try {
                ActivityLog log = new ActivityLog(
                    "Super Admin", 
                    "superadmin", 
                    saved.getId(), 
                    "UPDATE_NETWORK", 
                    "Updated network: " + saved.getName()
                );
                logRepo.save(log);
            } catch (Exception e) {
                System.out.println("Failed to log network update: " + e.getMessage());
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ⭐ Delete Network
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNetwork(@PathVariable Long id) {
        if (!networkRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            String networkName = networkRepository.findById(id).map(Network::getName).orElse("Unknown Network");
            
            ActivityLog log = new ActivityLog(
                "Super Admin", 
                "superadmin", 
                id, 
                "DELETE_NETWORK", 
                "Deleted network: " + networkName + " (ID: " + id + ")"
            );
            logRepo.save(log);
        } catch (Exception e) {
            System.out.println("Failed to log network deletion: " + e.getMessage());
        }

        networkRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ⭐ Network Stats
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

    // ⭐ Helper method to map network without binary data
    private Map<String, Object> mapNetworkWithoutBinaryData(Network network) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", network.getId());
        map.put("registeredId", network.getRegisteredId());
        map.put("name", network.getName());
        map.put("address", network.getAddress());
        map.put("createdAt", network.getCreatedAt());
        map.put("phone", network.getPhone());
        map.put("panNumber", network.getPanNumber());
        map.put("packageType", network.getPackageType());
        map.put("packagePrice", network.getPackagePrice());
        map.put("staffCount", network.getStaffCount());
        map.put("userCount", network.getUserCount());
        map.put("adminLimit", network.getAdminLimit());
        map.put("userLimit", network.getUserLimit());
        
        // Include file metadata only, not actual binary data
        map.put("hasDocument", network.getDocumentData() != null);
        map.put("documentName", network.getDocumentName());
        map.put("documentType", network.getDocumentType());
        map.put("hasLogo", network.getLogoData() != null);
        map.put("logoName", network.getLogoName());
        map.put("logoType", network.getLogoType());
        
        return map;
    }
}
