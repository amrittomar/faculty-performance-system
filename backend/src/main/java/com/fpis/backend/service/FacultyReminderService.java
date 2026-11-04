package com.fpis.backend.service;

import com.fpis.backend.domain.FacultyReminder;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.FacultyReminderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class FacultyReminderService {
    private final FacultyReminderRepository repository;
    private final FacultyService faculty;

    public FacultyReminderService(FacultyReminderRepository repository, FacultyService faculty) {
        this.repository = repository;
        this.faculty = faculty;
    }

    public List<ReminderView> list(Long facultyId) {
        return repository.findByFacultyIdOrderByDueDateAsc(facultyId).stream().map(ReminderView::from).toList();
    }

    public ReminderView create(Long facultyId, ReminderRequest request) {
        return ReminderView.from(repository.save(new FacultyReminder(faculty.require(facultyId), request.title(), request.details(), request.dueDate())));
    }

    public ReminderView setCompletion(Long facultyId, Long reminderId, ReminderCompletionRequest request) {
        FacultyReminder reminder = requireOwned(facultyId, reminderId);
        reminder.setCompleted(request.completed());
        return ReminderView.from(repository.save(reminder));
    }

    public void delete(Long facultyId, Long reminderId) {
        repository.delete(requireOwned(facultyId, reminderId));
    }

    private FacultyReminder requireOwned(Long facultyId, Long reminderId) {
        return repository.findByIdAndFacultyId(reminderId, facultyId)
          .orElseThrow(() -> new NotFoundException("Reminder " + reminderId + " was not found"));
    }
}
