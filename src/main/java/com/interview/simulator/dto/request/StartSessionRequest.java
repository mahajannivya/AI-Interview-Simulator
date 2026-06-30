package com.interview.simulator.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class
StartSessionRequest {
    @NotNull
    private Long categoryId;

    private String customTopic;
}
