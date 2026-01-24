package com.lingua.hub.dto.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SubmitQuizRequest {
    
    @NotNull(message = "Quiz ID is required")
    private UUID quizId;
    
    @NotEmpty(message = "Answers are required")
    @Valid
    private List<QuizAnswerSubmission> answers;
}
