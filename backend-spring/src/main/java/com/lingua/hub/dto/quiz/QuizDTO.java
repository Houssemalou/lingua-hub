package com.lingua.hub.dto.quiz;

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
public class QuizDTO {
    private UUID id;
    private String title;
    private String description;
    private UUID sessionId;
    private String sessionName;
    private String language;
    private UUID createdBy;
    private String createdByName;
    private Boolean isPublished;
    private Integer timeLimit;
    private Integer passingScore;
    private List<QuizQuestionDTO> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
