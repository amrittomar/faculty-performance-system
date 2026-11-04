package com.fpis.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "faculty", indexes = @Index(name = "idx_faculty_department", columnList = "department_id"))
public class Faculty {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Column(nullable = false, length = 120)
    private String fullName;
    @Email @NotBlank @Column(nullable = false, unique = true, length = 180)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Role role;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
    @Column(nullable = false)
    private boolean active = true;
    @Column(length = 100)
    private String jobTitle;
    @Column(length = 1000)
    private String expertise;
    @Column(length = 40)
    private String phone;
    @Column(length = 160)
    private String officeLocation;
    @Column(length = 2000)
    private String bio;

    protected Faculty() {}
    public Faculty(String fullName, String email, String passwordHash, Role role, Department department) {
        this.fullName = fullName; this.email = email; this.passwordHash = passwordHash; this.role = role; this.department = department;
    }
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public Department getDepartment() { return department; }
    public boolean isActive() { return active; }
    public String getJobTitle() { return jobTitle; }
    public String getExpertise() { return expertise; }
    public String getPhone() { return phone; }
    public String getOfficeLocation() { return officeLocation; }
    public String getBio() { return bio; }
    public void setFullName(String v) { fullName = v; }
    public void setEmail(String v) { email = v; }
    public void setRole(Role v) { role = v; }
    public void setDepartment(Department v) { department = v; }
    public void setActive(boolean v) { active = v; }
    public void updateIdentity(String fullName, String jobTitle) {
        this.fullName = fullName;
        this.jobTitle = jobTitle;
    }
    public void updatePasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void updateProfile(String jobTitle, String expertise, String phone, String officeLocation, String bio) {
        this.jobTitle = jobTitle;
        this.expertise = expertise;
        this.phone = phone;
        this.officeLocation = officeLocation;
        this.bio = bio;
    }
}
