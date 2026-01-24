package com.lingua.hub.repository;

import com.lingua.hub.entity.Professor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfessorRepository extends JpaRepository<Professor, UUID> {
    
    Optional<Professor> findByUserId(UUID userId);
    
    @Query("SELECT p FROM Professor p WHERE " +
           "(:language IS NULL OR :language MEMBER OF p.languages) AND " +
           "(:specialization IS NULL OR :specialization MEMBER OF p.specializations) AND " +
           "(:minRating IS NULL OR p.rating >= :minRating) AND " +
           "(:search IS NULL OR LOWER(p.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Professor> findByFilters(
            @Param("language") String language,
            @Param("specialization") String specialization,
            @Param("minRating") Double minRating,
            @Param("search") String search,
            Pageable pageable
    );
}
