package com.lingua.hub.repository;

import com.lingua.hub.entity.SessionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionSummaryRepository extends JpaRepository<SessionSummary, UUID> {
    
    Optional<SessionSummary> findBySessionId(UUID sessionId);
}
