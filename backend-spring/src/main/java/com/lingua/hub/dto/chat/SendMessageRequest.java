package com.lingua.hub.dto.chat;

import com.lingua.hub.entity.ChatMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {
    
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private ChatMessage.MessageType messageType = ChatMessage.MessageType.TEXT;
    
    private UUID replyTo;
}
