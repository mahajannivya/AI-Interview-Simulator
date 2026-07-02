package com.interview.simulator.dto.response;

import lombok.Data;

@Data
public class EvaluationResponse {
    private Long evaluationId;
    private Long questionId;
    private String questionText;
    private String answerText;
    private int score;
    private String strengths;
    private String weaknesses;
    private String suggestions;
}
