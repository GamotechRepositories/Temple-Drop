package com.templedrop.repository;

import com.templedrop.model.ActiveBonusDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ActiveBonusRepository extends MongoRepository<ActiveBonusDocument, String> {
    Optional<ActiveBonusDocument> findFirstByUserIdAndIsCompletedFalse(ObjectId userId);
}
