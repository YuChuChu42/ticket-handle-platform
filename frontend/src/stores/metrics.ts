import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as metricsApi from '@/api/metrics'
import type { MetricsSummary, TrendData } from '@/api/metrics'

export const useMetricsStore = defineStore('metrics', () => {
  // 状态
  const summary = ref<MetricsSummary>({
    today_count: '0',
    pending_count: '0',
    in_progress_count: '0',
    resolved_count: '0',
    closed_count: '0',
  })
  
  const trend = ref<TrendData[]>([])
  const loading = ref(false)

  // 获取统计摘要
  const fetchSummary = async () => {
    loading.value = true
    try {
      const { data } = await metricsApi.getSummary()
      
      if (data.success) {
        summary.value = data.data
      }
    } catch (error) {
      console.error('获取统计摘要失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取趋势数据
  const fetchTrend = async (days: number = 7) => {
    loading.value = true
    try {
      const { data } = await metricsApi.getTrend(days)
      
      if (data.success) {
        trend.value = data.data
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 刷新所有数据
  const refreshAll = async () => {
    await Promise.all([fetchSummary(), fetchTrend()])
  }

  return {
    summary,
    trend,
    loading,
    fetchSummary,
    fetchTrend,
    refreshAll,
  }
})

