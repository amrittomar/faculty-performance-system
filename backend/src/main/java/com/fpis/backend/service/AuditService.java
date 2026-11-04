package com.fpis.backend.service;

import com.fpis.backend.domain.AuditLog;
import com.fpis.backend.repository.AuditLogRepository;
import com.fpis.backend.security.AuthContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class AuditService {
    private final AuditLogRepository repository;
    public AuditService(AuditLogRepository repository) { this.repository=repository; }
    public void record(String action, String type, String id, String details) {
        String actor;
        try { actor = AuthContext.email(); } catch (RuntimeException ex) { actor = "system"; }
        repository.save(new AuditLog(actor, action, type, id, details));
    }
    @Transactional(readOnly=true) public List<AuditLog> recent() { return repository.findTop100ByOrderByOccurredAtDesc(); }
}
