package com.kosh.backend.dto;

import java.math.BigDecimal;

public final class NetworkRequests {

    private NetworkRequests() {
    }

    public record EncodedFile(String data, String filename, String contentType) {
    }

    public record Create(
            String registeredId,
            String name,
            String address,
            String createdAt,
            String phone,
            String panNumber,
            String packageType,
            BigDecimal packagePrice,
            Integer staffCount,
            Integer userCount,
            Integer adminLimit,
            Integer userLimit,
            EncodedFile document,
            EncodedFile logo) {
    }

    public record Update(
            String registeredId,
            String name,
            String address,
            String createdAt,
            String phone,
            String panNumber,
            String packageType,
            BigDecimal packagePrice,
            Integer staffCount,
            Integer userCount,
            Integer adminLimit,
            Integer userLimit) {
    }
}
