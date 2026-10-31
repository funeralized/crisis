import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const isSpinning = isLoading || loading || false;
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-900/30 focus:ring-emerald-500 border border-emerald-500/30',
    secondary:
      'bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] hover:border-[#3f3f46] focus:ring-zinc-500',
    outline:
      'bg-transparent hover:bg-[#18181b] text-[#a1a1aa] hover:text-[#fafafa] border border-[#27272a] hover:border-[#3f3f46] focus:ring-zinc-500',
    ghost:
      'bg-transparent hover:bg-[#18181b] text-[#a1a1aa] hover:text-[#fafafa] border-transparent focus:ring-zinc-500',
    danger:
      'bg-red-600/90 hover:bg-red-600 text-white shadow-sm hover:shadow-red-900/30 focus:ring-red-500 border border-red-500/30',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 border border-emerald-500/30',
  };

  return (
    <button
      disabled={disabled || isSpinning}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isSpinning ? (
        <span className="spinner-sm inline-block mr-1.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isSpinning && (icon && iconPosition === 'right' || rightIcon) && (
        <span className="inline-flex shrink-0">{rightIcon || icon}</span>
      )}
    </button>
  );
};

export default Button;
