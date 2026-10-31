import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronRight, ChevronLeft, DollarSign, Briefcase,
  Target, PiggyBank, Sparkles, Check,
} from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, centsToDollars, dollarsToCents } from '../utils';
import { Button } from '../components/ui/Button';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'currency', title: 'Currency' },
  { id: 'balance', title: 'Starting Balance' },
  { id: 'income', title: 'Income' },
  { id: 'expenses', title: 'Expenses' },
  { id: 'goals', title: 'Goals' },
  { id: 'ready', title: 'Ready' },
];

export default function OnboardingPage() {
  const { settings, incomeSources, savingsGoals, updateSettings, completeOnboarding } = useFinance();
  const [currentStep, setCurrentStep] = useState(0);
  const [startingBalance, setStartingBalance] = useState(String(centsToDollars(settings.startingBalance)));
  const [currency, setCurrency] = useState(settings.currency);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);

  // Initial spinner animation
  React.useEffect(() => {
    const t = setTimeout(() => setShowSpinner(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    if (currentStep === 1) {
      updateSettings({ currency, currencySymbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' });
    }
    if (currentStep === 2) {
      updateSettings({ startingBalance: dollarsToCents(parseFloat(startingBalance) || 0) });
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleComplete = async () => {
    setIsCompleting(true);
    await updateSettings({ startingBalance: dollarsToCents(parseFloat(startingBalance) || 0) });
    await completeOnboarding();
  };

  if (showSpinner) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-primary)] flex flex-col items-center justify-center z-50">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--border-primary)] border-t-[var(--accent-blue)] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--border-primary)] border-b-[var(--accent-green)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
        </div>
        <p className="text-[var(--text-secondary)] text-sm animate-pulse">Loading Vault...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= currentStep ? 'var(--accent-blue)' : 'var(--border-primary)',
                opacity: i <= currentStep ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-white fill-current" />
                </div>
                <h1 className="text-3xl font-bold mb-3 text-[var(--text-primary)]">Welcome to Vault</h1>
                <p className="text-[var(--text-secondary)] text-base mb-2">Your personal finance operating system.</p>
                <p className="text-[var(--text-tertiary)] text-sm mb-8">
                  Track spending, manage budgets, grow savings — all in one place.
                  Your data stays on this device.
                </p>
                <Button variant="primary" size="lg" onClick={handleNext} icon={<ChevronRight className="w-4 h-4" />}>
                  Get Started
                </Button>
                <button
                  onClick={handleComplete}
                  className="block mx-auto mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Skip setup — use defaults
                </button>
              </div>
            )}

            {/* Step 1: Currency */}
            {currentStep === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Currency</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">Choose your primary currency</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
                    { code: 'USD', symbol: '$', name: 'US Dollar' },
                    { code: 'EUR', symbol: '€', name: 'Euro' },
                    { code: 'GBP', symbol: '£', name: 'British Pound' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        currency === c.code
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-dim)]'
                          : 'border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <span className="text-2xl font-bold text-[var(--text-primary)]">{c.symbol}</span>
                      <div className="text-sm text-[var(--text-secondary)] mt-1">{c.code}</div>
                      <div className="text-xs text-[var(--text-muted)]">{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Starting Balance */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-dim)] flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Starting Balance</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">How much do you currently have?</p>
                  </div>
                </div>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--text-muted)]">$</span>
                  <input
                    type="number"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    className="w-full text-3xl font-bold pl-10 pr-4 py-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue-dim)] outline-none tabular-nums"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-8">
                  This is your current total across all accounts. You can adjust it later in Settings.
                </p>
              </div>
            )}

            {/* Step 3: Income */}
            {currentStep === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-dim)] flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Income Sources</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">We've set up these based on your info</p>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {incomeSources.map((src) => (
                    <div key={src.id} className="card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{src.name}</p>
                          <p className="text-sm text-[var(--text-tertiary)] capitalize">{src.type}</p>
                        </div>
                        <div className="text-right">
                          {src.hourlyRate && src.hoursPerWeek && (
                            <>
                              <p className="text-sm text-[var(--accent-green)] font-medium">
                                {formatCurrency(src.hourlyRate)}/hr × {src.hoursPerWeek}hrs
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                ~{formatCurrency(src.hourlyRate * src.hoursPerWeek)}/week
                              </p>
                            </>
                          )}
                          {!src.hourlyRate && (
                            <span className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-full">Variable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">You can edit income sources anytime from the Income page.</p>
              </div>
            )}

            {/* Step 4: Expenses */}
            {currentStep === 4 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-red-dim)] flex items-center justify-center">
                    <Target className="w-5 h-5 text-[var(--accent-red)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Monthly Expenses</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">Sample expenses have been added</p>
                  </div>
                </div>
                <div className="space-y-2 mb-8">
                  {[
                    { name: 'Bus Pass', amount: 10000, cat: 'Transportation' },
                    { name: 'Haircut', amount: 6000, cat: 'Personal Care' },
                    { name: 'Hair Products', amount: 1000, cat: 'Personal Care' },
                    { name: 'Spotify Premium', amount: 1500, cat: 'Subscriptions' },
                  ].map((exp) => (
                    <div key={exp.name} className="flex items-center justify-between py-3 px-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{exp.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{exp.cat}</p>
                      </div>
                      <span className="text-sm font-medium text-[var(--accent-red)] tabular-nums">
                        -{formatCurrency(exp.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                    <span className="text-sm text-[var(--text-secondary)]">Total Monthly</span>
                    <span className="text-sm font-semibold text-[var(--accent-red)] tabular-nums">-{formatCurrency(18500)}</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  These are sample transactions marked as sample data. You can clear them anytime from Settings.
                </p>
              </div>
            )}

            {/* Step 5: Savings Goals */}
            {currentStep === 5 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-[var(--accent-purple)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Savings Goals</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">Your financial targets</p>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {savingsGoals.map((goal) => {
                    const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
                    return (
                      <div key={goal.id} className="card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{goal.icon}</span>
                            <span className="font-medium text-[var(--text-primary)]">{goal.name}</span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{pct}%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: goal.color }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-tertiary)]">{formatCurrency(goal.currentAmount)}</span>
                          <span className="text-[var(--text-muted)]">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Create unlimited goals with custom targets and track your progress over time.
                </p>
              </div>
            )}

            {/* Step 6: Ready */}
            {currentStep === 6 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-green-dim)] flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-[var(--accent-green)]" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">You're all set!</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-8">
                  Your Vault is ready. Start tracking your finances, manage your budget, and grow your savings.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {[
                    'Customizable dashboard',
                    'Transaction tracking',
                    'Budget management',
                    'Savings goals',
                    'Financial reports',
                    'Data export & backup',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="w-4 h-4 text-[var(--accent-green)] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  onClick={handleComplete}
                  loading={isCompleting}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Open Vault
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {currentStep > 0 && currentStep < 6 && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={handleBack} icon={<ChevronLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ChevronRight className="w-4 h-4" />}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
