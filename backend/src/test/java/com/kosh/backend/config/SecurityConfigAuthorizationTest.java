package com.kosh.backend.config;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(SecurityConfigAuthorizationTest.TestApiController.class)
@Import({
    SecurityConfig.class,
    SecurityConfigAuthorizationTest.TestApiController.class
})
class SecurityConfigAuthorizationTest {

    @Autowired
    private org.springframework.test.web.servlet.MockMvc mockMvc;

    @Test
    void publicCooperativeCatalogueRemainsAvailable() throws Exception {
        mockMvc.perform(get("/api/networks"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Permissions-Policy",
                        "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .andExpect(header().string("Content-Security-Policy",
                        "default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"));
    }

    @Test
    void anonymousMutationIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/networks").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void mutationWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/transactions").session(session("admin")))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginWithCsrfTokenIsAllowed() throws Exception {
        mockMvc.perform(post("/api/auth/login").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void memberCannotPostTransactions() throws Exception {
        mockMvc.perform(post("/api/transactions").with(csrf()).session(session("member")))
                .andExpect(status().isForbidden());
    }

    @Test
    void administratorCanPostTransactions() throws Exception {
        mockMvc.perform(post("/api/transactions").with(csrf()).session(session("admin")))
                .andExpect(status().isOk());
    }

    @Test
    void superAdministratorCanManageCooperatives() throws Exception {
        mockMvc.perform(post("/api/networks").with(csrf()).session(session("superadmin")))
                .andExpect(status().isOk());
    }

    @Test
    void memberCanReadOwnServerBackedProfile() throws Exception {
        mockMvc.perform(get("/api/users/me").session(session("member")))
                .andExpect(status().isOk());
    }

    @Test
    void memberCannotReadAnotherUserById() throws Exception {
        mockMvc.perform(get("/api/users/17").session(session("member")))
                .andExpect(status().isForbidden());
    }

    @Test
    void cooperativeUserCannotReadRegistrationDocument() throws Exception {
        mockMvc.perform(get("/api/networks/17/document").session(session("admin")))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdministratorCanReadRegistrationDocument() throws Exception {
        mockMvc.perform(get("/api/networks/17/document").session(session("superadmin")))
                .andExpect(status().isOk());
    }

    @Test
    void onlySuperAdministratorCanReadPlatformDashboardData() throws Exception {
        mockMvc.perform(get("/api/networks/recent").session(session("admin")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/analytics/network-snapshot").session(session("admin")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/networks/recent").session(session("superadmin")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/analytics/network-snapshot").session(session("superadmin")))
                .andExpect(status().isOk());
    }

    @Test
    void administratorCannotCallSuperAdminUpdateCommand() throws Exception {
        mockMvc.perform(put("/api/users/17/superadmin").with(csrf()).session(session("admin")))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdministratorCanCallSuperAdminUpdateCommand() throws Exception {
        mockMvc.perform(put("/api/users/17/superadmin").with(csrf()).session(session("superadmin")))
                .andExpect(status().isOk());
    }

    @Test
    void auditorCanOnlyReadAuditSurface() throws Exception {
        MockHttpSession auditor = session("auditor");
        mockMvc.perform(get("/api/audit/network/17/overview").session(auditor))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/transactions").session(auditor))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/transactions").with(csrf()).session(auditor))
                .andExpect(status().isForbidden());
    }

    private MockHttpSession session(String role) {
        var session = new MockHttpSession();
        session.setAttribute("userEmail", role + "@example.test");
        session.setAttribute("userRole", role);
        return session;
    }

    @RestController
    static class TestApiController {
        @GetMapping("/api/networks")
        String networks() {
            return "ok";
        }

        @PostMapping("/api/networks")
        String createNetwork() {
            return "ok";
        }

        @PostMapping("/api/transactions")
        String createTransaction() {
            return "ok";
        }

        @PostMapping("/api/auth/login")
        String login() {
            return "ok";
        }

        @GetMapping("/api/users/me")
        String currentUser() {
            return "ok";
        }

        @GetMapping("/api/users/{id}")
        String userById(@PathVariable int id) {
            return Integer.toString(id);
        }

        @GetMapping("/api/networks/{id}/document")
        String document(@PathVariable int id) {
            return Integer.toString(id);
        }

        @GetMapping("/api/networks/recent")
        String recentNetworks() {
            return "ok";
        }

        @GetMapping("/api/analytics/network-snapshot")
        String networkSnapshot() {
            return "ok";
        }

        @org.springframework.web.bind.annotation.PutMapping("/api/users/{id}/superadmin")
        String updateUserAsSuperAdmin(@PathVariable int id) {
            return Integer.toString(id);
        }

        @GetMapping("/api/audit/network/{id}/overview")
        String auditOverview(@PathVariable int id) {
            return Integer.toString(id);
        }
    }
}
