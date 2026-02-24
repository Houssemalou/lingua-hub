package com.lingua.hub.service;

import com.lingua.hub.dto.auth.*;
import com.lingua.hub.entity.Professor;
import com.lingua.hub.entity.Student;
import com.lingua.hub.entity.User;
import com.lingua.hub.exception.BadRequestException;
import com.lingua.hub.repository.ProfessorRepository;
import com.lingua.hub.repository.StudentRepository;
import com.lingua.hub.repository.UserRepository;
import com.lingua.hub.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    // Valid access tokens for registration
    private static final List<String> VALID_STUDENT_TOKENS = Arrays.asList(
        "STUDENT2024", "LANG-ABC123", "EDU-TOKEN-01", "ACCESS-2024-XYZ"
    );

    private static final List<String> VALID_PROFESSOR_TOKENS = Arrays.asList(
        "PROF2024", "TEACHER-ABC", "PROF-TOKEN-01"
    );

    private static final List<String> VALID_ADMIN_TOKENS = Arrays.asList(
        "ADMIN2024", "ADMIN-TOKEN-01", "SUPER-ADMIN"
    );

    @Transactional
    public AuthResponse registerStudent(StudentRegisterRequest request) {
        // Validate access token
        if (!VALID_STUDENT_TOKENS.contains(request.getAccessToken().toUpperCase().trim())) {
            throw new BadRequestException("Invalid access token");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // Create new user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.STUDENT)
                .avatar(request.getAvatar())
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Create student profile
        Student student = Student.builder()
                .user(user)
                .nickname(request.getNickname())
                .bio(request.getBio())
                .level(Student.LanguageLevel.valueOf(request.getLevel().toUpperCase()))
                .joinedAt(LocalDateTime.now())
                .build();

        studentRepository.save(student);

        // Generate tokens
        String token = tokenProvider.generateTokenFromUsername(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        log.info("Student registered successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .expiresIn(tokenProvider.getJwtExpirationMs())
                .build();
    }

    @Transactional
    public AuthResponse registerProfessor(ProfessorRegisterRequest request) {
        // Validate access token
        if (!VALID_PROFESSOR_TOKENS.contains(request.getAccessToken().toUpperCase().trim())) {
            throw new BadRequestException("Invalid professor access token");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // Generate email verification token
        String verificationToken = UUID.randomUUID().toString();

        // Create new user with isActive=false and emailVerified=false
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.PROFESSOR)
                .avatar(request.getAvatar())
                .isActive(false)
                .emailVerified(false)
                .emailVerificationToken(verificationToken)
                .emailVerificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);

        // Create professor profile
        Professor professor = Professor.builder()
                .user(user)
                .bio(request.getBio())
                .languages(request.getLanguages())
                .specialization(request.getSpecialization())
                .joinedAt(LocalDateTime.now())
                .build();

        professorRepository.save(professor);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);

        log.info("Professor registered successfully (pending email verification): {}", user.getEmail());

        // Return response WITHOUT JWT tokens
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse registerAdmin(AdminRegisterRequest request) {
        // Validate access token
        if (!VALID_ADMIN_TOKENS.contains(request.getAccessToken().toUpperCase().trim())) {
            throw new BadRequestException("Invalid admin access token");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // Create new user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.ADMIN)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate tokens
        String token = tokenProvider.generateTokenFromUsername(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        log.info("Admin registered successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .expiresIn(tokenProvider.getJwtExpirationMs())
                .build();
    }

    // Keep the old method for backward compatibility (simple registration)
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // Create new user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.valueOf(request.getRole().toUpperCase()))
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate tokens
        String token = tokenProvider.generateTokenFromUsername(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .expiresIn(tokenProvider.getJwtExpirationMs())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Check if user exists and is a professor with unverified email
        User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existingUser != null
                && existingUser.getRole() == User.UserRole.PROFESSOR
                && Boolean.FALSE.equals(existingUser.getEmailVerified())) {
            throw new BadRequestException("Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception.");
        }

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get user details
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Generate tokens
        String token = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        log.info("User logged in successfully: {}, role: {}", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .expiresIn(tokenProvider.getJwtExpirationMs())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (tokenProvider.validateToken(refreshToken)) {
            String email = tokenProvider.getUsernameFromToken(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BadRequestException("User not found"));

            String newToken = tokenProvider.generateTokenFromUsername(email);
            String newRefreshToken = tokenProvider.generateRefreshToken(email);
            
            log.info("Token refreshed for user: {}", email);

            return AuthResponse.builder()
                    .token(newToken)
                    .refreshToken(newRefreshToken)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .expiresIn(tokenProvider.getJwtExpirationMs())
                    .build();
        } else {
            log.warn("Invalid refresh token attempt");
            throw new BadRequestException("Invalid refresh token");
        }
    }
    
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Token de vérification invalide"));

        if (user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Le token de vérification a expiré. Veuillez demander un nouvel email de vérification.");
        }

        user.setEmailVerified(true);
        user.setIsActive(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);

        log.info("Email verified successfully for user: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Aucun compte trouvé avec cet email"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Cet email est déjà vérifié");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);

        log.info("Verification email resent to: {}", user.getEmail());
    }

    public AuthResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
    
    public void logout(UUID userId) {
        // TODO: Invalider les refresh tokens de l'utilisateur en base
        // Pour l'instant, le client doit simplement supprimer ses tokens localement
        log.info("User logged out: {}", userId);
    }
}
