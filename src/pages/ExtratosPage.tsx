import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { uploadImportFile, listImportJobs, ImportUploadError } from '@/services/importJobs';
import { submitOpenFinanceInterest } from '@/services/actionPlan';
import { toast } from 'sonner';
import { Upload, FileText, RefreshCw, ArrowRight } from 'lucide-react';

const ExtratosPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [surveySent, setSurveySent] = useState(false);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: listImportJobs,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImportFile(file);
      toast.success('Upload recebido. O processamento será iniciado em instantes.');
      await queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['journey-current'] });
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

  const handleSurvey = async (interest: 'yes' | 'maybe' | 'no') => {
    try {
      await submitOpenFinanceInterest(interest);
      setSurveySent(true);
      toast.success('Obrigado pelo retorno!');
    } catch {
      toast.error('Não foi possível registrar seu interesse.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Importar extrato</h1>
          <p className="text-muted-foreground text-sm mt-0.5 max-w-xl">
            Envie OFX ou CSV do seu banco (recomendado). PDF também funciona, com revisão antes de importar.
          </p>
        </div>
      </header>

      <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
              <FileText size={18} />
              Enviar arquivo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Após o upload, revise as linhas e clique em &quot;Concluir importação&quot;.
            </p>
          </div>
          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              <RefreshCw size={14} />
              Atualizar lista
            </button>
            <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 cursor-pointer">
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
            Nenhum upload ainda. Exporte o extrato no internet banking (OFX ou CSV) e envie aqui.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">Arquivo</th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">Tipo</th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">Status</th>
                  <th className="text-left py-2.5 px-2 text-xs text-muted-foreground font-semibold uppercase">Criado em</th>
                  <th className="text-right py-2.5 px-2" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/60 hover:bg-accent/50">
                    <td className="py-2.5 px-2 max-w-[220px] truncate">{job.fileName}</td>
                    <td className="py-2.5 px-2 text-xs uppercase text-muted-foreground">{job.fileType}</td>
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
                        Revisar <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-sm font-medium">Conexão automática com o banco (Open Finance)</p>
        <p className="text-xs text-muted-foreground">
          Ainda não está disponível. Você teria interesse quando lançarmos?
        </p>
        {surveySent ? (
          <p className="text-xs text-emerald-600">Resposta registrada. Obrigado!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(['yes', 'maybe', 'no'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleSurvey(v)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                {v === 'yes' ? 'Sim, tenho interesse' : v === 'maybe' ? 'Talvez' : 'Não'}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExtratosPage;
