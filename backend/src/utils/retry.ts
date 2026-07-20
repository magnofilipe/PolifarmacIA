function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Erros transitórios do Gemini que valem uma nova tentativa. */
function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("overloaded") ||
    msg.includes("high demand")
  );
}

/** Extrai o retryDelay sugerido pela API (em ms); se ausente, usa backoff exponencial. */
function backoffMs(error: unknown, attempt: number): number {
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  if (match?.[1]) return Math.ceil(Number(match[1]) * 1000) + 1000;
  return Math.min(2 ** attempt * 1000, 30_000);
}

export interface RetryOptions {
  maxRetries?: number;
  label?: string;
}

/** Executa `fn`, repetindo em erros transitórios (429/503/500) com espera adequada. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? 5;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryable(error) && attempt < maxRetries) {
        const waitMs = backoffMs(error, attempt);
        const where = options.label ? `[${options.label}] ` : "";
        console.warn(`  · ${where}erro transitório, aguardando ${Math.round(waitMs / 1000)}s (tentativa ${attempt + 1}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
}
