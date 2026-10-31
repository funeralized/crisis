import type { Cents } from '../types';

// ─── Currency Formatting ────────────────────────────────────

export function formatCurrency(cents: Cents, symbol = '$'): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = `${symbol}${dollars.toLocaleString()}.${String(remainder).padStart(2, '0')}`;
  return cents < 0 ? `-${formatted}` : formatted;
}

export function parseCurrencyInput(input: string): Cents {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function centsToDollars(cents: Cents): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

// ─── Date Helpers ───────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
  });
}

export function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// ─── Financial Calculations ──────────────────────────────────

import type { Transaction, SavingsGoal, BudgetCategory } from '../types';

export function calculateMonthlyIncome(transactions: Transaction[], monthKey?: string): Cents {
  const key = monthKey || getMonthKey(new Date());
  return transactions
    .filter((t) => t.type === 'income' && getMonthKey(new Date(t.date)) === key)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateMonthlyExpenses(transactions: Transaction[], monthKey?: string): Cents {
  const key = monthKey || getMonthKey(new Date());
  return transactions
    .filter((t) => t.type === 'expense' && getMonthKey(new Date(t.date)) === key)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalBalance(
  transactions: Transaction[],
  startingBalance: Cents
): Cents {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return startingBalance + income - expenses;
}

export function calculateTotalSavings(goals: SavingsGoal[]): Cents {
  return goals.reduce((sum, g) => sum + g.currentAmount, 0);
}

export function calculateSavingsRate(income: Cents, expenses: Cents): number {
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 100);
}

export function calculateCategorySpending(
  transactions: Transaction[],
  monthKey?: string
): Record<string, Cents> {
  const key = monthKey || getMonthKey(new Date());
  const spending: Record<string, Cents> = {};
  transactions
    .filter((t) => t.type === 'expense' && getMonthKey(new Date(t.date)) === key)
    .forEach((t) => {
      spending[t.category] = (spending[t.category] || 0) + t.amount;
    });
  return spending;
}

export function calculateBudgetUsage(
  categories: BudgetCategory[],
  transactions: Transaction[],
  monthKey?: string
): { category: BudgetCategory; spent: Cents; remaining: Cents; percentage: number }[] {
  const spending = calculateCategorySpending(transactions, monthKey);
  return categories.map((cat) => {
    const spent = spending[cat.name] || 0;
    return {
      category: cat,
      spent,
      remaining: Math.max(0, cat.limit - spent),
      percentage: cat.limit > 0 ? Math.min(100, Math.round((spent / cat.limit) * 100)) : 0,
    };
  });
}

export function calculateGoalProjection(goal: SavingsGoal): {
  monthlyNeeded: Cents;
  projectedDate: string | null;
  onTrack: boolean;
} {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) {
    return { monthlyNeeded: 0, projectedDate: null, onTrack: true };
  }

  if (!goal.targetDate) {
    return { monthlyNeeded: 0, projectedDate: null, onTrack: false };
  }

  const now = new Date();
  const target = new Date(goal.targetDate);
  const monthsLeft = Math.max(
    1,
    (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth()
  );
  const monthlyNeeded = Math.ceil(remaining / monthsLeft);

  // Estimate projection based on recent contributions
  const recentContribs = goal.contributions
    .filter((c) => c.amount > 0)
    .slice(-3);
  if (recentContribs.length > 0) {
    const avgMonthly =
      recentContribs.reduce((s, c) => s + c.amount, 0) / recentContribs.length;
    if (avgMonthly > 0) {
      const monthsToComplete = Math.ceil(remaining / avgMonthly);
      const projected = new Date();
      projected.setMonth(projected.getMonth() + monthsToComplete);
      return {
        monthlyNeeded,
        projectedDate: projected.toISOString().split('T')[0],
        onTrack: projected <= target,
      };
    }
  }

  return { monthlyNeeded, projectedDate: null, onTrack: false };
}

// ─── ID Generation ──────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Category Defaults ──────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Transportation',
  'Personal Care',
  'Subscriptions',
  'Food',
  'Entertainment',
  'Shopping',
  'Education',
  'Business',
  'Housing',
  'Health',
  'Other',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Employment',
  'Freelance',
  'Game Development',
  'Roblox Revenue',
  'Investments',
  'Other Income',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Transportation: '#3b82f6',
  'Personal Care': '#8b5cf6',
  Subscriptions: '#ec4899',
  Food: '#f59e0b',
  Entertainment: '#10b981',
  Shopping: '#ef4444',
  Education: '#06b6d4',
  Business: '#6366f1',
  Housing: '#f97316',
  Health: '#14b8a6',
  Other: '#6b7280',
  Employment: '#10b981',
  Freelance: '#3b82f6',
  'Game Development': '#8b5cf6',
  'Roblox Revenue': '#ef4444',
  Investments: '#f59e0b',
  'Other Income': '#6b7280',
};

export { renderAppIcon, ICON_OPTIONS } from './iconMap';

export const GOAL_ICONS = [
  'target', 'car', 'home', 'briefcase', 'plane',
  'smartphone', 'laptop', 'graduation-cap', 'wallet', 'package',
  'gamepad', 'camera', 'shield', 'trophy', 'trending-up', 'landmark',
];

export const GOAL_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#ef4444', '#06b6d4', '#6366f1', '#f97316', '#14b8a6',
];
