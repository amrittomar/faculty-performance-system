package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "academic_events", indexes = @Index(name = "idx_events_faculty_time", columnList = "faculty_id,start_at,end_at"))
public class AcademicEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "faculty_id", nullable = false) private Faculty faculty;
    @Column(nullable = false, length = 180) private String title;
    @Column(nullable = false, length = 40) private String category;
    @Column(nullable = false) private OffsetDateTime startAt;
    @Column(nullable = false) private OffsetDateTime endAt;
    @Column(length = 500) private String location;
    protected AcademicEvent() {}
    public AcademicEvent(Faculty faculty, String title, OffsetDateTime startAt, OffsetDateTime endAt, String location) {
        this(faculty, title, "TEACHING", startAt, endAt, location);
    }
    public AcademicEvent(Faculty faculty, String title, String category, OffsetDateTime startAt, OffsetDateTime endAt, String location) {
        this.faculty = faculty; this.title = title; this.category = category; this.startAt = startAt; this.endAt = endAt; this.location = location;
    }
    public Long getId() { return id; } public Faculty getFaculty() { return faculty; } public String getTitle() { return title; } public String getCategory() { return category; }
    public OffsetDateTime getStartAt() { return startAt; } public OffsetDateTime getEndAt() { return endAt; } public String getLocation() { return location; }
    public void update(String title, String category, OffsetDateTime startAt, OffsetDateTime endAt, String location) {
        this.title = title; this.category = category; this.startAt = startAt; this.endAt = endAt; this.location = location;
    }
}
