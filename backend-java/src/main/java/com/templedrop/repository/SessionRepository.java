package com.templedrop.repository;

import com.templedrop.model.SessionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Optional;

public interface SessionRepository extends MongoRepository<SessionDocument, String> {
    Optional<SessionDocument> findByTokenAndExpiresAtAfter(String token, Instant now);
    void deleteByToken(String token);
}
