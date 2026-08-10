package com.kosh.backend.service;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

@Service
public class NetworkAccessService {

    public boolean canViewNetwork(Long networkId, HttpSession session) {
        if (isSuperAdmin(session)) return true;
        Long actorNetworkId = (Long) session.getAttribute("sahakariId");
        return actorNetworkId != null && actorNetworkId.equals(networkId);
    }

    public boolean canViewRegistrationDocument(HttpSession session) {
        return isSuperAdmin(session);
    }

    private boolean isSuperAdmin(HttpSession session) {
        return "superadmin".equalsIgnoreCase((String) session.getAttribute("userRole"));
    }
}
