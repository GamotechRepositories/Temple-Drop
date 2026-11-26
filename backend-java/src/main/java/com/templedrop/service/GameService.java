package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.dto.AuthDtos;
import com.templedrop.dto.GameDtos;
import com.templedrop.engine.GameEngine;
import com.templedrop.exception.ApiException;
import com.templedrop.model.ActiveBonusDocument;
import com.templedrop.model.GameStateDocument;
import com.templedrop.model.PendingFeatureDocument;
import com.templedrop.model.RoundDocument;
import com.templedrop.model.UserDocument;
import com.templedrop.model.WalletDocument;
import com.templedrop.repository.ActiveBonusRepository;
import com.templedrop.repository.RoundRepository;
import org.bson.types.ObjectId;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GameService {
    private final GameEngine gameEngine = new GameEngine();
    private final SecureRandom secureRandom = new SecureRandom();

    private final WalletService walletService;
    private final FeatureQueueService featureQueueService;
    private final RoundRepository roundRepository;
    private final ActiveBonusRepository activeBonusRepository;

    public GameService(
        WalletService walletService,
        FeatureQueueService featureQueueService,
        RoundRepository roundRepository,
        ActiveBonusRepository activeBonusRepository
    ) {
        this.walletService = walletService;
        this.featureQueueService = featureQueueService;
        this.roundRepository = roundRepository;
        this.activeBonusRepository = activeBonusRepository;
    }

    public GameDtos.GameStateResponse getState(UserDocument user, ObjectId userId) {
        featureQueueService.ensureActiveFeature(userId);
        WalletDocument wallet = walletService.getWallet(userId);
        GameStateDocument gameState = featureQueueService.getGameState(userId);
        List<PendingFeatureDocument> pendingFeatures = featureQueueService.getPendingFeatures(userId);
        Optional<ActiveBonusDocument> activeBonusOpt = featureQueueService.getActiveBonus(userId);

        List<GameDtos.FeatureDto> featureDtos = pendingFeatures.stream()
            .map(GameDtos.FeatureDto::from)
            .toList();
        GameDtos.ActiveBonusDto bonusDto = activeBonusOpt.map(GameDtos.ActiveBonusDto::from).orElse(null);

        GameDtos.DropResponse lastRound = roundRepository
            .findFirstByUserIdAndTypeOrderByCreatedAtDesc(userId, "PAID")
            .map(r -> new GameDtos.DropResponse(
                r.getRoundId(),
                "PAID",
                r.getBetPerBallCents(),
                r.getBallCount(),
                r.getTotalBetCents(),
                r.getBalls(),
                r.getBoardPayoutCents(),
                r.getNetPayoutCents(),
                r.isPayoutCapReached(),
                wallet.getBalanceCents(),
                gameState.getSpinPoints(),
                gameState.getEnergyPoints(),
                featureDtos,
                bonusDto,
                r.getCreatedAt() != null ? r.getCreatedAt().toString() : Instant.now().toString()
            ))
            .orElse(null);

        return new GameDtos.GameStateResponse(
            AuthDtos.UserDto.from(user),
            AuthDtos.WalletDto.from(wallet),
            gameState.getSpinPoints(),
            gameState.getEnergyPoints(),
            featureDtos,
            bonusDto,
            lastRound
        );
    }

    @Transactional
    public GameDtos.DropResponse processDrop(ObjectId userId, GameDtos.DropRequest req) {
        long betPerBallCents = req.betPerBallCents();
        int ballCount = req.ballCount();

        if (!GameConfig.BET_PER_BALL_OPTIONS_CENTS.contains(betPerBallCents)) {
            String allowed = GameConfig.BET_PER_BALL_OPTIONS_CENTS.stream()
                .map(WalletService::formatCredits)
                .collect(Collectors.joining(", "));
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid bet per ball. Must be one of: " + allowed + " credits");
        }

        if (!GameConfig.BALLS_PER_DROP_OPTIONS.contains(ballCount)) {
            String allowed = GameConfig.BALLS_PER_DROP_OPTIONS.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid ball count. Must be one of: " + allowed);
        }

        long totalBetCents = Math.multiplyExact(betPerBallCents, (long) ballCount);
        if (totalBetCents < GameConfig.MIN_BET_CENTS || totalBetCents > GameConfig.MAX_TOTAL_BET_CENTS) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                String.format(
                    "Total bet must be between %s and %s credits",
                    WalletService.formatCredits(GameConfig.MIN_BET_CENTS),
                    WalletService.formatCredits(GameConfig.MAX_TOTAL_BET_CENTS)
                )
            );
        }

        if (featureQueueService.countPendingBonus(userId) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please resolve active bonus game before dropping again.");
        }
        if (featureQueueService.getActiveBonus(userId).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An active bonus game is in progress. Please complete all bonus balls first.");
        }

        byte[] randBytes = new byte[4];
        secureRandom.nextBytes(randBytes);
        String roundId = "round_" + System.currentTimeMillis() + "_" + HexFormat.of().formatHex(randBytes);

        WalletDocument updatedWallet = walletService.debitBet(userId, totalBetCents, roundId);

        GameEngine.DropResult dropResult = gameEngine.processDrop(betPerBallCents, ballCount, 0L, false);

        if (dropResult.boardCreditedPayoutCents() > 0) {
            updatedWallet = walletService.creditWin(
                userId,
                dropResult.boardCreditedPayoutCents(),
                "WIN_BOARD",
                roundId,
                String.format(
                    "Round %s: Landed board payout of %s credits",
                    roundId,
                    WalletService.formatCredits(dropResult.boardCreditedPayoutCents())
                )
            );
        }

        FeatureQueueService.PaidDropFeatureResult featureResult = featureQueueService.processPaidDropFeatures(
            userId,
            roundId,
            betPerBallCents,
            dropResult.spinPointsEarned(),
            dropResult.bumperHitsTotal()
        );

        List<RoundDocument.BallOutcomeDoc> ballDocs = dropResult.balls().stream()
            .map(GameService::toBallOutcomeDoc)
            .toList();

        RoundDocument roundDoc = new RoundDocument();
        roundDoc.setRoundId(roundId);
        roundDoc.setUserId(userId);
        roundDoc.setType("PAID");
        roundDoc.setOriginRoundId(roundId);
        roundDoc.setBetPerBallCents(betPerBallCents);
        roundDoc.setBallCount(ballCount);
        roundDoc.setTotalBetCents(totalBetCents);
        roundDoc.setBalls(ballDocs);
        roundDoc.setBoardPayoutCents(dropResult.boardCreditedPayoutCents());
        roundDoc.setWheelPayoutCents(0L);
        roundDoc.setBonusPayoutCents(0L);
        roundDoc.setTotalGrossPayoutCents(dropResult.boardCreditedPayoutCents());
        roundDoc.setNetPayoutCents(dropResult.boardCreditedPayoutCents() - totalBetCents);
        roundDoc.setPayoutCapReached(dropResult.payoutCapReached());
        roundDoc.setSpinPointsEarned(dropResult.spinPointsEarned());
        roundDoc.setEnergyEarned(dropResult.bumperHitsTotal() * GameConfig.ENERGY_PER_BUMPER_HIT);
        roundDoc = roundRepository.save(roundDoc);

        List<GameDtos.FeatureDto> pendingFeatures = featureQueueService.getPendingFeatures(userId).stream()
            .map(GameDtos.FeatureDto::from)
            .toList();
        GameDtos.ActiveBonusDto activeBonus = featureQueueService.getActiveBonus(userId)
            .map(GameDtos.ActiveBonusDto::from)
            .orElse(null);

        return new GameDtos.DropResponse(
            roundId,
            "PAID",
            betPerBallCents,
            ballCount,
            totalBetCents,
            ballDocs,
            dropResult.boardCreditedPayoutCents(),
            dropResult.boardCreditedPayoutCents() - totalBetCents,
            dropResult.payoutCapReached(),
            updatedWallet.getBalanceCents(),
            featureResult.spinPoints(),
            featureResult.energyPoints(),
            pendingFeatures,
            activeBonus,
            roundDoc.getCreatedAt() != null ? roundDoc.getCreatedAt().toString() : Instant.now().toString()
        );
    }

    @Transactional
    public GameDtos.SpinResponse spinWheel(ObjectId userId) {
        if (featureQueueService.getActiveBonus(userId).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An active bonus game is in progress. Please complete the bonus round first.");
        }

        List<PendingFeatureDocument> pendingList = featureQueueService.getPendingFeatures(userId);
        if (pendingList.isEmpty() || !"WHEEL_SPIN".equals(pendingList.get(0).getType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No pending wheel spin available. Earn 10 spin points to spin the wheel.");
        }

        PendingFeatureDocument feature = featureQueueService.claimPendingWheelSpin(userId, pendingList.get(0).getId());
        if (feature == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Pending wheel spin was already claimed.");
        }

        Optional<RoundDocument> originOpt = roundRepository.findByRoundIdAndUserId(feature.getRoundId(), userId);
        long currentGross = originOpt.map(RoundDocument::getTotalGrossPayoutCents).orElse(0L);

        GameEngine.WheelSpinResult wheelResult = gameEngine.spinWheel(feature.getBetPerBallCents(), currentGross);
        WalletDocument updatedWallet = walletService.getWallet(userId);

        if (wheelResult.creditedPayoutCents() > 0) {
            updatedWallet = walletService.creditWin(
                userId,
                wheelResult.creditedPayoutCents(),
                "WIN_WHEEL",
                feature.getRoundId(),
                String.format(
                    "Wheel Spin: Landed %s win of %s credits",
                    wheelResult.outcome().label(),
                    WalletService.formatCredits(wheelResult.creditedPayoutCents())
                )
            );
        }

        if (originOpt.isPresent()) {
            RoundDocument originRound = originOpt.get();
            originRound.setWheelPayoutCents(originRound.getWheelPayoutCents() + wheelResult.creditedPayoutCents());
            originRound.setTotalGrossPayoutCents(originRound.getTotalGrossPayoutCents() + wheelResult.creditedPayoutCents());
            originRound.setNetPayoutCents(originRound.getNetPayoutCents() + wheelResult.creditedPayoutCents());
            if (wheelResult.payoutCapReached()) {
                originRound.setPayoutCapReached(true);
            }
            roundRepository.save(originRound);
        }

        featureQueueService.ensureActiveFeature(userId);

        List<GameDtos.FeatureDto> remainingFeatures = featureQueueService.getPendingFeatures(userId).stream()
            .map(GameDtos.FeatureDto::from)
            .toList();
        GameDtos.ActiveBonusDto nextActiveBonus = featureQueueService.getActiveBonus(userId)
            .map(GameDtos.ActiveBonusDto::from)
            .orElse(null);

        return new GameDtos.SpinResponse(
            feature.getId(),
            feature.getRoundId(),
            wheelResult.outcome(),
            wheelResult.angleTargetDegrees(),
            wheelResult.creditedPayoutCents(),
            wheelResult.payoutCapReached(),
            updatedWallet.getBalanceCents(),
            remainingFeatures,
            nextActiveBonus
        );
    }

    @Transactional
    public GameDtos.BonusDropResponse processBonusDrop(ObjectId userId) {
        ActiveBonusDocument activeBonus = featureQueueService.getActiveBonus(userId)
            .filter(b -> !b.isCompleted() && b.getRemainingBalls() > 0)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No active bonus round currently in progress."));

        Optional<RoundDocument> originOpt = roundRepository.findByRoundIdAndUserId(activeBonus.getOriginRoundId(), userId);
        long currentGross = originOpt.map(RoundDocument::getTotalGrossPayoutCents)
            .orElse(activeBonus.getAccumulatedWinCents());

        GameEngine.DropResult dropResult = gameEngine.processDrop(
            activeBonus.getBetPerBallCents(),
            1,
            currentGross,
            true
        );

        GameEngine.BallOutcome ballOutcome = dropResult.balls().get(0);
        RoundDocument.BallOutcomeDoc ballDoc = toBallOutcomeDoc(ballOutcome);

        int energyGained = dropResult.bumperHitsTotal() * GameConfig.ENERGY_PER_BUMPER_HIT;
        int newBonusEnergyTotal = activeBonus.getBonusEnergy() + energyGained;

        int earnedGrants = newBonusEnergyTotal / 100;
        int remainingBonusEnergy = newBonusEnergyTotal % 100;
        int additionalBallsDesired = earnedGrants * GameConfig.BONUS_RETRIGGER_BALLS;
        int ballsAvailableBeforeCap = Math.max(0, GameConfig.BONUS_MAX_TOTAL_BALLS - activeBonus.getTotalBallsGranted());
        int actualAdditionalBalls = Math.min(additionalBallsDesired, ballsAvailableBeforeCap);

        activeBonus.setTotalBallsGranted(activeBonus.getTotalBallsGranted() + actualAdditionalBalls);
        activeBonus.setRemainingBalls(activeBonus.getRemainingBalls() + actualAdditionalBalls - 1);
        activeBonus.setBonusEnergy(remainingBonusEnergy);
        activeBonus.setBallsPlayed(activeBonus.getBallsPlayed() + 1);

        WalletDocument updatedWallet = walletService.getWallet(userId);
        if (dropResult.boardCreditedPayoutCents() > 0) {
            updatedWallet = walletService.creditWin(
                userId,
                dropResult.boardCreditedPayoutCents(),
                "WIN_BONUS",
                activeBonus.getOriginRoundId(),
                String.format(
                    "Bonus Round: Landed %s payout of %s credits",
                    ballOutcome.slotLabel(),
                    WalletService.formatCredits(dropResult.boardCreditedPayoutCents())
                )
            );
        }

        activeBonus.setAccumulatedWinCents(activeBonus.getAccumulatedWinCents() + dropResult.boardCreditedPayoutCents());

        if (originOpt.isPresent()) {
            RoundDocument originRound = originOpt.get();
            originRound.setBonusPayoutCents(originRound.getBonusPayoutCents() + dropResult.boardCreditedPayoutCents());
            originRound.setTotalGrossPayoutCents(originRound.getTotalGrossPayoutCents() + dropResult.boardCreditedPayoutCents());
            originRound.setNetPayoutCents(originRound.getNetPayoutCents() + dropResult.boardCreditedPayoutCents());
            if (dropResult.payoutCapReached()) {
                originRound.setPayoutCapReached(true);
            }
            roundRepository.save(originRound);
        }

        boolean isCompleted = activeBonus.getRemainingBalls() <= 0;
        if (isCompleted) {
            activeBonus.setCompleted(true);
            activeBonus.setBonusEnergy(0);
            featureQueueService.markFeatureResolved(activeBonus.getFeatureId().toHexString());
            featureQueueService.ensureActiveFeature(userId);
        }

        activeBonus = activeBonusRepository.save(activeBonus);

        List<GameDtos.FeatureDto> remainingPending = featureQueueService.getPendingFeatures(userId).stream()
            .map(GameDtos.FeatureDto::from)
            .toList();
        GameDtos.ActiveBonusDto nextActiveBonus = isCompleted ? null : GameDtos.ActiveBonusDto.from(activeBonus);

        return new GameDtos.BonusDropResponse(
            activeBonus.getId(),
            activeBonus.getOriginRoundId(),
            activeBonus.getBetPerBallCents(),
            ballDoc,
            actualAdditionalBalls,
            activeBonus.getRemainingBalls(),
            activeBonus.getTotalBallsGranted(),
            activeBonus.getBonusEnergy(),
            activeBonus.getAccumulatedWinCents(),
            isCompleted,
            dropResult.boardCreditedPayoutCents(),
            dropResult.payoutCapReached(),
            updatedWallet.getBalanceCents(),
            remainingPending,
            nextActiveBonus
        );
    }

    public GameDtos.RefillResponse refillWallet(ObjectId userId) {
        WalletDocument updated = walletService.refillIfEligible(userId);
        return new GameDtos.RefillResponse(
            "Wallet successfully refilled with 10,000 demo credits!",
            AuthDtos.WalletDto.from(updated)
        );
    }

    public GameDtos.HistoryResponse getHistory(ObjectId userId, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));

        long totalRounds = roundRepository.countByUserIdAndType(userId, "PAID");
        List<RoundDocument> rounds = roundRepository.findByUserIdAndTypeOrderByCreatedAtDesc(
            userId,
            "PAID",
            PageRequest.of(safePage - 1, safeLimit)
        );

        List<GameDtos.HistoryItemDto> items = rounds.stream().map(r -> {
            Map<Integer, Integer> slotCounts = new HashMap<>();
            if (r.getBalls() != null) {
                for (RoundDocument.BallOutcomeDoc ball : r.getBalls()) {
                    slotCounts.merge(ball.getSlotIndex(), 1, Integer::sum);
                }
            }
            return new GameDtos.HistoryItemDto(
                r.getRoundId(),
                r.getCreatedAt() != null ? r.getCreatedAt().toString() : Instant.now().toString(),
                "PAID",
                r.getBallCount(),
                r.getBetPerBallCents(),
                r.getTotalBetCents(),
                slotCounts,
                r.getBoardPayoutCents(),
                r.getWheelPayoutCents(),
                r.getBonusPayoutCents(),
                r.getTotalGrossPayoutCents(),
                r.getNetPayoutCents(),
                r.isPayoutCapReached(),
                r.getBalls()
            );
        }).toList();

        int totalPages = (int) Math.ceil((double) totalRounds / safeLimit);
        return new GameDtos.HistoryResponse(items, safePage, safeLimit, totalRounds, totalPages);
    }

    public Map<String, Object> getRoundDetail(ObjectId userId, String roundId) {
        RoundDocument round = roundRepository.findByRoundIdAndUserId(roundId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Round not found"));
        return Map.of("round", round);
    }

    private static RoundDocument.BallOutcomeDoc toBallOutcomeDoc(GameEngine.BallOutcome b) {
        RoundDocument.BallOutcomeDoc doc = new RoundDocument.BallOutcomeDoc();
        doc.setIndex(b.index());
        doc.setSteps(b.steps());
        doc.setVisitedPegs(b.visitedPegs().stream()
            .map(p -> new RoundDocument.PegCoordDoc(p.row(), p.col()))
            .toList());
        doc.setBumperHits(b.bumperHits().stream()
            .map(p -> new RoundDocument.PegCoordDoc(p.row(), p.col()))
            .toList());
        doc.setSlotIndex(b.slotIndex());
        doc.setSlotLabel(b.slotLabel());
        doc.setIsSpin(b.isSpin());
        doc.setRawPayoutCents(b.rawPayoutCents());
        doc.setCreditedPayoutCents(b.creditedPayoutCents());
        return doc;
    }
}
