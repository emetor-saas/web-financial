import { useMemo, useState } from 'react';
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
import { ArrowLeft, CheckCircle2, AlertTriangle, FileSpreadsheet, CheckCheck, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type EditableStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type EditFormState = {
  date: string;
  description: string;
  merchant: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId: string;
  reviewStatus: EditableStatus;
  notes: string;
  selectedForImport: boolean;
};

function toInputDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - tzOffsetMs);
  return localDate.toISOString().slice(0, 10);
}

const ExtratoJobPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    date: '',
    description: '',
    merchant: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    reviewStatus: 'PENDING',
    notes: '',
    selectedForImport: false,
  });

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
      await updateImportRow(id!, row.id, {
        selectedForImport: !row.review.selectedForImport,
      });
      queryClient.invalidateQueries({ queryKey: ['import-job', id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar linha.');
    }
  };

  const openEditor = (row: ImportRow) => {
    if (row.isProcessed) return;
    setEditingRow(row);
    setEditForm({
      date: toInputDate(row.review.date),
      description: row.review.description,
      merchant: row.review.merchant ?? '',
      amount: row.review.amount.toFixed(2),
      type: row.review.type,
      categoryId: row.review.categoryId ?? '',
      reviewStatus:
        row.review.reviewStatus === 'PENDING' ||
        row.review.reviewStatus === 'APPROVED' ||
        row.review.reviewStatus === 'REJECTED'
          ? row.review.reviewStatus
          : 'PENDING',
      notes: row.review.notes ?? '',
      selectedForImport: row.review.selectedForImport,
    });
  };

  const closeEditor = () => {
    if (savingEdit) return;
    setEditingRow(null);
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

  const { job, summary, rows, categories } = data;
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const saveRowEdit = async () => {
    if (!editingRow) return;

    const amount = Number(editForm.amount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }
    if (!editForm.description.trim()) {
      toast.error('Descrição é obrigatória.');
      return;
    }

    setSavingEdit(true);
    try {
      await updateImportRow(id, editingRow.id, {
        date: editForm.date ? editForm.date : null,
        description: editForm.description.trim(),
        merchant: editForm.merchant.trim() ? editForm.merchant.trim() : null,
        amount,
        type: editForm.type,
        categoryId: editForm.categoryId || null,
        reviewStatus: editForm.reviewStatus,
        notes: editForm.notes.trim() ? editForm.notes.trim() : null,
        selectedForImport: editForm.selectedForImport,
      });
      toast.success('Linha atualizada com sucesso.');
      setEditingRow(null);
      queryClient.invalidateQueries({ queryKey: ['import-job', id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar edição.');
    } finally {
      setSavingEdit(false);
    }
  };

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
            Marque para importar e use o ícone para editar.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-2">Importar</th>
                <th className="text-left py-2.5 px-2">#</th>
                <th className="text-left py-2.5 px-2">Data</th>
                <th className="text-left py-2.5 px-2">Descrição</th>
                <th className="text-left py-2.5 px-2">Valor</th>
                <th className="text-left py-2.5 px-2">Categoria</th>
                <th className="text-left py-2.5 px-2">Status</th>
                <th className="text-left py-2.5 px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 hover:bg-accent/20"
                >
                  <td className="py-2.5 px-2">
                    <input
                      type="checkbox"
                      checked={row.review.selectedForImport}
                      disabled={row.isProcessed}
                      onChange={() => void toggleSelected(row)}
                    />
                  </td>
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
                  <td className="py-2.5 px-2">
                    <button
                      type="button"
                      onClick={() => openEditor(row)}
                      disabled={row.isProcessed}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(editingRow)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar linha {editingRow?.rowNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">
              Data
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Valor
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Descrição
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Estabelecimento
              <input
                type="text"
                value={editForm.merchant}
                onChange={(e) => setEditForm((prev) => ({ ...prev, merchant: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Tipo
              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    type: e.target.value as 'INCOME' | 'EXPENSE' | 'TRANSFER',
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
                <option value="TRANSFER">Transferência</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Categoria
              <select
                value={editForm.categoryId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Sem categoria</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Status
              <select
                value={editForm.reviewStatus}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    reviewStatus: e.target.value as EditableStatus,
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Importar no commit
              <select
                value={editForm.selectedForImport ? 'yes' : 'no'}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    selectedForImport: e.target.value === 'yes',
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Observações
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={closeEditor}
              disabled={savingEdit}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void saveRowEdit()}
              disabled={savingEdit}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {savingEdit ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtratoJobPage;

