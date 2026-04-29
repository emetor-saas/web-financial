import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { uploadImportFile, listImportJobs, ImportUploadError } from '@/services/importJobs';
import {
  fetchBelvoStatus,
  listBelvoConnections,
  openBelvoConnectWidget,
  registerBelvoLink,
  syncBelvoConnection,
  deleteBelvoConnection,
} from '@/services/belvo';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  RefreshCw,
  ArrowRight,
  Landmark,
  Link2,
  Loader2,
  Trash2,
  CloudDownload,
} from 'lucide-react';

const ExtratosPage = () => {
  const SHOW_BELVO_SECTION = false;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [belvoOpening, setBelvoOpening] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: listImportJobs,
  });

  const { data: belvoStatus } = useQuery({
    queryKey: ['belvo-status'],
    queryFn: fetchBelvoStatus,
    staleTime: 60_000,
  });

  const { data: belvoList, refetch: refetchBelvo } = useQuery({
    queryKey: ['belvo-connections'],
    queryFn: listBelvoConnections,
    enabled: belvoStatus?.configured === true,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImportFile(file);
      toast.success('Upload recebido. O processamento será iniciado em instantes.');
      await queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    } catch (error) {
      if (error instanceof ImportUploadError) {
        const details =
          error.details && typeof error.details === 'object'
            ? (error.details as Record<string, unknown>)
            : null;
        const isTrialExpired = error.status === 402 || details?.code === 'trial_expired';
        if (isTrialExpired) {
          toast.error('Seu período de teste acabou. Assine um plano para continuar importando extratos.');
          navigate('/app/planos');
          return;
        }
      }
      const message =
        error instanceof Error ? error.message : 'Erro ao enviar arquivo. Tente novamente.';
      toast.error(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleOpenBelvo = async () => {
    setBelvoOpening(true);
    try {
      await openBelvoConnectWidget(async (linkId) => {
        try {
          await registerBelvoLink(linkId);
          toast.success('Banco conectado. Sincronize para trazer contas e lançamentos.');
          await queryClient.invalidateQueries({ queryKey: ['belvo-connections'] });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Erro ao registrar link Belvo.');
        }
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o widget Belvo.');
    } finally {
      setBelvoOpening(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await syncBelvoConnection(id);
      toast.success(
        `Sincronizado: ${res.accountsSynced} conta(s), ${res.transactionsSynced} lançamento(s).`,
      );
      await refetchBelvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na sincronização Belvo.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Remover esta conexão Open Finance? Os lançamentos já importados permanecem no sistema.')) {
      return;
    }
    try {
      await deleteBelvoConnection(id);
      toast.success('Conexão removida.');
      await refetchBelvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover conexão.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Extratos e dados</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Conecte sua instituição via Open Finance (recomendado) ou importe arquivos manualmente.
          </p>
        </div>
      </header>

      {SHOW_BELVO_SECTION && (
        <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-4 border border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
                Open Finance — Belvo
                <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                  principal
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Conexão segura com a rede de Open Finance no Brasil, via{' '}
                <a
                  href="https://developers.belvo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Belvo
                </a>
                . Use o ambiente sandbox com as chaves do painel Belvo.
              </p>
            </div>
          </div>
          {belvoStatus?.configured ? (
            <button
              type="button"
              onClick={() => handleOpenBelvo()}
              disabled={belvoOpening}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow hover:bg-primary/90 disabled:opacity-60 shrink-0"
            >
              {belvoOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Conectar banco
            </button>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs">
              Backend sem credenciais Belvo. Configure{' '}
              <code className="text-[11px] bg-muted px-1 rounded">BELVO_SECRET_ID</code> e{' '}
              <code className="text-[11px] bg-muted px-1 rounded">BELVO_SECRET_PASSWORD</code> na API.
            </p>
          )}
        </div>

        {belvoStatus?.configured && (
          <div className="rounded-xl border border-border bg-muted/30 overflow-x-auto">
            {!belvoList?.connections?.length ? (
              <p className="text-sm text-muted-foreground p-4">
                Nenhuma instituição conectada ainda. Use &quot;Conectar banco&quot; para abrir o widget Belvo.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 px-3 text-xs text-muted-foreground font-semibold uppercase">
                      Instituição
                    </th>
                    <th className="py-2.5 px-3 text-xs text-muted-foreground font-semibold uppercase">
                      Status
                    </th>
                    <th className="py-2.5 px-3 text-xs text-muted-foreground font-semibold uppercase">
                      Última sync
                    </th>
                    <th className="py-2.5 px-3 text-right text-xs text-muted-foreground font-semibold uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {belvoList.connections.map((c) => (
                    <tr key={c.id} className="border-b border-border/60">
                      <td className="py-2.5 px-3">
                        {c.institutionName || 'Instituição'}
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                          {c.belvoLinkId}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs">{c.status}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleSync(c.id)}
                          disabled={syncingId === c.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent"
                        >
                          {syncingId === c.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CloudDownload className="h-3 w-3" />
                          )}
                          Sincronizar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConnection(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 text-destructive px-2 py-1 text-[11px] font-medium hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        </section>
      )}

      <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
              <FileText size={18} />
              Importar extrato manualmente
              <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                alternativa
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Envie OFX, CSV, Excel ou PDF para revisar e importar lançamentos.
            </p>
          </div>
          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw size={14} />
              Atualizar lista
            </button>
            <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent cursor-pointer">
              <Upload size={14} />
              {uploading ? 'Enviando...' : 'Enviar arquivo'}
              <input
                type="file"
                accept=".csv,.ofx,.pdf,.xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum upload encontrado ainda. Envie um extrato ou use Open Finance acima.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">
                    Arquivo
                  </th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">
                    Tipo
                  </th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">
                    Tamanho
                  </th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">
                    Criado em
                  </th>
                  <th className="text-right py-2.5 px-2" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/60 hover:bg-accent/50">
                    <td className="py-2.5 px-2 max-w-[220px] truncate" title={job.fileName}>{job.fileName}</td>
                    <td className="py-2.5 px-2 text-xs uppercase text-muted-foreground">{job.fileType}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">
                      {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-2.5 px-2 text-xs font-medium">{job.status}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/extratos/${job.id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        Revisar
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExtratosPage;
