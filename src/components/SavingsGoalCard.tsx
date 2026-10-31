import React, { useState } from 'react';
import type { SavingsGoal } from '../types';
import {
  formatCurrency,
  calculateGoalProjection,
  formatDate,
  renderAppIcon,
} from '../utils';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit?: (goal: SavingsGoal) => void;
  onDelete?: (goalId: string) => void;
  onContribute?: (goal: SavingsGoal, initialType: 'deposit' | 'withdraw') => void;
  onClick?: () => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onContribute,
  onClick,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const percentage = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const projection = calculateGoalProjection(goal);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleAddFunds = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContribute?.(goal, 'deposit');
  };

  const handleWithdraw = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContribute?.(goal, 'withdraw');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(goal);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.(goal.id);
  };

  // Circular indicator parameters
  const circleRadius = 24;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (percentage / 100) * circleCircumference;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col justify-between rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden p-5 sm:p-6"
        style={{
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Subtle accent glow top border */}
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 opacity-60 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, ${goal.color} 0%, transparent 100%)`,
          }}
        />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Icon Avatar */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${goal.color}18`,
                borderColor: `${goal.color}35`,
              }}
            >
              <span style={{ color: goal.color }}>{renderAppIcon(goal.icon, 'w-5 h-5')}</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)] truncate group-hover:text-white transition-colors">
                  {goal.name}
                </h3>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-[var(--accent-green)] border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                  </span>
                )}
              </div>
              {goal.description ? (
                <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                  {goal.description}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {goal.targetDate ? `Target: ${formatDate(goal.targetDate)}` : 'No target date'}
                </p>
              )}
            </div>
          </div>

          {/* Circular Percentage Mini Badge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={circleRadius}
                stroke="currentColor"
                strokeWidth="4"
                className="text-[var(--border-primary)]"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r={circleRadius}
                stroke={goal.color}
                strokeWidth="4"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-[var(--text-primary)] tabular-nums">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Amounts Display */}
        <div className="space-y-3 mb-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-[var(--text-secondary)] font-medium block">
                Saved
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--text-secondary)] font-medium block">
                Target
              </span>
              <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          {/* Linear Progress Bar with Smooth Fill */}
          <div className="relative w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: goal.color,
                boxShadow: `0 0 10px ${goal.color}80`,
              }}
            />
          </div>

          {/* Remaining & Monthly Needed Info */}
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1">
            <span className="tabular-nums">
              {isCompleted ? (
                <span className="text-[var(--accent-green)] font-medium">Target reached!</span>
              ) : (
                <span>
                  <strong className="text-[var(--text-secondary)] font-semibold">
                    {formatCurrency(remaining)}
                  </strong>{' '}
                  left
                </span>
              )}
            </span>

            {projection.monthlyNeeded > 0 && !isCompleted && (
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <TrendingUp className="w-3 h-3 text-[var(--accent-blue)]" />
                <span className="tabular-nums font-medium">
                  {formatCurrency(projection.monthlyNeeded)}/mo
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Projection Info Footer */}
        {goal.targetDate && !isCompleted && (
          <div className="mb-4 py-2 px-3 rounded-lg bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Target: {formatDate(goal.targetDate)}</span>
            </div>
            {projection.projectedDate && (
              <div
                className={`flex items-center gap-1 font-medium ${
                  projection.onTrack ? 'text-[var(--accent-green)]' : 'text-amber-400'
                }`}
              >
                {!projection.onTrack && <AlertCircle className="w-3.5 h-3.5" />}
                <span>{projection.onTrack ? 'On Track' : 'Behind Pace'}</span>
              </div>
            )}
          </div>
        )}

        {/* Card Actions Footer */}
        <div
          className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Add / Withdraw */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 text-[var(--accent-green)]" />}
              onClick={handleAddFunds}
              className="!px-2.5 !py-1 text-xs hover:border-emerald-500/50"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Minus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
              onClick={handleWithdraw}
              disabled={goal.currentAmount <= 0}
              className="!px-2.5 !py-1 text-xs"
            >
              Withdraw
            </Button>
          </div>

          {/* Edit & Delete Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleEdit}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
              title="Edit goal"
              aria-label="Edit goal"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-red-500/10 rounded-md transition-colors"
              title="Delete goal"
              aria-label="Delete goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Savings Goal"
        message={
          <>
            Are you sure you want to delete <strong>{goal.name}</strong>? This action cannot be
            undone and will remove all contribution history for this goal.
          </>
        }
        confirmText="Delete Goal"
        variant="danger"
      />
    </>
  );
};

export default SavingsGoalCard;
