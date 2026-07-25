package com.aspire.schedule.controller;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.LoginDTO;
import com.aspire.schedule.model.vo.LoginVO;
import com.aspire.schedule.repository.entity.User;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "认证管理")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public ApiResponse<LoginVO> login(@RequestBody @Valid LoginDTO dto) {
        User user = userService.findByUsername(dto.getUsername());
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return ApiResponse.fail(401, "用户名或密码错误");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());
        LoginVO vo = LoginVO.builder()
                .token(token)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .build();
        return ApiResponse.ok(vo);
    }
}
