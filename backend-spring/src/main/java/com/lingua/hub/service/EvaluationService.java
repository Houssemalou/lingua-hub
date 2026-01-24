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

        // Calculate overall score
        Map<String, Integer> criteria = request.getCriteria();
        double overallScore = criteria.values().stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        Evaluation evaluation = Evaluation.builder()
                .session(room)
                .student(student)
                .professor(professor)
                .criteria(criteria)
                .overallScore(overallScore)
                .comments(request.getComments())
                .strengths(request.getStrengths())
                .improvements(request.getImprovements())
                .evaluatedAt(LocalDateTime.now())
                .build();

        evaluation = evaluationRepository.save(evaluation);
        return mapToDTO(evaluation);
    }

    @Transactional
    public EvaluationDTO updateEvaluation(UUID evaluationId, UpdateEvaluationRequest request) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));

        if (request.getCriteria() != null) {
            evaluation.setCriteria(request.getCriteria());
            // Recalculate overall score
            double overallScore = request.getCriteria().values().stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(evaluation.getOverallScore());
            evaluation.setOverallScore(overallScore);
        }
        
        if (request.getComments() != null) evaluation.setComments(request.getComments());
        if (request.getStrengths() != null) evaluation.setStrengths(request.getStrengths());
        if (request.getImprovements() != null) evaluation.setImprovements(request.getImprovements());

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
                .sorted((e1, e2) -> e1.getEvaluatedAt().compareTo(e2.getEvaluatedAt()))
                .map(e -> Map.<String, Object>of(
                    "date", e.getEvaluatedAt(),
                    "score", e.getOverallScore(),
                    "sessionName", e.getSession().getName()
                ))
                .collect(Collectors.toList());

        // Calculate criteria averages
        Map<String, Double> criteriaAverages = evaluations.stream()
                .flatMap(e -> e.getCriteria().entrySet().stream())
                .collect(Collectors.groupingBy(
                    Map.Entry::getKey,
                    Collectors.averagingDouble(e -> e.getValue().doubleValue())
                ));

        return Map.of(
            "totalEvaluations", evaluations.size(),
            "averageScore", Math.round(averageScore * 100.0) / 100.0,
            "progress", progress,
            "criteriaAverages", criteriaAverages
        );
    }

    private EvaluationDTO mapToDTO(Evaluation evaluation) {
        List<EvaluationCriteriaDTO> criteria = evaluation.getCriteria().entrySet().stream()
                .map(e -> EvaluationCriteriaDTO.builder()
                        .name(e.getKey())
                        .score(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return EvaluationDTO.builder()
                .id(evaluation.getId())
                .sessionId(evaluation.getSession().getId())
                .sessionName(evaluation.getSession().getName())
                .studentId(evaluation.getStudent().getId())
                .studentName(evaluation.getStudent().getUser().getName())
                .professorId(evaluation.getProfessor().getId())
                .professorName(evaluation.getProfessor().getUser().getName())
                .criteria(criteria)
                .overallScore(evaluation.getOverallScore())
                .comments(evaluation.getComments())
                .strengths(evaluation.getStrengths())
                .improvements(evaluation.getImprovements())
                .evaluatedAt(evaluation.getEvaluatedAt())
                .build();
    }
}
