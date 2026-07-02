package com.interview.simulator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    private String fullName;
    private java.util.List<String> roles;

    public AuthResponse(String token, String username, String email,
                        String fullName, java.util.List<String> roles) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
    }
}
