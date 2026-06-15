const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'clinicflow'

interface SendMessageResult {
  messageId: string
  status: 'sent' | 'mocked'
}

async function isEvolutionAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_API_KEY },
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendMessage(
  phone: string,
  message: string
): Promise<SendMessageResult> {
  const available = await isEvolutionAvailable()

  if (!available) {
    console.log(`[WhatsApp MOCK] → ${phone}: ${message}`)
    return { messageId: `mock_${Date.now()}`, status: 'mocked' }
  }

  const res = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Evolution API error: ${error}`)
  }

  const data = await res.json()
  return { messageId: data.key?.id || data.messageId, status: 'sent' }
}

export async function getQRCode(): Promise<string | null> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.base64 || null
  } catch {
    return null
  }
}

export async function getConnectionStatus(): Promise<'connected' | 'disconnected' | 'unknown'> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
        signal: AbortSignal.timeout(3000),
      }
    )
    if (!res.ok) return 'unknown'
    const data = await res.json()
    return data.instance?.state === 'open' ? 'connected' : 'disconnected'
  } catch {
    return 'unknown'
  }
}

export function substituteTemplateVariables(
  template: string,
  vars: {
    nome_paciente?: string
    data_consulta?: string
    procedimento?: string
    nome_clinica?: string
  }
): string {
  return template
    .replace(/\{\{nome_paciente\}\}/g, vars.nome_paciente || '')
    .replace(/\{\{data_consulta\}\}/g, vars.data_consulta || '')
    .replace(/\{\{procedimento\}\}/g, vars.procedimento || '')
    .replace(/\{\{nome_clinica\}\}/g, vars.nome_clinica || '')
}
