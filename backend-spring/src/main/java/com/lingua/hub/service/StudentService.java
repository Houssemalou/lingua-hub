package com.lingua.hub.service;

import com.lingua.hub.dto.student.*;
import com.lingua.hub.entity.Student;
import com.lingua.hub.entity.StudentSkills;
import com.lingua.hub.entity.User;
import com.lingua.hub.exception.BadRequestException;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.StudentRepository;
import com.lingua.hub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public StudentDTO createStudent(CreateStudentRequest request) {
        // Check if user with email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("User with this email already exists");
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.STUDENT)
                .avatar(request.getAvatar())
                .build();
        user = userRepository.save(user);

        // Create student
        Student student = Student.builder()
                .user(user)
                .level(request.getLevel())
                .targetLanguage(request.getTargetLanguage())
                .nativeLanguage(request.getNativeLanguage())
                .bio(request.getBio())
                .build();

        // Add skills if provided
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            List<StudentSkills> skills = request.getSkills().stream()
                    .map(s -> StudentSkills.builder()
                            .student(student)
                            .skill(s.getSkill())
                            .proficiency(s.getProficiency())
                            .build())
                    .collect(Collectors.toList());
            student.setSkills(skills);
        }

        student = studentRepository.save(student);
        return mapToDTO(student);
    }

    @Transactional
    public StudentDTO updateStudent(UUID studentId, UpdateStudentRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        User user = student.getUser();
        
        if (request.getName() != null) user.setName(request.getName());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        if (request.getLevel() != null) student.setLevel(request.getLevel());
        if (request.getTargetLanguage() != null) student.setTargetLanguage(request.getTargetLanguage());
        if (request.getNativeLanguage() != null) student.setNativeLanguage(request.getNativeLanguage());
        if (request.getBio() != null) student.setBio(request.getBio());

        if (request.getSkills() != null) {
            student.getSkills().clear();
            List<StudentSkills> newSkills = request.getSkills().stream()
                    .map(s -> StudentSkills.builder()
                            .student(student)
                            .skill(s.getSkill())
                            .proficiency(s.getProficiency())
                            .build())
                    .collect(Collectors.toList());
            student.getSkills().addAll(newSkills);
        }

        userRepository.save(user);
        student = studentRepository.save(student);
        return mapToDTO(student);
    }

    @Transactional
    public void deleteStudent(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        
        User user = student.getUser();
        studentRepository.delete(student);
        userRepository.delete(user);
    }

    public StudentDTO getStudentById(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return mapToDTO(student);
    }

    public Page<StudentDTO> getStudents(
            Student.LanguageLevel level,
            String targetLanguage,
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

        Page<Student> students = studentRepository.findByFilters(
                level, targetLanguage, search, pageable
        );

        return students.map(this::mapToDTO);
    }

    public List<StudentDTO> getStudentsByIds(List<UUID> studentIds) {
        List<Student> students = studentRepository.findAllById(studentIds);
        return students.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private StudentDTO mapToDTO(Student student) {
        List<StudentSkillsDTO> skills = student.getSkills() != null 
                ? student.getSkills().stream()
                        .map(s -> StudentSkillsDTO.builder()
                                .skill(s.getSkill())
                                .proficiency(s.getProficiency())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        return StudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .name(student.getUser().getName())
                .email(student.getUser().getEmail())
                .avatar(student.getUser().getAvatar())
                .level(student.getLevel())
                .targetLanguage(student.getTargetLanguage())
                .nativeLanguage(student.getNativeLanguage())
                .bio(student.getBio())
                .skills(skills)
                .joinedAt(student.getCreatedAt())
                .build();
    }
}
