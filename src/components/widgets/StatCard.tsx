import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatTrend {
  value: number; // e.g. 12.5 (representing +12.5% or -12.5%)
  label?: string; // e.g. "vs last month"
  isPositiveGood?: boolean; // default true (for expenses, false)
  direction?: 'up' | 'down' | 'neutral';
}

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: StatTrend;
  icon?: React.ReactNode;
  iconColor?: string;
  accentColor?: string;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  iconColor = 'text-emerald-400',
  accentColor,
  className = '',
  compact = false,
  onClick,
}) => {
  // Determine trend direction and color
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
  let isGood = true;

  if (trend) {
    if (trend.direction) {
      trendDirection = trend.direction;
    } else if (trend.value > 0) {
      trendDirection = 'up';
    } else if (trend.value < 0) {
      trendDirection = 'down';
    } else {
      trendDirection = 'neutral';
    }

    const isPositiveGood = trend.isPositiveGood !== false;
    if (trendDirection === 'up') {
      isGood = isPositiveGood;
    } else if (trendDirection === 'down') {
      isGood = !isPositiveGood;
    } else {
      isGood = true;
    }
  }

  const trendBadgeStyle =
    trendDirection === 'neutral'
      ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50'
      : isGood
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div
      onClick={onClick}
      className={`card relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-zinc-600' : ''
      } ${className}`}
      style={{
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
      }}
    >
      {/* Top row: Label and Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-medium text-zinc-400 tracking-wide">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center shrink-0 ${iconColor}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Middle row: Large formatted number */}
      <div className={`${compact ? 'my-1' : 'my-2'}`}>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtext}</p>
        )}
      </div>

      {/* Bottom row: Trend indicator */}
      {trend && (
        <div className="flex items-center gap-2 mt-auto pt-1">
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${trendBadgeStyle}`}
          >
            {trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
            <span className="tabular-nums">
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
            </span>
          </div>
          {trend.label && (
            <span className="text-[11px] sm:text-xs text-zinc-500 truncate">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
