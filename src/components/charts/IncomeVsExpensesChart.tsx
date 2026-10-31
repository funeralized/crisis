import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinance } from '../../store/FinanceContext';
import { formatCurrency, centsToDollars, calculateMonthlyIncome, calculateMonthlyExpenses, getMonthKey } from '../../utils';

export interface IncomeVsExpensesChartProps {
  initialRange?: '3mo' | '6mo' | '1yr';
  className?: string;
}

interface MonthDataPoint {
  key: string;
  month: string;
  fullMonth: string;
  income: number;
  expenses: number;
  incomeCents: number;
  expenseCents: number;
  net: number;
}

export const IncomeVsExpensesChart: React.FC<IncomeVsExpensesChartProps> = ({
  initialRange = '6mo',
  className = '',
}) => {
  const { transactions } = useFinance();
  const [range, setRange] = useState<'3mo' | '6mo' | '1yr'>(initialRange);

  const monthsCount = range === '3mo' ? 3 : range === '6mo' ? 6 : 12;

  const data: MonthDataPoint[] = useMemo(() => {
    const points: MonthDataPoint[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const incomeCents = calculateMonthlyIncome(transactions, key);
      const expenseCents = calculateMonthlyExpenses(transactions, key);

      points.push({
        key,
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        income: centsToDollars(incomeCents),
        expenses: centsToDollars(expenseCents),
        incomeCents,
        expenseCents,
        net: centsToDollars(incomeCents - expenseCents),
      });
    }

    return points;
  }, [transactions, monthsCount]);

  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Controls Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="text-xs text-zinc-400">
          Side-by-side monthly comparison
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          {(['3mo', '6mo', '1yr'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                range === r
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r === '3mo' ? '3M' : r === '6mo' ? '6M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[220px]">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            No income or expense data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as MonthDataPoint;
                    return (
                      <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[180px]">
                        <p className="text-xs font-semibold text-zinc-300 mb-2">
                          {item.fullMonth}
                        </p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Income
                            </span>
                            <span className="font-semibold text-white tabular-nums">
                              {formatCurrency(item.incomeCents)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-rose-400">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Expenses
                            </span>
                            <span className="font-semibold text-white tabular-nums">
                              {formatCurrency(item.expenseCents)}
                            </span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center justify-between gap-4 font-medium">
                            <span className="text-zinc-400">Net Flow</span>
                            <span
                              className={`tabular-nums font-semibold ${
                                item.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {item.net >= 0 ? '+' : ''}
                              {formatCurrency(item.incomeCents - item.expenseCents)}
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
                wrapperStyle={{ paddingBottom: 8, fontSize: '12px' }}
                formatter={(value: string) => (
                  <span className="text-zinc-300 capitalize text-xs">
                    {value}
                  </span>
                )}
              />
              <Bar
                name="income"
                dataKey="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="expenses"
                dataKey="expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default IncomeVsExpensesChart;
