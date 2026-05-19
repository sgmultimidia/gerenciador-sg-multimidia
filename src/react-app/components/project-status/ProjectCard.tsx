import { CheckCircle, Clock, AlertCircle, X, Edit2, Upload, LinkIcon } from 'lucide-react';
import type { ProjectStatusData } from './types';

interface ProjectCardProps {
  project: ProjectStatusData;
  onEdit: (project: ProjectStatusData) => void;
  onOpenFiles: (project: ProjectStatusData) => void;
  onOpenPortalLinks: (project: ProjectStatusData) => void;
}

export default function ProjectCard({
  project,
  onEdit,
  onOpenFiles,
  onOpenPortalLinks,
}: ProjectCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'review':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'not_started':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Andamento';
      case 'review': return 'Em Revisão';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'in_progress': return 'bg-blue-600';
      case 'review': return 'bg-yellow-600';
      case 'not_started': return 'bg-gray-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition-all">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {getStatusIcon(project.status)}
            <h3 className="text-white font-semibold">
              {project.client_name} - Orçamento #{project.quote_number}
            </h3>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)} text-white font-semibold`}>
              {getStatusLabel(project.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {project.estimated_delivery && (
              <div>
                <p className="text-slate-400">Previsão de Entrega</p>
                <p className="text-white">{new Date(project.estimated_delivery).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {project.actual_delivery && (
              <div>
                <p className="text-slate-400">Entrega Real</p>
                <p className="text-white">{new Date(project.actual_delivery).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400">Última Atualização</p>
              <p className="text-white">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {project.notes && (
            <p className="text-slate-300 text-sm mt-3 p-2 bg-slate-800/50 rounded">{project.notes}</p>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2">
          <button
            onClick={() => onOpenPortalLinks(project)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all flex-1 sm:flex-none"
            title="Links do Portal"
          >
            <LinkIcon className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => onOpenFiles(project)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all flex-1 sm:flex-none"
            title="Gerenciar Arquivos"
          >
            <Upload className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => onEdit(project)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all flex-1 sm:flex-none"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
