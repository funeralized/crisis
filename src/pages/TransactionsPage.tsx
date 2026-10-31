import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Pencil,
  Trash2,
  Calendar,
  Filter,
  Repeat,
  RotateCcw,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import {
  formatCurrency,
  formatDate,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  CATEGORY_COLORS,
} from '../utils';
import type { Transaction } from '../types';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PageHeader from '../components/layout/PageHeader';
import TransactionForm from '../components/TransactionForm';

type SortField = 'date' | 'name' | 'category' | 'type' | 'amount';
type SortDirection = 'asc' | 'desc';
type TypeFilter = 'all' | 'income' | 'expense';
type DateRangePreset = 'all' | 'this-month' | 'last-30-days' | 'this-year' | 'custom';

const ITEMS_PER_PAGE = 20;

export const TransactionsPage: React.FC = () => {
  const { transactions, deleteTransaction, budgetCategories } = useFinance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sort State (Default: Date descending)
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // All available categories
  const allCategories = useMemo(() => {
    const fromBudget = budgetCategories.map((b) => b.name);
    const set = new Set([...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES, ...fromBudget]);
    return Array.from(set).sort();
  }, [budgetCategories]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateRangePreset !== 'all';

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      // 3. Search Query (Name, Category, Description, Tags, Account)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = t.name.toLowerCase().includes(query);
        const categoryMatch = t.category.toLowerCase().includes(query);
        const descMatch = Boolean(t.description && t.description.toLowerCase().includes(query));
        const accountMatch = Boolean(t.account && t.account.toLowerCase().includes(query));
        const tagsMatch = Boolean(t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)));

        if (!nameMatch && !categoryMatch && !descMatch && !accountMatch && !tagsMatch) {
          return false;
        }
      }

      // 4. Date Range Filter
      const txDateStr = t.date ? t.date.split('T')[0] : '';
      if (dateRangePreset === 'this-month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        if (txDateStr < start || txDateStr > end) return false;
      } else if (dateRangePreset === 'last-30-days') {
        const now = new Date();
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];
        if (txDateStr < past || txDateStr > today) return false;
      } else if (dateRangePreset === 'this-year') {
        const year = new Date().getFullYear();
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        if (txDateStr < start || txDateStr > end) return false;
      } else if (dateRangePreset === 'custom') {
        if (customStartDate && txDateStr < customStartDate) return false;
        if (customEndDate && txDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    searchQuery,
    dateRangePreset,
    customStartDate,
    customEndDate,
  ]);

  // Sorted Transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedTransactions.length);
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Financial summary of filtered set
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for sorting icon
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-emerald-400 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-emerald-400 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Transaction Button */}
      <PageHeader
        title="Transactions"
        description="View, track, and manage all income and expense records"
        icon={<Receipt className="w-6 h-6" />}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-secondary)]">
            {transactions.length} Total
          </span>
        }
      >
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
        >
          Add Transaction
        </Button>
      </PageHeader>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Total Income
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-400 tabular-nums font-mono">
            +{formatCurrency(filteredSummary.income)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {isFiltered ? 'In current filtered view' : 'Across all transactions'}
          </span>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Total Expenses
            </span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-red-400 tabular-nums font-mono">
            -{formatCurrency(filteredSummary.expense)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {isFiltered ? 'In current filtered view' : 'Across all transactions'}
          </span>
        </div>

        {/* Net Flow */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Net Cash Flow
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-[var(--accent-blue)] border border-blue-500/20">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-xl font-bold tracking-tight tabular-nums font-mono ${
              filteredSummary.net >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {filteredSummary.net >= 0 ? '+' : ''}
            {formatCurrency(filteredSummary.net)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {isFiltered ? 'Filtered net balance' : 'Overall net balance'}
          </span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] space-y-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, category, notes..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg pl-9 pr-9 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="lg:col-span-3 flex items-center p-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-primary)]">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('income');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                  : 'text-[var(--text-secondary)] hover:text-emerald-400'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('expense');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30'
                  : 'text-[var(--text-secondary)] hover:text-red-400'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3 relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#18181b] text-white">
                All Categories
              </option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#18181b] text-white">
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-tertiary)]">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Date Range Dropdown */}
          <div className="lg:col-span-2 relative">
            <select
              value={dateRangePreset}
              onChange={(e) => {
                setDateRangePreset(e.target.value as DateRangePreset);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#18181b] text-white">All Dates</option>
              <option value="this-month" className="bg-[#18181b] text-white">This Month</option>
              <option value="last-30-days" className="bg-[#18181b] text-white">Last 30 Days</option>
              <option value="this-year" className="bg-[#18181b] text-white">This Year</option>
              <option value="custom" className="bg-[#18181b] text-white">Custom Range</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-tertiary)]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Custom Date Range Pickers (only shown when 'custom' is active) */}
        {dateRangePreset === 'custom' && (
          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)]">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        )}

        {/* Active Filters Summary & Reset Button */}
        <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[var(--text-primary)]">{filteredTransactions.length}</strong> of{' '}
              <strong className="text-[var(--text-primary)]">{transactions.length}</strong> transactions
            </span>
            {isFiltered && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30">
                Filtered
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Transactions List / Table */}
      {transactions.length === 0 ? (
        // Case A: No transactions exist at all
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-[var(--text-tertiary)]" />}
          title="No transactions yet"
          description="Start building your financial ledger by adding your first income or expense transaction."
          action={
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
            >
              Add First Transaction
            </Button>
          }
        />
      ) : filteredTransactions.length === 0 ? (
        // Case B: Filter yielded zero results
        <EmptyState
          icon={<Filter className="w-8 h-8 text-[var(--text-tertiary)]" />}
          title="No matching transactions found"
          description="We couldn't find any transactions matching your current filters or search term."
          action={
            <Button
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetFilters}
            >
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider select-none">
                  {/* Date Column */}
                  <th
                    scope="col"
                    onClick={() => handleSort('date')}
                    className="py-3.5 pl-6 pr-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    Date {renderSortIndicator('date')}
                  </th>

                  {/* Name Column */}
                  <th
                    scope="col"
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    Name {renderSortIndicator('name')}
                  </th>

                  {/* Category Column */}
                  <th
                    scope="col"
                    onClick={() => handleSort('category')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    Category {renderSortIndicator('category')}
                  </th>

                  {/* Type Column */}
                  <th
                    scope="col"
                    onClick={() => handleSort('type')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    Type {renderSortIndicator('type')}
                  </th>

                  {/* Amount Column */}
                  <th
                    scope="col"
                    onClick={() => handleSort('amount')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    Amount {renderSortIndicator('amount')}
                  </th>

                  {/* Actions Column */}
                  <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const categoryColor = CATEGORY_COLORS[tx.category] || '#71717a';

                  return (
                    <tr
                      key={tx.id}
                      className="group transition-colors hover:bg-[var(--bg-card-hover)]"
                    >
                      {/* Date */}
                      <td className="py-3.5 pl-6 pr-4 text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Name & Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {tx.name}
                          </span>
                          {tx.isRecurring && (
                            <span
                              title={`Recurring: ${tx.recurringFrequency || 'monthly'}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-[var(--accent-blue)] border border-blue-500/30 shrink-0"
                            >
                              <Repeat className="w-2.5 h-2.5" />
                              <span className="capitalize">{tx.recurringFrequency || 'Recurring'}</span>
                            </span>
                          )}
                        </div>
                        {tx.description && (
                          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                            {tx.description}
                          </p>
                        )}
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {tx.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                              >
                                #{tag}
                              </span>
                            ))}
                            {tx.tags.length > 3 && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                +{tx.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="text-[var(--text-primary)]">{tx.category}</span>
                        </div>
                      </td>

                      {/* Type Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold text-sm tabular-nums font-mono ${
                            isIncome ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                            aria-label={`Edit ${tx.name}`}
                            title="Edit Transaction"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransactionToDelete(tx)}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            aria-label={`Delete ${tx.name}`}
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-[var(--border-subtle)]">
            {paginatedTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const categoryColor = CATEGORY_COLORS[tx.category] || '#71717a';

              return (
                <div
                  key={tx.id}
                  className="p-4 space-y-2.5 transition-colors hover:bg-[var(--bg-card-hover)]"
                >
                  {/* Top Line: Category & Date & Amount */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="text-[var(--text-primary)]">{tx.category}</span>
                      </div>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {formatDate(tx.date)}
                      </span>
                    </div>

                    <span
                      className={`font-bold text-base tabular-nums font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {/* Middle Line: Name & Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">
                        {tx.name}
                      </h4>
                      {tx.isRecurring && (
                        <span
                          title="Recurring"
                          className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-medium bg-blue-500/15 text-[var(--accent-blue)] border border-blue-500/30"
                        >
                          <Repeat className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {tx.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Line: Tags, Account & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        <span className="capitalize">{tx.type}</span>
                      </span>

                      {tx.account && (
                        <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                          {tx.account}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTransaction(tx);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                        aria-label={`Edit ${tx.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionToDelete(tx)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        aria-label={`Delete ${tx.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-card)]">
            <span className="text-xs text-[var(--text-secondary)]">
              Showing <strong className="text-[var(--text-primary)]">{startIndex + 1}</strong> to{' '}
              <strong className="text-[var(--text-primary)]">{endIndex}</strong> of{' '}
              <strong className="text-[var(--text-primary)]">{sortedTransactions.length}</strong> entries
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
              >
                Prev
              </Button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Page <strong className="text-[var(--text-primary)]">{safeCurrentPage}</strong> of{' '}
                  <strong className="text-[var(--text-primary)]">{totalPages}</strong>
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                iconPosition="right"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(transactionToDelete)}
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={
          transactionToDelete
            ? `Are you sure you want to delete "${transactionToDelete.name}" (${formatCurrency(transactionToDelete.amount)})? This action cannot be undone.`
            : 'Are you sure you want to delete this transaction?'
        }
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TransactionsPage;
