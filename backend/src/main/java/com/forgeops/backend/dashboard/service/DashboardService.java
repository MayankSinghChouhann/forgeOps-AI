package com.forgeops.backend.dashboard.service;

import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import com.forgeops.backend.analyzer.repository.AnalysisRepository;
import com.forgeops.backend.assistant.entity.ChatSession;
import com.forgeops.backend.assistant.repository.ChatSessionRepository;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.service.CurrentUserService;
import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse;
import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse.*;
import com.forgeops.backend.generator.entity.GeneratedTemplate;
import com.forgeops.backend.generator.repository.TemplateRepository;
import com.forgeops.backend.assistant.service.GeminiAiService;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.ObjectProvider;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;
    private final ChatSessionRepository sessionRepository;
    private final TemplateRepository templateRepository;
    private final DataSource dataSource;
    private final GeminiAiService geminiAiService;
    private final ObjectProvider<DashboardCacheService> dashboardCacheProvider;
    private final RedisStatusService redisStatusService;
    private final CurrentUserService currentUserService;

    public DashboardService(UserRepository userRepository,
                            AnalysisRepository analysisRepository,
                            ChatSessionRepository sessionRepository,
                            TemplateRepository templateRepository,
                            DataSource dataSource,
                            GeminiAiService geminiAiService,
                            ObjectProvider<DashboardCacheService> dashboardCacheProvider,
                            RedisStatusService redisStatusService,
                            CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
        this.sessionRepository = sessionRepository;
        this.templateRepository = templateRepository;
        this.dataSource = dataSource;
        this.geminiAiService = geminiAiService;
        this.dashboardCacheProvider = dashboardCacheProvider;
        this.redisStatusService = redisStatusService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getLiveMetrics(String actorEmail) {
        User actor = currentUserService.requireByEmail(actorEmail);
        DashboardCacheService cache = actor.getRole() == UserRole.ADMIN
                ? dashboardCacheProvider.getIfAvailable() : null;
        if (cache != null) {
            DashboardMetricsResponse cached = cache.get().orElse(null);
            if (cached != null) return cached;
        }

        DashboardMetricsResponse metrics = computeLiveMetrics(actor);
        if (cache != null) cache.put(metrics);
        return metrics;
    }

    private DashboardMetricsResponse computeLiveMetrics(User actor) {
        // 1. JVM Memory
        Runtime runtime = Runtime.getRuntime();
        long totalMB = runtime.totalMemory() / (1024 * 1024);
        long freeMB = runtime.freeMemory() / (1024 * 1024);
        long usedMB = totalMB - freeMB;
        long maxMB = runtime.maxMemory() / (1024 * 1024);
        int percentUsed = (maxMB > 0) ? (int) ((usedMB * 100) / maxMB) : 0;
        MemoryStats memoryStats = new MemoryStats(usedMB, totalMB, maxMB, percentUsed);

        // 2. CPU & OS
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        int cores = osBean.getAvailableProcessors();
        double rawLoadAvg = osBean.getSystemLoadAverage();
        Double loadAvg = rawLoadAvg >= 0 ? rawLoadAvg : null;
        Integer loadPercent = (loadAvg != null && cores > 0) ? (int) Math.min(100, (loadAvg / cores) * 100) : null;
        CpuStats cpuStats = new CpuStats(cores, loadAvg, loadPercent);

        // 3. HikariCP Database Connection Pool
        Integer activeConn = null;
        Integer idleConn = null;
        Integer totalPool = null;
        String poolName = dataSource.getClass().getSimpleName();

        if (dataSource instanceof HikariDataSource hikari) {
            HikariPoolMXBean poolMxBean = hikari.getHikariPoolMXBean();
            if (poolMxBean != null) {
                activeConn = poolMxBean.getActiveConnections();
                idleConn = poolMxBean.getIdleConnections();
                totalPool = poolMxBean.getTotalConnections();
            }
            poolName = hikari.getPoolName();
        }
        DatabaseStats dbStats = new DatabaseStats(activeConn, idleConn, totalPool, poolName);

        // 4. Platform Database Counts
        boolean admin = actor.getRole() == UserRole.ADMIN;
        long totalUsers = admin ? userRepository.count() : 1;
        long totalAnalyses = admin ? analysisRepository.count() : analysisRepository.countByUserId(actor.getId());
        long totalSessions = admin ? sessionRepository.count() : sessionRepository.countByUser(actor);
        long totalTemplates = admin ? templateRepository.count() : templateRepository.countByUserId(actor.getId());
        PlatformCounters counters = new PlatformCounters(totalUsers, totalAnalyses, totalSessions, totalTemplates);

        // 5. Recent Chronological Activities
        List<ActivityEvent> activities = new ArrayList<>();

        List<AnalysisRecord> latestAnalyses = admin ? analysisRepository.findTop8ByOrderByCreatedAtDesc()
                : analysisRepository.findTop8ByUserIdOrderByCreatedAtDesc(actor.getId());
        for (AnalysisRecord a : latestAnalyses) {
            activities.add(new ActivityEvent(
                    "ANALYZER",
                    a.getTitle(),
                    a.getFailureStage() != null ? "Diagnosed: " + a.getFailureStage() : "Log RCA completed",
                    "SUCCESS",
                    a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.now()
            ));
        }

        List<GeneratedTemplate> latestTemplates = admin ? templateRepository.findTop8ByOrderByCreatedAtDesc()
                : templateRepository.findTop8ByUserIdOrderByCreatedAtDesc(actor.getId());
        for (GeneratedTemplate t : latestTemplates) {
            activities.add(new ActivityEvent(
                    "GENERATOR",
                    t.getTitle(),
                    t.getTemplateType() + " generated for " + t.getTargetProvider(),
                    "SUCCESS",
                    t.getCreatedAt() != null ? t.getCreatedAt() : LocalDateTime.now()
            ));
        }

        List<ChatSession> latestSessions = admin ? sessionRepository.findTop8ByOrderByCreatedAtDesc()
                : sessionRepository.findTop8ByUserOrderByCreatedAtDesc(actor);
        for (ChatSession s : latestSessions) {
            activities.add(new ActivityEvent(
                    "ASSISTANT",
                    s.getTitle(),
                    "DevOps AI consultation active",
                    "SUCCESS",
                    s.getCreatedAt() != null ? s.getCreatedAt() : LocalDateTime.now()
            ));
        }

        // Sort descending by timestamp, limit to latest 8
        activities.sort(Comparator.comparing(ActivityEvent::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));
        if (activities.size() > 8) {
            activities = activities.subList(0, 8);
        }

        // 6. Uptime
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        long uptimeSeconds = runtimeMXBean.getUptime() / 1000;

        List<ServiceHealth> services = new ArrayList<>();
        services.add(new ServiceHealth("forgeops-backend", "Spring Boot / Java 21", "ONLINE", "HTTP :8080"));
        services.add(new ServiceHealth("forgeops-postgres", "PostgreSQL",
                totalPool != null && totalPool > 0 ? "ONLINE" : "UNKNOWN",
                totalPool == null ? poolName + " (pool telemetry unavailable)"
                        : poolName + " (" + totalPool + " connections)"));
        redisStatusService.currentStatus().ifPresent(services::add);
        services.add(new ServiceHealth("gemini-ai", "Google Gemini",
                geminiAiService.isConfigured() ? "CONNECTED" : "FALLBACK",
                geminiAiService.isConfigured() ? "Remote provider configured" : "Local knowledge engine active"));

        return new DashboardMetricsResponse(
                memoryStats,
                cpuStats,
                dbStats,
                counters,
                activities,
                "HEALTHY",
                uptimeSeconds,
                services
        );
    }
}
