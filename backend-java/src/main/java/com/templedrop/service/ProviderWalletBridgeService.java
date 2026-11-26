package com.templedrop.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonObject;
import com.templedrop.dto.AdminDtos;
import com.templedrop.exception.ApiException;
import com.templedrop.model.ProviderConfigDocument;
import com.templedrop.repository.ProviderConfigRepository;
import in.oreng.gamesdk.ProviderGameServerSDK;
import in.oreng.gamesdk.WalletOperationRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class ProviderWalletBridgeService {
    private final ProviderConfigRepository providerConfigRepository;
    private final ObjectMapper objectMapper;

    public ProviderWalletBridgeService(ProviderConfigRepository providerConfigRepository, ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.objectMapper = objectMapper;
    }

    public AdminDtos.PublicProviderConfigResponse getActivePublicConfig() {
        Optional<ProviderConfigDocument> docOpt = resolveActiveProvider(null);
        if (docOpt.isPresent()) {
            ProviderConfigDocument doc = docOpt.get();
            return new AdminDtos.PublicProviderConfigResponse(
                true,
                doc.getProviderCode(),
                doc.getName(),
                doc.getProviderApiUrl(),
                doc.getGameCode(),
                doc.getCurrency()
            );
        }
        String envUrl = System.getenv("PROVIDER_API_URL");
        if (envUrl != null && !envUrl.isBlank()) {
            return new AdminDtos.PublicProviderConfigResponse(
                true,
                "default",
                "Default Provider",
                envUrl.trim(),
                "temple-drop",
                "INR"
            );
        }
        return new AdminDtos.PublicProviderConfigResponse(false, null, null, null, null, null);
    }

    public Map<String, Object> getBalance(String sessionToken, String providerCode) {
        ProviderGameServerSDK sdk = buildSdk(providerCode);
        try {
            JsonObject result = sdk.getBalance(sessionToken);
            return toMap(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider getBalance failed: " + e.getMessage());
        }
    }

    public Map<String, Object> getPlayerProfile(String sessionToken, String providerCode) {
        ProviderGameServerSDK sdk = buildSdk(providerCode);
        try {
            JsonObject result = sdk.getPlayerProfile(sessionToken);
            return toMap(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider getPlayerProfile failed: " + e.getMessage());
        }
    }

    public Map<String, Object> debit(
        String sessionToken,
        double amount,
        String transactionId,
        String roundId,
        String tableId,
        String providerCode
    ) {
        ProviderGameServerSDK sdk = buildSdk(providerCode);
        try {
            WalletOperationRequest req = WalletOperationRequest.builder()
                .sessionToken(sessionToken)
                .amount(amount)
                .transactionId(transactionId)
                .roundId(roundId)
                .tableId(tableId)
                .build();
            JsonObject result = sdk.debit(req);
            return toMap(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider debit failed: " + e.getMessage());
        }
    }

    public Map<String, Object> credit(
        String sessionToken,
        double amount,
        String transactionId,
        String roundId,
        String tableId,
        String providerCode
    ) {
        ProviderGameServerSDK sdk = buildSdk(providerCode);
        try {
            WalletOperationRequest req = WalletOperationRequest.builder()
                .sessionToken(sessionToken)
                .amount(amount)
                .transactionId(transactionId)
                .roundId(roundId)
                .tableId(tableId)
                .build();
            JsonObject result = sdk.credit(req);
            return toMap(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider credit failed: " + e.getMessage());
        }
    }

    private ProviderGameServerSDK buildSdk(String providerCode) {
        Optional<ProviderConfigDocument> docOpt = resolveActiveProvider(providerCode);
        if (docOpt.isPresent()) {
            ProviderConfigDocument doc = docOpt.get();
            if (doc.getGameServerApiKey() == null || doc.getGameServerApiKey().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Provider API key is not configured for " + doc.getName());
            }
            return new ProviderGameServerSDK(doc.getProviderApiUrl(), doc.getGameServerApiKey());
        }

        String envUrl = System.getenv("PROVIDER_API_URL");
        String envKey = System.getenv("GAME_SERVER_API_KEY");
        if (envUrl != null && !envUrl.isBlank() && envKey != null && !envKey.isBlank()) {
            return new ProviderGameServerSDK(envUrl.trim(), envKey.trim());
        }

        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "No enabled game provider is configured");
    }

    private Optional<ProviderConfigDocument> resolveActiveProvider(String providerCode) {
        if (providerCode != null && !providerCode.isBlank()) {
            Optional<ProviderConfigDocument> byCode = providerConfigRepository.findByProviderCodeIgnoreCase(providerCode.trim());
            if (byCode.isPresent() && byCode.get().isEnabled()) {
                return byCode;
            }
        }
        Optional<ProviderConfigDocument> defaultOpt = providerConfigRepository.findFirstByEnabledTrueAndIsDefaultTrue();
        if (defaultOpt.isPresent()) {
            return defaultOpt;
        }
        return providerConfigRepository.findFirstByEnabledTrueOrderByUpdatedAtDesc();
    }

    private Map<String, Object> toMap(JsonObject jsonObject) throws Exception {
        if (jsonObject == null) return Map.of();
        return objectMapper.readValue(jsonObject.toString(), new TypeReference<Map<String, Object>>() {});
    }
}
