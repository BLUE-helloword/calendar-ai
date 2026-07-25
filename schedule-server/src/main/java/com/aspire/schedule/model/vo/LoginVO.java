package com.aspire.schedule.model.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginVO {

    private String token;
    private String username;
    private String nickname;
}
