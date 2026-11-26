package com.templedrop.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
public class UserDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;
    private boolean isGuest = false;
    private String avatarId = "explorer";
    private Preferences preferences = new Preferences();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public static class Preferences {
        private boolean soundEnabled = false;
        private boolean musicEnabled = false;
        private boolean animationEnabled = true;
        private boolean fastMode = false;
        private boolean reducedMotion = false;
        private String avatarId = "explorer";
        private boolean dontShowHowToPlay = false;

        public boolean isSoundEnabled() { return soundEnabled; }
        public void setSoundEnabled(boolean soundEnabled) { this.soundEnabled = soundEnabled; }

        public boolean isMusicEnabled() { return musicEnabled; }
        public void setMusicEnabled(boolean musicEnabled) { this.musicEnabled = musicEnabled; }

        public boolean isAnimationEnabled() { return animationEnabled; }
        public void setAnimationEnabled(boolean animationEnabled) { this.animationEnabled = animationEnabled; }

        public boolean isFastMode() { return fastMode; }
        public void setFastMode(boolean fastMode) { this.fastMode = fastMode; }

        public boolean isReducedMotion() { return reducedMotion; }
        public void setReducedMotion(boolean reducedMotion) { this.reducedMotion = reducedMotion; }

        public String getAvatarId() { return avatarId; }
        public void setAvatarId(String avatarId) { this.avatarId = avatarId; }

        public boolean isDontShowHowToPlay() { return dontShowHowToPlay; }
        public void setDontShowHowToPlay(boolean dontShowHowToPlay) { this.dontShowHowToPlay = dontShowHowToPlay; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email != null ? email.toLowerCase().trim() : null; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isGuest() { return isGuest; }
    public void setGuest(boolean guest) { isGuest = guest; }

    public String getAvatarId() { return avatarId; }
    public void setAvatarId(String avatarId) { this.avatarId = avatarId; }

    public Preferences getPreferences() { return preferences; }
    public void setPreferences(Preferences preferences) { this.preferences = preferences; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
