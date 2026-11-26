package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.exception.ApiException;
import com.templedrop.model.GameConfigVersionDocument;
import com.templedrop.repository.GameConfigVersionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GameConfigService {
    public static final int TOTAL_WEIGHT_BPS = 10_000;

    private final GameConfigVersionRepository configRepo;
    private final PayoutAnalysisService payoutAnalysisService;
    private final AdminAuditService auditService;

    public GameConfigService(
        GameConfigVersionRepository configRepo,
        PayoutAnalysisService payoutAnalysisService,
        AdminAuditService auditService
    ) {
        this.configRepo = configRepo;
        this.payoutAnalysisService = payoutAnalysisService;
        this.auditService = auditService;
    }

    public GameConfigVersionDocument getPublishedConfig() {
        return configRepo.findFirstByStatusOrderByVersionDesc("PUBLISHED")
            .orElseGet(this::seedDefaultPublishedConfig);
    }

    public Optional<GameConfigVersionDocument> getConfigByVersion(int version) {
        return configRepo.findFirstByVersion(version);
    }

    public GameConfigVersionDocument getActiveDraftOrPublished() {
        Optional<GameConfigVersionDocument> draftOpt = configRepo.findFirstByStatusOrderByVersionDesc("DRAFT");
        if (draftOpt.isPresent()) {
            return draftOpt.get();
        }
        return getPublishedConfig();
    }

    public List<GameConfigVersionDocument> listConfigHistory() {
        getPublishedConfig(); // ensure v1 exists
        return configRepo.findAllByStatusInOrderByVersionDesc(List.of("PUBLISHED", "ARCHIVED", "DRAFT"));
    }

    public List<String> validateConfig(GameConfigVersionDocument cfg) {
        List<String> errors = new ArrayList<>();

        if (cfg.getBetPerBallOptionsCents() == null || cfg.getBetPerBallOptionsCents().isEmpty()) {
            errors.add("At least one allowed bet-per-ball stake is required.");
        } else {
            if (cfg.getBetPerBallOptionsCents().stream().anyMatch(v -> v == null || v <= 0)) {
                errors.add("All bet-per-ball stakes must be positive.");
            }
            if (!cfg.getBetPerBallOptionsCents().contains(cfg.getDefaultBetPerBallCents())) {
                errors.add("Default bet-per-ball must be one of the allowed stakes.");
            }
        }

        if (cfg.getBallsPerDropOptions() == null || cfg.getBallsPerDropOptions().isEmpty()) {
            errors.add("At least one allowed ball count is required.");
        } else {
            if (cfg.getBallsPerDropOptions().stream().anyMatch(v -> v == null || v <= 0)) {
                errors.add("All ball count options must be positive.");
            }
            if (!cfg.getBallsPerDropOptions().contains(cfg.getDefaultBallsPerDrop())) {
                errors.add("Default ball count must be one of the allowed ball counts.");
            }
        }

        if (cfg.getMinBetCents() <= 0) {
            errors.add("Minimum total bet must be greater than zero.");
        }
        if (cfg.getMaxTotalBetCents() < cfg.getMinBetCents()) {
            errors.add("Maximum total bet must be >= minimum total bet.");
        }
        if (cfg.getPayoutCapCents() <= 0) {
            errors.add("Maximum round payout cap must be greater than zero.");
        }
        if (cfg.getMaxAutoDropCount() <= 0) {
            errors.add("Auto Drop limit must be greater than zero.");
        }

        // Verify at least one playable (stake * balls) combination fits within min..max limits
        boolean hasPlayable = false;
        if (cfg.getBetPerBallOptionsCents() != null && cfg.getBallsPerDropOptions() != null) {
            for (Long stake : cfg.getBetPerBallOptionsCents()) {
                for (Integer balls : cfg.getBallsPerDropOptions()) {
                    if (stake != null && balls != null) {
                        long total = stake * balls;
                        if (total >= cfg.getMinBetCents() && total <= cfg.getMaxTotalBetCents()) {
                            hasPlayable = true;
                            break;
                        }
                    }
                }
                if (hasPlayable) break;
            }
        }
        if (!hasPlayable) {
            errors.add("Configured min/max total bet limits do not admit any playable stake × ball count combination.");
        }

        // Default combination must also be playable
        long defaultTotal = cfg.getDefaultBetPerBallCents() * (long) cfg.getDefaultBallsPerDrop();
        if (defaultTotal < cfg.getMinBetCents() || defaultTotal > cfg.getMaxTotalBetCents()) {
            errors.add("Default stake × default ball count must fall within min/max total bet limits.");
        }

        // Board slots
        if (cfg.getSlots() == null || cfg.getSlots().size() != GameConfig.SLOTS_COUNT) {
            errors.add("Board must define exactly " + GameConfig.SLOTS_COUNT + " landing slots.");
        } else {
            for (GameConfigVersionDocument.SlotConfig slot : cfg.getSlots()) {
                if (slot.getDen() <= 0 || slot.getNum() < 0) {
                    errors.add("Slot " + slot.getIndex() + " has invalid multiplier ratio.");
                }
            }
        }

        // Free Spin settings
        if (cfg.getSpinPointsPerHit() < 0) {
            errors.add("Points per SPIN hit cannot be negative.");
        }
        if (cfg.getSpinPointsThreshold() <= 0) {
            errors.add("Points required per Free Spin must be greater than zero.");
        }

        if (cfg.getWheelOutcomes() == null || cfg.getWheelOutcomes().isEmpty()) {
            errors.add("At least one wheel outcome is required.");
        } else {
            int sumBps = 0;
            for (GameConfigVersionDocument.WheelOutcomeConfig o : cfg.getWheelOutcomes()) {
                if (o.getId() == null || o.getId().isBlank()) {
                    errors.add("Every wheel outcome must have a stable ID.");
                }
                if (o.getWeightBps() < 0) {
                    errors.add("Wheel outcome weight cannot be negative: " + o.getLabel());
                }
                if ("NO_WIN".equalsIgnoreCase(o.getType())) {
                    if (o.getNum() != 0) {
                        errors.add("NO_WIN wheel outcome must have 0x multiplier: " + o.getLabel());
                    }
                } else if (o.getDen() <= 0 || o.getNum() < 0) {
                    errors.add("Wheel outcome has invalid multiplier ratio: " + o.getLabel());
                }
                sumBps += o.getWeightBps();
            }
            if (sumBps != TOTAL_WEIGHT_BPS) {
                errors.add(String.format(
                    "Wheel outcome weights must sum to exactly 100.00%% (10000 bps), got %.2f%% (%d bps).",
                    sumBps / 100.0,
                    sumBps
                ));
            }
        }

        if (cfg.getTargetRtpPct() < 1.0 || cfg.getTargetRtpPct() > 99.9) {
            errors.add("Target RTP must be between 1% and 99.9%.");
        }

        return errors;
    }

    public GameConfigVersionDocument saveDraft(GameConfigVersionDocument incoming, String adminUsername) {
        GameConfigVersionDocument published = getPublishedConfig();
        GameConfigVersionDocument draft = configRepo.findFirstByStatusOrderByVersionDesc("DRAFT")
            .orElseGet(GameConfigVersionDocument::new);

        Instant now = Instant.now();
        if (draft.getId() == null) {
            draft.setCreatedAt(now);
            draft.setBaseVersion(published.getVersion());
        } else if (incoming.getBaseVersion() > 0) {
            draft.setBaseVersion(incoming.getBaseVersion());
        }

        draft.setVersion(0);
        draft.setStatus("DRAFT");
        draft.setUpdatedAt(now);
        copyEditableFields(incoming, draft);

        GameConfigVersionDocument saved = configRepo.save(draft);
        auditService.log(
            adminUsername,
            "SAVE_DRAFT",
            "GAME_CONFIG",
            saved.getId(),
            "Saved draft based on v" + saved.getBaseVersion(),
            Map.of("baseVersion", saved.getBaseVersion())
        );
        return saved;
    }

    public Map<String, Object> validateAndPreview(
        GameConfigVersionDocument candidate,
        Long betPerBallCents,
        Integer ballCount
    ) {
        List<String> errors = validateConfig(candidate);
        long stake = betPerBallCents != null ? betPerBallCents : candidate.getDefaultBetPerBallCents();
        int balls = ballCount != null ? ballCount : candidate.getDefaultBallsPerDrop();

        PayoutAnalysisService.PayoutEstimate estimate = payoutAnalysisService.analyze(
            candidate,
            stake,
            balls,
            candidate.getTargetRtpPct()
        );

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("valid", errors.isEmpty());
        out.put("errors", errors);
        out.put("estimate", estimate);
        return out;
    }

    public GameConfigVersionDocument publishDraft(
        int expectedBaseVersion,
        String publishReason,
        GameConfigVersionDocument optionalPayload,
        String adminUsername
    ) {
        if (publishReason == null || publishReason.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A publish reason is required.");
        }

        GameConfigVersionDocument currentPublished = getPublishedConfig();
        if (expectedBaseVersion != currentPublished.getVersion()) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                String.format(
                    "Stale draft conflict: draft was based on v%d, but v%d is already published. Reload latest config before publishing.",
                    expectedBaseVersion,
                    currentPublished.getVersion()
                )
            );
        }

        GameConfigVersionDocument source = optionalPayload != null
            ? optionalPayload
            : configRepo.findFirstByStatusOrderByVersionDesc("DRAFT").orElse(currentPublished);

        List<String> errors = validateConfig(source);
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, String.join(" ", errors));
        }

        Instant now = Instant.now();
        currentPublished.setStatus("ARCHIVED");
        currentPublished.setUpdatedAt(now);
        configRepo.save(currentPublished);

        GameConfigVersionDocument nextPublished = new GameConfigVersionDocument();
        nextPublished.setVersion(currentPublished.getVersion() + 1);
        nextPublished.setBaseVersion(currentPublished.getVersion());
        nextPublished.setStatus("PUBLISHED");
        nextPublished.setPublishReason(publishReason.trim());
        nextPublished.setPublishedBy(adminUsername);
        nextPublished.setPublishedAt(now);
        nextPublished.setCreatedAt(now);
        nextPublished.setUpdatedAt(now);
        copyEditableFields(source, nextPublished);

        nextPublished = configRepo.save(nextPublished);

        // Clean up any active draft so next edit starts cleanly from new published version
        configRepo.findFirstByStatusOrderByVersionDesc("DRAFT").ifPresent(configRepo::delete);

        auditService.log(
            adminUsername,
            "PUBLISH_CONFIG",
            "GAME_CONFIG",
            "v" + nextPublished.getVersion(),
            "Published config v" + nextPublished.getVersion() + ": " + publishReason.trim(),
            Map.of(
                "version", nextPublished.getVersion(),
                "previousVersion", currentPublished.getVersion(),
                "reason", publishReason.trim()
            )
        );

        return nextPublished;
    }

    public Map<String, Object> compareVersions(int v1, int v2) {
        GameConfigVersionDocument a = getConfigByVersion(v1)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Config version " + v1 + " not found"));
        GameConfigVersionDocument b = getConfigByVersion(v2)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Config version " + v2 + " not found"));

        Map<String, Object> diff = new LinkedHashMap<>();
        diff.put("fromVersion", v1);
        diff.put("toVersion", v2);
        diff.put("from", a);
        diff.put("to", b);
        return diff;
    }

    private synchronized GameConfigVersionDocument seedDefaultPublishedConfig() {
        Optional<GameConfigVersionDocument> existing = configRepo.findFirstByStatusOrderByVersionDesc("PUBLISHED");
        if (existing.isPresent()) {
            return existing.get();
        }
        Instant now = Instant.now();
        GameConfigVersionDocument doc = new GameConfigVersionDocument();
        doc.setVersion(1);
        doc.setBaseVersion(0);
        doc.setStatus("PUBLISHED");
        doc.setPublishReason("Initial baseline configuration");
        doc.setPublishedBy("system");
        doc.setPublishedAt(now);
        doc.setCreatedAt(now);
        doc.setUpdatedAt(now);

        doc.setGameEnabled(true);
        doc.setBetPerBallOptionsCents(GameConfig.BET_PER_BALL_OPTIONS_CENTS);
        doc.setDefaultBetPerBallCents(GameConfig.DEFAULT_BET_PER_BALL_CENTS);
        doc.setBallsPerDropOptions(GameConfig.BALLS_PER_DROP_OPTIONS);
        doc.setDefaultBallsPerDrop(GameConfig.DEFAULT_BALLS_PER_DROP);
        doc.setMinBetCents(GameConfig.MIN_BET_CENTS);
        doc.setMaxTotalBetCents(GameConfig.MAX_TOTAL_BET_CENTS);
        doc.setPayoutCapCents(GameConfig.PAYOUT_CAP_CENTS);
        doc.setAutoDropCounts(GameConfig.AUTO_DROP_COUNTS);
        doc.setMaxAutoDropCount(20);

        doc.setSlots(GameConfig.SLOTS.stream()
            .map(s -> new GameConfigVersionDocument.SlotConfig(
                s.index(), s.label(), s.num(), s.den(), s.isSpin(), s.color()
            ))
            .toList());

        doc.setFreeSpinEnabled(true);
        doc.setSpinPointsPerHit(GameConfig.SPIN_POINTS_PER_HIT);
        doc.setSpinPointsThreshold(GameConfig.SPIN_POINTS_THRESHOLD);
        doc.setCarryForwardPoints(true);
        doc.setWheelOutcomes(GameConfig.WHEEL_OUTCOMES.stream()
            .map(w -> new GameConfigVersionDocument.WheelOutcomeConfig(
                w.id(),
                w.label(),
                w.wedgeLabel(),
                w.num() == 0 ? "NO_WIN" : "MULTIPLIER",
                w.num(),
                w.den(),
                w.weight() * 100,
                w.color()
            ))
            .toList());
        doc.setTargetRtpPct(92.0);
        return configRepo.save(doc);
    }

    private void copyEditableFields(GameConfigVersionDocument src, GameConfigVersionDocument dst) {
        dst.setGameEnabled(src.isGameEnabled());
        dst.setBetPerBallOptionsCents(src.getBetPerBallOptionsCents());
        dst.setDefaultBetPerBallCents(src.getDefaultBetPerBallCents());
        dst.setBallsPerDropOptions(src.getBallsPerDropOptions());
        dst.setDefaultBallsPerDrop(src.getDefaultBallsPerDrop());
        dst.setMinBetCents(src.getMinBetCents());
        dst.setMaxTotalBetCents(src.getMaxTotalBetCents());
        dst.setPayoutCapCents(src.getPayoutCapCents());
        dst.setSlots(src.getSlots());
        dst.setAutoDropCounts(src.getAutoDropCounts());
        dst.setMaxAutoDropCount(src.getMaxAutoDropCount());
        dst.setFreeSpinEnabled(src.isFreeSpinEnabled());
        dst.setSpinPointsPerHit(src.getSpinPointsPerHit());
        dst.setSpinPointsThreshold(src.getSpinPointsThreshold());
        dst.setCarryForwardPoints(src.isCarryForwardPoints());
        dst.setWheelOutcomes(src.getWheelOutcomes());
        dst.setTargetRtpPct(src.getTargetRtpPct());
    }
}
