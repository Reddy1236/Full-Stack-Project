package com.peerreview.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class RenderDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {
    private static final String PROPERTY_SOURCE_NAME = "renderDatabase";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = firstNonBlank(
                environment.getProperty("JDBC_DATABASE_URL"),
                environment.getProperty("DATABASE_URL"),
                environment.getProperty("DB_URL")
        );

        if (databaseUrl == null) {
            return;
        }

        Map<String, Object> properties = new LinkedHashMap<>();

        if (databaseUrl.startsWith("jdbc:")) {
            properties.put("spring.datasource.url", databaseUrl);
            addDriverAndDialect(databaseUrl, properties);
        } else if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
            configurePostgres(databaseUrl, environment, properties);
        }

        if (!properties.isEmpty()) {
            environment.getPropertySources().remove(PROPERTY_SOURCE_NAME);
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private static void configurePostgres(String databaseUrl, ConfigurableEnvironment environment, Map<String, Object> properties) {
        URI uri = URI.create(databaseUrl);
        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost());

        if (uri.getPort() > -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }

        jdbcUrl.append(uri.getPath());

        String query = uri.getQuery();
        if (query == null || query.isBlank()) {
            jdbcUrl.append("?sslmode=require");
        } else {
            jdbcUrl.append('?').append(query);
            if (!query.contains("sslmode=")) {
                jdbcUrl.append("&sslmode=require");
            }
        }

        properties.put("spring.datasource.url", jdbcUrl.toString());
        properties.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
        properties.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

        String[] credentials = parseCredentials(uri.getRawUserInfo());
        String username = firstNonBlank(environment.getProperty("DB_USER"), credentials[0]);
        String password = firstNonBlank(environment.getProperty("DB_PASS"), credentials[1]);

        if (username != null) {
            properties.put("spring.datasource.username", username);
        }
        if (password != null) {
            properties.put("spring.datasource.password", password);
        }
    }

    private static void addDriverAndDialect(String jdbcUrl, Map<String, Object> properties) {
        if (jdbcUrl.startsWith("jdbc:postgresql:")) {
            properties.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
            properties.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
        } else if (jdbcUrl.startsWith("jdbc:mysql:")) {
            properties.put("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
            properties.put("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
        }
    }

    private static String[] parseCredentials(String rawUserInfo) {
        if (rawUserInfo == null || rawUserInfo.isBlank()) {
            return new String[]{null, null};
        }

        String[] parts = rawUserInfo.split(":", 2);
        String username = decode(parts[0]);
        String password = parts.length > 1 ? decode(parts[1]) : null;
        return new String[]{username, password};
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
