package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.*;
import com.fpis.backend.security.AuthContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class FacultyService {
    private final FacultyRepository faculty; private final DepartmentRepository departments; private final PasswordEncoder encoder;
    public FacultyService(FacultyRepository faculty, DepartmentRepository departments, PasswordEncoder encoder) { this.faculty=faculty; this.departments=departments; this.encoder=encoder; }
    public Faculty require(Long id) { return faculty.findById(id).orElseThrow(() -> new NotFoundException("Faculty " + id + " was not found")); }
    public FacultyProfileView profile(Long id) { return FacultyProfileView.from(require(id)); }
    public FacultyProfileView directoryProfile(Long actorId, Long targetId) {
        assertDepartmentAccess(actorId, targetId);
        return FacultyProfileView.from(require(targetId));
    }
    public FacultyProfileView updateProfile(Long id, ProfileUpdateRequest request) {
        Faculty member = require(id);
        member.updateProfile(member.getJobTitle(), request.expertise(), request.phone(), request.officeLocation(), request.bio());
        return FacultyProfileView.from(faculty.save(member));
    }
    public FacultyProfileView updateDirectoryProfile(Long actorId, Long targetId, FacultyAdminUpdateRequest request) {
        assertDepartmentAccess(actorId, targetId);
        Faculty actor = require(actorId);
        Faculty member = require(targetId);
        if (actor.getRole() == Role.HOD && member.getRole() != Role.FACULTY)
            throw new AccessDeniedException("Department heads may only edit faculty in their department");
        member.updateIdentity(request.fullName().trim(), request.jobTitle() == null ? null : request.jobTitle().trim());
        return FacultyProfileView.from(faculty.save(member));
    }
    public void resetPassword(Long actorId, Long targetId, PasswordUpdateRequest request) {
        assertDepartmentAccess(actorId, targetId);
        Faculty actor = require(actorId);
        Faculty member = require(targetId);
        if (actor.getRole() == Role.HOD && member.getRole() != Role.FACULTY)
            throw new AccessDeniedException("Department heads may only reset passwords for faculty in their department");
        member.updatePasswordHash(encoder.encode(request.newPassword()));
        faculty.save(member);
    }
    public void assertDepartmentAccess(Long actorId, Long targetId) {
        Faculty actor = require(actorId);
        Faculty target = require(targetId);
        if (actor.getRole() == Role.HOD && !actor.getDepartment().getId().equals(target.getDepartment().getId()))
            throw new AccessDeniedException("Department heads may only access faculty in their own department");
    }
    public List<FacultyView> list(Long departmentId) { return (departmentId == null ? faculty.findAll() : faculty.findByDepartmentId(departmentId)).stream().map(FacultyView::from).toList(); }
    public List<FacultyView> listForDepartmentHead(Long facultyId) {
        return list(require(facultyId).getDepartment().getId());
    }
    public FacultyView create(FacultyRequest req) {
        if (req.password() == null || req.password().length() < 10) throw new IllegalArgumentException("Password must contain at least 10 characters");
        if (faculty.existsByEmailIgnoreCase(req.email())) throw new ConflictException("A faculty account with this email already exists");
        Department d = departments.findById(req.departmentId()).orElseThrow(() -> new NotFoundException("Department " + req.departmentId() + " was not found"));
        Role actorRole = AuthContext.principal().role();
        if (actorRole == Role.HOD && req.role() != Role.FACULTY)
            throw new IllegalArgumentException("HOD users may only create FACULTY accounts");
        if (actorRole == Role.DEAN && req.role() == Role.ADMIN)
            throw new IllegalArgumentException("DEAN users may not create ADMIN accounts");
        if (actorRole == Role.HOD && !require(AuthContext.facultyId()).getDepartment().getId().equals(d.getId()))
            throw new IllegalArgumentException("HOD users may only create faculty in their own department");
        Faculty member = new Faculty(req.fullName(), req.email().toLowerCase(), encoder.encode(req.password()), req.role(), d);
        member.updateIdentity(req.fullName().trim(), req.jobTitle() == null ? null : req.jobTitle().trim());
        return FacultyView.from(faculty.save(member));
    }
}
