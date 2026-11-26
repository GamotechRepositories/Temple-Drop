package com.templedrop.repository;

import com.templedrop.model.GameConfigVersionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GameConfigVersionRepository extends MongoRepository<GameConfigVersionDocument, String> {
    Optional<GameConfigVersionDocument> findFirstByStatusOrderByVersionDesc(String status);
    Optional<GameConfigVersionDocument> findFirstByVersion(int version);
    List<GameConfigVersionDocument> findAllByStatusInOrderByVersionDesc(List<String> statuses);
}
