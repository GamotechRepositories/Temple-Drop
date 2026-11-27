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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ProviderWalletBridgeService {
    private final ProviderConfigRepository providerConfigRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

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

    /**
     * Server-to-server call to operations /api/v1/wallet/* using X-Internal-Key.
     * Retries transient timeouts / 502 / ERR-0020 / ERR-0021 with the exact same payload (same tranid).
     */
    public Map<String, Object> callOperationsWallet(
        String walletSubPath,
        String partnerCode,
        Map<String, Object> payload
    ) {
        Optional<ProviderConfigDocument> docOpt = resolveActiveProvider(partnerCode);
        String baseUrl = docOpt.map(ProviderConfigDocument::getProviderApiUrl)
            .filter(u -> u != null && !u.isBlank())
            .orElse(System.getenv("PROVIDER_API_URL"));
        String internalKey = docOpt.map(ProviderConfigDocument::getGameServerApiKey)
            .filter(k -> k != null && !k.isBlank())
            .orElse(System.getenv("GAME_SERVER_API_KEY"));

        if (baseUrl == null || baseUrl.isBlank() || internalKey == null || internalKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Operations API URL or X-Internal-Key is not configured");
        }

        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String targetUrl = normalizedBase + "/wallet" + (walletSubPath.startsWith("/") ? walletSubPath : "/" + walletSubPath);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(payload != null ? payload : Map.of());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid operations wallet payload");
        }

        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("X-Internal-Key", internalKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                Map<String, Object> parsed = (response.body() != null && !response.body().isBlank())
                    ? objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {})
                    : Map.of("ok", true);

                String code = parsed.get("code") != null ? String.valueOf(parsed.get("code")) : "";
                String msg = parsed.get("error") != null
                    ? String.valueOf(parsed.get("error"))
                    : (parsed.get("message") != null ? String.valueOf(parsed.get("message")) : "Operations wallet error");

                if ("ERR-0011".equals(code) || "ERR-0012".equals(code) || "ERR-0013".equals(code)
                    || msg.contains("ERR-0011") || msg.contains("ERR-0012") || msg.contains("ERR-0013")) {
                    throw new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED: " + msg);
                }

                boolean isTransientCode = "ERR-0020".equals(code) || "ERR-0021".equals(code)
                    || response.statusCode() == 502 || response.statusCode() == 503 || response.statusCode() == 504;

                if (isTransientCode && attempt < maxAttempts) {
                    Thread.sleep(250L * attempt);
                    continue;
                }

                if (response.statusCode() == 400 || Boolean.FALSE.equals(parsed.get("status"))) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, msg);
                }
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "Operations wallet error (" + response.statusCode() + ")");
                }
                return parsed;
            } catch (ApiException ex) {
                throw ex;
            } catch (Exception e) {
                if (attempt < maxAttempts) {
                    try { Thread.sleep(250L * attempt); } catch (InterruptedException ignored) {}
                    continue;
                }
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Operations wallet call failed: " + e.getMessage());
            }
        }
        throw new ApiException(HttpStatus.BAD_GATEWAY, "Operations wallet call failed after retries");
    }

    public boolean hasOperationsConfig(String partnerCode) {
        Optional<ProviderConfigDocument> docOpt = resolveActiveProvider(partnerCode);
        if (docOpt.isPresent()) {
            ProviderConfigDocument doc = docOpt.get();
            if (doc.getProviderApiUrl() != null && !doc.getProviderApiUrl().isBlank()
                && doc.getGameServerApiKey() != null && !doc.getGameServerApiKey().isBlank()) {
                return true;
            }
        }
        String envUrl = System.getenv("PROVIDER_API_URL");
        String envKey = System.getenv("GAME_SERVER_API_KEY");
        return envUrl != null && !envUrl.isBlank() && envKey != null && !envKey.isBlank();
    }

    public Long fetchOperationsBalance(String token, String partnerCode) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("token", token);
        payload.put("partner_code", partnerCode);
        Map<String, Object> res = callOperationsWallet("/balance", partnerCode, payload);
        return extractAuthoritativeBalanceCents(res);
    }

    public Long settleOperationsTransfer(
        String token,
        String partnerCode,
        String gid,
        long betCents,
        long winCents,
        String gameType,
        int ttype,
        String roundId,
        String tranId
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("token", token);
        payload.put("partner_code", partnerCode);
        if (gid != null && !gid.isBlank()) {
            try {
                payload.put("gid", Long.parseLong(gid.trim()));
            } catch (NumberFormatException e) {
                payload.put("gid", gid.trim());
            }
        }
        payload.put("bet", betCents / 100.0);
        payload.put("win", winCents / 100.0);
        payload.put("game_type", gameType);
        payload.put("tranid", tranId);
        payload.put("ttype", ttype);
        payload.put("roundid", roundId);

        Map<String, Object> res = callOperationsWallet("/credit-transfer", partnerCode, payload);
        Object statusObj = res.get("status");
        if (statusObj instanceof Boolean b && !b) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Operations credit-transfer rejected (status=false)");
        }
        return extractAuthoritativeBalanceCents(res);
    }

    public Long refundOperationsTransfer(
        String token,
        String partnerCode,
        String gid,
        long betCents,
        String roundId
    ) {
        String refundTranId = (gid != null && !gid.isBlank() ? gid.trim() + "-" : "") + roundId + "-refund";
        return settleOperationsTransfer(
            token,
            partnerCode,
            gid,
            betCents,
            0L,
            "refund",
            2,
            roundId,
            refundTranId
        );
    }

    public Long extractAuthoritativeBalanceCents(Map<String, Object> res) {
        if (res == null) return null;
        Object raw = res.get("message");
        if (raw == null) raw = res.get("balance");
        if (raw == null) return null;
        if (raw instanceof Number n) {
            return Math.round(n.doubleValue() * 100.0);
        }
        try {
            return Math.round(Double.parseDouble(String.valueOf(raw).trim()) * 100.0);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public Map<String, Object> registerLaunchSession(Map<String, Object> launchParams) {
        String token = launchParams != null ? String.valueOf(launchParams.getOrDefault("token", "")) : "";
        if (token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Launch session token is required");
        }
        String partnerCode = launchParams.get("partnerCode") != null ? String.valueOf(launchParams.get("partnerCode")) : null;
        Optional<ProviderConfigDocument> provider = resolveActiveProvider(partnerCode);

        Long authoritativeBalanceCents = null;
        if (partnerCode != null && !partnerCode.isBlank() && hasOperationsConfig(partnerCode)) {
            try {
                authoritativeBalanceCents = fetchOperationsBalance(token, partnerCode);
            } catch (Exception ignored) {
                // Keep launch non-fatal if operations endpoint is unreachable in local dev
            }
        }

        Map<String, Object> ack = new LinkedHashMap<>();
        ack.put("accepted", true);
        ack.put("partnerCode", partnerCode);
        ack.put("gid", launchParams.get("gid"));
        ack.put("gameCode", launchParams.getOrDefault("gameCode", "temple-drop"));
        ack.put("currency", launchParams.getOrDefault("currency", "INR"));
        ack.put("lang", launchParams.getOrDefault("lang", "en"));
        ack.put("providerConfigured", provider.isPresent());
        if (authoritativeBalanceCents != null) {
            ack.put("authoritativeBalanceCents", authoritativeBalanceCents);
        }
        return ack;
    }
}
