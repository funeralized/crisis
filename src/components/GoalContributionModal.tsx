import React, { useState, useEffect } from 'react';
import type { SavingsGoal } from '../types';
import { useFinance } from '../store/FinanceContext';
import {
  formatCurrency,
  dollarsToCents,
  renderAppIcon,
} from '../utils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
} from 'lucide-react';

export interface GoalContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  initialType?: 'deposit' | 'withdraw';
}

export const GoalContributionModal: React.FC<GoalContributionModalProps> = ({
  isOpen,
  onClose,
  goal,
  initialType = 'deposit',
}) => {
  const { addGoalContribution } = useFinance();

  const [type, setType] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setType(initialType);
    setAmount('');
    setNote('');
    setError(null);
  }, [initialType, isOpen, goal]);

  if (!goal) return null;

  const parsedDollars = parseFloat(amount);
  const validAmount = !isNaN(parsedDollars) && parsedDollars > 0;
  const contributionCents = validAmount ? dollarsToCents(parsedDollars) : 0;

  const currentBalance = goal.currentAmount;
  const targetBalance = goal.targetAmount;

  const newBalance = type === 'deposit'
    ? currentBalance + contributionCents
    : Math.max(0, currentBalance - contributionCents);

  const isWithdrawalExceeding = type === 'withdraw' && validAmount && contributionCents > currentBalance;

  const currentPercent = targetBalance > 0
    ? Math.min(100, Math.round((currentBalance / targetBalance) * 100))
    : 0;

  const newPercent = targetBalance > 0
    ? Math.min(100, Math.round((newBalance / targetBalance) * 100))
    : 0;

  const willReachGoal = type === 'deposit' && currentBalance < targetBalance && newBalance >= targetBalance;

  const handleQuickAdd = (dollars: number) => {
    setAmount(dollars.toString());
    setError(null);
  };

  const handleAllRemaining = () => {
    if (type === 'deposit') {
      const remainingCents = Math.max(0, targetBalance - currentBalance);
      setAmount((remainingCents / 100).toFixed(2));
    } else {
      setAmount((currentBalance / 100).toFixed(2));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validAmount) {
      setError('Please enter a valid amount greater than $0.00');
      return;
    }

    if (type === 'withdraw' && contributionCents > currentBalance) {
      setError(`Cannot withdraw more than current balance (${formatCurrency(currentBalance)})`);
      return;
    }

    try {
      setIsSubmitting(true);
      const finalAmountCents = type === 'deposit' ? contributionCents : -contributionCents;
      await addGoalContribution(goal.id, finalAmountCents, note.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to contribute to savings goal:', err);
      setError('An error occurred while saving the contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant={type === 'deposit' ? 'success' : 'danger'}
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={!validAmount || isWithdrawalExceeding}
        className={
          type === 'deposit'
            ? '!bg-[var(--accent-green)] hover:!bg-emerald-600'
            : '!bg-[var(--accent-red)] hover:!bg-red-600'
        }
      >
        {type === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-blue)] border border-[var(--border-subtle)]">
            {renderAppIcon(goal.icon, 'w-4 h-4')}
          </span>
          <span className="truncate">
            {type === 'deposit' ? 'Add Funds to' : 'Withdraw Funds from'} {goal.name}
          </span>
        </div>
      }
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Segmented Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => {
              setType('deposit');
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              type === 'deposit'
                ? 'bg-emerald-500/20 text-[var(--accent-green)] border border-emerald-500/30 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 shrink-0" />
            <span>Deposit (+)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('withdraw');
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              type === 'withdraw'
                ? 'bg-red-500/20 text-[var(--accent-red)] border border-red-500/30 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 shrink-0" />
            <span>Withdraw (-)</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            {type === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'} <span className="text-[var(--accent-red)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)] font-semibold text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              style={{ paddingLeft: '28px' }}
              className="w-full pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-base font-semibold text-[var(--text-primary)] focus:border-[var(--accent-blue)] tabular-nums"
              autoFocus
            />
          </div>

          {/* Quick preset amount chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[25, 50, 100, 250, 500].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleQuickAdd(quick)}
                className="px-2.5 py-1 text-xs rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors cursor-pointer"
              >
                +${quick}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAllRemaining}
              className="px-2.5 py-1 text-xs rounded-md bg-[var(--bg-tertiary)] border border-[var(--accent-blue-dim)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue-dim)] transition-colors cursor-pointer ml-auto font-medium"
            >
              {type === 'deposit' ? 'Remaining Goal' : 'Entire Balance'}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-[var(--accent-red)] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Note input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Note / Reason (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              <FileText className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'deposit' ? 'e.g. October paycheck, Freelance bonus' : 'e.g. Emergency expense'}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* Preview Balance Card */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]/80 border border-[var(--border-primary)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Balance Impact</span>
            <span>Progress: {currentPercent}% → {newPercent}%</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">Current</span>
              <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                {formatCurrency(currentBalance)}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-[var(--text-muted)] block">Change</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  type === 'deposit' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                }`}
              >
                {type === 'deposit' ? '+' : '-'}
                {formatCurrency(contributionCents)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[var(--text-muted)] block">New Balance</span>
              <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(newBalance)}
              </span>
            </div>
          </div>

          {/* Progress bar preview */}
          <div className="relative w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${newPercent}%`,
                backgroundColor: goal.color,
              }}
            />
          </div>

          {/* Goal reached celebration note */}
          {willReachGoal && (
            <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-[var(--accent-green)]">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Milestone reached!</strong> This deposit achieves your target of{' '}
                {formatCurrency(targetBalance)}.
              </span>
            </div>
          )}

          {/* Over-withdrawal warning */}
          {isWithdrawalExceeding && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-[var(--accent-red)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Cannot withdraw more than current available balance ({formatCurrency(currentBalance)}).
              </span>
            </div>
          )}

          {newPercent >= 100 && !willReachGoal && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--accent-green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target already reached!</span>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default GoalContributionModal;
