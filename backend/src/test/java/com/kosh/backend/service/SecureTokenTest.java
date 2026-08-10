package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecureTokenTest {

    @Test
    void bearerTokenIsRandomAndOnlyItsVerifierNeedsStorage() {
        String first = SecureToken.generate();
        String second = SecureToken.generate();
        String verifier = SecureToken.verifier(first);

        assertThat(first).hasSizeGreaterThanOrEqualTo(40).isNotEqualTo(second);
        assertThat(verifier).isNotEqualTo(first);
        assertThat(SecureToken.matches(first, verifier)).isTrue();
        assertThat(SecureToken.matches(second, verifier)).isFalse();
    }
}
