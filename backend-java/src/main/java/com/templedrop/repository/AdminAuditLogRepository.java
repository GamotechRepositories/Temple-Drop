package com.templedrop.repository;

import com.templedrop.model.AdminAuditLogDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AdminAuditLogRepository extends MongoRepository<AdminAuditLogDocument, String> {
    List<AdminAuditLogDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
