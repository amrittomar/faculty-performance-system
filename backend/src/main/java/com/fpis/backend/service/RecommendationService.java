package com.fpis.backend.service;

import com.fpis.backend.dto.ApiDtos.ScheduleRecommendation;
import com.fpis.backend.repository.AcademicEventRepository;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {
    private final AcademicEventRepository events;
    public RecommendationService(AcademicEventRepository events) { this.events=events; }
    public List<ScheduleRecommendation> recommend(Long facultyId, OffsetDateTime start, OffsetDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) throw new IllegalArgumentException("Requested scheduling window must have a valid start and end");
        List<ScheduleRecommendation> out = new ArrayList<>();
        OffsetDateTime cursor = start;
        var existing = events.findOverlaps(facultyId, start, end).stream().sorted((a,b) -> a.getStartAt().compareTo(b.getStartAt())).toList();
        for (var event : existing) {
            if (event.getStartAt().isAfter(cursor) && Duration.between(cursor, event.getStartAt()).toMinutes() >= 30)
                out.add(new ScheduleRecommendation(cursor, event.getStartAt(), "Available gap before " + event.getTitle()));
            if (event.getEndAt().isAfter(cursor)) cursor = event.getEndAt();
        }
        if (end.isAfter(cursor) && Duration.between(cursor, end).toMinutes() >= 30)
            out.add(new ScheduleRecommendation(cursor, end, "Available gap after existing calendar entries"));
        if (existing.isEmpty()) out.add(new ScheduleRecommendation(start, end, "No calendar conflicts in the requested window"));
        return out;
    }
}
