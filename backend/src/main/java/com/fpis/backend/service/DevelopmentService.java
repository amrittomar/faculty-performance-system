package com.fpis.backend.service;
import com.fpis.backend.domain.DevelopmentRecord;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.DevelopmentRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class DevelopmentService {
    private final DevelopmentRecordRepository repository; private final FacultyService faculty;
    public DevelopmentService(DevelopmentRecordRepository repository, FacultyService faculty) { this.repository=repository; this.faculty=faculty; }
    public DevelopmentView create(Long id, DevelopmentRequest r) {
        if (r.startDate()!=null && r.endDate()!=null && r.endDate().isBefore(r.startDate())) throw new IllegalArgumentException("End date cannot be before start date");
        return DevelopmentView.from(repository.save(new DevelopmentRecord(faculty.require(id), r.recordType(), r.title(), r.details(), r.startDate(), r.endDate(), r.completed())));
    }
    public List<DevelopmentView> list(Long id, String type) { return repository.findByFacultyId(id).stream().filter(d -> type == null || d.getRecordType().equals(type)).map(DevelopmentView::from).toList(); }
}
