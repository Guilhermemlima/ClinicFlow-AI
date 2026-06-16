import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../lib/rateLimit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`
    const r1 = checkRateLimit(key, 3, 1000)
    const r2 = checkRateLimit(key, 3, 1000)
    const r3 = checkRateLimit(key, 3, 1000)
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r3.allowed).toBe(true)
  })

  it('blocks requests once the limit is exceeded', () => {
    const key = `test-${Math.random()}`
    checkRateLimit(key, 2, 1000)
    checkRateLimit(key, 2, 1000)
    const blocked = checkRateLimit(key, 2, 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets after the window expires', async () => {
    const key = `test-${Math.random()}`
    checkRateLimit(key, 1, 50)
    const blocked = checkRateLimit(key, 1, 50)
    expect(blocked.allowed).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 60))

    const allowed = checkRateLimit(key, 1, 50)
    expect(allowed.allowed).toBe(true)
  })

  it('tracks separate keys independently', () => {
    const a = checkRateLimit(`key-a-${Math.random()}`, 1, 1000)
    const b = checkRateLimit(`key-b-${Math.random()}`, 1, 1000)
    expect(a.allowed).toBe(true)
    expect(b.allowed).toBe(true)
  })
})
