import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Compass,
  CreditCard,
  Crown,
  FileUp,
  Layers,
  Loader2,
  PiggyBank,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wand2,
  Zap,
  Star,
  Lock,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getScoreColor } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CREST_STYLES,
  fetchFamilyOverview,
  generateFamilyCrest,
  uploadFamilyCrest,
  SYMBOL_OPTIONS,
  TIER_COLORS,
  type CrestStyle,
  type FamilyAchievement,
} from '@/services/family';

const ICON_MAP: Record<string, typeof Trophy> = {
  compass: Compass,
  'file-up': FileUp,
  zap: Zap,
  shield: Shield,
  target: Target,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  crown: Crown,
  users: Users,
  sparkles: Sparkles,
  layers: Layers,
  award: Award,
  trophy: Trophy,
};

const anim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.35 },
});

function AchievementCard({ achievement, index }: { achievement: FamilyAchievement; index: number }) {
  const Icon = ICON_MAP[achievement.icon] ?? Star;
  const tierClass = TIER_COLORS[achievement.tier];

  return (
    <motion.div
      {...anim(index)}
      className={cn(
        'relative rounded-2xl border p-4 transition-all duration-300',
        achievement.unlocked
          ? `bg-gradient-to-br ${tierClass} shadow-lg`
          : 'bg-muted/30 border-border/60 opacity-70 grayscale',
      )}
    >
      {!achievement.unlocked && (
        <div className="absolute top-3 right-3 text-muted-foreground/80">
          <Lock size={14} />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            achievement.unlocked ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight">{achievement.title}</p>
          <p className={cn('text-xs mt-1', achievement.unlocked ? 'text-white/85' : 'text-muted-foreground')}>
            {achievement.description}
          </p>
          <p className={cn('text-[10px] font-bold uppercase tracking-wider mt-2', achievement.unlocked ? 'text-white/70' : 'text-primary')}>
            +{achievement.xp} XP · {achievement.tier}
          </p>
        </div>
      </div>
      {achievement.unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-background flex items-center justify-center"
        >
          <Star size={10} className="text-emerald-950 fill-emerald-950" />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MinhaCasaPage() {
  const queryClient = useQueryClient();
  const [style, setStyle] = useState<Exclude<CrestStyle, 'upload'>>('classic');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['Casa & lar', 'Prosperidade']);
  const [motto, setMotto] = useState('');
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [uploadMotto, setUploadMotto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['family-overview'],
    queryFn: fetchFamilyOverview,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateFamilyCrest({
        style,
        symbols: selectedSymbols,
        motto: motto.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-overview'] });
      toast.success('Brasão da casa criado!', {
        description: 'Sua conquista "Portador do Brasão" foi desbloqueada.',
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível gerar o brasão.');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadFamilyCrest({
        file,
        motto: uploadMotto.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-overview'] });
      toast.success('Brasão enviado!', {
        description: 'Sua imagem passou a ser o brasão da casa.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível enviar o brasão.');
    },
  });

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!okType) {
      toast.error('Use JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter até 5MB.');
      return;
    }
    uploadMutation.mutate(file);
  };
  const unlockedAchievements = useMemo(
    () => (data?.achievements ?? []).filter((a) => a.unlocked),
    [data?.achievements],
  );

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : prev.length < 4 ? [...prev, symbol] : prev,
    );
  };

  if (isLoading || !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-xl w-72" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { gamification, crest } = data;
  const canGenerate = data.crestGenerationsRemaining > 0 && !generateMutation.isPending;
  const levelXpGoal =
    gamification.xpToNextLevel > 0
      ? gamification.xpInLevel + gamification.xpToNextLevel
      : gamification.xpInLevel;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-16">
      <motion.div {...anim(0)} className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/5 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_50%),radial-gradient(circle_at_80%_80%,hsl(45_90%_50%/0.15),transparent_45%)]" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest">
              <Crown size={14} />
              Nível {gamification.level} · {gamification.levelTitle}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
              Minha Casa
            </h1>
            <p className="text-lg font-semibold text-foreground/80">{data.householdName}</p>
            <p className="text-muted-foreground text-sm max-w-lg">
              Forje o brasão da casa com IA e acompanhe sua evolução financeira em níveis e XP.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAchievementsOpen(true)}
                className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-amber-600/10 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 text-left"
              >
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={22} className="text-amber-50" />
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
                    {gamification.unlockedCount}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">Álbum de Conquistas</p>
                  <p className="text-[11px] text-muted-foreground">
                    {gamification.unlockedCount}/{gamification.totalCount} medalhas · toque para abrir
                  </p>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="px-3 py-2 rounded-xl bg-card/80 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score AURA</p>
                <p className={cn('font-bold font-mono-nums text-lg', getScoreColor(data.auraScore))}>
                  {data.auraScore}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAchievementsOpen(true)}
                className="px-3 py-2 rounded-xl bg-card/80 border border-border hover:border-primary/40 hover:bg-accent transition-colors text-left"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conquistas</p>
                <p className="font-bold text-lg font-mono-nums">
                  {gamification.unlockedCount}/{gamification.totalCount}
                </p>
              </button>
              <div className="px-3 py-2 rounded-xl bg-card/80 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Membros</p>
                <p className="font-bold text-lg font-mono-nums">{data.memberCount}</p>
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <div className="flex justify-between text-xs font-semibold gap-3">
                <span className="text-primary">
                  {gamification.xpToNextLevel > 0
                    ? `${gamification.xpInLevel} / ${levelXpGoal} XP neste nível`
                    : 'Nível máximo alcançado'}
                </span>
                <span className="text-muted-foreground text-right">
                  {gamification.xpToNextLevel > 0
                    ? `Faltam ${gamification.xpToNextLevel} XP (nível ${gamification.level + 1})`
                    : `${gamification.totalXp} XP no total`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden border border-border/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gamification.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary rounded-full"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {gamification.totalXp} XP acumulados · {gamification.progressPercent}% do nível atual
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {data.members.map((m) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="w-9 h-9 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold overflow-hidden"
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-amber-400/30 to-primary/20 blur-xl" />
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl border-4 border-amber-500/40 bg-card shadow-2xl overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {crest ? (
                    <motion.img
                      key={crest.url}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={crest.url}
                      alt={`Brasão ${data.householdName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center"
                    >
                      <Shield size={48} className="opacity-40" />
                      <p className="text-xs">Nenhum brasão ainda</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {crest?.motto && (
              <p className="text-xs italic text-muted-foreground text-center max-w-[200px]">
                &ldquo;{crest.motto}&rdquo;
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.section {...anim(1)} className="card-solid rounded-2xl border border-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Enviar brasão próprio</h2>
            <p className="text-sm text-muted-foreground">
              Já tem o brasão da família? Faça o upload (JPG, PNG ou WEBP, até 5MB). Não consome gerações de IA.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Lema (opcional)
          </label>
          <input
            type="text"
            value={uploadMotto}
            onChange={(e) => setUploadMotto(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Unidos prosperamos"
            className="mt-2 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />

        <button
          type="button"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-bold text-sm hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Upload size={16} />
              {crest ? 'Substituir brasão' : 'Escolher imagem'}
            </>
          )}
        </button>
      </motion.section>

      <motion.section {...anim(1)} className="card-solid rounded-2xl border border-border p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Wand2 size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Forjar brasão com IA</h2>
            <p className="text-sm text-muted-foreground">
              {data.crestGenerationsRemaining} de {data.crestMaxGenerations} gerações restantes
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {CREST_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={cn(
                'text-left p-3 rounded-xl border text-sm transition-all',
                style === s.id
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border hover:border-primary/40 hover:bg-accent',
              )}
            >
              <p className="font-semibold">{s.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Símbolos da casa (até 4)
          </p>
          <div className="flex flex-wrap gap-2">
            {SYMBOL_OPTIONS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => toggleSymbol(sym)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  selectedSymbols.includes(sym)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Lema da casa (opcional)
          </label>
          <input
            type="text"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Unidos prosperamos"
            className="mt-2 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="button"
          disabled={!canGenerate}
          onClick={() => generateMutation.mutate()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Forjando brasão...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {crest ? 'Regenerar brasão' : 'Criar brasão da casa'}
            </>
          )}
        </button>
      </motion.section>

      <Dialog open={achievementsOpen} onOpenChange={setAchievementsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-amber-50" />
              </div>
              <div className="text-left space-y-1">
                <DialogTitle className="font-display text-xl">Mural de Conquistas</DialogTitle>
                <DialogDescription>
                  Cada marco na jornada financeira vira XP e medalha na parede da casa.
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold">
                  <span className="text-primary">{gamification.totalXp} XP total</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    Nível {gamification.level}: {gamification.levelTitle}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    {Array.from({ length: Math.min(5, unlockedAchievements.length) }).map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-500" />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-5 flex-1">
            {unlockedAchievements.length > 0 && (
              <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                  Últimas vitórias da casa
                </p>
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievements.slice(-6).map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/25"
                    >
                      <Trophy size={12} />
                      {a.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {data.achievements.map((achievement, i) => (
                <AchievementCard key={achievement.id} achievement={achievement} index={i} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
