package com.templedrop.controller;

import com.templedrop.dto.ProfileDtos;
import com.templedrop.security.AuthenticatedUser;
import com.templedrop.service.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PatchMapping("/preferences")
    public ProfileDtos.PreferencesResponse updatePreferences(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @RequestBody ProfileDtos.PreferencesUpdateRequest req
    ) {
        return profileService.updatePreferences(authUser.user(), req);
    }
}
