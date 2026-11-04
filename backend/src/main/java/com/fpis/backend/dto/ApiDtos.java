package com.fpis.backend.dto;

import com.fpis.backend.domain.*;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, String tokenType, long expiresInMs, String email, Role role,
      String fullName, String jobTitle, String departmentName) {}
    public record DepartmentRequest(@NotBlank @Size(max=120) String name, @Size(max=80) String code) {}
    public record FacultyRequest(@NotBlank @Size(max=120) String fullName, @Email @NotBlank String email, @NotNull Long departmentId, @NotNull Role role, @Size(min=10) String password, @Size(max=100) String jobTitle) {}
    public record FacultyAdminUpdateRequest(@NotBlank @Size(max=120) String fullName, @Size(max=100) String jobTitle) {}
    public record PasswordUpdateRequest(@NotBlank @Size(min=10, max=128) String newPassword) {}
    public record ProfileUpdateRequest(@Size(max=100) String jobTitle, @Size(max=1000) String expertise,
      @Size(max=40) String phone, @Size(max=160) String officeLocation, @Size(max=2000) String bio) {}
    public record FacultyProfileView(Long id, String fullName, String email, Role role, String departmentName,
      String jobTitle, String expertise, String phone, String officeLocation, String bio) {
        public static FacultyProfileView from(Faculty f) {
            return new FacultyProfileView(f.getId(), f.getFullName(), f.getEmail(), f.getRole(), f.getDepartment().getName(),
              f.getJobTitle(), f.getExpertise(), f.getPhone(), f.getOfficeLocation(), f.getBio());
        }
    }
    public record GoalRequest(@NotBlank @Size(max=160) String title, @Size(max=1000) String description,
      @NotBlank @Size(max=40) String category, @NotNull LocalDate targetDate, @Min(0) @Max(100) int progress) {}
    public record GoalView(Long id, String title, String description, String category, LocalDate targetDate, int progress) {
        public static GoalView from(FacultyGoal goal) {
            return new GoalView(goal.getId(), goal.getTitle(), goal.getDescription(), goal.getCategory(), goal.getTargetDate(), goal.getProgress());
        }
    }
    public record ReminderRequest(@NotBlank @Size(max=160) String title, @Size(max=1000) String details, @NotNull LocalDate dueDate) {}
    public record ReminderCompletionRequest(@NotNull Boolean completed) {}
    public record ReminderView(Long id, String title, String details, LocalDate dueDate, boolean completed) {
        public static ReminderView from(FacultyReminder reminder) {
            return new ReminderView(reminder.getId(), reminder.getTitle(), reminder.getDetails(), reminder.getDueDate(), reminder.isCompleted());
        }
    }
    public record FacultyView(Long id, String fullName, String email, Role role, Long departmentId, String departmentName, String jobTitle, boolean active) {
        public static FacultyView from(Faculty f) { return new FacultyView(f.getId(), f.getFullName(), f.getEmail(), f.getRole(), f.getDepartment().getId(), f.getDepartment().getName(), f.getJobTitle(), f.isActive()); }
    }
    public record DepartmentView(Long id, String name, String code) {
        public static DepartmentView from(Department d) { return new DepartmentView(d.getId(), d.getName(), d.getCode()); }
    }
    public record ContributionRequest(@NotBlank @Size(max=40) String category, @NotBlank @Size(max=180) String title,
      @Size(max=2000) String description, @Positive double points, LocalDate occurredOn) {}
    public record ReviewRequest(@NotNull ApprovalStatus status, @Size(max=1000) String comment) {}
    public record ContributionView(Long id, Long facultyId, String facultyName, String category, String title, String description,
      double points, LocalDate occurredOn, ApprovalStatus status, String reviewerEmail, String reviewComment, OffsetDateTime createdAt) {
        public static ContributionView from(Contribution c) { return new ContributionView(c.getId(), c.getFaculty().getId(), c.getFaculty().getFullName(),
          c.getCategory(), c.getTitle(), c.getDescription(), c.getPoints(), c.getOccurredOn(), c.getStatus(),
          c.getReviewer() == null ? null : c.getReviewer().getEmail(), c.getReviewComment(), c.getCreatedAt()); }
    }
    public record WorkloadRequest(@NotBlank String academicYear, @NotBlank String term, @PositiveOrZero double teachingHours,
      @PositiveOrZero double researchHours, @PositiveOrZero double serviceHours) {}
    public record WorkloadView(Long id, Long facultyId, String academicYear, String term, double teachingHours,
      double researchHours, double serviceHours, double totalHours, double teachingRatio) {
        public static WorkloadView from(Workload w) { return new WorkloadView(w.getId(), w.getFaculty().getId(), w.getAcademicYear(), w.getTerm(),
          w.getTeachingHours(), w.getResearchHours(), w.getServiceHours(), w.getTotalHours(), w.teachingRatio()); }
    }
    public record EventRequest(@NotBlank @Size(max=180) String title, @NotBlank @Size(max=40) String category, @NotNull OffsetDateTime startAt,
      @NotNull OffsetDateTime endAt, @Size(max=500) String location) {}
    public record EventView(Long id, Long facultyId, String facultyName, String title, String category, OffsetDateTime startAt, OffsetDateTime endAt, String location) {
        public static EventView from(AcademicEvent e) { return new EventView(e.getId(), e.getFaculty().getId(), e.getFaculty().getFullName(), e.getTitle(), e.getCategory(), e.getStartAt(), e.getEndAt(), e.getLocation()); }
    }
    public record DevelopmentRequest(@NotBlank @Pattern(regexp="FDP|MENTORING") String recordType, @NotBlank @Size(max=180) String title,
       @Size(max=1200) String details, LocalDate startDate, LocalDate endDate, boolean completed) {}
    public record DevelopmentView(Long id, Long facultyId, String recordType, String title, String details, LocalDate startDate, LocalDate endDate, boolean completed) {
        public static DevelopmentView from(DevelopmentRecord d) { return new DevelopmentView(d.getId(), d.getFaculty().getId(), d.getRecordType(), d.getTitle(), d.getDetails(), d.getStartDate(), d.getEndDate(), d.isCompleted()); }
    }
    public record ResponsibilityRequest(@NotBlank @Size(max=160) String title, @Size(max=1000) String description,
      LocalDate startDate, LocalDate endDate, @PositiveOrZero double effortHours) {}
    public record ResponsibilityView(Long id, Long facultyId, String title, String description, LocalDate startDate, LocalDate endDate, double effortHours) {
        public static ResponsibilityView from(Responsibility r) { return new ResponsibilityView(r.getId(), r.getFaculty().getId(), r.getTitle(), r.getDescription(), r.getStartDate(), r.getEndDate(), r.getEffortHours()); }
    }
    public record ScoreComponent(String category, double points, double weight, double weightedPoints, String explanation) {}
    public record PerformanceScore(Long facultyId, double score, List<ScoreComponent> components) {}
    public record RecommendationRequest(@NotNull OffsetDateTime startAt, @NotNull OffsetDateTime endAt) {}
    public record ScheduleRecommendation(OffsetDateTime startAt, OffsetDateTime endAt, String explanation) {}
    public record Dashboard(long facultyCount, long departmentCount, long pendingContributions, double averageApprovedPoints, long totalActivities) {}
}
