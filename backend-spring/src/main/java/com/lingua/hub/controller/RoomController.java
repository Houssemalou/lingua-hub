package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.dto.common.PageResponse;
import com.lingua.hub.dto.room.*;
import com.lingua.hub.entity.Room;
import com.lingua.hub.entity.Student;
import com.lingua.hub.service.RoomService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Rooms", description = "Gestion des sessions/salles de cours")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Créer une nouvelle room", description = "Crée une session de cours avec LiveKit")
    public ResponseEntity<ApiResponse<RoomDTO>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @Parameter(hidden = true) @RequestAttribute("userId") UUID userId
    ) {
        RoomDTO room = roomService.createRoom(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Room created successfully", room));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Modifier une room", description = "Met à jour les informations d'une session")
    public ResponseEntity<ApiResponse<RoomDTO>> updateRoom(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoomRequest request
    ) {
        RoomDTO room = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated successfully", room));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Supprimer une room", description = "Supprime une session et sa room LiveKit")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable UUID id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détails d'une room", description = "Récupère les informations détaillées d'une session")
    public ResponseEntity<ApiResponse<RoomDTO>> getRoomById(@PathVariable UUID id) {
        RoomDTO room = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @GetMapping
    @Operation(summary = "Liste des rooms", description = "Récupère la liste des sessions avec filtres")
    public ResponseEntity<ApiResponse<PageResponse<RoomDTO>>> getRooms(
            @RequestParam(required = false) Room.RoomStatus status,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Student.LanguageLevel level,
            @RequestParam(required = false) UUID professorId,
            @RequestParam(required = false) Room.AnimatorType animatorType,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        Page<RoomDTO> rooms = roomService.getRooms(
                status, language, level, professorId, animatorType,
                fromDate, toDate, search, page, size, sortBy, sortOrder
        );

        PageResponse<RoomDTO> response = PageResponse.<RoomDTO>builder()
                .data(rooms.getContent())
                .total(rooms.getTotalElements())
                .page(page)
                .limit(size)
                .totalPages(rooms.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Démarrer une session", description = "Passe la room en mode LIVE")
    public ResponseEntity<ApiResponse<Void>> startRoom(@PathVariable UUID id) {
        roomService.startRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room started", null));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(summary = "Terminer une session", description = "Termine la session et déclenche la génération du résumé")
    public ResponseEntity<ApiResponse<Void>> endRoom(@PathVariable UUID id) {
        roomService.endRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room ended, summary will be generated", null));
    }

    @GetMapping("/{id}/participants")
    @Operation(summary = "Liste des participants", description = "Récupère tous les participants d'une room")
    public ResponseEntity<ApiResponse<List<ParticipantDTO>>> getRoomParticipants(@PathVariable UUID id) {
        List<ParticipantDTO> participants = roomService.getRoomParticipants(id);
        return ResponseEntity.ok(ApiResponse.success(participants));
    }

    @PostMapping("/participants/mute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(
        summary = "Muter/Démuter un participant",
        description = "Permet au professeur de couper le micro d'un étudiant"
    )
    public ResponseEntity<ApiResponse<ParticipantDTO>> muteParticipant(
            @Valid @RequestBody ParticipantActionRequest request
    ) {
        ParticipantDTO participant = roomService.muteParticipant(request);
        return ResponseEntity.ok(ApiResponse.success("Participant mute status updated", participant));
    }

    @PostMapping("/participants/ping")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @Operation(
        summary = "Pinger un participant",
        description = "Envoie une notification d'attention à un étudiant"
    )
    public ResponseEntity<ApiResponse<ParticipantDTO>> pingParticipant(
            @Valid @RequestBody ParticipantActionRequest request
    ) {
        ParticipantDTO participant = roomService.pingParticipant(request);
        return ResponseEntity.ok(ApiResponse.success("Participant pinged successfully", participant));
    }

    @DeleteMapping("/participants/ping")
    @Operation(summary = "Effacer le ping", description = "L'étudiant acquitte le ping")
    public ResponseEntity<ApiResponse<Void>> clearPing(
            @RequestParam UUID roomId,
            @RequestParam UUID studentId
    ) {
        roomService.clearPing(roomId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Ping cleared", null));
    }
}
