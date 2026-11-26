package com.templedrop.controller;

import com.templedrop.config.GameConfig;
import com.templedrop.dto.GameDtos;
import com.templedrop.security.AuthenticatedUser;
import com.templedrop.service.GameService;
import com.templedrop.service.IdempotencyService;
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

    public GameController(GameService gameService, IdempotencyService idempotencyService) {
        this.gameService = gameService;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("TITLE", GameConfig.TITLE);
        config.put("CURRENCY_SYMBOL", GameConfig.CURRENCY_SYMBOL);
        config.put("ROWS", GameConfig.ROWS);
        config.put("SLOTS_COUNT", GameConfig.SLOTS_COUNT);
        config.put("STEPS_COUNT", GameConfig.STEPS_COUNT);
        config.put("BUMPER_PEGS", GameConfig.BUMPER_PEGS);
        config.put("INITIAL_BALANCE_CENTS", GameConfig.INITIAL_BALANCE_CENTS);
        config.put("MIN_BET_CENTS", GameConfig.MIN_BET_CENTS);
        config.put("MAX_TOTAL_BET_CENTS", GameConfig.MAX_TOTAL_BET_CENTS);
        config.put("PAYOUT_CAP_CENTS", GameConfig.PAYOUT_CAP_CENTS);
        config.put("BET_PER_BALL_OPTIONS_CENTS", GameConfig.BET_PER_BALL_OPTIONS_CENTS);
        config.put("BALLS_PER_DROP_OPTIONS", GameConfig.BALLS_PER_DROP_OPTIONS);
        config.put("DEFAULT_BET_PER_BALL_CENTS", GameConfig.DEFAULT_BET_PER_BALL_CENTS);
        config.put("DEFAULT_BALLS_PER_DROP", GameConfig.DEFAULT_BALLS_PER_DROP);
        config.put("ENERGY_PER_BUMPER_HIT", GameConfig.ENERGY_PER_BUMPER_HIT);
        config.put("ENERGY_THRESHOLD_FOR_BONUS", GameConfig.ENERGY_THRESHOLD_FOR_BONUS);
        config.put("BONUS_INITIAL_BALLS", GameConfig.BONUS_INITIAL_BALLS);
        config.put("BONUS_RETRIGGER_BALLS", GameConfig.BONUS_RETRIGGER_BALLS);
        config.put("BONUS_MAX_TOTAL_BALLS", GameConfig.BONUS_MAX_TOTAL_BALLS);
        config.put("SPIN_POINTS_PER_HIT", GameConfig.SPIN_POINTS_PER_HIT);
        config.put("SPIN_POINTS_THRESHOLD", GameConfig.SPIN_POINTS_THRESHOLD);
        config.put("SLOTS", GameConfig.SLOTS);
        config.put("WHEEL_OUTCOMES", GameConfig.WHEEL_OUTCOMES);
        config.put("AUTO_DROP_COUNTS", GameConfig.AUTO_DROP_COUNTS);
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
}
