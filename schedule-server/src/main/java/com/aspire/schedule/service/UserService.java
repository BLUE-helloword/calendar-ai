package com.aspire.schedule.service;

import com.aspire.schedule.repository.entity.User;
import com.aspire.schedule.repository.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public User findByUsername(String username) {
        return userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, username)
                        .eq(User::getStatus, 1));
    }

    public User findById(Long id) {
        return userMapper.selectById(id);
    }
}
