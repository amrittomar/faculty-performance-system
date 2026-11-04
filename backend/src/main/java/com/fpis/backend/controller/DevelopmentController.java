package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.DevelopmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/development")
public class DevelopmentController {
    private final DevelopmentService service;
    public DevelopmentController(DevelopmentService service) { this.service=service; }
    @GetMapping public List<DevelopmentView> list(@RequestParam(required=false) Long facultyId,@RequestParam(required=false) String type) {
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.FACULTY) facultyId=AuthContext.facultyId();
        if (facultyId==null) throw new IllegalArgumentException("facultyId is required for privileged users");
        return service.list(facultyId,type);
    }
    @PostMapping public DevelopmentView create(@Valid @RequestBody DevelopmentRequest r) { return service.create(AuthContext.facultyId(),r); }
}
