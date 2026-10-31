import React, { useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import Sidebar from './Sidebar';
import { ToastProvider } from '../ui/Toast';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] transition-all">
          {/* Mobile Top Navigation Bar */}
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[var(--bg-secondary)]/90 backdrop-blur-md border-b border-[var(--border-primary)] pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                  <Shield className="w-4 h-4 fill-current" />
                </div>
                <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
                  Vault
                </span>
              </div>
            </div>
          </header>

          {/* Page Content Container with iOS safe area insets */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
