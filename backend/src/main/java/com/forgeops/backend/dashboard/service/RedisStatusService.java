package com.forgeops.backend.dashboard.service;

import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse.ServiceHealth;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RedisStatusService {

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final boolean enabled;

    public RedisStatusService(ObjectProvider<StringRedisTemplate> redisTemplateProvider,
                              @Value("${forgeops.cache.redis.enabled:false}") boolean enabled) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.enabled = enabled;
    }

    public Optional<ServiceHealth> currentStatus() {
        if (!enabled) return Optional.empty();
        StringRedisTemplate template = redisTemplateProvider.getIfAvailable();
        if (template == null || template.getConnectionFactory() == null) {
            return Optional.of(new ServiceHealth("forgeops-redis", "Redis cache", "OFFLINE", "Client unavailable"));
        }
        try (RedisConnection connection = template.getConnectionFactory().getConnection()) {
            String pong = connection.ping();
            return Optional.of(new ServiceHealth("forgeops-redis", "Redis cache",
                    "PONG".equalsIgnoreCase(pong) ? "ONLINE" : "DEGRADED", "Dashboard cache"));
        } catch (Exception exception) {
            return Optional.of(new ServiceHealth("forgeops-redis", "Redis cache", "OFFLINE", "Connection failed"));
        }
    }
}
