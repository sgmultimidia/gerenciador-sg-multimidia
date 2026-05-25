import { useState, useEffect } from 'react';
import { X, Plus, ChevronRight, ChevronLeft, Trash2, Edit2, Film, Mic, Radio, Share2, Camera, Music, Check } from 'lucide-react';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface ProductionProject {
  id: number;
  client_id?: number;
  client_name?: string;
  service_type: string;
  title: string;
  current_step: number;
  status: string;
  notes?: string;
  deadline?: string;
  created_at: string;
}

interface Client {
  id: number;
  name: string;
}

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

const SERVICE_TYPES = {
  video: {
    label: 'Gravação de Vídeo',
    icon: Film,
    color: 'blue',
    steps: ['Briefing', 'Roteiro', 'Gravação', 'Edição', 'Revisão do Cliente', 'Entregue'],
  },
  audio: {
    label: 'Gravação de Áudio',
    icon: Mic,
    color: 'purple',
    steps: ['Briefing', 'Roteiro', 'Gravação', 'Edição', 'Revisão do Cliente', 'Entregue'],
  },
  live: {
    label: 'Transmissão ao Vivo',
    icon: Radio,
    color: 'red',
    steps: ['Briefing', 'Teste de Equipamentos', 'Transmitindo', 'Encerrado'],
  },
  social: {
    label: 'Redes Sociais',
    icon: Share2,
    color: 'green',
    steps: ['Planejamento', 'Produção', 'Revisão', 'Publicado'],
  },
  photo: {
    label: 'Fotografia / Captação',
    icon: Camera,
    color: 'yellow',
    steps: ['Briefing', 'Agendado', 'Captação Realizada', 'Edição', 'Entregue'],
  },
  music: {
    label: 'Produção Musical',
    icon: Music,
    color: 'pink',
    steps: ['Briefing', 'Composição/Arranjo', 'Gravação', 'Mixagem', 'Masterização', 'Revisão do Cliente', 'Entregue'],
  },
} as const;

type ServiceType = keyof typeof SERVICE_TYPES;

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-600',
  pink: 'bg-pink-600',
};

const BORDER_MAP: Record<string, string> = {
  blue: 'border-blue-500/30',
  purple: 'border-purple-500/30',
  red: 'border-red-500/30',
  green: 'border-green-500/30',
  yellow: 'border-yellow-500/30',
  pink: 'border-pink-500/30',
};

export default function ProductionModal({ isOpen, onClose, clients }: ProductionModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProductionProject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formServiceType, setFormServiceType] = useState<ServiceType>('video');
  const [formTitle, setFormTitle] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  useEffect(() => {
    if (isOpen) loadProjects();
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/production');
      if (res.ok) setProjects(await res.json());
    } catch { toast.error('Erro ao carregar projetos'); }
    finally { setLoading(false); }
  };

  const openForm = (project?: ProductionProject) => {
    if (project) {
      setEditingProject(project);
      setFormServiceType(project.service_type as ServiceType);
      setFormTitle(project.title);
      setFormClientId(project.client_id ? String(project.client_id) : '');
      setFormNotes(project.notes || '');
      setFormDeadline(project.deadline || '');
    } else {
      setEditingProject(null);
      setFormServiceType('video');
      setFormTitle('');
      setFormClientId('');
      setFormNotes('');
      setFormDeadline('');
    }
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingProject(null); };

  const saveProject = async () => {
    if (!formTitle) { toast.warning('Informe o título do projeto'); return; }
    setSaving(true);
    try {
      const payload = {
        client_id: formClientId ? parseInt(formClientId) : null,
        service_type: formServiceType,
        title: formTitle,
        notes: formNotes || null,
        deadline: formDeadline || null,
        current_step: editingProject?.current_step || 0,
        status: editingProject?.status || 'active',
      };
      const url = editingProject ? `/api/production/${editingProject.id}` : '/api/production';
      const method = editingProject ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editingProject ? 'Projeto atualizado!' : 'Projeto criado!');
      closeForm();
      await loadProjects();
    } catch { toast.error('Erro ao salvar projeto'); }
    finally { setSaving(false); }
  };

  const advanceStep = async (project: ProductionProject) => {
    const config = SERVICE_TYPES[project.service_type as ServiceType];
    if (!config) return;
    const maxStep = config.steps.length - 1;
    if (project.current_step >= maxStep) return;
    try {
      await fetch(`/api/production/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, current_step: project.current_step + 1 }),
      });
      await loadProjects();
    } catch { toast.error('Erro ao avançar etapa'); }
  };

  const regressStep = async (project: ProductionProject) => {
    if (project.current_step <= 0) return;
    try {
      await fetch(`/api/production/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, current_step: project.current_step - 1 }),
      });
      await loadProjects();
    } catch { toast.error('Erro ao voltar etapa'); }
  };

  const completeProject = async (project: ProductionProject) => {
    try {
      await fetch(`/api/production/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, status: 'completed' }),
      });
      toast.success('Projeto concluído! 🎉');
      await loadProjects();
    } catch { toast.error('Erro ao concluir projeto'); }
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Excluir este projeto?')) return;
    try {
      await fetch(`/api/production/${id}`, { method: 'DELETE' });
      toast.success('Projeto excluído');
      await loadProjects();
    } catch { toast.error('Erro ao excluir projeto'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-3xl max-h-[90vh] shadow-2xl border border-orange-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900 to-red-900 border-b border-orange-500/30 p-5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Produção Audiovisual</h3>
              <p className="text-orange-200 text-sm">{projects.length} projeto{projects.length !== 1 ? 's' : ''} ativo{projects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openForm()}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Novo Projeto
            </button>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum projeto em produção</p>
              <p className="text-sm mt-1">Crie um projeto para acompanhar o fluxo de produção</p>
            </div>
          ) : (
            projects.map(project => {
              const config = SERVICE_TYPES[project.service_type as ServiceType];
              if (!config) return null;
              const Icon = config.icon;
              const steps = config.steps;
              const currentStep = project.current_step;
              const isLast = currentStep >= steps.length - 1;
              const progress = ((currentStep) / (steps.length - 1)) * 100;

              return (
                <div key={project.id} className={`bg-slate-700/50 rounded-xl p-4 border ${BORDER_MAP[config.color]}`}>
                  {/* Project header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 ${COLOR_MAP[config.color]} rounded-lg flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{project.title}</p>
                        <p className="text-slate-400 text-xs">{config.label}{project.client_name ? ` • ${project.client_name}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {isLast && (
                        <button onClick={() => completeProject(project)}
                          className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all" title="Concluir projeto">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openForm(project)}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProject(project.id)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            idx < currentStep ? 'bg-green-600/30 text-green-300' :
                            idx === currentStep ? `${COLOR_MAP[config.color]} text-white` :
                            'bg-slate-600/50 text-slate-400'
                          }`}>
                            {idx < currentStep ? '✓' : idx + 1}. {step}
                          </div>
                          {idx < steps.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${COLOR_MAP[config.color]}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {project.deadline && (
                        <p className="text-slate-400 text-xs">📅 {new Date(project.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      )}
                      {project.notes && (
                        <p className="text-slate-400 text-xs truncate max-w-[200px]">📝 {project.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => regressStep(project)} disabled={currentStep <= 0}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white rounded-lg transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => advanceStep(project)} disabled={isLast}
                        className={`p-1.5 ${COLOR_MAP[config.color]} hover:opacity-80 disabled:opacity-30 text-white rounded-lg transition-all`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-orange-500/30 shadow-2xl">
            <div className="bg-gradient-to-r from-orange-900 to-red-900 p-4 rounded-t-xl flex justify-between items-center border-b border-orange-500/30">
              <h3 className="text-white font-bold">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button onClick={closeForm} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Tipo de Serviço *</label>
                <select value={formServiceType} onChange={e => setFormServiceType(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {Object.entries(SERVICE_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Título *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ex: Vídeo Institucional - Loja X"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Cliente (opcional)</label>
                <select value={formClientId} onChange={e => setFormClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Sem cliente vinculado</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Prazo (opcional)</label>
                <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Observações (opcional)</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
                  placeholder="Detalhes do projeto..."
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">Cancelar</button>
                <button onClick={saveProject} disabled={saving || !formTitle}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-semibold">
                  {saving ? 'Salvando...' : editingProject ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
