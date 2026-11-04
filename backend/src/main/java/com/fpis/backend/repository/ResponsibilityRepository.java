package com.fpis.backend.repository;
import com.fpis.backend.domain.Responsibility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResponsibilityRepository extends JpaRepository<Responsibility, Long> { List<Responsibility> findByFacultyId(Long facultyId); }
