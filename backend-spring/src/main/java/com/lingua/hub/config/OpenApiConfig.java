package com.lingua.hub.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("Lingua Hub API")
                        .version("1.0.0")
                        .description("API REST pour la plateforme d'e-learning Lingua Hub avec intégration LiveKit.\n\n" +
                                "## Fonctionnalités\n" +
                                "- 🔐 Authentification JWT\n" +
                                "- 👥 Gestion des utilisateurs (Admin, Professeurs, Étudiants)\n" +
                                "- 🎓 Gestion des sessions de formation\n" +
                                "- 🎥 Intégration LiveKit pour vidéo/audio en temps réel\n" +
                                "- 💬 Chat en temps réel\n" +
                                "- 📝 Quiz et évaluations\n" +
                                "- 🤖 Génération de résumés par IA\n\n" +
                                "## Authentification\n" +
                                "Utilisez l'endpoint `/api/auth/login` pour obtenir un token JWT, " +
                                "puis cliquez sur le bouton **Authorize** pour l'utiliser dans vos requêtes.")
                        .contact(new Contact()
                                .name("Lingua Hub Team")
                                .email("support@linguahub.com")
                                .url("https://linguahub.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Serveur de développement local"),
                        new Server()
                                .url("https://api.linguahub.com")
                                .description("Serveur de production")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Entrez votre token JWT (sans le préfixe 'Bearer')")));
    }
}
