import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { motion } from 'framer-motion';
import { Download, Lock, FileAudio, FileVideo, FileImage, File, FileText, Clock } from 'lucide-react';
import type { ClientPortalLink, ProjectFile } from '@/shared/types';
import { AnimatedPage } from '@/react-app/components/animated';
import { listContainerVariants, listItemVariants, tapScale } from '@/react-app/utils/animations';

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

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadPortalData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portal/${token}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Erro ao carregar portal');
        return;
      }

      const data = await response.json();
      setPortalData(data);
    } catch {
      setError('Erro ao carregar portal do cliente');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-6 h-6 text-blue-400" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-6 h-6 text-purple-400" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="w-6 h-6 text-green-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />;
    return <File className="w-6 h-6 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'in_progress': return 'bg-blue-600';
      case 'review': return 'bg-yellow-600';
      case 'not_started': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Andamento';
      case 'review': return 'Em Revisão';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  // ✅ Download SEM obrigatoriedade de pagamento
  const downloadFile = async (file: ProjectFile) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/portal/${token}/file/${file.id}/download`);

      if (!response.ok) {
        alert('Erro ao baixar arquivo');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Erro ao baixar arquivo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-white text-xl">Carregando portal...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center border border-red-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Lock className="w-8 h-8 text-red-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-300">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!portalData) return null;

  const { project, files } = portalData;

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div
        className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">SG Multimídia</h1>
              <p className="text-purple-300">Portal do Cliente</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{project.client_name}</p>
              <p className="text-slate-400 text-sm">Orçamento #{project.quote_number}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="max-w-6xl mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Project Status Card */}
        <motion.div
          className="bg-slate-800 rounded-lg p-6 mb-6 border border-purple-500/30 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Status do Projeto</h2>
            <span className={`text-xs px-3 py-1 rounded ${getStatusColor(project.status)} text-white font-semibold`}>
              {getStatusLabel(project.status)}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Progresso</span>
              <span className="text-white font-bold">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {project.estimated_delivery && (
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Previsão de Entrega: {new Date(project.estimated_delivery).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {project.notes && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded text-slate-300 text-sm">
              {project.notes}
            </div>
          )}
        </motion.div>

        {/* Files Section */}
        <motion.div
          className="bg-slate-800 rounded-lg p-6 border border-purple-500/30 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Arquivos do Projeto</h2>

          {files.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <File className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum arquivo disponível ainda</p>
              <p className="text-slate-500 text-sm mt-2">
                Os arquivos aparecerão aqui assim que forem enviados
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-3"
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition-all"
                  variants={listItemVariants}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.file_type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {file.original_filename}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(file.upload_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {file.notes && (
                          <p className="text-slate-300 text-sm mt-2">{file.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => downloadFile(file)}
                        className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all flex items-center gap-2"
                        title="Baixar arquivo"
                        whileHover={{ scale: 1.05 }}
                        whileTap={tapScale}
                      >
                        <Download className="w-5 h-5" />
                        <span className="text-sm font-semibold hidden sm:inline">
                          Baixar
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-8 text-center text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <p>© SG Multimídia - Estúdio de Produção Audiovisual</p>
          <p className="mt-1">São Pedro do Sul - RS</p>
        </motion.div>
      </motion.div>
    </AnimatedPage>
  );
}