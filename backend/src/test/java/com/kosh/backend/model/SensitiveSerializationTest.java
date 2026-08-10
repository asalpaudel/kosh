package com.kosh.backend.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class SensitiveSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void userSecretsAndIdentityDocumentsAreNeverSerialized() throws Exception {
        var user = new User();
        user.setName("Visible Name");
        user.setPassword("password-hash");
        user.setTwoFactorCode("otp-value");
        user.setTrustedDeviceToken("trusted-token");
        user.setPhotoData(new byte[] {1});
        user.setCitizenshipData(new byte[] {2});
        user.setSignatureData(new byte[] {3});

        String json = objectMapper.writeValueAsString(user);

        assertThat(json).contains("Visible Name");
        assertThat(json).doesNotContain(
                "password-hash",
                "otp-value",
                "trusted-token",
                "photoData",
                "citizenshipData",
                "signatureData");
    }
}
