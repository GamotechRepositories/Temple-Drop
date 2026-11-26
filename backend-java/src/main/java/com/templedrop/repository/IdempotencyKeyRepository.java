package com.templedrop.repository;

import com.templedrop.model.IdempotencyKeyDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface IdempotencyKeyRepository extends MongoRepository<IdempotencyKeyDocument, String> {
    Optional<IdempotencyKeyDocument> findByUserIdAndActionAndKey(ObjectId userId, String action, String key);
}
