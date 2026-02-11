package com.lingua.hub.service;

import com.lingua.hub.dto.livekit.LiveKitTokenResponse;
import com.lingua.hub.dto.room.*;
import com.lingua.hub.entity.*;
import com.lingua.hub.exception.BadRequestException;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomParticipantRepository participantRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ProfessorRepository professorRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LiveKitService liveKitService;
    
    @Value("${app.allow-early-join:true}")
    private boolean allowEarlyJoin;

    @Transactional
    public RoomDTO createRoom(CreateRoomRequest request, UUID creatorId) {
        Room room = Room.builder()
                .name(request.getName())
                .language(request.getLanguage())
                .level(request.getLevel())
                .objective(request.getObjective())
                .scheduledAt(request.getScheduledAt())
                .duration(request.getDuration())
                .maxStudents(request.getMaxStudents())
                .status(Room.RoomStatus.SCHEDULED)
                .animatorType(request.getAnimatorType())
                .build();

        // Set professor if provided
        if (request.getProfessorId() != null) {
            Professor professor = professorRepository.findById(request.getProfessorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));
            room.setProfessor(professor);
        }

        // Generate LiveKit room name
        room.setLivekitRoomName("room-" + UUID.randomUUID().toString());

        room = roomRepository.save(room);

        // Add invited students as participants
        if (request.getInvitedStudents() != null && !request.getInvitedStudents().isEmpty()) {
            for (UUID studentId : request.getInvitedStudents()) {
                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

                RoomParticipant participant = RoomParticipant.builder()
                        .room(room)
                        .student(student)
                        .invited(true)
                        .build();

                participantRepository.save(participant);
            }
        }

        // Create LiveKit room
        liveKitService.createLiveKitRoom(room.getLivekitRoomName(), room.getMaxStudents());

        return mapToDTO(room);
    }

    @Transactional
    public RoomDTO updateRoom(UUID roomId, UpdateRoomRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (request.getName() != null) room.setName(request.getName());
        if (request.getObjective() != null) room.setObjective(request.getObjective());
        if (request.getScheduledAt() != null) room.setScheduledAt(request.getScheduledAt());
        if (request.getDuration() != null) room.setDuration(request.getDuration());
        if (request.getMaxStudents() != null) room.setMaxStudents(request.getMaxStudents());
        if (request.getStatus() != null) room.setStatus(request.getStatus());

        room = roomRepository.save(room);
        return mapToDTO(room);
    }

    @Transactional
    public void deleteRoom(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        // Delete LiveKit room if exists
        if (room.getLivekitRoomName() != null) {
            liveKitService.deleteLiveKitRoom(room.getLivekitRoomName());
        }

        roomRepository.delete(room);
    }

    public RoomDTO getRoomById(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        return mapToDTO(room);
    }

    public RoomDTO getRoomByLivekitName(String livekitRoomName) {
        Room room = roomRepository.findByLivekitRoomName(livekitRoomName)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with LiveKit name: " + livekitRoomName));
        return mapToDTO(room);
    }

    public Page<RoomDTO> getRooms(
            Room.RoomStatus status,
            String language,
            Student.LanguageLevel level,
            UUID professorId,
            Room.AnimatorType animatorType,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String search,
            int page,
            int size,
            String sortBy,
            String sortOrder
    ) {
        Sort sort = sortOrder.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Room> rooms = roomRepository.findByFilters(
                status, language, level, professorId, animatorType,
                fromDate, toDate, search, pageable
        );

        return rooms.map(this::mapToDTO);
    }

    @Transactional
    public ParticipantDTO muteParticipant(ParticipantActionRequest request) {
        RoomParticipant participant = participantRepository
                .findByRoomIdAndStudentId(request.getRoomId(), request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));

        participant.setIsMuted(request.getMuted());
        participant = participantRepository.save(participant);

        // Notify via LiveKit
        Room room = participant.getRoom();
        if (room.getLivekitRoomName() != null) {
            // Send data message to participant via LiveKit
            // This will be handled by the LiveKit service
        }

        return mapParticipantToDTO(participant);
    }

    @Transactional
    public ParticipantDTO pingParticipant(ParticipantActionRequest request) {
        RoomParticipant participant = participantRepository
                .findByRoomIdAndStudentId(request.getRoomId(), request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));

        participant.setIsPinged(true);
        participant.setPingedAt(LocalDateTime.now());
        participant = participantRepository.save(participant);

        // Send ping notification via LiveKit DataChannel
        // This will be handled by the frontend receiving the data packet

        return mapParticipantToDTO(participant);
    }

    @Transactional
    public void clearPing(UUID roomId, UUID studentId) {
        RoomParticipant participant = participantRepository
                .findByRoomIdAndStudentId(roomId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));

        participant.setIsPinged(false);
        participant.setPingedAt(null);
        participantRepository.save(participant);
    }

    public List<ParticipantDTO> getRoomParticipants(UUID roomId) {
        List<RoomParticipant> participants = participantRepository.findByRoomId(roomId);
        return participants.stream()
                .map(this::mapParticipantToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Join a room and get LiveKit token
     * Works for any user (admin, professor, student) in dev mode
     */
    @Transactional
    public LiveKitTokenResponse joinRoom(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if room is joinable (skip time check in dev mode)
        if (!allowEarlyJoin) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime scheduledTime = room.getScheduledAt();
            LocalDateTime allowedJoinTime = scheduledTime.minusMinutes(15);
            
            if (now.isBefore(allowedJoinTime)) {
                throw new BadRequestException("Session has not started yet. You can join 15 minutes before scheduled time.");
            }
            
            if (room.getStatus() == Room.RoomStatus.COMPLETED) {
                throw new BadRequestException("This session has already ended.");
            }
            
            if (room.getStatus() == Room.RoomStatus.CANCELLED) {
                throw new BadRequestException("This session has been cancelled.");
            }
        }
        
        // Create or update participant record if user is a student
        if (user.getRole() == User.UserRole.STUDENT) {
            Student student = studentRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        // Create student if not exists
                        Student newStudent = Student.builder()
                                .user(user)
                                .level(Student.LanguageLevel.BEGINNER)
                                .build();
                        return studentRepository.save(newStudent);
                    });
            
            // Check if participant already exists
            RoomParticipant participant = participantRepository
                    .findByRoomIdAndStudentId(roomId, student.getId())
                    .orElseGet(() -> {
                        // Create new participant
                        RoomParticipant newParticipant = RoomParticipant.builder()
                                .room(room)
                                .student(student)
                                .invited(false)
                                .build();
                        return participantRepository.save(newParticipant);
                    });
            
            // Update joined time
            if (participant.getJoinedAt() == null) {
                participant.setJoinedAt(LocalDateTime.now());
                participantRepository.save(participant);
            }
        }
        
        // Auto-start room if scheduled and not already started
        if (room.getStatus() == Room.RoomStatus.SCHEDULED) {
            room.setStatus(Room.RoomStatus.LIVE);
            roomRepository.save(room);
        }
        
        // Generate and return LiveKit token
        return liveKitService.generateToken(roomId, userId);
    }

    @Transactional
    public void startRoom(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getStatus() != Room.RoomStatus.SCHEDULED) {
            throw new BadRequestException("Room is not scheduled");
        }

        room.setStatus(Room.RoomStatus.LIVE);
        roomRepository.save(room);
    }

    @Transactional
    public void endRoom(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getStatus() != Room.RoomStatus.LIVE) {
            throw new BadRequestException("Room is not live");
        }

        room.setStatus(Room.RoomStatus.COMPLETED);
        roomRepository.save(room);

        // Trigger summary generation (handled by Python service)
    }

    private RoomDTO mapToDTO(Room room) {
        List<RoomParticipant> participants = participantRepository.findByRoomId(room.getId());
        List<UUID> invitedStudents = participants.stream()
                .filter(RoomParticipant::getInvited)
                .map(p -> p.getStudent().getId())
                .collect(Collectors.toList());

        List<UUID> joinedStudents = participants.stream()
                .filter(p -> p.getJoinedAt() != null)
                .map(p -> p.getStudent().getId())
                .collect(Collectors.toList());

        return RoomDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .language(room.getLanguage())
                .level(room.getLevel())
                .objective(room.getObjective())
                .scheduledAt(room.getScheduledAt())
                .duration(room.getDuration())
                .maxStudents(room.getMaxStudents())
                .status(room.getStatus())
                .animatorType(room.getAnimatorType())
                .professorId(room.getProfessor() != null ? room.getProfessor().getId() : null)
                .professorName(room.getProfessor() != null ? room.getProfessor().getUser().getName() : null)
                .livekitRoomName(room.getLivekitRoomName())
                .invitedStudents(invitedStudents)
                .joinedStudents(joinedStudents)
                .participantsCount(joinedStudents.size())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private ParticipantDTO mapParticipantToDTO(RoomParticipant participant) {
        return ParticipantDTO.builder()
                .id(participant.getId())
                .roomId(participant.getRoom().getId())
                .studentId(participant.getStudent().getId())
                .studentName(participant.getStudent().getUser().getName())
                .studentAvatar(participant.getStudent().getUser().getAvatar())
                .invited(participant.getInvited())
                .joinedAt(participant.getJoinedAt())
                .leftAt(participant.getLeftAt())
                .isMuted(participant.getIsMuted())
                .isCameraOn(participant.getIsCameraOn())
                .isScreenSharing(participant.getIsScreenSharing())
                .handRaised(participant.getHandRaised())
                .isPinged(participant.getIsPinged())
                .pingedAt(participant.getPingedAt())
                .build();
    }
}
