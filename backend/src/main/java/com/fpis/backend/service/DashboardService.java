package com.fpis.backend.service;

import com.fpis.backend.domain.ApprovalStatus;
import com.fpis.backend.dto.ApiDtos.Dashboard;
import com.fpis.backend.repository.*;
import com.fpis.backend.domain.Faculty;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DashboardService {
    private final FacultyRepository faculties; private final DepartmentRepository departments; private final ContributionRepository contributions;
    public DashboardService(FacultyRepository f, DepartmentRepository d, ContributionRepository c) { faculties=f; departments=d; contributions=c; }
    public Dashboard summary() {
        return summarize(faculties.findAll(), departments.count());
    }
    public Dashboard summaryForDepartment(Long departmentId) {
        List<Faculty> departmentFaculty = faculties.findByDepartmentId(departmentId);
        return summarize(departmentFaculty, departmentFaculty.isEmpty() ? 0 : 1);
    }
    public Dashboard summaryForCoordinator(Long facultyId) {
        Faculty coordinator = faculties.findById(facultyId)
            .orElseThrow(() -> new IllegalArgumentException("Coordinator account was not found"));
        return summaryForDepartment(coordinator.getDepartment().getId());
    }
    public Dashboard summaryForFaculty(Long facultyId) {
        return summarize(faculties.findById(facultyId).stream().toList(), 1);
    }
    private Dashboard summarize(List<Faculty> scope, long departmentCount) {
        List<Long> facultyIds = scope.stream().map(Faculty::getId).toList();
        List<com.fpis.backend.domain.Contribution> activities = contributions.findAll().stream()
            .filter(c -> facultyIds.contains(c.getFaculty().getId())).toList();
        List<com.fpis.backend.domain.Contribution> approved = activities.stream()
            .filter(c -> c.getStatus()==ApprovalStatus.APPROVED).toList();
        double average = approved.stream().mapToDouble(com.fpis.backend.domain.Contribution::getPoints).average().orElse(0);
        long pending = activities.stream().filter(c -> c.getStatus()==ApprovalStatus.PENDING).count();
        return new Dashboard(scope.size(), departmentCount, pending, average, activities.size());
    }
}
