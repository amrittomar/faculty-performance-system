package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.repository.ContributionRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PerformanceScoringServiceTest {
    @Test
    void weightsApprovedPointsAndCapsEachCategoryAtOneHundred() {
        ContributionRepository repository = mock(ContributionRepository.class);
        Faculty faculty = new Faculty("Faculty", "f@local", "hash", Role.FACULTY, new Department("CS", "CS"));
        when(repository.findByFacultyIdAndStatus(7L, ApprovalStatus.APPROVED)).thenReturn(List.of(
            new Contribution(faculty, "TEACHING", "Teaching", "", 120, null),
            new Contribution(faculty, "RESEARCH", "Research", "", 40, null),
            new Contribution(faculty, "SERVICE", "Service", "", 10, null)));

        var result = new PerformanceScoringService(repository).score(7L);

        assertEquals(51, result.score(), 0.001);
        assertEquals(4, result.components().size());
        var teaching = result.components().stream().filter(c -> c.category().equals("TEACHING")).findFirst().orElseThrow();
        assertEquals(35.0, teaching.weightedPoints(), 0.001);
        assertTrue(teaching.explanation().contains("capped at 100"));
    }

    @Test
    void pendingContributionsDoNotInfluenceScore() {
        ContributionRepository repository = mock(ContributionRepository.class);
        when(repository.findByFacultyIdAndStatus(3L, ApprovalStatus.APPROVED)).thenReturn(List.of());
        assertEquals(0, new PerformanceScoringService(repository).score(3L).score());
        verify(repository).findByFacultyIdAndStatus(3L, ApprovalStatus.APPROVED);
    }
}
