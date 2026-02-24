package com.lingua.hub.controller;

import com.lingua.hub.dto.auth.*;
import com.lingua.hub.dto.common.ApiResponse;
import com.lingua.hub.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints pour l'authentification et la gestion des tokens")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(
        summary = "Inscription d'un nouvel utilisateur",
        description = "Crée un nouveau compte utilisateur (Admin, Professeur ou Étudiant) et retourne un token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Inscription réussie",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Email déjà utilisé ou données invalides"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register/student")
    @Operation(
        summary = "Inscription d'un étudiant",
        description = "Crée un nouveau compte étudiant avec profil complet et retourne un token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Inscription étudiante réussie",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Token invalide, email déjà utilisé ou données invalides"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> registerStudent(@Valid @RequestBody StudentRegisterRequest request) {
        AuthResponse response = authService.registerStudent(request);
        return ResponseEntity.ok(ApiResponse.success("Student registration successful", response));
    }

    @PostMapping("/register/professor")
    @Operation(
        summary = "Inscription d'un professeur",
        description = "Crée un nouveau compte professeur avec profil complet et retourne un token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Inscription professeur réussie",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Token invalide, email déjà utilisé ou données invalides"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> registerProfessor(@Valid @RequestBody ProfessorRegisterRequest request) {
        AuthResponse response = authService.registerProfessor(request);
        return ResponseEntity.ok(ApiResponse.success("Professor registration successful", response));
    }

    @PostMapping("/register/admin")
    @Operation(
        summary = "Inscription d'un administrateur",
        description = "Crée un nouveau compte administrateur et retourne un token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Inscription admin réussie",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Token invalide, email déjà utilisé ou données invalides"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@Valid @RequestBody AdminRegisterRequest request) {
        AuthResponse response = authService.registerAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Admin registration successful", response));
    }

    @GetMapping("/verify-email")
    @Operation(
        summary = "Vérifier l'email d'un professeur",
        description = "Vérifie l'adresse email d'un professeur via le token envoyé par email"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Email vérifié avec succès"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Token invalide ou expiré"
        )
    })
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email vérifié avec succès. Vous pouvez maintenant vous connecter.", null));
    }

    @PostMapping("/resend-verification")
    @Operation(
        summary = "Renvoyer l'email de vérification",
        description = "Renvoie un email de vérification à l'adresse spécifiée"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Email de vérification renvoyé"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Email non trouvé ou déjà vérifié"
        )
    })
    public ResponseEntity<ApiResponse<Void>> resendVerificationEmail(@RequestParam String email) {
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok(ApiResponse.success("Email de vérification renvoyé avec succès", null));
    }

    @PostMapping("/login")
    @Operation(
        summary = "Connexion utilisateur",
        description = "Authentifie un utilisateur avec email et mot de passe, retourne un token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Connexion réussie",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "Email ou mot de passe incorrect"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(
        summary = "Rafraîchir le token JWT",
        description = "Génère un nouveau token JWT à partir d'un refresh token valide"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Token rafraîchi avec succès",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Refresh token invalide ou expiré"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }
    
    @GetMapping("/me")
    @Operation(
        summary = "Obtenir les informations de l'utilisateur connecté",
        description = "Retourne les informations de l'utilisateur authentifié via le token JWT"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Informations utilisateur récupérées",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "Token invalide ou expiré"
        )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(
            @RequestAttribute("userId") UUID userId
    ) {
        AuthResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User info retrieved", response));
    }
    
    @PostMapping("/logout")
    @Operation(
        summary = "Déconnexion utilisateur",
        description = "Invalide le refresh token de l'utilisateur"
    )
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestAttribute("userId") UUID userId
    ) {
        authService.logout(userId);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
