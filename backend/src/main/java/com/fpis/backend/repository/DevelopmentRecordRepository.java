package com.fpis.backend.repository;
import com.fpis.backend.domain.DevelopmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DevelopmentRecordRepository extends JpaRepository<DevelopmentRecord, Long> { List<DevelopmentRecord> findByFacultyId(Long facultyId); }
