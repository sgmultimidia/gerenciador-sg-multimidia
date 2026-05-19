import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export default function StatCard({ 
  label, 
  value, 
  icon, 
  trend,
  onClick,
  className = '' 
}: StatCardProps) {
  const isClickable = !!onClick;
  const isMobile = useIsMobile();

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 
        hover:border-slate-600/50 transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:bg-slate-800/70' : ''}
        ${isMobile ? 'p-3' : 'p-6'}
        ${className}
      `}
    >
      <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
        <p className={`font-medium text-slate-400 uppercase tracking-wide ${isMobile ? 'text-[9px] leading-tight' : 'text-sm'}`}>
          {label}
        </p>
        {icon && (
          <div className={`rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <p className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-3xl'}`}>{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 font-medium ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          } ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {trend.isPositive ? (
              <TrendingUp className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            ) : (
              <TrendingDown className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
