import { describe, it, expect, vi } from 'vitest'
import { mapWithConcurrency } from '../lib/concurrency'

describe('mapWithConcurrency', () => {
  it('processes every item exactly once', async () => {
    const items = Array.from({ length: 23 }, (_, i) => i)
    const processed: number[] = []

    await mapWithConcurrency(items, 5, async (item) => {
      processed.push(item)
    })

    expect(processed.sort((a, b) => a - b)).toEqual(items)
  })

  it('never runs more than `concurrency` workers at the same time', async () => {
    let active = 0
    let maxActive = 0

    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active--
    })

    expect(maxActive).toBeLessThanOrEqual(4)
  })

  it('continues processing remaining items even if one worker throws', async () => {
    const processed: number[] = []
    const failingWorker = vi.fn(async (item: number) => {
      if (item === 2) throw new Error('boom')
      processed.push(item)
    })

    await mapWithConcurrency([1, 2, 3, 4], 2, failingWorker)

    expect(processed.sort()).toEqual([1, 3, 4])
  })
})
