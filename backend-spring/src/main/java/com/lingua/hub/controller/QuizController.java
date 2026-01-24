package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.dto.common.PageResponse;
import com.lingua.hub.dto.quiz.*;
import com.lingua.hub.entity.Student;
import com.lingua.hub.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
@Tag(name = "Quizzes", description = "Gestion des quiz et évaluations")
@SecurityRequirement(name = "bearerAuth")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Créer un quiz", description = "Crée un nouveau quiz pour une session")
    public ResponseEntity<ApiResponse<QuizDTO>> createQuiz(
            @Valid @RequestBody CreateQuizRequest request,
            @Parameter(hidden = true) @RequestAttribute("userId") UUID userId
    ) {
        // Note: userId should be mapped to professorId in a real implementation
        QuizDTO quiz = quizService.createQuiz(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Quiz created successfully", quiz));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Publier un quiz", description = "Rend un quiz disponible pour les étudiants")
    public ResponseEntity<ApiResponse<QuizDTO>> publishQuiz(@PathVariable UUID id) {
        QuizDTO quiz = quizService.publishQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz published successfully", quiz));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Soumettre un quiz", description = "L'étudiant soumet ses réponses au quiz")
    public ResponseEntity<ApiResponse<QuizResultDTO>> submitQuiz(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitQuizRequest request,
            @Parameter(hidden = true) @RequestAttribute("userId") UUID userId
    ) {
        QuizResultDTO result = quizService.submitQuiz(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détails d'un quiz", description = "Récupère les informations détaillées d'un quiz")
    public ResponseEntity<ApiResponse<QuizDTO>> getQuizById(@PathVariable UUID id) {
        QuizDTO quiz = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success(quiz));
    }

    @GetMapping
    @Operation(summary = "Liste des quiz", description = "Récupère la liste des quiz avec filtres")
    public ResponseEntity<ApiResponse<PageResponse<QuizDTO>>> getQuizzes(
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Student.LanguageLevel level,
            @RequestParam(required = false) Boolean isPublished,
            @RequestParam(required = false) UUID createdBy,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {
        Page<QuizDTO> quizzes = quizService.getQuizzes(
                sessionId, language, level, isPublished, createdBy,
                search, page, size, sortBy, sortOrder
        );

        PageResponse<QuizDTO> response = PageResponse.<QuizDTO>builder()
                .data(quizzes.getContent())
                .total(quizzes.getTotalElements())
                .page(page)
                .limit(size)
                .totalPages(quizzes.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Résultats d'un quiz", description = "Récupère tous les résultats d'un quiz")
    public ResponseEntity<ApiResponse<List<QuizResultDTO>>> getQuizResults(@PathVariable UUID id) {
        List<QuizResultDTO> results = quizService.getQuizResults(id);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/student/{studentId}/results")
    @Operation(summary = "Résultats d'un étudiant", description = "Récupère tous les résultats de quiz d'un étudiant")
    public ResponseEntity<ApiResponse<List<QuizResultDTO>>> getStudentQuizResults(
            @PathVariable UUID studentId
    ) {
        List<QuizResultDTO> results = quizService.getStudentQuizResults(studentId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Supprimer un quiz", description = "Supprime un quiz et tous ses résultats")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable UUID id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully", null));
    }
}
