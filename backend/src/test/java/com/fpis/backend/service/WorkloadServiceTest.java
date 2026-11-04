package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.dto.ApiDtos.WorkloadRequest;
import com.fpis.backend.repository.DepartmentRepository;
import com.fpis.backend.repository.FacultyRepository;
import com.fpis.backend.repository.WorkloadRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkloadServiceTest {
    @Test
    void computesTotalHoursAndTeachingRatio() {
        WorkloadRepository repo = mock(WorkloadRepository.class);
        FacultyRepository facultyRepository = mock(FacultyRepository.class);
        FacultyService facultyService = new FacultyService(facultyRepository, mock(DepartmentRepository.class), mock(PasswordEncoder.class));
        Faculty faculty = new Faculty("Faculty", "f@local", "hash", Role.FACULTY, new Department("CS", "CS"));
        when(facultyRepository.findById(11L)).thenReturn(Optional.of(faculty));
        when(repo.findByFacultyIdAndAcademicYearAndTerm(11L, "2026-27", "Fall")).thenReturn(Optional.empty());
        when(repo.save(any(Workload.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = new WorkloadService(repo, facultyService).upsert(11L, new WorkloadRequest("2026-27", "Fall", 12, 8, 4));

        assertEquals(24, result.totalHours(), 0.001);
        assertEquals(.5, result.teachingRatio(), 0.001);
    }

    @Test
    void updatesExistingPeriodInsteadOfCreatingDuplicate() {
        WorkloadRepository repo = mock(WorkloadRepository.class);
        FacultyRepository facultyRepository = mock(FacultyRepository.class);
        FacultyService facultyService = new FacultyService(facultyRepository, mock(DepartmentRepository.class), mock(PasswordEncoder.class));
        Faculty faculty = new Faculty("Faculty", "f@local", "hash", Role.FACULTY, new Department("CS", "CS"));
        Workload existing = new Workload(faculty, "2026-27", "Fall", 10, 5, 5);
        when(repo.findByFacultyIdAndAcademicYearAndTerm(11L, "2026-27", "Fall")).thenReturn(Optional.of(existing));
        when(repo.save(any(Workload.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = new WorkloadService(repo, facultyService).upsert(11L, new WorkloadRequest("2026-27", "Fall", 15, 5, 5));

        assertEquals(25, result.totalHours(), 0.001);
        verify(facultyRepository, never()).findById(anyLong());
    }
}
