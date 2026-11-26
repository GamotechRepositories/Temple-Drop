package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.dto.AdminDtos;
import com.templedrop.exception.ApiException;
import com.templedrop.model.GameStateDocument;
import com.templedrop.model.PendingFeatureDocument;
import com.templedrop.model.ProviderConfigDocument;
import com.templedrop.model.RoundDocument;
import com.templedrop.model.UserDocument;
import com.templedrop.model.WalletDocument;
import com.templedrop.model.WalletLedgerDocument;
import com.templedrop.repository.GameStateRepository;
import com.templedrop.repository.PendingFeatureRepository;
import com.templedrop.repository.ProviderConfigRepository;
import com.templedrop.repository.RoundRepository;
import com.templedrop.repository.UserRepository;
import com.templedrop.repository.WalletLedgerRepository;
import com.templedrop.repository.WalletRepository;
import org.bson.types.ObjectId;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private final ProviderConfigRepository providerConfigRepository;
    private final UserRepository userRepository;
    private final RoundRepository roundRepository;
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final GameStateRepository gameStateRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;
    private final WalletService walletService;
    private final PendingFeatureRepository pendingFeatureRepository;
    private final AdminAuditService auditService;

    public AdminService(
        ProviderConfigRepository providerConfigRepository,
        UserRepository userRepository,
        RoundRepository roundRepository,
        WalletRepository walletRepository,
        WalletLedgerRepository walletLedgerRepository,
        GameStateRepository gameStateRepository,
        PasswordEncoder passwordEncoder,
        MongoTemplate mongoTemplate,
        WalletService walletService,
        PendingFeatureRepository pendingFeatureRepository,
        AdminAuditService auditService
    ) {
        this.providerConfigRepository = providerConfigRepository;
        this.userRepository = userRepository;
        this.roundRepository = roundRepository;
        this.walletRepository = walletRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.gameStateRepository = gameStateRepository;
        this.passwordEncoder = passwordEncoder;
        this.mongoTemplate = mongoTemplate;
        this.walletService = walletService;
        this.pendingFeatureRepository = pendingFeatureRepository;
        this.auditService = auditService;
    }

    public AdminDtos.AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalRounds = roundRepository.count();
        List<ProviderConfigDocument> providers = providerConfigRepository.findAll();
        long totalProviders = providers.size();
        long activeProviders = providers.stream().filter(ProviderConfigDocument::isEnabled).count();

        List<RoundDocument> recent = roundRepository.findAll(PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        long totalWagered = recent.stream().mapToLong(RoundDocument::getTotalBetCents).sum();
        long totalPayout = recent.stream().mapToLong(RoundDocument::getTotalGrossPayoutCents).sum();

        return new AdminDtos.AdminStatsResponse(
            totalUsers,
            totalRounds,
            totalProviders,
            activeProviders,
            totalWagered,
            totalPayout
        );
    }

    public List<AdminDtos.ProviderConfigResponse> listProviders() {
        return providerConfigRepository.findAllByOrderByIsDefaultDescUpdatedAtDesc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public AdminDtos.ProviderConfigResponse createProvider(AdminDtos.ProviderConfigRequest req) {
        String code = normalizeCode(req.providerCode());
        if (providerConfigRepository.findByProviderCodeIgnoreCase(code).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Provider code already exists: " + code);
        }

        boolean isDefault = Boolean.TRUE.equals(req.isDefault());
        if (isDefault) {
            clearExistingDefaults();
        }

        Instant now = Instant.now();
        ProviderConfigDocument doc = new ProviderConfigDocument();
        doc.setName(req.name().trim());
        doc.setProviderCode(code);
        doc.setProviderApiUrl(normalizeUrl(req.providerApiUrl()));
        doc.setGameServerApiKey(req.gameServerApiKey() != null ? req.gameServerApiKey().trim() : "");
        doc.setGameCode(req.gameCode() != null && !req.gameCode().isBlank() ? req.gameCode().trim() : "temple-drop");
        doc.setCurrency(req.currency() != null && !req.currency().isBlank() ? req.currency().trim().toUpperCase() : "INR");
        doc.setEnabled(req.enabled() == null || req.enabled());
        doc.setDefault(isDefault);
        doc.setNotes(req.notes() != null ? req.notes().trim() : "");
        doc.setCreatedAt(now);
        doc.setUpdatedAt(now);

        return toResponse(providerConfigRepository.save(doc));
    }

    public AdminDtos.ProviderConfigResponse updateProvider(String id, AdminDtos.ProviderConfigRequest req) {
        ProviderConfigDocument doc = providerConfigRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Provider not found"));

        String code = normalizeCode(req.providerCode());
        providerConfigRepository.findByProviderCodeIgnoreCase(code).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ApiException(HttpStatus.CONFLICT, "Provider code already exists: " + code);
            }
        });

        boolean isDefault = Boolean.TRUE.equals(req.isDefault());
        if (isDefault && !doc.isDefault()) {
            clearExistingDefaults();
        }

        doc.setName(req.name().trim());
        doc.setProviderCode(code);
        doc.setProviderApiUrl(normalizeUrl(req.providerApiUrl()));
        if (req.gameServerApiKey() != null && !req.gameServerApiKey().isBlank()) {
            doc.setGameServerApiKey(req.gameServerApiKey().trim());
        }
        if (req.gameCode() != null && !req.gameCode().isBlank()) {
            doc.setGameCode(req.gameCode().trim());
        }
        if (req.currency() != null && !req.currency().isBlank()) {
            doc.setCurrency(req.currency().trim().toUpperCase());
        }
        if (req.enabled() != null) {
            doc.setEnabled(req.enabled());
        }
        if (req.isDefault() != null) {
            doc.setDefault(req.isDefault());
        }
        if (req.notes() != null) {
            doc.setNotes(req.notes().trim());
        }
        doc.setUpdatedAt(Instant.now());

        return toResponse(providerConfigRepository.save(doc));
    }

    public void deleteProvider(String id) {
        if (!providerConfigRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Provider not found");
        }
        providerConfigRepository.deleteById(id);
    }

    public List<AdminDtos.AdminRoundSummary> listRecentRounds(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return roundRepository.findAll(PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt")))
            .getContent()
            .stream()
            .map(r -> new AdminDtos.AdminRoundSummary(
                r.getId(),
                r.getRoundId(),
                r.getType(),
                r.getTotalBetCents(),
                r.getTotalGrossPayoutCents(),
                r.getBallCount(),
                r.getCreatedAt()
            ))
            .toList();
    }

    public List<AdminDtos.AdminPlayerSummary> listPlayers(int limit, String queryText) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        Query q = new Query().with(Sort.by(Sort.Direction.ASC, "isGuest").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        if (queryText != null && !queryText.isBlank()) {
            q.addCriteria(Criteria.where("email").regex(java.util.regex.Pattern.quote(queryText.trim()), "i"));
        }
        q.limit(safeLimit);

        List<UserDocument> users = mongoTemplate.find(q, UserDocument.class);
        List<ObjectId> userIds = users.stream()
            .filter(u -> u.getId() != null && ObjectId.isValid(u.getId()))
            .map(u -> new ObjectId(u.getId()))
            .toList();

        Map<String, WalletDocument> walletByUserId = walletRepository.findByUserIdIn(userIds)
            .stream()
            .collect(Collectors.toMap(w -> w.getUserId().toHexString(), w -> w, (a, b) -> a));

        return users.stream()
            .map(u -> toPlayerSummary(u, walletByUserId.get(u.getId())))
            .toList();
    }

    public AdminDtos.AdminPlayerSummary createPlayer(AdminDtos.CreatePlayerRequest req) {
        String normalizedEmail = req.email().toLowerCase(Locale.ROOT).trim();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Player login already exists: " + normalizedEmail);
        }

        long initialBalance = req.initialBalanceCents() != null
            ? req.initialBalanceCents()
            : GameConfig.INITIAL_BALANCE_CENTS;

        String avatarId = (req.avatarId() != null && !req.avatarId().isBlank())
            ? req.avatarId().trim()
            : "explorer";

        UserDocument user = new UserDocument();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setGuest(false);
        user.setAvatarId(avatarId);
        user.getPreferences().setAvatarId(avatarId);
        user = userRepository.save(user);

        ObjectId userId = new ObjectId(user.getId());

        WalletDocument wallet = new WalletDocument();
        wallet.setUserId(userId);
        wallet.setBalanceCents(initialBalance);
        wallet.setInitialCents(initialBalance);
        wallet.setVersion(0L);
        wallet = walletRepository.save(wallet);

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setType("INITIAL");
        ledger.setAmountCents(initialBalance);
        ledger.setBalanceAfterCents(initialBalance);
        ledger.setDescription("Player created by admin");
        walletLedgerRepository.save(ledger);

        GameStateDocument gameState = new GameStateDocument();
        gameState.setUserId(userId);
        gameStateRepository.save(gameState);

        return toPlayerSummary(user, wallet);
    }

    public AdminDtos.AdminPlayerSummary adjustPlayerWallet(String userIdHex, AdminDtos.AdminWalletAdjustRequest req) {
        return adjustPlayerWallet(userIdHex, req, "admin");
    }

    public AdminDtos.AdminPlayerSummary adjustPlayerWallet(
        String userIdHex,
        AdminDtos.AdminWalletAdjustRequest req,
        String adminUsername
    ) {
        if (!ObjectId.isValid(userIdHex)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid player id");
        }
        UserDocument user = userRepository.findById(userIdHex)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found"));

        ObjectId userId = new ObjectId(userIdHex);
        WalletDocument wallet = walletService.getWallet(userId);

        String action = req.action().trim().toUpperCase(Locale.ROOT);
        long amount = req.amountCents();
        long delta;
        String ledgerType;

        switch (action) {
            case "CREDIT" -> {
                if (amount <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Credit amount must be greater than 0");
                delta = amount;
                ledgerType = "ADMIN_CREDIT";
            }
            case "DEBIT" -> {
                if (amount <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Debit amount must be greater than 0");
                if (wallet.getBalanceCents() < amount) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient player wallet balance");
                }
                delta = -amount;
                ledgerType = "ADMIN_DEBIT";
            }
            case "SET" -> {
                delta = amount - wallet.getBalanceCents();
                ledgerType = "ADMIN_SET";
            }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid action. Use CREDIT, DEBIT, or SET");
        }

        Criteria criteria = Criteria.where("userId").is(userId).and("version").is(wallet.getVersion());
        if (delta < 0) {
            criteria = criteria.and("balanceCents").gte(-delta);
        }

        Update update = new Update().inc("balanceCents", delta).inc("version", 1L);
        WalletDocument updated = mongoTemplate.findAndModify(
            new Query(criteria),
            update,
            FindAndModifyOptions.options().returnNew(true),
            WalletDocument.class
        );
        if (updated == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Wallet was modified concurrently. Please retry.");
        }

        String cleanReason = req.reason() != null && !req.reason().isBlank()
            ? req.reason().trim()
            : "Admin wallet adjustment (" + action + ")";

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setType(ledgerType);
        ledger.setAmountCents(delta);
        ledger.setBalanceAfterCents(updated.getBalanceCents());
        ledger.setAdminId(adminUsername != null ? adminUsername : "admin");
        ledger.setReason(cleanReason);
        ledger.setDescription(cleanReason);
        walletLedgerRepository.save(ledger);

        auditService.log(
            adminUsername,
            "WALLET_ADJUST",
            "PLAYER_WALLET",
            userIdHex,
            String.format("%s %s credits for %s (%s)", action, WalletService.formatCredits(Math.abs(delta)), user.getEmail(), cleanReason),
            Map.of(
                "action", action,
                "deltaCents", delta,
                "balanceAfterCents", updated.getBalanceCents(),
                "reason", cleanReason
            )
        );

        return toPlayerSummary(user, updated);
    }

    public void resetPlayerPassword(String userIdHex, String newPassword) {
        resetPlayerPassword(userIdHex, newPassword, "admin");
    }

    public void resetPlayerPassword(String userIdHex, String newPassword, String adminUsername) {
        UserDocument user = userRepository.findById(userIdHex)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setGuest(false);
        userRepository.save(user);

        auditService.log(
            adminUsername,
            "RESET_PLAYER_PASSWORD",
            "PLAYER",
            userIdHex,
            "Reset password for " + user.getEmail(),
            Map.of("email", user.getEmail())
        );
    }

    public Map<String, Object> getHistoricalPayoutReport() {
        List<RoundDocument> rounds = roundRepository.findAll();
        long totalWageredCents = 0L;
        long totalBoardPayoutCents = 0L;
        long totalWheelPayoutCents = 0L;
        long totalGrossPayoutCents = 0L;

        for (RoundDocument r : rounds) {
            totalWageredCents += r.getTotalBetCents();
            totalBoardPayoutCents += r.getBoardPayoutCents();
            totalWheelPayoutCents += r.getWheelPayoutCents();
            totalGrossPayoutCents += r.getTotalGrossPayoutCents();
        }

        long netCreditsCents = totalWageredCents - totalGrossPayoutCents;
        double historicalRtpPct = totalWageredCents > 0
            ? Math.round(((double) totalGrossPayoutCents / totalWageredCents) * 10000.0) / 100.0
            : 0.0;
        double historicalMarginPct = totalWageredCents > 0
            ? Math.round((100.0 - historicalRtpPct) * 100.0) / 100.0
            : 0.0;

        List<PendingFeatureDocument> pendingSpins = mongoTemplate.find(
            new Query(Criteria.where("type").is("WHEEL_SPIN").and("status").in(List.of("PENDING", "ACTIVE"))),
            PendingFeatureDocument.class
        );
        long pendingBetBasisSumCents = pendingSpins.stream()
            .mapToLong(PendingFeatureDocument::getBetPerBallCents)
            .sum();

        Map<String, Object> report = new java.util.LinkedHashMap<>();
        report.put("totalRounds", rounds.size());
        report.put("totalWageredCents", totalWageredCents);
        report.put("totalBoardPayoutCents", totalBoardPayoutCents);
        report.put("totalWheelPayoutCents", totalWheelPayoutCents);
        report.put("totalGrossPayoutCents", totalGrossPayoutCents);
        report.put("netCreditsCents", netCreditsCents);
        report.put("historicalRtpPct", historicalRtpPct);
        report.put("historicalMarginPct", historicalMarginPct);
        report.put("pendingSpinsCount", pendingSpins.size());
        report.put("pendingSpinsBetBasisSumCents", pendingBetBasisSumCents);
        report.put("hasIncompletePeriods", !pendingSpins.isEmpty());
        return report;
    }

    public Map<String, Object> getPlayerDetails(String userIdHex) {
        if (!ObjectId.isValid(userIdHex)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid player id");
        }
        UserDocument user = userRepository.findById(userIdHex)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found"));

        ObjectId userId = new ObjectId(userIdHex);
        WalletDocument wallet = walletRepository.findByUserId(userId).orElse(null);

        List<RoundDocument> allPlayerRounds = roundRepository.findByUserId(userId);
        allPlayerRounds.sort((a, b) -> {
            Instant ca = a.getCreatedAt() != null ? a.getCreatedAt() : Instant.EPOCH;
            Instant cb = b.getCreatedAt() != null ? b.getCreatedAt() : Instant.EPOCH;
            return cb.compareTo(ca);
        });

        long totalBetCents = 0L;
        long totalBoardPayoutCents = 0L;
        long totalWheelPayoutCents = 0L;
        long totalGrossPayoutCents = 0L;
        int winningDropsCount = 0;
        int winningRoundsCount = 0;

        List<Map<String, Object>> roundRows = new java.util.ArrayList<>();
        for (RoundDocument r : allPlayerRounds) {
            totalBetCents += r.getTotalBetCents();
            totalBoardPayoutCents += r.getBoardPayoutCents();
            totalWheelPayoutCents += r.getWheelPayoutCents();
            totalGrossPayoutCents += r.getTotalGrossPayoutCents();

            int roundWinningDrops = 0;
            if (r.getBalls() != null) {
                for (RoundDocument.BallOutcomeDoc b : r.getBalls()) {
                    if (b.getCreditedPayoutCents() > 0) {
                        roundWinningDrops++;
                    }
                }
            }
            winningDropsCount += roundWinningDrops;
            if (r.getTotalGrossPayoutCents() > r.getTotalBetCents()) {
                winningRoundsCount++;
            }

            if (roundRows.size() < 50) {
                Map<String, Object> row = new java.util.LinkedHashMap<>();
                row.put("id", r.getId());
                row.put("roundId", r.getRoundId());
                row.put("type", r.getType());
                row.put("configVersion", r.getConfigVersion());
                row.put("ballCount", r.getBallCount());
                row.put("winningDropsCount", roundWinningDrops);
                row.put("totalBetCents", r.getTotalBetCents());
                row.put("boardPayoutCents", r.getBoardPayoutCents());
                row.put("wheelPayoutCents", r.getWheelPayoutCents());
                row.put("totalGrossPayoutCents", r.getTotalGrossPayoutCents());
                row.put("netPayoutCents", r.getTotalGrossPayoutCents() - r.getTotalBetCents());
                row.put("createdAt", r.getCreatedAt());
                roundRows.add(row);
            }
        }

        long pendingSpinsCount = mongoTemplate.count(
            new Query(Criteria.where("userId").is(userId).and("type").is("WHEEL_SPIN").and("status").in(List.of("PENDING", "ACTIVE"))),
            PendingFeatureDocument.class
        );

        double playerRtpPct = totalBetCents > 0
            ? Math.round(((double) totalGrossPayoutCents / totalBetCents) * 10000.0) / 100.0
            : 0.0;

        Map<String, Object> summary = new java.util.LinkedHashMap<>();
        summary.put("totalRounds", allPlayerRounds.size());
        summary.put("totalBetCents", totalBetCents);
        summary.put("totalBoardPayoutCents", totalBoardPayoutCents);
        summary.put("totalWheelPayoutCents", totalWheelPayoutCents);
        summary.put("totalGrossPayoutCents", totalGrossPayoutCents);
        summary.put("netPayoutCents", totalGrossPayoutCents - totalBetCents);
        summary.put("playerRtpPct", playerRtpPct);
        summary.put("winningDropsCount", winningDropsCount);
        summary.put("winningRoundsCount", winningRoundsCount);
        summary.put("pendingSpinsCount", pendingSpinsCount);

        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("player", toPlayerSummary(user, wallet));
        out.put("summary", summary);
        out.put("rounds", roundRows);
        return out;
    }

    private AdminDtos.AdminPlayerSummary toPlayerSummary(UserDocument user, WalletDocument wallet) {
        return new AdminDtos.AdminPlayerSummary(
            user.getId(),
            user.getEmail(),
            user.isGuest(),
            user.getAvatarId(),
            wallet != null ? wallet.getBalanceCents() : 0L,
            wallet != null ? wallet.getInitialCents() : 0L,
            user.getCreatedAt()
        );
    }

    private void clearExistingDefaults() {
        List<ProviderConfigDocument> all = providerConfigRepository.findAll();
        for (ProviderConfigDocument item : all) {
            if (item.isDefault()) {
                item.setDefault(false);
                item.setUpdatedAt(Instant.now());
                providerConfigRepository.save(item);
            }
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toLowerCase().replaceAll("[^a-z0-9_-]", "-");
    }

    private String normalizeUrl(String url) {
        String trimmed = url.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private AdminDtos.ProviderConfigResponse toResponse(ProviderConfigDocument doc) {
        String key = doc.getGameServerApiKey();
        boolean hasKey = key != null && !key.isBlank();
        return new AdminDtos.ProviderConfigResponse(
            doc.getId(),
            doc.getName(),
            doc.getProviderCode(),
            doc.getProviderApiUrl(),
            maskKey(key),
            hasKey,
            doc.getGameCode(),
            doc.getCurrency(),
            doc.isEnabled(),
            doc.isDefault(),
            doc.getNotes(),
            doc.getCreatedAt(),
            doc.getUpdatedAt()
        );
    }

    private String maskKey(String key) {
        if (key == null || key.isBlank()) return "";
        if (key.length() <= 6) return "******";
        return key.substring(0, 3) + "••••" + key.substring(key.length() - 4);
    }
}
