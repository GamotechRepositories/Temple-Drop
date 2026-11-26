package com.templedrop.dto;

import com.templedrop.model.UserDocument;
import com.templedrop.model.WalletDocument;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
        @NotBlank(message = "Valid email and password are required")
        @Email(message = "Valid email and password are required")
        String email,

        @NotBlank(message = "Valid email and password are required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password
    ) {}

    public record LoginRequest(
        @NotBlank(message = "Email and password are required")
        String email,

        @NotBlank(message = "Email and password are required")
        String password
    ) {}

    public record UserDto(
        String id,
        String email,
        boolean isGuest,
        String avatarId,
        UserDocument.Preferences preferences,
        String createdAt
    ) {
        public static UserDto from(UserDocument user) {
            return new UserDto(
                user.getId(),
                user.getEmail(),
                user.isGuest(),
                user.getAvatarId(),
                user.getPreferences(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null
            );
        }
    }

    public record WalletDto(
        long balanceCents,
        long initialCents,
        long version
    ) {
        public static WalletDto from(WalletDocument wallet) {
            return new WalletDto(
                wallet.getBalanceCents(),
                wallet.getInitialCents(),
                wallet.getVersion()
            );
        }
    }

    public record AuthResponse(UserDto user, WalletDto wallet) {}
}
