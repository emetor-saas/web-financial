import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { BrainCircuit, Zap, TrendingUp, AlertTriangle, Eye, BarChart3, Clock } from 'lucide-react';
import { getSeverityColor } from '@/utils/formatters';
import { useState } from 'react';

const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04, duration: 0.25 } });

const categoryIcons: Record<string, typeof Zap> = {
  economy: Zap,
  risk: AlertTriangle,
  behavior: Eye,
  trend: TrendingUp,
  forecast: BarChart3,
};

const categoryLabels: Record<string, string> = {
  economy: 'Economia',
  risk: 'Risco',
  behavior: 'Comportamento',
  trend: 'Tendência',
  forecast: 'Previsão',
};

const timeLabels: Record<string, string> = {
  '7d': '7 dias',
  '15d': '15 dias',
  '30d': '30 dias',
};

const InsightsPage = () => {
  const { profileType, singleProfile, coupleProfile } = useAuth();
  const insights = profileType === 'COUPLE' ? coupleProfile.insights : singleProfile.insights;
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = activeFilter === 'all' ? insights : insights.filter(i => i.category === activeFilter);
  const categories = ['all', ...Array.from(new Set(insights.map(i => i.category)))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <motion.div {...anim(0)} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 border border-primary/20 rounded-xl flex items-center justify-center">
          <BrainCircuit size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight">Central de Insights</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Análises e recomendações geradas por inteligência artificial.</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {c === 'all' ? 'Todos' : categoryLabels[c] || c}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {filtered.map((insight, i) => {
          const Icon = categoryIcons[insight.category] || Zap;
          return (
            <motion.div
              key={insight.id}
              {...anim(1 + i)}
              className={`border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      insight.severity === 'critical' || insight.severity === 'high' ? 'bg-destructive/20 text-destructive'
                      : insight.severity === 'medium' ? 'bg-warning/20 text-warning'
                      : 'bg-primary/20 text-primary'
                    }`}>
                      {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'high' ? 'Alto' : insight.severity === 'medium' ? 'Moderado' : 'Baixo'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{insight.text}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Zap size={12} className="text-primary" /> Impacto: <strong className="text-foreground">{insight.impact}</strong></span>
                    {insight.timeframe && <span className="flex items-center gap-1"><Clock size={12} /> {timeLabels[insight.timeframe]}</span>}
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <p className="text-xs text-accent-foreground"><strong>Ação sugerida:</strong> {insight.action}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsPage;
