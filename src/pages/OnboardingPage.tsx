import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  Target,
  Bell,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import {
  formatCurrency,
  dollarsToCents,
  renderAppIcon,
} from '../utils';
import { Button } from '../components/ui/Button';
import { scheduleWeeklyReminder } from '../utils/notifications';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'chequing', title: 'Chequing' },
  { id: 'savings', title: 'Savings' },
  { id: 'goal', title: 'Goal' },
  { id: 'ready', title: 'Ready' },
];

const PRESET_GOAL_ICONS = [
  'target',
  'car',
  'home',
  'briefcase',
  'laptop',
  'piggy-bank',
  'graduation-cap',
  'plane',
];

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function OnboardingPage() {
  const { updateSettings, completeOnboarding, addSavingsGoal } = useFinance();
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [chequingBalance, setChequingBalance] = useState<string>('500');
  const [savingsBalance, setSavingsBalance] = useState<string>('1500');

  // Savings Goal State
  const [goalName, setGoalName] = useState<string>('Emergency Fund');
  const [goalTarget, setGoalTarget] = useState<string>('5000');
  const [goalMonthly, setGoalMonthly] = useState<string>('250');
  const [goalAlreadySaved, setGoalAlreadySaved] = useState<string>('500');
  const [goalIcon, setGoalIcon] = useState<string>('target');
  const [goalColor, setGoalColor] = useState<string>('#10b981');

  // Weekly reminder toggle
  const [enableWeeklyReminder, setEnableWeeklyReminder] = useState<boolean>(true);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const chequingCents = dollarsToCents(parseFloat(chequingBalance) || 0);
      const savingsCents = dollarsToCents(parseFloat(savingsBalance) || 0);
      const totalStartingBalance = chequingCents + savingsCents;

      // 1. Save settings
      await updateSettings({
        currency: 'CAD',
        currencySymbol: '$',
        startingBalance: totalStartingBalance,
      });

      // 2. Create the initial savings goal
      const targetCents = dollarsToCents(parseFloat(goalTarget) || 1000);
      const currentCents = dollarsToCents(parseFloat(goalAlreadySaved) || 0);
      const monthlyCents = dollarsToCents(parseFloat(goalMonthly) || 100);

      // Estimate target date based on monthly contribution
      const monthsNeeded = monthlyCents > 0 ? Math.ceil(Math.max(0, targetCents - currentCents) / monthlyCents) : 12;
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthsNeeded);

      await addSavingsGoal({
        name: goalName.trim() || 'My Savings Goal',
        targetAmount: targetCents,
        currentAmount: currentCents,
        targetDate: targetDate.toISOString().split('T')[0],
        description: `Monthly savings target: ${formatCurrency(monthlyCents)}/mo`,
        icon: goalIcon,
        color: goalColor,
        isSampleData: false,
      });

      // 3. Schedule notification if enabled
      if (enableWeeklyReminder) {
        await scheduleWeeklyReminder();
      }

      // 4. Mark onboarding finished
      await completeOnboarding();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      await completeOnboarding();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Progress Bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= currentStep ? '#3b82f6' : '#27272a',
                opacity: i <= currentStep ? 1 : 0.4,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="card p-6 bg-[#111113] border border-[#27272a] shadow-2xl rounded-2xl"
          >
            {/* Step 0: Welcome to Crisis */}
            {currentStep === 0 && (
              <div className="text-center py-2">
                <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 p-3 mx-auto mb-5 shadow-xl flex items-center justify-center">
                  <img src="/icon-192.png" alt="Crisis" className="w-full h-full object-contain rounded-xl" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white tracking-tight">
                  Welcome to Crisis
                </h1>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Real-time personal finance. Track accounts, monitor monthly budgets, and crush savings goals without clutter.
                </p>

                <div className="space-y-3 mb-8 text-left bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>Quick 1-minute account balance setup</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span>Set up your primary savings target</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>Weekly check-in reminder so you stay on track</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleNext}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Start Setup
                </Button>
              </div>
            )}

            {/* Step 1: Chequing Account Balance */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Chequing Account</h2>
                    <p className="text-xs text-zinc-400">How much do you currently have in chequing?</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Current Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={chequingBalance}
                      onChange={(e) => setChequingBalance(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                      className="w-full text-2xl font-bold py-3.5 pr-4 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white focus:border-blue-500 outline-none tabular-nums"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Add Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setChequingBalance(String(amt))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer border border-zinc-700/40"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-500 leading-normal">
                  This represents your daily spending money and cash ready to use.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={handleBack} icon={<ChevronLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Savings Account Balance */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Savings Account</h2>
                    <p className="text-xs text-zinc-400">How much do you currently have in savings?</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Current Savings
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={savingsBalance}
                      onChange={(e) => setSavingsBalance(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                      className="w-full text-2xl font-bold py-3.5 pr-4 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white focus:border-emerald-500 outline-none tabular-nums"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Add Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSavingsBalance(String(amt))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer border border-zinc-700/40"
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-500 leading-normal">
                  Your reserve buffer or existing savings stored in bank accounts.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={handleBack} icon={<ChevronLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Create What You're Saving For */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Your Savings Goal</h2>
                    <p className="text-xs text-zinc-400">What are you working toward?</p>
                  </div>
                </div>

                {/* Goal Name */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    What are you saving for?
                  </label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Moving Out, Car, Emergency Fund"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-medium text-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Two Column Cost and Monthly Contribution */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Total Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        style={{ paddingLeft: '24px' }}
                        className="w-full pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:border-purple-500 outline-none tabular-nums"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Monthly Put In
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={goalMonthly}
                        onChange={(e) => setGoalMonthly(e.target.value)}
                        style={{ paddingLeft: '24px' }}
                        className="w-full pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:border-purple-500 outline-none tabular-nums"
                        placeholder="250"
                      />
                    </div>
                  </div>
                </div>

                {/* Already Saved Amount */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    How much do you already have saved for it?
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={goalAlreadySaved}
                      onChange={(e) => setGoalAlreadySaved(e.target.value)}
                      style={{ paddingLeft: '24px' }}
                      className="w-full pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:border-purple-500 outline-none tabular-nums"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Icon Selection (No Emojis) */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Icon & Accent Color
                  </label>
                  <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                    {PRESET_GOAL_ICONS.map((iconKey) => (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setGoalIcon(iconKey)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                          goalIcon === iconKey
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                            : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {renderAppIcon(iconKey, 'w-4 h-4')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGoalColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          goalColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={handleBack} icon={<ChevronLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Notifications & Review */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="text-center py-1">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-white">You're Ready to Roll</h2>
                  <p className="text-xs text-zinc-400 mt-1">Here is a quick snapshot of your setup:</p>
                </div>

                {/* Setup Summary Card */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Chequing Balance:</span>
                    <span className="font-bold text-white tabular-nums">${parseFloat(chequingBalance || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Savings Balance:</span>
                    <span className="font-bold text-white tabular-nums">${parseFloat(savingsBalance || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">Primary Goal:</span>
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      {renderAppIcon(goalIcon, 'w-3.5 h-3.5')}
                      {goalName || 'My Goal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500">
                    <span>Target: ${parseFloat(goalTarget || '0').toFixed(2)}</span>
                    <span>Saved: ${parseFloat(goalAlreadySaved || '0').toFixed(2)}</span>
                  </div>
                </div>

                {/* Weekly Notifications Toggle */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Weekly Spending Reminder</h4>
                      <p className="text-[11px] text-zinc-400">Sunday 7 PM reminder to log spending</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableWeeklyReminder}
                    onChange={(e) => setEnableWeeklyReminder(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="success"
                    size="lg"
                    fullWidth
                    loading={isCompleting}
                    onClick={handleComplete}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Launch Crisis
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
