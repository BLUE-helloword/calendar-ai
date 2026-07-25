package com.aspire.schedule.service.agent;

import com.aspire.schedule.repository.entity.AgentLog;
import com.aspire.schedule.repository.mapper.AgentLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionTracker {

    private final AgentLogMapper agentLogMapper;

    public String createSession() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public void logPhase(Long goalId, String sessionId, Long userId,
                          String phase, Object input, Object output) {
        AgentLog agentLog = new AgentLog();
        agentLog.setSessionId(sessionId);
        agentLog.setGoalId(goalId);
        agentLog.setUserId(userId);
        agentLog.setPhase(phase);
        agentLog.setStatus("SUCCESS");

        if (input != null) {
            agentLog.setPromptInput(truncate(input.toString(), 5000));
        }
        if (output != null) {
            agentLog.setModelOutput(truncate(output.toString(), 5000));
        }

        agentLogMapper.insert(agentLog);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
