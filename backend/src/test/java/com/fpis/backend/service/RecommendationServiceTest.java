package com.fpis.backend.service;

import com.fpis.backend.domain.*;
import com.fpis.backend.repository.AcademicEventRepository;
import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RecommendationServiceTest {
    @Test
    void recommendsConflictFreeGapsAroundExistingEvents() {
        AcademicEventRepository repository = mock(AcademicEventRepository.class);
        OffsetDateTime start = OffsetDateTime.parse("2026-10-31T09:00:00Z");
        OffsetDateTime end = OffsetDateTime.parse("2026-10-31T13:00:00Z");
        Faculty faculty = new Faculty("Faculty", "f@local", "hash", Role.FACULTY, new Department("CS", "CS"));
        when(repository.findOverlaps(2L, start, end)).thenReturn(List.of(
            new AcademicEvent(faculty, "Class", start.plusHours(1), start.plusHours(2), "Room"),
            new AcademicEvent(faculty, "Meeting", start.plusHours(3), start.plusHours(3).plusMinutes(30), "Office")));

        var results = new RecommendationService(repository).recommend(2L, start, end);

        assertEquals(3, results.size());
        assertEquals(start, results.get(0).startAt());
        assertEquals(start.plusHours(1), results.get(0).endAt());
        assertEquals(start.plusHours(2), results.get(1).startAt());
        assertEquals(end, results.get(2).endAt());
    }

    @Test
    void rejectsInvalidWindow() {
        var service = new RecommendationService(mock(AcademicEventRepository.class));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(1L,
          OffsetDateTime.parse("2026-10-31T12:00:00Z"), OffsetDateTime.parse("2026-10-31T12:00:00Z")));
    }
}
