package com.lingua.hub.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriteriaDTO {
    private Integer pronunciation;
    private Integer grammar;
    private Integer vocabulary;
    private Integer fluency;
    private Integer participation;
    private Integer comprehension;
}
