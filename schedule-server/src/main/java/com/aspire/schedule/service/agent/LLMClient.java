package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aspire.schedule.config.LLMClientConfig;
import com.aspire.schedule.service.agent.model.LLMResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class LLMClient {

    private final LLMClientConfig config;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 向 LLM 发送请求
     */
    public LLMResponse chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, config.getDefaultModel());
    }

    public LLMResponse chat(String systemPrompt, String userMessage, String model) {
        long start = System.currentTimeMillis();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(config.getApiKey());

            JSONObject body = new JSONObject();
            body.set("model", model);

            JSONArray messages = new JSONArray();
            JSONObject sysMsg = new JSONObject();
            sysMsg.set("role", "system");
            sysMsg.set("content", systemPrompt);
            messages.add(sysMsg);

            JSONObject userMsg = new JSONObject();
            userMsg.set("role", "user");
            userMsg.set("content", userMessage);
            messages.add(userMsg);

            body.set("messages", messages);
            body.set("temperature", 0.3);
            body.set("max_tokens", 2048);

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    config.getBaseUrl() + "/chat/completions", request, String.class);

            long latencyMs = System.currentTimeMillis() - start;

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JSONObject respJson = JSONUtil.parseObj(response.getBody());
                JSONArray choices = respJson.getJSONArray("choices");
                String content = choices.getJSONObject(0)
                        .getJSONObject("message")
                        .getStr("content");

                int tokens = 0;
                JSONObject usage = respJson.getJSONObject("usage");
                if (usage != null) {
                    tokens = usage.getInt("total_tokens", 0);
                }

                int promptTokens = usage != null ? usage.getInt("prompt_tokens", 0) : 0;
                int completionTokens = usage != null ? usage.getInt("completion_tokens", 0) : 0;
                log.info("LLM call: model={}, latency={}ms, tokens={} (prompt={}, completion={})",
                        model, latencyMs, tokens, promptTokens, completionTokens);
                return LLMResponse.success(content, tokens, latencyMs);
            }

            log.error("LLM call failed, status={}", response.getStatusCode());
            return LLMResponse.fail("HTTP " + response.getStatusCodeValue());

        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.error("LLM call exception, latency={}ms", latencyMs, e);
            return LLMResponse.fail(e.getMessage());
        }
    }
}
