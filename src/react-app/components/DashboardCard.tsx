import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function DashboardCard({ 
  title, 
  description, 
  icon, 
  children, 
  action,
  className = '' 
}: DashboardCardProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 ${className}`}>
      {/* Card Header */}
      <div className={`border-b border-slate-700/50 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {icon && (
              <div className={`rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>{title}</h3>
              {description && (
                <p className={`text-slate-400 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{description}</p>
              )}
            </div>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className={`flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
            >
              {action.label}
              <ChevronRight className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className={isMobile ? 'p-4' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}
