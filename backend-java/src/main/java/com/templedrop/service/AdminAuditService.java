package com.templedrop.service;

import com.templedrop.model.AdminAuditLogDocument;
import com.templedrop.repository.AdminAuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class AdminAuditService {
    private final AdminAuditLogRepository auditLogRepository;

    public AdminAuditService(AdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(
        String adminUsername,
        String action,
        String targetType,
        String targetId,
        String summary,
        Map<String, Object> details
    ) {
        AdminAuditLogDocument doc = new AdminAuditLogDocument();
        doc.setAdminUsername(adminUsername != null ? adminUsername : "admin");
        doc.setAction(action);
        doc.setTargetType(targetType);
        doc.setTargetId(targetId);
        doc.setSummary(summary);
        doc.setDetails(details);
        doc.setCreatedAt(Instant.now());
        auditLogRepository.save(doc);
    }

    public List<AdminAuditLogDocument> listRecent(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));
    }
}
