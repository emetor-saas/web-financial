import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Zap, ArrowUp } from 'lucide-react';
import { getPriorityColor } from '@/utils/formatters';
import { useState } from 'react';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const PlanoDeAcaoPage = () => {
  const { profileType, singleProfile, coupleProfile, updateSingleProfile, updateCoupleProfile } = useAuth();
  const isCouple = profileType === 'COUPLE';
  const actions = isCouple ? coupleProfile.actions : singleProfile.actions;
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const toggleAction = (id: number) => {
    if (isCouple) {
      updateCoupleProfile({
        actions: coupleProfile.actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a),
      });
    } else {
      updateSingleProfile({
        actions: singleProfile.actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a),
      });
    }
  };

  const filtered = filter === 'all' ? actions : actions.filter(a => a.priority === filter);
  const completedCount = actions.filter(a => a.completed).length;
  const progress = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Plano de Ação — 30 Dias</h1>
        <p className="text-muted-foreground text-sm mt-1">Ações priorizadas para melhorar sua saúde financeira.</p>
      </motion.div>

      {/* Progress */}
      <motion.div {...anim(1)} className="bg-card border border-border rounded-xl p-6 shadow-premium">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold">Progresso Geral</span>
          <span className="text-2xl font-display font-bold text-primary tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completedCount} de {actions.length} ações concluídas</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'high' ? 'Alta' : f === 'medium' ? 'Média' : 'Baixa'}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {filtered.map((action, i) => (
          <motion.div
            key={action.id}
            {...anim(2 + i)}
            className={`bg-card border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              action.completed ? 'border-border/50 opacity-60' : 'border-border'
            }`}
          >
            <div className="flex items-start gap-4">
              <button onClick={() => toggleAction(action.id)} className="mt-0.5 flex-shrink-0">
                {action.completed
                  ? <CheckCircle2 size={20} className="text-success" />
                  : <Circle size={20} className="text-muted-foreground hover:text-primary transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className={`font-semibold text-sm ${action.completed ? 'line-through' : ''}`}>{action.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(action.priority)}`}>
                    {action.priority === 'high' ? 'Alta' : action.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap size={12} className="text-secondary" /> {action.impact}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {action.deadline}</span>
                  <span className="flex items-center gap-1"><ArrowUp size={12} /> {action.difficulty === 'easy' ? 'Fácil' : action.difficulty === 'medium' ? 'Moderada' : 'Difícil'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlanoDeAcaoPage;
