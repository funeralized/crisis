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
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="spinner" />
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
