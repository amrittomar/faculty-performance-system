package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.PerformanceScore;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.PerformanceScoringService;
import com.fpis.backend.service.FacultyService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/performance")
public class PerformanceController {
    private final PerformanceScoringService service;
    private final FacultyService faculty;
    public PerformanceController(PerformanceScoringService service, FacultyService faculty) { this.service=service; this.faculty=faculty; }
    @GetMapping("/{facultyId}/score") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD') or #facultyId == authentication.principal.facultyId()")
    public PerformanceScore score(@PathVariable Long facultyId) {
        if (com.fpis.backend.security.AuthContext.principal().role() == com.fpis.backend.domain.Role.HOD)
            faculty.assertDepartmentAccess(com.fpis.backend.security.AuthContext.facultyId(), facultyId);
        return service.score(facultyId);
    }
    @GetMapping("/me/score") public PerformanceScore ownScore() { return service.score(AuthContext.facultyId()); }
}
