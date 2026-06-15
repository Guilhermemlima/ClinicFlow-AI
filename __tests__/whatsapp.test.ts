import { describe, it, expect, vi } from 'vitest'

vi.mock('openai')

function classifyIntentLocal(message: string): { intent: string; confidence: number } {
  const lower = message.toLowerCase().trim()

  const confirmPatterns = /^(sim|s|ok|confirmado|confirmo|vou|certo|claro|tá bom|ta bom|pode ser|positivo|afirmativo|vou estar|estarei)/i
  const cancelPatterns = /(não|nao|cancela|cancelar|cancelado|não posso|nao posso|impossível|imposivel|não vou|nao vou)/i
  const reschedulePatterns = /(remarcar|remarca|outro horário|outro dia|mudou|mudar|nova data|reagendar)/i

  if (confirmPatterns.test(lower)) return { intent: 'confirm', confidence: 0.95 }
  if (cancelPatterns.test(lower)) return { intent: 'cancel', confidence: 0.9 }
  if (reschedulePatterns.test(lower)) return { intent: 'reschedule', confidence: 0.85 }
  return { intent: 'question', confidence: 0.7 }
}

describe('Intent classification', () => {
  it('should classify "SIM" as confirm', () => {
    const result = classifyIntentLocal('SIM')
    expect(result.intent).toBe('confirm')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('should classify "sim" (lowercase) as confirm', () => {
    const result = classifyIntentLocal('sim')
    expect(result.intent).toBe('confirm')
  })

  it('should classify "Confirmo" as confirm', () => {
    const result = classifyIntentLocal('Confirmo')
    expect(result.intent).toBe('confirm')
  })

  it('should classify "ok" as confirm', () => {
    const result = classifyIntentLocal('ok')
    expect(result.intent).toBe('confirm')
  })

  it('should classify "não posso ir" as cancel', () => {
    const result = classifyIntentLocal('não posso ir')
    expect(result.intent).toBe('cancel')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('should classify "NÃO" as cancel', () => {
    const result = classifyIntentLocal('NÃO')
    expect(result.intent).toBe('cancel')
  })

  it('should classify "cancelar" as cancel', () => {
    const result = classifyIntentLocal('cancelar')
    expect(result.intent).toBe('cancel')
  })

  it('should classify "posso remarcar?" as reschedule', () => {
    const result = classifyIntentLocal('posso remarcar?')
    expect(result.intent).toBe('reschedule')
    expect(result.confidence).toBeGreaterThan(0.7)
  })

  it('should classify "quero reagendar" as reschedule', () => {
    const result = classifyIntentLocal('quero reagendar para outro dia')
    expect(result.intent).toBe('reschedule')
  })

  it('should classify unknown messages as question', () => {
    const result = classifyIntentLocal('qual o endereço da clínica?')
    expect(result.intent).toBe('question')
  })

  it('should return confidence scores between 0 and 1', () => {
    const messages = ['sim', 'não', 'remarcar', 'onde fica?']
    messages.forEach((msg) => {
      const { confidence } = classifyIntentLocal(msg)
      expect(confidence).toBeGreaterThan(0)
      expect(confidence).toBeLessThanOrEqual(1)
    })
  })
})
