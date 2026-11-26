package com.templedrop.engine;

import com.templedrop.config.GameConfig;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.random.RandomGenerator;

/**
 * Pure Java Plinko & Wheel math engine, completely independent of HTTP and MongoDB.
 */
public class GameEngine {
    private final RandomGenerator random;

    public GameEngine() {
        this(new SecureRandom());
    }

    public GameEngine(RandomGenerator random) {
        this.random = random;
    }

    public record PegCoordinate(int row, int col) {}

    public record BallPath(
        List<Integer> steps,
        List<PegCoordinate> visitedPegs,
        List<PegCoordinate> bumperHits,
        int slotIndex
    ) {}

    public record BallOutcome(
        int index,
        List<Integer> steps,
        List<PegCoordinate> visitedPegs,
        List<PegCoordinate> bumperHits,
        int slotIndex,
        String slotLabel,
        boolean isSpin,
        long rawPayoutCents,
        long creditedPayoutCents
    ) {}

    public record DropResult(
        List<BallOutcome> balls,
        long boardGrossPayoutCents,
        long boardCreditedPayoutCents,
        boolean payoutCapReached,
        int spinPointsEarned,
        int bumperHitsTotal,
        long newRoundGrossWinCents
    ) {}

    public record WheelSpinResult(
        GameConfig.WheelOutcomeDef outcome,
        long rawPayoutCents,
        long creditedPayoutCents,
        boolean payoutCapReached,
        long newRoundGrossWinCents,
        double angleTargetDegrees
    ) {}

    public BallPath generateBallPath() {
        List<Integer> steps = new ArrayList<>(GameConfig.STEPS_COUNT);
        List<PegCoordinate> visitedPegs = new ArrayList<>(GameConfig.ROWS);
        List<PegCoordinate> bumperHits = new ArrayList<>();

        PegCoordinate currentPeg = new PegCoordinate(0, 0);
        visitedPegs.add(currentPeg);

        GameConfig.BumperPeg startBumper = getBumperAt(currentPeg.row(), currentPeg.col());
        if (startBumper != null) {
            bumperHits.add(new PegCoordinate(startBumper.row(), startBumper.col()));
        }

        for (int r = 0; r < GameConfig.STEPS_COUNT; r++) {
            int step = random.nextInt(2);
            steps.add(step);

            currentPeg = new PegCoordinate(r + 1, currentPeg.col() + step);
            if (currentPeg.row() < GameConfig.ROWS) {
                visitedPegs.add(currentPeg);
                GameConfig.BumperPeg hitBumper = getBumperAt(currentPeg.row(), currentPeg.col());
                if (hitBumper != null) {
                    bumperHits.add(new PegCoordinate(hitBumper.row(), hitBumper.col()));
                }
            }
        }

        return new BallPath(steps, visitedPegs, bumperHits, currentPeg.col());
    }

    public static GameConfig.BumperPeg getBumperAt(int row, int col) {
        for (GameConfig.BumperPeg b : GameConfig.BUMPER_PEGS) {
            if (b.row() == row && b.col() == col) {
                return b;
            }
        }
        return null;
    }

    public DropResult processDrop(long betPerBallCents, int ballCount, long currentRoundGrossWinCents, boolean isBonusRound) {
        List<BallOutcome> balls = new ArrayList<>(ballCount);
        long boardGrossPayoutCents = 0L;
        long boardCreditedPayoutCents = 0L;
        int spinPointsEarned = 0;
        int bumperHitsTotal = 0;
        long runningGrossWinCents = currentRoundGrossWinCents;
        boolean payoutCapReached = runningGrossWinCents >= GameConfig.PAYOUT_CAP_CENTS;

        for (int i = 0; i < ballCount; i++) {
            BallPath path = generateBallPath();
            GameConfig.SlotDef slot = GameConfig.SLOTS.get(path.slotIndex());
            bumperHitsTotal += path.bumperHits().size();

            long rawPayout = 0L;
            boolean isSpin = false;

            if (slot.isSpin()) {
                isSpin = true;
                if (!isBonusRound) {
                    spinPointsEarned += GameConfig.SPIN_POINTS_PER_HIT;
                }
            } else {
                rawPayout = GameConfig.calculateSlotPayoutCents(betPerBallCents, slot.num(), slot.den());
            }

            boardGrossPayoutCents = Math.addExact(boardGrossPayoutCents, rawPayout);

            long creditedPayout;
            if (payoutCapReached) {
                creditedPayout = 0L;
            } else if (runningGrossWinCents + rawPayout >= GameConfig.PAYOUT_CAP_CENTS) {
                creditedPayout = Math.max(0L, GameConfig.PAYOUT_CAP_CENTS - runningGrossWinCents);
                runningGrossWinCents = GameConfig.PAYOUT_CAP_CENTS;
                payoutCapReached = true;
            } else {
                creditedPayout = rawPayout;
                runningGrossWinCents = Math.addExact(runningGrossWinCents, creditedPayout);
            }

            boardCreditedPayoutCents = Math.addExact(boardCreditedPayoutCents, creditedPayout);

            balls.add(new BallOutcome(
                i,
                path.steps(),
                path.visitedPegs(),
                path.bumperHits(),
                path.slotIndex(),
                slot.label(),
                isSpin,
                rawPayout,
                creditedPayout
            ));
        }

        return new DropResult(
            balls,
            boardGrossPayoutCents,
            boardCreditedPayoutCents,
            payoutCapReached,
            spinPointsEarned,
            bumperHitsTotal,
            runningGrossWinCents
        );
    }

    public WheelSpinResult spinWheel(long betPerBallCents, long currentRoundGrossWinCents) {
        List<GameConfig.WheelOutcomeDef> outcomes = GameConfig.WHEEL_OUTCOMES;
        int totalWeight = outcomes.stream().mapToInt(GameConfig.WheelOutcomeDef::weight).sum();

        int rand = random.nextInt(totalWeight);
        int cumulative = 0;
        GameConfig.WheelOutcomeDef selectedOutcome = outcomes.get(0);
        int selectedIndex = 0;

        for (int i = 0; i < outcomes.size(); i++) {
            cumulative += outcomes.get(i).weight();
            if (rand < cumulative) {
                selectedOutcome = outcomes.get(i);
                selectedIndex = i;
                break;
            }
        }

        double startDeg = 0.0;
        for (int i = 0; i < selectedIndex; i++) {
            startDeg += ((double) outcomes.get(i).weight() / totalWeight) * 360.0;
        }
        double wedgeSpan = ((double) selectedOutcome.weight() / totalWeight) * 360.0;
        double angleTargetDegrees = startDeg + wedgeSpan / 2.0;

        long rawPayoutCents = 0L;
        if (!selectedOutcome.isBonus()) {
            rawPayoutCents = GameConfig.calculateSlotPayoutCents(
                betPerBallCents,
                selectedOutcome.num(),
                selectedOutcome.den()
            );
        }

        long creditedPayoutCents;
        boolean payoutCapReached = currentRoundGrossWinCents >= GameConfig.PAYOUT_CAP_CENTS;
        long newRoundGrossWinCents = currentRoundGrossWinCents;

        if (payoutCapReached) {
            creditedPayoutCents = 0L;
        } else if (currentRoundGrossWinCents + rawPayoutCents >= GameConfig.PAYOUT_CAP_CENTS) {
            creditedPayoutCents = Math.max(0L, GameConfig.PAYOUT_CAP_CENTS - currentRoundGrossWinCents);
            newRoundGrossWinCents = GameConfig.PAYOUT_CAP_CENTS;
            payoutCapReached = true;
        } else {
            creditedPayoutCents = rawPayoutCents;
            newRoundGrossWinCents = Math.addExact(newRoundGrossWinCents, creditedPayoutCents);
        }

        return new WheelSpinResult(
            selectedOutcome,
            rawPayoutCents,
            creditedPayoutCents,
            payoutCapReached,
            newRoundGrossWinCents,
            angleTargetDegrees
        );
    }
}
