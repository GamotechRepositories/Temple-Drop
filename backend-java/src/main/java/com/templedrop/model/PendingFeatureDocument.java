package com.templedrop.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "pendingfeatures")
public class PendingFeatureDocument {
    @Id
    private String id;

    @Indexed
    private ObjectId userId;

    @Indexed
    private String roundId;

    private String type; // WHEEL_SPIN, BONUS

    @Indexed
    private String status = "PENDING"; // PENDING, ACTIVE, RESOLVED

    private long betPerBallCents;

    @Indexed
    private int order = 0;

    private Map<String, Object> metadata;
    private Instant resolvedAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ObjectId getUserId() { return userId; }
    public void setUserId(ObjectId userId) { this.userId = userId; }

    public String getRoundId() { return roundId; }
    public void setRoundId(String roundId) { this.roundId = roundId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getBetPerBallCents() { return betPerBallCents; }
    public void setBetPerBallCents(long betPerBallCents) { this.betPerBallCents = betPerBallCents; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
