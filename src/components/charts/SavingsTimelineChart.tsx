import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../../store/FinanceContext';
import {
  formatCurrency,
  centsToDollars,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  getMonthKey,
} from '../../utils';

export interface SavingsTimelineChartProps {
  className?: string;
}

interface TimelinePoint {
  month: string;
  fullMonth: string;
  savings: number; // in dollars for chart
  savingsCents: number;
  monthlyChangeCents: number;
}

export const SavingsTimelineChart: React.FC<SavingsTimelineChartProps> = ({
  className = '',
}) => {
  const { transactions, settings } = useFinance();
  const [range, setRange] = useState<'6mo' | '1yr'>('6mo');

  const monthsCount = range === '6mo' ? 6 : 12;

  const data: TimelinePoint[] = useMemo(() => {
    const points: TimelinePoint[] = [];
    const now = new Date();

    // Determine initial baseline
    let runningSavings = settings.startingBalance || 0;

    // Calculate monthly changes chronologically
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const inc = calculateMonthlyIncome(transactions, key);
      const exp = calculateMonthlyExpenses(transactions, key);
      const net = inc - exp;

      // Add net savings (accumulate)
      runningSavings += net;

      points.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        savings: centsToDollars(Math.max(0, runningSavings)),
        savingsCents: Math.max(0, runningSavings),
        monthlyChangeCents: net,
      });
    }

    return points;
  }, [transactions, settings.startingBalance, monthsCount]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="text-xs text-zinc-400">
          Cumulative net savings accumulation
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          {(['6mo', '1yr'] as const).map((r) => (
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
              {r === '6mo' ? '6M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="savingsTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as TimelinePoint;
                  return (
                    <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[170px]">
                      <p className="text-xs font-semibold text-zinc-300 mb-1.5">
                        {item.fullMonth}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Total Savings</span>
                          <span className="font-bold text-emerald-400 tabular-nums">
                            {formatCurrency(item.savingsCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-800">
                          <span className="text-zinc-500">Monthly Net</span>
                          <span
                            className={`tabular-nums font-semibold ${
                              item.monthlyChangeCents >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.monthlyChangeCents >= 0 ? '+' : ''}
                            {formatCurrency(item.monthlyChangeCents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#savingsTimelineGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SavingsTimelineChart;
