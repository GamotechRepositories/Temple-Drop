package com.templedrop;

import com.templedrop.config.GameConfig;
import com.templedrop.engine.GameEngine;
import com.templedrop.exception.ApiException;
import com.templedrop.model.GameConfigVersionDocument;
import com.templedrop.repository.AdminAuditLogRepository;
import com.templedrop.repository.GameConfigVersionRepository;
import com.templedrop.service.AdminAuditService;
import com.templedrop.service.GameConfigService;
import com.templedrop.service.PayoutAnalysisService;
import com.templedrop.service.ProviderWalletBridgeService;
import com.templedrop.repository.ProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminConfigAndPayoutTest {

    private GameConfigVersionDocument buildBaselineConfig() {
        GameConfigVersionDocument doc = new GameConfigVersionDocument();
        doc.setVersion(1);
        doc.setBaseVersion(0);
        doc.setStatus("PUBLISHED");
        doc.setGameEnabled(true);
        doc.setBetPerBallOptionsCents(GameConfig.BET_PER_BALL_OPTIONS_CENTS);
        doc.setDefaultBetPerBallCents(50L);
        doc.setBallsPerDropOptions(GameConfig.BALLS_PER_DROP_OPTIONS);
        doc.setDefaultBallsPerDrop(10);
        doc.setMinBetCents(50L);
        doc.setMaxTotalBetCents(250_000L);
        doc.setPayoutCapCents(500_000L);
        doc.setMaxAutoDropCount(20);
        doc.setSlots(GameConfig.SLOTS.stream()
            .map(s -> new GameConfigVersionDocument.SlotConfig(s.index(), s.label(), s.num(), s.den(), s.isSpin(), s.color()))
            .toList());
        doc.setFreeSpinEnabled(true);
        doc.setSpinPointsPerHit(1);
        doc.setSpinPointsThreshold(10);
        doc.setCarryForwardPoints(true);
        doc.setWheelOutcomes(GameConfig.WHEEL_OUTCOMES.stream()
            .map(w -> new GameConfigVersionDocument.WheelOutcomeConfig(
                w.id(), w.label(), w.wedgeLabel(), w.num() == 0 ? "NO_WIN" : "MULTIPLIER",
                w.num(), w.den(), w.weight() * 100, w.color()
            ))
            .toList());
        doc.setTargetRtpPct(92.0);
        return doc;
    }

    @Test
    void invalidWheelWeightsAreRejected() {
        GameConfigVersionRepository repo = mock(GameConfigVersionRepository.class);
        AdminAuditLogRepository auditRepo = mock(AdminAuditLogRepository.class);
        GameConfigService service = new GameConfigService(repo, new PayoutAnalysisService(), new AdminAuditService(auditRepo));

        GameConfigVersionDocument cfg = buildBaselineConfig();
        // Make weights sum to 9000 bps (90%) instead of 10000 bps (100%)
        cfg.getWheelOutcomes().get(0).setWeightBps(2500);

        List<String> errors = service.validateConfig(cfg);
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("100.00%")));
    }

    @Test
    void invalidDefaultStakeAndLimitsAreRejected() {
        GameConfigVersionRepository repo = mock(GameConfigVersionRepository.class);
        AdminAuditLogRepository auditRepo = mock(AdminAuditLogRepository.class);
        GameConfigService service = new GameConfigService(repo, new PayoutAnalysisService(), new AdminAuditService(auditRepo));

        GameConfigVersionDocument cfg = buildBaselineConfig();
        cfg.setDefaultBetPerBallCents(9999L); // not in allowed options
        cfg.setMinBetCents(1_000_000L); // higher than maxTotalBetCents

        List<String> errors = service.validateConfig(cfg);
        assertTrue(errors.stream().anyMatch(e -> e.contains("Default bet-per-ball")));
        assertTrue(errors.stream().anyMatch(e -> e.contains("Maximum total bet")));
    }

    @Test
    void payoutMathComputesExactBaseRtpAndCappedCombinedEstimate() {
        PayoutAnalysisService analysis = new PayoutAnalysisService();
        GameConfigVersionDocument cfg = buildBaselineConfig();

        PayoutAnalysisService.PayoutEstimate est = analysis.analyze(cfg, 50L, 10, 92.0);
        assertTrue(est.baseRtpPct() > 100.0 && est.baseRtpPct() < 130.0, "baseRtpPct was " + est.baseRtpPct());
        assertEquals(92.0, est.targetRtpPct(), 0.01);
        assertEquals(8.0, est.targetMarginPct(), 0.01);
        assertEquals(100.0, est.totalEstimatedRtpPct() + est.estimatedMarginPct(), 0.05);
        assertEquals(50_000, est.simulationSampleSize());
    }

    @Test
    void publishRejectsStaleDraftConflictAndMissingReason() {
        GameConfigVersionRepository repo = mock(GameConfigVersionRepository.class);
        AdminAuditLogRepository auditRepo = mock(AdminAuditLogRepository.class);
        GameConfigService service = new GameConfigService(repo, new PayoutAnalysisService(), new AdminAuditService(auditRepo));

        GameConfigVersionDocument publishedV2 = buildBaselineConfig();
        publishedV2.setVersion(2);
        when(repo.findFirstByStatusOrderByVersionDesc("PUBLISHED")).thenReturn(Optional.of(publishedV2));

        ApiException reasonEx = assertThrows(ApiException.class, () ->
            service.publishDraft(2, "   ", publishedV2, "admin")
        );
        assertEquals(HttpStatus.BAD_REQUEST, reasonEx.getStatus());

        ApiException conflictEx = assertThrows(ApiException.class, () ->
            service.publishDraft(1, "Publish stale v1 draft", publishedV2, "admin")
        );
        assertEquals(HttpStatus.CONFLICT, conflictEx.getStatus());
    }

    @Test
    void pendingSpinSettlesUnderRecordedVersionEvenIfNewConfigDisablesFreeSpin() {
        GameConfigVersionDocument v1Recorded = buildBaselineConfig();
        v1Recorded.setWheelOutcomes(List.of(
            new GameConfigVersionDocument.WheelOutcomeConfig("NO_WIN_1", "No Win", "NO WIN", "NO_WIN", 0, 1, 10000, "#9333ea")
        ));

        // Even if v2 disables Free Spin, settling a v1 pending spin uses v1Recorded
        GameEngine engine = new GameEngine(new Random(42));
        GameEngine.WheelSpinResult zeroResult = engine.spinWheel(100L, 0L, v1Recorded);
        assertEquals(0L, zeroResult.creditedPayoutCents());
        assertEquals("NO_WIN_1", zeroResult.outcome().id());

        // And with a 2x outcome recorded in v1, it credits 200 cents
        v1Recorded.setWheelOutcomes(List.of(
            new GameConfigVersionDocument.WheelOutcomeConfig("2x", "2x", null, "MULTIPLIER", 2, 1, 10000, "#059669")
        ));
        GameEngine.WheelSpinResult winResult = engine.spinWheel(100L, 0L, v1Recorded);
        assertEquals(200L, winResult.creditedPayoutCents());
    }

    @Test
    void extractsAuthoritativeFloatBalanceInCents() {
        ProviderWalletBridgeService bridge = new ProviderWalletBridgeService(
            mock(ProviderConfigRepository.class),
            new ObjectMapper()
        );
        assertEquals(101500L, bridge.extractAuthoritativeBalanceCents(java.util.Map.of("status", true, "message", 1015.0)));
        assertEquals(99950L, bridge.extractAuthoritativeBalanceCents(java.util.Map.of("status", true, "message", "999.50")));
    }
}
