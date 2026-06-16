// Rate limiter em memória — suficiente para uma única instância serverless
// "quente" (mesmo processo entre invocações na Vercel) e para o uso local.
// CAVEAT: em produção com múltiplas instâncias/regiões, cada uma tem seu
// próprio contador, então o limite real é (limite × nº de instâncias).
// Para um limite verdadeiramente distribuído, migrar para Upstash Redis
// (@upstash/ratelimit) — mas isto já corta 100% dos casos de abuso de
// instância única e elimina o risco mais simples de brute force/flood.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Evita crescimento ilimitado do Map em processos de longa duração.
function cleanup(now: number) {
  if (buckets.size < 5000) return
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key)
  })
}

/**
 * Retorna `true` se a requisição está dentro do limite (e incrementa o
 * contador), ou `false` se o limite foi excedido.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  cleanup(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
