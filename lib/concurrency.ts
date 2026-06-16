/**
 * Executa `worker` para cada item de `items`, com no máximo `concurrency`
 * execuções em paralelo. Erros individuais não interrompem o lote — cada
 * item resolve ou falha de forma independente (como Promise.allSettled).
 */
export async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0

  async function runNext(): Promise<void> {
    const index = cursor++
    if (index >= items.length) return
    try {
      await worker(items[index], index)
    } catch {
      // worker já deve tratar seus próprios erros; isto é só uma rede de
      // segurança para não deixar uma rejeição não tratada matar o lote.
    }
    return runNext()
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runNext)
  await Promise.all(workers)
}
