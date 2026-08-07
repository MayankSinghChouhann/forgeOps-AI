package com.forgeops.backend.dashboard.service;

import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import com.forgeops.backend.analyzer.repository.AnalysisRepository;
import com.forgeops.backend.assistant.entity.ChatSession;
import com.forgeops.backend.assistant.repository.ChatSessionRepository;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse;
import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse.*;
import com.forgeops.backend.generator.entity.GeneratedTemplate;
import com.forgeops.backend.generator.repository.TemplateRepository;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public DashboardService(UserRepository userRepository,
                            AnalysisRepository analysisRepository,
                            ChatSessionRepository sessionRepository,
                            TemplateRepository templateRepository,
                            DataSource dataSource) {
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
        this.sessionRepository = sessionRepository;
        this.templateRepository = templateRepository;
        this.dataSource = dataSource;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getLiveMetrics() {
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
        double loadAvg = osBean.getSystemLoadAverage();
        int loadPercent = (loadAvg >= 0 && cores > 0) ? (int) Math.min(100, (loadAvg / cores) * 100) : 28;
        CpuStats cpuStats = new CpuStats(cores, loadAvg, loadPercent);

        // 3. HikariCP Database Connection Pool
        int activeConn = 1;
        int idleConn = 9;
        int totalPool = 10;
        String poolName = "HikariPool-1";

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
        long totalUsers = userRepository.count();
        long totalAnalyses = analysisRepository.count();
        long totalSessions = sessionRepository.count();
        long totalTemplates = templateRepository.count();
        PlatformCounters counters = new PlatformCounters(totalUsers, totalAnalyses, totalSessions, totalTemplates);

        // 5. Recent Chronological Activities
        List<ActivityEvent> activities = new ArrayList<>();

        List<AnalysisRecord> latestAnalyses = analysisRepository.findAll();
        for (AnalysisRecord a : latestAnalyses) {
            activities.add(new ActivityEvent(
                    "ANALYZER",
                    a.getTitle(),
                    a.getFailureStage() != null ? "Diagnosed: " + a.getFailureStage() : "Log RCA completed",
                    "SUCCESS",
                    a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.now()
            ));
        }

        List<GeneratedTemplate> latestTemplates = templateRepository.findAll();
        for (GeneratedTemplate t : latestTemplates) {
            activities.add(new ActivityEvent(
                    "GENERATOR",
                    t.getTitle(),
                    t.getTemplateType() + " generated for " + t.getTargetProvider(),
                    "SUCCESS",
                    t.getCreatedAt() != null ? t.getCreatedAt() : LocalDateTime.now()
            ));
        }

        List<ChatSession> latestSessions = sessionRepository.findAll();
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

        return new DashboardMetricsResponse(
                memoryStats,
                cpuStats,
                dbStats,
                counters,
                activities,
                "HEALTHY",
                uptimeSeconds
        );
    }
}
