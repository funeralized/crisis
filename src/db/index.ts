import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Transaction,
  SavingsGoal,
  BudgetCategory,
  IncomeSource,
  DashboardLayout,
  AppSettings,
} from '../types';

interface FinanceDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-category': string;
      'by-type': string;
    };
  };
  savingsGoals: {
    key: string;
    value: SavingsGoal;
  };
  budgetCategories: {
    key: string;
    value: BudgetCategory;
  };
  incomeSources: {
    key: string;
    value: IncomeSource;
  };
  dashboardLayouts: {
    key: string;
    value: DashboardLayout;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'finance-app-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FinanceDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FinanceDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FinanceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Transactions store
      const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
      txStore.createIndex('by-date', 'date');
      txStore.createIndex('by-category', 'category');
      txStore.createIndex('by-type', 'type');

      // Savings goals
      db.createObjectStore('savingsGoals', { keyPath: 'id' });

      // Budget categories
      db.createObjectStore('budgetCategories', { keyPath: 'id' });

      // Income sources
      db.createObjectStore('incomeSources', { keyPath: 'id' });

      // Dashboard layouts
      db.createObjectStore('dashboardLayouts', { keyPath: 'id' });

      // App settings
      db.createObjectStore('settings', { keyPath: 'currency' });
    },
  });

  return dbInstance;
}

// ─── Transactions ──────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function clearSampleTransactions(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  const tx = db.transaction('transactions', 'readwrite');
  for (const t of all) {
    if (t.isSampleData) {
      await tx.store.delete(t.id);
    }
  }
  await tx.done;
}

// ─── Savings Goals ──────────────────────────────────────────────

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDB();
  return db.getAll('savingsGoals');
}

export async function addSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put('savingsGoals', goal);
}

export async function updateSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put('savingsGoals', goal);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('savingsGoals', id);
}

// ─── Budget Categories ──────────────────────────────────────────

export async function getAllBudgetCategories(): Promise<BudgetCategory[]> {
  const db = await getDB();
  return db.getAll('budgetCategories');
}

export async function addBudgetCategory(cat: BudgetCategory): Promise<void> {
  const db = await getDB();
  await db.put('budgetCategories', cat);
}

export async function updateBudgetCategory(cat: BudgetCategory): Promise<void> {
  const db = await getDB();
  await db.put('budgetCategories', cat);
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('budgetCategories', id);
}

// ─── Income Sources ──────────────────────────────────────────────

export async function getAllIncomeSources(): Promise<IncomeSource[]> {
  const db = await getDB();
  return db.getAll('incomeSources');
}

export async function addIncomeSource(src: IncomeSource): Promise<void> {
  const db = await getDB();
  await db.put('incomeSources', src);
}

export async function updateIncomeSource(src: IncomeSource): Promise<void> {
  const db = await getDB();
  await db.put('incomeSources', src);
}

export async function deleteIncomeSource(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('incomeSources', id);
}

// ─── Dashboard Layouts ──────────────────────────────────────────

export async function getAllDashboardLayouts(): Promise<DashboardLayout[]> {
  const db = await getDB();
  return db.getAll('dashboardLayouts');
}

export async function saveDashboardLayout(layout: DashboardLayout): Promise<void> {
  const db = await getDB();
  await db.put('dashboardLayouts', layout);
}

export async function deleteDashboardLayout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('dashboardLayouts', id);
}

// ─── Settings ──────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return db.get('settings', 'CAD');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// ─── Backup & Restore ──────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  incomeSources: IncomeSource[];
  dashboardLayouts: DashboardLayout[];
  settings: AppSettings | undefined;
}

export async function exportAllData(): Promise<BackupData> {
  const [transactions, savingsGoals, budgetCategories, incomeSources, dashboardLayouts, settings] =
    await Promise.all([
      getAllTransactions(),
      getAllSavingsGoals(),
      getAllBudgetCategories(),
      getAllIncomeSources(),
      getAllDashboardLayouts(),
      getSettings(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    savingsGoals,
    budgetCategories,
    incomeSources,
    dashboardLayouts,
    settings,
  };
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
  await db.clear('savingsGoals');
  await db.clear('budgetCategories');
  await db.clear('incomeSources');
  await db.clear('dashboardLayouts');
  await db.clear('settings');
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDB();

  // Clear all stores first
  await clearAllData();

  // Re-add all data
  for (const tx of data.transactions) {
    await db.put('transactions', tx);
  }
  for (const goal of data.savingsGoals) {
    await db.put('savingsGoals', goal);
  }
  for (const cat of data.budgetCategories) {
    await db.put('budgetCategories', cat);
  }
  for (const src of data.incomeSources) {
    await db.put('incomeSources', src);
  }
  for (const layout of data.dashboardLayouts) {
    await db.put('dashboardLayouts', layout);
  }
  if (data.settings) {
    await db.put('settings', data.settings);
  }
}
