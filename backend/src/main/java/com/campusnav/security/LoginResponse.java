package com.campusnav.security;

import java.time.Instant;

public record LoginResponse(String token, Instant expiresAt, String email, String role) {
}
