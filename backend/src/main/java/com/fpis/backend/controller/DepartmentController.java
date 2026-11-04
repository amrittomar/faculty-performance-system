package com.fpis.backend.controller;
import com.fpis.backend.domain.Department;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.DepartmentRepository;
import com.fpis.backend.service.ConflictException;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentRepository repository;
    public DepartmentController(DepartmentRepository repository) { this.repository=repository; }
    @GetMapping public List<DepartmentView> list() { return repository.findAll().stream().map(DepartmentView::from).toList(); }
    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public DepartmentView create(@Valid @RequestBody DepartmentRequest r) {
        if (repository.existsByNameIgnoreCase(r.name())) throw new ConflictException("Department name already exists");
        return DepartmentView.from(repository.save(new Department(r.name(), r.code())));
    }
}
