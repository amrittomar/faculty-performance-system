package com.fpis.backend.repository;

import com.fpis.backend.domain.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<Faculty> findByDepartmentId(Long departmentId);
}
