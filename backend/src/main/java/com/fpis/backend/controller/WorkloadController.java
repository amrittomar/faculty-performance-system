package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.WorkloadService;
import com.fpis.backend.service.FacultyService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/workloads")
public class WorkloadController {
    private final WorkloadService service;
    private final FacultyService faculty;
    public WorkloadController(WorkloadService service, FacultyService faculty) { this.service=service; this.faculty=faculty; }
    @GetMapping public List<WorkloadView> list(@RequestParam(required=false) Long facultyId) {
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.FACULTY) facultyId=AuthContext.facultyId();
        if (facultyId==null) throw new IllegalArgumentException("facultyId is required for privileged users");
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.HOD) faculty.assertDepartmentAccess(AuthContext.facultyId(), facultyId);
        return service.list(facultyId);
    }
    @PutMapping("/{facultyId}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public WorkloadView upsert(@PathVariable Long facultyId, @Valid @RequestBody WorkloadRequest r) { return service.upsert(facultyId,r); }
}
