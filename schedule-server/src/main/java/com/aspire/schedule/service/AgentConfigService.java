package com.aspire.schedule.service;

import com.aspire.schedule.repository.entity.AgentConfig;
import com.aspire.schedule.repository.mapper.AgentConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AgentConfigService {

    private final AgentConfigMapper agentConfigMapper;

    public AgentConfig findByAgentType(String agentType) {
        return agentConfigMapper.selectOne(
                new LambdaQueryWrapper<AgentConfig>()
                        .eq(AgentConfig::getAgentType, agentType)
                        .eq(AgentConfig::getStatus, 1));
    }
}
