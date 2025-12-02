type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type FetchOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  tokenOverride?: string;
  timeoutMs?: number;
};

export async function apiFetch<T = any>(
  baseUrl: string,
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  const token = options.tokenOverride || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: controller.signal,
  }).catch((err) => {
    clearTimeout(timeout);
    throw err;
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const message = await safeParseError(res);
    throw new Error(`API error ${res.status}: ${message}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

async function safeParseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.message) return data.message as string;
    return JSON.stringify(data);
  } catch {
    return res.statusText || 'Unknown error';
  }
}
