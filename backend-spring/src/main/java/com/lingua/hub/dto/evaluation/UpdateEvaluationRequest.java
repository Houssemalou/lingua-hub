package com.lingua.hub.dto.evaluation;

import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class UpdateEvaluationRequest {

    private UUID sessionId;

    private UUID studentId;

    @Valid
    private Map<String, Integer> criteria;

    private String feedback;

    private List<String> strengths;

    private List<String> areasToImprove;
}
