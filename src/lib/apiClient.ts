const API_BASE_URL =
  import.meta.env.DEV
    ? '' // em desenvolvimento, usamos o proxy do Vite (mesma origem)
    : (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim() !== ''
        ? String(import.meta.env.VITE_API_URL)
        : '');

function getApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = getApiUrl(path);

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    // Aqui podemos sofisticar depois (401, 403, etc.)
    const text = await res.text().catch(() => '');
    throw new Error(
      `Erro na API (${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`,
    );
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

