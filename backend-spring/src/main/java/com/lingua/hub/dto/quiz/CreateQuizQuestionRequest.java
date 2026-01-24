package com.lingua.hub.dto.quiz;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateQuizQuestionRequest {
    
    @NotBlank(message = "Question is required")
    private String question;
    
    @NotEmpty(message = "Options are required")
    private List<String> options;
    
    @NotNull(message = "Correct answer is required")
    @Min(value = 0, message = "Correct answer index must be 0 or greater")
    private Integer correctAnswer;
    
    private Integer points = 1;
}
