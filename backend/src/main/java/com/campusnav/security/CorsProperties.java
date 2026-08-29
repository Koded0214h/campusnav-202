package com.campusnav.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("campusnav.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
