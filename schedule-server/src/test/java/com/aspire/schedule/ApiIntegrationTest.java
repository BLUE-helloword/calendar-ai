package com.aspire.schedule;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 全接口集成测试
 * 覆盖 Auth / Goal / Plan / Task / Dashboard / Reminder 所有端点
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static String token;
    private static Long goalId;

    // ==================== Auth ====================

    @Test
    @Order(1)
    @DisplayName("POST /api/v1/auth/login - 登录成功")
    void loginSuccess() throws Exception {
        JSONObject body = new JSONObject();
        body.set("username", "admin");
        body.set("password", "123456");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.username").value("admin"))
                .andReturn();

        JSONObject resp = JSONUtil.parseObj(result.getResponse().getContentAsString());
        token = resp.getJSONObject("data").getStr("token");
        System.out.println("✓ 登录成功，获取 Token");
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/v1/auth/login - 密码错误")
    void loginFail() throws Exception {
        JSONObject body = new JSONObject();
        body.set("username", "admin");
        body.set("password", "wrongpass");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
        System.out.println("✓ 错误密码返回401");
    }

    @Test
    @Order(3)
    @DisplayName("未认证访问受保护接口 - 返回403")
    void unauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isForbidden());
        System.out.println("✓ 未认证访问被拒绝(403)");
    }

    // ==================== Goal ====================

    @Test
    @Order(10)
    @DisplayName("POST /api/v1/goals/parse - 提交自然语言目标")
    void goalParse() throws Exception {
        JSONObject body = new JSONObject();
        body.set("rawInput", "帮我安排下周五前完成新人培训汇报，包括材料整理、PPT初稿、评审修改和最终彩排");

        MvcResult result = mockMvc.perform(post("/api/v1/goals/parse")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.goalId").exists())
                .andExpect(jsonPath("$.data.status").exists())
                .andExpect(jsonPath("$.data.needsClarification").exists())
                .andReturn();

        JSONObject resp = JSONUtil.parseObj(result.getResponse().getContentAsString());
        goalId = resp.getJSONObject("data").getLong("goalId");
        System.out.println("✓ 提交目标成功，goalId=" + goalId);
    }

    @Test
    @Order(11)
    @DisplayName("GET /api/v1/goals/{id}/result - 查询解析结果")
    void goalGetResult() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");
        mockMvc.perform(get("/api/v1/goals/" + goalId + "/result")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.goalId").value(goalId.intValue()))
                .andExpect(jsonPath("$.data.status").exists());
        System.out.println("✓ 查询解析结果成功");
    }

    @Test
    @Order(12)
    @DisplayName("POST /api/v1/goals/{id}/reply - 回复Agent追问")
    void goalReply() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");
        JSONObject body = new JSONObject();
        body.set("reply", "材料整理需要2天，PPT初稿1天，评审修改1天，最终彩排半天");

        mockMvc.perform(post("/api/v1/goals/" + goalId + "/reply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.goalId").value(goalId.intValue()));
        System.out.println("✓ 回复追问成功");
    }

    @Test
    @Order(13)
    @DisplayName("PUT /api/v1/goals/{id}/confirm - 确认解析结果")
    void goalConfirm() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");
        mockMvc.perform(put("/api/v1/goals/" + goalId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
        System.out.println("✓ 确认解析结果成功");
    }

    @Test
    @Order(14)
    @DisplayName("GET /api/v1/goals/{id}/result - 查询不存在的目标")
    void goalGetResultNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/goals/99999/result")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
        System.out.println("✓ 不存在的目标返回404");
    }

    // ==================== Plan ====================

    @Test
    @Order(20)
    @DisplayName("POST /api/v1/goals/{id}/plan/generate - 生成排期方案")
    void planGenerate() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");
        mockMvc.perform(post("/api/v1/goals/" + goalId + "/plan/generate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        System.out.println("✓ 生成排期方案成功");
    }

    @Test
    @Order(21)
    @DisplayName("GET /api/v1/goals/{id}/plan/preview - 预览排期方案")
    void planPreview() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");
        mockMvc.perform(get("/api/v1/goals/" + goalId + "/plan/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        System.out.println("✓ 预览排期方案成功");
    }

    @Test
    @Order(22)
    @DisplayName("POST /api/v1/goals/{id}/plan/confirm - 确认排期并落库")
    void planConfirm() throws Exception {
        Assertions.assertNotNull(goalId, "需要先创建 goal");

        JSONObject item1 = new JSONObject();
        item1.set("title", "材料整理");
        item1.set("startTime", "2026-07-28 09:00:00");
        item1.set("endTime", "2026-07-29 18:00:00");
        item1.set("priority", "HIGH");

        JSONObject item2 = new JSONObject();
        item2.set("title", "PPT初稿");
        item2.set("startTime", "2026-07-30 09:00:00");
        item2.set("endTime", "2026-07-30 18:00:00");
        item2.set("priority", "HIGH");

        JSONArray items = new JSONArray();
        items.add(item1);
        items.add(item2);

        JSONObject body = new JSONObject();
        body.set("items", items);

        mockMvc.perform(post("/api/v1/goals/" + goalId + "/plan/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        System.out.println("✓ 确认排期并落库成功");
    }

    // ==================== Task ====================

    @Test
    @Order(30)
    @DisplayName("GET /api/v1/tasks - 任务列表")
    void taskList() throws Exception {
        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
        System.out.println("✓ 任务列表查询成功");
    }

    @Test
    @Order(31)
    @DisplayName("GET /api/v1/tasks - 按状态筛选")
    void taskListFiltered() throws Exception {
        mockMvc.perform(get("/api/v1/tasks")
                        .param("status", "TODO")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        System.out.println("✓ 按状态筛选任务成功");
    }

    @Test
    @Order(32)
    @DisplayName("GET /api/v1/tasks/{id} - 任务详情")
    void taskDetail() throws Exception {
        // 先拿到 task 列表，取第一个的 id
        MvcResult listResult = mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            Long taskId = data.getJSONObject(0).getLong("id");
            mockMvc.perform(get("/api/v1/tasks/" + taskId)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.id").value(taskId.intValue()));
            System.out.println("✓ 任务详情查询成功，taskId=" + taskId);
        } else {
            System.out.println("- 跳过：无任务数据（需先确认排期）");
        }
    }

    @Test
    @Order(33)
    @DisplayName("PUT /api/v1/tasks/{id} - 更新任务")
    void taskUpdate() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            Long taskId = data.getJSONObject(0).getLong("id");

            JSONObject body = new JSONObject();
            body.set("title", "材料整理（已更新）");
            body.set("priority", 1);

            mockMvc.perform(put("/api/v1/tasks/" + taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body.toString())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
            System.out.println("✓ 更新任务成功");
        } else {
            System.out.println("- 跳过：无任务数据");
        }
    }

    @Test
    @Order(34)
    @DisplayName("PUT /api/v1/tasks/{id}/status - 修改任务状态")
    void taskUpdateStatus() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            Long taskId = data.getJSONObject(0).getLong("id");

            JSONObject body = new JSONObject();
            body.set("status", "IN_PROGRESS");

            mockMvc.perform(put("/api/v1/tasks/" + taskId + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body.toString())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
            System.out.println("✓ 修改任务状态成功");
        } else {
            System.out.println("- 跳过：无任务数据");
        }
    }

    @Test
    @Order(35)
    @DisplayName("DELETE /api/v1/tasks/{id} - 删除任务")
    void taskDelete() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            // 取最后一个
            Long taskId = data.getJSONObject(data.size() - 1).getLong("id");

            mockMvc.perform(delete("/api/v1/tasks/" + taskId)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
            System.out.println("✓ 删除任务成功");
        } else {
            System.out.println("- 跳过：无任务数据");
        }
    }

    // ==================== Dashboard ====================

    @Test
    @Order(40)
    @DisplayName("GET /api/v1/dashboard - 首页总览")
    void dashboard() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.totalTasks").exists())
                .andExpect(jsonPath("$.data.completedTasks").exists());
        System.out.println("✓ 首页总览查询成功");
    }

    @Test
    @Order(41)
    @DisplayName("GET /api/v1/dashboard/report - 周报")
    void dashboardReport() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/report")
                        .param("days", "7")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.period").value("最近7天"));
        System.out.println("✓ 周报查询成功");
    }

    // ==================== Reminder ====================

    @Test
    @Order(50)
    @DisplayName("GET /api/v1/reminders - 提醒列表")
    void reminderList() throws Exception {
        mockMvc.perform(get("/api/v1/reminders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        System.out.println("✓ 提醒列表查询成功");
    }

    @Test
    @Order(51)
    @DisplayName("PUT /api/v1/reminders/{id} - 更新提醒")
    void reminderUpdate() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/v1/reminders")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            Long reminderId = data.getJSONObject(0).getLong("id");

            JSONObject body = new JSONObject();
            body.set("message", "别忘了准备汇报材料！");

            mockMvc.perform(put("/api/v1/reminders/" + reminderId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body.toString())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
            System.out.println("✓ 更新提醒成功");
        } else {
            System.out.println("- 跳过：无提醒数据（需先确认排期）");
        }
    }

    @Test
    @Order(52)
    @DisplayName("DELETE /api/v1/reminders/{id} - 删除提醒")
    void reminderDelete() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/v1/reminders")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JSONObject listResp = JSONUtil.parseObj(listResult.getResponse().getContentAsString());
        JSONArray data = listResp.getJSONArray("data");
        if (data != null && !data.isEmpty()) {
            Long reminderId = data.getJSONObject(data.size() - 1).getLong("id");

            mockMvc.perform(delete("/api/v1/reminders/" + reminderId)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
            System.out.println("✓ 删除提醒成功");
        } else {
            System.out.println("- 跳过：无提醒数据");
        }
    }
}
