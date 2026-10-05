package com.shopsphere.controller;

import com.shopsphere.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "ShopSphere API is running");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "ShopSphere Backend API");
        status.put("version", "1.0.0-SNAPSHOT");
        status.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.success("ShopSphere backend is operational", status));
    }

    @GetMapping("/api/v1/status")
    public ResponseEntity<ApiResponse<Map<String, String>>> apiStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("environment", "development");
        status.put("database", "MySQL (Spring Data JPA)");
        status.put("security", "Spring Security + JWT");

        return ResponseEntity.ok(ApiResponse.success("API status report", status));
    }
}
