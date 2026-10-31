import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useFinance } from '../store/FinanceContext';
import {
  formatCurrency,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateTotalBalance,
  calculateSavingsRate,
  getMonthKey,
  generateId,
} from '../utils';
import { defaultDashboardLayout } from '../db/sampleData';
import type { DashboardWidget, DashboardLayout, WidgetType } from '../types';

// Icons
import {
  Wallet,
  TrendingUp,
  ArrowDownRight,
  PiggyBank,
  Plus,
  RotateCcw,
  Check,
  Edit3,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Layers,
  Receipt,
  Target,
  SlidersHorizontal,
} from 'lucide-react';

// Components
import StatCard from '../components/widgets/StatCard';
import WidgetRenderer from '../components/widgets/WidgetRenderer';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface AvailableWidgetDef {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultW: number;
  defaultH: number;
}

const AVAILABLE_WIDGETS: AvailableWidgetDef[] = [
  {
    type: 'income-vs-expenses',
    title: 'Income vs Expenses',
    description: 'Compare side-by-side monthly income and expenses with date range selector',
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'spending-pie',
    title: 'Spending Breakdown',
    description: 'Interactive donut breakdown of category spending with legend',
    icon: <PieIcon className="w-5 h-5 text-amber-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'cash-flow',
    title: 'Cash Flow Analysis',
    description: 'Net cash flow bars per month with running total cumulative overlay',
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'savings-timeline',
    title: 'Savings Timeline',
    description: 'Cumulative savings growth over time with smooth green gradient area',
    icon: <PiggyBank className="w-5 h-5 text-emerald-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'weekly-trends',
    title: 'Weekly Spending Trends',
    description: 'Daily expense line chart for each day of the current week',
    icon: <Calendar className="w-5 h-5 text-amber-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'category-spending',
    title: 'Budget vs Actual Chart',
    description: 'Horizontal bar comparison of actual spending vs monthly budget limits',
    icon: <SlidersHorizontal className="w-5 h-5 text-cyan-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'budget-progress',
    title: 'Budget Progress Overview',
    description: 'Progress bars and remaining balance for each budget category',
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'recent-transactions',
    title: 'Recent Transactions',
    description: 'Compact list of last 8 transactions with category tags and color-coded amounts',
    icon: <Receipt className="w-5 h-5 text-purple-400" />,
    defaultW: 6,
    defaultH: 4,
  },
  {
    type: 'savings-progress',
    title: 'Savings Goals',
    description: 'Compact progress overview of active savings goals toward targets',
    icon: <Target className="w-5 h-5 text-emerald-400" />,
    defaultW: 12,
    defaultH: 3,
  },
];

export const DashboardPage: React.FC = () => {
  const {
    transactions,
    settings,
    dashboardLayouts,
    saveDashboardLayout,
  } = useFinance();

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Measure responsive width for react-grid-layout
  const { width, containerRef, mounted } = useContainerWidth();

  // Active dashboard layout
  const currentLayout: DashboardLayout = useMemo(() => {
    return dashboardLayouts[0] || defaultDashboardLayout;
  }, [dashboardLayouts]);

  // Filter out top stat widgets from the grid area to avoid duplication
  const gridWidgets = useMemo(() => {
    const list = currentLayout?.widgets || [];
    const filtered = list.filter(
      (w) =>
        !['total-balance', 'monthly-income', 'monthly-expenses', 'savings-rate'].includes(
          w.type
        )
    );

    // If filtered list is empty but default has them, fallback to default non-stat widgets
    if (filtered.length === 0 && list.length > 0) {
      return list;
    }
    return filtered;
  }, [currentLayout]);

  // Convert widgets to RGL layout items
  const rglLayout: Layout = useMemo(() => {
    return gridWidgets.map((w) => ({
      i: w.id,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: 3,
      minH: 2,
    }));
  }, [gridWidgets]);

  // Handle RGL layout change (on drag/resize)
  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode) return;

      const updatedWidgets = gridWidgets.map((w) => {
        const item = newLayout.find((l) => l.i === w.id);
        if (item) {
          return {
            ...w,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          };
        }
        return w;
      });

      // Retain any other widgets (like stat cards if stored in layout)
      const nonGridWidgets = (currentLayout?.widgets || []).filter((w) =>
        ['total-balance', 'monthly-income', 'monthly-expenses', 'savings-rate'].includes(
          w.type
        )
      );

      const finalLayout: DashboardLayout = {
        ...currentLayout,
        widgets: [...nonGridWidgets, ...updatedWidgets],
      };

      saveDashboardLayout(finalLayout);
    },
    [isEditMode, gridWidgets, currentLayout, saveDashboardLayout]
  );

  // Remove a widget
  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      const updated = (currentLayout?.widgets || []).filter((w) => w.id !== widgetId);
      saveDashboardLayout({
        ...currentLayout,
        widgets: updated,
      });
    },
    [currentLayout, saveDashboardLayout]
  );

  // Add a new widget from modal
  const handleAddWidget = useCallback(
    (def: AvailableWidgetDef) => {
      // Find highest Y to append at bottom
      const maxY = gridWidgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);

      const newWidget: DashboardWidget = {
        id: generateId(),
        type: def.type,
        title: def.title,
        x: 0,
        y: maxY,
        w: def.defaultW,
        h: def.defaultH,
      };

      const updatedWidgets = [...(currentLayout?.widgets || []), newWidget];
      saveDashboardLayout({
        ...currentLayout,
        widgets: updatedWidgets,
      });

      setIsAddModalOpen(false);
    },
    [gridWidgets, currentLayout, saveDashboardLayout]
  );

  // Reset layout to default
  const handleResetLayout = useCallback(() => {
    saveDashboardLayout(defaultDashboardLayout);
  }, [saveDashboardLayout]);

  // ─── Financial Overview Calculations ─────────────────────────
  const now = new Date();
  const thisMonthKey = getMonthKey(now);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(prevDate);

  // 1. Total Balance & Trend
  const currentBalance = calculateTotalBalance(transactions, settings.startingBalance);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const prevTxs = transactions.filter((t) => new Date(t.date) <= lastMonthEnd);
  const lastBalance = calculateTotalBalance(prevTxs, settings.startingBalance);
  const balanceDiff = currentBalance - lastBalance;
  const balanceTrendPct =
    lastBalance !== 0
      ? Math.round((balanceDiff / Math.abs(lastBalance)) * 100)
      : 0;

  // 2. Monthly Income & Trend
  const currentIncome = calculateMonthlyIncome(transactions, thisMonthKey);
  const lastIncome = calculateMonthlyIncome(transactions, lastMonthKey);
  const incomeDiff = currentIncome - lastIncome;
  const incomeTrendPct =
    lastIncome > 0
      ? Math.round((incomeDiff / lastIncome) * 100)
      : currentIncome > 0
      ? 100
      : 0;

  // 3. Monthly Expenses & Trend
  const currentExpenses = calculateMonthlyExpenses(transactions, thisMonthKey);
  const lastExpenses = calculateMonthlyExpenses(transactions, lastMonthKey);
  const expenseDiff = currentExpenses - lastExpenses;
  const expenseTrendPct =
    lastExpenses > 0
      ? Math.round((expenseDiff / lastExpenses) * 100)
      : currentExpenses > 0
      ? 100
      : 0;

  // 4. Savings Rate & Trend
  const currentSavingsRate = calculateSavingsRate(currentIncome, currentExpenses);
  const lastSavingsRate = calculateSavingsRate(lastIncome, lastExpenses);
  const savingsRateDiff = currentSavingsRate - lastSavingsRate;

  return (
    <div className="w-full pb-16 space-y-6">
      {/* ─── Top Dashboard Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time financial performance and portfolio insights
          </p>
        </div>

        {/* Dashboard Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isEditMode ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-4 h-4 text-emerald-400" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5 text-zinc-400" />}
                onClick={handleResetLayout}
                title="Reset widgets to default layout"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={() => setIsEditMode(false)}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5 text-zinc-400" />}
              onClick={() => setIsEditMode(true)}
            >
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditMode && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Edit Mode Active:</strong> Drag widgets by the handle icon to move, drag corners to resize, or remove with the &times; button.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className="text-xs underline hover:text-white font-medium ml-4 shrink-0"
          >
            Finish Editing
          </button>
        </div>
      )}

      {/* ─── Financial Overview Cards (Top Row) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Balance */}
        <StatCard
          label="Total Balance"
          value={formatCurrency(currentBalance)}
          subtext="Net liquidity across all accounts"
          trend={{
            value: balanceTrendPct,
            label: 'vs last month',
            isPositiveGood: true,
          }}
          icon={<Wallet className="w-5 h-5" />}
          iconColor="text-emerald-400"
          accentColor="#10b981"
        />

        {/* Card 2: Monthly Income */}
        <StatCard
          label="Monthly Income"
          value={formatCurrency(currentIncome)}
          subtext={`Earned in ${now.toLocaleDateString('en-US', { month: 'short' })}`}
          trend={{
            value: incomeTrendPct,
            label: 'vs last month',
            isPositiveGood: true,
          }}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-400"
          accentColor="#10b981"
        />

        {/* Card 3: Monthly Expenses */}
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(currentExpenses)}
          subtext={`Spent in ${now.toLocaleDateString('en-US', { month: 'short' })}`}
          trend={{
            value: expenseTrendPct,
            label: 'vs last month',
            isPositiveGood: false,
          }}
          icon={<ArrowDownRight className="w-5 h-5" />}
          iconColor="text-rose-400"
          accentColor="#ef4444"
        />

        {/* Card 4: Savings Rate */}
        <StatCard
          label="Savings Rate"
          value={`${currentSavingsRate}%`}
          subtext="Net income saved this month"
          trend={{
            value: savingsRateDiff,
            label: 'pp vs last month',
            isPositiveGood: true,
          }}
          icon={<PiggyBank className="w-5 h-5" />}
          iconColor="text-blue-400"
          accentColor="#3b82f6"
        />
      </div>

      {/* ─── Widget Grid Area ─────────────────────────────────── */}
      <div ref={containerRef} className="w-full">
        {gridWidgets.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center">
            <BarChart3 className="w-12 h-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No widgets on dashboard</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
              Customize your dashboard with financial charts, budget monitors, and transaction feeds.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Widget
            </Button>
          </div>
        ) : mounted ? (
          <ResponsiveGridLayout
            width={width}
            breakpoints={{ lg: 1200, md: 768, sm: 480 }}
            cols={{ lg: 12, md: 6, sm: 1 }}
            rowHeight={72}
            layouts={{ lg: rglLayout }}
            onLayoutChange={(layout: Layout) => handleLayoutChange(layout as unknown as any[])}
            dragConfig={{ enabled: isEditMode, handle: '.drag-handle' }}
            resizeConfig={{ enabled: isEditMode }}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            className="layout"
          >
            {gridWidgets.map((widget) => (
              <div key={widget.id} className="h-full">
                <WidgetRenderer
                  widget={widget}
                  isEditMode={isEditMode}
                  onRemove={handleRemoveWidget}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="spinner-sm" />
          </div>
        )}
      </div>

      {/* ─── Add Widget Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Widget to Dashboard"
        description="Choose a widget to track your spending, savings, or cash flow."
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {AVAILABLE_WIDGETS.map((widgetDef) => {
            const isAlreadyAdded = gridWidgets.some((w) => w.type === widgetDef.type);

            return (
              <div
                key={widgetDef.type}
                className="card p-3.5 flex flex-col justify-between hover:border-zinc-700 bg-zinc-900/60 transition-all rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/40 shrink-0">
                    {widgetDef.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white">
                      {widgetDef.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {widgetDef.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-zinc-800">
                  <span className="text-[11px] text-zinc-500">
                    Size: {widgetDef.defaultW}x{widgetDef.defaultH}
                  </span>
                  <Button
                    variant={isAlreadyAdded ? 'secondary' : 'primary'}
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => handleAddWidget(widgetDef)}
                  >
                    {isAlreadyAdded ? 'Add Another' : 'Add Widget'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
