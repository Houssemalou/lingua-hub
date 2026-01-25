package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.dto.common.PageResponse;
import com.lingua.hub.dto.evaluation.*;
import com.lingua.hub.service.EvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/evaluations")
@Tag(name = "Evaluations", description = "Gestion des évaluations d'étudiants")
@SecurityRequirement(name = "bearerAuth")
public class EvaluationController {

    @Autowired
    private EvaluationService evaluationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Créer une évaluation", description = "Crée une évaluation pour un étudiant après une session")
    public ResponseEntity<ApiResponse<EvaluationDTO>> createEvaluation(
            @Valid @RequestBody CreateEvaluationRequest request,
            @Parameter(hidden = true) @RequestAttribute("userId") UUID userId
    ) {
        EvaluationDTO evaluation = evaluationService.createEvaluation(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Evaluation created successfully", evaluation));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Modifier une évaluation", description = "Met à jour les critères et commentaires d'une évaluation")
    public ResponseEntity<ApiResponse<EvaluationDTO>> updateEvaluation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEvaluationRequest request
    ) {
        EvaluationDTO evaluation = evaluationService.updateEvaluation(id, request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation updated successfully", evaluation));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une évaluation", description = "Supprime une évaluation")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable UUID id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.ok(ApiResponse.success("Evaluation deleted successfully", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détails d'une évaluation", description = "Récupère les informations détaillées d'une évaluation")
    public ResponseEntity<ApiResponse<EvaluationDTO>> getEvaluationById(@PathVariable UUID id) {
        EvaluationDTO evaluation = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(ApiResponse.success(evaluation));
    }

    @GetMapping
    @Operation(summary = "Liste des évaluations", description = "Récupère la liste des évaluations avec filtres")
    public ResponseEntity<ApiResponse<PageResponse<EvaluationDTO>>> getEvaluations(
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID professorId,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate,
            @RequestParam(required = false) Double minScore,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "evaluatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {
        Page<EvaluationDTO> evaluations = evaluationService.getEvaluations(
                sessionId, studentId, professorId, fromDate, toDate,
                minScore, page, size, sortBy, sortOrder
        );

        PageResponse<EvaluationDTO> response = PageResponse.<EvaluationDTO>builder()
                .data(evaluations.getContent())
                .total(evaluations.getTotalElements())
                .page(page)
                .limit(size)
                .totalPages(evaluations.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Évaluations d'un étudiant", description = "Récupère toutes les évaluations d'un étudiant")
    public ResponseEntity<ApiResponse<List<EvaluationDTO>>> getStudentEvaluations(
            @PathVariable UUID studentId
    ) {
        List<EvaluationDTO> evaluations = evaluationService.getStudentEvaluations(studentId);
        return ResponseEntity.ok(ApiResponse.success(evaluations));
    }

    @GetMapping("/student/{studentId}/statistics")
    @Operation(
        summary = "Statistiques d'un étudiant",
        description = "Récupère les statistiques de progression d'un étudiant (moyennes, évolution, etc.)"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentStatistics(
            @PathVariable UUID studentId
    ) {
        Map<String, Object> statistics = evaluationService.getStudentStatistics(studentId);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }
}
