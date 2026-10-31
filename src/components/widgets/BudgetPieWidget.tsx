import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../../store/FinanceContext';
import {
  formatCurrency,
  getMonthKey,
  getMonthName,
  renderAppIcon,
} from '../../utils';
import { PieChart as PieIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PieSliceItem {
  id: string;
  name: string;
  value: number; // in cents
  color: string;
  icon?: string;
  isRemaining?: boolean;
  percentage: number;
}

export const BudgetPieWidget: React.FC = () => {
  const { transactions, budgetCategories } = useFinance();

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const monthLabel = getMonthName(currentMonthKey);

  // 1. Calculate spending per category for current month
  const { slices, totalSpent, totalBudget, remainingBudget, isOverBudget } = useMemo(() => {
    // Current month expense transactions
    const monthlyExpenses = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const txMonthKey = getMonthKey(new Date(tx.date));
      return txMonthKey === currentMonthKey;
    });

    const spentMap: Record<string, number> = {};
    let totalExp = 0;

    for (const tx of monthlyExpenses) {
      const catId = tx.category || 'uncategorized';
      spentMap[catId] = (spentMap[catId] || 0) + tx.amount;
      totalExp += tx.amount;
    }

    // Total budget across all configured categories
    const totalLimit = budgetCategories.reduce((acc, cat) => acc + (cat.limit || 0), 0);
    const remaining = Math.max(0, totalLimit - totalExp);
    const over = totalExp > totalLimit && totalLimit > 0;

    const baseSlices: PieSliceItem[] = [];
    const denominator = Math.max(totalExp + remaining, 1);

    // Add spent categories
    for (const cat of budgetCategories) {
      const spent = spentMap[cat.name] || spentMap[cat.id] || 0;
      if (spent > 0) {
        baseSlices.push({
          id: cat.id,
          name: cat.name,
          value: spent,
          color: cat.color || '#3b82f6',
          icon: cat.icon,
          isRemaining: false,
          percentage: Math.round((spent / denominator) * 100),
        });
      }
    }

    // Uncategorized spending
    if (spentMap['uncategorized'] && spentMap['uncategorized'] > 0) {
      baseSlices.push({
        id: 'uncategorized',
        name: 'Other / Uncategorized',
        value: spentMap['uncategorized'],
        color: '#71717a',
        isRemaining: false,
        percentage: Math.round((spentMap['uncategorized'] / denominator) * 100),
      });
    }

    // Add Remaining Budget slice if there is budget left
    if (remaining > 0) {
      baseSlices.push({
        id: 'remaining',
        name: 'Remaining Budget',
        value: remaining,
        color: '#10b981', // emerald
        isRemaining: true,
        percentage: Math.round((remaining / denominator) * 100),
      });
    }

    return {
      slices: baseSlices,
      totalSpent: totalExp,
      totalBudget: totalLimit,
      remainingBudget: remaining,
      isOverBudget: over,
    };
  }, [transactions, budgetCategories, currentMonthKey]);

  if (budgetCategories.length === 0 && totalSpent === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <PieIcon className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="text-xs text-zinc-400 font-medium">No budget or spending this month</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Add transactions or budgets to see your breakdown.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-between">
      {/* Header Stat Overview */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            {monthLabel} Budget
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
              {formatCurrency(totalSpent)}
            </span>
            {totalBudget > 0 && (
              <span className="text-xs text-zinc-500 tabular-nums">
                of {formatCurrency(totalBudget)}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Remaining
          </span>
          <span
            className={`text-sm sm:text-base font-semibold tabular-nums inline-flex items-center gap-1 ${
              isOverBudget
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Over by {formatCurrency(totalSpent - totalBudget)}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {formatCurrency(remainingBudget)}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Pie Chart Donut */}
      <div className="relative w-full h-[180px] sm:h-[200px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as PieSliceItem;
                  return (
                    <div className="bg-[#1c1c1f] border border-zinc-700/80 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-semibold text-white">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-400 tabular-nums">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="font-bold text-emerald-400 tabular-nums">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              stroke="#141416"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            {isOverBudget ? 'Over Budget' : 'Spent'}
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {Math.round((totalSpent / (totalBudget || totalSpent || 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* Legend / Category List */}
      <div className="mt-2 space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
        {slices.map((slice) => (
          <div
            key={slice.id}
            className="flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              {slice.icon && (
                <span className="text-zinc-400">
                  {renderAppIcon(slice.icon, 'w-3.5 h-3.5')}
                </span>
              )}
              <span className={`truncate font-medium ${slice.isRemaining ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {slice.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="font-semibold text-white">
                {formatCurrency(slice.value)}
              </span>
              <span className="text-[11px] text-zinc-500 min-w-[28px] text-right">
                {slice.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetPieWidget;
