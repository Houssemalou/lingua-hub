package com.lingua.hub.service;

import com.lingua.hub.dto.evaluation.*;
import com.lingua.hub.entity.*;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EvaluationService {

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Transactional
    public EvaluationDTO createEvaluation(CreateEvaluationRequest request, UUID professorId) {
        Room room = roomRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));

        // Extract individual criteria from the map
        Map<String, Integer> criteria = request.getCriteria();
        Integer pronunciation = criteria.getOrDefault("pronunciation", 0);
        Integer grammar = criteria.getOrDefault("grammar", 0);
        Integer vocabulary = criteria.getOrDefault("vocabulary", 0);
        Integer fluency = criteria.getOrDefault("fluency", 0);
        Integer participation = criteria.getOrDefault("participation", 0);
        Integer comprehension = criteria.getOrDefault("comprehension", 0);

        // Calculate overall score
        double overallScore = criteria.values().stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        Evaluation evaluation = Evaluation.builder()
                .session(room)
                .student(student)
                .professor(professor)
                .pronunciation(pronunciation)
                .grammar(grammar)
                .vocabulary(vocabulary)
                .fluency(fluency)
                .participation(participation)
                .comprehension(comprehension)
                .overallScore((int) Math.round(overallScore))
                .feedback(request.getFeedback())
                .strengths(request.getStrengths())
                .areasToImprove(request.getAreasToImprove())
                .createdAt(LocalDateTime.now())
                .build();

        evaluation = evaluationRepository.save(evaluation);
        return mapToDTO(evaluation);
    }

    @Transactional
    public EvaluationDTO updateEvaluation(UUID evaluationId, UpdateEvaluationRequest request) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));

        if (request.getCriteria() != null) {
            Map<String, Integer> criteria = request.getCriteria();
            if (criteria.containsKey("pronunciation")) evaluation.setPronunciation(criteria.get("pronunciation"));
            if (criteria.containsKey("grammar")) evaluation.setGrammar(criteria.get("grammar"));
            if (criteria.containsKey("vocabulary")) evaluation.setVocabulary(criteria.get("vocabulary"));
            if (criteria.containsKey("fluency")) evaluation.setFluency(criteria.get("fluency"));
            if (criteria.containsKey("participation")) evaluation.setParticipation(criteria.get("participation"));
            if (criteria.containsKey("comprehension")) evaluation.setComprehension(criteria.get("comprehension"));

            // Recalculate overall score
            double overallScore = criteria.values().stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(evaluation.getOverallScore().doubleValue());
            evaluation.setOverallScore((int) Math.round(overallScore));
        }

        if (request.getFeedback() != null) evaluation.setFeedback(request.getFeedback());
        if (request.getStrengths() != null) evaluation.setStrengths(request.getStrengths());
        if (request.getAreasToImprove() != null) evaluation.setAreasToImprove(request.getAreasToImprove());

        evaluation = evaluationRepository.save(evaluation);
        return mapToDTO(evaluation);
    }

    @Transactional
    public void deleteEvaluation(UUID evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        evaluationRepository.delete(evaluation);
    }

    public EvaluationDTO getEvaluationById(UUID evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        return mapToDTO(evaluation);
    }

    public Page<EvaluationDTO> getEvaluations(
            UUID sessionId,
            UUID studentId,
            UUID professorId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Double minScore,
            int page,
            int size,
            String sortBy,
            String sortOrder
    ) {
        Sort sort = sortOrder.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Evaluation> evaluations = evaluationRepository.findByFilters(
                sessionId, studentId, professorId, fromDate, toDate, minScore, pageable
        );

        return evaluations.map(this::mapToDTO);
    }

    public List<EvaluationDTO> getStudentEvaluations(UUID studentId) {
        List<Evaluation> evaluations = evaluationRepository.findByStudentId(studentId);
        return evaluations.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStudentStatistics(UUID studentId) {
        List<Evaluation> evaluations = evaluationRepository.findByStudentId(studentId);

        if (evaluations.isEmpty()) {
            return Map.of(
                "totalEvaluations", 0,
                "averageScore", 0.0,
                "progress", List.of()
            );
        }

        double averageScore = evaluations.stream()
                .mapToDouble(Evaluation::getOverallScore)
                .average()
                .orElse(0.0);

        List<Map<String, Object>> progress = evaluations.stream()
                .sorted((e1, e2) -> e1.getCreatedAt().compareTo(e2.getCreatedAt()))
                .map(e -> Map.<String, Object>of(
                    "date", e.getCreatedAt(),
                    "score", e.getOverallScore(),
                    "sessionName", e.getSession().getName()
                ))
                .collect(Collectors.toList());

        // Calculate criteria averages from individual fields
        Map<String, Double> criteriaAverages = new LinkedHashMap<>();
        criteriaAverages.put("pronunciation", evaluations.stream().mapToInt(e -> e.getPronunciation() != null ? e.getPronunciation() : 0).average().orElse(0));
        criteriaAverages.put("grammar", evaluations.stream().mapToInt(e -> e.getGrammar() != null ? e.getGrammar() : 0).average().orElse(0));
        criteriaAverages.put("vocabulary", evaluations.stream().mapToInt(e -> e.getVocabulary() != null ? e.getVocabulary() : 0).average().orElse(0));
        criteriaAverages.put("fluency", evaluations.stream().mapToInt(e -> e.getFluency() != null ? e.getFluency() : 0).average().orElse(0));
        criteriaAverages.put("participation", evaluations.stream().mapToInt(e -> e.getParticipation() != null ? e.getParticipation() : 0).average().orElse(0));
        criteriaAverages.put("comprehension", evaluations.stream().mapToInt(e -> e.getComprehension() != null ? e.getComprehension() : 0).average().orElse(0));

        return Map.of(
            "totalEvaluations", evaluations.size(),
            "averageScore", Math.round(averageScore * 100.0) / 100.0,
            "progress", progress,
            "criteriaAverages", criteriaAverages
        );
    }

    private Map<String, Integer> buildCriteriaMap(Evaluation evaluation) {
        Map<String, Integer> criteria = new LinkedHashMap<>();
        if (evaluation.getPronunciation() != null) criteria.put("pronunciation", evaluation.getPronunciation());
        if (evaluation.getGrammar() != null) criteria.put("grammar", evaluation.getGrammar());
        if (evaluation.getVocabulary() != null) criteria.put("vocabulary", evaluation.getVocabulary());
        if (evaluation.getFluency() != null) criteria.put("fluency", evaluation.getFluency());
        if (evaluation.getParticipation() != null) criteria.put("participation", evaluation.getParticipation());
        if (evaluation.getComprehension() != null) criteria.put("comprehension", evaluation.getComprehension());
        return criteria;
    }

    private EvaluationDTO mapToDTO(Evaluation evaluation) {
        EvaluationCriteriaDTO criteriaDTO = EvaluationCriteriaDTO.builder()
                .pronunciation(evaluation.getPronunciation())
                .grammar(evaluation.getGrammar())
                .vocabulary(evaluation.getVocabulary())
                .fluency(evaluation.getFluency())
                .participation(evaluation.getParticipation())
                .comprehension(evaluation.getComprehension())
                .build();

        return EvaluationDTO.builder()
                .id(evaluation.getId())
                .sessionId(evaluation.getSession().getId())
                .sessionName(evaluation.getSession().getName())
                .studentId(evaluation.getStudent().getId())
                .studentName(evaluation.getStudent().getUser().getName())
                .professorId(evaluation.getProfessor().getId())
                .professorName(evaluation.getProfessor().getUser().getName())
                .criteria(List.of(criteriaDTO))
                .overallScore(evaluation.getOverallScore())
                .feedback(evaluation.getFeedback())
                .strengths(evaluation.getStrengths())
                .areasToImprove(evaluation.getAreasToImprove())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
