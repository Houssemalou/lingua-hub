package com.lingua.hub.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingua.hub.entity.Room;
import com.lingua.hub.entity.SessionSummary;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.RoomRepository;
import com.lingua.hub.repository.SessionSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SessionSummaryService {

    @Autowired
    private SessionSummaryRepository summaryRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public SessionSummary saveSummary(String livekitRoomName, Map<String, Object> summaryData) {
        // Find room by LiveKit room name
        Room room = roomRepository.findByLivekitRoomName(livekitRoomName)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + livekitRoomName));

        // Check if summary already exists
        SessionSummary summary = summaryRepository.findBySessionId(room.getId())
                .orElse(SessionSummary.builder()
                        .session(room)
                        .build());

        // Extract data from map
        summary.setSummary((String) summaryData.getOrDefault("summary", ""));
        summary.setKeyTopics(castToList(summaryData.get("key_topics")));
        summary.setVocabularyCovered(castToList(summaryData.get("vocabulary_covered")));
        summary.setGrammarPoints(castToList(summaryData.get("grammar_points")));
        summary.setStudentHighlights(castToMap(summaryData.get("student_highlights")));
        summary.setAudioTranscript((String) summaryData.get("audio_transcript"));
        summary.setDurationMinutes((Integer) summaryData.get("duration_minutes"));
        summary.setGeneratedBy("openai_realtime");
        summary.setGeneratedAt(LocalDateTime.now());

        return summaryRepository.save(summary);
    }

    public SessionSummary getSummaryBySessionId(UUID sessionId) {
        return summaryRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Summary not found for session: " + sessionId));
    }

    @SuppressWarnings("unchecked")
    private List<String> castToList(Object obj) {
        if (obj instanceof List) {
            return (List<String>) obj;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castToMap(Object obj) {
        if (obj instanceof Map) {
            return (Map<String, Object>) obj;
        }
        return Map.of();
    }
}
