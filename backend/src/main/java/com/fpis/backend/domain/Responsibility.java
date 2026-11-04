package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "responsibilities")
public class Responsibility {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "faculty_id", nullable = false) private Faculty faculty;
    @Column(nullable = false, length = 160) private String title;
    @Column(length = 1000) private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    @Column(nullable = false) private double effortHours;
    protected Responsibility() {}
    public Responsibility(Faculty faculty, String title, String description, LocalDate startDate, LocalDate endDate, double effortHours) {
        this.faculty = faculty; this.title = title; this.description = description; this.startDate = startDate; this.endDate = endDate; this.effortHours = effortHours;
    }
    public Long getId() { return id; } public Faculty getFaculty() { return faculty; } public String getTitle() { return title; }
    public String getDescription() { return description; } public LocalDate getStartDate() { return startDate; } public LocalDate getEndDate() { return endDate; }
    public double getEffortHours() { return effortHours; }
}
