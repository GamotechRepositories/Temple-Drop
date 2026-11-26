package com.templedrop.dto;

import com.templedrop.config.GameConfig;
import com.templedrop.model.ActiveBonusDocument;
import com.templedrop.model.PendingFeatureDocument;
import com.templedrop.model.RoundDocument;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public final class GameDtos {
    private GameDtos() {}

    public record DropRequest(
        @NotNull(message = "betPerBallCents is required")
        Long betPerBallCents,

        @NotNull(message = "ballCount is required")
        Integer ballCount
    ) {}

    public record FeatureDto(
        String id,
        String type,
        String status,
        long betPerBallCents,
        String roundId,
        int order
    ) {
        public static FeatureDto from(PendingFeatureDocument doc) {
            return new FeatureDto(
                doc.getId(),
                doc.getType(),
                doc.getStatus(),
                doc.getBetPerBallCents(),
                doc.getRoundId(),
                doc.getOrder()
            );
        }
    }

    public record ActiveBonusDto(
        String id,
        String originRoundId,
        long betPerBallCents,
        int remainingBalls,
        int totalBallsGranted,
        int bonusEnergy,
        long accumulatedWinCents,
        int ballsPlayed,
        boolean isCompleted
    ) {
        public static ActiveBonusDto from(ActiveBonusDocument doc) {
            if (doc == null) return null;
            return new ActiveBonusDto(
                doc.getId(),
                doc.getOriginRoundId(),
                doc.getBetPerBallCents(),
                doc.getRemainingBalls(),
                doc.getTotalBallsGranted(),
                doc.getBonusEnergy(),
                doc.getAccumulatedWinCents(),
                doc.getBallsPlayed(),
                doc.isCompleted()
            );
        }
    }

    public record DropResponse(
        String roundId,
        String type,
        long betPerBallCents,
        int ballCount,
        long totalBetCents,
        List<RoundDocument.BallOutcomeDoc> balls,
        long grossPayoutCents,
        long netPayoutCents,
        boolean payoutCapReached,
        long walletBalanceCents,
        int spinPoints,
        int energyPoints,
        List<FeatureDto> pendingFeatures,
        ActiveBonusDto activeBonus,
        String serverTime
    ) {}

    public record SpinResponse(
        String featureId,
        String originRoundId,
        GameConfig.WheelOutcomeDef outcome,
        double angleTargetDegrees,
        long grossPayoutCents,
        boolean payoutCapReached,
        long walletBalanceCents,
        List<FeatureDto> pendingFeatures,
        ActiveBonusDto activeBonus
    ) {}

    public record BonusDropResponse(
        String bonusSessionId,
        String originRoundId,
        long betPerBallCents,
        RoundDocument.BallOutcomeDoc ball,
        int additionalBallsGranted,
        int remainingBalls,
        int totalBallsGranted,
        int bonusEnergy,
        long accumulatedWinCents,
        boolean isCompleted,
        long grossPayoutCents,
        boolean payoutCapReached,
        long walletBalanceCents,
        List<FeatureDto> pendingFeatures,
        ActiveBonusDto activeBonus
    ) {}

    public record GameStateResponse(
        AuthDtos.UserDto user,
        AuthDtos.WalletDto wallet,
        int spinPoints,
        int energyPoints,
        List<FeatureDto> pendingFeatures,
        ActiveBonusDto activeBonus,
        DropResponse lastRound
    ) {}

    public record HistoryItemDto(
        String roundId,
        String timestamp,
        String type,
        int ballCount,
        long betPerBallCents,
        long totalBetCents,
        Map<Integer, Integer> slotCounts,
        long boardPayoutCents,
        long wheelPayoutCents,
        long bonusPayoutCents,
        long totalGrossPayoutCents,
        long netChangeCents,
        boolean payoutCapReached,
        List<RoundDocument.BallOutcomeDoc> balls
    ) {}

    public record HistoryResponse(
        List<HistoryItemDto> items,
        int page,
        int limit,
        long totalRounds,
        int totalPages
    ) {}

    public record RefillResponse(
        String message,
        AuthDtos.WalletDto wallet
    ) {}
}
