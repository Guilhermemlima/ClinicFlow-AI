import OpenAI from 'openai'
import type { ClassifyIntentResult } from '@/types'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

const SYSTEM_PROMPT = `Você é um classificador de intenções para uma clínica médica brasileira.
Analise a mensagem do paciente e retorne APENAS um JSON:
{ "intent": "confirm" | "cancel" | "reschedule" | "question", "confidence": 0.0-1.0 }
Exemplos de confirm: SIM, sim, Confirmo, ok, tá bom, pode ser, confirmado, vou estar lá
Exemplos de cancel: NÃO, nao, não posso, cancelar, cancela, não vou poder, impossível
Exemplos de reschedule: remarcar, outro horário, mudou, não vou poder nessa data, posso em outro dia
Exemplos de question: quando, onde, qual, como, por que, preciso de, quanto custa
Retorne APENAS o JSON, sem texto adicional.`

export async function classifyIntent(
  message: string
): Promise<ClassifyIntentResult> {
  if (!process.env.OPENAI_API_KEY) {
    return classifyIntentLocal(message)
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0,
      max_tokens: 60,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) return classifyIntentLocal(message)

    const result = JSON.parse(content)
    return {
      intent: result.intent,
      confidence: result.confidence,
    }
  } catch {
    return classifyIntentLocal(message)
  }
}

function classifyIntentLocal(message: string): ClassifyIntentResult {
  const lower = message.toLowerCase().trim()

  const confirmPatterns = /^(sim|s|ok|confirmado|confirmo|vou|certo|claro|tá bom|ta bom|pode ser|positivo|afirmativo|vou estar|estarei)/i
  const cancelPatterns = /(não|nao|cancela|cancelar|cancelado|não posso|nao posso|impossível|imposivel|não vou|nao vou)/i
  const reschedulePatterns = /(remarcar|remarca|outro horário|outro dia|mudou|mudar|nova data|reagendar)/i

  if (confirmPatterns.test(lower)) return { intent: 'confirm', confidence: 0.95 }
  if (cancelPatterns.test(lower)) return { intent: 'cancel', confidence: 0.9 }
  if (reschedulePatterns.test(lower)) return { intent: 'reschedule', confidence: 0.85 }
  return { intent: 'question', confidence: 0.7 }
}
