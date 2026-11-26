package com.templedrop.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "game_config_versions")
public class GameConfigVersionDocument {
    @Id
    private String id;
    private int version;
    private int baseVersion;
    private String status; // DRAFT, PUBLISHED, ARCHIVED
    private String publishReason;
    private String publishedBy;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;

    // Game Settings
    private boolean gameEnabled = true;
    private List<Long> betPerBallOptionsCents;
    private long defaultBetPerBallCents;
    private List<Integer> ballsPerDropOptions;
    private int defaultBallsPerDrop;
    private long minBetCents;
    private long maxTotalBetCents;
    private long payoutCapCents;
    private List<SlotConfig> slots;
    private List<Integer> autoDropCounts;
    private int maxAutoDropCount = 20;

    // Free Spin Settings
    private boolean freeSpinEnabled = true;
    private int spinPointsPerHit = 1;
    private int spinPointsThreshold = 10;
    private boolean carryForwardPoints = true;
    private List<WheelOutcomeConfig> wheelOutcomes;

    // Analysis setting (does not alter payouts directly)
    private double targetRtpPct = 92.0;

    public static class SlotConfig {
        private int index;
        private String label;
        private int num;
        private int den;
        private boolean isSpin;
        private String color;

        public SlotConfig() {}

        public SlotConfig(int index, String label, int num, int den, boolean isSpin, String color) {
            this.index = index;
            this.label = label;
            this.num = num;
            this.den = den;
            this.isSpin = isSpin;
            this.color = color;
        }

        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public int getNum() { return num; }
        public void setNum(int num) { this.num = num; }

        public int getDen() { return den; }
        public void setDen(int den) { this.den = den; }

        public boolean isSpin() { return isSpin; }
        public void setSpin(boolean spin) { isSpin = spin; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class WheelOutcomeConfig {
        private String id;
        private String label;
        private String wedgeLabel;
        private String type; // NO_WIN, MULTIPLIER
        private int num;
        private int den;
        private int weightBps; // Fixed-point basis points, 10000 = 100.00%
        private String color;

        public WheelOutcomeConfig() {}

        public WheelOutcomeConfig(String id, String label, String wedgeLabel, String type, int num, int den, int weightBps, String color) {
            this.id = id;
            this.label = label;
            this.wedgeLabel = wedgeLabel;
            this.type = type;
            this.num = num;
            this.den = den;
            this.weightBps = weightBps;
            this.color = color;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public String getWedgeLabel() { return wedgeLabel; }
        public void setWedgeLabel(String wedgeLabel) { this.wedgeLabel = wedgeLabel; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public int getNum() { return num; }
        public void setNum(int num) { this.num = num; }

        public int getDen() { return den; }
        public void setDen(int den) { this.den = den; }

        public int getWeightBps() { return weightBps; }
        public void setWeightBps(int weightBps) { this.weightBps = weightBps; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public int getBaseVersion() { return baseVersion; }
    public void setBaseVersion(int baseVersion) { this.baseVersion = baseVersion; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPublishReason() { return publishReason; }
    public void setPublishReason(String publishReason) { this.publishReason = publishReason; }

    public String getPublishedBy() { return publishedBy; }
    public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public boolean isGameEnabled() { return gameEnabled; }
    public void setGameEnabled(boolean gameEnabled) { this.gameEnabled = gameEnabled; }

    public List<Long> getBetPerBallOptionsCents() { return betPerBallOptionsCents; }
    public void setBetPerBallOptionsCents(List<Long> betPerBallOptionsCents) { this.betPerBallOptionsCents = betPerBallOptionsCents; }

    public long getDefaultBetPerBallCents() { return defaultBetPerBallCents; }
    public void setDefaultBetPerBallCents(long defaultBetPerBallCents) { this.defaultBetPerBallCents = defaultBetPerBallCents; }

    public List<Integer> getBallsPerDropOptions() { return ballsPerDropOptions; }
    public void setBallsPerDropOptions(List<Integer> ballsPerDropOptions) { this.ballsPerDropOptions = ballsPerDropOptions; }

    public int getDefaultBallsPerDrop() { return defaultBallsPerDrop; }
    public void setDefaultBallsPerDrop(int defaultBallsPerDrop) { this.defaultBallsPerDrop = defaultBallsPerDrop; }

    public long getMinBetCents() { return minBetCents; }
    public void setMinBetCents(long minBetCents) { this.minBetCents = minBetCents; }

    public long getMaxTotalBetCents() { return maxTotalBetCents; }
    public void setMaxTotalBetCents(long maxTotalBetCents) { this.maxTotalBetCents = maxTotalBetCents; }

    public long getPayoutCapCents() { return payoutCapCents; }
    public void setPayoutCapCents(long payoutCapCents) { this.payoutCapCents = payoutCapCents; }

    public List<SlotConfig> getSlots() { return slots; }
    public void setSlots(List<SlotConfig> slots) { this.slots = slots; }

    public List<Integer> getAutoDropCounts() { return autoDropCounts; }
    public void setAutoDropCounts(List<Integer> autoDropCounts) { this.autoDropCounts = autoDropCounts; }

    public int getMaxAutoDropCount() { return maxAutoDropCount; }
    public void setMaxAutoDropCount(int maxAutoDropCount) { this.maxAutoDropCount = maxAutoDropCount; }

    public boolean isFreeSpinEnabled() { return freeSpinEnabled; }
    public void setFreeSpinEnabled(boolean freeSpinEnabled) { this.freeSpinEnabled = freeSpinEnabled; }

    public int getSpinPointsPerHit() { return spinPointsPerHit; }
    public void setSpinPointsPerHit(int spinPointsPerHit) { this.spinPointsPerHit = spinPointsPerHit; }

    public int getSpinPointsThreshold() { return spinPointsThreshold; }
    public void setSpinPointsThreshold(int spinPointsThreshold) { this.spinPointsThreshold = spinPointsThreshold; }

    public boolean isCarryForwardPoints() { return carryForwardPoints; }
    public void setCarryForwardPoints(boolean carryForwardPoints) { this.carryForwardPoints = carryForwardPoints; }

    public List<WheelOutcomeConfig> getWheelOutcomes() { return wheelOutcomes; }
    public void setWheelOutcomes(List<WheelOutcomeConfig> wheelOutcomes) { this.wheelOutcomes = wheelOutcomes; }

    public double getTargetRtpPct() { return targetRtpPct; }
    public void setTargetRtpPct(double targetRtpPct) { this.targetRtpPct = targetRtpPct; }
}
