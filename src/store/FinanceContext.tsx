import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type {
  Transaction, SavingsGoal, BudgetCategory, IncomeSource,
  DashboardLayout, AppSettings, GoalContribution, Cents,
} from '../types';
import * as db from '../db';
import {
  sampleTransactions, sampleSavingsGoals, sampleBudgetCategories,
  sampleIncomeSources, defaultSettings, defaultDashboardLayout,
} from '../db/sampleData';
import { generateId } from '../utils';

interface FinanceState {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  incomeSources: IncomeSource[];
  dashboardLayouts: DashboardLayout[];
  settings: AppSettings;
  isLoading: boolean;
  isInitialized: boolean;
}

interface FinanceActions {
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>) => Promise<void>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: Cents, note?: string) => Promise<void>;

  // Budget Categories
  addBudgetCategory: (cat: Omit<BudgetCategory, 'id' | 'createdAt'>) => Promise<void>;
  updateBudgetCategory: (cat: BudgetCategory) => Promise<void>;
  deleteBudgetCategory: (id: string) => Promise<void>;

  // Income Sources
  addIncomeSource: (src: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncomeSource: (src: IncomeSource) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;

  // Dashboard
  saveDashboardLayout: (layout: DashboardLayout) => Promise<void>;
  deleteDashboardLayout: (id: string) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Backup
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;

  // Refresh
  refreshData: () => Promise<void>;
}

type FinanceContextType = FinanceState & FinanceActions;

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    savingsGoals: [],
    budgetCategories: [],
    incomeSources: [],
    dashboardLayouts: [],
    settings: defaultSettings,
    isLoading: true,
    isInitialized: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [transactions, savingsGoals, budgetCategories, incomeSources, dashboardLayouts, settings] =
        await Promise.all([
          db.getAllTransactions(),
          db.getAllSavingsGoals(),
          db.getAllBudgetCategories(),
          db.getAllIncomeSources(),
          db.getAllDashboardLayouts(),
          db.getSettings(),
        ]);

      const isFirstLoad = transactions.length === 0 && !settings;

      if (isFirstLoad) {
        // Seed sample data
        for (const tx of sampleTransactions) await db.addTransaction(tx);
        for (const goal of sampleSavingsGoals) await db.addSavingsGoal(goal);
        for (const cat of sampleBudgetCategories) await db.addBudgetCategory(cat);
        for (const src of sampleIncomeSources) await db.addIncomeSource(src);
        await db.saveDashboardLayout(defaultDashboardLayout);
        await db.saveSettings(defaultSettings);

        setState({
          transactions: sampleTransactions,
          savingsGoals: sampleSavingsGoals,
          budgetCategories: sampleBudgetCategories,
          incomeSources: sampleIncomeSources,
          dashboardLayouts: [defaultDashboardLayout],
          settings: defaultSettings,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        setState({
          transactions,
          savingsGoals,
          budgetCategories,
          incomeSources,
          dashboardLayouts: dashboardLayouts.length > 0 ? dashboardLayouts : [defaultDashboardLayout],
          settings: settings || defaultSettings,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setState((prev) => ({ ...prev, isLoading: false, isInitialized: true }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Actions ─────────────────────────────────

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = { ...tx, id: generateId(), createdAt: now, updatedAt: now };
    await db.addTransaction(newTx);
    setState((prev) => ({ ...prev, transactions: [...prev.transactions, newTx] }));
  }, []);

  const updateTransaction = useCallback(async (tx: Transaction) => {
    const updated = { ...tx, updatedAt: new Date().toISOString() };
    await db.updateTransaction(updated);
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === tx.id ? updated : t)),
    }));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await db.deleteTransaction(id);
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const clearSampleData = useCallback(async () => {
    await db.clearSampleTransactions();
    const allGoals = await db.getAllSavingsGoals();
    for (const g of allGoals) {
      if (g.isSampleData) await db.deleteSavingsGoal(g.id);
    }
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !t.isSampleData),
      savingsGoals: prev.savingsGoals.filter((g) => !g.isSampleData),
    }));
  }, []);

  const clearAllData = useCallback(async () => {
    await db.clearAllData();
    setState({
      transactions: [],
      savingsGoals: [],
      budgetCategories: [],
      incomeSources: [],
      dashboardLayouts: [defaultDashboardLayout],
      settings: defaultSettings,
      isLoading: false,
      isInitialized: true,
    });
  }, []);

  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>) => {
    const now = new Date().toISOString();
    const newGoal: SavingsGoal = { ...goal, id: generateId(), contributions: [], createdAt: now, updatedAt: now };
    await db.addSavingsGoal(newGoal);
    setState((prev) => ({ ...prev, savingsGoals: [...prev.savingsGoals, newGoal] }));
  }, []);

  const updateSavingsGoal = useCallback(async (goal: SavingsGoal) => {
    const updated = { ...goal, updatedAt: new Date().toISOString() };
    await db.updateSavingsGoal(updated);
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === goal.id ? updated : g)),
    }));
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await db.deleteSavingsGoal(id);
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  }, []);

  const addGoalContribution = useCallback(async (goalId: string, amount: Cents, note?: string) => {
    setState((prev) => {
      const goals = prev.savingsGoals.map((g) => {
        if (g.id !== goalId) return g;
        const contribution: GoalContribution = {
          id: generateId(),
          amount,
          date: new Date().toISOString().split('T')[0],
          note,
        };
        const updated: SavingsGoal = {
          ...g,
          currentAmount: g.currentAmount + amount,
          contributions: [...g.contributions, contribution],
          updatedAt: new Date().toISOString(),
        };
        db.updateSavingsGoal(updated);
        return updated;
      });
      return { ...prev, savingsGoals: goals };
    });
  }, []);

  const addBudgetCategory = useCallback(async (cat: Omit<BudgetCategory, 'id' | 'createdAt'>) => {
    const newCat: BudgetCategory = { ...cat, id: generateId(), createdAt: new Date().toISOString() };
    await db.addBudgetCategory(newCat);
    setState((prev) => ({ ...prev, budgetCategories: [...prev.budgetCategories, newCat] }));
  }, []);

  const updateBudgetCategory = useCallback(async (cat: BudgetCategory) => {
    await db.updateBudgetCategory(cat);
    setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map((c) => (c.id === cat.id ? cat : c)),
    }));
  }, []);

  const deleteBudgetCategory = useCallback(async (id: string) => {
    await db.deleteBudgetCategory(id);
    setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.filter((c) => c.id !== id),
    }));
  }, []);

  const addIncomeSource = useCallback(async (src: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSrc: IncomeSource = { ...src, id: generateId(), createdAt: now, updatedAt: now };
    await db.addIncomeSource(newSrc);
    setState((prev) => ({ ...prev, incomeSources: [...prev.incomeSources, newSrc] }));
  }, []);

  const updateIncomeSource = useCallback(async (src: IncomeSource) => {
    const updated = { ...src, updatedAt: new Date().toISOString() };
    await db.updateIncomeSource(updated);
    setState((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.map((s) => (s.id === src.id ? updated : s)),
    }));
  }, []);

  const deleteIncomeSource = useCallback(async (id: string) => {
    await db.deleteIncomeSource(id);
    setState((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.filter((s) => s.id !== id),
    }));
  }, []);

  const saveDashboardLayoutAction = useCallback(async (layout: DashboardLayout) => {
    const updated = { ...layout, updatedAt: new Date().toISOString() };
    await db.saveDashboardLayout(updated);
    setState((prev) => {
      const existing = prev.dashboardLayouts.findIndex((l) => l.id === layout.id);
      const layouts = existing >= 0
        ? prev.dashboardLayouts.map((l) => (l.id === layout.id ? updated : l))
        : [...prev.dashboardLayouts, updated];
      return { ...prev, dashboardLayouts: layouts };
    });
  }, []);

  const deleteDashboardLayout = useCallback(async (id: string) => {
    await db.deleteDashboardLayout(id);
    setState((prev) => ({
      ...prev,
      dashboardLayouts: prev.dashboardLayouts.filter((l) => l.id !== id),
    }));
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setState((prev) => {
      const updated = { ...prev.settings, ...partial };
      db.saveSettings(updated);
      return { ...prev, settings: updated };
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await updateSettings({ onboardingCompleted: true });
  }, [updateSettings]);

  const exportData = useCallback(async (): Promise<string> => {
    const data = await db.exportAllData();
    return JSON.stringify(data, null, 2);
  }, []);

  const importData = useCallback(async (json: string) => {
    const data = JSON.parse(json);
    await db.importAllData(data);
    await loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const value: FinanceContextType = {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearSampleData,
    clearAllData,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addGoalContribution,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    saveDashboardLayout: saveDashboardLayoutAction,
    deleteDashboardLayout,
    updateSettings,
    completeOnboarding,
    exportData,
    importData,
    refreshData,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}
