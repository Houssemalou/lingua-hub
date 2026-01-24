package com.lingua.hub.repository;

import com.lingua.hub.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    
    Optional<Student> findByUserId(UUID userId);
    
    @Query("SELECT s FROM Student s WHERE " +
           "(:level IS NULL OR s.level = :level) AND " +
           "(:targetLanguage IS NULL OR s.targetLanguage = :targetLanguage) AND " +
           "(:search IS NULL OR LOWER(s.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.user.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Student> findByFilters(
            @Param("level") Student.LanguageLevel level,
            @Param("targetLanguage") String targetLanguage,
            @Param("search") String search,
            Pageable pageable
    );
}
