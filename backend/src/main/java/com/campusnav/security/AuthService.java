package com.campusnav.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

    private final AdminRepository admins;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    private final JwtProperties properties;

    public AuthService(AdminRepository admins, PasswordEncoder passwords,
                       JwtEncoder encoder, JwtProperties properties) {
        this.admins = admins;
        this.passwords = passwords;
        this.encoder = encoder;
        this.properties = properties;
    }

    public LoginResponse login(LoginRequest request) {
        Admin admin = admins.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwords.matches(request.password(), admin.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(properties.ttl());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(admin.getEmail())
                .claim("adminId", admin.getId())
                .claim("roles", List.of(admin.getRole()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new LoginResponse(token, expiresAt, admin.getEmail(), admin.getRole());
    }

}
