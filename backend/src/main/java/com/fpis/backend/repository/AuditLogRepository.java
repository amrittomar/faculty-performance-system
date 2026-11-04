package com.fpis.backend.repository;
import com.fpis.backend.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> { List<AuditLog> findTop100ByOrderByOccurredAtDesc(); }
