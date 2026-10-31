import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useFinance } from '../../store/FinanceContext';
import {
  formatCurrency,
  centsToDollars,
  calculateBudgetUsage,
  getMonthKey,
} from '../../utils';

export interface BudgetVsActualChartProps {
  className?: string;
  monthKey?: string;
}

interface BudgetChartItem {
  name: string;
  spent: number;
  limit: number;
  spentCents: number;
  limitCents: number;
  remainingCents: number;
  percentage: number;
  color: string;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({
  className = '',
  monthKey,
}) => {
  const { budgetCategories, transactions } = useFinance();
  const currentMonthKey = monthKey || getMonthKey(new Date());

  const data: BudgetChartItem[] = useMemo(() => {
    const usages = calculateBudgetUsage(budgetCategories, transactions, currentMonthKey);

    return usages
      .filter((u) => u.category.limit > 0 || u.spent > 0)
      .map((u) => {
        let statusColor = '#10b981'; // green (< 75%)
        if (u.percentage > 100) {
          statusColor = '#ef4444'; // red (> 100%)
        } else if (u.percentage >= 75) {
          statusColor = '#f59e0b'; // yellow (75-100%)
        }

        return {
          name: u.category.name,
          spent: centsToDollars(u.spent),
          limit: centsToDollars(u.category.limit),
          spentCents: u.spent,
          limitCents: u.category.limit,
          remainingCents: u.remaining,
          percentage: u.percentage,
          color: statusColor,
        };
      })
      .sort((a, b) => b.limit - a.limit);
  }, [budgetCategories, transactions, currentMonthKey]);

  if (data.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-zinc-500 text-sm ${className}`}>
        No active budget categories found.
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Subheader info */}
      <div className="flex items-center justify-between pb-2 px-1 text-xs text-zinc-400">
        <span>Actual spending vs monthly limits</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;75%
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 75-100%
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;100%
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tickFormatter={(val: number) => `$${val}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#a1a1aa"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={85}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as BudgetChartItem;
                  return (
                    <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[190px]">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs font-semibold text-white">
                          {item.name}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                          }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Spent</span>
                          <span className="font-semibold text-white tabular-nums">
                            {formatCurrency(item.spentCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Budget Limit</span>
                          <span className="font-medium text-zinc-300 tabular-nums">
                            {formatCurrency(item.limitCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-800">
                          <span className="text-zinc-400">Remaining</span>
                          <span
                            className={`tabular-nums font-semibold ${
                              item.spentCents > item.limitCents
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.spentCents > item.limitCents
                              ? `-${formatCurrency(item.spentCents - item.limitCents)}`
                              : formatCurrency(item.remainingCents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 6, fontSize: '11px' }}
              formatter={(val: string) => (
                <span className="text-zinc-300 text-xs">
                  {val === 'spent' ? 'Actual Spent' : 'Budget Limit'}
                </span>
              )}
            />
            <Bar
              name="spent"
              dataKey="spent"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar
              name="limit"
              dataKey="limit"
              fill="#3f3f46"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetVsActualChart;
