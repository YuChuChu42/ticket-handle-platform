import { describe, it, expect } from 'vitest'
import {
  formatDate,
  getStatusText,
  getPriorityText,
  debounce,
} from '../utils/format'

describe('format utils', () => {
  it('formatDate should format date correctly', () => {
    const date = '2024-01-15T10:30:00Z'
    const formatted = formatDate(date)
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('getStatusText should return correct text', () => {
    expect(getStatusText('open')).toBe('待处理')
    expect(getStatusText('in_progress')).toBe('处理中')
    expect(getStatusText('resolved')).toBe('已解决')
    expect(getStatusText('closed')).toBe('已关闭')
  })

  it('getPriorityText should return correct text', () => {
    expect(getPriorityText('low')).toBe('低')
    expect(getPriorityText('mid')).toBe('中')
    expect(getPriorityText('high')).toBe('高')
  })

  it('debounce should delay function execution', async () => {
    let count = 0
    const increment = () => count++
    const debouncedIncrement = debounce(increment, 100)

    debouncedIncrement()
    debouncedIncrement()
    debouncedIncrement()

    expect(count).toBe(0)

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(count).toBe(1)
  })
})

