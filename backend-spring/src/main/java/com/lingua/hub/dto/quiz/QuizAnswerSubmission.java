package com.lingua.hub.dto.quiz;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class QuizAnswerSubmission {
    
    @NotNull(message = "Question ID is required")
    private UUID questionId;
    
    @NotNull(message = "Selected answer is required")
    private Integer selectedAnswer;
}
