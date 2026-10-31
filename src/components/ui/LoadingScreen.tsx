import React from 'react';
import { motion } from 'framer-motion';

export interface LoadingScreenProps {
  message?: string;
  appName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading your financial data...',
  appName = 'Crisis',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      {/* Subtle radial background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center relative z-10"
      >
        {/* Animated Brand Icon & Spinner container */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-blue)] animate-spin" />
          
          {/* Inner pulsating glow */}
          <div className="absolute inset-2 rounded-full bg-[var(--accent-blue-dim)] animate-pulse" />

          {/* Logo icon */}
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center shadow-md overflow-hidden">
            <img src="/icon-192.png" className="w-7 h-7 object-contain" alt="Crisis" />
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          {appName}
        </h1>

        {/* Message */}
        <p className="text-sm text-[var(--text-tertiary)] max-w-xs font-normal">
          {message}
        </p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
