package com.aspire.schedule.config;

import com.aspire.schedule.repository.entity.User;
import com.aspire.schedule.repository.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 为 admin 和 demo 用户重置密码为 "123456" 的 BCrypt 哈希
        updatePassword("admin");
        updatePassword("demo");
    }

    private void updatePassword(String username) {
        User user = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                        .eq(User::getUsername, username));
        if (user != null) {
            String encoded = passwordEncoder.encode("123456");
            user.setPassword(encoded);
            userMapper.updateById(user);
            System.out.println(">>> 已重置用户 " + username + " 密码: " + encoded);
        }
    }
}
