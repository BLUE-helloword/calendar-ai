# API 接口文档

> AI Agent 日程与任务协同助手  
> Base URL: `http://localhost:8080`  
> 文档版本: V1.0

---

## 通用说明

### 统一响应格式

所有接口返回值均由 `ApiResponse<T>` 包装：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 0=成功，非0=失败 |
| message | string | 提示信息 |
| data | T | 业务数据，为 null 时不返回 |

### 错误码约定

| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 参数校验失败 / 业务异常 |
| 401 | 认证失败（登录接口） |
| 403 | 未认证 / 无权限访问 |
| 404 | 资源不存在 |
| 500 | 系统内部错误 |

### 认证方式

除登录接口外，所有接口需在 `Authorization` Header 中携带 JWT Token：

```
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

### 时间格式

所有时间字段统一使用 `yyyy-MM-dd HH:mm:ss` 格式，如 `2026-07-28 09:00:00`。

### 测试账号

| 用户名 | 密码 |
|--------|------|
| admin | 123456 |
| demo | 123456 |

---

## 接口总览

| 模块 | 接口数 | 说明 |
|------|--------|------|
| [认证管理](#一认证管理) | 1 | 用户登录 |
| [目标管理](#二目标管理) | 4 | 提交目标→解析→追问→确认 |
| [排期管理](#三排期管理) | 3 | 生成→预览→确认排期 |
| [任务管理](#四任务管理) | 5 | 任务 CRUD + 状态流转 |
| [首页总览](#五首页总览) | 2 | 首页统计 + 周报 |
| [提醒管理](#六提醒管理) | 3 | 提醒 CRUD |

---

## 一、认证管理

### POST /api/v1/auth/login

用户登录，获取 JWT Token。

**请求体**

```json
{
  "username": "admin",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "username": "admin",
    "nickname": "管理员"
  }
}
```

**失败响应**

```json
{
  "code": 401,
  "message": "用户名或密码错误"
}
```

---

## 二、目标管理

### 2.1 POST /api/v1/goals/parse

提交自然语言目标，Agent 进行意图识别。

**请求头**

```
Authorization: Bearer {token}
```

**请求体**

```json
{
  "rawInput": "帮我安排下周五前完成新人培训汇报，包括材料整理、PPT初稿、评审修改和最终彩排"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rawInput | string | 是 | 自然语言描述的目标 |

**成功响应（解析完成）**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "goalId": 1,
    "status": "PARSED",
    "parsedTarget": "新人培训汇报",
    "parsedDeadline": "2026-08-01 18:00:00",
    "parsedItems": "[...]",
    "confidence": 0.95,
    "needsClarification": false,
    "questions": null,
    "currentRound": 1
  }
}
```

**成功响应（需要追问）**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "goalId": 1,
    "status": "CLARIFYING",
    "parsedTarget": null,
    "parsedDeadline": null,
    "parsedItems": null,
    "confidence": 0.3,
    "needsClarification": true,
    "questions": [
      "请问具体需要完成哪些子事项？",
      "每个子事项预计需要多长时间？"
    ],
    "currentRound": 1
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| goalId | number | 目标ID |
| status | string | PARSING=解析中 / CLARIFYING=需要追问 / PARSED=解析完成 |
| parsedTarget | string | 解析出的目标摘要 |
| parsedDeadline | string | 解析出的截止时间 |
| parsedItems | string | 解析出的事项列表(JSON) |
| confidence | number | 置信度 0.0~1.0 |
| needsClarification | boolean | 是否需要追问 |
| questions | array | 追问问题列表 |
| currentRound | number | 当前追问轮次 |

---

### 2.2 GET /api/v1/goals/{id}/result

查询目标的当前解析状态。

**路径参数**

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 目标ID |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "goalId": 1,
    "status": "CLARIFYING",
    "parsedTarget": null,
    "currentRound": 2
  }
}
```

**失败响应**

```json
{
  "code": 404,
  "message": "目标不存在"
}
```

---

### 2.3 POST /api/v1/goals/{id}/reply

回复 Agent 的追问，继续多轮澄清。

**路径参数**

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 目标ID |

**请求体**

```json
{
  "reply": "材料整理需要2天，PPT初稿1天，评审修改1天，最终彩排半天"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reply | string | 是 | 对 Agent 追问的回答 |

**成功响应**

与 [2.1 成功响应](#21-post-apiv1goalsparse) 格式一致。若信息仍不完整则继续返回 `CLARIFYING`，达标则返回 `PARSED`。

---

### 2.4 PUT /api/v1/goals/{id}/confirm

确认目标解析结果，状态变更为 CONFIRMED。

**路径参数**

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 目标ID |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "goalId": 1,
    "status": "CONFIRMED",
    "parsedTarget": "新人培训汇报",
    "parsedDeadline": "2026-08-01 18:00:00"
  }
}
```

---

## 三、排期管理

### 3.1 POST /api/v1/goals/{id}/plan/generate

根据目标解析结果生成排期方案（含冲突检测）。

**路径参数**

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 目标ID |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "goalId": 1,
    "parsedTarget": "新人培训汇报",
    "planItems": [
      {
        "title": "材料整理",
        "startTime": "2026-07-28 09:00:00",
        "endTime": "2026-07-29 18:00:00",
        "estimatedHours": 16.0,
        "priority": "HIGH",
        "hasConflict": false,
        "conflictDetail": null
      },
      {
        "title": "PPT初稿",
        "startTime": "2026-07-30 09:00:00",
        "endTime": "2026-07-30 18:00:00",
        "estimatedHours": 8.0,
        "priority": "HIGH",
        "hasConflict": true,
        "conflictDetail": "与 [周会] 时间重叠"
      }
    ]
  }
}
```

---

### 3.2 GET /api/v1/goals/{id}/plan/preview

预览排期方案，与 generate 返回结构一致。

---

### 3.3 POST /api/v1/goals/{id}/plan/confirm

确认排期方案，批量创建 Task、Schedule、Reminder 并写入数据库。

**路径参数**

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 目标ID |

**请求体**

```json
{
  "items": [
    {
      "title": "材料整理",
      "startTime": "2026-07-28 09:00:00",
      "endTime": "2026-07-29 18:00:00",
      "priority": "HIGH"
    },
    {
      "title": "PPT初稿",
      "startTime": "2026-07-30 09:00:00",
      "endTime": "2026-07-30 18:00:00",
      "priority": "HIGH"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items[].title | string | 是 | 任务标题 |
| items[].startTime | string | 是 | 开始时间 yyyy-MM-dd HH:mm:ss |
| items[].endTime | string | 是 | 结束时间 yyyy-MM-dd HH:mm:ss |
| items[].priority | string | 否 | 优先级 HIGH/MEDIUM/LOW，默认 MEDIUM |

**成功响应**

```json
{
  "code": 0,
  "message": "success"
}
```

> 确认后自动为每个任务创建 30 分钟前的提醒（Reminder），并生成对应的日程（Schedule）。

---

## 四、任务管理

### 4.1 GET /api/v1/tasks

获取当前用户的任务列表，支持按状态和优先级筛选。

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | TODO / IN_PROGRESS / DONE / DELAYED |
| priority | string | 否 | 1=高 / 2=中 / 3=低 |

**请求示例**

```
GET /api/v1/tasks?status=TODO&priority=1
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "goalId": 1,
      "userId": 1,
      "title": "材料整理",
      "description": null,
      "priority": 1,
      "status": "TODO",
      "startTime": "2026-07-28 09:00:00",
      "endTime": "2026-07-29 18:00:00",
      "estimatedHours": 16.0,
      "parentTaskId": null,
      "dependencyType": null,
      "sourceType": "AI_GENERATED",
      "createdAt": "2026-07-25 22:40:00",
      "updatedAt": "2026-07-25 22:40:00"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 任务ID |
| goalId | number | 所属目标ID |
| title | string | 任务标题 |
| priority | number | 1=高, 2=中, 3=低 |
| status | string | TODO / IN_PROGRESS / DONE / DELAYED / CANCELLED |
| startTime | string | 开始时间 |
| endTime | string | 结束时间 |
| estimatedHours | number | 预计耗时 |
| sourceType | string | MANUAL=手动创建 / AI_GENERATED=AI生成 |

---

### 4.2 GET /api/v1/tasks/{id}

获取单个任务详情。

**成功响应**

单个 Task 对象，结构同 4.1。

**失败响应**

```json
{
  "code": 404,
  "message": "任务不存在"
}
```

---

### 4.3 PUT /api/v1/tasks/{id}

更新任务信息。

**请求体**（所有字段可选，只更新传入的字段）

```json
{
  "title": "材料整理（已更新）",
  "description": "收集培训相关资料",
  "priority": 1,
  "startTime": "2026-07-28 09:00:00",
  "endTime": "2026-07-29 18:00:00"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 任务标题 |
| description | string | 否 | 任务描述 |
| priority | number | 否 | 1=高 / 2=中 / 3=低 |
| startTime | string | 否 | yyyy-MM-dd HH:mm:ss |
| endTime | string | 否 | yyyy-MM-dd HH:mm:ss |

---

### 4.4 PUT /api/v1/tasks/{id}/status

修改任务状态。

**请求体**

```json
{
  "status": "IN_PROGRESS"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | TODO / IN_PROGRESS / DONE / DELAYED / CANCELLED |

**成功响应**

```json
{
  "code": 0,
  "message": "success"
}
```

---

### 4.5 DELETE /api/v1/tasks/{id}

删除任务。

**成功响应**

```json
{
  "code": 0,
  "message": "success"
}
```

---

## 五、首页总览

### 5.1 GET /api/v1/dashboard

首页总览，返回今日任务、未来任务、统计数据。

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "todayTasks": [],
    "upcomingTasks": [],
    "todaySchedules": [],
    "totalTasks": 2,
    "completedTasks": 0,
    "delayedTasks": 0,
    "highPriorityTasks": []
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| todayTasks | array | 今日待处理任务 |
| upcomingTasks | array | 未来7天任务 |
| todaySchedules | array | 今日日程 |
| totalTasks | number | 总任务数 |
| completedTasks | number | 已完成数 |
| delayedTasks | number | 已延期数 |
| highPriorityTasks | array | 高优先级未完成任务 |

---

### 5.2 GET /api/v1/dashboard/report

周报统计，返回近期任务完成情况。

**Query 参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| days | number | 否 | 7 | 统计天数 |

**请求示例**

```
GET /api/v1/dashboard/report?days=7
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "completedTasks": [],
    "completedCount": 0,
    "totalCount": 2,
    "period": "最近7天"
  }
}
```

---

## 六、提醒管理

### 6.1 GET /api/v1/reminders

获取当前用户的所有提醒列表。

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "taskId": 1,
      "remindTime": "2026-07-28 08:30:00",
      "remindType": "ONCE",
      "channel": "IN_APP",
      "message": "材料整理 即将开始",
      "status": "PENDING",
      "createdAt": "2026-07-25 22:40:00"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 提醒ID |
| taskId | number | 关联任务ID |
| remindTime | string | 提醒时间 |
| remindType | string | ONCE / REPEAT_DAILY / REPEAT_WEEKLY |
| channel | string | IN_APP / EMAIL / WECHAT / FEISHU |
| message | string | 提醒文案 |
| status | string | PENDING / SENT / FAILED |

---

### 6.2 PUT /api/v1/reminders/{id}

更新提醒配置。

**请求体**（所有字段可选）

```json
{
  "remindTime": "2026-07-28 08:00:00",
  "remindType": "ONCE",
  "channel": "EMAIL",
  "message": "别忘了准备汇报材料！"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| remindTime | string | 否 | yyyy-MM-dd HH:mm:ss |
| remindType | string | 否 | ONCE / REPEAT_DAILY / REPEAT_WEEKLY |
| channel | string | 否 | IN_APP / EMAIL / WECHAT / FEISHU |
| message | string | 否 | 提醒文案 |

---

### 6.3 DELETE /api/v1/reminders/{id}

删除提醒。

**成功响应**

```json
{
  "code": 0,
  "message": "success"
}
```

---

## 附录：业务流程调用示例

### 完整链路：从输入目标到任务执行

```
1. POST /api/v1/auth/login
   → 获取 token

2. POST /api/v1/goals/parse
   Body: {"rawInput": "帮我安排下周五前完成新人培训汇报"}
   → 返回 CLARIFYING，需要追问
   → goalId = 1

3. POST /api/v1/goals/1/reply
   Body: {"reply": "材料整理2天，PPT初稿1天，评审修改1天，最终彩排半天"}
   → 返回 PARSED

4. PUT /api/v1/goals/1/confirm
   → 状态变为 CONFIRMED

5. POST /api/v1/goals/1/plan/generate
   → 获取排期方案（含冲突检测）

6. POST /api/v1/goals/1/plan/confirm
   Body: {"items": [...]}
   → 批量创建 Task + Schedule + Reminder

7. GET /api/v1/tasks
   → 查看所有任务

8. PUT /api/v1/tasks/1/status
   Body: {"status": "IN_PROGRESS"}
   → 开始执行任务

9. GET /api/v1/dashboard
   → 查看整体进度

10. GET /api/v1/dashboard/report?days=7
    → 查看周报
```

### Swagger 文档

启动应用后访问：`http://localhost:8080/doc.html`
