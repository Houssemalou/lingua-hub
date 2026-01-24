package com.lingua.hub.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationDTO {
    private UUID id;
    private UUID sessionId;
    private String sessionName;
    private UUID studentId;
    private String studentName;
    private UUID professorId;
    private String professorName;
    private EvaluationCriteriaDTO criteria;
    private Integer overallScore;
    private String feedback;
    private List<String> strengths;
    private List<String> areasToImprove;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
