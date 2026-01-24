package com.lingua.hub.dto.chat;

import com.lingua.hub.entity.MessageAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachmentDTO {
    private UUID id;
    private MessageAttachment.AttachmentType attachmentType;
    private String url;
    private String name;
    private Long size;
}
