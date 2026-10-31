import React, { useMemo } from 'react';
import { useFinance } from '../../store/FinanceContext';
import { formatCurrency, calculateBudgetUsage, getMonthKey, renderAppIcon } from '../../utils';

export interface BudgetProgressWidgetProps {
  className?: string;
}

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({
  className = '',
}) => {
  const { budgetCategories, transactions } = useFinance();
  const thisMonthKey = getMonthKey(new Date());

  const usages = useMemo(() => {
    return calculateBudgetUsage(budgetCategories, transactions, thisMonthKey)
      .filter((u) => u.category.limit > 0 || u.spent > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgetCategories, transactions, thisMonthKey]);

  if (usages.length === 0) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-500 text-sm p-4 ${className}`}>
        <p className="font-medium text-zinc-400">No budgets set</p>
        <p className="text-xs text-zinc-600 mt-1">Set category limits to track monthly spending.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col gap-3.5 overflow-y-auto pr-1 ${className}`}>
      {usages.map((u) => {
        const isOver = u.spent > u.category.limit;
        const isApproaching = u.percentage >= 75 && !isOver;

        // Progress bar color
        const barColor = isOver
          ? 'bg-rose-500'
          : isApproaching
          ? 'bg-amber-500'
          : 'bg-emerald-500';

        const badgeColor = isOver
          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          : isApproaching
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

        const displayPct = Math.min(100, u.percentage);

        return (
          <div key={u.category.id} className="flex flex-col gap-1.5">
            {/* Header: Icon, Name, and Amounts */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1 rounded bg-zinc-800 text-zinc-300 shrink-0">{renderAppIcon(u.category.icon, 'w-3.5 h-3.5')}</span>
                <span className="font-medium text-zinc-200 truncate">
                  {u.category.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border tabular-nums ${badgeColor}`}
                >
                  {u.percentage}%
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-semibold text-white tabular-nums">
                  {formatCurrency(u.spent)}
                </span>
                <span className="text-zinc-500"> / {formatCurrency(u.category.limit)}</span>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${displayPct}%` }}
              />
            </div>

            {/* Remaining Note */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-0.5">
              <span>
                {isOver ? (
                  <span className="text-rose-400 font-medium">
                    Over by {formatCurrency(u.spent - u.category.limit)}
                  </span>
                ) : (
                  <span>{formatCurrency(u.remaining)} remaining</span>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetProgressWidget;
