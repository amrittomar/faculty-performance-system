package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.ContributionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/contributions")
public class ContributionController {
    private final ContributionService service;
    public ContributionController(ContributionService service) { this.service=service; }
    @PostMapping public ContributionView submit(@Valid @RequestBody ContributionRequest r) { return service.submit(AuthContext.facultyId(), r); }
    @GetMapping public List<ContributionView> list(@RequestParam(required=false) Long facultyId) {
        Long own = AuthContext.facultyId();
        if (AuthContext.principal().role() == com.fpis.backend.domain.Role.FACULTY) return service.list(own);
        if (AuthContext.principal().role() == com.fpis.backend.domain.Role.HOD)
            return service.listForDepartmentHead(own, facultyId);
        return service.list(facultyId);
    }
    @GetMapping("/pending") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public List<ContributionView> pending() {
        return AuthContext.principal().role() == com.fpis.backend.domain.Role.HOD
            ? service.pendingForDepartmentHead(AuthContext.facultyId()) : service.pending();
    }
    @PostMapping("/{id}/review") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public ContributionView review(@PathVariable Long id, @Valid @RequestBody ReviewRequest r) { return service.review(id,r); }
}
