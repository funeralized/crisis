import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Settings,
  Download,
  Shield,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../store/FinanceContext';
import { useToast } from '../ui/Toast';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Budget', path: '/budget', icon: PieChart },
  { name: 'Income', path: '/income', icon: TrendingUp },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { exportData, transactions } = useFinance();
  const { success, error } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [justExported, setJustExported] = useState(false);

  const handleExportBackup = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const jsonString = await exportData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `vault-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setJustExported(true);
      setTimeout(() => setJustExported(false), 3000);
      success('Financial data exported successfully', 'Backup Saved');
    } catch (err) {
      console.error('Failed to export data:', err);
      error('Failed to generate export backup', 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          w-[240px] bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top: Logo & Close Button */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border-primary)]">
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
                  Vault
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--accent-blue)] font-semibold -mt-0.5">
                  Personal Finance
                </span>
              </div>
            </NavLink>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] lg:hidden transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
                    text-sm font-medium transition-all duration-150 select-none
                    ${
                      isActive
                        ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border-l-2 border-[var(--accent-blue)] font-semibold pl-2.5'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Backup & Status */}
        <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-card)]/50 space-y-2">
          {/* Quick Info */}
          <div className="px-2 py-1 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Offline Database</span>
            <span className="tabular-nums font-mono text-[11px] text-[var(--text-secondary)]">
              {transactions.length} records
            </span>
          </div>

          {/* Backup / Export Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className={`
              w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium
              rounded-[var(--radius-md)] border transition-all duration-150 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                justExported
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--accent-green)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]'
              }
            `}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-blue)]" />
                <span>Exporting...</span>
              </>
            ) : justExported ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                <span>Backup Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
