package com.templedrop.dto;

import com.templedrop.model.UserDocument;

public final class ProfileDtos {
    private ProfileDtos() {}

    public record PreferencesUpdateRequest(
        Boolean soundEnabled,
        Boolean musicEnabled,
        Boolean animationEnabled,
        Boolean fastMode,
        Boolean reducedMotion,
        String avatarId,
        Boolean dontShowHowToPlay
    ) {}

    public record PreferencesResponse(
        UserDocument.Preferences preferences,
        String avatarId
    ) {}
}
