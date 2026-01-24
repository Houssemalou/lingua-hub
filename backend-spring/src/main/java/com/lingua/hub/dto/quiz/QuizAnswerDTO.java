package com.lingua.hub.dto.quiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerDTO {
    private UUID questionId;
    private String question;
    private Integer selectedAnswer;
    private Integer correctAnswer;
    private Boolean isCorrect;
}
