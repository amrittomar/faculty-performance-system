package com.fpis.backend.controller;

import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.FacultyReminderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class FacultyReminderController {
    private final FacultyReminderService service;

    public FacultyReminderController(FacultyReminderService service) { this.service = service; }
    @GetMapping public List<ReminderView> list() { return service.list(AuthContext.facultyId()); }
    @PostMapping public ReminderView create(@Valid @RequestBody ReminderRequest request) {
        return service.create(AuthContext.facultyId(), request);
    }
    @PatchMapping("/{id}/completion") public ReminderView setCompletion(@PathVariable Long id, @Valid @RequestBody ReminderCompletionRequest request) {
        return service.setCompletion(AuthContext.facultyId(), id, request);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { service.delete(AuthContext.facultyId(), id); }
}
