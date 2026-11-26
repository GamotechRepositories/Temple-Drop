package com.templedrop.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "idempotencykeys")
@CompoundIndex(name = "user_action_key_idx", def = "{'userId': 1, 'action': 1, 'key': 1}", unique = true)
public class IdempotencyKeyDocument {
    @Id
    private String id;

    private String key;
    private ObjectId userId;
    private String action;
    private String requestHash;
    private Map<String, Object> responseBody;
    private Integer statusCode;
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED

    @CreatedDate
    @Indexed(expireAfter = "86400s")
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public ObjectId getUserId() { return userId; }
    public void setUserId(ObjectId userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String requestHash) { this.requestHash = requestHash; }

    public Map<String, Object> getResponseBody() { return responseBody; }
    public void setResponseBody(Map<String, Object> responseBody) { this.responseBody = responseBody; }

    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
