export interface MemoryStats {
  usedMB: number
  totalMB: number
  maxMB: number
  percentUsed: number
}

export interface CpuStats {
  availableCores: number
  systemLoadAverage: number
  estimatedLoadPercent: number
}

export interface DatabaseStats {
  activeConnections: number
  idleConnections: number
  totalPoolSize: number
  poolName: string
}

export interface PlatformCounters {
  totalUsers: number
  totalAnalyses: number
  totalChatSessions: number
  totalTemplates: number
}

export interface ActivityEvent {
  type: "ANALYZER" | "ASSISTANT" | "GENERATOR" | "AUTH"
  title: string
  description: string
  status: "SUCCESS" | "WARNING" | "ERROR"
  timestamp: string
}

export interface DashboardMetricsResponse {
  memory: MemoryStats
  cpu: CpuStats
  database: DatabaseStats
  counters: PlatformCounters
  recentActivities: ActivityEvent[]
  systemStatus: string
  uptimeSeconds: number
}
