package com.kosh.backend.service;

import org.springframework.stereotype.Service;

import com.kosh.backend.model.Network;

import jakarta.servlet.http.HttpSession;

@Service
public class NetworkAccessService {

    public boolean canViewNetwork(Long networkId, HttpSession session) {
        if (networkId == null) return false;
        if (isSuperAdmin(session)) return true;
        Long actorNetworkId = (Long) session.getAttribute("sahakariId");
        return actorNetworkId != null && actorNetworkId.equals(networkId);
    }

    /**
     * Tenant guard for an entity that carries a network reference. Returns true when the
     * entity is missing or belongs to a cooperative the session may not touch, so callers
     * can reject with 403 without repeating the null handling.
     */
    public boolean isForeign(Network network, HttpSession session) {
        return network == null || !canViewNetwork(network.getId(), session);
    }

    public boolean canViewRegistrationDocument(HttpSession session) {
        return isSuperAdmin(session);
    }

    private boolean isSuperAdmin(HttpSession session) {
        return "superadmin".equalsIgnoreCase((String) session.getAttribute("userRole"));
    }
}
