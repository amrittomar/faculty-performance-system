package com.fpis.backend.service;
import com.fpis.backend.domain.Responsibility;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.ResponsibilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class ResponsibilityService {
    private final ResponsibilityRepository repository; private final FacultyService faculty;
    public ResponsibilityService(ResponsibilityRepository repository, FacultyService faculty) { this.repository=repository; this.faculty=faculty; }
    public ResponsibilityView create(Long id, ResponsibilityRequest r) {
        if (r.startDate()!=null && r.endDate()!=null && r.endDate().isBefore(r.startDate())) throw new IllegalArgumentException("End date cannot be before start date");
        return ResponsibilityView.from(repository.save(new Responsibility(faculty.require(id), r.title(), r.description(), r.startDate(), r.endDate(), r.effortHours())));
    }
    public List<ResponsibilityView> list(Long id) { return repository.findByFacultyId(id).stream().map(ResponsibilityView::from).toList(); }
}
