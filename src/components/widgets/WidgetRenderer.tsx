import React from 'react';
import type { DashboardWidget } from '../../types';
import { GripVertical, X, TrendingUp, DollarSign, Wallet, PiggyBank, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../../store/FinanceContext';
import {
  formatCurrency,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateTotalBalance,
  calculateSavingsRate,
  getMonthKey,
} from '../../utils';

// Chart components
import IncomeVsExpensesChart from '../charts/IncomeVsExpensesChart';
import SpendingPieChart from '../charts/SpendingPieChart';
import SavingsTimelineChart from '../charts/SavingsTimelineChart';
import CashFlowChart from '../charts/CashFlowChart';
import WeeklyTrendsChart from '../charts/WeeklyTrendsChart';
import BudgetVsActualChart from '../charts/BudgetVsActualChart';

// Widget components
import StatCard from './StatCard';
import RecentTransactionsWidget from './RecentTransactionsWidget';
import BudgetProgressWidget from './BudgetProgressWidget';
import BudgetPieWidget from './BudgetPieWidget';
import SavingsGoalsWidget from './SavingsGoalsWidget';

export interface WidgetRendererProps {
  widget: DashboardWidget;
  isEditMode?: boolean;
  onRemove?: (id: string) => void;
  className?: string;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isEditMode = false,
  onRemove,
  className = '',
}) => {
  const { transactions, settings, isLoading } = useFinance();

  const now = new Date();
  const thisMonthKey = getMonthKey(now);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(prevDate);

  // Render the specific widget content based on widget.type
  const renderWidgetContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="spinner-sm" />
        </div>
      );
    }

    switch (widget.type) {
      case 'total-balance': {
        const currentBalance = calculateTotalBalance(transactions, settings.startingBalance);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const prevTxs = transactions.filter((t) => new Date(t.date) <= lastMonthEnd);
        const lastBalance = calculateTotalBalance(prevTxs, settings.startingBalance);
        const diff = currentBalance - lastBalance;
        const trendPct = lastBalance !== 0 ? Math.round((diff / Math.abs(lastBalance)) * 100) : 0;

        return (
          <StatCard
            label="Total Balance"
            value={formatCurrency(currentBalance)}
            trend={{
              value: trendPct,
              label: 'vs last month',
              isPositiveGood: true,
            }}
            icon={<Wallet className="w-5 h-5" />}
            iconColor="text-emerald-400"
            className="h-full border-0 shadow-none !p-0 bg-transparent"
          />
        );
      }

      case 'monthly-income': {
        const currentIncome = calculateMonthlyIncome(transactions, thisMonthKey);
        const lastIncome = calculateMonthlyIncome(transactions, lastMonthKey);
        const diff = currentIncome - lastIncome;
        const trendPct = lastIncome > 0 ? Math.round((diff / lastIncome) * 100) : currentIncome > 0 ? 100 : 0;

        return (
          <StatCard
            label="Monthly Income"
            value={formatCurrency(currentIncome)}
            trend={{
              value: trendPct,
              label: 'vs last month',
              isPositiveGood: true,
            }}
            icon={<DollarSign className="w-5 h-5" />}
            iconColor="text-emerald-400"
            className="h-full border-0 shadow-none !p-0 bg-transparent"
          />
        );
      }

      case 'monthly-expenses': {
        const currentExp = calculateMonthlyExpenses(transactions, thisMonthKey);
        const lastExp = calculateMonthlyExpenses(transactions, lastMonthKey);
        const diff = currentExp - lastExp;
        const trendPct = lastExp > 0 ? Math.round((diff / lastExp) * 100) : currentExp > 0 ? 100 : 0;

        return (
          <StatCard
            label="Monthly Expenses"
            value={formatCurrency(currentExp)}
            trend={{
              value: trendPct,
              label: 'vs last month',
              isPositiveGood: false,
            }}
            icon={<ArrowDownRight className="w-5 h-5" />}
            iconColor="text-rose-400"
            className="h-full border-0 shadow-none !p-0 bg-transparent"
          />
        );
      }

      case 'savings-rate': {
        const currentInc = calculateMonthlyIncome(transactions, thisMonthKey);
        const currentExp = calculateMonthlyExpenses(transactions, thisMonthKey);
        const currentRate = calculateSavingsRate(currentInc, currentExp);

        const lastInc = calculateMonthlyIncome(transactions, lastMonthKey);
        const lastExp = calculateMonthlyExpenses(transactions, lastMonthKey);
        const lastRate = calculateSavingsRate(lastInc, lastExp);
        const rateDiff = currentRate - lastRate;

        return (
          <StatCard
            label="Savings Rate"
            value={`${currentRate}%`}
            trend={{
              value: rateDiff,
              label: 'pp vs last mo',
              isPositiveGood: true,
            }}
            icon={<PiggyBank className="w-5 h-5" />}
            iconColor="text-blue-400"
            className="h-full border-0 shadow-none !p-0 bg-transparent"
          />
        );
      }

      case 'income-vs-expenses':
      case 'monthly-comparison':
        return <IncomeVsExpensesChart initialRange={widget.config?.dateRange === 'year' ? '1yr' : '6mo'} />;

      case 'spending-pie':
        return <SpendingPieChart />;

      case 'savings-timeline':
        return <SavingsTimelineChart />;

      case 'cash-flow':
        return <CashFlowChart />;

      case 'weekly-trends':
        return <WeeklyTrendsChart />;

      case 'category-spending':
        return <BudgetVsActualChart />;

      case 'budget-progress':
        return <BudgetProgressWidget />;

      case 'budget-pie':
        return <BudgetPieWidget />;

      case 'savings-progress':
      case 'savings-goal-card':
        return <SavingsGoalsWidget />;

      case 'recent-transactions':
        return <RecentTransactionsWidget limit={8} />;

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
            <TrendingUp className="w-6 h-6 text-zinc-600 mb-1" />
            <p>Widget type &quot;{widget.type}&quot;</p>
          </div>
        );
    }
  };

  const isStatWidget = [
    'total-balance',
    'monthly-income',
    'monthly-expenses',
    'savings-rate',
  ].includes(widget.type);

  return (
    <div
      className={`card h-full w-full flex flex-col overflow-hidden bg-[#141416] border border-[#27272a] rounded-xl shadow-sm transition-all duration-200 ${
        isEditMode ? 'ring-1 ring-emerald-500/30' : ''
      } ${className}`}
    >
      {/* Widget Header (omitted for stat widgets unless in edit mode) */}
      {(!isStatWidget || isEditMode) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]/70 bg-[#161619] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isEditMode && (
              <button
                type="button"
                className="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                title="Drag to reposition"
                aria-label="Drag handle"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-zinc-100 truncate tracking-tight">
              {widget.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isEditMode && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(widget.id)}
                className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove widget"
                aria-label="Remove widget"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Widget Body Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isStatWidget && !isEditMode ? 'p-0' : 'p-3.5 sm:p-4'}`}>
        {renderWidgetContent()}
      </div>
    </div>
  );
};

export default WidgetRenderer;
