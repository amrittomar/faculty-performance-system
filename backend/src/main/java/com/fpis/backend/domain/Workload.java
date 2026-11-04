package com.fpis.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "workloads", uniqueConstraints = @UniqueConstraint(columnNames = {"faculty_id", "academic_year", "term"}))
public class Workload {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "faculty_id", nullable = false) private Faculty faculty;
    @Column(name = "academic_year", nullable = false, length = 20) private String academicYear;
    @Column(nullable = false, length = 20) private String term;
    @Column(nullable = false) private double teachingHours;
    @Column(nullable = false) private double researchHours;
    @Column(nullable = false) private double serviceHours;
    protected Workload() {}
    public Workload(Faculty faculty, String academicYear, String term, double teachingHours, double researchHours, double serviceHours) {
        this.faculty = faculty; this.academicYear = academicYear; this.term = term; this.teachingHours = teachingHours;
        this.researchHours = researchHours; this.serviceHours = serviceHours;
    }
    public Long getId() { return id; } public Faculty getFaculty() { return faculty; } public String getAcademicYear() { return academicYear; }
    public String getTerm() { return term; } public double getTeachingHours() { return teachingHours; }
    public double getResearchHours() { return researchHours; } public double getServiceHours() { return serviceHours; }
    public void updateHours(double teaching, double research, double service) { teachingHours = teaching; researchHours = research; serviceHours = service; }
    public double getTotalHours() { return teachingHours + researchHours + serviceHours; }
    public double teachingRatio() { return getTotalHours() == 0 ? 0 : teachingHours / getTotalHours(); }
}
