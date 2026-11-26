package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.model.GameConfigVersionDocument;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.SplittableRandom;

/**
 * Computes exact Binomial(14, 0.5) board RTP, Free Spin expected value,
 * and combined capped RTP estimates for Temple Drop configurations.
 */
@Service
public class PayoutAnalysisService {
    private static final int SIMULATION_ROUNDS = 50_000;
    private static final int[] BINOMIAL_14 = {
        1, 14, 91, 364, 1001, 2002, 3003, 3432, 3003, 2002, 1001, 364, 91, 14, 1
    };
    private static final double TOTAL_PATHS = 16384.0; // 2^14

    public record PayoutEstimate(
        long betPerBallCents,
        int ballCount,
        long totalBetCents,
        double targetRtpPct,
        double targetMarginPct,
        double baseRtpPct,
        double wheelContributionPct,
        double totalEstimatedRtpPct,
        double estimatedMarginPct,
        double diffFromTargetRtpPct,
        double spinTriggerProbabilityPct,
        int simulationSampleSize,
        String assumptions
    ) {}

    public PayoutEstimate analyze(
        GameConfigVersionDocument config,
        long betPerBallCents,
        int ballCount,
        Double overrideTargetRtpPct
    ) {
        double targetRtp = overrideTargetRtpPct != null ? overrideTargetRtpPct : config.getTargetRtpPct();
        double targetMargin = round2(100.0 - targetRtp);

        List<GameConfigVersionDocument.SlotConfig> slots = config.getSlots();
        double expectedBoardPerBallRatio = 0.0;
        double spinSlotProb = 0.0;

        for (int i = 0; i < Math.min(slots.size(), BINOMIAL_14.length); i++) {
            double p = BINOMIAL_14[i] / TOTAL_PATHS;
            GameConfigVersionDocument.SlotConfig slot = slots.get(i);
            if (slot.isSpin()) {
                spinSlotProb += p;
            } else if (slot.getDen() > 0 && slot.getNum() > 0) {
                long payoutPerBall = GameConfig.calculateSlotPayoutCents(betPerBallCents, slot.getNum(), slot.getDen());
                expectedBoardPerBallRatio += p * ((double) payoutPerBall / betPerBallCents);
            }
        }

        double baseRtpPct = expectedBoardPerBallRatio * 100.0;

        // Expected wheel payout per spin in units of betPerBallCents
        double expectedWheelMult = 0.0;
        if (config.isFreeSpinEnabled() && config.getWheelOutcomes() != null) {
            int totalWeightBps = config.getWheelOutcomes().stream()
                .mapToInt(GameConfigVersionDocument.WheelOutcomeConfig::getWeightBps)
                .sum();
            if (totalWeightBps > 0) {
                for (GameConfigVersionDocument.WheelOutcomeConfig o : config.getWheelOutcomes()) {
                    if (!"NO_WIN".equalsIgnoreCase(o.getType()) && o.getDen() > 0 && o.getNum() > 0) {
                        double prob = (double) o.getWeightBps() / totalWeightBps;
                        double mult = (double) o.getNum() / o.getDen();
                        expectedWheelMult += prob * mult;
                    }
                }
            }
        }

        // Simulation with deterministic seed for repeatable, cap-aware combined RTP
        double[] slotCdf = new double[BINOMIAL_14.length];
        double cum = 0.0;
        for (int i = 0; i < BINOMIAL_14.length; i++) {
            cum += BINOMIAL_14[i] / TOTAL_PATHS;
            slotCdf[i] = cum;
        }
        slotCdf[slotCdf.length - 1] = 1.0;

        List<GameConfigVersionDocument.WheelOutcomeConfig> outcomes = config.getWheelOutcomes();
        int totalWheelBps = outcomes != null
            ? outcomes.stream().mapToInt(GameConfigVersionDocument.WheelOutcomeConfig::getWeightBps).sum()
            : 0;

        SplittableRandom rng = new SplittableRandom(20261126L);
        long totalWageredCents = Math.multiplyExact(betPerBallCents, (long) ballCount) * (long) SIMULATION_ROUNDS;
        long totalBoardPaidCents = 0L;
        long totalWheelPaidCents = 0L;
        int spinPointsAccum = 0;
        long cap = config.getPayoutCapCents();
        int threshold = Math.max(1, config.getSpinPointsThreshold());
        int pointsPerHit = Math.max(0, config.getSpinPointsPerHit());

        for (int r = 0; r < SIMULATION_ROUNDS; r++) {
            long roundGross = 0L;
            int roundSpinHits = 0;

            for (int b = 0; b < ballCount; b++) {
                double u = rng.nextDouble();
                int slotIdx = 0;
                while (slotIdx < slotCdf.length - 1 && u > slotCdf[slotIdx]) {
                    slotIdx++;
                }
                GameConfigVersionDocument.SlotConfig slot = slots.get(slotIdx);
                if (slot.isSpin()) {
                    roundSpinHits++;
                } else if (slot.getDen() > 0 && slot.getNum() > 0) {
                    long raw = GameConfig.calculateSlotPayoutCents(betPerBallCents, slot.getNum(), slot.getDen());
                    long credited = cap > 0 ? Math.min(raw, Math.max(0L, cap - roundGross)) : raw;
                    roundGross += credited;
                    totalBoardPaidCents += credited;
                }
            }

            if (config.isFreeSpinEnabled() && totalWheelBps > 0 && pointsPerHit > 0) {
                int gained = roundSpinHits * pointsPerHit;
                int totalPts = spinPointsAccum + gained;
                int triggered = totalPts / threshold;
                spinPointsAccum = config.isCarryForwardPoints() ? (totalPts % threshold) : 0;

                for (int s = 0; s < triggered; s++) {
                    int wRand = rng.nextInt(totalWheelBps);
                    int wCum = 0;
                    GameConfigVersionDocument.WheelOutcomeConfig chosen = outcomes.get(0);
                    for (GameConfigVersionDocument.WheelOutcomeConfig o : outcomes) {
                        wCum += o.getWeightBps();
                        if (wRand < wCum) {
                            chosen = o;
                            break;
                        }
                    }
                    if (!"NO_WIN".equalsIgnoreCase(chosen.getType()) && chosen.getDen() > 0 && chosen.getNum() > 0) {
                        long rawWheel = GameConfig.calculateSlotPayoutCents(betPerBallCents, chosen.getNum(), chosen.getDen());
                        long creditedWheel = cap > 0 ? Math.min(rawWheel, Math.max(0L, cap - roundGross)) : rawWheel;
                        roundGross += creditedWheel;
                        totalWheelPaidCents += creditedWheel;
                    }
                }
            }
        }

        double simBoardRtp = ((double) totalBoardPaidCents / totalWageredCents) * 100.0;
        double simWheelRtp = ((double) totalWheelPaidCents / totalWageredCents) * 100.0;
        double totalEstimatedRtp = simBoardRtp + simWheelRtp;
        double estimatedMargin = 100.0 - totalEstimatedRtp;
        double diffFromTarget = totalEstimatedRtp - targetRtp;

        String assumptions = String.format(
            "Exact Binomial(14, 0.5) board probabilities + %,d-round Monte Carlo with combined payout cap (%s credits), Free Spin (%s), and carryForward=%s.",
            SIMULATION_ROUNDS,
            WalletService.formatCredits(cap),
            config.isFreeSpinEnabled() ? "ON" : "OFF",
            config.isCarryForwardPoints()
        );

        return new PayoutEstimate(
            betPerBallCents,
            ballCount,
            Math.multiplyExact(betPerBallCents, (long) ballCount),
            round2(targetRtp),
            round2(targetMargin),
            round2(baseRtpPct),
            round2(simWheelRtp),
            round2(totalEstimatedRtp),
            round2(estimatedMargin),
            round2(diffFromTarget),
            round2(spinSlotProb * 100.0),
            SIMULATION_ROUNDS,
            assumptions
        );
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
