import { Routes, Route, Navigate } from 'react-router-dom';
import { useFinance } from './store/FinanceContext';
import { lazy, Suspense } from 'react';

// Layout
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Pages - lazy loaded
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const IncomePage = lazy(() => import('./pages/IncomePage'));
const SavingsPage = lazy(() => import('./pages/SavingsPage'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse w-full max-w-7xl mx-auto py-2">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-800/80 rounded-lg animate-shimmer" />
          <div className="h-4 w-72 bg-zinc-800/50 rounded-md animate-shimmer" />
        </div>
        <div className="h-9 w-28 bg-zinc-800/60 rounded-xl animate-shimmer" />
      </div>

      {/* Top 4 stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-shimmer" />
              <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-shimmer" />
            </div>
            <div className="h-8 w-32 bg-zinc-800 rounded-md animate-shimmer" />
            <div className="h-3 w-20 bg-zinc-800/60 rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Main chart panels skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-72 p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col justify-between">
          <div className="h-5 w-40 bg-zinc-800 rounded animate-shimmer" />
          <div className="h-44 w-full bg-zinc-800/30 rounded-lg animate-shimmer" />
        </div>
        <div className="card h-72 p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col justify-between">
          <div className="h-5 w-40 bg-zinc-800 rounded animate-shimmer" />
          <div className="h-44 w-full bg-zinc-800/30 rounded-lg animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { isLoading, settings } = useFinance();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!settings.onboardingCompleted) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingPage />
      </Suspense>
    );
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/savings" element={<SavingsPage />} />
          <Route path="/savings/:goalId" element={<GoalDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
