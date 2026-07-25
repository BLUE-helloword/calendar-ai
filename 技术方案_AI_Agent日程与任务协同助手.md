# 技术方案：AI Agent 日程与任务协同助手

## 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | AI Agent 日程与任务协同助手 |
| 版本 | V1.0 |
| 关联文档 | PRD_AI_Agent日程与任务协同助手.md |

---

## 1. 系统架构总览

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ 用户端SPA │  │ 管理后台  │  │ 路由管理 │  │ 状态管理(Zustand)││
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────────┘  │
└───────┼──────────────┼─────────────────────────────────────────┘
        │   HTTP/REST  │
┌───────┴──────────────┴─────────────────────────────────────────┐
│                      网关层 (Nginx)                              │
│              路由转发 / 限流 / 静态资源                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                  后端层 (SpringBoot 3.x + JDK17)                   │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Controller  │  │    AI Core   │  │    Admin Service     │  │
│  │  (REST API) │  │  (Agent引擎) │  │  (后台管理)           │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴───────────┐  │
│  │                    Service 层                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ 用户服务  │ │ 任务服务  │ │ 日程服务  │ │  通知服务   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │Agent服务  │ │ 工具服务  │ │ Prompt服务│ │  统计服务   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │                    Repository 层 (MyBatis-Plus)           │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────┴──────────────────────────────────────┐
│                       数据层                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  MySQL   │  │  Redis   │  │  LLM API │  │  通知渠道API  │  │
│  │ (主数据库)│  │ (缓存/会话)│  │ (模型调用)│  │ (邮件/站内信) │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 架构决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 架构风格 | SpringBoot 单体应用 | Mini 项目规模适中，单体架构降低部署复杂度；预留模块化拆分空间 |
| 前端架构 | React 18 + Vite + TypeScript | 生态成熟，Hooks 组合式逻辑复用，社区资源丰富 |
| 数据库 | MySQL 8.0 | PRD 推荐，成熟稳定 |
| 缓存 | Redis | 存储用户会话、Agent 临时上下文、限流计数 |
| LLM 集成 | HTTP Client 调用外部 API | 解耦模型与业务，支持多模型切换 |
| 认证方案 | Spring Security + JWT | 前后端分离标准方案 |

---

## 2. 技术栈明细

### 2.1 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| JDK | 17+ | 运行环境 |
| SpringBoot | 3.x | 应用框架 |
| Spring Security | 6.x | 认证授权 |
| MyBatis-Plus | 3.5+ | ORM 框架 |
| MySQL | 8.0 | 关系数据库 |
| Redis | 7.x | 缓存 / 会话 |
| Spring Scheduler | - | 定时任务（提醒触发） |
| Lombok | 1.18+ | 代码简化 |
| Hutool | 5.8+ | 工具库 |
| Knife4j / SpringDoc | 2.x | API 文档 |
| JUnit 5 + Mockito | - | 测试框架 |

### 2.2 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | 前端框架 |
| Vite | 5.x | 构建工具 |
| TypeScript | 5.x | 类型安全 |
| Zustand | 4.x | 状态管理（轻量、Hooks 友好） |
| React Router | 6.x | 路由管理 |
| Axios | 1.x | HTTP 客户端 |
| Ant Design | 5.x | UI 组件库 |
| ECharts | 5.x | 图表（周报/月报统计） |
| Day.js | 1.x | 日期处理 |

### 2.3 AI Agent

| 技术 | 用途 |
|------|------|
| 大模型 API | 意图识别、任务拆解、总结生成（支持 OpenAI / 国产模型） |
| 工具调用（Function Calling） | 日程查询、冲突检测、任务创建、提醒设置 |
| 提示词工程 | 系统 Prompt 模板、Few-shot 示例管理 |
| 日志链路追踪 | 记录每次 Agent 调用的输入/输出/工具参数/结果 |

---

## 3. 项目模块结构

```
ai-schedule-assistant/
├── pom.xml                          # Maven 父依赖
├── schedule-server/                 # 后端主模块
│   ├── pom.xml
│   └── src/main/java/com/aspire/schedule/
│       ├── ScheduleApplication.java          # 启动类
│       ├── config/                           # 配置类
│       │   ├── SecurityConfig.java           # Spring Security 配置
│       │   ├── RedisConfig.java              # Redis 配置
│       │   ├── MyBatisPlusConfig.java        # MyBatis-Plus 配置
│       │   ├── LLMClientConfig.java          # LLM 客户端配置
│       │   └── SchedulerConfig.java          # 定时任务配置
│       ├── controller/                       # 控制器层
│       │   ├── user/                         # 用户端接口
│       │   │   ├── GoalController.java       # 目标输入接口
│       │   │   ├── TaskController.java       # 任务管理接口
│       │   │   ├── ScheduleController.java   # 日程查看接口
│       │   │   ├── PlanController.java       # 计划确认接口
│       │   │   └── ReminderController.java   # 提醒设置接口
│       │   └── admin/                        # 管理后台接口
│       │       ├── AccountController.java
│       │       ├── AgentController.java
│       │       ├── PromptController.java
│       │       ├── ChannelController.java
│       │       └── DashboardController.java
│       ├── service/                          # 业务服务层
│       │   ├── UserService.java
│       │   ├── TaskService.java
│       │   ├── ScheduleService.java
│       │   ├── NotificationService.java
│       │   ├── agent/                        # Agent 核心服务
│       │   │   ├── AgentOrchestrator.java    # Agent 编排器（主入口）
│       │   │   ├── IntentParser.java         # 意图识别
│       │   │   ├── TaskDecomposer.java       # 任务拆解
│       │   │   ├── ConflictDetector.java     # 冲突检测
│       │   │   ├── PlanRecommender.java      # 排期推荐
│       │   │   └── ExecutionTracker.java     # 执行追踪
│       │   ├── tool/                         # Agent 工具集
│       │   │   ├── ToolRegistry.java         # 工具注册中心
│       │   │   ├── QueryScheduleTool.java    # 查询日程工具
│       │   │   ├── CreateTaskTool.java       # 创建任务工具
│       │   │   ├── SetReminderTool.java      # 设置提醒工具
│       │   │   └── GenerateSummaryTool.java  # 生成总结工具
│       │   └── admin/                        # 后台管理服务
│       │       ├── AccountService.java
│       │       ├── AgentConfigService.java
│       │       ├── PromptTemplateService.java
│       │       └── ChannelConfigService.java
│       ├── repository/                       # 数据访问层
│       │   ├── mapper/                       # MyBatis Mapper
│       │   └── entity/                       # 实体类
│       ├── model/                            # 领域模型
│       │   ├── dto/                          # 数据传输对象
│       │   ├── vo/                           # 视图对象
│       │   └── enums/                        # 枚举类
│       ├── security/                         # 安全相关
│       │   ├── JwtTokenProvider.java
│       │   ├── JwtAuthenticationFilter.java
│       │   └── UserDetailsServiceImpl.java
│       └── common/                           # 公共组件
│           ├── exception/                    # 全局异常处理
│           ├── response/                     # 统一响应格式
│           └── util/                         # 工具类
├── schedule-frontend/                        # 前端项目
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router/                           # 路由配置
│       │   └── index.tsx
│       ├── stores/                           # Zustand 状态
│       │   ├── userStore.ts                  # 用户状态
│       │   ├── taskStore.ts                  # 任务状态
│       │   └── agentStore.ts                 # Agent 会话状态
│       ├── api/                              # 接口封装
│       │   ├── goal.ts
│       │   ├── task.ts
│       │   ├── schedule.ts
│       │   ├── plan.ts
│       │   └── reminder.ts
│       ├── pages/                            # 页面组件
│       │   ├── user/                         # 用户端
│       │   │   ├── GoalInput.tsx             # 目标输入页
│       │   │   ├── Dashboard.tsx             # 总览首页
│       │   │   ├── PlanPreview.tsx           # 计划预览页
│       │   │   ├── TaskDetail.tsx            # 任务详情页
│       │   │   └── ReminderSettings.tsx      # 提醒设置页
│       │   └── admin/                        # 管理后台
│       │       ├── AccountManage.tsx
│       │       ├── AgentManage.tsx
│       │       ├── PromptManage.tsx
│       │       └── ChannelManage.tsx
│       ├── components/                       # 通用组件
│       │   ├── GoalInputBox.tsx              # 目标输入框
│       │   ├── TaskCard.tsx                  # 任务卡片
│       │   ├── CalendarView.tsx              # 日历视图
│       │   ├── TimelineView.tsx              # 时间线视图
│       │   ├── PlanList.tsx                  # 计划清单
│       │   ├── ConflictBadge.tsx             # 冲突标识
│       │   └── ConfirmDialog.tsx             # 确认弹窗
│       ├── hooks/                            # 自定义 Hooks
│       │   ├── useGoalParser.ts              # 目标解析 Hook
│       │   ├── usePlanConfirm.ts             # 计划确认 Hook
│       │   └── useSSE.ts                     # SSE 流式响应 Hook
│       └── utils/                            # 工具函数
└── docs/                                     # 文档
    ├── api-spec.md
    └── db-schema.sql
```

---

## 4. 数据库设计

### 4.1 ER 关系

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  user    │1────N│  goal    │1────N│    task      │
└──────────┘       └──────────┘       └──────────────┘
     │                                       │
     │1                                      │N
     │                                       │
┌──────────┐       ┌──────────┐       ┌──────────────┐
│ reminder │       │ schedule │       │ task_log     │
└──────────┘       └──────────┘       └──────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│ agent_config    │    │ prompt_template  │    │ notification_log  │
└─────────────────┘    └──────────────────┘    └───────────────────┘

┌─────────────────┐    ┌──────────────────┐
│ tool_definition │    │  admin_user      │
└─────────────────┘    └──────────────────┘
```

### 4.2 数据库表与功能模块的关系

每一张数据库表都对应支撑特定的功能模块，下面是完整映射：

#### 4.2.1 用户端功能的数据支撑

```
┌──────────────────────────────────────────────────────────────────────┐
│                        用户端功能 → 数据库表 映射                       │
├──────────────┬───────────────────────────────────────────────────────┤
│ 功能模块      │ 涉及的数据库表           │ 读写关系                     │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 目标输入与    │ goal                     │ 写入用户原始输入、解析结果、   │
│ 意图解析      │ agent_log                │ 状态；Agent 每轮对话写入日志  │
│              │ agent_config              │ 读取当前启用的 Agent 配置     │
│              │ prompt_template           │ 读取当前的 Prompt 模板        │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 计划生成与    │ goal                     │ 更新状态为 PLANNED/CONFIRMED  │
│ 排期确认      │ task                     │ 确认后批量写入子任务记录       │
│              │ schedule                 │ 确认后批量写入日程记录         │
│              │ reminder                 │ 确认后批量写入提醒记录         │
│              │ agent_log                │ 记录排期推荐、冲突检测日志     │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 日程与任务    │ task                     │ 筛选/排序读取；CRUD 操作      │
│ 总览首页      │ schedule                 │ 日/周/月视图读取              │
│              │ reminder                 │ 冲突提醒标记读取              │
│              │ user                     │ 读取用户偏好设置              │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 任务详情与    │ task                     │ 读取详情；更新状态/延期        │
│ 执行追踪      │ task_log (可扩展)        │ 写入操作轨迹日志              │
│              │ schedule                 │ 更新关联日程状态              │
│              │ agent_log                │ 读取 Agent 建议历史           │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 提醒设置与    │ reminder                 │ CRUD 操作                    │
│ 通知管理      │ notification_log         │ 记录发送状态                  │
│              │ user                     │ 全局默认提醒偏好              │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 周报/月报     │ task                     │ 统计完成/延期/进行中任务数     │
│              │ schedule                 │ 统计日程占用时间              │
│              │ goal                     │ 统计目标达成率                │
└──────────────┴──────────────────────────┴─────────────────────────────┘
```

#### 4.2.2 后台管理功能的数据支撑

```
┌──────────────────────────────────────────────────────────────────────┐
│                       后台管理功能 → 数据库表 映射                       │
├──────────────┬───────────────────────────────────────────────────────┤
│ 功能模块      │ 涉及的数据库表           │ 读写关系                     │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 账号与权限    │ admin_user (可扩展)       │ 管理员账号 CRUD              │
│ 管理          │ user                     │ 查看用户列表（仅脱敏字段）    │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 多Agent      │ agent_config             │ 注册、修改、启用/停用 Agent  │
│ 注册与工具    │ tool_definition (可扩展)  │ 工具入参/出参/权限边界 CRUD  │
│ 管理          │                          │                             │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 计划生成与    │ agent_config             │ 更新冲突检测/排期策略参数     │
│ 冲突处理策略  │                          │ (tools JSON 字段)            │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ Prompt 模板  │ prompt_template          │ 模板版本 CRUD、发布、效果评分 │
│ 与 Skill 管理│                          │                             │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 通知渠道      │ (配置可存储于 agent_config │ 渠道开关、模板、频率等配置    │
│ 配置管理      │  或独立的 config 表)      │                             │
├──────────────┼──────────────────────────┼─────────────────────────────┤
│ 统计面板与    │ agent_log                │ 按时间/用户/Agent 维度查询    │
│ 会话日志      │ notification_log         │ 通知发送成功率统计            │
│              │ task + schedule           │ 聚合统计数据                  │
└──────────────┴──────────────────────────┴─────────────────────────────┘
```

#### 4.2.3 核心业务数据流

以一次完整的"用户输入目标 → 排期确认"为例，数据库表之间的数据流转：

```
Step 1: 用户输入目标
  INSERT INTO goal (user_id, raw_input, status='PENDING')
  INSERT INTO agent_log (session_id, goal_id, phase='INTENT_PARSE', ...)

Step 2: Agent 意图识别 → 追问循环
  ┌─ LOOP ────────────────────────────────────────────────┐
  │ UPDATE goal SET status='CLARIFYING'                     │
  │ INSERT INTO agent_log (phase='FOLLOW_UP_QUESTION', ...)  │
  │ ← 用户补充信息                                          │
  │ INSERT INTO agent_log (phase='INTENT_PARSE_RETRY', ...)  │
  │ → 检查 confidence >= 0.8 ?                              │
  │   YES → 退出循环                                        │
  │   NO  → 继续追问                                        │
  └────────────────────────────────────────────────────────┘

Step 3: 解析完成
  UPDATE goal SET parsed_target=?, parsed_deadline=?, parsed_items=?, status='PARSED'
  INSERT INTO agent_log (phase='PARSE_COMPLETE', ...)

Step 4: 拆解 + 冲突检测 + 排期推荐
  SELECT * FROM schedule WHERE user_id=? AND start_time...  -- 查询已有日程
  INSERT INTO agent_log (phase='TASK_DECOMPOSE', ...)
  INSERT INTO agent_log (phase='CONFLICT_DETECT', tool_calls=...)
  INSERT INTO agent_log (phase='PLAN_RECOMMEND', ...)
  UPDATE goal SET status='PLANNED'

Step 5: 用户确认
  UPDATE goal SET status='CONFIRMED'
  INSERT INTO task (goal_id, user_id, title, priority, start_time, end_time, ...) × N
  INSERT INTO schedule (user_id, task_id, title, start_time, end_time, ...) × N
  INSERT INTO reminder (user_id, task_id, remind_time, ...) × N
  INSERT INTO agent_log (phase='CONFIRM', tool_calls='{CreateTask x N, SetReminder x N}')
```

### 4.3 核心表结构

#### 4.3.1 用户表 (user)

```sql
CREATE TABLE user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(256) NOT NULL COMMENT '密码密文',
    nickname    VARCHAR(128) COMMENT '昵称',
    email       VARCHAR(256) COMMENT '邮箱',
    avatar      VARCHAR(512) COMMENT '头像URL',
    status      TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '用户表';
```

#### 4.3.2 目标表 (goal)

```sql
CREATE TABLE goal (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    raw_input       TEXT NOT NULL COMMENT '用户原始输入',
    parsed_target   VARCHAR(512) COMMENT '解析后的目标摘要',
    parsed_deadline DATETIME COMMENT '解析的截止时间',
    parsed_items    JSON COMMENT '解析的事项列表JSON',
    status          VARCHAR(32) DEFAULT 'PENDING' COMMENT '状态: PENDING/PARSED/PLANNED/CONFIRMED/CANCELLED',
    agent_session_id VARCHAR(64) COMMENT 'Agent会话ID',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) COMMENT '目标表';
```

#### 4.3.3 任务表 (task)

```sql
CREATE TABLE task (
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
```

#### 4.3.4 日程表 (schedule)

```sql
CREATE TABLE schedule (
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
```

#### 4.3.5 提醒表 (reminder)

```sql
CREATE TABLE reminder (
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
```

#### 4.3.6 Agent 执行日志表 (agent_log)

```sql
CREATE TABLE agent_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      VARCHAR(64) NOT NULL COMMENT 'Agent会话ID',
    goal_id         BIGINT COMMENT '关联目标ID',
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    phase           VARCHAR(64) NOT NULL COMMENT '阶段: INTENT_PARSE/TASK_DECOMPOSE/CONFLICT_DETECT/PLAN_RECOMMEND/CONFIRM',
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
```

#### 4.3.7 Agent 配置表 (agent_config)

```sql
CREATE TABLE agent_config (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_name      VARCHAR(128) NOT NULL UNIQUE COMMENT 'Agent名称',
    agent_type      VARCHAR(64) NOT NULL COMMENT '类型: INTENT_PARSE/SCHEDULING/REMINDER/SUMMARY',
    model_provider  VARCHAR(64) COMMENT '模型提供商',
    model_name      VARCHAR(128) COMMENT '模型名称',
    system_prompt   TEXT COMMENT '系统提示词',
    temperature     DECIMAL(3,2) DEFAULT 0.3 COMMENT '模型温度参数',
    max_tokens      INT DEFAULT 4096 COMMENT '最大Token数',
    tools           JSON COMMENT '可用工具列表JSON',
    confirm_actions JSON COMMENT '需人工确认的动作列表',
    fallback_rules  JSON COMMENT '失败兜底规则',
    status          TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Agent配置表';
```

#### 4.3.8 Prompt 模板表 (prompt_template)

```sql
CREATE TABLE prompt_template (
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
```

#### 4.3.9 通知记录表 (notification_log)

```sql
CREATE TABLE notification_log (
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
```

---

## 5. API 接口设计

### 5.1 通用规范

| 项目 | 规范 |
|------|------|
| 基础路径 | `/api/v1` |
| 请求格式 | JSON |
| 认证方式 | Header: `Authorization: Bearer <JWT>` |
| 响应格式 | `{ "code": 0, "message": "success", "data": {...} }` |
| 分页参数 | `?page=1&size=20` |
| 分页响应 | `{ "records": [...], "total": 100, "page": 1, "size": 20 }` |
| 错误码 | 0-成功, 4xx-客户端错误, 5xx-服务端错误 |

### 5.2 用户端接口

#### 5.2.1 目标输入与解析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/goals/parse` | 提交自然语言目标，触发 Agent 解析 |
| POST | `/api/v1/goals/{id}/reply` | 用户回复 Agent 的追问信息 |
| GET | `/api/v1/goals/{id}/result` | 获取解析结果（轮询 / SSE） |
| PUT | `/api/v1/goals/{id}/confirm` | 用户确认/修改解析结果 |

**POST /api/v1/goals/parse 请求体**：
```json
{
  "rawInput": "帮我安排下周五前完成新人培训汇报，包括材料整理、PPT初稿、评审修改和最终彩排。",
  "attachments": []
}
```

**响应体**：
```json
{
  "code": 0,
  "data": {
    "goalId": 1001,
    "sessionId": "sess_abc123",
    "status": "PARSING"
  }
}
```

**GET /api/v1/goals/{id}/result 响应体**：
```json
{
  "code": 0,
  "data": {
    "goalId": 1001,
    "status": "PARSED",
    "parsedTarget": "新人培训汇报",
    "parsedDeadline": "2026-08-01T18:00:00",
    "parsedItems": [
      {"name": "材料整理", "estimatedHours": 16, "priority": "HIGH"},
      {"name": "PPT初稿", "estimatedHours": 8, "priority": "HIGH", "dependsOn": "材料整理"},
      {"name": "评审修改", "estimatedHours": 8, "priority": "MEDIUM", "dependsOn": "PPT初稿"},
      {"name": "最终彩排", "estimatedHours": 4, "priority": "MEDIUM", "dependsOn": "评审修改"}
    ],
    "missingInfo": []
  }
}
```

#### 5.2.2 计划生成与确认

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/goals/{id}/plan` | 触发 Agent 生成排期计划 |
| GET | `/api/v1/goals/{id}/plan` | 获取排期方案预览（含冲突信息） |
| POST | `/api/v1/goals/{id}/plan/confirm` | 确认计划并批量创建任务/日程/提醒 |

**GET 排期方案响应**：
```json
{
  "code": 0,
  "data": {
    "goalId": 1001,
    "plan": [
      {
        "taskTitle": "材料整理",
        "suggestedStart": "2026-07-28T09:00:00",
        "suggestedEnd": "2026-07-29T18:00:00",
        "estimatedHours": 16,
        "priority": "HIGH",
        "hasConflict": false
      },
      {
        "taskTitle": "PPT初稿",
        "suggestedStart": "2026-07-30T09:00:00",
        "suggestedEnd": "2026-07-30T18:00:00",
        "estimatedHours": 8,
        "priority": "HIGH",
        "dependsOn": "材料整理",
        "hasConflict": true,
        "conflictDetail": "与'项目周会'时间重叠(07-30 14:00-15:00)"
      }
    ],
    "conflicts": [
      {
        "taskTitle": "PPT初稿",
        "conflictTask": "项目周会",
        "conflictTime": "2026-07-30T14:00:00",
        "suggestion": "建议将PPT初稿拆分为上午(09:00-12:00)和下午(15:00-18:00)两段"
      }
    ]
  }
}
```

#### 5.2.3 日程与任务总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/dashboard` | 获取今日/本周摘要 |
| GET | `/api/v1/tasks` | 任务列表（支持筛选/排序） |
| GET | `/api/v1/schedules` | 日程列表（日/周/月视图） |
| GET | `/api/v1/report/weekly` | 周报 |
| GET | `/api/v1/report/monthly` | 月报 |

**查询参数**：
```
GET /api/v1/tasks?status=TODO&priority=HIGH&sortBy=deadline&page=1&size=20
GET /api/v1/schedules?startDate=2026-07-25&endDate=2026-08-01&view=week
```

#### 5.2.4 任务操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tasks/{id}` | 查看任务详情 |
| PUT | `/api/v1/tasks/{id}` | 修改任务 |
| PUT | `/api/v1/tasks/{id}/status` | 更新状态（标记完成/延期） |
| POST | `/api/v1/tasks/{id}/reschedule` | 重新规划 |
| POST | `/api/v1/tasks/{id}/summary` | 生成任务总结 |
| GET | `/api/v1/tasks/{id}/logs` | 获取任务操作日志 |
| DELETE | `/api/v1/tasks/{id}` | 删除任务（需确认） |

#### 5.2.5 提醒设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/reminders` | 获取提醒列表 |
| POST | `/api/v1/reminders` | 创建提醒 |
| PUT | `/api/v1/reminders/{id}` | 修改提醒 |
| DELETE | `/api/v1/reminders/{id}` | 删除提醒 |
| PUT | `/api/v1/users/preferences/reminder` | 更新默认提醒偏好 |

### 5.3 管理后台接口

| 方法 | 路径 | 说明 |
|------|------|------|
| **账号管理** | | |
| GET | `/api/v1/admin/accounts` | 账号列表 |
| POST | `/api/v1/admin/accounts` | 创建账号 |
| PUT | `/api/v1/admin/accounts/{id}` | 修改账号/角色 |
| DELETE | `/api/v1/admin/accounts/{id}` | 删除账号 |
| **Agent 管理** | | |
| GET | `/api/v1/admin/agents` | Agent 列表 |
| POST | `/api/v1/admin/agents` | 注册 Agent |
| PUT | `/api/v1/admin/agents/{id}` | 修改 Agent 配置 |
| PUT | `/api/v1/admin/agents/{id}/status` | 启用/停用 Agent |
| **工具管理** | | |
| GET | `/api/v1/admin/tools` | 工具列表 |
| POST | `/api/v1/admin/tools` | 注册工具 |
| PUT | `/api/v1/admin/tools/{id}` | 修改工具定义 |
| **Prompt 管理** | | |
| GET | `/api/v1/admin/prompts` | 模板列表 |
| POST | `/api/v1/admin/prompts` | 创建模板 |
| PUT | `/api/v1/admin/prompts/{id}` | 修改模板 |
| POST | `/api/v1/admin/prompts/{id}/publish` | 发布新版本 |
| **策略管理** | | |
| GET | `/api/v1/admin/strategies` | 策略配置列表 |
| PUT | `/api/v1/admin/strategies/{key}` | 修改策略（优先级/冲突检测规则等） |
| **渠道管理** | | |
| GET | `/api/v1/admin/channels` | 渠道列表 |
| PUT | `/api/v1/admin/channels/{code}` | 配置渠道 |
| **统计面板** | | |
| GET | `/api/v1/admin/dashboard/stats` | 全局统计数据 |
| GET | `/api/v1/admin/sessions` | Agent 会话列表 |
| GET | `/api/v1/admin/sessions/{id}` | 查看会话详情与日志 |

---

### 5.4 功能模块与接口的关系

以下是每个功能模块所需调用的接口清单，前端按此进行 API 分层封装：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      功能模块 → 接口 调用映射                               │
├──────────────────┬──────────────────────────────────────────────────────┤
│ 功能模块          │ 调用的接口                   │ 调用时机               │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 目标输入与         │ POST /api/v1/goals/parse     │ 用户提交自然语言输入    │
│ 意图解析           │ GET /api/v1/goals/{id}/result│ 轮询/SSE获取解析进度   │
│ (含追问循环)       │ POST /api/v1/goals/{id}/reply│ 用户回复Agent追问      │
│                   │ PUT /api/v1/goals/{id}/confirm│ 用户确认解析结果       │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 计划生成与         │ POST /api/v1/goals/{id}/plan │ 触发排期计划生成       │
│ 排期确认           │ GET /api/v1/goals/{id}/plan  │ 获取排期方案预览       │
│                   │ POST /api/v1/goals/{id}/plan  │ 确认计划，批量创建     │
│                   │   /confirm                    │ 任务+日程+提醒        │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 日程与任务         │ GET /api/v1/dashboard         │ 页面加载，获取摘要     │
│ 总览首页           │ GET /api/v1/tasks             │ 任务列表查询          │
│                   │ GET /api/v1/schedules          │ 日历视图查询          │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 任务详情与         │ GET /api/v1/tasks/{id}        │ 查看任务详情          │
│ 执行追踪           │ PUT /api/v1/tasks/{id}/status │ 标记完成/延期         │
│                   │ POST /api/v1/tasks/{id}        │ 重新规划              │
│                   │   /reschedule                 │                       │
│                   │ GET /api/v1/tasks/{id}/logs    │ 查看操作轨迹          │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 提醒设置与         │ GET /api/v1/reminders         │ 提醒列表页加载        │
│ 通知管理           │ POST /api/v1/reminders        │ 新建提醒              │
│                   │ PUT /api/v1/reminders/{id}     │ 修改提醒规则          │
│                   │ DELETE /api/v1/reminders/{id}  │ 删除提醒（需确认）    │
│                   │ PUT /api/v1/users/             │ 更新全局提醒偏好      │
│                   │   preferences/reminder         │                       │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 周报/月报         │ GET /api/v1/report/weekly      │ 查看周报              │
│                   │ GET /api/v1/report/monthly     │ 查看月报              │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 账号与权限管理     │ GET/POST/PUT/DELETE            │ 后台管理员 CRUD       │
│  (管理后台)        │   /api/v1/admin/accounts       │                       │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ Agent 管理         │ GET/POST/PUT                  │ Agent 注册与配置管理  │
│  (管理后台)        │   /api/v1/admin/agents         │                       │
│                   │ GET/POST/PUT                  │ 工具定义管理          │
│                   │   /api/v1/admin/tools           │                       │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ Prompt 与策略     │ GET/POST/PUT                  │ Prompt 模板管理       │
│  (管理后台)        │   /api/v1/admin/prompts        │                       │
│                   │ GET/PUT                       │ 排期与冲突策略配置     │
│                   │   /api/v1/admin/strategies      │                       │
├──────────────────┼──────────────────────────────┼────────────────────────┤
│ 渠道与统计         │ GET/PUT                       │ 通知渠道配置          │
│  (管理后台)        │   /api/v1/admin/channels       │                       │
│                   │ GET /api/v1/admin/             │ 全局统计面板          │
│                   │   dashboard/stats              │                       │
│                   │ GET /api/v1/admin/sessions     │ Agent 会话日志查看     │
└──────────────────┴──────────────────────────────┴────────────────────────┘
```

**接口与功能的设计原则**：

1. **一个功能模块对应一组内聚接口**：例如"目标输入与意图解析"模块涉及 4 个接口，全部封装在前端 `api/goal.ts` 中
2. **接口粒度 = 一次用户交互**：用户发一句话 → `POST /goals/parse`；用户点击确认 → `PUT /goals/{id}/confirm`
3. **敏感操作二次确认**：涉及批量创建/修改/删除的接口（如 `plan/confirm`、`DELETE /reminders/{id}`），前端需先展示确认弹窗，用户确认后才发送请求
4. **异步流程用状态轮询/SSE**：Agent 解析是异步的，前端提交后通过轮询 `GET /goals/{id}/result` 或 SSE 获取进度

---

## 6. AI Agent 技术方案

### 6.1 Agent 编排流程（循环澄清模式）

核心设计理念：**用户首次输入信息往往不完整，Agent 必须通过循环追问来澄清意图，直到信息足够完整且置信度达标，才进入后续的拆解和排期阶段。**

```
                              ┌──────────────────┐
                              │  用户输入目标      │
                              │  (自然语言，可能    │
                              │   信息不完整)      │
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │    IntentParser   │
                              │   意图识别 Agent   │
                              │   解析目标/提取要素 │
                              └────────┬─────────┘
                                       │
                         ┌─────────────▼─────────────┐
                         │   信息完整性检查             │
                         │   - confidence < 0.8 ?     │
                         │   - missingInfo 非空 ?     │
                         │   - 截止时间已明确 ?        │
                         │   - 子事项已明确 ?          │
                         └──────┬──────────┬─────────┘
                                │          │
                    信息不完整   │          │  信息完整
                     (需追问)    │          │  (可继续)
                                │          │
                     ┌──────────▼────────┐ │
                     │ 生成追问问题        │ │
                     │ Agent 输出追问列表  │ │
                     └────────┬─────────┘ │
                              │            │
                     ┌────────▼─────────┐ │
                     │ 展示追问给用户     │ │
                     │ (前端显示追问卡片) │ │
                     └────────┬─────────┘ │
                              │            │
                     ┌────────▼─────────┐ │
                     │ 用户回复追问      │ │
                     │ (补充/修改信息)   │ │
                     └────────┬─────────┘ │
                              │            │
                              └────┬───────┘
                                   │
                         ┌─────────▼─────────┐
                         │ 重新解析 (合并上下文)│
                         │ IntentParser 再次  │
                         │ 解析完整对话        │
                         └────────┬──────────┘
                                  │
                                  │ 信息完整
                                  ▼
              ┌─────────────────────────────────────┐
              │         追问循环结束，进入执行阶段     │
              └──────────────────┬──────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    TaskDecomposer        │
                    │    任务拆解 Agent         │
                    │    拆解子任务/评估耗时     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    ConflictDetector      │
                    │    查询已有日程           │  ← Tool: QuerySchedule
                    │    检测时间冲突           │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    PlanRecommender       │
                    │    生成排期方案           │
                    │    推荐时间片             │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    排期方案预览           │
                    │    用户确认/手动调整      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    ExecutionTracker      │
                    │    批量创建任务           │  ← Tool: CreateTask
                    │    创建日程               │  ← Tool: CreateSchedule
                    │    设置提醒               │  ← Tool: SetReminder
                    │    记录完整日志           │
                    └─────────────────────────┘
```

### 6.2 循环追问示例

用户首次输入通常很模糊，Agent 需要通过多轮对话逐步澄清：

```
Round 1:
  用户: "帮我准备下周的汇报"
  Agent: "好的，我注意到几个关键信息需要确认：
          1. 汇报的主题是什么？
          2. 截止时间是下周几？
          3. 需要准备哪些具体材料？比如 PPT、报告、演讲稿等"
  confidence: 0.3，missingInfo: [主题, 具体截止时间, 交付物类型]

Round 2:
  用户: "新人培训汇报，下周五前完成"
  Agent: "明白了，新人培训汇报，下周五截止。还需要确认：
          1. 需要准备哪些内容？比如材料整理、PPT制作、彩排等
          2. 有没有特别的优先级要求？"
  confidence: 0.55，missingInfo: [子任务清单, 优先级]

Round 3:
  用户: "需要整理培训材料、做PPT、还有最终彩排"
  Agent: "清楚了！整理如下：
          - 目标：新人培训汇报
          - 截止：下周五 18:00
          - 子任务：材料整理 → PPT制作 → 最终彩排
          还需要补充评审/修改环节吗？确认无误后我将为您生成排期计划。"
  confidence: 0.85 → 达标，进入排期阶段
```

### 6.3 Agent 核心服务设计

#### 6.3.1 AgentOrchestrator（编排器）— 多轮澄清版本

> 注意：真正的"循环"不是在一个方法调用中完成，而是由**前端多次 HTTP 请求**驱动——每轮追问 → 用户回复 → 再次调用，直到信息达标或达到最大轮数。

```java
@Service
public class AgentOrchestrator {

    private static final double CONFIDENCE_THRESHOLD = 0.8;
    private static final int MAX_CLARIFY_ROUNDS = 5;  // 最多追问 5 轮

    /**
     * 单轮意图解析
     * 由 Controller 每次收到用户消息时调用（首次输入或回复追问）
     *
     * @param goalId             目标ID（首次调用时新建，后续复用）
     * @param userInput          用户本次输入的内容
     * @param conversationHistory 完整对话历史
     * @return ParseResult：需要追问 → 返回追问列表；信息达标 → 返回解析结果
     */
    public ParseResult processOneRound(Long goalId, String userInput,
                                        List<Message> conversationHistory) {
        // 1. 检查是否超过最大追问轮数
        int currentRound = getCurrentRound(goalId);
        if (currentRound >= MAX_CLARIFY_ROUNDS) {
            // 达到上限，强制使用当前最佳解析结果
            ParseResult result = intentParser.parse(userInput, conversationHistory);
            saveAndComplete(goalId, result);
            return ParseResult.completed(goalId, result);
        }

        // 2. 意图解析（携带完整对话历史）
        ParseResult result = intentParser.parse(userInput, conversationHistory);
        executionTracker.logPhase(goalId, "INTENT_PARSE_ROUND_" + (currentRound + 1),
            userInput, result);

        // 3. 检查是否需要追问
        boolean needsClarification =
            result.getConfidence() < CONFIDENCE_THRESHOLD
            || !result.getMissingInfo().isEmpty()
            || result.getParsedDeadline() == null;

        if (needsClarification) {
            // 需要追问：保存解析进度，返回追问，等待用户下一轮回复
            goalService.updateStatus(goalId, "CLARIFYING");
            goalService.incrementRound(goalId);   // 轮次 +1
            goalService.savePartialResult(goalId, result);  // 保存当前部分结果
            return ParseResult.needsClarification(goalId, result,
                result.getMissingInfo());
        }

        // 4. 信息达标：保存结果，进入排期阶段
        saveAndComplete(goalId, result);
        return ParseResult.completed(goalId, result);
    }

    /**
     * 保存解析结果并标记完成
     */
    private void saveAndComplete(Long goalId, ParseResult result) {
        goalService.updateParsedResult(goalId, result);
        goalService.updateStatus(goalId, "PARSED");
        executionTracker.logPhase(goalId, "PARSE_COMPLETE", null, result);
    }

    /**
     * 获取当前已追问的轮数
     */
    private int getCurrentRound(Long goalId) {
        return goalService.getClarifyRound(goalId);
    }

    // ========== 以下为信息确认后的执行阶段 ==========

    /**
     * 生成排期方案（仅在信息完整后调用）
     */
    public PlanResult generatePlan(Long goalId, Long userId, ParsedGoal parsed) {
        List<SubTask> subTasks = taskDecomposer.decompose(parsed);
        executionTracker.logPhase(goalId, "TASK_DECOMPOSE", parsed, subTasks);

        List<Schedule> existingSchedules = scheduleService.findByUserAndRange(
            userId, LocalDate.now(), parsed.getDeadline().toLocalDate());
        List<Conflict> conflicts = conflictDetector.detect(subTasks, existingSchedules);
        executionTracker.logPhase(goalId, "CONFLICT_DETECT", subTasks, conflicts);

        PlanResult plan = planRecommender.recommend(subTasks, conflicts,
            existingSchedules, parsed.getDeadline());
        executionTracker.logPhase(goalId, "PLAN_RECOMMEND", null, plan);

        goalService.updateStatus(goalId, "PLANNED");
        return plan;
    }

    /**
     * 用户确认后执行（批量创建任务/日程/提醒）
     */
    public void executePlan(Long goalId, Long userId, List<TaskConfirm> confirms) {
        for (TaskConfirm tc : confirms) {
            taskService.create(tc.toTask(userId, goalId));
        }
        scheduleService.batchCreate(confirms, userId);
        reminderService.batchCreate(confirms, userId);
        goalService.updateStatus(goalId, "CONFIRMED");
        executionTracker.logExecution(goalId, confirms);
    }
}
```

**前端驱动的循环流程**（Controller 层示意）：

```java
@RestController
public class GoalController {

    // 首次提交目标 或 用户回复追问 —— 都走同一个入口
    @PostMapping("/api/v1/goals/parse")           // 首次
    @PostMapping("/api/v1/goals/{id}/reply")      // 追问回复
    public ApiResponse<ParseResultDTO> handleUserInput(@PathVariable(required=false) Long id,
                                                        @RequestBody UserInputDTO input) {
        Long goalId = (id != null) ? id : goalService.create(input.getRawInput(), userId);
        List<Message> history = sessionService.getConversationHistory(goalId);

        ParseResult result = orchestrator.processOneRound(goalId, input.getRawInput(), history);

        if (result.needsClarification()) {
            // 追问：返回问题列表，前端展示追问卡片，等待用户再次输入
            return ApiResponse.ok(result.toDTO());
        }
        // 解析完成：前端展示结果，引导用户点击"确认"进入排期
        return ApiResponse.ok(result.toDTO());
    }
}
```

**整个循环由以下步骤联动完成**：

```
前端 POST /goals/parse     →  后端 processOneRound()  →  返回"需要追问"
前端展示追问卡片            ←  用户输入回复
前端 POST /goals/{id}/reply →  后端 processOneRound()  →  返回"需要追问"（轮次+1）
前端展示追问卡片            ←  用户输入回复
前端 POST /goals/{id}/reply →  后端 processOneRound()  →  返回"解析完成"（达标或超限）
前端展示解析结果，用户确认    →  进入排期阶段
```

#### 6.3.2 追问场景触发规则

| 条件 | 追问示例 | 优先级 |
|------|----------|--------|
| 没有明确截止时间 | "这个目标需要在什么时候之前完成？" | 最高 |
| 没有列出具体子事项 | "需要拆分为哪些具体步骤？比如是否有材料准备、初稿、评审等环节" | 高 |
| 目标描述过于笼统（< 10 字） | "能否详细描述一下这个目标？比如涉及哪些内容、有没有特殊要求" | 高 |
| 多个目标混淆在一起 | "看起来您提到了多个目标，需要我分别规划吗？" | 中 |
| 置信度 < 0.8 | "为了更准确地帮您规划，请确认以下几点：..." | 中 |
| 日期冲突（相对时间无法解析） | "请提供具体的截止日期，比如 8月15日，而不是'下周'" | 低 |

### 6.4 工具（Function Calling）定义

#### 6.4.1 工具注册模型

```java
@Data
public class ToolDefinition {
    private String name;           // 工具名称
    private String description;    // 工具描述（供 LLM 选择工具时阅读）
    private Map<String, Object> parameters;  // JSON Schema 参数定义
    private boolean requiresConfirm;  // 是否需要用户确认
    private int maxRetries;        // 失败最大重试次数
}
```

#### 6.4.2 工具清单

| 工具名称 | 功能 | 是否需确认 | 说明 |
|----------|------|------------|------|
| `query_schedule` | 查询用户已有日程 | 否 | 输入时间范围，返回日程列表 |
| `detect_conflict` | 检测时间冲突 | 否 | 输入候选时间段，返回冲突详情 |
| `create_task` | 创建单个任务 | 是 | 批量创建时每条都需确认 |
| `create_schedule` | 创建日程 | 是 | 写入日程表 |
| `set_reminder` | 设置提醒 | 是 | 创建提醒记录 |
| `update_task_status` | 更新任务状态 | 否 | 标记完成/延期 |
| `generate_summary` | 生成任务总结 | 否 | 调用 LLM 生成摘要 |

#### 6.4.3 工具 JSON Schema 示例

```json
{
  "name": "query_schedule",
  "description": "查询指定时间范围内用户的已有日程安排",
  "parameters": {
    "type": "object",
    "properties": {
      "startDate": {
        "type": "string",
        "description": "查询开始日期，格式 yyyy-MM-dd"
      },
      "endDate": {
        "type": "string",
        "description": "查询结束日期，格式 yyyy-MM-dd"
      }
    },
    "required": ["startDate", "endDate"]
  }
}
```

```json
{
  "name": "create_task",
  "description": "创建一个新任务",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "任务标题"
      },
      "description": {
        "type": "string",
        "description": "任务描述（可选）"
      },
      "priority": {
        "type": "string",
        "enum": ["HIGH", "MEDIUM", "LOW"],
        "description": "优先级"
      },
      "startTime": {
        "type": "string",
        "description": "开始时间，ISO 8601 格式"
      },
      "endTime": {
        "type": "string",
        "description": "结束时间，ISO 8601 格式"
      },
      "parentTaskId": {
        "type": "integer",
        "description": "依赖的前置任务ID（可选）"
      }
    },
    "required": ["title", "priority", "startTime", "endTime"]
  },
  "requiresConfirm": true
}
```

### 6.5 Prompt 设计

#### 6.5.1 意图识别 Prompt

```
你是一个任务解析专家。从用户的自然语言输入中提取以下结构化信息。

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
}
```

#### 6.5.2 排期推荐 Prompt

```
你是一个排期规划专家。根据子任务列表、已有日程和截止时间，为每个子任务推荐合理的执行时间片。

## 排期规则
1. 优先按依赖关系排序（前置任务必须先安排）
2. 高优先级任务优先占用较早的时间片
3. 避开已有日程的占用时间
4. 每个工作日按 8 小时可用时间计算（9:00-12:00, 14:00-18:00）
5. 任务尽量不跨天拆分，如必须拆分别超过 2 段

## 输入
- 子任务列表：{subTasks}
- 已有日程：{existingSchedules}
- 截止时间：{deadline}

## 输出格式（严格 JSON）
{
  "plan": [
    {
      "taskName": "...",
      "suggestedStart": "yyyy-MM-ddTHH:mm:ss",
      "suggestedEnd": "yyyy-MM-ddTHH:mm:ss",
      "hasConflict": boolean,
      "conflictDetail": "...",
      "alternativeSlot": "备用时间片建议"
    }
  ],
  "conflicts": [...],
  "warnings": ["靠近截止时间的风险提醒"]
}
```

### 6.6 LLM 调用设计

```java
@Service
public class LLMClient {

    private final RestClient restClient;
    private final List<ModelProvider> providers;  // 支持多模型切换

    /**
     * 带工具调用的 LLM 请求
     */
    public LLMResponse chatWithTools(String systemPrompt, String userMessage,
                                      List<ToolDefinition> tools, String modelName) {
        // 构建请求
        ChatRequest request = ChatRequest.builder()
            .model(modelName)
            .messages(List.of(
                Message.system(systemPrompt),
                Message.user(userMessage)
            ))
            .tools(tools)
            .temperature(0.3)
            .build();

        // 调用 LLM API
        LLMResponse response = restClient.post(request);

        // 如果 LLM 返回了工具调用
        if (response.hasToolCalls()) {
            for (ToolCall tc : response.getToolCalls()) {
                // 需要确认的工具调用标记为 PENDING_CONFIRM
                if (tc.requiresConfirm()) {
                    tc.setStatus(ToolCallStatus.PENDING_CONFIRM);
                } else {
                    // 自动执行工具并追加结果
                    Object result = executeTool(tc);
                    response.appendToolResult(tc.getId(), result);
                }
            }
            // 继续对话获取最终结果
            return chatWithTools(systemPrompt, response.getMessages(), tools, modelName);
        }

        return response;
    }

    /**
     * 执行单个工具
     */
    private Object executeTool(ToolCall tc) {
        ToolExecutor executor = toolRegistry.getExecutor(tc.getFunctionName());
        return executor.execute(tc.getArguments());
    }
}
```

### 6.7 失败兜底策略

| 场景 | 策略 |
|------|------|
| LLM 返回非 JSON | 重试 1 次，附带格式纠正提示；仍失败则返回错误并要求用户手动输入 |
| 工具调用失败 | 重试最多 3 次；失败后 Agent 生成替代建议并告知用户 |
| 意图置信度 < 0.6 | 不直接执行，生成追问列表请用户补充信息 |
| Token 超限 | 截断上下文，保留最近 3 轮对话 + 关键系统 Prompt |
| 模型超时 | 30s 超时，重试 1 次，仍超时返回"处理中"状态并异步执行 |

---

## 7. 安全设计

### 7.1 认证与授权

```
认证流程:
  用户登录 → 验证凭证 → 签发 JWT (含 userId, roles, 过期时间)
       ↓
  后续请求 → Header携带 Bearer Token → JWT Filter 校验 → 注入 SecurityContext

授权模型:
  ROLE_USER    → 用户端所有接口
  ROLE_ADMIN   → 管理后台接口
  ROLE_SUPER   → 账号管理 + 删除操作

敏感操作二次确认:
  - 批量创建/修改/删除  → 接口参数中 requireConfirm=true
  - 前端展示确认弹窗 → 用户确认后再次请求
```

### 7.2 Prompt 注入防护

```java
@Component
public class PromptInjectionGuard {

    private static final List<String> INJECTION_PATTERNS = List.of(
        "ignore previous instructions",
        "忽略之前的指令",
        "system prompt:",
        "<<SYS>>",
        "你是一个新的",
        "reset",
        "重新定义你的角色"
    );

    /**
     * 校验用户输入是否包含注入尝试
     */
    public void validate(String userInput) {
        String lower = userInput.toLowerCase();
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern.toLowerCase())) {
                throw new SecurityException("检测到潜在的Prompt注入，请重新输入");
            }
        }
    }
}
```

### 7.3 数据安全

| 层面 | 措施 |
|------|------|
| 传输层 | HTTPS 加密 |
| 密码存储 | BCrypt 哈希 |
| 敏感日志 | 脱敏处理（手机号中间4位、邮箱前缀部分隐藏） |
| SQL 注入 | MyBatis-Plus 参数化查询 |
| CORS | 仅允许配置的前端域名 |
| 接口限流 | 基于 Redis + 注解，每人每分钟最多 10 次 Agent 请求 |

---

## 8. 前端路由与页面设计

### 8.1 React 路由设计

```tsx
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  // 用户端
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'goal', element: <GoalInput /> },
      { path: 'plan/:goalId', element: <PlanPreview /> },
      { path: 'task/:id', element: <TaskDetail /> },
      { path: 'reminders', element: <ReminderSettings /> },
      { path: 'report/:type', element: <Report /> },
    ],
  },
  // 管理后台
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'accounts', element: <AccountManage /> },
      { path: 'agents', element: <AgentManage /> },
      { path: 'prompts', element: <PromptManage /> },
      { path: 'channels', element: <ChannelManage /> },
      { path: 'sessions', element: <SessionLogs /> },
    ],
  },
  // 登录
  { path: '/login', element: <Login /> },
]);
```

### 8.2 关键页面交互流程

```
目标输入页:
  ┌─────────────────────────────┐
  │  📝 输入您的目标...          │
  │                             │
  │  [文本输入框，支持多行]      │
  │                             │
  │  [🎤 语音输入]  [📎 附件]   │
  │                             │
  │         [发送给AI助手]       │
  └──────────────┬──────────────┘
                 │ 发送后
  ┌──────────────▼──────────────┐
  │  🔍 AI 正在解析您的目标...   │
  │                             │
  │  已识别:                    │
  │  ✓ 目标: 新人培训汇报       │
  │  ✓ 截止: 2026-08-01 18:00  │
  │  ✓ 4个子任务已识别          │
  │                             │
  │  [确认 ✓] [修改 ✎]         │
  └─────────────────────────────┘

计划预览页:
  ┌─────────────────────────────┐
  │  排期方案预览                │
  │                             │
  │  ┌─────────────────────┐    │
  │  │ 📋 材料整理           │    │
  │  │ 7/28 09:00 - 7/29 18:00│  │
  │  │ 预计 16h | 优先级 高   │    │
  │  └─────────────────────┘    │
  │  ┌─────────────────────┐    │
  │  │ ⚠ PPT初稿            │    │
  │  │ 7/30 09:00 - 18:00   │    │
  │  │ ⚡冲突: 项目周会 14-15时│  │
  │  │ 💡建议: 拆为上下午两段  │    │
  │  └─────────────────────┘    │
  │                             │
  │  [一键确认] [手动调整]      │
  └─────────────────────────────┘
```

---

## 9. 定时任务设计

| 任务 | 执行频率 | 说明 |
|------|----------|------|
| 提醒扫描 | 每分钟 | 扫描 reminder 表中 remind_time <= now 且 status=PENDING 的记录，触发通知发送 |
| 通知发送 | 即时 | 根据提醒配置的渠道调用对应 API（站内信/邮件/第三方） |
| 通知重试 | 每 5 分钟 | 扫描 status=FAILED 且 retry_count < 3 的通知，重新发送 |
| 周报生成 | 每周日 22:00 | 自动为用户生成本周任务总结 |
| 会话清理 | 每天 2:00 | 清理超过 7 天的临时状态数据 |

---

## 10. 部署架构

```
┌─────────────────────────────────────────┐
│                 Nginx                     │
│  80/443 → 前端静态资源 + API反向代理       │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐   ┌────▼────┐
│React   │   │SpringBoot│
│静态资源│   │  jar     │
│       │   │ :8080    │
└───────┘   └────┬─────┘
                 │
         ┌───────┴───────┐
         │               │
    ┌────▼────┐    ┌─────▼─────┐
    │  MySQL  │    │   Redis   │
    │  :3306  │    │   :6379   │
    └─────────┘    └───────────┘
```

**最低运行环境**：
- JDK 17
- MySQL 8.0
- Redis 7.x
- Nginx 1.24+
- 2 核 4G 服务器即可运行

---

## 11. 项目里程碑建议

| 阶段 | 时间 | 交付物 | 关键检查点 |
|------|------|--------|------------|
| 需求 & 原型 | Day 1-2 | 原型图、需求边界文档 | 功能清单评审 |
| 系统设计 | Day 2-3 | 架构图、接口文档、数据库 DDL | 表结构评审 |
| 核心开发 | Day 3-7 | 主链路代码 | 目标输入→计划→落库可跑通 |
| Agent 联调 | Day 7-9 | Agent 工具调用与日志 | 5个关键作用点均可演示 |
| 测试 & 安全 | Day 9-10 | 测试报告、安全说明 | 主链路 + 异常路径覆盖 |
| 验收准备 | Day 10-11 | PPT、演示脚本、部署文档 | 全流程预演 |
