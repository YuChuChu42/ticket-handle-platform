import http from './http'

export interface MetricsSummary {
  today_count: string
  pending_count: string
  in_progress_count: string
  resolved_count: string
  closed_count: string
}

export interface TrendData {
  date: string
  created_count: string
  resolved_count: string
}

// 获取统计摘要
export const getSummary = () => {
  return http.get<{ success: boolean; data: MetricsSummary }>('/metrics/summary')
}

// 获取趋势数据
export const getTrend = (days: number = 7) => {
  return http.get<{ success: boolean; data: TrendData[] }>('/metrics/trend', {
    params: { days },
  })
}

