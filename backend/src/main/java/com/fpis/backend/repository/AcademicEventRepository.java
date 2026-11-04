package com.fpis.backend.repository;

import com.fpis.backend.domain.AcademicEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, Long> {
    @Query("select e from AcademicEvent e where e.faculty.id = :facultyId and e.startAt < :endAt and e.endAt > :startAt")
    List<AcademicEvent> findOverlaps(@Param("facultyId") Long facultyId, @Param("startAt") OffsetDateTime startAt, @Param("endAt") OffsetDateTime endAt);
    List<AcademicEvent> findByFacultyId(Long facultyId);
    List<AcademicEvent> findByFacultyIdIn(List<Long> facultyIds);
}
