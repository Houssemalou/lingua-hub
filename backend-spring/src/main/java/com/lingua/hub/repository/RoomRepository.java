package com.lingua.hub.repository;

import com.lingua.hub.entity.Room;
import com.lingua.hub.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    
    Optional<Room> findByLivekitRoomName(String livekitRoomName);
    
    @Query("SELECT r FROM Room r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:language IS NULL OR r.language = :language) AND " +
           "(:level IS NULL OR r.level = :level) AND " +
           "(:professorId IS NULL OR r.professor.id = :professorId) AND " +
           "(:animatorType IS NULL OR r.animatorType = :animatorType) AND " +
           "(:fromDate IS NULL OR r.scheduledAt >= :fromDate) AND " +
           "(:toDate IS NULL OR r.scheduledAt <= :toDate) AND " +
           "(:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Room> findByFilters(
            @Param("status") Room.RoomStatus status,
            @Param("language") String language,
            @Param("level") Student.LanguageLevel level,
            @Param("professorId") UUID professorId,
            @Param("animatorType") Room.AnimatorType animatorType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("search") String search,
            Pageable pageable
    );
}
