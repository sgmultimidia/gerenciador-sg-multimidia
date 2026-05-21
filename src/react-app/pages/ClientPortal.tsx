import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, FileAudio, FileVideo, FileImage, File, FileText, Clock, CheckCircle, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ClientPortalLink, ProjectFile } from '@/shared/types';
import { AnimatedPage } from '@/react-app/components/animated';

interface PortalData {
  portal_link: ClientPortalLink;
  project: {
    id: number;
    quote_id: number;
    status: string;
    progress: number;
    client_name: string;
    quote_number: string;
    estimated_delivery?: string;
    notes?: string;
  };
  files: ProjectFile[];
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-600',
  in_progress: 'bg-blue-600',
  review: 'bg-yellow-600',
  completed: 'bg-green-600',
  cancelled: 'bg-red-600',
};

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadPortalData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/portal/${token}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || 'Link inválido ou expirado');
        return;
      }
      const data = await response.json();
      setPortalData(data);
    } catch {
      setError('Erro ao carregar portal');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (file: ProjectFile) => {
    if (!token) return;
    setLoadingPreview(true);
    setPreviewFile(file);
    try {
      const response = await fetch(`/api/portal/${token}/file/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch {
      setPreviewUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const downloadFile = async (file: ProjectFile) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/portal/${token}/file/${file.id}/download`);
      if (!response.ok) { alert('Erro ao baixar arquivo'); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Erro ao baixar arquivo');
    }
  };

  const handleApprove = async () => {
    if (!token) return;
    setApproving(true);
    try {
      const response = await fetch(`/api/portal/${token}/approve`, { method: 'POST' });
      if (response.ok) setApproved(true);
    } catch {
      // silently fail
    } finally {
      setApproving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const canPreview = (file: ProjectFile) =>
    file.file_type.startsWith('audio/') ||
    file.file_type.startsWith('video/') ||
    file.file_type.startsWith('image/') ||
    file.file_type === 'application/pdf';

  const getFileIcon = (fileType: string, size = 'w-6 h-6') => {
    if (fileType.startsWith('image/')) return <FileImage className={`${size} text-blue-400`} />;
    if (fileType.startsWith('video/')) return <FileVideo className={`${size} text-purple-400`} />;
    if (fileType.startsWith('audio/')) return <FileAudio className={`${size} text-green-400`} />;
    if (fileType.includes('pdf')) return <FileText className={`${size} text-red-400`} />;
    return <File className={`${size} text-slate-400`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center border border-red-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Acesso Indisponível</h1>
          <p className="text-slate-400 text-sm">{error || 'Link inválido ou expirado.'}</p>
        </motion.div>
      </div>
    );
  }

  const { project, files } = portalData;

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">SG Multimídia</p>
            <p className="text-slate-400 text-xs">Portal do Cliente</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{project.client_name}</p>
            <p className="text-slate-400 text-xs">Orçamento #{project.quote_number}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <motion.div
          className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Status do Projeto</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold text-white ${STATUS_COLORS[project.status] || 'bg-slate-600'}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progresso</span>
              <span className="text-white font-bold">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {project.estimated_delivery && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Previsão: {new Date(project.estimated_delivery + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {project.notes && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-xl text-slate-300 text-sm">
              {project.notes}
            </div>
          )}
        </motion.div>

        {/* Files */}
        <motion.div
          className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-bold text-lg mb-4">
            Arquivos Entregues
            {files.length > 0 && <span className="ml-2 text-sm text-slate-400 font-normal">({files.length})</span>}
          </h2>

          {files.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum arquivo disponível ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{file.original_filename}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{formatFileSize(file.file_size)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {canPreview(file) && (
                        <button
                          onClick={() => openPreview(file)}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
                          title="Visualizar"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Approval */}
        {files.length > 0 && (
          <motion.div
            className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {approved ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-bold">Material aprovado!</p>
                  <p className="text-sm text-slate-400">Obrigado pela confirmação.</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-white font-bold text-lg mb-2">Aprovação do Material</h2>
                <p className="text-slate-400 text-sm mb-4">Após revisar os arquivos, confirme a aprovação do material.</p>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {approving ? 'Confirmando...' : 'Aprovar Material'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs pb-4">
          © SG Multimídia · São Pedro do Sul - RS
        </p>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold truncate">{previewFile.original_filename}</p>
                <button onClick={closePreview} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingPreview ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                </div>
              ) : previewUrl ? (
                <div className="bg-slate-900 rounded-xl overflow-hidden">
                  {previewFile.file_type.startsWith('audio/') && (
                    <div className="p-8 text-center">
                      <FileAudio className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <audio controls autoPlay src={previewUrl} className="w-full" />
                    </div>
                  )}
                  {previewFile.file_type.startsWith('video/') && (
                    <video controls autoPlay src={previewUrl} className="w-full max-h-[70vh]" />
                  )}
                  {previewFile.file_type.startsWith('image/') && (
                    <img src={previewUrl} alt={previewFile.original_filename} className="w-full max-h-[70vh] object-contain" />
                  )}
                  {previewFile.file_type === 'application/pdf' && (
                    <iframe src={previewUrl} className="w-full h-[70vh]" title={previewFile.original_filename} />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Não foi possível carregar a prévia.</p>
                </div>
              )}

              <button
                onClick={() => downloadFile(previewFile)}
                className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar arquivo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
