package com.lingua.hub.dto.evaluation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateEvaluationRequest {
    
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
    
    @NotNull(message = "Student ID is required")
    private UUID studentId;
    
    @NotNull(message = "Criteria is required")
    @Valid
    private EvaluationCriteriaDTO criteria;
    
    @NotBlank(message = "Feedback is required")
    private String feedback;
    
    private List<String> strengths;
    
    private List<String> areasToImprove;
}
