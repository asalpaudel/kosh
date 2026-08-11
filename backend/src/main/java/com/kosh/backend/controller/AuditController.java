package com.kosh.backend.controller;

import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.AuditPackService;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditPackService audit;
    private final NetworkRepository networks;
    private final NetworkAccessService access;
    public AuditController(AuditPackService audit, NetworkRepository networks, NetworkAccessService access) {
        this.audit = audit; this.networks = networks; this.access = access;
    }

    @GetMapping("/network/{networkId}/overview")
    public ResponseEntity<?> overview(@PathVariable Long networkId, HttpSession session) {
        Network network = authorised(networkId, session);
        return network == null ? denied(networkId, session) : ResponseEntity.ok(audit.overview(network));
    }

    @GetMapping("/network/{networkId}/pack")
    public ResponseEntity<?> pack(@PathVariable Long networkId, HttpSession session) {
        Network network = authorised(networkId, session);
        if (network == null) return denied(networkId, session);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("kosh-audit-pack-" + networkId + ".zip").build());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType("application/zip"))
                .body(audit.export(network));
    }

    private Network authorised(Long id, HttpSession session) {
        if (!access.canViewNetwork(id, session)) return null;
        return networks.findById(id).orElse(null);
    }

    private ResponseEntity<?> denied(Long id, HttpSession session) {
        return access.canViewNetwork(id, session) ? ResponseEntity.notFound().build()
                : ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }
}
