package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class ContributionService {
    private final ContributionRepository contributions; private final FacultyService faculty; private final AuditService audit;
    public ContributionService(ContributionRepository contributions, FacultyService faculty, AuditService audit) { this.contributions=contributions; this.faculty=faculty; this.audit=audit; }
    public ContributionView submit(Long facultyId, ContributionRequest req) {
        String category = req.category().trim().toUpperCase(java.util.Locale.ROOT);
        if (!java.util.Set.of("TEACHING", "RESEARCH", "SERVICE", "DEVELOPMENT").contains(category))
            throw new IllegalArgumentException("category must be TEACHING, RESEARCH, SERVICE, or DEVELOPMENT");
        Contribution c = contributions.save(new Contribution(faculty.require(facultyId), category, req.title(), req.description(), req.points(), req.occurredOn()));
        audit.record("SUBMIT_CONTRIBUTION", "Contribution", c.getId().toString(), c.getTitle());
        return ContributionView.from(c);
    }
    public List<ContributionView> list(Long facultyId) {
        return (facultyId == null ? contributions.findAll() : contributions.findByFacultyId(facultyId)).stream().map(ContributionView::from).toList();
    }
    public List<ContributionView> listForDepartmentHead(Long actorId, Long facultyId) {
        Faculty head = faculty.require(actorId);
        if (facultyId != null) {
            faculty.assertDepartmentAccess(actorId, facultyId);
            return list(facultyId);
        }
        Long departmentId = head.getDepartment().getId();
        return contributions.findAll().stream()
            .filter(item -> item.getFaculty().getDepartment().getId().equals(departmentId))
            .map(ContributionView::from).toList();
    }
    public List<ContributionView> pending() { return contributions.findByStatus(ApprovalStatus.PENDING).stream().map(ContributionView::from).toList(); }
    public List<ContributionView> pendingForDepartmentHead(Long facultyId) {
        Long departmentId = faculty.require(facultyId).getDepartment().getId();
        return contributions.findByStatus(ApprovalStatus.PENDING).stream()
            .filter(c -> c.getFaculty().getDepartment().getId().equals(departmentId))
            .map(ContributionView::from).toList();
    }
    public ContributionView review(Long id, ReviewRequest request) {
        if (request.status() == ApprovalStatus.PENDING) throw new IllegalArgumentException("Review decision must be APPROVED or REJECTED");
        Contribution c = contributions.findById(id).orElseThrow(() -> new NotFoundException("Contribution " + id + " was not found"));
        Faculty reviewer = faculty.require(com.fpis.backend.security.AuthContext.facultyId());
        if (c.getStatus() != ApprovalStatus.PENDING) throw new ConflictException("Contribution has already been reviewed");
        if (reviewer.getRole() == Role.HOD && !reviewer.getDepartment().getId().equals(c.getFaculty().getDepartment().getId()))
            throw new IllegalArgumentException("HOD users may only review contributions from their own department");
        c.review(reviewer, request.status(), request.comment());
        audit.record("REVIEW_CONTRIBUTION", "Contribution", id.toString(), request.status().name());
        return ContributionView.from(c);
    }
}
