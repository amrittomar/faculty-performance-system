package com.fpis.backend.controller;
import com.fpis.backend.domain.AuditLog;
import com.fpis.backend.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/audit")
public class AuditController {
    private final AuditService service;
    public AuditController(AuditService service) { this.service=service; }
    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> recent() { return service.recent(); }
}
