import { useState, useMemo } from 'react';
import { useFinance } from '../store/FinanceContext';
import { useToast } from '../components/ui/Toast';
import type { Transaction, Cents } from '../types';
import {
  formatCurrency,
  centsToDollars,
  CATEGORY_COLORS,
} from '../utils';
import {
  generateReportPDF,
  downloadCSV,
  copyReportToClipboard,
  type ReportExportData,
} from '../utils/exportUtils';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import {
  FileText,
  Download,
  Copy,
  Share2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Check,
  PiggyBank,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom' | 'savings' | 'spending';

export default function ReportsPage() {
  const { transactions, savingsGoals, settings } = useFinance();
  const { success, error: toastError } = useToast();
  const currency = settings.currencySymbol || '$';

  const [reportType, setReportType] = useState<ReportType>('monthly');

  // Custom date range state
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const [customStart, setCustomStart] = useState<string>(defaultStart);
  const [customEnd, setCustomEnd] = useState<string>(defaultEnd);

  const [copied, setCopied] = useState(false);

  // Compute Active Date Range and Prior Comparison Range based on reportType
  const dateRanges = useMemo(() => {
    const today = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (reportType === 'weekly') {
      const dayOfWeek = today.getDay(); // 0 is Sun
      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);

      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      prevStart = new Date(currentStart);
      prevStart.setDate(currentStart.getDate() - 7);
      prevEnd = new Date(currentEnd);
      prevEnd.setDate(currentEnd.getDate() - 7);
    } else if (reportType === 'monthly' || reportType === 'savings' || reportType === 'spending') {
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
      currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    } else if (reportType === 'quarterly') {
      const qMonth = Math.floor(today.getMonth() / 3) * 3;
      currentStart = new Date(today.getFullYear(), qMonth, 1);
      currentEnd = new Date(today.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);

      prevStart = new Date(today.getFullYear(), qMonth - 3, 1);
      prevEnd = new Date(today.getFullYear(), qMonth, 0, 23, 59, 59, 999);
    } else if (reportType === 'annual') {
      currentStart = new Date(today.getFullYear(), 0, 1);
      currentEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

      prevStart = new Date(today.getFullYear() - 1, 0, 1);
      prevEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
      // custom
      currentStart = new Date(customStart + 'T00:00:00');
      currentEnd = new Date(customEnd + 'T23:59:59');
      const diffMs = currentEnd.getTime() - currentStart.getTime();

      prevStart = new Date(currentStart.getTime() - diffMs);
      prevEnd = new Date(currentStart.getTime() - 1);
    }

    return {
      currentStart,
      currentEnd,
      prevStart,
      prevEnd,
    };
  }, [reportType, customStart, customEnd]);

  // Filter transactions into current and previous periods
  const currentTransactions = useMemo(() => {
    const startStr = dateRanges.currentStart.toISOString().split('T')[0];
    const endStr = dateRanges.currentEnd.toISOString().split('T')[0];
    return transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);
  }, [transactions, dateRanges]);

  const prevTransactions = useMemo(() => {
    const startStr = dateRanges.prevStart.toISOString().split('T')[0];
    const endStr = dateRanges.prevEnd.toISOString().split('T')[0];
    return transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);
  }, [transactions, dateRanges]);

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    // Current period metrics
    let totalIncome: Cents = 0;
    let totalExpenses: Cents = 0;
    const categorySpendingMap: Record<string, Cents> = {};

    currentTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        categorySpendingMap[tx.category] = (categorySpendingMap[tx.category] || 0) + tx.amount;
      }
    });

    const netCashFlow = totalIncome - totalExpenses;

    // Savings contributions during period
    const startStr = dateRanges.currentStart.toISOString().split('T')[0];
    const endStr = dateRanges.currentEnd.toISOString().split('T')[0];
    let savingsContributions: Cents = 0;

    savingsGoals.forEach((goal) => {
      goal.contributions.forEach((c) => {
        if (c.date >= startStr && c.date <= endStr && c.amount > 0) {
          savingsContributions += c.amount;
        }
      });
    });

    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Previous period metrics
    let prevIncome: Cents = 0;
    let prevExpenses: Cents = 0;
    prevTransactions.forEach((tx) => {
      if (tx.type === 'income') prevIncome += tx.amount;
      else prevExpenses += tx.amount;
    });
    const prevNet = prevIncome - prevExpenses;

    // % changes
    const getChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / Math.abs(prev)) * 100);
    };

    const incomeChange = getChange(totalIncome, prevIncome);
    const expenseChange = getChange(totalExpenses, prevExpenses);
    const netChange = getChange(netCashFlow, prevNet);

    // Sorted Category Breakdown
    const categoryBreakdown = Object.entries(categorySpendingMap)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      savingsContributions,
      savingsRate,
      categoryBreakdown,
      comparison: {
        incomeChange,
        expenseChange,
        netChange,
        prevIncome,
        prevExpenses,
      },
    };
  }, [currentTransactions, prevTransactions, savingsGoals, dateRanges]);

  // Chart data: Daily / Grouped Income vs Expenses
  const chartData = useMemo(() => {
    const dataByDate: Record<string, { date: string; income: number; expenses: number }> = {};

    currentTransactions.forEach((tx) => {
      const dateLabel = tx.date.slice(5); // MM-DD
      if (!dataByDate[dateLabel]) {
        dataByDate[dateLabel] = { date: dateLabel, income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        dataByDate[dateLabel].income += centsToDollars(tx.amount);
      } else {
        dataByDate[dateLabel].expenses += centsToDollars(tx.amount);
      }
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [currentTransactions]);

  // Prepare standard export data structure
  const reportExportPayload: ReportExportData = useMemo(() => {
    const startFormatted = dateRanges.currentStart.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endFormatted = dateRanges.currentEnd.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const titlePrefix = reportType.charAt(0).toUpperCase() + reportType.slice(1);

    return {
      title: `${titlePrefix} Financial Report`,
      reportType,
      dateRange: `${startFormatted} - ${endFormatted}`,
      currencySymbol: currency,
      totalIncome: metrics.totalIncome,
      totalExpenses: metrics.totalExpenses,
      netCashFlow: metrics.netCashFlow,
      savingsContributions: metrics.savingsContributions,
      savingsRate: metrics.savingsRate,
      categoryBreakdown: metrics.categoryBreakdown,
      transactions: currentTransactions,
      comparison: {
        incomeChange: metrics.comparison.incomeChange,
        expenseChange: metrics.comparison.expenseChange,
        netChange: metrics.comparison.netChange,
      },
    };
  }, [reportType, dateRanges, currency, metrics, currentTransactions]);

  // Handlers for Export
  const handleDownloadPDF = () => {
    try {
      generateReportPDF(reportExportPayload);
      success('Financial report PDF generated and downloaded!');
    } catch (err: any) {
      toastError(err?.message || 'Failed to generate PDF');
    }
  };

  const handleDownloadCSV = () => {
    try {
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(currentTransactions, filename);
      success('Transaction report downloaded as CSV.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to generate CSV');
    }
  };

  const handleCopySummary = async () => {
    try {
      await copyReportToClipboard(reportExportPayload);
      setCopied(true);
      success('Report summary copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err: any) {
      toastError(err?.message || 'Failed to copy report to clipboard');
    }
  };

  const reportTypeLabels: { key: ReportType; label: string }[] = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'annual', label: 'Annual' },
    { key: 'savings', label: 'Savings' },
    { key: 'spending', label: 'Spending' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Export Action Toolbar */}
      <PageHeader
        title="Financial Reports"
        description="Comprehensive statements, spending analytics, and downloadable audit reports"
        icon={<FileText className="w-6 h-6" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopySummary}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Summary'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPDF}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPDF}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share Report
          </Button>
        </div>
      </PageHeader>

      {/* Report Type Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#141416] border border-[#27272a]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {reportTypeLabels.map((t) => (
            <button
              key={t.key}
              onClick={() => setReportType(t.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                reportType === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date Display or Range Picker for Custom */}
        {reportType === 'custom' ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa]"
            />
            <span className="text-xs text-[#71717a]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[#fafafa]">{reportExportPayload.dateRange}</span>
          </div>
        )}
      </div>

      {/* Report Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="card p-5 border-[#27272a]">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Income</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {formatCurrency(metrics.totalIncome, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {metrics.comparison.incomeChange >= 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                +{metrics.comparison.incomeChange}%
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                {metrics.comparison.incomeChange}%
              </span>
            )}
            <span className="text-[#71717a]">vs prev period</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card p-5 border-[#27272a]">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-red-400 tabular-nums">
            {formatCurrency(metrics.totalExpenses, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {metrics.comparison.expenseChange <= 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                {metrics.comparison.expenseChange}%
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                +{metrics.comparison.expenseChange}%
              </span>
            )}
            <span className="text-[#71717a]">vs prev period</span>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="card p-5 border-[#27272a]">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Cash Flow</span>
            <BarChart3 className="w-4 h-4 text-[#71717a]" />
          </div>
          <div
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              metrics.netCashFlow >= 0 ? 'text-[#fafafa]' : 'text-red-400'
            }`}
          >
            {formatCurrency(metrics.netCashFlow, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {metrics.comparison.netChange >= 0 ? (
              <span className="text-emerald-400 font-semibold">+{metrics.comparison.netChange}%</span>
            ) : (
              <span className="text-red-400 font-semibold">{metrics.comparison.netChange}%</span>
            )}
            <span className="text-[#71717a]">vs prev net</span>
          </div>
        </div>

        {/* Savings & Rate */}
        <div className="card p-5 border-[#27272a]">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Savings Contributed</span>
            <PiggyBank className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-blue-400 tabular-nums">
            {formatCurrency(metrics.savingsContributions, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#a1a1aa]">
            <span className="text-blue-400 font-semibold">{metrics.savingsRate}%</span>
            <span className="text-[#71717a]">savings rate</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: BarChart & Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-[#fafafa]">Income vs Expenses Timeline</h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Chronological flow within selected window</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[#a1a1aa]">Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="text-[#a1a1aa]">Expense</span>
              </span>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-[#71717a]">
              No transactions recorded in this period.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${currency}${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141416',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, '']}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Share Pie Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-[#fafafa]">Spending Breakdown</h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Top expenditure categories</p>
            </div>
            <PieIcon className="w-4 h-4 text-[#71717a]" />
          </div>

          {metrics.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-[#71717a]">
              No expenses recorded.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {metrics.categoryBreakdown.map((item, index) => {
                      const color =
                        CATEGORY_COLORS[item.category] ||
                        `hsl(${(index * 55) % 360}, 70%, 50%)`;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141416',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-[#fafafa]">Category Expenditure Table</h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">Detailed breakdown of total expenses by tag</p>
          </div>
          <span className="text-xs text-[#71717a]">
            {metrics.categoryBreakdown.length} Categories
          </span>
        </div>

        {metrics.categoryBreakdown.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#71717a]">
            No expense records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#18181b] text-xs uppercase text-[#71717a] font-semibold border-b border-[#27272a]">
                <tr>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Amount Spent</th>
                  <th className="px-6 py-3">% of Total Expenses</th>
                  <th className="px-6 py-3">Distribution Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {metrics.categoryBreakdown.map((cat) => {
                  const color = CATEGORY_COLORS[cat.category] || '#10b981';
                  return (
                    <tr key={cat.category} className="hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-[#fafafa] flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        <span>{cat.category}</span>
                      </td>
                      <td className="px-6 py-3.5 text-[#fafafa] tabular-nums font-semibold">
                        {formatCurrency(cat.amount, currency)}
                      </td>
                      <td className="px-6 py-3.5 text-[#a1a1aa] tabular-nums">
                        {cat.percentage}%
                      </td>
                      <td className="px-6 py-3.5 w-1/3">
                        <div className="w-full bg-[#1e1e22] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Log Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-[#fafafa]">Transactions in this Statement</h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">Records included in statement totals</p>
          </div>
          <span className="text-xs text-[#71717a]">
            {currentTransactions.length} Total
          </span>
        </div>

        {currentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions for this timeframe"
            description="Try selecting a different date range or adding transactions."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#18181b] text-xs uppercase text-[#71717a] font-semibold border-b border-[#27272a] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {currentTransactions.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-[#a1a1aa] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-6 py-3 font-medium text-[#fafafa]">
                      <div>{tx.name}</div>
                      {tx.description && (
                        <div className="text-xs text-[#71717a]">{tx.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-[#a1a1aa]">
                      <span className="px-2 py-0.5 rounded-full bg-[#1e1e22] border border-[#27272a]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs capitalize text-[#a1a1aa]">
                      {tx.type}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-semibold tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
