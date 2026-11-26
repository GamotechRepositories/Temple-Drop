package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.model.ActiveBonusDocument;
import com.templedrop.model.GameConfigVersionDocument;
import com.templedrop.model.GameStateDocument;
import com.templedrop.model.PendingFeatureDocument;
import com.templedrop.repository.ActiveBonusRepository;
import com.templedrop.repository.GameStateRepository;
import com.templedrop.repository.PendingFeatureRepository;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class FeatureQueueService {
    private static final List<String> ACTIVE_STATUSES = List.of("PENDING", "ACTIVE");

    private final GameStateRepository gameStateRepository;
    private final PendingFeatureRepository pendingFeatureRepository;
    private final ActiveBonusRepository activeBonusRepository;
    private final MongoTemplate mongoTemplate;

    public FeatureQueueService(
        GameStateRepository gameStateRepository,
        PendingFeatureRepository pendingFeatureRepository,
        ActiveBonusRepository activeBonusRepository,
        MongoTemplate mongoTemplate
    ) {
        this.gameStateRepository = gameStateRepository;
        this.pendingFeatureRepository = pendingFeatureRepository;
        this.activeBonusRepository = activeBonusRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public record PaidDropFeatureResult(int spinPoints, int energyPoints, int queuedSpinsCount) {}

    public GameStateDocument getGameState(ObjectId userId) {
        return gameStateRepository.findByUserId(userId).orElseGet(() -> {
            GameStateDocument state = new GameStateDocument();
            state.setUserId(userId);
            state.setSpinPoints(0);
            state.setEnergyPoints(0);
            return gameStateRepository.save(state);
        });
    }

    public Optional<ActiveBonusDocument> getActiveBonus(ObjectId userId) {
        return activeBonusRepository.findFirstByUserIdAndIsCompletedFalse(userId);
    }

    public List<PendingFeatureDocument> getPendingFeatures(ObjectId userId) {
        return pendingFeatureRepository.findByUserIdAndStatusInOrderByOrderAscCreatedAtAsc(userId, ACTIVE_STATUSES);
    }

    public long countPendingBonus(ObjectId userId) {
        return pendingFeatureRepository.countByUserIdAndTypeAndStatusIn(userId, "BONUS", ACTIVE_STATUSES);
    }

    public int getNextOrderNumber(ObjectId userId) {
        return pendingFeatureRepository.findFirstByUserIdOrderByOrderDesc(userId)
            .map(f -> f.getOrder() + 1)
            .orElse(1);
    }

    public PaidDropFeatureResult processPaidDropFeatures(
        ObjectId userId,
        String roundId,
        long betPerBallCents,
        int spinPointsGained,
        int bumperHitsGained
    ) {
        return processPaidDropFeatures(userId, roundId, betPerBallCents, spinPointsGained, bumperHitsGained, null);
    }

    public PaidDropFeatureResult processPaidDropFeatures(
        ObjectId userId,
        String roundId,
        long betPerBallCents,
        int spinPointsGained,
        int bumperHitsGained,
        GameConfigVersionDocument cfg
    ) {
        GameStateDocument state = getGameState(userId);

        boolean freeSpinEnabled = cfg == null || cfg.isFreeSpinEnabled();
        int threshold = cfg != null && cfg.getSpinPointsThreshold() > 0
            ? cfg.getSpinPointsThreshold()
            : GameConfig.SPIN_POINTS_THRESHOLD;
        boolean carryForward = cfg == null || cfg.isCarryForwardPoints();

        int earnedSpins = 0;
        if (freeSpinEnabled) {
            int totalSpin = state.getSpinPoints() + spinPointsGained;
            earnedSpins = totalSpin / threshold;
            int remainingSpin = carryForward ? (totalSpin % threshold) : (earnedSpins > 0 ? 0 : totalSpin);
            state.setSpinPoints(remainingSpin);
        }

        int energyGained = bumperHitsGained * GameConfig.ENERGY_PER_BUMPER_HIT;
        int totalEnergy = state.getEnergyPoints() + energyGained;
        state.setEnergyPoints(totalEnergy % GameConfig.ENERGY_THRESHOLD_FOR_BONUS);
        gameStateRepository.save(state);

        if (earnedSpins > 0) {
            int currentOrder = getNextOrderNumber(userId);
            for (int s = 0; s < earnedSpins; s++) {
                PendingFeatureDocument spinFeature = new PendingFeatureDocument();
                spinFeature.setUserId(userId);
                spinFeature.setRoundId(roundId);
                spinFeature.setType("WHEEL_SPIN");
                spinFeature.setStatus("PENDING");
                spinFeature.setBetPerBallCents(betPerBallCents);
                if (cfg != null) {
                    spinFeature.setConfigVersion(cfg.getVersion());
                }
                spinFeature.setOrder(currentOrder++);
                pendingFeatureRepository.save(spinFeature);
            }
            ensureActiveFeature(userId);
        }

        return new PaidDropFeatureResult(state.getSpinPoints(), state.getEnergyPoints(), earnedSpins);
    }

    public void ensureActiveFeature(ObjectId userId) {
        if (getActiveBonus(userId).isPresent()) {
            return;
        }
        List<PendingFeatureDocument> pendingList = getPendingFeatures(userId);
        if (pendingList.isEmpty()) {
            return;
        }
        PendingFeatureDocument head = pendingList.get(0);
        if ("BONUS".equals(head.getType()) && ("PENDING".equals(head.getStatus()) || "ACTIVE".equals(head.getStatus()))) {
            if (!"ACTIVE".equals(head.getStatus())) {
                head.setStatus("ACTIVE");
                pendingFeatureRepository.save(head);
            }
            ActiveBonusDocument bonus = new ActiveBonusDocument();
            bonus.setUserId(userId);
            bonus.setFeatureId(new ObjectId(head.getId()));
            bonus.setOriginRoundId(head.getRoundId());
            bonus.setBetPerBallCents(head.getBetPerBallCents());
            bonus.setRemainingBalls(GameConfig.BONUS_INITIAL_BALLS);
            bonus.setTotalBallsGranted(GameConfig.BONUS_INITIAL_BALLS);
            bonus.setBonusEnergy(0);
            bonus.setAccumulatedWinCents(0L);
            bonus.setBallsPlayed(0);
            bonus.setCompleted(false);
            activeBonusRepository.save(bonus);
        }
    }

    /**
     * Atomically claims a PENDING WHEEL_SPIN feature and marks it RESOLVED so concurrent spin requests
     * can never consume the same pending wheel spin twice.
     */
    public PendingFeatureDocument claimPendingWheelSpin(ObjectId userId, String featureId) {
        Query query = new Query(
            Criteria.where("_id").is(new ObjectId(featureId))
                .and("userId").is(userId)
                .and("type").is("WHEEL_SPIN")
                .and("status").is("PENDING")
        );
        Update update = new Update()
            .set("status", "RESOLVED")
            .set("resolvedAt", Instant.now());

        return mongoTemplate.findAndModify(
            query,
            update,
            FindAndModifyOptions.options().returnNew(true),
            PendingFeatureDocument.class
        );
    }

    public void markFeatureResolved(String featureId) {
        Query query = new Query(Criteria.where("_id").is(new ObjectId(featureId)));
        Update update = new Update()
            .set("status", "RESOLVED")
            .set("resolvedAt", Instant.now());
        mongoTemplate.updateFirst(query, update, PendingFeatureDocument.class);
    }
}
