import { useState, useEffect } from 'react';
import { X, Plus, Users, Phone, Calendar, ChevronRight, CheckCircle, XCircle, Clock, Send, Eye, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface Prospect {
  id: number;
  name: string;
  whatsapp?: string;
  business_type?: string;
  visit_date?: string;
  status: 'visitado' | 'proposta_enviada' | 'aguardando' | 'fechado' | 'perdido';
  chosen_package?: string;
  next_followup?: string;
  notes?: string;
  converted_client_id?: number;
  created_at: string;
  updated_at: string;
}

interface ProspectsProps {
  isOpen: boolean;
  onClose: () => void;
  onClientConverted?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  visitado: 'Visitado',
  proposta_enviada: 'Proposta Enviada',
  aguardando: 'Aguardando',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

const STATUS_COLORS: Record<string, string> = {
  visitado: 'bg-blue-600',
  proposta_enviada: 'bg-yellow-600',
  aguardando: 'bg-orange-600',
  fechado: 'bg-green-600',
  perdido: 'bg-red-600',
};

const PACKAGES = [
  'Essencial (4 vídeos/mês) - R$ 300',
  'Essencial + Gestão - R$ 500',
  'Performance (8 vídeos/mês) - R$ 560',
  'Performance + Gestão - R$ 900',
  'Dominância (12 vídeos/mês) - R$ 780',
  'Dominância + Gestão - R$ 1.200',
  'Outro',
];

export default function Prospects({ isOpen, onClose, onClientConverted }: ProspectsProps) {
  const toast = useToast();
  const confirm = useConfirm();
  useLockBodyScroll(isOpen);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [status, setStatus] = useState<Prospect['status']>('visitado');
  const [chosenPackage, setChosenPackage] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) loadProspects();
  }, [isOpen, filterStatus]);

  const loadProspects = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'all'
        ? `/api/prospects?status=${filterStatus}`
        : '/api/prospects';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProspects(data);
      }
    } catch {
      toast.error('Erro ao carregar prospects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setWhatsapp('');
    setBusinessType('');
    setVisitDate('');
    setStatus('visitado');
    setChosenPackage('');
    setNextFollowup('');
    setNotes('');
    setEditingProspect(null);
  };

  const openEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setName(prospect.name);
    setWhatsapp(prospect.whatsapp || '');
    setBusinessType(prospect.business_type || '');
    setVisitDate(prospect.visit_date || '');
    setStatus(prospect.status);
    setChosenPackage(prospect.chosen_package || '');
    setNextFollowup(prospect.next_followup || '');
    setNotes(prospect.notes || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        whatsapp: whatsapp || null,
        business_type: businessType || null,
        visit_date: visitDate || null,
        status,
        chosen_package: chosenPackage || null,
        next_followup: nextFollowup || null,
        notes: notes || null,
      };

      const url = editingProspect ? `/api/prospects/${editingProspect.id}` : '/api/prospects';
      const method = editingProspect ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // If status is 'fechado' and not yet converted, convert to client
        if (status === 'fechado' && !editingProspect?.converted_client_id) {
          await convertToClient(editingProspect?.id || (await response.json()).id);
        } else {
          toast.success(editingProspect ? 'Prospect atualizado!' : 'Prospect cadastrado!');
          resetForm();
          setShowForm(false);
          await loadProspects();
        }
      } else {
        toast.error('Erro ao salvar prospect');
      }
    } catch {
      toast.error('Erro ao salvar prospect');
    } finally {
      setLoading(false);
    }
  };

  const convertToClient = async (prospectId: number) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/convert`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Prospect convertido em cliente com sucesso!');
        resetForm();
        setShowForm(false);
        await loadProspects();
        onClientConverted?.();
      } else {
        toast.error('Erro ao converter em cliente');
      }
    } catch {
      toast.error('Erro ao converter em cliente');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Excluir Prospect',
      message: 'Tem certeza que deseja excluir este prospect?',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Prospect excluído!');
        await loadProspects();
      } else {
        toast.error('Erro ao excluir prospect');
      }
    } catch {
      toast.error('Erro ao excluir prospect');
    }
  };

  const openWhatsApp = (whatsapp: string, name: string) => {
    const number = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}, tudo bem? Aqui é o Samuel da SG Multimídia. Gostaria de saber se você teve a oportunidade de analisar a proposta que apresentei. Fico à disposição para qualquer dúvida!`);
    window.open(`https://wa.me/55${number}?text=${message}`, '_blank');
  };

  const countByStatus = (s: string) => prospects.filter(p => p.status === s).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-5xl max-h-[90vh] my-8 shadow-2xl border border-cyan-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900 to-teal-900 p-6 border-b border-cyan-500/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Prospecção de Clientes</h2>
              <p className="text-cyan-200 text-sm">Gerencie sua campanha porta a porta</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                className={`p-2 rounded-lg text-center transition-all border ${
                  filterStatus === key ? 'border-white' : 'border-transparent'
                } ${STATUS_COLORS[key]}/20 hover:${STATUS_COLORS[key]}/30`}
              >
                <p className="text-white font-bold text-lg">{countByStatus(key)}</p>
                <p className="text-xs text-slate-300">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add button */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400 text-sm">
              {filterStatus === 'all' ? `${prospects.length} prospects no total` : `${prospects.length} com status "${STATUS_LABELS[filterStatus]}"`}
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Prospect
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Nenhum prospect cadastrado</p>
              <p className="text-sm mt-1">Comece cadastrando os comerciantes que você visitou</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prospects.map((prospect) => (
                <div key={prospect.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-white font-semibold">{prospect.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold text-white ${STATUS_COLORS[prospect.status]}`}>
                          {STATUS_LABELS[prospect.status]}
                        </span>
                        {prospect.converted_client_id && (
                          <span className="text-xs px-2 py-0.5 rounded font-semibold text-white bg-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Cliente
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {prospect.business_type && (
                          <span>🏪 {prospect.business_type}</span>
                        )}
                        {prospect.visit_date && (
                          <span>📅 Visita: {new Date(prospect.visit_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        )}
                        {prospect.next_followup && (
                          <span className="text-yellow-400">⏰ Follow-up: {new Date(prospect.next_followup + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        )}
                        {prospect.chosen_package && (
                          <span className="text-green-400">📦 {prospect.chosen_package}</span>
                        )}
                      </div>
                      {prospect.notes && (
                        <p className="text-slate-400 text-sm mt-2 italic">{prospect.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {prospect.whatsapp && (
                        <button
                          onClick={() => openWhatsApp(prospect.whatsapp!, prospect.name)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                          title="WhatsApp"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(prospect)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prospect.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] shadow-2xl border border-cyan-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-cyan-900 to-teal-900 p-5 border-b border-cyan-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingProspect ? 'Editar Prospect' : 'Novo Prospect'}
                </h3>
                <button onClick={() => { resetForm(); setShowForm(false); }} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome do comerciante ou empresa"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="55999999999"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">Tipo de Negócio</label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    placeholder="Ex: Óptica, Farmácia..."
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">Data da Visita</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">Próximo Follow-up</label>
                  <input
                    type="date"
                    value={nextFollowup}
                    onChange={e => setNextFollowup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Prospect['status'])}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {status === 'fechado' && (
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">Pacote Escolhido</label>
                  <select
                    value={chosenPackage}
                    onChange={e => setChosenPackage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecione um pacote</option>
                    {PACKAGES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-semibold mb-1">Observações</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anotações sobre a visita, interesse demonstrado..."
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              {status === 'fechado' && !editingProspect?.converted_client_id && (
                <div className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Ao salvar como "Fechado", este prospect será convertido automaticamente em cliente.
                  </p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-all"
              >
                {loading ? 'Salvando...' : editingProspect ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
