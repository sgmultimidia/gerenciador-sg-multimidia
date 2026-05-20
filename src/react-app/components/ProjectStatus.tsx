import { useState, useEffect } from 'react';
import { X, Plus, Calendar, Upload, Download, Trash2, File, FileText, FileVideo, FileAudio, FileImage, Link as LinkIcon, Copy, Eye, CheckCircle2 } from 'lucide-react';
import type { Quote, Client, ProjectFile, ClientPortalLink } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { Select } from './ui';
import ProjectCard from './project-status/ProjectCard';
import ProjectStatsBar from './project-status/ProjectStatsBar';
import type { ProjectStatusData } from './project-status/types';

interface ProjectStatusProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function ProjectStatus({ isOpen, onClose, clients }: ProjectStatusProps) {
  const toast = useToast();
  const confirm = useConfirm();
  useLockBodyScroll(isOpen);
  
  const [projects, setProjects] = useState<ProjectStatusData[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectStatusData | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedProjectForFiles, setSelectedProjectForFiles] = useState<ProjectStatusData | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPortalLinksModal, setShowPortalLinksModal] = useState(false);
  const [selectedProjectForLinks, setSelectedProjectForLinks] = useState<ProjectStatusData | null>(null);
  const [portalLinks, setPortalLinks] = useState<ClientPortalLink[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkExpireDays, setNewLinkExpireDays] = useState('30');
  const [newLinkPaymentRequired, setNewLinkPaymentRequired] = useState(false);

  // Form fields
  const [selectedQuote, setSelectedQuote] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'review' | 'completed' | 'cancelled'>('not_started');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [actualDelivery, setActualDelivery] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      loadApprovedQuotes();
    }
  }, [isOpen, filterStatus]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'all'
        ? `/api/project-status?status=${filterStatus}`
        : '/api/project-status';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedQuotes = async () => {
    try {
      const response = await fetch('/api/quotes?search=');
      if (response.ok) {
        const data = await response.json();
        const approved = data.filter((q: Quote & { client_name: string }) => q.status === 'approved');
        setQuotes(approved);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
    }
  };

  const createProject = async () => {
    if (!selectedQuote) {
      toast.warning('Selecione um orçamento');
      return;
    }

    setLoading(true);
    try {
      // Calculate progress based on status
      let calculatedProgress = 0;
      if (status === 'in_progress') calculatedProgress = 33;
      else if (status === 'review') calculatedProgress = 66;
      else if (status === 'completed') calculatedProgress = 100;

      const response = await fetch('/api/project-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: Number(selectedQuote),
          status,
          progress: calculatedProgress,
          estimated_delivery: estimatedDelivery || null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        toast.success('Projeto criado com sucesso!');
        resetForm();
        setShowNewModal(false);
        await loadProjects();
      } else {
        toast.error('Erro ao criar projeto');
      }
    } catch (error) {
      toast.error('Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;

    setLoading(true);
    try {
      // Calculate progress based on status
      let calculatedProgress = 0;
      if (status === 'in_progress') calculatedProgress = 33;
      else if (status === 'review') calculatedProgress = 66;
      else if (status === 'completed') calculatedProgress = 100;

      const response = await fetch(`/api/project-status/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          progress: calculatedProgress,
          estimated_delivery: estimatedDelivery || null,
          actual_delivery: actualDelivery || null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        toast.success('Projeto atualizado com sucesso!');
        resetForm();
        setEditingProject(null);
        await loadProjects();
      } else {
        toast.error('Erro ao atualizar projeto');
      }
    } catch (error) {
      toast.error('Erro ao atualizar projeto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedQuote('');
    setStatus('not_started');
    setEstimatedDelivery('');
    setActualDelivery('');
    setNotes('');
  };

  const loadProjectFiles = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/project-files/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectFiles(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectForFiles || !event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    // Validate file size (100 MB limit)
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSizeBytes) {
      toast.error('Arquivo muito grande! Limite máximo: 100 MB');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const response = await fetch(`/api/project-files/${selectedProjectForFiles.id}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Arquivo enviado com sucesso! Disponível por 7 dias.');
        await loadProjectFiles(selectedProjectForFiles.id);
        
        // Check if this triggers project completion and get WhatsApp link
        try {
          const whatsappResponse = await fetch(`/api/project-files/${selectedProjectForFiles.id}/whatsapp-link`);
          if (whatsappResponse.ok) {
            const data = await whatsappResponse.json();
            if (data.whatsapp_url && data.project_status === 'completed') {
              // Show success message with WhatsApp option
              const shouldOpenWhatsApp = await confirm.confirm({
                title: 'Projeto Concluído! 🎉',
                message: 'O projeto foi marcado como concluído automaticamente. Deseja enviar o link de cobrança para o cliente via WhatsApp?',
                type: 'info'
              });
              
              if (shouldOpenWhatsApp) {
                window.open(data.whatsapp_url, '_blank');
                toast.success('Link de cobrança enviado via WhatsApp!');
              }
            }
          }
        } catch (whatsappError) {
          // Non-blocking - silently fail
        }
        
        // Reset file input
        event.target.value = '';
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao enviar arquivo');
      }
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Download iniciado');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao baixar arquivo');
      }
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!selectedProjectForFiles) return;

    const confirmed = await confirm.confirm({
      title: 'Excluir Arquivo',
      message: 'Tem certeza que deseja excluir este arquivo?',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/project-files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Arquivo excluído com sucesso!');
        await loadProjectFiles(selectedProjectForFiles.id);
      } else {
        toast.error('Erro ao excluir arquivo');
      }
    } catch (error) {
      toast.error('Erro ao excluir arquivo');
    }
  };

  const openFilesModal = (project: ProjectStatusData) => {
    setSelectedProjectForFiles(project);
    setShowFilesModal(true);
    loadProjectFiles(project.id);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-400" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const loadPortalLinks = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portal-links/project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setPortalLinks(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar links');
    } finally {
      setLoading(false);
    }
  };

  const createPortalLink = async () => {
    if (!selectedProjectForLinks) return;

    setCreatingLink(true);
    try {
      const response = await fetch(`/api/portal-links/${selectedProjectForLinks.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expires_in_days: newLinkExpireDays ? parseInt(newLinkExpireDays) : null,
          payment_required: newLinkPaymentRequired,
        }),
      });

      if (response.ok) {
        toast.success('Link criado com sucesso!');
        await loadPortalLinks(selectedProjectForLinks.id);
        setNewLinkExpireDays('30');
        setNewLinkPaymentRequired(false);
      } else {
        toast.error('Erro ao criar link');
      }
    } catch (error) {
      toast.error('Erro ao criar link');
    } finally {
      setCreatingLink(false);
    }
  };

  const togglePortalLink = async (linkId: number) => {
    if (!selectedProjectForLinks) return;

    try {
      const response = await fetch(`/api/portal-links/${linkId}/toggle`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Status do link atualizado!');
        await loadPortalLinks(selectedProjectForLinks.id);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const verifyPayment = async (linkId: number) => {
    if (!selectedProjectForLinks) return;

    const confirmed = await confirm.confirm({
      title: 'Verificar Pagamento',
      message: 'Confirmar que o pagamento foi recebido? Isso liberará o download completo dos arquivos.',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/portal-links/${linkId}/verify-payment`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Pagamento verificado!');
        await loadPortalLinks(selectedProjectForLinks.id);
      } else {
        toast.error('Erro ao verificar pagamento');
      }
    } catch (error) {
      toast.error('Erro ao verificar pagamento');
    }
  };

  const deletePortalLink = async (linkId: number) => {
    if (!selectedProjectForLinks) return;

    const confirmed = await confirm.confirm({
      title: 'Excluir Link',
      message: 'Tem certeza que deseja excluir este link? O cliente não poderá mais acessar o portal com este link.',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/portal-links/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Link excluído!');
        await loadPortalLinks(selectedProjectForLinks.id);
      } else {
        toast.error('Erro ao excluir link');
      }
    } catch (error) {
      toast.error('Erro ao excluir link');
    }
  };

  const copyLinkToClipboard = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para área de transferência!');
  };

  const openPortalLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    window.open(url, '_blank');
  };

  const openPortalLinksModal = (project: ProjectStatusData) => {
    setSelectedProjectForLinks(project);
    setShowPortalLinksModal(true);
    loadPortalLinks(project.id);
  };

  const startEdit = (project: ProjectStatusData) => {
    setEditingProject(project);
    setStatus(project.status);
    setEstimatedDelivery(project.estimated_delivery || '');
    setActualDelivery(project.actual_delivery || '');
    setNotes(project.notes || '');
  };

  if (!isOpen) return null;

  const projectsByStatus = {
    not_started: projects.filter(p => p.status === 'not_started').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    review: projects.filter(p => p.status === 'review').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] my-8 shadow-2xl border border-blue-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Status de Projetos</h2>
              <p className="text-purple-200">Acompanhe o progresso de cada projeto</p>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Stats */}
          <div className="p-6 border-b border-slate-700">
            <ProjectStatsBar
              stats={projectsByStatus}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
            />
          </div>

          {/* Filters and Add Button */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="not_started">Não Iniciados</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="review">Em Revisão</option>
                  <option value="completed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </Select>

              </div>

              <button
                onClick={() => {
                  resetForm();
                  setShowNewModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md font-semibold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Novo Projeto
              </button>
            </div>
          </div>

          {/* Projects List */}
          <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Nenhum projeto encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={startEdit}
                  onOpenFiles={openFilesModal}
                  onOpenPortalLinks={openPortalLinksModal}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* New/Edit Project Modal */}
      {(showNewModal || editingProject) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] my-8 shadow-2xl border border-purple-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b border-purple-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  {editingProject ? 'Atualizar Status do Projeto' : 'Novo Projeto'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewModal(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {!editingProject && (
                <Select
                  label="Orçamento"
                  required
                  value={selectedQuote}
                  onChange={(e) => setSelectedQuote(e.target.value)}
                >
                  <option value="">Selecione um orçamento</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      #{quote.quote_number} - {(quote as any).client_name}
                    </option>
                  ))}
                </Select>
              )}

              <Select
                label="Status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="not_started">Não Iniciado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="review">Em Revisão</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Previsão de Entrega</label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {editingProject && (
                  <div>
                    <label className="block text-white font-semibold mb-2">Data de Entrega Real</label>
                    <input
                      type="date"
                      value={actualDelivery}
                      onChange={(e) => setActualDelivery(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Anotações sobre o progresso do projeto..."
                />
              </div>

              <button
                onClick={editingProject ? updateProject : createProject}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md font-semibold transition-all shadow-lg"
              >
                {loading ? 'Salvando...' : editingProject ? 'Atualizar Status' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Links Modal */}
      {showPortalLinksModal && selectedProjectForLinks && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] my-8 shadow-2xl border border-green-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-b border-green-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Links do Portal do Cliente</h3>
                  <p className="text-green-200 mt-1">
                    {selectedProjectForLinks.client_name} - Orçamento #{selectedProjectForLinks.quote_number}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPortalLinksModal(false);
                    setSelectedProjectForLinks(null);
                    setPortalLinks([]);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Create New Link Section */}
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-green-500/30">
                <h4 className="text-white font-semibold mb-4">Criar Novo Link</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-white text-sm mb-2">Validade (dias)</label>
                    <input
                      type="number"
                      value={newLinkExpireDays}
                      onChange={(e) => setNewLinkExpireDays(e.target.value)}
                      placeholder="Deixe vazio para sem expiração"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLinkPaymentRequired}
                        onChange={(e) => setNewLinkPaymentRequired(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">Requer verificação de pagamento</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={createPortalLink}
                  disabled={creatingLink}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md font-semibold transition-all"
                >
                  {creatingLink ? 'Criando...' : 'Criar Link'}
                </button>
              </div>

              {/* Links List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : portalLinks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <LinkIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum link criado ainda</p>
                  <p className="text-sm mt-2">Crie um link para compartilhar com o cliente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portalLinks.map((link) => {
                    const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                    const portalUrl = `${window.location.origin}/portal/${link.token}`;

                    return (
                      <div
                        key={link.id}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                link.is_active && !isExpired
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-600 text-white'
                              } font-semibold`}>
                                {isExpired ? 'Expirado' : link.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                              {link.payment_required && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  link.payment_verified
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-yellow-600 text-white'
                                } font-semibold`}>
                                  {link.payment_verified ? 'Pago' : 'Pagamento Pendente'}
                                </span>
                              )}
                            </div>
                            <p className="text-white font-mono text-sm break-all mb-2">
                              {portalUrl}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              <span>Acessos: {link.access_count}</span>
                              {link.expires_at && (
                                <span>Expira: {new Date(link.expires_at).toLocaleDateString('pt-BR')}</span>
                              )}
                              {link.last_accessed_at && (
                                <span>Último acesso: {new Date(link.last_accessed_at).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => copyLinkToClipboard(link.token)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                          <button
                            onClick={() => openPortalLink(link.token)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Visualizar
                          </button>
                          <button
                            onClick={() => togglePortalLink(link.id)}
                            className={`px-3 py-1.5 ${
                              link.is_active
                                ? 'bg-gray-600 hover:bg-gray-700'
                                : 'bg-green-600 hover:bg-green-700'
                            } text-white rounded text-sm font-semibold transition-all`}
                          >
                            {link.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                          {link.payment_required && !link.payment_verified && (
                            <button
                              onClick={() => verifyPayment(link.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Verificar Pagamento
                            </button>
                          )}
                          <button
                            onClick={() => deletePortalLink(link.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Files Management Modal */}
      {showFilesModal && selectedProjectForFiles && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] my-8 shadow-2xl border border-blue-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-blue-900 to-cyan-900 p-6 border-b border-blue-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Arquivos do Projeto</h3>
                  <p className="text-blue-200 mt-1">
                    {selectedProjectForFiles.client_name} - Orçamento #{selectedProjectForFiles.quote_number}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFilesModal(false);
                    setSelectedProjectForFiles(null);
                    setProjectFiles([]);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Upload Section */}
              <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-12 h-12 text-blue-400 mb-2" />
                  <span className="text-white font-semibold mb-1">Clique para fazer upload</span>
                  <span className="text-slate-400 text-sm">Áudio, vídeo, imagens, PDF, etc.</span>
                  <span className="text-yellow-400 text-xs mt-1">Limite: 100 MB | Arquivos expiram em 7 dias</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
                {uploadingFile && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-white">Enviando arquivo...</span>
                  </div>
                )}
              </div>

              {/* Files List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : projectFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum arquivo ainda</p>
                  <p className="text-sm mt-2">Faça upload de arquivos relacionados ao projeto</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectFiles.map((file) => {
                    const isExpired = file.expires_at ? new Date(file.expires_at) < new Date() : false;
                    const daysUntilExpiration = file.expires_at 
                      ? Math.ceil((new Date(file.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <div key={file.id} className={`bg-slate-700/50 rounded-lg p-4 border ${isExpired ? 'border-red-500/50' : 'border-slate-600'} hover:border-blue-500/50 transition-all`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.file_type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-semibold truncate">{file.original_filename}</h4>
                                {isExpired && (
                                  <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-semibold">
                                    EXPIRADO
                                  </span>
                                )}
                                {!isExpired && daysUntilExpiration !== null && daysUntilExpiration <= 2 && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-600 text-white rounded font-semibold">
                                    {daysUntilExpiration}d restante{daysUntilExpiration !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                <span>{formatFileSize(file.file_size)}</span>
                                <span>•</span>
                                <span>{new Date(file.upload_date).toLocaleDateString('pt-BR')}</span>
                                {file.expires_at && (
                                  <>
                                    <span>•</span>
                                    <span className={isExpired ? 'text-red-400' : ''}>
                                      Expira: {new Date(file.expires_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  </>
                                )}
                              </div>
                              {file.notes && (
                                <p className="text-slate-300 text-sm mt-2">{file.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleFileDownload(file.id, file.original_filename)}
                              disabled={isExpired}
                              className={`px-3 py-1.5 ${isExpired ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-all`}
                              title={isExpired ? 'Arquivo expirado' : 'Baixar'}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleFileDelete(file.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
