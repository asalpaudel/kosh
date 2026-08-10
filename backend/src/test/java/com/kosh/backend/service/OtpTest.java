package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class OtpTest {

    @Test
    void codesAreSixDigitsAndCoverTheWholeRange() {
        Set<String> seen = new HashSet<>();
        boolean sawLowHalf = false;
        boolean sawHighHalf = false;

        for (int i = 0; i < 2000; i++) {
            String code = OneTimeCode.generate();
            assertThat(code).matches("\\d{6}");
            seen.add(code);
            int value = Integer.parseInt(code);
            sawLowHalf |= value < 500_000;
            sawHighHalf |= value >= 500_000;
        }

        assertThat(seen).hasSizeGreaterThan(1900); // not a repeating sequence
        assertThat(sawLowHalf && sawHighHalf).isTrue();
    }

    @Test
    void storedOtpIsSingleUse() {
        EmailService service = new EmailService();
        ReflectionTestUtils.setField(service, "passwordEncoder", new BCryptPasswordEncoder(4));
        String otp = service.generateOtp("member@example.test");

        assertThat(service.validateOtp("member@example.test", otp)).isTrue();
        assertThat(service.validateOtp("member@example.test", otp)).isFalse();
    }

    @Test
    void wrongOrUnknownOtpIsRejected() {
        EmailService service = new EmailService();
        ReflectionTestUtils.setField(service, "passwordEncoder", new BCryptPasswordEncoder(4));
        service.generateOtp("member@example.test");

        assertThat(service.validateOtp("member@example.test", "000000x")).isFalse();
        assertThat(service.validateOtp("member@example.test", null)).isFalse();
        assertThat(service.validateOtp("stranger@example.test", "123456")).isFalse();
    }
}
