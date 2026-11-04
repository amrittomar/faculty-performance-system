package com.fpis.backend.service;

import com.fpis.backend.domain.Workload;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.WorkloadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class WorkloadService {
    private final WorkloadRepository repository; private final FacultyService faculty;
    public WorkloadService(WorkloadRepository repository, FacultyService faculty) { this.repository=repository; this.faculty=faculty; }
    public List<WorkloadView> list(Long facultyId) { return repository.findByFacultyId(facultyId).stream().map(WorkloadView::from).toList(); }
    public WorkloadView upsert(Long facultyId, WorkloadRequest r) {
        if (!Double.isFinite(r.teachingHours()+r.researchHours()+r.serviceHours())) throw new IllegalArgumentException("Workload hours must be finite");
        Workload w = repository.findByFacultyIdAndAcademicYearAndTerm(facultyId, r.academicYear(), r.term())
          .orElseGet(() -> new Workload(faculty.require(facultyId), r.academicYear(), r.term(), r.teachingHours(), r.researchHours(), r.serviceHours()));
        w.updateHours(r.teachingHours(), r.researchHours(), r.serviceHours());
        return WorkloadView.from(repository.save(w));
    }
}
