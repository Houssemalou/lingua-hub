package com.lingua.hub.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;
    
    @Type(JsonType.class)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> options;
    
    @Column(name = "correct_answer", nullable = false)
    private Integer correctAnswer;
    
    @Column
    private Integer points = 1;
    
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
