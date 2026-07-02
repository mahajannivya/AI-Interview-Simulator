package com.interview.simulator.dto.response;

import lombok.Data;

@Data
public class QuestionResponse {
    private Long questionId;
    private Long sessionId;
    private String questionText;
    private int questionOrder;
    private String message;
    private boolean sessionComplete;
}
