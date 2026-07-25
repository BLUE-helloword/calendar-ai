package com.aspire.schedule.service.agent.model;

import lombok.Data;

@Data
public class LLMResponse {

    private String content;
    private int tokenUsage;
    private long latencyMs;
    private boolean success;
    private String errorMsg;

    public static LLMResponse success(String content, int tokenUsage, long latencyMs) {
        LLMResponse r = new LLMResponse();
        r.content = content;
        r.tokenUsage = tokenUsage;
        r.latencyMs = latencyMs;
        r.success = true;
        return r;
    }

    public static LLMResponse fail(String errorMsg) {
        LLMResponse r = new LLMResponse();
        r.success = false;
        r.errorMsg = errorMsg;
        return r;
    }
}
