package com.templedrop.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "activebonuses")
public class ActiveBonusDocument {
    @Id
    private String id;

    @Indexed
    private ObjectId userId;

    private ObjectId featureId;

    @Indexed
    private String originRoundId;

    private long betPerBallCents;
    private int remainingBalls = 5;
    private int totalBallsGranted = 5;
    private int bonusEnergy = 0;
    private long accumulatedWinCents = 0L;
    private int ballsPlayed = 0;

    @Indexed
    private boolean isCompleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ObjectId getUserId() { return userId; }
    public void setUserId(ObjectId userId) { this.userId = userId; }

    public ObjectId getFeatureId() { return featureId; }
    public void setFeatureId(ObjectId featureId) { this.featureId = featureId; }

    public String getOriginRoundId() { return originRoundId; }
    public void setOriginRoundId(String originRoundId) { this.originRoundId = originRoundId; }

    public long getBetPerBallCents() { return betPerBallCents; }
    public void setBetPerBallCents(long betPerBallCents) { this.betPerBallCents = betPerBallCents; }

    public int getRemainingBalls() { return remainingBalls; }
    public void setRemainingBalls(int remainingBalls) { this.remainingBalls = remainingBalls; }

    public int getTotalBallsGranted() { return totalBallsGranted; }
    public void setTotalBallsGranted(int totalBallsGranted) { this.totalBallsGranted = totalBallsGranted; }

    public int getBonusEnergy() { return bonusEnergy; }
    public void setBonusEnergy(int bonusEnergy) { this.bonusEnergy = bonusEnergy; }

    public long getAccumulatedWinCents() { return accumulatedWinCents; }
    public void setAccumulatedWinCents(long accumulatedWinCents) { this.accumulatedWinCents = accumulatedWinCents; }

    public int getBallsPlayed() { return ballsPlayed; }
    public void setBallsPlayed(int ballsPlayed) { this.ballsPlayed = ballsPlayed; }

    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
