package com.lingua.hub.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@lingua-hub.com");
            helper.setTo(toEmail);
            helper.setSubject("Vérifiez votre adresse email - LangSchool AI");

            String verificationLink = frontendUrl + "/verify-email?token=" + token;

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1;">LangSchool AI</h1>
                    </div>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e293b; margin-top: 0;">Bienvenue, %s !</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            Merci de vous être inscrit en tant que professeur sur LangSchool AI.
                            Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s"
                               style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px;
                                      text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                                Vérifier mon email
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 14px;">
                            Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #94a3b8; font-size: 12px;">
                            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                            <a href="%s" style="color: #6366f1;">%s</a>
                        </p>
                    </div>
                </div>
                """.formatted(name, verificationLink, verificationLink, verificationLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Verification email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}
