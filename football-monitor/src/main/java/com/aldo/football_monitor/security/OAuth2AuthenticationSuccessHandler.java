package com.aldo.football_monitor.security;

import com.aldo.football_monitor.identity.model.Role;
import com.aldo.football_monitor.identity.model.User;
import com.aldo.football_monitor.identity.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Crear usuario si no existe
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // dummy password
                    .role(Role.PLAYER) // Rol por defecto
                    .build();
            return userRepository.save(newUser);
        });

        // Generar nuestro propio token JWT
        String jwtToken = jwtService.generateToken(user);
        
        // Redirigir al frontend de Angular pasando el token
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:4200/oauth2/callback")
                .queryParam("token", jwtToken)
                .build().toUriString();
                
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
