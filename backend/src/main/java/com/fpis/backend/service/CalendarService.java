package com.fpis.backend.service;

import com.fpis.backend.domain.AcademicEvent;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.AcademicEventRepository;
import com.fpis.backend.domain.Faculty;
import com.fpis.backend.domain.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fpis.backend.security.AuthContext;
import java.util.List;

@Service @Transactional
public class CalendarService {
    private final AcademicEventRepository repository; private final FacultyService faculty;
    public CalendarService(AcademicEventRepository repository, FacultyService faculty) { this.repository=repository; this.faculty=faculty; }
    public EventView create(Long facultyId, EventRequest req) {
        validate(req);
        if (!repository.findOverlaps(facultyId, req.startAt(), req.endAt()).isEmpty()) throw new ConflictException("Event conflicts with an existing faculty calendar entry");
        return EventView.from(repository.save(new AcademicEvent(faculty.require(facultyId), req.title(), req.category(), req.startAt(), req.endAt(), req.location())));
    }
    public EventView createForFaculty(Long actorId, Long facultyId, EventRequest req) {
        faculty.assertDepartmentAccess(actorId, facultyId);
        Faculty actor = faculty.require(actorId);
        Faculty target = faculty.require(facultyId);
        if (actor.getRole() == Role.HOD && target.getRole() != Role.FACULTY)
            throw new org.springframework.security.access.AccessDeniedException("Department heads may only schedule faculty in their department");
        return create(facultyId, req);
    }
    public List<EventView> list(Long facultyId) {
        List<AcademicEvent> events = facultyId == null ? repository.findAll() : repository.findByFacultyId(facultyId);
        return events.stream().map(EventView::from).toList();
    }
    public List<EventView> listForDepartmentHead(Long facultyId) {
        Long departmentId = faculty.require(facultyId).getDepartment().getId();
        List<Long> facultyIds = faculty.list(departmentId).stream().map(FacultyView::id).toList();
        return repository.findByFacultyIdIn(facultyIds).stream().map(EventView::from).toList();
    }
    public EventView update(Long id, EventRequest req) {
        validate(req);
        AcademicEvent event = repository.findById(id).orElseThrow(() -> new NotFoundException("Calendar event " + id + " was not found"));
        faculty.assertDepartmentAccess(AuthContext.facultyId(), event.getFaculty().getId());
        if (!repository.findOverlaps(event.getFaculty().getId(), req.startAt(), req.endAt()).stream().filter(other -> !other.getId().equals(id)).toList().isEmpty())
            throw new ConflictException("Event conflicts with an existing faculty calendar entry");
        event.update(req.title(), req.category(), req.startAt(), req.endAt(), req.location());
        return EventView.from(repository.save(event));
    }
    public void delete(Long id) {
        AcademicEvent event = repository.findById(id).orElseThrow(() -> new NotFoundException("Calendar event " + id + " was not found"));
        faculty.assertDepartmentAccess(AuthContext.facultyId(), event.getFaculty().getId());
        repository.delete(event);
    }
    private void validate(EventRequest req) {
        if (!req.endAt().isAfter(req.startAt())) throw new IllegalArgumentException("Event endAt must be later than startAt");
        if (!java.util.Set.of("TEACHING", "FDP", "MENTORING", "EXTRA_SESSION", "RESEARCH", "ENGAGEMENT").contains(req.category().toUpperCase(java.util.Locale.ROOT)))
            throw new IllegalArgumentException("Unsupported calendar event category");
    }
}
