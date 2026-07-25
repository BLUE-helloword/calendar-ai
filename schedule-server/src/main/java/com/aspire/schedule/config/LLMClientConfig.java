package com.aspire.schedule.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "llm")
public class LLMClientConfig {

    private String apiKey;
    private String baseUrl = "https://api.openai.com/v1";
    private String defaultModel = "gpt-4o";
    private int timeout = 30000;
}
