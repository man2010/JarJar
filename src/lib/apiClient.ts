type ApiResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: { message: payload.error || 'Une erreur est survenue' }, count: null };
    }
    return { data: payload.data ?? null, error: null, count: payload.count ?? null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Erreur reseau' }, count: null };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
};
