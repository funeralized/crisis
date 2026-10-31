import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinance } from '../../store/FinanceContext';
import {
  formatCurrency,
  centsToDollars,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  getMonthKey,
} from '../../utils';

export interface CashFlowChartProps {
  className?: string;
}

interface CashFlowPoint {
  month: string;
  fullMonth: string;
  netFlow: number;
  netFlowCents: number;
  runningTotal: number;
  runningTotalCents: number;
  incomeCents: number;
  expenseCents: number;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  className = '',
}) => {
  const { transactions } = useFinance();

  const data: CashFlowPoint[] = useMemo(() => {
    const points: CashFlowPoint[] = [];
    const now = new Date();
    let accumulated = 0;

    // Past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const inc = calculateMonthlyIncome(transactions, key);
      const exp = calculateMonthlyExpenses(transactions, key);
      const net = inc - exp;

      accumulated += net;

      points.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        netFlow: centsToDollars(net),
        netFlowCents: net,
        runningTotal: centsToDollars(accumulated),
        runningTotalCents: accumulated,
        incomeCents: inc,
        expenseCents: exp,
      });
    }

    return points;
  }, [transactions]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between pb-2 px-1 text-xs text-zinc-400">
        <span>Monthly net cash flow with cumulative trend</span>
        <span className="text-[11px] text-zinc-500">Last 6 Months</span>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
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
                `$${val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(0)}k` : val}`
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CashFlowPoint;
                  return (
                    <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[190px]">
                      <p className="text-xs font-semibold text-zinc-300 mb-2">
                        {item.fullMonth}
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Income</span>
                          <span className="font-medium text-emerald-400 tabular-nums">
                            {formatCurrency(item.incomeCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400">Expenses</span>
                          <span className="font-medium text-rose-400 tabular-nums">
                            {formatCurrency(item.expenseCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-800 font-medium">
                          <span className="text-zinc-300">Net Flow</span>
                          <span
                            className={`tabular-nums font-semibold ${
                              item.netFlowCents >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.netFlowCents >= 0 ? '+' : ''}
                            {formatCurrency(item.netFlowCents)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 text-blue-400 font-medium">
                          <span className="text-blue-300/80">Running Total</span>
                          <span className="tabular-nums font-bold">
                            {item.runningTotalCents >= 0 ? '+' : ''}
                            {formatCurrency(item.runningTotalCents)}
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
                <span className="text-zinc-300 text-xs">
                  {value === 'netFlow' ? 'Net Cash Flow' : 'Running Total'}
                </span>
              )}
            />
            <Bar
              name="netFlow"
              dataKey="netFlow"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.netFlow >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              name="runningTotal"
              dataKey="runningTotal"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#3b82f6', stroke: '#141416', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
