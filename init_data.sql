-- ============================================
-- 初始数据：Agent配置 + Prompt模板 + 测试用户
-- ============================================

USE ai_schedule;

-- --------------------------------------------
-- 测试用户 (密码: 123456, BCrypt加密)
-- --------------------------------------------
INSERT INTO user (username, password, nickname, email, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 'admin@test.com', 1),
('demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '演示用户', 'demo@test.com', 1);

-- --------------------------------------------
-- Agent 配置：意图解析 Agent
-- --------------------------------------------
INSERT INTO agent_config (agent_name, agent_type, model_provider, model_name, system_prompt, temperature, max_tokens, tools, confirm_actions, fallback_rules, status) VALUES
(
    'intent_parse_agent',
    'INTENT_PARSE',
    'openai',
    'gpt-4o',
    '你是一个任务解析专家。从用户的自然语言输入中提取结构化信息。如果信息不完整，生成追问问题。',
    0.30,
    4096,
    '[]',
    '[]',
    '{"low_confidence_action": "ask_followup", "max_retries": 3}',
    1
);

-- --------------------------------------------
-- Agent 配置：排期 Agent
-- --------------------------------------------
INSERT INTO agent_config (agent_name, agent_type, model_provider, model_name, system_prompt, temperature, max_tokens, tools, confirm_actions, fallback_rules, status) VALUES
(
    'scheduling_agent',
    'SCHEDULING',
    'openai',
    'gpt-4o',
    '你是一个排期规划专家。根据子任务列表、已有日程和截止时间，为每个子任务推荐合理的执行时间片。',
    0.30,
    4096,
    '["query_schedule", "detect_conflict"]',
    '["create_task", "create_schedule", "set_reminder"]',
    '{"low_confidence_action": "recommend_manual", "max_retries": 3}',
    1
);

-- --------------------------------------------
-- Agent 配置：总结 Agent
-- --------------------------------------------
INSERT INTO agent_config (agent_name, agent_type, model_provider, model_name, system_prompt, temperature, max_tokens, tools, confirm_actions, fallback_rules, status) VALUES
(
    'summary_agent',
    'SUMMARY',
    'openai',
    'gpt-4o-mini',
    '你是一个任务总结专家。根据用户指定时间段内的任务记录，生成简洁的周报或月报总结。',
    0.50,
    2048,
    '["generate_summary"]',
    '[]',
    '{"max_retries": 2}',
    1
);

-- --------------------------------------------
-- Prompt 模板：意图识别
-- --------------------------------------------
INSERT INTO prompt_template (template_name, template_type, agent_type, version, content, variables, status) VALUES
(
    'intent_parse_v1',
    'SYSTEM',
    'INTENT_PARSE',
    1,
    '你是一个任务解析专家。从用户的自然语言输入中提取以下结构化信息。

## 提取规则
1. 目标摘要：一句话概括用户想要完成的目标
2. 截止时间：明确或推断截止日期时间
3. 子事项：识别所有需要完成的子任务
4. 优先级：根据紧迫程度推断 HIGH/MEDIUM/LOW
5. 依赖关系：事项之间的先后依赖
6. 预计耗时：合理估计每个子事项需要的小时数

## 注意事项
- 如果信息不完整，在 missingInfo 中列出需要追问的问题
- 时间表达要转换为明确的日期（参考当前日期）
- 不确定的信息标记 confidence 字段

## 输出格式（严格 JSON）
{
  "parsedTarget": "...",
  "parsedDeadline": "yyyy-MM-ddTHH:mm:ss",
  "parsedItems": [
    {
      "name": "...",
      "estimatedHours": number,
      "priority": "HIGH|MEDIUM|LOW",
      "dependsOn": null | "前置任务名"
    }
  ],
  "missingInfo": ["追问1", "追问2"],
  "confidence": 0.0-1.0
}',
    '[]',
    1
);

-- --------------------------------------------
-- Prompt 模板：排期推荐
-- --------------------------------------------
INSERT INTO prompt_template (template_name, template_type, agent_type, version, content, variables, status) VALUES
(
    'scheduling_v1',
    'SYSTEM',
    'SCHEDULING',
    1,
    '你是一个排期规划专家。根据子任务列表、已有日程和截止时间，为每个子任务推荐合理的执行时间片。

## 排期规则
1. 避開已有日程的占用时间，将任务安排在空闲时段
2. 每日工作时间为 09:00-12:00 和 14:00-18:00，共7个可用小时
3. 如果一个任务需要的总时间超过一个连续空闲时段，可拆分为多个时间片（最多拆3段）
4. 高优先级任务优先占用较早的时间片
5. 子任务若存在依赖关系（dependsOn），前置任务必须先完成
6. 尽量在截止时间前合理安排所有任务
7. 如果用户对上次排期方案有反馈，请根据反馈进行调整

## 输出格式（严格 JSON，不要包含 markdown 标记）
{
  "plan": [
    {
      "taskTitle": "任务名称",
      "suggestedStart": "yyyy-MM-ddTHH:mm:ss",
      "suggestedEnd": "yyyy-MM-ddTHH:mm:ss",
      "estimatedHours": 数字,
      "priority": "HIGH|MEDIUM|LOW",
      "conflictDetail": "如有冲突说明原因，无则为空"
    }
  ],
  "conflicts": ["无法解决的冲突说明"],
  "warnings": ["时间紧张或其他风险提醒"]
}

注意：
- 时间格式严格使用 yyyy-MM-ddTHH:mm:ss
- 拆分任务时使用相同的 taskTitle 出现在多个 plan 条目中
- 不要输出 markdown 代码块标记',
    '[]',
    1
);
