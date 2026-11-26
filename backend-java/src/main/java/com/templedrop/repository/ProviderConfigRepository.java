package com.templedrop.repository;

import com.templedrop.model.ProviderConfigDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderConfigRepository extends MongoRepository<ProviderConfigDocument, String> {
    Optional<ProviderConfigDocument> findFirstByEnabledTrueAndIsDefaultTrue();
    Optional<ProviderConfigDocument> findFirstByEnabledTrueOrderByUpdatedAtDesc();
    Optional<ProviderConfigDocument> findByProviderCodeIgnoreCase(String providerCode);
    List<ProviderConfigDocument> findAllByOrderByIsDefaultDescUpdatedAtDesc();
}
