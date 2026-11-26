package com.templedrop.repository;

import com.templedrop.model.RoundDocument;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RoundRepository extends MongoRepository<RoundDocument, String> {
    Optional<RoundDocument> findByRoundIdAndUserId(String roundId, ObjectId userId);
    Optional<RoundDocument> findFirstByUserIdAndTypeOrderByCreatedAtDesc(ObjectId userId, String type);
    List<RoundDocument> findByUserIdAndTypeOrderByCreatedAtDesc(ObjectId userId, String type, Pageable pageable);
    List<RoundDocument> findByUserIdOrderByCreatedAtDesc(ObjectId userId, Pageable pageable);
    List<RoundDocument> findByUserId(ObjectId userId);
    long countByUserIdAndType(ObjectId userId, String type);
}
