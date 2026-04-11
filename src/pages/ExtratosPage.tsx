import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { uploadImportFile, listImportJobs } from '@/services/importJobs';
import { toast } from 'sonner';
import { Upload, FileText, RefreshCw, ArrowRight } from 'lucide-react';

const ExtratosPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao enviar arquivo. Tente novamente.';
      toast.error(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight">Importar Extratos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Envie arquivos de extrato bancário para alimentar automaticamente seu fluxo de caixa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw size={14} />
            Atualizar lista
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-primary/90 cursor-pointer">
            <Upload size={14} />
            {uploading ? 'Enviando...' : 'Enviar extrato'}
            <input
              type="file"
              accept=".csv,.ofx,.pdf,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      </header>

      <section className="card-solid rounded-2xl p-4 sm:p-6">
        <h2 className="font-display font-semibold tracking-tight mb-4 flex items-center gap-2">
          <FileText size={16} />
          Histórico de uploads
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum upload encontrado ainda. Envie seu primeiro extrato para começar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/60 hover:bg-accent/50">
                    <td className="py-2.5 px-2">{job.fileName}</td>
                    <td className="py-2.5 px-2 text-xs uppercase text-muted-foreground">
                      {job.fileType}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">
                      {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-2.5 px-2 text-xs font-medium">
                      {job.status}
                    </td>
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

