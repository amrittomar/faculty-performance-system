package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.service.FacultyService;
import com.fpis.backend.security.AuthContext;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/faculty")
public class FacultyController {
    private final FacultyService service;
    public FacultyController(FacultyService service) { this.service=service; }
    @GetMapping("/me") public FacultyProfileView myProfile() { return service.profile(AuthContext.facultyId()); }
    @PutMapping("/me") public FacultyProfileView updateMyProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return service.updateProfile(AuthContext.facultyId(), request);
    }
    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD') or #id == authentication.principal.facultyId()")
    public FacultyProfileView profile(@PathVariable Long id) { return service.directoryProfile(AuthContext.facultyId(), id); }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public FacultyProfileView update(@PathVariable Long id, @Valid @RequestBody FacultyAdminUpdateRequest request) {
        return service.updateDirectoryProfile(AuthContext.facultyId(), id, request);
    }
    @PutMapping("/{id}/password") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordUpdateRequest request) {
        service.resetPassword(AuthContext.facultyId(), id, request);
    }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public List<FacultyView> list(@RequestParam(required=false) Long departmentId) {
        if (AuthContext.principal().role() == com.fpis.backend.domain.Role.HOD) return service.listForDepartmentHead(AuthContext.facultyId());
        return service.list(departmentId);
    }
    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public FacultyView create(@Valid @RequestBody FacultyRequest request) { return service.create(request); }
}
