package com.fpis.backend.repository;

import com.fpis.backend.domain.Workload;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface WorkloadRepository extends JpaRepository<Workload, Long> {
    List<Workload> findByFacultyId(Long facultyId);
    Optional<Workload> findByFacultyIdAndAcademicYearAndTerm(Long facultyId, String academicYear, String term);
}
