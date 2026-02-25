package com.peerreview.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${app.frontend.url:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174}")
    private String frontendUrls;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = Arrays.stream(frontendUrls.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);

        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
