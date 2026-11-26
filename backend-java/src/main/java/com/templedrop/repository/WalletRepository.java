package com.templedrop.repository;

import com.templedrop.model.WalletDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends MongoRepository<WalletDocument, String> {
    Optional<WalletDocument> findByUserId(ObjectId userId);
    List<WalletDocument> findByUserIdIn(List<ObjectId> userIds);
}
