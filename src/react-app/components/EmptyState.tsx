import { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
