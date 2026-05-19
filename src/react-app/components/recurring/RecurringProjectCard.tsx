import { Edit2, Trash2, FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import type { RecurringProject } from '@/shared/types';

interface RecurringProjectCardProps {
  project: RecurringProject;
  isActive: boolean;
  onEdit: (project: RecurringProject) => void;
  onToggleActive: (project: RecurringProject) => void;
  onDelete: (project: RecurringProject) => void;
  onGenerateReceipt: (project: RecurringProject) => void;
}

export default function RecurringProjectCard({
  project,
  isActive,
  onEdit,
  onToggleActive,
  onDelete,
  onGenerateReceipt,
}: RecurringProjectCardProps) {
  return (
    <div className={`${
      isActive 
        ? 'bg-emerald-900/20 border-l-4 border-emerald-500' 
        : 'bg-slate-700/50 opacity-60'
    } rounded-lg p-4`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-lg mb-1 break-words">
            {project.project_name}
          </h4>
          <p className={`text-sm mb-2 truncate ${
            isActive ? 'text-emerald-300' : 'text-slate-300'
          }`}>
            {project.client_name || 'Cliente não identificado'}
          </p>
          
          {project.description && (
            <p className="text-slate-300 text-sm mb-3 break-words">
              {project.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Valor Mensal</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {project.monthly_value ? (
                  <>
                    R$ {Number(project.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {project.is_variable_value === 1 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-600/50 text-orange-200 ml-1">
                        Variável
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">A definir</span>
                )}
              </p>
            </div>
            {project.start_date && typeof project.start_date === 'string' && (
              <div>
                <p className="text-slate-400">Início</p>
                <p className="text-white">{project.start_date.split('-').reverse().join('/')}</p>
              </div>
            )}
            {project.end_date && typeof project.end_date === 'string' && (
              <div>
                <p className="text-slate-400">Término</p>
                <p className="text-white">{project.end_date.split('-').reverse().join('/')}</p>
              </div>
            )}
            {project.payment_day && (
              <div>
                <p className="text-slate-400">Dia de Pagamento</p>
                <p className="text-white">Dia {project.payment_day}</p>
              </div>
            )}
          </div>
          
          {project.notes && (
            <p className="text-slate-300 text-sm mt-3 p-2 bg-slate-800/50 rounded break-words">
              {project.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2 ml-4 flex-shrink-0">
          {isActive && (
            <button
              onClick={() => onGenerateReceipt(project)}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all"
              title="Gerar Recibo"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {isActive && (
            <button
              onClick={() => onEdit(project)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onToggleActive(project)}
            className={`p-2 ${
              isActive 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white rounded-md transition-all`}
            title={isActive ? 'Desativar' : 'Ativar'}
          >
            {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
