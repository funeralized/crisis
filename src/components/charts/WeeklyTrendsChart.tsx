import React, { useMemo } from 'react';
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
import { formatCurrency, centsToDollars } from '../../utils';

export interface WeeklyTrendsChartProps {
  className?: string;
}

interface DaySpendingPoint {
  dayName: string;
  shortDate: string;
  fullDate: string;
  spending: number;
  spendingCents: number;
  txCount: number;
  isToday: boolean;
}

export const WeeklyTrendsChart: React.FC<WeeklyTrendsChartProps> = ({
  className = '',
}) => {
  const { transactions } = useFinance();

  const data: DaySpendingPoint[] = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Find the Monday of current week
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    // Distance from Monday: Sunday (0) -> -6, Mon (1) -> 0, Tue (2) -> 1, etc.
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const points: DaySpendingPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Match expense transactions on this date
      const dayTxs = transactions.filter(
        (t) => t.type === 'expense' && t.date.startsWith(dateStr)
      );

      const totalCents = dayTxs.reduce((sum, t) => sum + t.amount, 0);

      points.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
        spending: centsToDollars(totalCents),
        spendingCents: totalCents,
        txCount: dayTxs.length,
        isToday: dateStr === todayStr,
      });
    }

    return points;
  }, [transactions]);

  const totalWeekSpending = useMemo(() => {
    return data.reduce((sum, d) => sum + d.spendingCents, 0);
  }, [data]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header info */}
      <div className="flex items-center justify-between pb-3 px-1 text-xs">
        <span className="text-zinc-400">Daily spending this week</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Total:</span>
          <span className="font-semibold text-white tabular-nums">
            {formatCurrency(totalWeekSpending)}
          </span>
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
              <linearGradient id="weeklySpendingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="dayName"
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
                  const item = payload[0].payload as DaySpendingPoint;
                  return (
                    <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-zinc-200">
                          {item.fullDate}
                        </span>
                        {item.isToday && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Spent</span>
                          <span className="font-bold text-amber-400 tabular-nums">
                            {formatCurrency(item.spendingCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-zinc-500">
                          <span>Transactions</span>
                          <span className="tabular-nums font-medium text-zinc-300">
                            {item.txCount}
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
              dataKey="spending"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#weeklySpendingGrad)"
              activeDot={{
                r: 5,
                fill: '#f59e0b',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyTrendsChart;
