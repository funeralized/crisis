import React from 'react';
import { Target } from 'lucide-react';
import { useFinance } from '../../store/FinanceContext';
import { formatCurrency, formatDateShort } from '../../utils';

export interface SavingsGoalsWidgetProps {
  className?: string;
}

export const SavingsGoalsWidget: React.FC<SavingsGoalsWidgetProps> = ({
  className = '',
}) => {
  const { savingsGoals } = useFinance();

  if (savingsGoals.length === 0) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-500 text-sm p-4 ${className}`}>
        <Target className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
        <p className="font-medium text-zinc-400">No savings goals</p>
        <p className="text-xs text-zinc-600 mt-1">Create a goal to begin tracking your savings targets.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col gap-3.5 overflow-y-auto pr-1 ${className}`}>
      {savingsGoals.map((goal) => {
        const pct =
          goal.targetAmount > 0
            ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            : 0;

        const isCompleted = goal.currentAmount >= goal.targetAmount;
        const color = goal.color || '#10b981';

        return (
          <div key={goal.id} className="flex flex-col gap-1.5 group">
            {/* Top row: Icon, Name, Target Date & Current/Target */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0 p-1 rounded-lg bg-zinc-800/80 border border-zinc-700/40">
                  {goal.icon || '🎯'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200 truncate">
                      {goal.name}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        Completed
                      </span>
                    )}
                  </div>
                  {goal.targetDate && (
                    <span className="text-[10px] text-zinc-500">
                      Target: {formatDateShort(goal.targetDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-semibold text-white tabular-nums">
                  {formatCurrency(goal.currentAmount)}
                </div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  of {formatCurrency(goal.targetAmount)} ({pct}%)
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SavingsGoalsWidget;
