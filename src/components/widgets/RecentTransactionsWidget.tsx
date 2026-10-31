import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import { useFinance } from '../../store/FinanceContext';
import { formatCurrency, formatDateShort, CATEGORY_COLORS } from '../../utils';

export interface RecentTransactionsWidgetProps {
  limit?: number;
  className?: string;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  limit = 7,
  className = '',
}) => {
  const { transactions } = useFinance();

  const recentList = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  if (recentList.length === 0) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-500 text-sm p-4 ${className}`}>
        <ReceiptText className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
        <p className="font-medium text-zinc-400">No transactions recorded</p>
        <p className="text-xs text-zinc-600 mt-0.5">Transactions you add will appear here.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col divide-y divide-zinc-800/60 overflow-y-auto pr-1 ${className}`}>
      {recentList.map((tx) => {
        const isIncome = tx.type === 'income';
        const catColor = CATEGORY_COLORS[tx.category] || '#71717a';

        return (
          <div
            key={tx.id}
            className="flex items-center justify-between py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors group"
          >
            {/* Left: Icon & Description */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isIncome ? (
                  <ArrowDownLeft className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-emerald-300/90 transition-colors">
                  {tx.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded"
                    style={{
                      backgroundColor: `${catColor}15`,
                      color: catColor,
                    }}
                  >
                    {tx.category}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatDateShort(tx.date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Amount */}
            <div className="text-right shrink-0 ml-3">
              <span
                className={`text-xs sm:text-sm font-semibold tabular-nums ${
                  isIncome ? 'text-emerald-400' : 'text-zinc-200'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentTransactionsWidget;
