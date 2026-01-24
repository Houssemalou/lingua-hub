package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.entity.SessionSummary;
import com.lingua.hub.service.SessionSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Session Summaries", description = "Gestion des résumés de session générés par IA")
@SecurityRequirement(name = "bearerAuth")
public class SessionSummaryController {

    @Autowired
    private SessionSummaryService summaryService;

    @PostMapping("/{sessionId}/summary")
    @Operation(
        summary = "Enregistrer un résumé de session",
        description = "Appelé par le service Python pour sauvegarder le résumé généré par OpenAI Realtime"
    )
    public ResponseEntity<ApiResponse<SessionSummary>> saveSummary(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> summaryData
    ) {
        SessionSummary summary = summaryService.saveSummary(sessionId, summaryData);
        return ResponseEntity.ok(ApiResponse.success("Summary saved successfully", summary));
    }

    @GetMapping("/{sessionId}/summary")
    @Operation(
        summary = "Récupérer le résumé d'une session",
        description = "Obtenir le résumé généré automatiquement à la fin de la session"
    )
    public ResponseEntity<ApiResponse<SessionSummary>> getSummary(@PathVariable UUID sessionId) {
        SessionSummary summary = summaryService.getSummaryBySessionId(sessionId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
