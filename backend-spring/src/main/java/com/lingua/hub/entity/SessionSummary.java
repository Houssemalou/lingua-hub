package com.lingua.hub.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "session_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionSummary {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private Room session;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;
    
    @Type(JsonType.class)
    @Column(name = "key_topics", columnDefinition = "jsonb")
    private List<String> keyTopics;
    
    @Type(JsonType.class)
    @Column(name = "vocabulary_covered", columnDefinition = "jsonb")
    private List<String> vocabularyCovered;
    
    @Type(JsonType.class)
    @Column(name = "grammar_points", columnDefinition = "jsonb")
    private List<String> grammarPoints;
    
    @Type(JsonType.class)
    @Column(name = "student_highlights", columnDefinition = "jsonb")
    private Map<String, Object> studentHighlights;
    
    @Column(name = "generated_by")
    private String generatedBy = "openai_realtime";
    
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;
    
    @Column(name = "audio_transcript", columnDefinition = "TEXT")
    private String audioTranscript;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
}
