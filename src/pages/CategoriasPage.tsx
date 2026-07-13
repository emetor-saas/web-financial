import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from '@/services/categories';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.03 },
});

const COLOR_PRESETS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];

type FormState = {
  name: string;
  color: string;
  isEssential: boolean;
};

const emptyForm: FormState = {
  name: '',
  color: '#64748b',
  isEssential: false,
};

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        icon: null,
        color: form.color || null,
        isEssential: form.isEssential,
      };
      if (!payload.name) throw new Error('Informe o nome da categoria');
      if (editing) return updateCategory(editing.id, payload);
      return createCategory(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Categoria atualizada' : 'Categoria criada');
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Categoria removida');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      color: category.color ?? '#64748b',
      isEssential: category.isEssential,
    });
    setOpen(true);
  };

  const defaults = categories.filter((c) => c.isDefault);
  const custom = categories.filter((c) => !c.isDefault);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div {...anim(0)} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Tags size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Categorias</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Padrões Clareza + as suas. Use ao revisar extratos e nos lançamentos.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Nova categoria
        </button>
      </motion.div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Carregando categorias…
        </div>
      )}

      {!isLoading && (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Padrões Clareza
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {defaults.map((category, i) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={i}
                  onEdit={() => openEdit(category)}
                  onDelete={() => {
                    if (
                      confirm(
                        `"${category.name}" é padrão. Remover mesmo assim? Você pode recriá-la depois.`,
                      )
                    ) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                  deleting={deleteMutation.isPending}
                />
              ))}
              {defaults.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  As categorias padrão serão criadas automaticamente.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Suas categorias
            </h2>
            {custom.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ainda não há categorias personalizadas. Crie as que fazem sentido para a sua casa.
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/60"
                >
                  <Plus size={14} />
                  Criar categoria
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {custom.map((category, i) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    index={i}
                    onEdit={() => openEdit(category)}
                    onDelete={() => {
                      if (confirm(`Remover a categoria "${category.name}"?`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditing(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Nome</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Pet, Farmácia, Presentes"
                required
                maxLength={80}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Cor</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    className={`w-7 h-7 rounded-full border-2 ${
                      form.color === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isEssential}
                onChange={(e) => setForm((f) => ({ ...f, isEssential: e.target.checked }))}
              />
              Marcar como gasto essencial
            </label>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
  deleting,
}: {
  category: Category;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const txCount = category._count?.transactions ?? 0;
  return (
    <motion.div
      {...anim(1 + index)}
      className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
    >
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 border border-border/60"
        style={{ backgroundColor: category.color ?? '#64748b' }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm truncate">{category.name}</h3>
          {category.isDefault && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Padrão
            </span>
          )}
          {category.isEssential && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary">
              Essencial
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {txCount} lançamento{txCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remover"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
