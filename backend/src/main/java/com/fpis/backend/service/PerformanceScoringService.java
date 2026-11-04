package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.ContributionRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class PerformanceScoringService {
    private static final Map<String, Double> WEIGHTS = Map.of("TEACHING", .35, "RESEARCH", .35, "SERVICE", .20, "DEVELOPMENT", .10);
    private final ContributionRepository contributions;
    public PerformanceScoringService(ContributionRepository contributions) { this.contributions=contributions; }
    public PerformanceScore score(Long facultyId) {
        Map<String, Double> points = new HashMap<>();
        for (Contribution c : contributions.findByFacultyIdAndStatus(facultyId, ApprovalStatus.APPROVED)) {
            String category = normalize(c.getCategory());
            if (category != null) points.merge(category, c.getPoints(), Double::sum);
        }
        List<ScoreComponent> components = WEIGHTS.entrySet().stream().sorted(Map.Entry.comparingByKey()).map(e -> {
            double raw = points.getOrDefault(e.getKey(), 0.0);
            double normalized = Math.min(100.0, raw);
            return new ScoreComponent(e.getKey(), raw, e.getValue(), normalized * e.getValue(),
                String.format(Locale.ROOT, "%.2f approved points, capped at 100 before applying %.0f%% weight", raw, e.getValue()*100));
        }).toList();
        double total = components.stream().mapToDouble(ScoreComponent::weightedPoints).sum();
        return new PerformanceScore(facultyId, Math.round(total * 100.0) / 100.0, components);
    }
    private String normalize(String category) {
        String s = category.toUpperCase(Locale.ROOT);
        return switch (s) { case "TEACHING", "RESEARCH", "SERVICE", "DEVELOPMENT" -> s; default -> null; };
    }
}
