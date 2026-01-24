package com.lingua.hub.controller;

import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.dto.room.RoomDTO;
import com.lingua.hub.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms/livekit")
@Tag(name = "LiveKit Rooms", description = "Endpoints internes pour le service Python")
public class LiveKitRoomController {

    @Autowired
    private RoomService roomService;

    @GetMapping("/{livekitRoomName}")
    @Operation(
        summary = "Obtenir les infos d'une room par nom LiveKit",
        description = "Utilisé par le service Python pour récupérer les informations de la session",
        security = {}
    )
    public ResponseEntity<ApiResponse<RoomDTO>> getRoomByLivekitName(
            @PathVariable String livekitRoomName
    ) {
        RoomDTO room = roomService.getRoomByLivekitName(livekitRoomName);
        return ResponseEntity.ok(ApiResponse.success(room));
    }
}
