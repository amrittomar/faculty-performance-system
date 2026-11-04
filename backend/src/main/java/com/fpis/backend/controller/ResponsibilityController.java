package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.ResponsibilityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/responsibilities")
public class ResponsibilityController {
    private final ResponsibilityService service;
    public ResponsibilityController(ResponsibilityService service) { this.service=service; }
    @GetMapping public List<ResponsibilityView> list(@RequestParam(required=false) Long facultyId) {
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.FACULTY) facultyId=AuthContext.facultyId();
        if (facultyId==null) throw new IllegalArgumentException("facultyId is required for privileged users");
        return service.list(facultyId);
    }
    @PostMapping public ResponsibilityView create(@Valid @RequestBody ResponsibilityRequest r) { return service.create(AuthContext.facultyId(),r); }
}
