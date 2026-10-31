import React, { useState, useEffect } from 'react';
import type { IncomeSource, Cents } from '../types';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, parseCurrencyInput } from '../utils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Briefcase, Clock, Calendar, Check, DollarSign } from 'lucide-react';

export interface IncomeSourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  sourceToEdit?: IncomeSource | null;
}

export const IncomeSourceForm: React.FC<IncomeSourceFormProps> = ({
  isOpen,
  onClose,
  sourceToEdit,
}) => {
  const { addIncomeSource, updateIncomeSource, settings } = useFinance();
  const currency = settings.currencySymbol || '$';

  const [name, setName] = useState('');
  const [type, setType] = useState<IncomeSource['type']>('hourly');
  const [hourlyRateStr, setHourlyRateStr] = useState('');
  const [hoursPerWeekStr, setHoursPerWeekStr] = useState('8');
  const [payFrequency, setPayFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [fixedAmountStr, setFixedAmountStr] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sourceToEdit) {
      setName(sourceToEdit.name);
      setType(sourceToEdit.type);
      setHourlyRateStr(sourceToEdit.hourlyRate ? (sourceToEdit.hourlyRate / 100).toFixed(2) : '');
      setHoursPerWeekStr(sourceToEdit.hoursPerWeek ? String(sourceToEdit.hoursPerWeek) : '8');
      setPayFrequency(sourceToEdit.payFrequency || 'weekly');
      setFixedAmountStr(sourceToEdit.fixedAmount ? (sourceToEdit.fixedAmount / 100).toFixed(2) : '');
      setIsActive(sourceToEdit.isActive);
    } else {
      // Default new form
      setName('');
      setType('hourly');
      setHourlyRateStr('18.00');
      setHoursPerWeekStr('8');
      setPayFrequency('weekly');
      setFixedAmountStr('');
      setIsActive(true);
    }
    setError(null);
  }, [sourceToEdit, isOpen]);

  // Real-time calculations for live preview
  const hourlyRateCents = parseCurrencyInput(hourlyRateStr);
  const hoursPerWeek = parseFloat(hoursPerWeekStr) || 0;
  const fixedAmountCents = parseCurrencyInput(fixedAmountStr);

  let calculatedWeekly: Cents = 0;
  let calculatedMonthly: Cents = 0;
  let calculatedAnnual: Cents = 0;

  if (type === 'hourly') {
    calculatedWeekly = hourlyRateCents * hoursPerWeek;
    calculatedAnnual = calculatedWeekly * 52;
    calculatedMonthly = Math.round(calculatedAnnual / 12);
  } else if (type === 'salary') {
    if (payFrequency === 'monthly') {
      calculatedMonthly = fixedAmountCents;
      calculatedAnnual = calculatedMonthly * 12;
      calculatedWeekly = Math.round(calculatedAnnual / 52);
    } else if (payFrequency === 'weekly') {
      calculatedWeekly = fixedAmountCents;
      calculatedAnnual = calculatedWeekly * 52;
      calculatedMonthly = Math.round(calculatedAnnual / 12);
    } else {
      // biweekly
      calculatedAnnual = fixedAmountCents * 26;
      calculatedMonthly = Math.round(calculatedAnnual / 12);
      calculatedWeekly = Math.round(calculatedAnnual / 52);
    }
  } else {
    // freelance / passive / other with optional fixedAmount
    if (fixedAmountCents > 0) {
      if (payFrequency === 'weekly') {
        calculatedWeekly = fixedAmountCents;
        calculatedAnnual = calculatedWeekly * 52;
        calculatedMonthly = Math.round(calculatedAnnual / 12);
      } else if (payFrequency === 'biweekly') {
        calculatedAnnual = fixedAmountCents * 26;
        calculatedMonthly = Math.round(calculatedAnnual / 12);
        calculatedWeekly = Math.round(calculatedAnnual / 52);
      } else {
        calculatedMonthly = fixedAmountCents;
        calculatedAnnual = calculatedMonthly * 12;
        calculatedWeekly = Math.round(calculatedAnnual / 52);
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for the income source.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        type,
        isActive,
        payFrequency,
      };

      if (type === 'hourly') {
        payload.hourlyRate = hourlyRateCents;
        payload.hoursPerWeek = hoursPerWeek;
      } else if (fixedAmountCents > 0) {
        payload.fixedAmount = fixedAmountCents;
      }

      if (sourceToEdit) {
        await updateIncomeSource({
          ...sourceToEdit,
          ...payload,
        });
      } else {
        await addIncomeSource(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save income source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const types: { key: IncomeSource['type']; label: string; desc: string }[] = [
    { key: 'hourly', label: 'Hourly Wage', desc: 'Calculated from hourly rate & hours worked' },
    { key: 'salary', label: 'Salary', desc: 'Predictable fixed recurring salary' },
    { key: 'freelance', label: 'Freelance', desc: 'Contract or project based earnings' },
    { key: 'passive', label: 'Passive', desc: 'Investments, digital products, royalties' },
    { key: 'other', label: 'Other', desc: 'Gifts, bursaries, one-off payments' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sourceToEdit ? 'Edit Income Source' : 'Add Income Source'}
      description="Track recurring wages, freelance gigs, and side hustle revenues"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Source Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1.5">
            Source Name
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., Campus Bookstore, Freelance Design, Roblox"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              required
            />
            <Briefcase className="w-4 h-4 text-[#71717a] absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Type Selector Pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2">
            Income Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {types.map((t) => {
              const isSelected = type === t.key;
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-medium ring-1 ring-emerald-500/40'
                      : 'border-[#27272a] bg-[#141416] text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{t.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Fields based on Type */}
        {type === 'hourly' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#141416] border border-[#27272a] rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                Hourly Rate ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="18.00"
                  value={hourlyRateStr}
                  onChange={(e) => setHourlyRateStr(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa]"
                />
                <DollarSign className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                Hours / Week
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="168"
                  placeholder="8"
                  value={hoursPerWeekStr}
                  onChange={(e) => setHoursPerWeekStr(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa]"
                />
                <Clock className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                Pay Frequency
              </label>
              <div className="relative">
                <select
                  value={payFrequency}
                  onChange={(e) => setPayFrequency(e.target.value as any)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        )}

        {(type === 'salary' || type === 'freelance' || type === 'passive' || type === 'other') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#141416] border border-[#27272a] rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                {type === 'salary' ? 'Salary Amount' : 'Estimated Amount'} ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 500"
                  value={fixedAmountStr}
                  onChange={(e) => setFixedAmountStr(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa]"
                />
                <DollarSign className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                Frequency
              </label>
              <div className="relative">
                <select
                  value={payFrequency}
                  onChange={(e) => setPayFrequency(e.target.value as any)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        )}

        {/* Live Projection Box */}
        {(calculatedWeekly > 0 || calculatedMonthly > 0) && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400 mb-2">
              Calculated Projection Preview
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#18181b]/80 rounded-lg border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase font-medium">Weekly</div>
                <div className="text-sm font-bold text-[#fafafa] mt-0.5">
                  {formatCurrency(calculatedWeekly, currency)}
                </div>
              </div>
              <div className="p-2 bg-[#18181b]/80 rounded-lg border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase font-medium">Monthly</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(calculatedMonthly, currency)}
                </div>
              </div>
              <div className="p-2 bg-[#18181b]/80 rounded-lg border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase font-medium">Annual</div>
                <div className="text-sm font-bold text-[#fafafa] mt-0.5">
                  {formatCurrency(calculatedAnnual, currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#141416] border border-[#27272a] rounded-xl">
          <div>
            <div className="text-sm font-medium text-[#fafafa]">Active Status</div>
            <div className="text-xs text-[#71717a]">
              Active sources contribute to your projected monthly income
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#27272a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {sourceToEdit ? 'Save Changes' : 'Add Source'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IncomeSourceForm;
