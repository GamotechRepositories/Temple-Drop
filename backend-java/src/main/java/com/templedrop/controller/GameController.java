package com.templedrop.controller;

import com.templedrop.config.GameConfig;
import com.templedrop.dto.AdminDtos;
import com.templedrop.dto.GameDtos;
import com.templedrop.model.GameConfigVersionDocument;
import com.templedrop.security.AuthenticatedUser;
import com.templedrop.service.GameConfigService;
import com.templedrop.service.GameService;
import com.templedrop.service.IdempotencyService;
import com.templedrop.service.ProviderWalletBridgeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private final GameService gameService;
    private final IdempotencyService idempotencyService;
    private final ProviderWalletBridgeService providerWalletBridgeService;
    private final GameConfigService gameConfigService;

    public GameController(
        GameService gameService,
        IdempotencyService idempotencyService,
        ProviderWalletBridgeService providerWalletBridgeService,
        GameConfigService gameConfigService
    ) {
        this.gameService = gameService;
        this.idempotencyService = idempotencyService;
        this.providerWalletBridgeService = providerWalletBridgeService;
        this.gameConfigService = gameConfigService;
    }

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        GameConfigVersionDocument live = gameConfigService.getPublishedConfig();
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("TITLE", GameConfig.TITLE);
        config.put("CURRENCY_SYMBOL", GameConfig.CURRENCY_SYMBOL);
        config.put("ROWS", GameConfig.ROWS);
        config.put("SLOTS_COUNT", GameConfig.SLOTS_COUNT);
        config.put("STEPS_COUNT", GameConfig.STEPS_COUNT);
        config.put("BUMPER_PEGS", GameConfig.BUMPER_PEGS);
        config.put("INITIAL_BALANCE_CENTS", GameConfig.INITIAL_BALANCE_CENTS);
        config.put("GAME_ENABLED", live.isGameEnabled());
        config.put("CONFIG_VERSION", live.getVersion());
        config.put("MIN_BET_CENTS", live.getMinBetCents());
        config.put("MAX_TOTAL_BET_CENTS", live.getMaxTotalBetCents());
        config.put("PAYOUT_CAP_CENTS", live.getPayoutCapCents());
        config.put("BET_PER_BALL_OPTIONS_CENTS", live.getBetPerBallOptionsCents());
        config.put("BALLS_PER_DROP_OPTIONS", live.getBallsPerDropOptions());
        config.put("DEFAULT_BET_PER_BALL_CENTS", live.getDefaultBetPerBallCents());
        config.put("DEFAULT_BALLS_PER_DROP", live.getDefaultBallsPerDrop());
        config.put("ENERGY_PER_BUMPER_HIT", GameConfig.ENERGY_PER_BUMPER_HIT);
        config.put("ENERGY_THRESHOLD_FOR_BONUS", GameConfig.ENERGY_THRESHOLD_FOR_BONUS);
        config.put("BONUS_INITIAL_BALLS", GameConfig.BONUS_INITIAL_BALLS);
        config.put("BONUS_RETRIGGER_BALLS", GameConfig.BONUS_RETRIGGER_BALLS);
        config.put("BONUS_MAX_TOTAL_BALLS", GameConfig.BONUS_MAX_TOTAL_BALLS);
        config.put("FREE_SPIN_ENABLED", live.isFreeSpinEnabled());
        config.put("SPIN_POINTS_PER_HIT", live.getSpinPointsPerHit());
        config.put("SPIN_POINTS_THRESHOLD", live.getSpinPointsThreshold());
        config.put("CARRY_FORWARD_POINTS", live.isCarryForwardPoints());
        config.put("SLOTS", live.getSlots().stream()
            .map(s -> new GameConfig.SlotDef(s.getIndex(), s.getLabel(), s.getNum(), s.getDen(), s.isSpin(), s.getColor()))
            .toList());
        config.put("WHEEL_OUTCOMES", live.getWheelOutcomes().stream()
            .map(w -> new GameConfig.WheelOutcomeDef(
                w.getId(), w.getLabel(), w.getWedgeLabel(), w.getNum(), w.getDen(), false, Math.max(1, w.getWeightBps() / 100), w.getColor()
            ))
            .toList());
        config.put("AUTO_DROP_COUNTS", live.getAutoDropCounts());
        config.put("MAX_AUTO_DROP_COUNT", live.getMaxAutoDropCount());
        config.put("AVATARS", GameConfig.AVATARS);

        Map<String, Object> mathDoc = new LinkedHashMap<>();
        mathDoc.put("rtpProfile", "Arcade Demo Payout Profile");
        mathDoc.put("boardRows", 14);
        mathDoc.put("landingSlots", 15);
        mathDoc.put("expectedBaseRtpPercentage", 86.4);
        mathDoc.put("expectedWheelContributionPercentage", 5.8);
        mathDoc.put("expectedBonusContributionPercentage", 6.2);
        mathDoc.put("totalExpectedRtpPercentage", 98.4);
        mathDoc.put("disclaimer", "All credits are virtual arcade demo tokens with zero cash value. Outlays, multipliers, and probabilities are tuned for entertainment.");
        mathDoc.put("sharedPayoutCapCredits", GameConfig.PAYOUT_CAP_CENTS / 100);
        mathDoc.put("maxBonusBallsPerSession", GameConfig.BONUS_MAX_TOTAL_BALLS);

        return Map.of("config", config, "mathDocumentation", mathDoc);
    }

    @GetMapping("/state")
    public GameDtos.GameStateResponse getState(@AuthenticationPrincipal AuthenticatedUser authUser) {
        return gameService.getState(authUser.user(), authUser.userObjectId());
    }

    @PostMapping("/drop")
    public ResponseEntity<GameDtos.DropResponse> drop(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @RequestHeader(value = "x-idempotency-key", required = false) String idempotencyKey,
        @Valid @RequestBody GameDtos.DropRequest req
    ) {
        IdempotencyService.ExecutionResult<GameDtos.DropResponse> result = idempotencyService.execute(
            authUser.userObjectId(),
            "drop",
            idempotencyKey,
            req,
            GameDtos.DropResponse.class,
            () -> gameService.processDrop(authUser.userObjectId(), req)
        );

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(result.statusCode());
        if (result.cacheHit()) {
            builder.header("X-Cache-Lookup", "HIT");
        }
        return builder.body(result.body());
    }

    @PostMapping("/spin")
    public ResponseEntity<GameDtos.SpinResponse> spin(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @RequestHeader(value = "x-idempotency-key", required = false) String idempotencyKey,
        @RequestBody(required = false) Map<String, Object> body
    ) {
        IdempotencyService.ExecutionResult<GameDtos.SpinResponse> result = idempotencyService.execute(
            authUser.userObjectId(),
            "spin",
            idempotencyKey,
            body != null ? body : Map.of(),
            GameDtos.SpinResponse.class,
            () -> gameService.spinWheel(authUser.userObjectId())
        );

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(result.statusCode());
        if (result.cacheHit()) {
            builder.header("X-Cache-Lookup", "HIT");
        }
        return builder.body(result.body());
    }

    @PostMapping("/bonus/drop")
    public ResponseEntity<GameDtos.BonusDropResponse> bonusDrop(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @RequestHeader(value = "x-idempotency-key", required = false) String idempotencyKey,
        @RequestBody(required = false) Map<String, Object> body
    ) {
        IdempotencyService.ExecutionResult<GameDtos.BonusDropResponse> result = idempotencyService.execute(
            authUser.userObjectId(),
            "bonus_drop",
            idempotencyKey,
            body != null ? body : Map.of(),
            GameDtos.BonusDropResponse.class,
            () -> gameService.processBonusDrop(authUser.userObjectId())
        );

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(result.statusCode());
        if (result.cacheHit()) {
            builder.header("X-Cache-Lookup", "HIT");
        }
        return builder.body(result.body());
    }

    @PostMapping("/wallet/refill")
    public GameDtos.RefillResponse refill(@AuthenticationPrincipal AuthenticatedUser authUser) {
        return gameService.refillWallet(authUser.userObjectId());
    }

    @GetMapping("/history")
    public GameDtos.HistoryResponse history(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int limit
    ) {
        return gameService.getHistory(authUser.userObjectId(), page, limit);
    }

    @GetMapping("/history/{roundId}")
    public Map<String, Object> roundDetail(
        @AuthenticationPrincipal AuthenticatedUser authUser,
        @PathVariable String roundId
    ) {
        return gameService.getRoundDetail(authUser.userObjectId(), roundId);
    }

    @GetMapping("/provider-config")
    public AdminDtos.PublicProviderConfigResponse getProviderConfig() {
        return providerWalletBridgeService.getActivePublicConfig();
    }

    @GetMapping("/provider/balance")
    public Map<String, Object> getProviderBalance(
        @RequestParam String sessionToken,
        @RequestParam(required = false) String providerCode
    ) {
        return providerWalletBridgeService.getBalance(sessionToken, providerCode);
    }

    @GetMapping("/provider/profile")
    public Map<String, Object> getProviderProfile(
        @RequestParam String sessionToken,
        @RequestParam(required = false) String providerCode
    ) {
        return providerWalletBridgeService.getPlayerProfile(sessionToken, providerCode);
    }
}
