package com.fpis.backend.controller;

import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.FacultyGoalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class FacultyGoalController {
    private final FacultyGoalService service;

    public FacultyGoalController(FacultyGoalService service) { this.service = service; }
    @GetMapping public List<GoalView> list() { return service.list(AuthContext.facultyId()); }
    @PostMapping public GoalView create(@Valid @RequestBody GoalRequest request) { return service.create(AuthContext.facultyId(), request); }
    @PutMapping("/{id}") public GoalView update(@PathVariable Long id, @Valid @RequestBody GoalRequest request) {
        return service.update(AuthContext.facultyId(), id, request);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { service.delete(AuthContext.facultyId(), id); }
}
