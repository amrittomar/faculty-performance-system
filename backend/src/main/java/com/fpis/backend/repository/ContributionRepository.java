package com.fpis.backend.repository;

import com.fpis.backend.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ContributionRepository extends JpaRepository<Contribution, Long> {
    List<Contribution> findByFacultyId(Long facultyId);
    List<Contribution> findByStatus(ApprovalStatus status);
    List<Contribution> findByFacultyIdAndStatus(Long facultyId, ApprovalStatus status);
}
