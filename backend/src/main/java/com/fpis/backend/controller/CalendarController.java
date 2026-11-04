package com.fpis.backend.controller;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.security.AuthContext;
import com.fpis.backend.service.CalendarService;
import com.fpis.backend.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import java.util.List;
@RestController @RequestMapping("/api/calendar")
public class CalendarController {
    private final CalendarService calendar; private final RecommendationService recommendations;
    public CalendarController(CalendarService calendar, RecommendationService recommendations) { this.calendar=calendar; this.recommendations=recommendations; }
    @GetMapping public List<EventView> list(@RequestParam(required=false) Long facultyId) {
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.FACULTY) facultyId=AuthContext.facultyId();
        if (AuthContext.principal().role()==com.fpis.backend.domain.Role.HOD) return calendar.listForDepartmentHead(AuthContext.facultyId());
        return calendar.list(facultyId);
    }
    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public EventView create(@Valid @RequestBody EventRequest r) { return calendar.create(AuthContext.facultyId(),r); }
    @PostMapping("/faculty/{facultyId}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public EventView createForFaculty(@PathVariable Long facultyId, @Valid @RequestBody EventRequest r) {
        return calendar.createForFaculty(AuthContext.facultyId(), facultyId, r);
    }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    public EventView update(@PathVariable Long id, @Valid @RequestBody EventRequest r) { return calendar.update(id, r); }
    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DEAN','HOD')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { calendar.delete(id); }
    @PostMapping("/recommendations") public List<ScheduleRecommendation> recommend(@Valid @RequestBody RecommendationRequest r) {
        return recommendations.recommend(AuthContext.facultyId(), r.startAt(), r.endAt());
    }
}
