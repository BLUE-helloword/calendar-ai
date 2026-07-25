package com.aspire.schedule.service;

import com.aspire.schedule.model.enums.GoalStatus;
import com.aspire.schedule.repository.entity.Goal;
import com.aspire.schedule.repository.mapper.GoalMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalMapper goalMapper;

    public Goal create(Long userId, String rawInput) {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setRawInput(rawInput);
        goal.setStatus(GoalStatus.PENDING.name());
        goal.setClarifyRound(0);
        goalMapper.insert(goal);
        return goal;
    }

    public void updateStatus(Long id, String status) {
        Goal goal = new Goal();
        goal.setId(id);
        goal.setStatus(status);
        goalMapper.updateById(goal);
    }

    public void updateParsedResult(Long id, String parsedTarget, LocalDateTime parsedDeadline,
                                    String parsedItems) {
        Goal goal = new Goal();
        goal.setId(id);
        goal.setParsedTarget(parsedTarget);
        goal.setParsedDeadline(parsedDeadline);
        goal.setParsedItems(parsedItems);
        goalMapper.updateById(goal);
    }

    public void updateParsedResult(Long id, Goal parsed) {
        goalMapper.updateById(parsed);
    }

    public void incrementRound(Long id) {
        Goal goal = goalMapper.selectById(id);
        if (goal != null) {
            Goal update = new Goal();
            update.setId(id);
            update.setClarifyRound(goal.getClarifyRound() + 1);
            goalMapper.updateById(update);
        }
    }

    public int getClarifyRound(Long id) {
        Goal goal = goalMapper.selectById(id);
        return goal != null ? goal.getClarifyRound() : 0;
    }

    public void savePartialResult(Long id, String partialResult) {
        Goal goal = new Goal();
        goal.setId(id);
        goal.setPartialResult(partialResult);
        goalMapper.updateById(goal);
    }

    public Goal findById(Long id) {
        return goalMapper.selectById(id);
    }
}
