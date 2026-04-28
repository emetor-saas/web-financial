import { apiFetch } from '@/lib/apiClient';

const WIDGET_SCRIPT_DEFAULT = 'https://cdn.belvo.io/belvo-widget-1-stable.js';

export interface BelvoStatus {
  configured: boolean;
  env: string;
  /** URL base usada pela API (ex.: https://sandbox.belvo.com) */
  baseUrl?: string;
}

export async function fetchBelvoStatus(): Promise<BelvoStatus> {
  return apiFetch<BelvoStatus>('/api/integrations/belvo/status');
}

export async function createBelvoAccessToken(): Promise<{ access: string; env: string }> {
  return apiFetch<{ access: string; env: string }>('/api/integrations/belvo/access-token', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export interface BelvoConnectionDto {
  id: string;
  belvoLinkId: string;
  institutionName: string | null;
  institutionCode: string | null;
  status: string;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

export async function listBelvoConnections(): Promise<{ connections: BelvoConnectionDto[] }> {
  return apiFetch<{ connections: BelvoConnectionDto[] }>('/api/integrations/belvo/connections');
}

export async function registerBelvoLink(belvoLinkId: string): Promise<{ connection: BelvoConnectionDto }> {
  return apiFetch<{ connection: BelvoConnectionDto }>('/api/integrations/belvo/connections', {
    method: 'POST',
    body: JSON.stringify({ belvoLinkId }),
  });
}

export async function syncBelvoConnection(id: string): Promise<{
  ok: boolean;
  accountsSynced: number;
  transactionsSynced: number;
}> {
  return apiFetch(`/api/integrations/belvo/connections/${encodeURIComponent(id)}/sync`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteBelvoConnection(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/integrations/belvo/connections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

function widgetScriptUrl(): string {
  const u = import.meta.env.VITE_BELVO_WIDGET_SCRIPT_URL;
  return typeof u === 'string' && u.trim() !== '' ? u.trim() : WIDGET_SCRIPT_DEFAULT;
}

export function loadBelvoWidgetScript(): Promise<void> {
  const src = widgetScriptUrl();
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-belvo-widget="1"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.belvoWidget = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Não foi possível carregar o script Belvo: ${src}`));
    document.body.appendChild(s);
  });
}

type BelvoWidgetCallback = (linkId: string) => void;

export async function openBelvoConnectWidget(onLink: BelvoWidgetCallback): Promise<void> {
  const { access } = await createBelvoAccessToken();
  await loadBelvoWidgetScript();

  const sdk = (
    window as unknown as {
      belvoSDK?: {
        createWidget: (
          token: string,
          opts: {
            locale?: string;
            callback?: (link: string, institution?: unknown) => void;
            onExit?: () => void;
          },
        ) => void;
      };
    }
  ).belvoSDK;

  if (!sdk?.createWidget) {
    throw new Error(
      'Widget Belvo indisponível após carregar o script. Verifique VITE_BELVO_WIDGET_SCRIPT_URL ou a documentação da Belvo.',
    );
  }

  sdk.createWidget(access, {
    locale: 'pt',
    callback: (link: string) => {
      if (typeof link === 'string' && link) onLink(link);
    },
  });
}
