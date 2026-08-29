package com.campusnav.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Size;

import java.time.Duration;

@ConfigurationProperties("campusnav.jwt")
@Validated
public record JwtProperties(String issuer, @Size(min = 32) String secret, Duration ttl) {
}
