import React, { useState, useEffect } from 'react';
import type { BudgetCategory } from '../types';
import { useFinance } from '../store/FinanceContext';
import {
  centsToDollars,
  dollarsToCents,
  DEFAULT_EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
} from '../utils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Check, DollarSign, Tag, Sparkles } from 'lucide-react';

export interface BudgetCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: BudgetCategory | null;
}

const CATEGORY_ICONS = [
  '🍔', '🛒', '🚗', '🏠', '🎬', '💡', '✈️', '💊', '📚', '☕',
  '📱', '🎁', '🏋️', '🐾', '💈', '⚡', '👕', '🎮', '💼', '🔧',
];

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#6b7280', '#e11d48',
];

export const BudgetCategoryForm: React.FC<BudgetCategoryFormProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { addBudgetCategory, updateBudgetCategory } = useFinance();

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const [errors, setErrors] = useState<{
    name?: string;
    limit?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setLimit((centsToDollars(category.limit)).toString());
      setIcon(category.icon || CATEGORY_ICONS[0]);
      setColor(category.color || PRESET_COLORS[0]);
    } else {
      setName('');
      setLimit('');
      setIcon(CATEGORY_ICONS[0]);
      setColor(PRESET_COLORS[0]);
    }
    setErrors({});
  }, [category, isOpen]);

  // Handle preset category selection
  const handleSelectPresetName = (catName: string) => {
    setName(catName);
    if (CATEGORY_COLORS[catName]) {
      setColor(CATEGORY_COLORS[catName]);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }

    const limitVal = parseFloat(limit);
    if (!limit || isNaN(limitVal) || limitVal <= 0) {
      newErrors.limit = 'Enter a monthly limit greater than $0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const limitCents = dollarsToCents(parseFloat(limit));

      if (category) {
        await updateBudgetCategory({
          ...category,
          name: name.trim(),
          limit: limitCents,
          icon,
          color,
        });
      } else {
        await addBudgetCategory({
          name: name.trim(),
          limit: limitCents,
          icon,
          color,
        });
      }

      onClose();
    } catch (err) {
      console.error('Failed to save budget category:', err);
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
        {category ? 'Save Changes' : 'Create Category'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Budget Category' : 'New Budget Category'}
      description={
        category
          ? 'Adjust monthly spending allowance and appearance'
          : 'Set a monthly spending limit to stay disciplined'
      }
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Category Name <span className="text-[var(--accent-red)]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Dining, Entertainment"
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              autoFocus
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.name}</p>
          )}

          {/* Quick Category Name Suggestions */}
          {!category && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DEFAULT_EXPENSE_CATEGORIES.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPresetName(preset)}
                  className="px-2 py-0.5 rounded text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Limit */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Monthly Limit ($) <span className="text-[var(--accent-red)]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="400.00"
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] tabular-nums font-semibold"
            />
          </div>
          {errors.limit && (
            <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.limit}</p>
          )}
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Resets automatically on the first day of each calendar month.
          </p>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Select Icon</span>
            <span className="text-base">{icon}</span>
          </label>
          <div className="grid grid-cols-10 gap-1.5 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)] max-h-28 overflow-y-auto">
            {CATEGORY_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded-md transition-all ${
                  icon === emoji
                    ? 'bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)] scale-110 shadow-sm'
                    : 'hover:bg-[var(--bg-card)]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker Swatches */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Theme Accent Color</span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Sparkles className="w-3 h-3" />
              <span className="capitalize" style={{ color }}>{color}</span>
            </div>
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
            {PRESET_COLORS.map((hex) => {
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

export default BudgetCategoryForm;
