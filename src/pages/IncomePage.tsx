import { useState, useMemo } from 'react';
import { useFinance } from '../store/FinanceContext';
import type { IncomeSource, Cents } from '../types';
import { formatCurrency, calculateMonthlyIncome } from '../utils';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import IncomeSourceForm from '../components/IncomeSourceForm';
import {
  Plus,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export default function IncomePage() {
  const { incomeSources, transactions, updateIncomeSource, deleteIncomeSource, settings } = useFinance();
  const currency = settings.currencySymbol || '$';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<IncomeSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<IncomeSource | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showTooltip, setShowTooltip] = useState(false);

  // Helper calculation for individual source projections
  const getProjections = (src: IncomeSource) => {
    let weekly: Cents = 0;
    let monthly: Cents = 0;
    let annual: Cents = 0;

    if (src.type === 'hourly') {
      const rate = src.hourlyRate || 0;
      const hours = src.hoursPerWeek || 0;
      weekly = rate * hours;
      annual = weekly * 52;
      monthly = Math.round(annual / 12);
    } else {
      const fixed = src.fixedAmount || 0;
      if (src.payFrequency === 'weekly') {
        weekly = fixed;
        annual = weekly * 52;
        monthly = Math.round(annual / 12);
      } else if (src.payFrequency === 'biweekly') {
        annual = fixed * 26;
        weekly = Math.round(annual / 52);
        monthly = Math.round(annual / 12);
      } else {
        // default monthly
        monthly = fixed;
        annual = monthly * 12;
        weekly = Math.round(annual / 52);
      }
    }

    return { weekly, monthly, annual };
  };

  // Aggregated Projections for active sources
  const summary = useMemo(() => {
    let projectedWeekly: Cents = 0;
    let projectedMonthly: Cents = 0;
    let projectedAnnual: Cents = 0;

    incomeSources.forEach((src) => {
      if (src.isActive) {
        const { weekly, monthly, annual } = getProjections(src);
        projectedWeekly += weekly;
        projectedMonthly += monthly;
        projectedAnnual += annual;
      }
    });

    const actualReceivedThisMonth = calculateMonthlyIncome(transactions);
    const difference = actualReceivedThisMonth - projectedMonthly;
    const progressPercent = projectedMonthly > 0
      ? Math.min(100, Math.round((actualReceivedThisMonth / projectedMonthly) * 100))
      : 0;

    return {
      projectedWeekly,
      projectedMonthly,
      projectedAnnual,
      actualReceivedThisMonth,
      difference,
      progressPercent,
    };
  }, [incomeSources, transactions]);

  // Filtered income sources list
  const filteredSources = useMemo(() => {
    return incomeSources.filter((src) => {
      if (filterActive === 'active') return src.isActive;
      if (filterActive === 'inactive') return !src.isActive;
      return true;
    });
  }, [incomeSources, filterActive]);

  const handleToggleActive = async (src: IncomeSource) => {
    await updateIncomeSource({
      ...src,
      isActive: !src.isActive,
    });
  };

  const handleOpenAdd = () => {
    setSourceToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (src: IncomeSource) => {
    setSourceToEdit(src);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sourceToDelete) {
      await deleteIncomeSource(sourceToDelete.id);
      setSourceToDelete(null);
    }
  };

  const getTypeBadge = (type: IncomeSource['type']) => {
    switch (type) {
      case 'hourly':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Hourly
          </span>
        );
      case 'salary':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Salary
          </span>
        );
      case 'freelance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Freelance
          </span>
        );
      case 'passive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Passive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            Other
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Income Management"
        description="Monitor expected earnings, track wage projections, and compare with cash deposited"
        icon={<Briefcase className="w-6 h-6" />}
      >
        <Button
          onClick={handleOpenAdd}
          icon={<Plus className="w-4 h-4" />}
          variant="primary"
        >
          Add Income Source
        </Button>
      </PageHeader>

      {/* Distinction Info Alert Banner */}
      <div className="p-4 rounded-xl bg-[#141416] border border-[#27272a] flex items-start justify-between gap-3 relative">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>Understanding Projections vs Actuals</span>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
              <strong className="text-[#fafafa]">Projected Income</strong> reflects what you forecast based on your hourly schedule and contracts.
              {' '}<strong className="text-[#fafafa]">Actual Received</strong> is the sum of real income transactions logged this current month.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-xs text-[#71717a] hover:text-[#fafafa] underline shrink-0 mt-0.5"
        >
          {showTooltip ? 'Hide details' : 'More info'}
        </button>
      </div>

      {showTooltip && (
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl text-xs text-[#a1a1aa] space-y-2 animate-fade-in">
          <p>
            • <strong>Hourly Wage:</strong> Multiplies your hourly rate by your weekly hours (e.g. $18/hr × 8 hrs/wk = $144/wk, or ~$624/month annualized).
          </p>
          <p>
            • <strong>Monthly Calculations:</strong> Calculated as (Weekly Projection × 52 weeks ÷ 12 months) to account for full calendar year distribution.
          </p>
          <p>
            • <strong>Variance:</strong> If Actual Received is less than Monthly Projected, your side hustle or paycheque may still be pending for the remainder of the month.
          </p>
        </div>
      )}

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Projected Weekly */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Weekly</span>
            <Clock className="w-4 h-4 text-[#71717a]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#fafafa] tabular-nums">
            {formatCurrency(summary.projectedWeekly, currency)}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">Based on active schedules</p>
        </div>

        {/* Card 2: Projected Monthly */}
        <div className="card p-5 border-emerald-500/20 bg-gradient-to-b from-[#141416] to-emerald-950/10">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Projected Monthly</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {formatCurrency(summary.projectedMonthly, currency)}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">Expected monthly baseline</p>
        </div>

        {/* Card 3: Projected Annual */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Annual</span>
            <Sparkles className="w-4 h-4 text-[#71717a]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#fafafa] tabular-nums">
            {formatCurrency(summary.projectedAnnual, currency)}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">52-week run-rate</p>
        </div>

        {/* Card 4: Actual Received This Month */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Actual This Month</span>
            <DollarSign className="w-4 h-4 text-[#71717a]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#fafafa] tabular-nums">
            {formatCurrency(summary.actualReceivedThisMonth, currency)}
          </div>
          <div className="mt-2 w-full bg-[#1e1e22] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">{summary.progressPercent}% of monthly projected</p>
        </div>

        {/* Card 5: Difference */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Variance vs Target</span>
            {summary.difference >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              summary.difference >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {summary.difference > 0 ? '+' : ''}
            {formatCurrency(summary.difference, currency)}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">
            {summary.difference >= 0 ? 'Target achieved this month' : 'Pending deposits this month'}
          </p>
        </div>
      </div>

      {/* Income Sources List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#fafafa]">Configured Income Streams</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#1e1e22] text-[#a1a1aa] border border-[#27272a]">
              {filteredSources.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-[#141416] border border-[#27272a] rounded-lg">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filterActive === 'all'
                  ? 'bg-[#27272a] text-[#fafafa]'
                  : 'text-[#71717a] hover:text-[#fafafa]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filterActive === 'active'
                  ? 'bg-[#27272a] text-emerald-400'
                  : 'text-[#71717a] hover:text-[#fafafa]'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filterActive === 'inactive'
                  ? 'bg-[#27272a] text-[#fafafa]'
                  : 'text-[#71717a] hover:text-[#fafafa]'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {filteredSources.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6" />}
            title="No income sources found"
            description={
              filterActive === 'all'
                ? 'Add your job, freelance work, side hustles, or passive income to calculate projections.'
                : 'No income sources match the current filter.'
            }
            action={
              <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
                Add Income Source
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSources.map((src) => {
              const projections = getProjections(src);

              return (
                <div
                  key={src.id}
                  className={`card p-5 relative transition-all ${
                    src.isActive
                      ? 'border-[#27272a] hover:border-[#3f3f46]'
                      : 'border-[#1e1e22] opacity-60 bg-[#0f0f11]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-[#fafafa]">{src.name}</h3>
                        {getTypeBadge(src.type)}
                      </div>

                      {/* Rate Info */}
                      <div className="flex items-center gap-2 text-xs text-[#a1a1aa] mt-1.5">
                        {src.type === 'hourly' && (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span>
                              {formatCurrency(src.hourlyRate || 0, currency)}/hr × {src.hoursPerWeek || 0} hrs/wk
                            </span>
                            <span className="text-[#52525b]">•</span>
                            <span className="text-[#a1a1aa] capitalize">{src.payFrequency || 'weekly'}</span>
                          </div>
                        )}
                        {src.type !== 'hourly' && (
                          <div className="flex items-center gap-1.5 text-[#fafafa] font-medium">
                            <span>
                              {src.fixedAmount ? formatCurrency(src.fixedAmount, currency) : 'Variable'}
                            </span>
                            <span className="text-[#52525b]">•</span>
                            <span className="text-[#a1a1aa] capitalize">{src.payFrequency || 'monthly'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#71717a]">
                        {src.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={src.isActive}
                          onChange={() => handleToggleActive(src)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#27272a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Calculations Breakdown */}
                  <div className="p-3 bg-[#18181b]/70 border border-[#27272a] rounded-xl grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-[#71717a]">Weekly</div>
                      <div className="text-sm font-bold text-[#fafafa] tabular-nums mt-0.5">
                        {formatCurrency(projections.weekly, currency)}
                      </div>
                    </div>
                    <div className="border-x border-[#27272a] px-1">
                      <div className="text-[10px] uppercase font-semibold text-emerald-400">Monthly</div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                        {formatCurrency(projections.monthly, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-[#71717a]">Annual</div>
                      <div className="text-sm font-bold text-[#fafafa] tabular-nums mt-0.5">
                        {formatCurrency(projections.annual, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1e1e22]">
                    <div className="text-[11px] text-[#52525b] flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{src.type === 'hourly' ? 'Calculated forecast' : 'Configured rate'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(src)}
                        className="p-1.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#1e1e22] transition-colors"
                        title="Edit Source"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSourceToDelete(src)}
                        className="p-1.5 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income Source Modal */}
      <IncomeSourceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        sourceToEdit={sourceToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sourceToDelete}
        onCancel={() => setSourceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Income Source"
        message={`Are you sure you want to remove "${sourceToDelete?.name}"? Projections will be updated immediately.`}
        confirmText="Delete Source"
        isDestructive={true}
      />
    </div>
  );
}
