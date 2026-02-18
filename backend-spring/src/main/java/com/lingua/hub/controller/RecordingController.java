package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.dto.SessionRecordingDTO;
import com.lingua.hub.service.RecordingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST Controller for session recordings
 */
@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
@Tag(name = "Recordings", description = "Session recording management with MinIO storage")
public class RecordingController {
    
    private final RecordingService recordingService;
    
    /**
     * Start a new recording (called by LiveKit or backend)
     */
    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @Operation(summary = "Start recording", description = "Initialize a new session recording")
    public ResponseEntity<ApiResponse<SessionRecordingDTO>> startRecording(
            @Parameter(description = "Room ID") @RequestParam UUID roomId,
            @Parameter(description = "LiveKit recording ID") @RequestParam String livekitRecordingId) {
        try {
            SessionRecordingDTO recording = recordingService.startRecording(roomId, livekitRecordingId);
            return ResponseEntity.ok(ApiResponse.success(recording));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Upload recording file to MinIO (called by Python service or manual upload)
     */
    @PostMapping("/upload")
    @Operation(summary = "Upload recording", description = "Upload recording file to MinIO storage")
    public ResponseEntity<ApiResponse<SessionRecordingDTO>> uploadRecording(
            @Parameter(description = "LiveKit recording ID") @RequestParam String livekitRecordingId,
            @Parameter(description = "Recording file") @RequestParam("file") MultipartFile file,
            @Parameter(description = "Duration in seconds") @RequestParam(required = false) Integer durationSeconds) {
        try {
            SessionRecordingDTO recording = recordingService.uploadRecordingFile(livekitRecordingId, file);
            return ResponseEntity.ok(ApiResponse.success(recording));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get recording by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PROFESSOR', 'ADMIN')")
    @Operation(summary = "Get recording", description = "Get recording details with playback URL")
    public ResponseEntity<ApiResponse<SessionRecordingDTO>> getRecording(
            @Parameter(description = "Recording ID") @PathVariable Long id) {
        try {
            SessionRecordingDTO recording = recordingService.getRecording(id);
            return ResponseEntity.ok(ApiResponse.success(recording));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get all recordings for a specific room
     */
    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @Operation(summary = "Get room recordings", description = "Get all recordings for a specific room")
    public ResponseEntity<ApiResponse<List<SessionRecordingDTO>>> getRoomRecordings(
            @Parameter(description = "Room ID") @PathVariable Long roomId) {
        try {
            List<SessionRecordingDTO> recordings = recordingService.getRoomRecordings(roomId);
            return ResponseEntity.ok(ApiResponse.success(recordings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get all recordings for a student (rooms they participated in)
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @Operation(summary = "Get student recordings", description = "Get all recordings for rooms where student participated")
    public ResponseEntity<ApiResponse<List<SessionRecordingDTO>>> getStudentRecordings(
            @Parameter(description = "Student ID") @PathVariable Long studentId) {
        try {
            List<SessionRecordingDTO> recordings = recordingService.getStudentRecordings(studentId);
            return ResponseEntity.ok(ApiResponse.success(recordings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get all completed recordings (admin only, paginated)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all recordings", description = "Get all completed recordings (admin only)")
    public ResponseEntity<ApiResponse<Page<SessionRecordingDTO>>> getAllRecordings(
            @Parameter(description = "Pagination parameters") Pageable pageable) {
        try {
            Page<SessionRecordingDTO> recordings = recordingService.getAllCompletedRecordings(pageable);
            return ResponseEntity.ok(ApiResponse.success(recordings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Delete recording
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete recording", description = "Delete recording from MinIO and database (admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteRecording(
            @Parameter(description = "Recording ID") @PathVariable Long id) {
        try {
            recordingService.deleteRecording(id);
            return ResponseEntity.ok(ApiResponse.success("Recording deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Generate playback URL for recording (for direct URL requests)
     */
    @GetMapping("/{id}/playback-url")
    @PreAuthorize("hasAnyRole('STUDENT', 'PROFESSOR', 'ADMIN')")
    @Operation(summary = "Get playback URL", description = "Generate pre-signed URL for viewing recording")
    public ResponseEntity<ApiResponse<String>> getPlaybackUrl(
            @Parameter(description = "Recording ID") @PathVariable Long id) {
        try {
            SessionRecordingDTO recording = recordingService.getRecording(id);
            return ResponseEntity.ok(ApiResponse.success(recording.getPlaybackUrl()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
