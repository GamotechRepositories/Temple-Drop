package com.templedrop.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "walletledgers")
public class WalletLedgerDocument {
    @Id
    private String id;

    @Indexed
    private ObjectId userId;

    @Indexed
    private String roundId;

    private String featureId;
    private String type; // INITIAL, BET, WIN_BOARD, WIN_WHEEL, WIN_BONUS, REFILL
    private long amountCents;
    private long balanceAfterCents;
    private String description;
    private String adminId;
    private String reason;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ObjectId getUserId() { return userId; }
    public void setUserId(ObjectId userId) { this.userId = userId; }

    public String getRoundId() { return roundId; }
    public void setRoundId(String roundId) { this.roundId = roundId; }

    public String getFeatureId() { return featureId; }
    public void setFeatureId(String featureId) { this.featureId = featureId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public long getAmountCents() { return amountCents; }
    public void setAmountCents(long amountCents) { this.amountCents = amountCents; }

    public long getBalanceAfterCents() { return balanceAfterCents; }
    public void setBalanceAfterCents(long balanceAfterCents) { this.balanceAfterCents = balanceAfterCents; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
