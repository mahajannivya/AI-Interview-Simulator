package com.interview.simulator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    @NotNull
    private Long questionId;

    @NotBlank
    private String answerText;
}
