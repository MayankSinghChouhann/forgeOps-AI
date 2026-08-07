package com.forgeops.backend.dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DashboardMetricsResponse {

    private MemoryStats memory;
    private CpuStats cpu;
    private DatabaseStats database;
    private PlatformCounters counters;
    private List<ActivityEvent> recentActivities;
    private String systemStatus;
    private long uptimeSeconds;

    public DashboardMetricsResponse() {}

    public DashboardMetricsResponse(MemoryStats memory, CpuStats cpu, DatabaseStats database,
                                    PlatformCounters counters, List<ActivityEvent> recentActivities,
                                    String systemStatus, long uptimeSeconds) {
        this.memory = memory;
        this.cpu = cpu;
        this.database = database;
        this.counters = counters;
        this.recentActivities = recentActivities;
        this.systemStatus = systemStatus;
        this.uptimeSeconds = uptimeSeconds;
    }

    public MemoryStats getMemory() { return memory; }
    public CpuStats getCpu() { return cpu; }
    public DatabaseStats getDatabase() { return database; }
    public PlatformCounters getCounters() { return counters; }
    public List<ActivityEvent> getRecentActivities() { return recentActivities; }
    public String getSystemStatus() { return systemStatus; }
    public long getUptimeSeconds() { return uptimeSeconds; }

    public static class MemoryStats {
        private long usedMB;
        private long totalMB;
        private long maxMB;
        private int percentUsed;

        public MemoryStats() {}
        public MemoryStats(long usedMB, long totalMB, long maxMB, int percentUsed) {
            this.usedMB = usedMB;
            this.totalMB = totalMB;
            this.maxMB = maxMB;
            this.percentUsed = percentUsed;
        }

        public long getUsedMB() { return usedMB; }
        public long getTotalMB() { return totalMB; }
        public long getMaxMB() { return maxMB; }
        public int getPercentUsed() { return percentUsed; }
    }

    public static class CpuStats {
        private int availableCores;
        private double systemLoadAverage;
        private int estimatedLoadPercent;

        public CpuStats() {}
        public CpuStats(int availableCores, double systemLoadAverage, int estimatedLoadPercent) {
            this.availableCores = availableCores;
            this.systemLoadAverage = systemLoadAverage;
            this.estimatedLoadPercent = estimatedLoadPercent;
        }

        public int getAvailableCores() { return availableCores; }
        public double getSystemLoadAverage() { return systemLoadAverage; }
        public int getEstimatedLoadPercent() { return estimatedLoadPercent; }
    }

    public static class DatabaseStats {
        private int activeConnections;
        private int idleConnections;
        private int totalPoolSize;
        private String poolName;

        public DatabaseStats() {}
        public DatabaseStats(int activeConnections, int idleConnections, int totalPoolSize, String poolName) {
            this.activeConnections = activeConnections;
            this.idleConnections = idleConnections;
            this.totalPoolSize = totalPoolSize;
            this.poolName = poolName;
        }

        public int getActiveConnections() { return activeConnections; }
        public int getIdleConnections() { return idleConnections; }
        public int getTotalPoolSize() { return totalPoolSize; }
        public String getPoolName() { return poolName; }
    }

    public static class PlatformCounters {
        private long totalUsers;
        private long totalAnalyses;
        private long totalChatSessions;
        private long totalTemplates;

        public PlatformCounters() {}
        public PlatformCounters(long totalUsers, long totalAnalyses, long totalChatSessions, long totalTemplates) {
            this.totalUsers = totalUsers;
            this.totalAnalyses = totalAnalyses;
            this.totalChatSessions = totalChatSessions;
            this.totalTemplates = totalTemplates;
        }

        public long getTotalUsers() { return totalUsers; }
        public long getTotalAnalyses() { return totalAnalyses; }
        public long getTotalChatSessions() { return totalChatSessions; }
        public long getTotalTemplates() { return totalTemplates; }
    }

    public static class ActivityEvent {
        private String type; // ANALYZER, ASSISTANT, GENERATOR, AUTH
        private String title;
        private String description;
        private String status; // SUCCESS, WARNING, ERROR
        private LocalDateTime timestamp;

        public ActivityEvent() {}
        public ActivityEvent(String type, String title, String description, String status, LocalDateTime timestamp) {
            this.type = type;
            this.title = title;
            this.description = description;
            this.status = status;
            this.timestamp = timestamp;
        }

        public String getType() { return type; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
