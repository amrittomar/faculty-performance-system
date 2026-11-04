package com.fpis.backend.repository;

import com.fpis.backend.domain.FacultyGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FacultyGoalRepository extends JpaRepository<FacultyGoal, Long> {
    List<FacultyGoal> findByFacultyIdOrderByTargetDateAsc(Long facultyId);
    Optional<FacultyGoal> findByIdAndFacultyId(Long id, Long facultyId);
}
