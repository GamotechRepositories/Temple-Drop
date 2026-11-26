package com.templedrop.service;

import com.templedrop.dto.ProfileDtos;
import com.templedrop.model.UserDocument;
import com.templedrop.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {
    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ProfileDtos.PreferencesResponse updatePreferences(
        UserDocument user,
        ProfileDtos.PreferencesUpdateRequest req
    ) {
        UserDocument.Preferences prefs = user.getPreferences();
        if (prefs == null) {
            prefs = new UserDocument.Preferences();
            user.setPreferences(prefs);
        }

        if (req.soundEnabled() != null) prefs.setSoundEnabled(req.soundEnabled());
        if (req.musicEnabled() != null) prefs.setMusicEnabled(req.musicEnabled());
        if (req.animationEnabled() != null) prefs.setAnimationEnabled(req.animationEnabled());
        if (req.fastMode() != null) prefs.setFastMode(req.fastMode());
        if (req.reducedMotion() != null) prefs.setReducedMotion(req.reducedMotion());
        if (req.avatarId() != null) {
            prefs.setAvatarId(req.avatarId());
            user.setAvatarId(req.avatarId());
        }
        if (req.dontShowHowToPlay() != null) {
            prefs.setDontShowHowToPlay(req.dontShowHowToPlay());
        }

        user = userRepository.save(user);
        return new ProfileDtos.PreferencesResponse(user.getPreferences(), user.getAvatarId());
    }
}
