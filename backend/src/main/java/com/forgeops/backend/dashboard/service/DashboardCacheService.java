package com.forgeops.backend.dashboard.service;

import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Optional;

@Service
@ConditionalOnProperty(name = "forgeops.cache.redis.enabled", havingValue = "true")
public class DashboardCacheService {

    private static final Logger log = LoggerFactory.getLogger(DashboardCacheService.class);
    private static final String CACHE_KEY = "forgeops:dashboard:live";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public DashboardCacheService(StringRedisTemplate redisTemplate,
                                 ObjectMapper objectMapper,
                                 @Value("${forgeops.cache.redis.dashboard-ttl:5s}") Duration ttl) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = ttl;
    }

    public Optional<DashboardMetricsResponse> get() {
        try {
            String json = redisTemplate.opsForValue().get(CACHE_KEY);
            return json == null ? Optional.empty() : Optional.of(objectMapper.readValue(json, DashboardMetricsResponse.class));
        } catch (Exception exception) {
            log.warn("[DashboardCache] Redis read failed; computing live metrics: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    public void put(DashboardMetricsResponse metrics) {
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(metrics), ttl);
        } catch (Exception exception) {
            log.warn("[DashboardCache] Redis write failed; response remains available: {}", exception.getMessage());
        }
    }
}
