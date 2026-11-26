package com.templedrop.repository;

import com.templedrop.model.GameStateDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GameStateRepository extends MongoRepository<GameStateDocument, String> {
    Optional<GameStateDocument> findByUserId(ObjectId userId);
}
