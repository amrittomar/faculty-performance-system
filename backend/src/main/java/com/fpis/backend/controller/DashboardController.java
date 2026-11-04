package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.Dashboard;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service=service; }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public Dashboard summary() { return service.summary(); }
    @GetMapping("/admin") @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public Dashboard admin() { return service.summary(); }
    @GetMapping("/coordinator") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public Dashboard coordinator() { return service.summaryForCoordinator(AuthContext.facultyId()); }
    @GetMapping("/faculty") @PreAuthorize("isAuthenticated()")
    public Dashboard faculty() { return service.summaryForFaculty(AuthContext.facultyId()); }
}
