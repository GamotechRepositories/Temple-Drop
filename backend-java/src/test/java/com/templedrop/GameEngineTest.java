package com.templedrop;

import com.templedrop.config.GameConfig;
import com.templedrop.engine.GameEngine;
import org.junit.jupiter.api.Test;

import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class GameEngineTest {

    @Test
    void generates14StepsAndExactSlotIndex() {
        GameEngine engine = new GameEngine(new Random(42L));
        for (int i = 0; i < 50; i++) {
            GameEngine.BallPath path = engine.generateBallPath();
            assertEquals(GameConfig.STEPS_COUNT, path.steps().size());
            assertEquals(GameConfig.ROWS, path.visitedPegs().size());
            int sum = path.steps().stream().mapToInt(Integer::intValue).sum();
            assertEquals(sum, path.slotIndex());
            assertTrue(path.slotIndex() >= 0 && path.slotIndex() < GameConfig.SLOTS_COUNT);
        }
    }

    @Test
    void calculatesSlotPayoutsUsingIntegerFloorDivision() {
        assertEquals(10L, GameConfig.calculateSlotPayoutCents(50L, 1, 5));   // 0.2x of 50 = 10
        assertEquals(25L, GameConfig.calculateSlotPayoutCents(50L, 1, 2));   // 0.5x of 50 = 25
        assertEquals(5000L, GameConfig.calculateSlotPayoutCents(50L, 100, 1)); // 100x of 50 = 5000
        assertEquals(0L, GameConfig.calculateSlotPayoutCents(50L, 0, 1));    // SPIN / NO WIN = 0
    }

    @Test
    void enforcesSharedPayoutCapAcrossDropAndWheel() {
        GameEngine engine = new GameEngine(new Random(7L));
        GameEngine.DropResult drop = engine.processDrop(5000L, 50, GameConfig.PAYOUT_CAP_CENTS - 100L, false);
        assertTrue(drop.boardCreditedPayoutCents() <= 100L);
        assertTrue(drop.newRoundGrossWinCents() <= GameConfig.PAYOUT_CAP_CENTS);

        GameEngine.WheelSpinResult wheel = engine.spinWheel(5000L, GameConfig.PAYOUT_CAP_CENTS);
        assertEquals(0L, wheel.creditedPayoutCents());
        assertTrue(wheel.payoutCapReached());
    }

    @Test
    void supportsZeroPayoutBetterLuckOutcome() {
        // Weight 0..34 maps to BETTER_LUCK (weight 35)
        GameEngine zeroWheelEngine = new GameEngine(new Random() {
            @Override
            public int nextInt(int bound) {
                return 0;
            }
        });
        GameEngine.WheelSpinResult result = zeroWheelEngine.spinWheel(500L, 0L);
        assertEquals("BETTER_LUCK", result.outcome().id());
        assertEquals("NO WIN", result.outcome().wedgeLabel());
        assertEquals(0L, result.rawPayoutCents());
        assertEquals(0L, result.creditedPayoutCents());
        assertFalse(result.payoutCapReached());
    }
}
