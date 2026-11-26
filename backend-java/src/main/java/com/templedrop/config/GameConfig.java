package com.templedrop.config;

import java.util.List;

public final class GameConfig {
    private GameConfig() {}

    public static final String TITLE = "Temple Drop";
    public static final String CURRENCY_SYMBOL = "₹";
    public static final int ROWS = 14;
    public static final int SLOTS_COUNT = 15;
    public static final int STEPS_COUNT = 14;

    public static final long INITIAL_BALANCE_CENTS = 1_000_000L;
    public static final long MIN_BET_CENTS = 50L;
    public static final long MAX_TOTAL_BET_CENTS = 250_000L;
    public static final long PAYOUT_CAP_CENTS = 500_000L;

    public static final List<Long> BET_PER_BALL_OPTIONS_CENTS = List.of(
        50L, 100L, 200L, 500L, 1000L, 2500L, 5000L
    );
    public static final List<Integer> BALLS_PER_DROP_OPTIONS = List.of(10, 20, 25, 30, 40, 50);
    public static final long DEFAULT_BET_PER_BALL_CENTS = 50L;
    public static final int DEFAULT_BALLS_PER_DROP = 10;

    public static final int ENERGY_PER_BUMPER_HIT = 10;
    public static final int ENERGY_THRESHOLD_FOR_BONUS = 100;
    public static final int BONUS_INITIAL_BALLS = 5;
    public static final int BONUS_RETRIGGER_BALLS = 3;
    public static final int BONUS_MAX_TOTAL_BALLS = 50;

    public static final int SPIN_POINTS_PER_HIT = 1;
    public static final int SPIN_POINTS_THRESHOLD = 10;

    public record BumperPeg(String id, int row, int col) {}
    public record SlotDef(int index, String label, int num, int den, boolean isSpin, String color) {}
    public record WheelOutcomeDef(
        String id,
        String label,
        String wedgeLabel,
        int num,
        int den,
        boolean isBonus,
        int weight,
        String color
    ) {}
    public record AvatarDef(String id, String name, String icon) {}

    public static final List<BumperPeg> BUMPER_PEGS = List.of(
        new BumperPeg("bumper_4_1", 4, 1),
        new BumperPeg("bumper_7_5", 7, 5),
        new BumperPeg("bumper_9_4", 9, 4)
    );

    public static final List<SlotDef> SLOTS = List.of(
        new SlotDef(0, "100x", 100, 1, false, "#f43f5e"),
        new SlotDef(1, "50x", 50, 1, false, "#ec4899"),
        new SlotDef(2, "20x", 20, 1, false, "#a855f7"),
        new SlotDef(3, "10x", 10, 1, false, "#8b5cf6"),
        new SlotDef(4, "2x", 2, 1, false, "#3b82f6"),
        new SlotDef(5, "0.5x", 1, 2, false, "#06b6d4"),
        new SlotDef(6, "0.2x", 1, 5, false, "#14b8a6"),
        new SlotDef(7, "SPIN", 0, 1, true, "#eab308"),
        new SlotDef(8, "0.2x", 1, 5, false, "#14b8a6"),
        new SlotDef(9, "0.5x", 1, 2, false, "#06b6d4"),
        new SlotDef(10, "2x", 2, 1, false, "#3b82f6"),
        new SlotDef(11, "10x", 10, 1, false, "#8b5cf6"),
        new SlotDef(12, "20x", 20, 1, false, "#a855f7"),
        new SlotDef(13, "50x", 50, 1, false, "#ec4899"),
        new SlotDef(14, "100x", 100, 1, false, "#f43f5e")
    );

    public static final List<WheelOutcomeDef> WHEEL_OUTCOMES = List.of(
        new WheelOutcomeDef("BETTER_LUCK", "Better Luck Next Time", "NO WIN", 0, 1, false, 35, "#9333ea"),
        new WheelOutcomeDef("1x", "1x", null, 1, 1, false, 30, "#0284c7"),
        new WheelOutcomeDef("2x", "2x", null, 2, 1, false, 20, "#059669"),
        new WheelOutcomeDef("5x", "5x", null, 5, 1, false, 5, "#d97706"),
        new WheelOutcomeDef("10x", "10x", null, 10, 1, false, 10, "#dc2626")
    );

    public static final List<Integer> AUTO_DROP_COUNTS = List.of(5, 10, 20);

    public static final List<AvatarDef> AVATARS = List.of(
        new AvatarDef("explorer", "Explorer", "E"),
        new AvatarDef("priestess", "Priestess", "P"),
        new AvatarDef("shaman", "Shaman", "S"),
        new AvatarDef("jaguar", "Jaguar", "J"),
        new AvatarDef("golden_idol", "Golden Idol", "G")
    );

    public static long calculateSlotPayoutCents(long betPerBallCents, int num, int den) {
        if (num == 0 || den == 0) {
            return 0L;
        }
        return Math.floorDiv(Math.multiplyExact(betPerBallCents, (long) num), (long) den);
    }
}
