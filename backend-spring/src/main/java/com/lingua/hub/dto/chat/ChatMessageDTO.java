package com.lingua.hub.dto.chat;

import com.lingua.hub.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private UUID id;
    private UUID sessionId;
    private UUID senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private ChatMessage.MessageType messageType;
    private Boolean isEdited;
    private UUID replyTo;
    private List<MessageAttachmentDTO> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
