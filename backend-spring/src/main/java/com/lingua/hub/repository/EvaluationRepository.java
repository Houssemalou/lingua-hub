package com.lingua.hub.repository;

import com.lingua.hub.entity.Evaluation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    
    List<Evaluation> findByStudentId(UUID studentId);
    
    List<Evaluation> findBySessionId(UUID sessionId);
    
    Optional<Evaluation> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);
    
    @Query("SELECT e FROM Evaluation e WHERE " +
           "(:sessionId IS NULL OR e.session.id = :sessionId) AND " +
           "(:studentId IS NULL OR e.student.id = :studentId) AND " +
           "(:professorId IS NULL OR e.professor.id = :professorId) AND " +
           "(:fromDate IS NULL OR e.evaluatedAt >= :fromDate) AND " +
           "(:toDate IS NULL OR e.evaluatedAt <= :toDate) AND " +
           "(:minScore IS NULL OR e.overallScore >= :minScore)")
    Page<Evaluation> findByFilters(
            @Param("sessionId") UUID sessionId,
            @Param("studentId") UUID studentId,
            @Param("professorId") UUID professorId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("minScore") Double minScore,
            Pageable pageable
    );
}
