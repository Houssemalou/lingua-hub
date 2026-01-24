package com.lingua.hub.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "evaluations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"session_id", "student_id"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evaluation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Room session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professor_id")
    private Professor professor;
    
    @Column
    private Integer pronunciation;
    
    @Column
    private Integer grammar;
    
    @Column
    private Integer vocabulary;
    
    @Column
    private Integer fluency;
    
    @Column
    private Integer participation;
    
    @Column
    private Integer comprehension;
    
    @Column(name = "overall_score")
    private Integer overallScore;
    
    @Column(columnDefinition = "TEXT")
    private String feedback;
    
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> strengths;
    
    @Type(JsonType.class)
    @Column(name = "areas_to_improve", columnDefinition = "jsonb")
    private List<String> areasToImprove;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
