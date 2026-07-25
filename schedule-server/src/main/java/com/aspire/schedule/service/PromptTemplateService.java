package com.aspire.schedule.service;

import com.aspire.schedule.repository.entity.PromptTemplate;
import com.aspire.schedule.repository.mapper.PromptTemplateMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final PromptTemplateMapper promptTemplateMapper;

    public PromptTemplate findByAgentTypeAndStatus(String agentType) {
        return promptTemplateMapper.selectOne(
                new LambdaQueryWrapper<PromptTemplate>()
                        .eq(PromptTemplate::getAgentType, agentType)
                        .eq(PromptTemplate::getStatus, 1)
                        .orderByDesc(PromptTemplate::getVersion)
                        .last("LIMIT 1"));
    }
}
