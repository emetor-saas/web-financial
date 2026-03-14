export type ProfileType = 'SINGLE' | 'COUPLE' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: ProfileType;
  avatar?: string;
}

export interface SingleProfile extends UserProfile {
  role: 'SINGLE';
  age: number;
  score: number;
  metrics: FinancialMetrics;
  diagnostic: DiagnosticDimensions;
  insights: Insight[];
  debts: Debt[];
  goals: Goal[];
  actions: ActionItem[];
  monthlyData: MonthlyDataPoint[];
  categories: CategorySpend[];
  alerts: Alert[];
}

export interface CoupleProfile extends UserProfile {
  role: 'COUPLE';
  score: number;
  p1: PersonData;
  p2: PersonData;
  metrics: CoupleMetrics;
  goals: Goal[];
  insights: Insight[];
  debts: Debt[];
  actions: ActionItem[];
  monthlyData: MonthlyDataPoint[];
  sharedCategories: CategorySpend[];
  meetings: Meeting[];
  alerts: Alert[];
}

export interface AdminProfile extends UserProfile {
  role: 'ADMIN';
  stats: AdminStats;
  users: AdminUser[];
  cohorts: CohortData[];
  tickets: Ticket[];
  kpis: KPI[];
  growthData: GrowthDataPoint[];
  plans: PlanData[];
}

export interface FinancialMetrics {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  savings: number;
  totalDebt: number;
}

export interface CoupleMetrics {
  jointIncome: number;
  jointFixed: number;
  jointVariable: number;
  totalDebt: number;
  jointSavings: number;
}

export interface DiagnosticDimensions {
  stability: number;
  commitment: number;
  debtPressure: number;
  discipline: number;
  liquidity: number;
  alignment: number;
}

export interface Insight {
  id: number;
  title: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  action: string;
  category: 'economy' | 'risk' | 'behavior' | 'trend' | 'forecast';
  timeframe?: '7d' | '15d' | '30d';
}

export interface Debt {
  id: number;
  name: string;
  type: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  monthlyImpact: number;
  attackOrder: number;
  potentialSaving: number;
}

export interface Goal {
  id: number;
  title: string;
  target: number;
  current: number;
  deadline: string;
  monthlyNeeded: number;
  status: 'on-track' | 'warning' | 'behind' | 'completed';
  shared?: boolean;
}

export interface ActionItem {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: string;
  completed: boolean;
  category: string;
}

export interface MonthlyDataPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategorySpend {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  date: string;
}

export interface PersonData {
  name: string;
  score: number;
  income: number;
  personalExpenses: number;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  status: 'scheduled' | 'completed' | 'missed';
  topics: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeCouples: number;
  activeSingles: number;
  avgScore: number;
  churnRate: number;
  activationRate: number;
  diagnosticCompletion: number;
  revenue: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  type: ProfileType;
  score: number;
  status: 'active' | 'inactive' | 'churned';
  plan: string;
  joinDate: string;
  lastActive: string;
}

export interface CohortData {
  period: string;
  users: number;
  retained: number;
  avgScore: number;
  revenue: number;
}

export interface Ticket {
  id: number;
  user: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  date: string;
}

export interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface GrowthDataPoint {
  month: string;
  users: number;
  revenue: number;
  churn: number;
}

export interface PlanData {
  name: string;
  users: number;
  revenue: number;
  percentage: number;
}
