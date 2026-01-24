package com.lingua.hub.dto.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateQuizRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
    
    @NotEmpty(message = "At least one question is required")
    @Valid
    private List<CreateQuizQuestionRequest> questions;
    
    private Integer timeLimit;
    
    private Integer passingScore = 60;
}
