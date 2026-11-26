package com.templedrop.service;

import com.templedrop.config.GameConfig;
import com.templedrop.exception.ApiException;
import com.templedrop.model.PendingFeatureDocument;
import com.templedrop.model.WalletDocument;
import com.templedrop.model.WalletLedgerDocument;
import com.templedrop.repository.PendingFeatureRepository;
import com.templedrop.repository.WalletLedgerRepository;
import com.templedrop.repository.WalletRepository;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final PendingFeatureRepository pendingFeatureRepository;
    private final MongoTemplate mongoTemplate;

    public WalletService(
        WalletRepository walletRepository,
        WalletLedgerRepository walletLedgerRepository,
        PendingFeatureRepository pendingFeatureRepository,
        MongoTemplate mongoTemplate
    ) {
        this.walletRepository = walletRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.pendingFeatureRepository = pendingFeatureRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public WalletDocument getWallet(ObjectId userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            WalletDocument wallet = new WalletDocument();
            wallet.setUserId(userId);
            wallet.setBalanceCents(GameConfig.INITIAL_BALANCE_CENTS);
            wallet.setInitialCents(GameConfig.INITIAL_BALANCE_CENTS);
            wallet.setVersion(0L);
            wallet = walletRepository.save(wallet);

            WalletLedgerDocument ledger = new WalletLedgerDocument();
            ledger.setUserId(userId);
            ledger.setType("INITIAL");
            ledger.setAmountCents(GameConfig.INITIAL_BALANCE_CENTS);
            ledger.setBalanceAfterCents(GameConfig.INITIAL_BALANCE_CENTS);
            ledger.setDescription("Welcome initial demo credits");
            walletLedgerRepository.save(ledger);
            return wallet;
        });
    }

    public WalletDocument debitBet(ObjectId userId, long betCents, String roundId) {
        if (betCents <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bet amount must be greater than zero");
        }

        WalletDocument wallet = getWallet(userId);
        if (wallet.getBalanceCents() < betCents) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient credits for this bet");
        }

        Query query = new Query(
            Criteria.where("userId").is(userId)
                .and("balanceCents").gte(betCents)
                .and("version").is(wallet.getVersion())
        );
        Update update = new Update().inc("balanceCents", -betCents).inc("version", 1L);
        WalletDocument updated = mongoTemplate.findAndModify(
            query,
            update,
            FindAndModifyOptions.options().returnNew(true),
            WalletDocument.class
        );

        if (updated == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Concurrent wallet update detected. Please try again.");
        }

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setRoundId(roundId);
        ledger.setType("BET");
        ledger.setAmountCents(-betCents);
        ledger.setBalanceAfterCents(updated.getBalanceCents());
        ledger.setDescription(String.format("Placed bet of %s credits on round %s", formatCredits(betCents), roundId));
        walletLedgerRepository.save(ledger);

        return updated;
    }

    public WalletDocument creditWin(ObjectId userId, long winCents, String type, String roundId, String description) {
        if (winCents < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Win amount cannot be negative");
        }
        if (winCents == 0) {
            return getWallet(userId);
        }

        Query query = new Query(Criteria.where("userId").is(userId));
        Update update = new Update().inc("balanceCents", winCents).inc("version", 1L);
        WalletDocument updated = mongoTemplate.findAndModify(
            query,
            update,
            FindAndModifyOptions.options().returnNew(true),
            WalletDocument.class
        );

        if (updated == null) {
            getWallet(userId);
            updated = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                WalletDocument.class
            );
        }

        if (updated == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Concurrent wallet update detected during payout");
        }

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setRoundId(roundId);
        ledger.setType(type);
        ledger.setAmountCents(winCents);
        ledger.setBalanceAfterCents(updated.getBalanceCents());
        ledger.setDescription(description);
        walletLedgerRepository.save(ledger);

        return updated;
    }

    public WalletDocument refillIfEligible(ObjectId userId) {
        WalletDocument wallet = getWallet(userId);
        if (wallet.getBalanceCents() >= GameConfig.MIN_BET_CENTS) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                String.format(
                    "Wallet has %s credits. Refill only available below %s credits.",
                    formatCredits(wallet.getBalanceCents()),
                    formatCredits(GameConfig.MIN_BET_CENTS)
                )
            );
        }

        long pendingCount = pendingFeatureRepository.countByUserIdAndStatusIn(
            userId,
            List.of("PENDING", "ACTIVE")
        );
        if (pendingCount > 0) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Please resolve your pending Free Spin or Bonus Round before refilling."
            );
        }

        long refillDelta = GameConfig.INITIAL_BALANCE_CENTS - wallet.getBalanceCents();
        Query query = new Query(
            Criteria.where("userId").is(userId)
                .and("version").is(wallet.getVersion())
        );
        Update update = new Update()
            .set("balanceCents", GameConfig.INITIAL_BALANCE_CENTS)
            .inc("version", 1L);

        WalletDocument updated = mongoTemplate.findAndModify(
            query,
            update,
            FindAndModifyOptions.options().returnNew(true),
            WalletDocument.class
        );
        if (updated == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Concurrent wallet update detected during refill");
        }

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setType("REFILL");
        ledger.setAmountCents(refillDelta);
        ledger.setBalanceAfterCents(updated.getBalanceCents());
        ledger.setDescription("Demo wallet refilled to 10,000 credits");
        walletLedgerRepository.save(ledger);

        return updated;
    }

    public static String formatCredits(long cents) {
        if (cents % 100 == 0) {
            return String.valueOf(cents / 100);
        }
        return String.valueOf(cents / 100.0);
    }
}
