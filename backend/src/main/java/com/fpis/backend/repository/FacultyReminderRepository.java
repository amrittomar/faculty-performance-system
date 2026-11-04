package com.fpis.backend.repository;

import com.fpis.backend.domain.FacultyReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FacultyReminderRepository extends JpaRepository<FacultyReminder, Long> {
    List<FacultyReminder> findByFacultyIdOrderByDueDateAsc(Long facultyId);
    Optional<FacultyReminder> findByIdAndFacultyId(Long id, Long facultyId);
}
