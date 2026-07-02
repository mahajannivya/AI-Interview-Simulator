package com.interview.simulator.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private Long id;
    private String categoryName;
    private String status;
    private int totalQuestions;
    private Double avgScore;
    private String customTopic;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
