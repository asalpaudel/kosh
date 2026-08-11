package com.kosh.backend.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kosh.backend.service.MemberTransparencyService;
import com.kosh.backend.service.NetworkAccessService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/member-transparency")
public class MemberTransparencyController {
    private final MemberTransparencyService transparency;
    private final NetworkAccessService access;
    public MemberTransparencyController(MemberTransparencyService transparency, NetworkAccessService access) {
        this.transparency = transparency; this.access = access;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long networkId = (Long) session.getAttribute("sahakariId");
        Long memberId = (Long) session.getAttribute("userId");
        if (networkId == null || memberId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!access.canViewNetwork(networkId, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
        }
        try { return ResponseEntity.ok(transparency.overview(networkId, memberId)); }
        catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", exception.getMessage()));
        }
    }
}
