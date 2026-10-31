import React, { useState, useEffect } from 'react';
import type { SavingsGoal } from '../types';
import { useFinance } from '../store/FinanceContext';
import {
  centsToDollars,
  dollarsToCents,
  GOAL_ICONS,
  GOAL_COLORS,
  renderAppIcon,
} from '../utils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Check, Target, DollarSign, Calendar, FileText, Sparkles } from 'lucide-react';

export interface SavingsGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: SavingsGoal | null;
}

export const SavingsGoalForm: React.FC<SavingsGoalFormProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { addSavingsGoal, updateSavingsGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const [errors, setErrors] = useState<{
    name?: string;
    targetAmount?: string;
    currentAmount?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount((centsToDollars(goal.targetAmount)).toString());
      setCurrentAmount((centsToDollars(goal.currentAmount)).toString());
      setTargetDate(goal.targetDate || '');
      setDescription(goal.description || '');
      setIcon(goal.icon || GOAL_ICONS[0]);
      setColor(goal.color || GOAL_COLORS[0]);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setDescription('');
      setIcon(GOAL_ICONS[0]);
      setColor(GOAL_COLORS[0]);
    }
    setErrors({});
  }, [goal, isOpen]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const targetVal = parseFloat(targetAmount);
    if (!targetAmount || isNaN(targetVal) || targetVal <= 0) {
      newErrors.targetAmount = 'Enter a target amount greater than $0';
    }

    const currentVal = parseFloat(currentAmount);
    if (currentAmount && (isNaN(currentVal) || currentVal < 0)) {
      newErrors.currentAmount = 'Current amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const targetCents = dollarsToCents(parseFloat(targetAmount));
      const currentCents = currentAmount ? dollarsToCents(parseFloat(currentAmount)) : 0;

      if (goal) {
        await updateSavingsGoal({
          ...goal,
          name: name.trim(),
          targetAmount: targetCents,
          currentAmount: currentCents,
          targetDate: targetDate || undefined,
          description: description.trim() || undefined,
          icon,
          color,
        });
      } else {
        await addSavingsGoal({
          name: name.trim(),
          targetAmount: targetCents,
          currentAmount: currentCents,
          targetDate: targetDate || undefined,
          description: description.trim() || undefined,
          icon,
          color,
        });
      }

      onClose();
    } catch (err) {
      console.error('Failed to save savings goal:', err);
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
        variant="primary"
        onClick={handleSubmit}
        isLoading={isSubmitting}
        className="!bg-[var(--accent-blue)] hover:!bg-blue-600"
      >
        {goal ? 'Update Goal' : 'Create Goal'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      description={goal ? 'Update your target and progress settings' : 'Set a financial milestone and track your pace'}
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Goal Name <span className="text-[var(--accent-red)]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Target className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Car, Emergency Fund, Summer Trip"
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              autoFocus
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.name}</p>
          )}
        </div>

        {/* Amounts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Target Amount ($) <span className="text-[var(--accent-red)]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000.00"
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] tabular-nums"
              />
            </div>
            {errors.targetAmount && (
              <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.targetAmount}</p>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Current Saved ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] tabular-nums"
              />
            </div>
            {errors.currentAmount && (
              <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.currentAmount}</p>
            )}
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Target Date (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Used to calculate your recommended monthly savings pace.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Description / Note (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Why are you saving for this goal?"
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] resize-none"
            />
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Choose Icon</span>
            <span className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--accent-blue)]">
              {renderAppIcon(icon, 'w-4 h-4')}
            </span>
          </label>
          <div className="grid grid-cols-8 gap-1.5 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)] max-h-32 overflow-y-auto">
            {GOAL_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                  icon === iconName
                    ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue)] scale-105 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
                }`}
                title={iconName}
              >
                {renderAppIcon(iconName, 'w-4 h-4')}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker Swatches */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Goal Theme Color</span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Sparkles className="w-3 h-3" />
              <span className="capitalize" style={{ color }}>{color}</span>
            </div>
          </label>
          <div className="flex flex-wrap gap-2.5 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
            {GOAL_COLORS.map((hex) => {
              const isSelected = color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    isSelected ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={`Select color ${hex}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SavingsGoalForm;
