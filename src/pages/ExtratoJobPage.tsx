import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchImportJobDetail,
  updateImportRow,
  approveSelectedRows,
  commitImport,
  type ImportRow,
} from '@/services/importJobRows';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, AlertTriangle, FileSpreadsheet, CheckCheck } from 'lucide-react';

const ExtratoJobPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['import-job', id],
    queryFn: () => fetchImportJobDetail(id!),
    enabled: Boolean(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveSelectedRows(id!),
    onSuccess: () => {
      toast.success('Linhas selecionadas aprovadas.');
      queryClient.invalidateQueries({ queryKey: ['import-job', id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar linhas.');
    },
  });

  const commitMutation = useMutation({
    mutationFn: () => commitImport(id!),
    onSuccess: (res) => {
      toast.success(`Importação concluída. ${res.importedCount} lançamentos criados.`);
      queryClient.invalidateQueries({ queryKey: ['import-job', id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao concluir importação.');
    },
  });

  const toggleSelected = async (row: ImportRow) => {
    if (row.isProcessed) return;
    try {
      await updateImportRow(row.review.categoryId ?? '', row.id, {
        selectedForImport: !row.review.selectedForImport,
      });
      queryClient.invalidateQueries({ queryKey: ['import-job', id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar linha.');
    }
  };

  if (!id) {
    return null;
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground">Carregando linhas do extrato...</p>
      </div>
    );
  }

  const { job, summary, rows } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/app/extratos')}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
              <FileSpreadsheet size={20} />
              Revisar extrato
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {job.fileName} • {job.fileType} • Status: {job.status}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || commitMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <CheckCircle2 size={14} />
            Aprovar selecionadas
          </button>
          <button
            type="button"
            onClick={() => commitMutation.mutate()}
            disabled={commitMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-primary/90 disabled:opacity-60"
          >
            <CheckCheck size={14} />
            {commitMutation.isPending ? 'Importando...' : 'Concluir importação'}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-solid rounded-2xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Linhas
          </p>
          <p className="text-2xl font-display font-bold">{summary.total}</p>
          <p className="text-xs text-muted-foreground">
            {summary.selected} selecionadas • {summary.approved} aprovadas
          </p>
        </div>
        <div className="card-solid rounded-2xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Importação
          </p>
          <p className="text-2xl font-display font-bold">
            {summary.imported}/{summary.total}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.pending} pendentes • {summary.rejected} rejeitadas
          </p>
        </div>
        <div className="card-solid rounded-2xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Duplicadas / conflitos
          </p>
          <p className="text-2xl font-display font-bold">{summary.duplicates}</p>
          <p className="text-xs text-muted-foreground">
            {summary.potentialConflicts} com potencial conflito
          </p>
        </div>
      </section>

      <section className="card-solid rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
            Linhas do arquivo
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle size={12} className="text-warning" />
            Clique para marcar quais linhas devem ser importadas.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-2">#</th>
                <th className="text-left py-2.5 px-2">Data</th>
                <th className="text-left py-2.5 px-2">Descrição</th>
                <th className="text-left py-2.5 px-2">Valor</th>
                <th className="text-left py-2.5 px-2">Categoria</th>
                <th className="text-left py-2.5 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 hover:bg-accent/40 cursor-pointer"
                  onClick={() => toggleSelected(row)}
                >
                  <td className="py-2.5 px-2 font-mono text-[11px]">{row.rowNumber}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">
                    {row.review.date
                      ? new Date(row.review.date).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td className="py-2.5 px-2">{row.review.description}</td>
                  <td className="py-2.5 px-2 font-mono text-right">
                    {row.review.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground">
                    {row.review.categoryName ?? 'Sem categoria'}
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.review.reviewStatus === 'IMPORTED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : row.review.reviewStatus === 'APPROVED'
                            ? 'bg-blue-500/10 text-blue-500'
                            : row.review.reviewStatus === 'REJECTED'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {row.review.reviewStatus.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ExtratoJobPage;

