package com.templedrop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AdminDtos {
    private AdminDtos() {}

    public record LoginRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password
    ) {}

    public record AdminSessionResponse(
        boolean authenticated,
        String username,
        String token
    ) {}

    public record ProviderConfigRequest(
        @NotBlank(message = "Provider name is required") String name,
        @NotBlank(message = "Provider code is required") String providerCode,
        @NotBlank(message = "Provider API URL is required") String providerApiUrl,
        String gameServerApiKey,
        String gameCode,
        String currency,
        Boolean enabled,
        Boolean isDefault,
        String notes
    ) {}

    public record ProviderConfigResponse(
        String id,
        String name,
        String providerCode,
        String providerApiUrl,
        String maskedApiKey,
        boolean hasApiKey,
        String gameCode,
        String currency,
        boolean enabled,
        boolean isDefault,
        String notes,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record PublicProviderConfigResponse(
        boolean enabled,
        String providerCode,
        String providerName,
        String providerApiUrl,
        String gameCode,
        String currency
    ) {}

    public record AdminStatsResponse(
        long totalUsers,
        long totalRounds,
        long totalProviders,
        long activeProviders,
        long totalWageredCents,
        long totalPayoutCents
    ) {}

    public record AdminRoundSummary(
        String id,
        String roundId,
        String type,
        long totalBetCents,
        long totalPayoutCents,
        int ballCount,
        Instant createdAt
    ) {}

    public record CreatePlayerRequest(
        @NotBlank(message = "Email or username is required") String email,
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters") String password,
        @Min(value = 0, message = "Initial balance cannot be negative") Long initialBalanceCents,
        String avatarId
    ) {}

    public record AdminWalletAdjustRequest(
        @NotBlank(message = "Action is required (CREDIT, DEBIT, SET)") String action,
        @Min(value = 0, message = "Amount cannot be negative") long amountCents,
        String reason
    ) {}

    public record ResetPlayerPasswordRequest(
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {}

    public record AdminPlayerSummary(
        String id,
        String email,
        boolean isGuest,
        String avatarId,
        long balanceCents,
        long initialCents,
        Instant createdAt
    ) {}
}
