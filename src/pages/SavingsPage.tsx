import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../store/FinanceContext';
import type { SavingsGoal } from '../types';
import {
  formatCurrency,
  calculateTotalSavings,
} from '../utils';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SavingsGoalCard from '../components/SavingsGoalCard';
import SavingsGoalForm from '../components/SavingsGoalForm';
import GoalContributionModal from '../components/GoalContributionModal';
import {
  Plus,
  Target,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savingsGoals, deleteSavingsGoal, clearSampleData } = useFinance();

  // Modal states
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [contributionModalState, setContributionModalState] = useState<{
    isOpen: boolean;
    goal: SavingsGoal | null;
    initialType: 'deposit' | 'withdraw';
  }>({
    isOpen: false,
    goal: null,
    initialType: 'deposit',
  });

  const [showClearSampleConfirm, setShowClearSampleConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Summary Metrics
  const totalSaved = calculateTotalSavings(savingsGoals);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;
  const completedGoalsCount = savingsGoals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const hasSampleGoals = savingsGoals.some((g) => g.isSampleData);

  // Handlers
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setIsGoalFormOpen(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteSavingsGoal(id);
  };

  const handleOpenContribute = (goal: SavingsGoal, initialType: 'deposit' | 'withdraw') => {
    setContributionModalState({
      isOpen: true,
      goal,
      initialType,
    });
  };

  const handleClearSampleData = async () => {
    try {
      setIsClearing(true);
      await clearSampleData();
      setShowClearSampleConfirm(false);
    } catch (err) {
      console.error('Failed to clear sample data:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Savings Goals"
        description="Track progress, set milestones, and watch your wealth grow"
        icon={<Target className="w-6 h-6 text-[var(--accent-blue)]" />}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasSampleGoals && (
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4 text-[var(--text-muted)]" />}
              onClick={() => setShowClearSampleConfirm(true)}
              className="text-xs sm:text-sm hover:border-red-500/30 hover:text-[var(--accent-red)]"
            >
              Clear Sample Goals
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNewGoal}
            className="!bg-[var(--accent-blue)] hover:!bg-blue-600 shadow-md shadow-blue-500/20"
          >
            New Goal
          </Button>
        </div>
      </PageHeader>

      {/* Summary KPI Cards (Visible if goals exist) */}
      {savingsGoals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Saved */}
          <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Total Saved</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[var(--accent-green)] flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
              {formatCurrency(totalSaved)}
            </div>
            <div className="mt-2 text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
              <span>Across {savingsGoals.length} {savingsGoals.length === 1 ? 'goal' : 'goals'}</span>
            </div>
          </div>

          {/* Card 2: Overall Target */}
          <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Total Target</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[var(--accent-blue)] flex items-center justify-center border border-blue-500/20">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
              {formatCurrency(totalTarget)}
            </div>
            <div className="mt-2 text-xs text-[var(--text-tertiary)]">
              {formatCurrency(Math.max(0, totalTarget - totalSaved))} remaining
            </div>
          </div>

          {/* Card 3: Overall Progress */}
          <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Overall Progress</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-[var(--accent-purple)] flex items-center justify-center border border-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
              {overallPercentage}%
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-green)] transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 4: Goals Achieved */}
          <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Completed Goals</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[var(--accent-green)] flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
              {completedGoalsCount}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                / {savingsGoals.length}
              </span>
            </div>
            <div className="mt-2 text-xs text-[var(--text-tertiary)]">
              {savingsGoals.length - completedGoalsCount} active in progress
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savingsGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate(`/savings/${goal.id}`)}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onContribute={handleOpenContribute}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target className="w-8 h-8 text-[var(--accent-blue)]" />}
          title="No Savings Goals Yet"
          description="Create your first financial target to track contributions, see your projected completion date, and stay motivated."
          action={{
            label: 'Create Your First Goal',
            onClick: handleOpenNewGoal,
            icon: <Plus className="w-4 h-4" />,
            variant: 'primary',
          }}
          className="my-10"
        />
      )}

      {/* Add / Edit Goal Modal */}
      <SavingsGoalForm
        isOpen={isGoalFormOpen}
        onClose={() => {
          setIsGoalFormOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
      />

      {/* Add / Withdraw Funds Modal */}
      <GoalContributionModal
        isOpen={contributionModalState.isOpen}
        onClose={() =>
          setContributionModalState((prev) => ({ ...prev, isOpen: false }))
        }
        goal={contributionModalState.goal}
        initialType={contributionModalState.initialType}
      />

      {/* Clear Sample Goals Confirmation */}
      <ConfirmDialog
        isOpen={showClearSampleConfirm}
        onClose={() => setShowClearSampleConfirm(false)}
        onConfirm={handleClearSampleData}
        title="Clear Sample Goals & Data"
        message="This will remove all demo savings goals and sample transactions. Any goals or transactions you created manually will remain."
        confirmText="Clear Sample Data"
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
};

export default SavingsPage;
