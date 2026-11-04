package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "faculty_goals", indexes = @Index(name = "idx_goals_faculty_date", columnList = "faculty_id,target_date"))
public class FacultyGoal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;
    @Column(nullable = false, length = 160)
    private String title;
    @Column(length = 1000)
    private String description;
    @Column(nullable = false, length = 40)
    private String category;
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;
    @Column(nullable = false)
    private int progress;

    protected FacultyGoal() {}
    public FacultyGoal(Faculty faculty, String title, String description, String category, LocalDate targetDate, int progress) {
        this.faculty = faculty;
        update(title, description, category, targetDate, progress);
    }
    public void update(String title, String description, String category, LocalDate targetDate, int progress) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.targetDate = targetDate;
        this.progress = progress;
    }
    public Long getId() { return id; }
    public Faculty getFaculty() { return faculty; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public LocalDate getTargetDate() { return targetDate; }
    public int getProgress() { return progress; }
}
