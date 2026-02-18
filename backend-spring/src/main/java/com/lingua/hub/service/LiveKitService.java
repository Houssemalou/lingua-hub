package com.lingua.hub.service;

import com.lingua.hub.config.LiveKitConfig;
import com.lingua.hub.dto.livekit.LiveKitTokenResponse;
import com.lingua.hub.entity.LiveKitToken;
import com.lingua.hub.entity.Room;
import com.lingua.hub.entity.User;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.LiveKitTokenRepository;
import com.lingua.hub.repository.RoomRepository;
import com.lingua.hub.repository.UserRepository;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomServiceClient;
import io.livekit.server.WebhookReceiver;
import livekit.LivekitModels;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class LiveKitService {

    @Autowired
    private LiveKitConfig livekitConfig;

    @Autowired
    private RoomServiceClient roomServiceClient;

    @Autowired
    private LiveKitTokenRepository liveKitTokenRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${livekit.token-expiration}")
    private long tokenExpiration;

    /**
     * Generate LiveKit access token for a user to join a room
     */
    @Transactional
    public LiveKitTokenResponse generateToken(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create unique LiveKit room name if not exists
        if (room.getLivekitRoomName() == null) {
            room.setLivekitRoomName("room-" + room.getId().toString());
            roomRepository.save(room);
        }

        // Create access token
        String identity = user.getEmail();
        AccessToken token = new AccessToken(
                livekitConfig.getApiKey(),
                livekitConfig.getApiSecret()
        );

        token.setName(user.getName());
        token.setIdentity(identity);
        token.addGrants(new AccessToken.VideoGrant()
                .setRoomJoin(true)
                .setRoom(room.getLivekitRoomName())
                .setCanPublish(true)
                .setCanPublishData(true)
                .setCanSubscribe(true)
        );

        // Set token expiration
        token.setTtl(tokenExpiration);

        String jwt = token.toJwt();

        // Save token to database
        LocalDateTime expiresAt = LocalDateTime.now().plus(tokenExpiration, ChronoUnit.SECONDS);
        LiveKitToken liveKitToken = LiveKitToken.builder()
                .user(user)
                .room(room)
                .token(jwt)
                .identity(identity)
                .expiresAt(expiresAt)
                .build();

        liveKitTokenRepository.save(liveKitToken);

        return LiveKitTokenResponse.builder()
                .token(jwt)
                .identity(identity)
                .roomName(room.getLivekitRoomName())
                .serverUrl(livekitConfig.getLivekitUrl())
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * Create a LiveKit room
     */
    public CompletableFuture<LivekitModels.Room> createLiveKitRoom(String roomName, int maxParticipants) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return roomServiceClient.createRoom(roomName).execute().body();
            } catch (Exception e) {
                throw new RuntimeException("Failed to create LiveKit room", e);
            }
        });
    }

    /**
     * Delete a LiveKit room
     */
    public CompletableFuture<Void> deleteLiveKitRoom(String roomName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                roomServiceClient.deleteRoom(roomName).execute();
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete LiveKit room", e);
            }
        });
    }

    /**
     * List all active LiveKit rooms
     */
    public CompletableFuture<List<LivekitModels.Room>> listRooms() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return roomServiceClient.listRooms(List.of()).execute().body();
            } catch (Exception e) {
                throw new RuntimeException("Failed to list LiveKit rooms", e);
            }
        });
    }

    /**
     * Get LiveKit room info
     */
    public CompletableFuture<LivekitModels.Room> getRoomInfo(String roomName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                List<LivekitModels.Room> rooms = roomServiceClient.listRooms(List.of(roomName)).execute().body();
                return (rooms != null && !rooms.isEmpty()) ? rooms.get(0) : null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get LiveKit room info", e);
            }
        });
    }

    /**
     * List participants in a LiveKit room
     */
    public CompletableFuture<List<LivekitModels.ParticipantInfo>> listParticipants(String roomName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return roomServiceClient.listParticipants(roomName).execute().body();
            } catch (Exception e) {
                throw new RuntimeException("Failed to list participants", e);
            }
        });
    }

    /**
     * Remove participant from room
     */
    public CompletableFuture<Void> removeParticipant(String roomName, String identity) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                roomServiceClient.removeParticipant(roomName, identity).execute();
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove participant", e);
            }
        });
    }

    /**
     * Mute/Unmute participant
     */
    public CompletableFuture<LivekitModels.TrackInfo> muteParticipantTrack(
            String roomName,
            String identity,
            String trackSid,
            boolean muted
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return roomServiceClient.mutePublishedTrack(roomName, identity, trackSid, muted).execute().body();
            } catch (Exception e) {
                throw new RuntimeException("Failed to mute/unmute track", e);
            }
        });
    }

    /**
     * Clean up expired tokens (runs every hour)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanUpExpiredTokens() {
        liveKitTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    /**
     * Validate webhook signature
     */
    public boolean validateWebhook(String token, String body) {
        WebhookReceiver receiver = new WebhookReceiver(
                livekitConfig.getApiKey(),
                livekitConfig.getApiSecret()
        );
        try {
            receiver.receive(body, token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
