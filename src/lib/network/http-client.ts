import { runtimeTuning } from '@/lib/config/runtime-tuning';
import { logger } from '@/lib/utils/logger';

type RequestInitWithNext = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const inflightGetRequests = new Map<string, Promise<unknown>>();

async function parseErrorResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return json?.error || json?.message || JSON.stringify(json);
    }

    const text = await response.text();
    return text || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init: RequestInitWithNext = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const requestKey = method === 'GET'
    ? `${typeof input === 'string' ? input : input.toString()}::${JSON.stringify(init.headers || {})}`
    : null;

  if (requestKey && inflightGetRequests.has(requestKey)) {
    return inflightGetRequests.get(requestKey) as Promise<T>;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtimeTuning.performance.network.requestTimeoutMs);
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const requestPromise = (async () => {
    const response = await fetch(input, {
      ...init,
      keepalive: runtimeTuning.performance.network.keepAlive,
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await parseErrorResponse(response);
      const logPayload = {
        status: response.status,
        message,
      };

      if (response.status >= 500) {
        logger.error(`HTTP ${method} ${typeof input === 'string' ? input : input.toString()} failed`, logPayload);
      } else {
        logger.warn(`HTTP ${method} ${typeof input === 'string' ? input : input.toString()} failed`, logPayload);
      }

      throw new Error(message);
    }

    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
    logger.info(`HTTP ${method} ${typeof input === 'string' ? input : input.toString()} completed`, {
      durationMs: Math.round(elapsed),
    });

    return await response.json();
  })();

  if (requestKey) {
    inflightGetRequests.set(requestKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (requestKey) {
      inflightGetRequests.delete(requestKey);
    }
    clearTimeout(timeout);
  }
}
