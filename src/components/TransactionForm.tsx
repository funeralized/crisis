import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import {
  parseCurrencyInput,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  CATEGORY_COLORS,
} from '../utils';
import type { Transaction } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

export interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  editTransaction?: Transaction | null;
  initialData?: Partial<Transaction> | null;
  onSuccess?: () => void;
}

const ACCOUNT_OPTIONS = [
  'Checking Account',
  'Savings Account',
  'Credit Card',
  'Cash',
  'Investment Account',
  'Roblox / Creator Account',
  'Other',
];

const RECURRING_FREQUENCIES: { value: 'weekly' | 'biweekly' | 'monthly' | 'yearly'; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly (Every 2 weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  transaction,
  editTransaction,
  initialData,
  onSuccess,
}) => {
  const { addTransaction, updateTransaction, budgetCategories } = useFinance();

  const targetTx = transaction || editTransaction || (initialData as Transaction | undefined);
  const isEditing = Boolean(targetTx && targetTx.id);

  // Form states
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [account, setAccount] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');

  // Validation & submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine default categories with custom budget categories
  const expenseCategories = Array.from(
    new Set([
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...budgetCategories.map((b) => b.name),
    ])
  );
  const incomeCategories = DEFAULT_INCOME_CATEGORIES;
  const currentCategoryList = type === 'income' ? incomeCategories : expenseCategories;

  // Sync form values on open or edit change
  useEffect(() => {
    if (isOpen) {
      if (targetTx) {
        setType(targetTx.type);
        setName(targetTx.name);
        setAmountStr((targetTx.amount / 100).toFixed(2));
        setCategory(targetTx.category);
        setDate(targetTx.date ? targetTx.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setDescription(targetTx.description || '');
        setAccount(targetTx.account || '');
        setTagsStr(targetTx.tags ? targetTx.tags.join(', ') : '');
        setIsRecurring(Boolean(targetTx.isRecurring));
        setRecurringFrequency(targetTx.recurringFrequency || 'monthly');
      } else {
        // Reset to default empty form
        setType('expense');
        setName('');
        setAmountStr('');
        setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setAccount('');
        setTagsStr('');
        setIsRecurring(false);
        setRecurringFrequency('monthly');
      }
      setErrors({});
    }
  }, [isOpen, targetTx]);

  // Handle switching transaction type
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const newCategories = newType === 'income' ? incomeCategories : expenseCategories;
    if (!newCategories.includes(category)) {
      setCategory(newCategories[0]);
    }
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Transaction title is required';
    }

    const parsedCents = parseCurrencyInput(amountStr);
    if (!amountStr.trim() || parsedCents <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedAmount = parseCurrencyInput(amountStr);
      const parsedTags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (isEditing && targetTx) {
        await updateTransaction({
          ...targetTx,
          name: name.trim(),
          amount: parsedAmount,
          type,
          category,
          date,
          description: description.trim() || undefined,
          account: account.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
      } else {
        await addTransaction({
          name: name.trim(),
          amount: parsedAmount,
          type,
          category,
          date,
          description: description.trim() || undefined,
          account: account.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
          isSampleData: false,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to save transaction. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
      description={
        isEditing
          ? 'Update the details for this transaction'
          : 'Record a new income or expense transaction'
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification banner if submission failed */}
        {errors.submit && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* 1. Transaction Type Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                type === 'expense'
                  ? 'bg-red-500/15 border border-red-500/40 text-red-400 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* 2. Name & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Title / Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder={type === 'expense' ? 'e.g. Whole Foods Groceries' : 'e.g. Freelance Client Payment'}
              className={`w-full bg-[var(--bg-input)] border rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors ${
                errors.name
                  ? 'border-red-500/70 focus:border-red-500'
                  : 'border-[var(--border-primary)] focus:border-[var(--accent-blue)]'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full bg-[var(--bg-input)] border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] tabular-nums font-mono focus:outline-none transition-colors ${
                  errors.amount
                    ? 'border-red-500/70 focus:border-red-500'
                    : 'border-[var(--border-primary)] focus:border-[var(--accent-blue)]'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount}
              </p>
            )}
          </div>
        </div>

        {/* 3. Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className={`w-full bg-[var(--bg-input)] border rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors appearance-none cursor-pointer ${
                  errors.category
                    ? 'border-red-500/70 focus:border-red-500'
                    : 'border-[var(--border-primary)] focus:border-[var(--accent-blue)]'
                }`}
              >
                {currentCategoryList.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#18181b] text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <div
                className="w-2.5 h-2.5 rounded-full absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#71717a' }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-tertiary)]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.category && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.category}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full bg-[var(--bg-input)] border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors ${
                  errors.date
                    ? 'border-red-500/70 focus:border-red-500'
                    : 'border-[var(--border-primary)] focus:border-[var(--accent-blue)]'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.date}
              </p>
            )}
          </div>
        </div>

        {/* 4. Account & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Account */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Account (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                <CreditCard className="w-4 h-4" />
              </div>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg pl-9 pr-8 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#18181b] text-[var(--text-tertiary)]">
                  Select Account (Optional)
                </option>
                {ACCOUNT_OPTIONS.map((acc) => (
                  <option key={acc} value={acc} className="bg-[#18181b] text-white">
                    {acc}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-tertiary)]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Tags (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="e.g. food, business, tax"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Separate tags with commas</p>
          </div>
        </div>

        {/* 5. Description / Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
            Description / Notes (Optional)
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add optional context, receipt note, or details..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] resize-none"
            />
          </div>
        </div>

        {/* 6. Recurring Transaction Toggle */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-blue)] border border-[var(--border-subtle)]">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)] block">
                  Recurring Transaction
                </span>
                <span className="text-xs text-[var(--text-tertiary)] block">
                  Mark this as a regularly repeating expense or income
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isRecurring ? 'bg-emerald-600' : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  isRecurring ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Recurring Frequency selector */}
          {isRecurring && (
            <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Repeat Frequency:
              </label>
              <select
                value={recurringFrequency}
                onChange={(e) =>
                  setRecurringFrequency(e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'yearly')
                }
                className="bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              >
                {RECURRING_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value} className="bg-[#18181b] text-white">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 7. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant={type === 'income' ? 'success' : 'primary'}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
