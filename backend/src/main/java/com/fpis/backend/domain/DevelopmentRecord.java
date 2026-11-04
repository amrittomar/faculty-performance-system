package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "development_records")
public class DevelopmentRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "faculty_id", nullable = false) private Faculty faculty;
    @Column(nullable = false, length = 30) private String recordType;
    @Column(nullable = false, length = 180) private String title;
    @Column(length = 1200) private String details;
    private LocalDate startDate;
    private LocalDate endDate;
    @Column(nullable = false) private boolean completed;
    protected DevelopmentRecord() {}
    public DevelopmentRecord(Faculty faculty, String recordType, String title, String details, LocalDate startDate, LocalDate endDate, boolean completed) {
        this.faculty = faculty; this.recordType = recordType; this.title = title; this.details = details; this.startDate = startDate; this.endDate = endDate; this.completed = completed;
    }
    public Long getId() { return id; } public Faculty getFaculty() { return faculty; } public String getRecordType() { return recordType; }
    public String getTitle() { return title; } public String getDetails() { return details; } public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; } public boolean isCompleted() { return completed; }
}
