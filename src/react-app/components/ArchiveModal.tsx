import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Upload, Download, Trash2, File, FileText, FileImage, FileVideo, FileAudio, Search, Play } from 'lucide-react';
import type { Client } from '@/shared/types';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface ArchiveFile {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  document_type: string;
  client_id?: number;
  client_name?: string;
  notes?: string;
  created_at: string;
}

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

const DOCUMENT_TYPES = [
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'outros', label: 'Outros' },
];

const TYPE_COLORS: Record<string, string> = {
  orcamento: 'bg-blue-600/20 text-blue-400',
  contrato: 'bg-indigo-600/20 text-indigo-400',
  recibo: 'bg-green-600/20 text-green-400',
  nota_fiscal: 'bg-yellow-600/20 text-yellow-400',
  outros: 'bg-slate-600/20 text-slate-400',
};

export default function ArchiveModal({ isOpen, onClose, clients }: ArchiveModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ArchiveFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'upload'>('files');

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('outros');
  const [uploadClientId, setUploadClientId] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) loadFiles();
  }, [isOpen, filterType, filterClient]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      let url = '/api/archive';
      const params = new URLSearchParams();
      if (filterType) params.set('document_type', filterType);
      if (filterClient) params.set('client_id', filterClient);
      if (params.toString()) url += '?' + params.toString();
      const res = await fetch(url);
      if (res.ok) setFiles(await res.json());
    } catch { toast.error('Erro ao carregar arquivos'); } finally { setLoading(false); }
  };

  const openPreview = async (file: ArchiveFile) => {
    setPreviewFile(file);
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/archive/${file.id}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch { } finally { setLoadingPreview(false); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const canPreview = (file: ArchiveFile) =>
    file.file_type.startsWith('audio/') ||
    file.file_type.startsWith('video/') ||
    file.file_type.startsWith('image/') ||
    file.file_type === 'application/pdf';

  const handleUpload = async () => {
    if (!uploadFile) { toast.warning('Selecione um arquivo'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', uploadDocType);
      if (uploadClientId) {
        const client = clients.find(c => c.id === parseInt(uploadClientId));
        formData.append('client_id', uploadClientId);
        formData.append('client_name', client?.name || '');
      }
      if (uploadNotes) formData.append('notes', uploadNotes);

      const res = await fetch('/api/archive', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();

      toast.success('Arquivo arquivado!');
      setUploadFile(null);
      setUploadDocType('outros');
      setUploadClientId('');
      setUploadNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('files');
      loadFiles();
    } catch { toast.error('Erro ao arquivar arquivo'); } finally { setUploading(false); }
  };

  const handleDownload = async (file: ArchiveFile) => {
    try {
      const res = await fetch(`/api/archive/${file.id}/download`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch { toast.error('Erro ao baixar arquivo'); }
  };

  const handleDelete = async (file: ArchiveFile) => {
    if (!window.confirm(`Excluir "${file.original_filename}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/archive/${file.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Arquivo excluído');
    } catch { toast.error('Erro ao excluir arquivo'); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />;
    if (type.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-400" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const filteredFiles = files.filter(f =>
    f.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    (f.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-3xl max-h-[90vh] shadow-2xl border border-purple-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-500/30 flex-shrink-0">
          <div className="p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Arquivo Digital</h3>
                <p className="text-purple-200 text-sm">Armazenamento centralizado de documentos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex border-t border-purple-800">
            <button onClick={() => setActiveTab('files')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'files' ? 'bg-purple-800/50 text-white border-b-2 border-purple-400' : 'text-purple-300 hover:bg-purple-800/30'}`}>
              <FolderOpen className="w-4 h-4" /> Arquivos ({files.length})
            </button>
            <button onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-purple-800/50 text-white border-b-2 border-purple-400' : 'text-purple-300 hover:bg-purple-800/30'}`}>
              <Upload className="w-4 h-4" /> Novo Arquivo
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="p-5 space-y-4">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-48 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar arquivos..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                  <option value="">Todos os tipos</option>
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                  <option value="">Todos os clientes</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* File list */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
                  <p className="text-sm mt-1">Use a aba "Novo Arquivo" para adicionar documentos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{file.original_filename}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${TYPE_COLORS[file.document_type] || TYPE_COLORS.outros}`}>
                              {DOCUMENT_TYPES.find(t => t.value === file.document_type)?.label || file.document_type}
                            </span>
                            {file.client_name && (
                              <span className="text-slate-400 text-xs">{file.client_name}</span>
                            )}
                            <span className="text-slate-500 text-xs">{formatSize(file.file_size)}</span>
                            <span className="text-slate-500 text-xs">{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {file.notes && <p className="text-slate-400 text-xs mt-1 truncate">{file.notes}</p>}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {canPreview(file) && (
                            <button onClick={() => openPreview(file)}
                              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all" title="Visualizar">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDownload(file)}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all" title="Baixar">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(file)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Arquivo *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-lg p-8 text-center cursor-pointer transition-all">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  {uploadFile ? (
                    <p className="text-white font-medium">{uploadFile.name}</p>
                  ) : (
                    <>
                      <p className="text-slate-300 font-medium">Clique para selecionar</p>
                      <p className="text-slate-500 text-sm mt-1">PDF, imagens, documentos, áudios, vídeos</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Tipo de Documento</label>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Cliente (opcional)</label>
                <select value={uploadClientId} onChange={e => setUploadClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Nenhum</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Observações (opcional)</label>
                <input type="text" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                  placeholder="Ex: Contrato assinado em março de 2026"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveTab('files')}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={handleUpload} disabled={uploading || !uploadFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all">
                  {uploading ? 'Arquivando...' : 'Arquivar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold truncate">{previewFile.original_filename}</p>
              <div className="flex gap-2 ml-2">
                <button onClick={() => handleDownload(previewFile)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={closePreview}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
