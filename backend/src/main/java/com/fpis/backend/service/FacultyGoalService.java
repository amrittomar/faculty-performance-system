package com.fpis.backend.service;

import com.fpis.backend.domain.FacultyGoal;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.FacultyGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class FacultyGoalService {
    private final FacultyGoalRepository repository;
    private final FacultyService faculty;

    public FacultyGoalService(FacultyGoalRepository repository, FacultyService faculty) {
        this.repository = repository;
        this.faculty = faculty;
    }

    public List<GoalView> list(Long facultyId) {
        return repository.findByFacultyIdOrderByTargetDateAsc(facultyId).stream().map(GoalView::from).toList();
    }

    public GoalView create(Long facultyId, GoalRequest request) {
        return GoalView.from(repository.save(new FacultyGoal(faculty.require(facultyId), request.title(), request.description(),
          request.category(), request.targetDate(), request.progress())));
    }

    public GoalView update(Long facultyId, Long goalId, GoalRequest request) {
        FacultyGoal goal = requireOwned(facultyId, goalId);
        goal.update(request.title(), request.description(), request.category(), request.targetDate(), request.progress());
        return GoalView.from(repository.save(goal));
    }

    public void delete(Long facultyId, Long goalId) {
        repository.delete(requireOwned(facultyId, goalId));
    }

    private FacultyGoal requireOwned(Long facultyId, Long goalId) {
        return repository.findByIdAndFacultyId(goalId, facultyId)
          .orElseThrow(() -> new NotFoundException("Goal " + goalId + " was not found"));
    }
}
