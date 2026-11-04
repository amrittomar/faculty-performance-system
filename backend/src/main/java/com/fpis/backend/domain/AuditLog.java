package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 180) private String actorEmail;
    @Column(nullable = false, length = 80) private String action;
    @Column(nullable = false, length = 80) private String entityType;
    @Column(length = 80) private String entityId;
    @Column(length = 2000) private String details;
    @Column(nullable = false) private OffsetDateTime occurredAt = OffsetDateTime.now();
    protected AuditLog() {}
    public AuditLog(String actorEmail, String action, String entityType, String entityId, String details) {
        this.actorEmail = actorEmail; this.action = action; this.entityType = entityType; this.entityId = entityId; this.details = details;
    }
    public Long getId() { return id; } public String getActorEmail() { return actorEmail; } public String getAction() { return action; }
    public String getEntityType() { return entityType; } public String getEntityId() { return entityId; }
    public String getDetails() { return details; } public OffsetDateTime getOccurredAt() { return occurredAt; }
}
