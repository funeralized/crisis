import React from 'react';
import Button, { ButtonProps } from './Button';

export interface EmptyStateActionConfig {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: ButtonProps['variant'];
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | EmptyStateActionConfig;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      const config = action as EmptyStateActionConfig;
      return (
        <Button
          variant={config.variant || 'primary'}
          onClick={config.onClick}
          icon={config.icon}
        >
          {config.label}
        </Button>
      );
    }
    return action as React.ReactNode;
  };

  return (
    <div
      className={`card flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#27272a] ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#71717a] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-[#fafafa]">{title}</h3>
      {description && (
        <p className="text-sm text-[#a1a1aa] max-w-sm mt-1 mb-5">{description}</p>
      )}
      {action && <div>{renderAction()}</div>}
    </div>
  );
};

export default EmptyState;
