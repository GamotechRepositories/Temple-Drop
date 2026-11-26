package com.templedrop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templedrop.exception.ApiException;
import com.templedrop.model.IdempotencyKeyDocument;
import com.templedrop.repository.IdempotencyKeyRepository;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

@Service
public class IdempotencyService {
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    public IdempotencyService(IdempotencyKeyRepository idempotencyKeyRepository, ObjectMapper objectMapper) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.objectMapper = objectMapper;
    }

    public record ExecutionResult<T>(T body, boolean cacheHit, int statusCode) {}

    @SuppressWarnings("unchecked")
    public <T> ExecutionResult<T> execute(
        ObjectId userId,
        String action,
        String key,
        Object requestPayload,
        Class<T> responseType,
        Supplier<T> actionSupplier
    ) {
        if (key == null || key.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing required X-Idempotency-Key header");
        }

        String requestHash = sha256(requestPayload);
        Optional<IdempotencyKeyDocument> existingOpt =
            idempotencyKeyRepository.findByUserIdAndActionAndKey(userId, action, key);

        if (existingOpt.isPresent()) {
            IdempotencyKeyDocument existing = existingOpt.get();
            if (!requestHash.equals(existing.getRequestHash())) {
                throw new ApiException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Idempotency key reused with a different request payload"
                );
            }
            if ("COMPLETED".equals(existing.getStatus())) {
                T cached = objectMapper.convertValue(existing.getResponseBody(), responseType);
                int status = existing.getStatusCode() != null ? existing.getStatusCode() : 200;
                return new ExecutionResult<>(cached, true, status);
            }
            if ("IN_PROGRESS".equals(existing.getStatus())) {
                throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Concurrent request with this idempotency key is already in progress"
                );
            }
        }

        IdempotencyKeyDocument keyDoc = new IdempotencyKeyDocument();
        keyDoc.setKey(key);
        keyDoc.setUserId(userId);
        keyDoc.setAction(action);
        keyDoc.setRequestHash(requestHash);
        keyDoc.setStatus("IN_PROGRESS");

        try {
            keyDoc = idempotencyKeyRepository.save(keyDoc);
        } catch (DuplicateKeyException ex) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "Concurrent action detected from another tab or request"
            );
        }

        try {
            T result = actionSupplier.get();
            Map<String, Object> serialized = objectMapper.convertValue(result, Map.class);
            keyDoc.setStatus("COMPLETED");
            keyDoc.setStatusCode(200);
            keyDoc.setResponseBody(serialized);
            idempotencyKeyRepository.save(keyDoc);
            return new ExecutionResult<>(result, false, 200);
        } catch (RuntimeException ex) {
            idempotencyKeyRepository.deleteById(keyDoc.getId());
            throw ex;
        }
    }

    private String sha256(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload != null ? payload : Map.of());
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to hash request payload", e);
        }
    }
}
