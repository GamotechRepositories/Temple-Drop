package com.templedrop.controller;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public Map<String, Object> health() {
        boolean isConnected;
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            isConnected = true;
        } catch (Exception e) {
            isConnected = false;
        }

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000L;
        return Map.of(
            "status", isConnected ? "healthy" : "degraded",
            "database", isConnected ? "connected" : "disconnected",
            "uptimeSeconds", uptimeSeconds,
            "timestamp", Instant.now().toString()
        );
    }
}
