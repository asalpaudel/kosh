package com.kosh.backend.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ProductionSecurityValidatorTest {

    @Test
    void acceptsExactHttpsOriginsAndFailClosedSuperadmin() {
        ProductionSecurityValidator validator = validator("https://app.kosh.example", true, true, "", "");
        assertDoesNotThrow(validator::validate);
    }

    @Test
    void rejectsWildcardOrInsecureProductionOrigins() {
        assertThrows(IllegalStateException.class,
                () -> validator("*", true, true, "", "").validate());
        assertThrows(IllegalStateException.class,
                () -> validator("http://app.kosh.example", true, true, "", "").validate());
    }

    @Test
    void rejectsPartialOrPlaintextSuperadminConfiguration() {
        assertThrows(IllegalStateException.class,
                () -> validator("https://app.kosh.example", true, true,
                        "admin@example.test", "").validate());
        assertThrows(IllegalStateException.class,
                () -> validator("https://app.kosh.example", true, true,
                        "admin@example.test", "plaintext").validate());
    }

    @Test
    void rejectsDisabledCookieAndSecondFactorControls() {
        assertThrows(IllegalStateException.class,
                () -> validator("https://app.kosh.example", false, true, "", "").validate());
        assertThrows(IllegalStateException.class,
                () -> validator("https://app.kosh.example", true, false, "", "").validate());
    }

    private ProductionSecurityValidator validator(String origins, boolean secureCookie,
            boolean twoFactor, String superadminEmail, String superadminHash) {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "allowedOrigins", origins);
        ReflectionTestUtils.setField(validator, "secureCookie", secureCookie);
        ReflectionTestUtils.setField(validator, "memberTwoFactorEnabled", twoFactor);
        ReflectionTestUtils.setField(validator, "superadminEmail", superadminEmail);
        ReflectionTestUtils.setField(validator, "superadminPasswordHash", superadminHash);
        return validator;
    }
}
