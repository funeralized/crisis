// All monetary values stored as integer cents to avoid floating-point errors
export type Cents = number;

export interface Transaction {
  id: string;
  name: string;
  amount: Cents; // always positive, type determines sign
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date string
  description?: string;
  account?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  isSampleData?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: Cents;
  currentAmount: Cents;
  targetDate?: string;
  description?: string;
  icon: string;
  color: string;
  contributions: GoalContribution[];
  createdAt: string;
  updatedAt: string;
  isSampleData?: boolean;
}

export interface GoalContribution {
  id: string;
  amount: Cents; // positive = deposit, negative = withdrawal
  date: string;
  note?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: Cents;
  icon: string;
  color: string;
  createdAt: string;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  categories: BudgetCategory[];
  createdAt: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: 'hourly' | 'salary' | 'freelance' | 'passive' | 'other';
  hourlyRate?: Cents;
  hoursPerWeek?: number;
  payFrequency?: 'weekly' | 'biweekly' | 'monthly';
  expectedPayDate?: string;
  fixedAmount?: Cents;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: WidgetConfig;
}

export type WidgetType =
  | 'total-balance'
  | 'monthly-income'
  | 'monthly-expenses'
  | 'savings-progress'
  | 'spending-pie'
  | 'income-vs-expenses'
  | 'savings-timeline'
  | 'category-spending'
  | 'recent-transactions'
  | 'upcoming-bills'
  | 'savings-goal-card'
  | 'budget-progress'
  | 'budget-pie'
  | 'monthly-comparison'
  | 'savings-rate'
  | 'cash-flow'
  | 'weekly-trends';

export interface WidgetConfig {
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  chartType?: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  categoryFilter?: string[];
  goalId?: string;
  showLegend?: boolean;
  compactMode?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  startingBalance: Cents;
  onboardingCompleted: boolean;
  googleSheetsWebhookUrl?: string;
  googleSheetsLastSync?: string;
  theme: 'dark';
}

export interface FinancialReport {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom' | 'savings' | 'spending';
  startDate: string;
  endDate: string;
  totalIncome: Cents;
  totalExpenses: Cents;
  netCashFlow: Cents;
  savingsContributions: Cents;
  categoryBreakdown: { category: string; amount: Cents }[];
  generatedAt: string;
}

// Utility types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}
