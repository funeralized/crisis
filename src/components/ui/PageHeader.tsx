import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  icon,
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-[#27272a] ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-emerald-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#fafafa]">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-[#a1a1aa] mt-1">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
    </div>
  );
};

export default PageHeader;
