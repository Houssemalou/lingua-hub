package com.lingua.hub.dto;

import com.lingua.hub.entity.SessionRecording.RecordingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for SessionRecording
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionRecordingDTO {
    private Long id;
    private Long roomId;
    private String roomName;
    private String livekitRecordingId;
    private String fileName;
    private Integer durationSeconds;
    private Long fileSizeBytes;
    private String format;
    private RecordingStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private String playbackUrl; // Pre-signed URL for viewing
}
