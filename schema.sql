-- ============================================
-- AI Agent 日程与任务协同助手 - 数据库建表脚本
-- Database: ai_schedule
-- ============================================

USE ai_schedule;

-- --------------------------------------------
-- 1. 用户表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(256) NOT NULL COMMENT '密码密文(BCrypt)',
    nickname    VARCHAR(128) COMMENT '昵称',
    email       VARCHAR(256) COMMENT '邮箱',
    avatar      VARCHAR(512) COMMENT '头像URL',
    status      TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '用户表';

-- --------------------------------------------
-- 2. 目标表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS goal (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    raw_input       TEXT NOT NULL COMMENT '用户原始输入',
    parsed_target   VARCHAR(512) COMMENT '解析后的目标摘要',
    parsed_deadline DATETIME COMMENT '解析的截止时间',
    parsed_items    JSON COMMENT '解析的事项列表JSON',
    status          VARCHAR(32) DEFAULT 'PENDING' COMMENT '状态: PENDING/CLARIFYING/PARSED/PLANNED/CONFIRMED/CANCELLED',
    clarify_round   INT DEFAULT 0 COMMENT '当前追问轮次',
    partial_result  JSON COMMENT '部分解析结果(追问过程中暂存)',
    conversation    JSON COMMENT '对话历史JSON',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) COMMENT '目标表';

-- --------------------------------------------
-- 3. 任务表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS task (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    goal_id         BIGINT COMMENT '来源目标ID',
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    title           VARCHAR(256) NOT NULL COMMENT '任务标题',
    description     TEXT COMMENT '任务描述',
    priority        TINYINT DEFAULT 2 COMMENT '优先级: 1-高, 2-中, 3-低',
    status          VARCHAR(32) DEFAULT 'TODO' COMMENT '状态: TODO/IN_PROGRESS/DONE/DELAYED/CANCELLED',
    start_time      DATETIME COMMENT '开始时间',
    end_time        DATETIME COMMENT '结束时间',
    estimated_hours DECIMAL(4,1) COMMENT '预计耗时(小时)',
    parent_task_id  BIGINT COMMENT '父任务ID(依赖关系)',
    dependency_type VARCHAR(32) COMMENT '依赖类型: START_FINISH/FINISH_START',
    source_type     VARCHAR(32) DEFAULT 'MANUAL' COMMENT '来源: MANUAL/AI_GENERATED',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_goal_id (goal_id),
    INDEX idx_status (status),
    INDEX idx_time_range (start_time, end_time)
) COMMENT '任务表';

-- --------------------------------------------
-- 4. 日程表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS schedule (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL COMMENT '用户ID',
    task_id     BIGINT COMMENT '关联任务ID',
    title       VARCHAR(256) NOT NULL COMMENT '日程标题',
    start_time  DATETIME NOT NULL COMMENT '开始时间',
    end_time    DATETIME NOT NULL COMMENT '结束时间',
    is_all_day  TINYINT DEFAULT 0 COMMENT '是否全天: 0-否, 1-是',
    color       VARCHAR(16) COMMENT '日历颜色标记',
    status      VARCHAR(32) DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/CANCELLED',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_time (user_id, start_time, end_time)
) COMMENT '日程表';

-- --------------------------------------------
-- 5. 提醒表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS reminder (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    task_id         BIGINT COMMENT '关联任务ID',
    remind_time     DATETIME NOT NULL COMMENT '提醒时间',
    remind_type     VARCHAR(32) DEFAULT 'ONCE' COMMENT '类型: ONCE/REPEAT_DAILY/REPEAT_WEEKLY',
    channel         VARCHAR(32) DEFAULT 'IN_APP' COMMENT '渠道: IN_APP/EMAIL/WECHAT/FEISHU',
    message         VARCHAR(512) COMMENT '提醒文案',
    status          VARCHAR(32) DEFAULT 'PENDING' COMMENT '状态: PENDING/SENT/FAILED',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_remind_time (remind_time, status)
) COMMENT '提醒表';

-- --------------------------------------------
-- 6. Agent 执行日志表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS agent_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      VARCHAR(64) NOT NULL COMMENT 'Agent会话ID',
    goal_id         BIGINT COMMENT '关联目标ID',
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    phase           VARCHAR(64) NOT NULL COMMENT '阶段: INTENT_PARSE_ROUND_N/TASK_DECOMPOSE/CONFLICT_DETECT/PLAN_RECOMMEND/CONFIRM/PARSE_COMPLETE',
    model_name      VARCHAR(128) COMMENT '使用的模型名称',
    prompt_input    TEXT COMMENT '输入的Prompt',
    model_output    TEXT COMMENT '模型原始输出',
    parsed_result   JSON COMMENT '解析后的结构化结果',
    tool_calls      JSON COMMENT '工具调用记录(参数/结果)',
    latency_ms      INT COMMENT '耗时(毫秒)',
    token_usage     JSON COMMENT 'Token消耗统计',
    status          VARCHAR(32) DEFAULT 'SUCCESS' COMMENT '状态: SUCCESS/FAILED',
    error_msg       TEXT COMMENT '错误信息',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_goal (goal_id),
    INDEX idx_user (user_id)
) COMMENT 'Agent执行日志表';

-- --------------------------------------------
-- 7. Agent 配置表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS agent_config (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_name      VARCHAR(128) NOT NULL UNIQUE COMMENT 'Agent名称',
    agent_type      VARCHAR(64) NOT NULL COMMENT '类型: INTENT_PARSE/SCHEDULING/REMINDER/SUMMARY',
    model_provider  VARCHAR(64) COMMENT '模型提供商',
    model_name      VARCHAR(128) COMMENT '模型名称',
    system_prompt   TEXT COMMENT '系统提示词',
    temperature     DECIMAL(3,2) DEFAULT 0.30 COMMENT '模型温度参数',
    max_tokens      INT DEFAULT 4096 COMMENT '最大Token数',
    tools           JSON COMMENT '可用工具列表JSON',
    confirm_actions JSON COMMENT '需人工确认的动作列表',
    fallback_rules  JSON COMMENT '失败兜底规则',
    status          TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Agent配置表';

-- --------------------------------------------
-- 8. Prompt 模板表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_template (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_name   VARCHAR(128) NOT NULL COMMENT '模板名称',
    template_type   VARCHAR(64) NOT NULL COMMENT '类型: SYSTEM/USER/FEW_SHOT',
    agent_type      VARCHAR(64) COMMENT '关联Agent类型',
    version         INT DEFAULT 1 COMMENT '版本号',
    content         TEXT NOT NULL COMMENT '模板内容',
    variables       JSON COMMENT '模板变量定义',
    status          TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-启用, 2-测试中',
    effect_score    DECIMAL(3,2) COMMENT '效果评分',
    usage_count     INT DEFAULT 0 COMMENT '使用次数',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Prompt模板表';

-- --------------------------------------------
-- 9. 通知记录表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    reminder_id     BIGINT COMMENT '关联提醒ID',
    channel         VARCHAR(32) NOT NULL COMMENT '渠道',
    title           VARCHAR(256) COMMENT '通知标题',
    content         TEXT COMMENT '通知内容',
    send_status     VARCHAR(32) DEFAULT 'PENDING' COMMENT '状态: PENDING/SUCCESS/FAILED',
    retry_count     INT DEFAULT 0 COMMENT '重试次数',
    error_msg       TEXT COMMENT '错误信息',
    sent_at         DATETIME COMMENT '发送时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT '通知记录表';
