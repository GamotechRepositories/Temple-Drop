package com.templedrop.repository;

import com.templedrop.model.PendingFeatureDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PendingFeatureRepository extends MongoRepository<PendingFeatureDocument, String> {
    List<PendingFeatureDocument> findByUserIdAndStatusInOrderByOrderAscCreatedAtAsc(ObjectId userId, Collection<String> statuses);
    long countByUserIdAndTypeAndStatusIn(ObjectId userId, String type, Collection<String> statuses);
    long countByUserIdAndStatusIn(ObjectId userId, Collection<String> statuses);
    Optional<PendingFeatureDocument> findFirstByUserIdOrderByOrderDesc(ObjectId userId);
}
