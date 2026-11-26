package com.templedrop.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "providerconfigs")
public class ProviderConfigDocument {
    @Id
    private String id;
    private String name;
    private String providerCode;
    private String providerApiUrl;
    private String gameServerApiKey;
    private String gameCode;
    private String currency;
    private boolean enabled;
    private boolean isDefault;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProviderCode() { return providerCode; }
    public void setProviderCode(String providerCode) { this.providerCode = providerCode; }

    public String getProviderApiUrl() { return providerApiUrl; }
    public void setProviderApiUrl(String providerApiUrl) { this.providerApiUrl = providerApiUrl; }

    public String getGameServerApiKey() { return gameServerApiKey; }
    public void setGameServerApiKey(String gameServerApiKey) { this.gameServerApiKey = gameServerApiKey; }

    public String getGameCode() { return gameCode; }
    public void setGameCode(String gameCode) { this.gameCode = gameCode; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
