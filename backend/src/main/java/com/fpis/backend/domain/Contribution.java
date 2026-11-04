package com.fpis.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contributions")
public class Contribution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "faculty_id", nullable = false) private Faculty faculty;
    @Column(nullable = false, length = 40) private String category;
    @Column(nullable = false, length = 180) private String title;
    @Column(length = 2000) private String description;
    @Column(nullable = false) private double points;
    private LocalDate occurredOn;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ApprovalStatus status = ApprovalStatus.PENDING;
    @ManyToOne @JoinColumn(name = "reviewer_id") private Faculty reviewer;
    @Column(length = 1000) private String reviewComment;
    @Column(nullable = false) private OffsetDateTime createdAt = OffsetDateTime.now();

    protected Contribution() {}
    public Contribution(Faculty faculty, String category, String title, String description, double points, LocalDate occurredOn) {
        this.faculty = faculty; this.category = category; this.title = title; this.description = description; this.points = points; this.occurredOn = occurredOn;
    }
    public Long getId() { return id; } public Faculty getFaculty() { return faculty; } public String getCategory() { return category; }
    public String getTitle() { return title; } public String getDescription() { return description; } public double getPoints() { return points; }
    public LocalDate getOccurredOn() { return occurredOn; } public ApprovalStatus getStatus() { return status; }
    public Faculty getReviewer() { return reviewer; } public String getReviewComment() { return reviewComment; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void review(Faculty actor, ApprovalStatus decision, String comment) { reviewer = actor; status = decision; reviewComment = comment; }
}
