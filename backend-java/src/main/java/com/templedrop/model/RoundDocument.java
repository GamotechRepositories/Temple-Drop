package com.templedrop.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "rounds")
public class RoundDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String roundId;

    @Indexed
    private ObjectId userId;

    private String type; // PAID, BONUS_BALL

    @Indexed
    private String originRoundId;

    private long betPerBallCents;
    private int ballCount;
    private long totalBetCents;
    private List<BallOutcomeDoc> balls;
    private long boardPayoutCents = 0L;
    private long wheelPayoutCents = 0L;
    private long bonusPayoutCents = 0L;
    private long totalGrossPayoutCents = 0L;
    private long netPayoutCents = 0L;
    private boolean payoutCapReached = false;
    private int spinPointsEarned = 0;
    private int energyEarned = 0;

    @CreatedDate
    private Instant createdAt;

    public static class PegCoordDoc {
        private int row;
        private int col;

        public PegCoordDoc() {}
        public PegCoordDoc(int row, int col) {
            this.row = row;
            this.col = col;
        }

        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }

        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
    }

    public static class BallOutcomeDoc {
        private int index;
        private List<Integer> steps;
        private List<PegCoordDoc> visitedPegs;
        private List<PegCoordDoc> bumperHits;
        private int slotIndex;
        private String slotLabel;
        private boolean isSpin;
        private long rawPayoutCents;
        private long creditedPayoutCents;

        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }

        public List<Integer> getSteps() { return steps; }
        public void setSteps(List<Integer> steps) { this.steps = steps; }

        public List<PegCoordDoc> getVisitedPegs() { return visitedPegs; }
        public void setVisitedPegs(List<PegCoordDoc> visitedPegs) { this.visitedPegs = visitedPegs; }

        public List<PegCoordDoc> getBumperHits() { return bumperHits; }
        public void setBumperHits(List<PegCoordDoc> bumperHits) { this.bumperHits = bumperHits; }

        public int getSlotIndex() { return slotIndex; }
        public void setSlotIndex(int slotIndex) { this.slotIndex = slotIndex; }

        public String getSlotLabel() { return slotLabel; }
        public void setSlotLabel(String slotLabel) { this.slotLabel = slotLabel; }

        public boolean getIsSpin() { return isSpin; }
        public void setIsSpin(boolean spin) { isSpin = spin; }

        public long getRawPayoutCents() { return rawPayoutCents; }
        public void setRawPayoutCents(long rawPayoutCents) { this.rawPayoutCents = rawPayoutCents; }

        public long getCreditedPayoutCents() { return creditedPayoutCents; }
        public void setCreditedPayoutCents(long creditedPayoutCents) { this.creditedPayoutCents = creditedPayoutCents; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoundId() { return roundId; }
    public void setRoundId(String roundId) { this.roundId = roundId; }

    public ObjectId getUserId() { return userId; }
    public void setUserId(ObjectId userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getOriginRoundId() { return originRoundId; }
    public void setOriginRoundId(String originRoundId) { this.originRoundId = originRoundId; }

    public long getBetPerBallCents() { return betPerBallCents; }
    public void setBetPerBallCents(long betPerBallCents) { this.betPerBallCents = betPerBallCents; }

    public int getBallCount() { return ballCount; }
    public void setBallCount(int ballCount) { this.ballCount = ballCount; }

    public long getTotalBetCents() { return totalBetCents; }
    public void setTotalBetCents(long totalBetCents) { this.totalBetCents = totalBetCents; }

    public List<BallOutcomeDoc> getBalls() { return balls; }
    public void setBalls(List<BallOutcomeDoc> balls) { this.balls = balls; }

    public long getBoardPayoutCents() { return boardPayoutCents; }
    public void setBoardPayoutCents(long boardPayoutCents) { this.boardPayoutCents = boardPayoutCents; }

    public long getWheelPayoutCents() { return wheelPayoutCents; }
    public void setWheelPayoutCents(long wheelPayoutCents) { this.wheelPayoutCents = wheelPayoutCents; }

    public long getBonusPayoutCents() { return bonusPayoutCents; }
    public void setBonusPayoutCents(long bonusPayoutCents) { this.bonusPayoutCents = bonusPayoutCents; }

    public long getTotalGrossPayoutCents() { return totalGrossPayoutCents; }
    public void setTotalGrossPayoutCents(long totalGrossPayoutCents) { this.totalGrossPayoutCents = totalGrossPayoutCents; }

    public long getNetPayoutCents() { return netPayoutCents; }
    public void setNetPayoutCents(long netPayoutCents) { this.netPayoutCents = netPayoutCents; }

    public boolean isPayoutCapReached() { return payoutCapReached; }
    public void setPayoutCapReached(boolean payoutCapReached) { this.payoutCapReached = payoutCapReached; }

    public int getSpinPointsEarned() { return spinPointsEarned; }
    public void setSpinPointsEarned(int spinPointsEarned) { this.spinPointsEarned = spinPointsEarned; }

    public int getEnergyEarned() { return energyEarned; }
    public void setEnergyEarned(int energyEarned) { this.energyEarned = energyEarned; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
