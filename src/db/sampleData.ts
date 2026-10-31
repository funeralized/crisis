import type { Transaction, SavingsGoal, BudgetCategory, IncomeSource, DashboardLayout, AppSettings } from '../types';
import { generateId, dollarsToCents } from '../utils';

const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

function dateInMonth(monthKey: string, day: number): string {
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

export const sampleTransactions: Transaction[] = [
  // This month income
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(thisMonth, 5),
    description: '8hrs @ $18/hr', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(thisMonth, 12),
    description: '8hrs @ $18/hr', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(thisMonth, 19),
    description: '8hrs @ $18/hr', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Freelance Logo Design', amount: dollarsToCents(75),
    type: 'income', category: 'Freelance', date: dateInMonth(thisMonth, 8),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  // This month expenses
  {
    id: generateId(), name: 'Bus Pass', amount: dollarsToCents(100),
    type: 'expense', category: 'Transportation', date: dateInMonth(thisMonth, 1),
    isRecurring: true, recurringFrequency: 'monthly', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Haircut', amount: dollarsToCents(60),
    type: 'expense', category: 'Personal Care', date: dateInMonth(thisMonth, 10),
    isRecurring: true, recurringFrequency: 'monthly', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Hair Products', amount: dollarsToCents(10),
    type: 'expense', category: 'Personal Care', date: dateInMonth(thisMonth, 10),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Spotify Premium', amount: dollarsToCents(15),
    type: 'expense', category: 'Subscriptions', date: dateInMonth(thisMonth, 1),
    isRecurring: true, recurringFrequency: 'monthly', isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Lunch', amount: dollarsToCents(12.50),
    type: 'expense', category: 'Food', date: dateInMonth(thisMonth, 7),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Groceries', amount: dollarsToCents(45),
    type: 'expense', category: 'Food', date: dateInMonth(thisMonth, 14),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  // Last month data for comparison
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(lastMonthKey, 5),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(lastMonthKey, 12),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(lastMonthKey, 19),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Part-time Work', amount: dollarsToCents(144),
    type: 'income', category: 'Employment', date: dateInMonth(lastMonthKey, 26),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Bus Pass', amount: dollarsToCents(100),
    type: 'expense', category: 'Transportation', date: dateInMonth(lastMonthKey, 1),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Haircut', amount: dollarsToCents(60),
    type: 'expense', category: 'Personal Care', date: dateInMonth(lastMonthKey, 15),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Hair Products', amount: dollarsToCents(10),
    type: 'expense', category: 'Personal Care', date: dateInMonth(lastMonthKey, 15),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Spotify Premium', amount: dollarsToCents(15),
    type: 'expense', category: 'Subscriptions', date: dateInMonth(lastMonthKey, 1),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Movie Tickets', amount: dollarsToCents(28),
    type: 'expense', category: 'Entertainment', date: dateInMonth(lastMonthKey, 20),
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const sampleSavingsGoals: SavingsGoal[] = [
  {
    id: generateId(), name: 'Car Fund', targetAmount: dollarsToCents(4500),
    currentAmount: dollarsToCents(350), icon: 'car', color: '#3b82f6',
    targetDate: '2027-06-01',
    description: 'Saving up for a reliable used car',
    contributions: [
      { id: generateId(), amount: dollarsToCents(200), date: dateInMonth(lastMonthKey, 15), note: 'Initial deposit' },
      { id: generateId(), amount: dollarsToCents(150), date: dateInMonth(thisMonth, 15), note: 'Monthly contribution' },
    ],
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Moving Out Fund', targetAmount: dollarsToCents(12000),
    currentAmount: dollarsToCents(800), icon: 'home', color: '#10b981',
    targetDate: '2028-01-01',
    description: 'First & last month rent, furniture, essentials',
    contributions: [
      { id: generateId(), amount: dollarsToCents(500), date: dateInMonth(lastMonthKey, 20), note: 'Starting savings' },
      { id: generateId(), amount: dollarsToCents(300), date: dateInMonth(thisMonth, 20), note: 'Monthly contribution' },
    ],
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Business Fund', targetAmount: dollarsToCents(500),
    currentAmount: dollarsToCents(125), icon: 'briefcase', color: '#8b5cf6',
    targetDate: '2027-03-01',
    description: 'Startup costs for side business',
    contributions: [
      { id: generateId(), amount: dollarsToCents(125), date: dateInMonth(thisMonth, 5), note: 'Seed money' },
    ],
    isSampleData: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const sampleBudgetCategories: BudgetCategory[] = [
  { id: generateId(), name: 'Transportation', limit: dollarsToCents(120), icon: 'car', color: '#3b82f6', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Personal Care', limit: dollarsToCents(80), icon: 'sparkles', color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Subscriptions', limit: dollarsToCents(30), icon: 'layers', color: '#ec4899', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Food', limit: dollarsToCents(200), icon: 'utensils', color: '#f59e0b', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Entertainment', limit: dollarsToCents(50), icon: 'gamepad', color: '#10b981', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Shopping', limit: dollarsToCents(100), icon: 'shopping-bag', color: '#ef4444', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Education', limit: dollarsToCents(50), icon: 'graduation-cap', color: '#06b6d4', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Business', limit: dollarsToCents(50), icon: 'briefcase', color: '#6366f1', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Housing', limit: dollarsToCents(0), icon: 'home', color: '#f97316', createdAt: new Date().toISOString() },
];

export const sampleIncomeSources: IncomeSource[] = [
  {
    id: generateId(), name: 'Part-time Employment', type: 'hourly',
    hourlyRate: dollarsToCents(18), hoursPerWeek: 8,
    payFrequency: 'weekly', isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Freelance Marketing', type: 'freelance',
    isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Game Development', type: 'freelance',
    isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(), name: 'Roblox Group Revenue', type: 'passive',
    isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const defaultSettings: AppSettings = {
  currency: 'CAD',
  currencySymbol: '$',
  startingBalance: dollarsToCents(200),
  onboardingCompleted: false,
  theme: 'dark',
};

export const defaultDashboardLayout: DashboardLayout = {
  id: generateId(),
  name: 'Default',
  isDefault: true,
  widgets: [
    { id: generateId(), type: 'total-balance', title: 'Total Balance', x: 0, y: 0, w: 3, h: 2 },
    { id: generateId(), type: 'monthly-income', title: 'Monthly Income', x: 3, y: 0, w: 3, h: 2 },
    { id: generateId(), type: 'monthly-expenses', title: 'Monthly Expenses', x: 6, y: 0, w: 3, h: 2 },
    { id: generateId(), type: 'savings-rate', title: 'Savings Rate', x: 9, y: 0, w: 3, h: 2 },
    { id: generateId(), type: 'income-vs-expenses', title: 'Income vs Expenses', x: 0, y: 2, w: 6, h: 4, config: { dateRange: 'month', chartType: 'bar' } },
    { id: generateId(), type: 'budget-pie', title: 'Monthly Budget & Remaining', x: 6, y: 2, w: 6, h: 4 },
    { id: generateId(), type: 'recent-transactions', title: 'Recent Transactions', x: 0, y: 6, w: 6, h: 4 },
    { id: generateId(), type: 'budget-progress', title: 'Budget Progress', x: 6, y: 6, w: 6, h: 4 },
    { id: generateId(), type: 'savings-progress', title: 'Savings Goals', x: 0, y: 10, w: 12, h: 3 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
