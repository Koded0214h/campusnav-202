package com.campusnav.route;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("campusnav.routing")
public record RoutingProperties(String mapboxToken) {
}
