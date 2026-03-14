export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-destructive';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excelente';
  if (score >= 70) return 'Bom';
  if (score >= 60) return 'Equilibrado';
  if (score >= 40) return 'Atenção';
  return 'Crítico';
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'medium': return 'bg-warning/20 text-warning border-warning/30';
    case 'low': return 'bg-primary/20 text-primary border-primary/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'border-destructive/40 bg-destructive/10';
    case 'high': return 'border-destructive/30 bg-destructive/5';
    case 'medium': return 'border-warning/30 bg-warning/5';
    case 'low': return 'border-primary/30 bg-primary/5';
    default: return 'border-border bg-card';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'on-track': case 'completed': case 'active': case 'resolved': return 'text-success';
    case 'warning': case 'in-progress': return 'text-warning';
    case 'behind': case 'danger': case 'churned': case 'open': return 'text-destructive';
    case 'inactive': return 'text-muted-foreground';
    default: return 'text-foreground';
  }
};
