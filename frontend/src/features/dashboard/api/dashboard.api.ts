import api from "@/lib/axios"
import { DashboardMetricsResponse } from "../types/dashboard.types"

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await api.get<DashboardMetricsResponse>("/dashboard/metrics")
    return response.data
  },
}
