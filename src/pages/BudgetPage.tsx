import React, { useState, useMemo } from 'react';
import { useFinance } from '../store/FinanceContext';
import type { BudgetCategory } from '../types';
import {
  formatCurrency,
  getMonthKey,
  getMonthName,
  calculateBudgetUsage,
  calculateMonthlyExpenses,
} from '../utils';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import BudgetCategoryForm from '../components/BudgetCategoryForm';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Pencil,
  Trash2,
  Wallet,
  Clock,
} from 'lucide-react';

function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr);
  let month = parseInt(monthStr) - 1;
  month -= 1;
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr);
  let month = parseInt(monthStr) - 1;
  month += 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getDaysRemainingInMonth(monthKey: string): {
  daysLeft: number;
  totalDays: number;
  isPast: boolean;
  isFuture: boolean;
} {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalDays = new Date(year, month, 0).getDate();

  if (monthKey < currentMonthKey) {
    return { daysLeft: 0, totalDays, isPast: true, isFuture: false };
  }
  if (monthKey > currentMonthKey) {
    return { daysLeft: totalDays, totalDays, isPast: false, isFuture: true };
  }
  const today = now.getDate();
  const daysLeft = Math.max(1, totalDays - today + 1);
  return { daysLeft, totalDays, isPast: false, isFuture: false };
}

export const BudgetPage: React.FC = () => {
  const { budgetCategories, transactions, deleteBudgetCategory } = useFinance();

  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BudgetCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Month navigation
  const prevMonthKey = useMemo(() => getPreviousMonthKey(selectedMonthKey), [selectedMonthKey]);
  const nextMonthKey = useMemo(() => getNextMonthKey(selectedMonthKey), [selectedMonthKey]);
  const isSelectedCurrentMonth = selectedMonthKey === currentMonthKey;

  // Budget calculations for selected month
  const budgetUsage = useMemo(() => {
    return calculateBudgetUsage(budgetCategories, transactions, selectedMonthKey);
  }, [budgetCategories, transactions, selectedMonthKey]);

  // Overall totals
  const totalBudget = useMemo(() => {
    return budgetCategories.reduce((sum, cat) => sum + cat.limit, 0);
  }, [budgetCategories]);

  const totalSpent = useMemo(() => {
    return budgetUsage.reduce((sum, item) => sum + item.spent, 0);
  }, [budgetUsage]);

  const totalRemaining = totalBudget - totalSpent;

  const totalUtilization = totalBudget > 0
    ? Math.round((totalSpent / totalBudget) * 100)
    : 0;

  // Historical comparison (Current selected month vs previous month)
  const prevMonthExpenses = useMemo(() => {
    return calculateMonthlyExpenses(transactions, prevMonthKey);
  }, [transactions, prevMonthKey]);

  const currentMonthExpenses = useMemo(() => {
    return calculateMonthlyExpenses(transactions, selectedMonthKey);
  }, [transactions, selectedMonthKey]);

  const monthlyDiff = currentMonthExpenses - prevMonthExpenses;
  const monthlyPercentChange = prevMonthExpenses > 0
    ? Math.round(((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100)
    : 0;

  // Days left & daily budget
  const daysInfo = useMemo(() => {
    return getDaysRemainingInMonth(selectedMonthKey);
  }, [selectedMonthKey]);

  const dailyAllowance = daysInfo.daysLeft > 0 && totalRemaining > 0
    ? Math.round(totalRemaining / daysInfo.daysLeft)
    : 0;

  // Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      await deleteBudgetCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete budget category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Budget Management"
        description="Monitor category spending limits and maintain healthy cash flow"
        icon={<Wallet className="w-6 h-6 text-[var(--accent-blue)]" />}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Navigation Pill */}
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedMonthKey(prevMonthKey)}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs sm:text-sm font-semibold text-[var(--text-primary)] select-none">
              {getMonthName(selectedMonthKey)}
            </span>

            <button
              type="button"
              onClick={() => setSelectedMonthKey(nextMonthKey)}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isSelectedCurrentMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonthKey(currentMonthKey)}
                className="ml-1 px-2 py-1 text-[11px] font-medium text-[var(--accent-blue)] bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors"
              >
                Today
              </button>
            )}
          </div>

          {/* Add Category Button */}
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddCategory}
            className="!bg-[var(--accent-blue)] hover:!bg-blue-600 shadow-md shadow-blue-500/20"
          >
            Add Category
          </Button>
        </div>
      </PageHeader>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Monthly Budget</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[var(--accent-blue)] flex items-center justify-center border border-blue-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
            {formatCurrency(totalBudget)}
          </div>
          <div className="mt-2 text-xs text-[var(--text-tertiary)]">
            Across {budgetCategories.length} {budgetCategories.length === 1 ? 'category' : 'categories'}
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Spent This Month</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-[var(--accent-purple)] flex items-center justify-center border border-purple-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
            {formatCurrency(totalSpent)}
          </div>
          <div className="mt-2 text-xs text-[var(--text-tertiary)] flex items-center gap-1">
            <span>{totalUtilization}% of planned budget</span>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {totalRemaining >= 0 ? 'Remaining Budget' : 'Budget Overspent'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                totalRemaining >= 0
                  ? 'bg-emerald-500/10 text-[var(--accent-green)] border-emerald-500/20'
                  : 'bg-red-500/10 text-[var(--accent-red)] border-red-500/20'
              }`}
            >
              {totalRemaining >= 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${
              totalRemaining >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
            }`}
          >
            {totalRemaining >= 0 ? formatCurrency(totalRemaining) : `-${formatCurrency(Math.abs(totalRemaining))}`}
          </div>
          <div className="mt-2 text-xs text-[var(--text-tertiary)]">
            {totalRemaining >= 0 ? 'Available for spending' : 'Exceeded total budget limit'}
          </div>
        </div>

        {/* Card 4: Utilization Progress Bar */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Budget Utilization</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                totalUtilization > 90
                  ? 'bg-red-500/15 text-[var(--accent-red)] border-red-500/30'
                  : totalUtilization >= 70
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-[var(--accent-green)] border-emerald-500/30'
              }`}
            >
              {totalUtilization}%
            </span>
          </div>

          <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
            {totalUtilization > 100 ? 'Over Limit' : totalUtilization >= 70 ? 'High' : 'Healthy'}
          </div>

          <div className="mt-2 w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-subtle)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                totalUtilization > 90
                  ? 'bg-[var(--accent-red)] shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : totalUtilization >= 70
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-[var(--accent-green)] shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${Math.min(100, totalUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Information Row: Monthly Reset & Historical Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Reset Info Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 flex items-center justify-center text-[var(--accent-blue)] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span>Monthly Budget Cycle</span>
              <span className="text-[11px] font-normal text-[var(--text-muted)]">
                (1st to end of month)
              </span>
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {daysInfo.isPast ? (
                `Viewing historical data for ${getMonthName(selectedMonthKey)}.`
              ) : daysInfo.isFuture ? (
                `Viewing future projected cycle for ${getMonthName(selectedMonthKey)}.`
              ) : (
                <>
                  There are <strong>{daysInfo.daysLeft} days remaining</strong> in this cycle.
                  {dailyAllowance > 0 && (
                    <>
                      {' '}Safe daily spend allowance: <strong className="text-[var(--accent-green)] tabular-nums">{formatCurrency(dailyAllowance)}/day</strong>.
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Historical Comparison Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              monthlyDiff <= 0
                ? 'bg-emerald-500/10 text-[var(--accent-green)] border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {monthlyDiff <= 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span>Historical Spending Comparison</span>
              {prevMonthExpenses > 0 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    monthlyDiff <= 0
                      ? 'bg-emerald-500/10 text-[var(--accent-green)]'
                      : 'bg-red-500/10 text-[var(--accent-red)]'
                  }`}
                >
                  {monthlyDiff <= 0 ? '-' : '+'}{Math.abs(monthlyPercentChange)}%
                </span>
              )}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {prevMonthExpenses > 0 ? (
                <>
                  You spent{' '}
                  <strong className="text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(currentMonthExpenses)}
                  </strong>{' '}
                  this month vs{' '}
                  <strong className="text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(prevMonthExpenses)}
                  </strong>{' '}
                  in {getMonthName(prevMonthKey)} (
                  <span className={monthlyDiff <= 0 ? 'text-[var(--accent-green)] font-medium' : 'text-[var(--accent-red)] font-medium'}>
                    {monthlyDiff <= 0 ? 'saved ' : 'spent '}
                    {formatCurrency(Math.abs(monthlyDiff))}
                  </span>
                  ).
                </>
              ) : (
                'No transaction data recorded for previous month to compare.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Category List / Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Category Budgets
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Limits and actual expenditures for {getMonthName(selectedMonthKey)}
            </p>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {budgetCategories.length} {budgetCategories.length === 1 ? 'Category' : 'Categories'} Configured
          </span>
        </div>

        {budgetCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetUsage.map(({ category, spent, remaining }) => {
              const exactPercent = category.limit > 0
                ? Math.round((spent / category.limit) * 100)
                : 0;
              const isExceeded = spent > category.limit;
              const isNearLimit = !isExceeded && exactPercent >= 90;
              const isApproaching = !isExceeded && exactPercent >= 70 && exactPercent < 90;
              const isOnTrack = !isExceeded && exactPercent < 70;

              // Color coding
              const progressColor = isExceeded || isNearLimit
                ? 'var(--accent-red)'
                : isApproaching
                ? '#f59e0b'
                : 'var(--accent-green)';

              return (
                <div
                  key={category.id}
                  className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all p-5 shadow-sm group"
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                        style={{
                          backgroundColor: `${category.color}15`,
                          borderColor: `${category.color}35`,
                        }}
                      >
                        <span>{category.icon || '🏷️'}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {category.name}
                          </h4>
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          Limit: <strong className="text-[var(--text-secondary)] font-medium tabular-nums">{formatCurrency(category.limit)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Warning Badges */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isExceeded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-[var(--accent-red)] border border-red-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Exceeded by {formatCurrency(spent - category.limit)}
                        </span>
                      )}

                      {isNearLimit && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-[var(--accent-red)] border border-red-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Near limit ({exactPercent}%)
                        </span>
                      )}

                      {isApproaching && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Approaching ({exactPercent}%)
                        </span>
                      )}

                      {isOnTrack && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-[var(--accent-green)] border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          On Track ({exactPercent}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amounts & Percentage */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">
                        Spent: <strong className="text-[var(--text-primary)] font-bold text-sm tabular-nums">{formatCurrency(spent)}</strong>
                      </span>
                      <span className="text-[var(--text-tertiary)] tabular-nums">
                        {isExceeded ? (
                          <span className="text-[var(--accent-red)] font-semibold">Over by {formatCurrency(spent - category.limit)}</span>
                        ) : (
                          <>
                            <strong className="text-[var(--text-primary)] font-semibold">{formatCurrency(remaining)}</strong> remaining
                          </>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, exactPercent)}%`,
                          backgroundColor: progressColor,
                          boxShadow: `0 0 8px ${progressColor}60`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Resets 1st of month</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(category)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
                        title="Edit limit"
                        aria-label="Edit limit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(category)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete category"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<PieChart className="w-8 h-8 text-[var(--accent-blue)]" />}
            title="No Budget Categories Yet"
            description="Set up category limits like Groceries, Entertainment, and Transportation to control monthly spending."
            action={{
              label: 'Add First Category',
              onClick: handleOpenAddCategory,
              icon: <Plus className="w-4 h-4" />,
              variant: 'primary',
            }}
            className="my-10"
          />
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <BudgetCategoryForm
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget Category"
        message={
          categoryToDelete ? (
            <>
              Are you sure you want to delete the <strong>{categoryToDelete.name}</strong> category?
              Past transactions associated with this category will not be deleted, but this budget
              limit will be removed.
            </>
          ) : (
            ''
          )
        }
        confirmText="Delete Category"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BudgetPage;
