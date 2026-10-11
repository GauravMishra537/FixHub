package com.fixhub.common.controller;

import com.fixhub.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemInfo() {
        Map<String, Object> info = Map.of(
                "name", "FixHub",
                "tagline", "Report. Book. Request. Learn.",
                "version", "0.1.0",
                "status", "UP",
                "database", "PostgreSQL"
        );
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}
