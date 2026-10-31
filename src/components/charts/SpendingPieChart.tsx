import React, { useMemo, useState } from 'react';
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
  centsToDollars,
  calculateCategorySpending,
  getMonthKey,
  CATEGORY_COLORS,
} from '../../utils';

export interface SpendingPieChartProps {
  monthKey?: string;
  className?: string;
}

interface CategoryPieItem {
  name: string;
  value: number;
  cents: number;
  color: string;
  percentage: number;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  monthKey,
  className = '',
}) => {
  const { transactions } = useFinance();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const key = monthKey || getMonthKey(new Date());

  const { items, totalCents } = useMemo(() => {
    const spending = calculateCategorySpending(transactions, key);
    const total = Object.values(spending).reduce((sum, amt) => sum + amt, 0);

    const mapped: CategoryPieItem[] = Object.entries(spending)
      .filter(([, amt]) => amt > 0)
      .map(([cat, amt]) => ({
        name: cat,
        value: centsToDollars(amt),
        cents: amt,
        color: CATEGORY_COLORS[cat] || '#6b7280',
        percentage: total > 0 ? (amt / total) * 100 : 0,
      }))
      .sort((a, b) => b.cents - a.cents);

    return { items: mapped, totalCents: total };
  }, [transactions, key]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  if (items.length === 0) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-500 text-sm p-4 ${className}`}>
        <p className="font-medium text-zinc-400">No expenses this month</p>
        <p className="text-xs text-zinc-600 mt-1">Expenses will appear here as you add them.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col md:flex-row items-center justify-between gap-4 p-2 ${className}`}>
      {/* Donut Chart Container */}
      <div className="relative w-full md:w-1/2 h-[220px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="#141416"
              strokeWidth={2}
            >
              {items.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.color}
                  style={{
                    filter:
                      activeIndex === index
                        ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,255,255,0.2))'
                        : undefined,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CategoryPieItem;
                  return (
                    <div className="bg-[#1e1e22] border border-[#27272a] rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-xs font-semibold text-white">
                          {data.name}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center justify-between gap-3">
                        <span className="font-semibold text-white tabular-nums">
                          {formatCurrency(data.cents)}
                        </span>
                        <span className="text-zinc-500 font-medium">
                          ({data.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {activeItem ? (
            <>
              <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[100px]">
                {activeItem.name}
              </span>
              <span className="text-base font-bold text-white tabular-nums">
                {formatCurrency(activeItem.cents)}
              </span>
              <span className="text-[10px] text-zinc-500">
                {activeItem.percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-zinc-500">Total Spent</span>
              <span className="text-base font-bold text-white tabular-nums">
                {formatCurrency(totalCents)}
              </span>
              <span className="text-[10px] text-zinc-500">This Month</span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="w-full md:w-1/2 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const isSelected = activeIndex === index;
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-zinc-800/80 border border-zinc-700/60'
                  : 'hover:bg-zinc-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-zinc-300 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0 ml-2">
                <span className="font-semibold text-white tabular-nums">
                  {formatCurrency(item.cents)}
                </span>
                <span className="text-[11px] text-zinc-500 tabular-nums w-10 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpendingPieChart;
