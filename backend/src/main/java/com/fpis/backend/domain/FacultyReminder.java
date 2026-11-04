package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "faculty_reminders", indexes = @Index(name = "idx_reminders_faculty_date", columnList = "faculty_id,due_date"))
public class FacultyReminder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;
    @Column(nullable = false, length = 160)
    private String title;
    @Column(length = 1000)
    private String details;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(nullable = false)
    private boolean completed;

    protected FacultyReminder() {}
    public FacultyReminder(Faculty faculty, String title, String details, LocalDate dueDate) {
        this.faculty = faculty;
        update(title, details, dueDate);
    }
    public void update(String title, String details, LocalDate dueDate) {
        this.title = title;
        this.details = details;
        this.dueDate = dueDate;
    }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Long getId() { return id; }
    public Faculty getFaculty() { return faculty; }
    public String getTitle() { return title; }
    public String getDetails() { return details; }
    public LocalDate getDueDate() { return dueDate; }
    public boolean isCompleted() { return completed; }
}
