package com.campusnav.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final List<Path> CANDIDATES = List.of(Path.of(".env"), Path.of("backend/.env"));

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        candidate().ifPresent(path -> addProperties(environment, path));
    }

    private Optional<Path> candidate() {
        return CANDIDATES.stream().filter(Files::isRegularFile).findFirst();
    }

    private void addProperties(ConfigurableEnvironment environment, Path path) {
        Map<String, Object> values = new LinkedHashMap<>();
        for (String line : readLines(path)) {
            parse(line).ifPresent(entry -> values.put(entry.getKey(), entry.getValue()));
        }
        environment.getPropertySources().addLast(new MapPropertySource("campusnav-dotenv", values));
    }

    private List<String> readLines(Path path) {
        try {
            return Files.readAllLines(path);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not read local .env file", exception);
        }
    }

    static Optional<Map.Entry<String, Object>> parse(String line) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return Optional.empty();
        }
        int separator = trimmed.indexOf('=');
        if (separator < 1) {
            return Optional.empty();
        }
        String key = trimmed.substring(0, separator).trim();
        String value = stripQuotes(trimmed.substring(separator + 1).trim());
        return Optional.of(Map.entry(key, value));
    }

    private static String stripQuotes(String value) {
        if (value.length() < 2) {
            return value;
        }
        boolean doubleQuoted = value.startsWith("\"") && value.endsWith("\"");
        boolean singleQuoted = value.startsWith("'") && value.endsWith("'");
        return doubleQuoted || singleQuoted ? value.substring(1, value.length() - 1) : value;
    }
}
