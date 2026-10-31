import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFinance } from '../store/FinanceContext';
import {
  formatCurrency,
  centsToDollars,
  formatDate,
  formatDateShort,
  calculateGoalProjection,
} from '../utils';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SavingsGoalForm from '../components/SavingsGoalForm';
import GoalContributionModal from '../components/GoalContributionModal';
import {
  ArrowLeft,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export const GoalDetailPage: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { savingsGoals, deleteSavingsGoal } = useFinance();

  const goal = useMemo(() => {
    return savingsGoals.find((g) => g.id === goalId) || null;
  }, [savingsGoals, goalId]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contributionModal, setContributionModal] = useState<{
    isOpen: boolean;
    type: 'deposit' | 'withdraw';
  }>({
    isOpen: false,
    type: 'deposit',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // If goal not found
  if (!goal) {
    return (
      <div className="py-12 animate-fade-in">
        <EmptyState
          icon={<Target className="w-10 h-10 text-[var(--accent-red)]" />}
          title="Goal Not Found"
          description="The savings goal you are looking for may have been deleted or does not exist."
          action={{
            label: 'Back to Savings Goals',
            onClick: () => navigate('/savings'),
            icon: <ArrowLeft className="w-4 h-4" />,
            variant: 'outline',
          }}
        />
      </div>
    );
  }

  const percentage = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const projection = calculateGoalProjection(goal);

  // Sum of total deposits & withdrawals
  const totalDeposited = goal.contributions
    .filter((c) => c.amount > 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalWithdrawn = goal.contributions
    .filter((c) => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  // Build chart timeline data
  const chartData = useMemo(() => {
    if (!goal) return [];

    // Sort contributions chronologically
    const sorted = [...goal.contributions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sorted.length === 0) {
      // Just baseline point
      return [
        {
          date: formatDateShort(goal.createdAt),
          fullDate: formatDate(goal.createdAt),
          balance: centsToDollars(goal.currentAmount),
          target: centsToDollars(goal.targetAmount),
          amount: 0,
          note: 'Goal created',
        },
      ];
    }

    let runningBalance = 0;
    const points: Array<{
      date: string;
      fullDate: string;
      balance: number;
      target: number;
      amount: number;
      note?: string;
    }> = [];

    // Initial point if goal created earlier than first contribution
    points.push({
      date: formatDateShort(goal.createdAt),
      fullDate: formatDate(goal.createdAt),
      balance: 0,
      target: centsToDollars(goal.targetAmount),
      amount: 0,
      note: 'Goal started',
    });

    sorted.forEach((c) => {
      runningBalance += c.amount;
      points.push({
        date: formatDateShort(c.date),
        fullDate: formatDate(c.date),
        balance: Math.max(0, centsToDollars(runningBalance)),
        target: centsToDollars(goal.targetAmount),
        amount: centsToDollars(c.amount),
        note: c.note,
      });
    });

    return points;
  }, [goal]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSavingsGoal(goal.id);
      navigate('/savings');
    } catch (err) {
      console.error('Failed to delete goal:', err);
      setIsDeleting(false);
    }
  };

  // Circular indicator calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-primary)]">
        <Link
          to="/savings"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Savings Goals</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={<Minus className="w-4 h-4 text-[var(--text-secondary)]" />}
            onClick={() => setContributionModal({ isOpen: true, type: 'withdraw' })}
            disabled={goal.currentAmount <= 0}
            className="text-xs sm:text-sm"
          >
            Withdraw
          </Button>

          <Button
            variant="success"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setContributionModal({ isOpen: true, type: 'deposit' })}
            className="text-xs sm:text-sm !bg-[var(--accent-green)] hover:!bg-emerald-600"
          >
            Add Funds
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs sm:text-sm"
          >
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-[var(--accent-red)]" />}
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs sm:text-sm hover:!bg-red-500/10 hover:!text-[var(--accent-red)]"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Goal Hero Banner */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 sm:p-8"
        style={{
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Subtle Ambient Background Tint */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: goal.color }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Info Column */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border shadow-lg"
                style={{
                  backgroundColor: `${goal.color}20`,
                  borderColor: `${goal.color}40`,
                }}
              >
                <span>{goal.icon || '🎯'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    {goal.name}
                  </h1>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-[var(--accent-green)] border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Goal Completed!
                    </span>
                  ) : projection.onTrack ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-[var(--accent-blue)] border border-blue-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      On Track
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Started on {formatDate(goal.createdAt)}
                </p>
              </div>
            </div>

            {goal.description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-elevated)]/50 p-3 rounded-lg border border-[var(--border-subtle)]">
                {goal.description}
              </p>
            )}

            {/* Quick Metrics Line */}
            <div className="flex items-baseline gap-4 pt-2">
              <div>
                <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider block font-medium">
                  Current Balance
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                  {formatCurrency(goal.currentAmount)}
                </span>
              </div>
              <div className="text-[var(--text-muted)] text-xl font-light">/</div>
              <div>
                <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider block font-medium">
                  Target Goal
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[var(--text-secondary)] tabular-nums tracking-tight">
                  {formatCurrency(goal.targetAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Circular Gauge Visualization */}
          <div className="flex items-center justify-center lg:justify-end shrink-0">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-[var(--border-primary)]"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke={goal.color}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-[var(--text-primary)] tabular-nums">
                  {percentage}%
                </span>
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-medium tracking-wider">
                  {isCompleted ? 'Achieved' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>
              {isCompleted ? (
                <span className="text-[var(--accent-green)] font-semibold">100% Milestone Achieved!</span>
              ) : (
                <>
                  <strong className="text-[var(--text-primary)] font-semibold">
                    {formatCurrency(remaining)}
                  </strong>{' '}
                  left to reach target
                </>
              )}
            </span>
            <span className="tabular-nums font-medium">{percentage}% Complete</span>
          </div>

          <div className="w-full h-3 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: goal.color,
                boxShadow: `0 0 12px ${goal.color}80`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Projections & Milestones Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Date */}
        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>Target Deadline</span>
          </div>
          <div className="text-base font-semibold text-[var(--text-primary)]">
            {goal.targetDate ? formatDate(goal.targetDate) : 'No date set'}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {goal.targetDate ? 'Configured milestone date' : 'Add date in edit settings'}
          </div>
        </div>

        {/* Card 2: Projected Completion */}
        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Projected Completion</span>
          </div>
          <div className="text-base font-semibold text-[var(--text-primary)]">
            {isCompleted
              ? 'Already Completed'
              : projection.projectedDate
              ? formatDate(projection.projectedDate)
              : 'Estimating pace...'}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {projection.projectedDate
              ? projection.onTrack
                ? 'Ahead of schedule'
                : 'Behind current target'
              : 'Requires more deposits to project'}
          </div>
        </div>

        {/* Card 3: Monthly Needed */}
        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            <TrendingUp className="w-4 h-4 text-[var(--accent-green)]" />
            <span>Monthly Needed</span>
          </div>
          <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
            {isCompleted
              ? '$0.00'
              : projection.monthlyNeeded > 0
              ? `${formatCurrency(projection.monthlyNeeded)}/mo`
              : 'Set a target date'}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            To reach target on time
          </div>
        </div>

        {/* Card 4: Net Deposits */}
        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Total Inflow / Outflow</span>
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums flex items-center justify-between">
            <span className="text-[var(--accent-green)]">+{formatCurrency(totalDeposited)}</span>
            <span className="text-[var(--accent-red)]">-{formatCurrency(totalWithdrawn)}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {goal.contributions.length} recorded {goal.contributions.length === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>
      </div>

      {/* Progress Chart Over Time */}
      <div className="p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Savings Growth Timeline
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Cumulative balance tracked through all deposits and withdrawals
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
              <span>Balance</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-3 h-0.5 border-t border-dashed border-zinc-500" />
              <span>Target ({formatCurrency(goal.targetAmount)})</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={goal.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={goal.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#71717a"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />

              <YAxis
                stroke="#71717a"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                domain={[0, 'auto']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] shadow-xl text-xs space-y-1">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {data.fullDate}
                        </div>
                        <div className="text-[var(--accent-blue)] font-bold text-sm">
                          Balance: ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        {data.amount !== 0 && (
                          <div className={data.amount > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                            {data.amount > 0 ? '+' : ''}${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        {data.note && (
                          <div className="text-[var(--text-muted)] italic">
                            "{data.note}"
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={centsToDollars(goal.targetAmount)}
                stroke="#52525b"
                strokeDasharray="4 4"
                label={{
                  value: 'Target',
                  fill: '#71717a',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="balance"
                stroke={goal.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#goalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contribution History Table */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Contribution History
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Record of all deposits and withdrawals for this goal
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setContributionModal({ isOpen: true, type: 'deposit' })}
            className="text-xs"
          >
            New Deposit
          </Button>
        </div>

        {goal.contributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Note / Details</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[...goal.contributions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((c) => {
                    const isDeposit = c.amount > 0;
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          {formatDate(c.date)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDeposit
                                ? 'bg-emerald-500/15 text-[var(--accent-green)] border border-emerald-500/20'
                                : 'bg-red-500/15 text-[var(--accent-red)] border border-red-500/20'
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                          {c.note || <span className="text-[var(--text-muted)] italic">No note provided</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-sm tabular-nums whitespace-nowrap">
                          <span className={isDeposit ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                            {isDeposit ? '+' : '-'}
                            {formatCurrency(Math.abs(c.amount))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              No contributions recorded yet
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto mt-1 mb-4">
              Add your first deposit to start building your savings timeline.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setContributionModal({ isOpen: true, type: 'deposit' })}
            >
              Add Deposit
            </Button>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      <SavingsGoalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        goal={goal}
      />

      {/* Contribution Modal */}
      <GoalContributionModal
        isOpen={contributionModal.isOpen}
        onClose={() => setContributionModal((prev) => ({ ...prev, isOpen: false }))}
        goal={goal}
        initialType={contributionModal.type}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Savings Goal"
        message={
          <>
            Are you sure you want to delete <strong>{goal.name}</strong>? All contribution history
            will be permanently removed.
          </>
        }
        confirmText="Delete Goal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GoalDetailPage;
