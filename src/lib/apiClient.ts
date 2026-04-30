const API_BASE_URL =
  import.meta.env.DEV
    ? '' // em desenvolvimento, usamos o proxy do Vite (mesma origem)
    : (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim() !== ''
        ? String(import.meta.env.VITE_API_URL)
        : '');

function buildUserFacingErrorMessage(status: number): string {
  if (status === 400) return 'Não foi possível processar sua solicitação.';
  if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'Não encontramos o recurso solicitado.';
  if (status === 409) return 'Conflito de dados. Atualize a página e tente novamente.';
  if (status === 422) return 'Os dados informados são inválidos.';
  if (status === 429) return 'Muitas tentativas em sequência. Aguarde e tente novamente.';
  if (status >= 500) return 'Estamos com instabilidade no momento. Tente novamente em instantes.';
  return 'Não foi possível concluir a operação.';
}

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
    // Evita expor detalhes internos da API para o usuário final.
    throw new Error(buildUserFacingErrorMessage(res.status));
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

