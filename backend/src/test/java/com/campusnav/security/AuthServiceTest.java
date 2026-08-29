package com.campusnav.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void reportsInvalidCredentialsWhenAdminDoesNotExist() {
        AdminRepository admins = mock(AdminRepository.class);
        when(admins.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        AuthService service = new AuthService(admins, mock(PasswordEncoder.class),
                mock(JwtEncoder.class), new JwtProperties("campusnav-api",
                "a-secret-that-is-at-least-thirty-two-bytes", Duration.ofHours(12)));

        assertThatThrownBy(() -> service.login(new LoginRequest("missing@example.com", "password")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void createsHs256TokenForValidCredentials() {
        AdminRepository admins = mock(AdminRepository.class);
        PasswordEncoder passwords = mock(PasswordEncoder.class);
        JwtEncoder encoder = mock(JwtEncoder.class);
        Admin admin = mock(Admin.class);
        when(admin.getId()).thenReturn(1L);
        when(admin.getEmail()).thenReturn("admin@campusnav.app");
        when(admin.getPasswordHash()).thenReturn("stored-hash");
        when(admin.getRole()).thenReturn("superadmin");
        when(admins.findByEmailIgnoreCase("admin@campusnav.app")).thenReturn(Optional.of(admin));
        when(passwords.matches("campusnav123", "stored-hash")).thenReturn(true);
        when(encoder.encode(any())).thenAnswer(invocation -> {
            org.springframework.security.oauth2.jwt.JwtEncoderParameters parameters = invocation.getArgument(0);
            assertThat(parameters.getJwsHeader().getAlgorithm()).isEqualTo(MacAlgorithm.HS256);
            return Jwt.withTokenValue("signed-token")
                    .header("alg", "HS256")
                    .subject("admin@campusnav.app")
                    .build();
        });
        AuthService service = new AuthService(admins, passwords, encoder,
                new JwtProperties("campusnav-api", "a-secret-that-is-at-least-thirty-two-bytes",
                        Duration.ofHours(12)));

        LoginResponse response = service.login(
                new LoginRequest("admin@campusnav.app", "campusnav123"));

        assertThat(response.token()).isEqualTo("signed-token");
        assertThat(response.role()).isEqualTo("superadmin");
        verify(passwords).matches("campusnav123", "stored-hash");
    }
}
