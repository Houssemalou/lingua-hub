package com.lingua.hub.service;

import com.lingua.hub.dto.professor.*;
import com.lingua.hub.entity.Professor;
import com.lingua.hub.entity.User;
import com.lingua.hub.exception.BadRequestException;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.ProfessorRepository;
import com.lingua.hub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public ProfessorDTO createProfessor(CreateProfessorRequest request) {
        // Check if user with email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("User with this email already exists");
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.PROFESSOR)
                .build();
        user = userRepository.save(user);

        // Create professor
        Professor professor = Professor.builder()
                .user(user)
                .languages(request.getLanguages())
                .specialization(request.getSpecialization())
                .bio(request.getBio())
                .rating(BigDecimal.ZERO)
                .build();

        professor = professorRepository.save(professor);
        return mapToDTO(professor);
    }

    @Transactional
    public ProfessorDTO updateProfessor(UUID professorId, UpdateProfessorRequest request) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));

        User user = professor.getUser();

        if (request.getName() != null) user.setName(request.getName());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        if (request.getLanguages() != null) professor.setLanguages(request.getLanguages());
        if (request.getSpecialization() != null) professor.setSpecialization(request.getSpecialization());
        if (request.getBio() != null) professor.setBio(request.getBio());

        userRepository.save(user);
        professor = professorRepository.save(professor);
        return mapToDTO(professor);
    }

    @Transactional
    public void deleteProfessor(UUID professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));

        User user = professor.getUser();
        professorRepository.delete(professor);
        userRepository.delete(user);
    }

    public ProfessorDTO getProfessorById(UUID professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));
        return mapToDTO(professor);
    }

    public Page<ProfessorDTO> getProfessors(
            String language,
            String specialization,
            Double minRating,
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

        Page<Professor> professors = professorRepository.findByFilters(
                language, specialization, minRating, search, pageable
        );

        return professors.map(this::mapToDTO);
    }

    private ProfessorDTO mapToDTO(Professor professor) {
        return ProfessorDTO.builder()
                .id(professor.getId())
                .name(professor.getUser().getName())
                .email(professor.getUser().getEmail())
                .avatar(professor.getUser().getAvatar())
                .languages(professor.getLanguages())
                .specialization(professor.getSpecialization())
                .bio(professor.getBio())
                .rating(professor.getRating())
                .totalSessions(professor.getTotalSessions())
                .joinedAt(professor.getCreatedAt())
                .createdAt(professor.getCreatedAt())
                .updatedAt(professor.getUpdatedAt())
                .build();
    }
}
