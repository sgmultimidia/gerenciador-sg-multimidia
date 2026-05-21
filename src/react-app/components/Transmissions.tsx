import { useState, useEffect } from 'react';
import { X, Plus, Radio, Check, ChevronDown, ChevronUp, Trash2, Edit2, Users } from 'lucide-react';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface Transmission {
  id: number;
  client_name: string;
  type: 'galpao' | 'podcast';
  transmission_date: string;
  guest_name?: string;
  divulgation_date?: string;
  checklist_studio: number;
  checklist_social: number;
  checklist_divulgation: number;
  notes?: string;
  status: 'pending' | 'done';
  created_at: string;
}

interface TransmissionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Transmissions({ isOpen, onClose }: TransmissionsProps) {
  const toast = useToast();
  const confirm = useConfirm();
  useLockBodyScroll(isOpen);

  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransmission, setEditingTransmission] = useState<Transmission | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'galpao' | 'podcast'>('all');

  // Form fields
  const [type, setType] = useState<'galpao' | 'podcast'>('galpao');
  const [transmissionDate, setTransmissionDate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [divulgationDate, setDivulgationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'done'>('pending');

  useEffect(() => {
    if (isOpen) loadTransmissions();
  }, [isOpen, filterType]);

  const loadTransmissions = async () => {
    setLoading(true);
    try {
      const url = filterType !== 'all'
        ? `/api/transmissions?type=${filterType}`
        : '/api/transmissions';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransmissions(data);
      }
    } catch {
      toast.error('Erro ao carregar transmissões');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('galpao');
    setTransmissionDate('');
    setGuestName('');
    setDivulgationDate('');
    setNotes('');
    setStatus('pending');
    setEditingTransmission(null);
  };

  const openEdit = (t: Transmission) => {
    setEditingTransmission(t);
    setType(t.type);
    setTransmissionDate(t.transmission_date);
    setGuestName(t.guest_name || '');
    setDivulgationDate(t.divulgation_date || '');
    setNotes(t.notes || '');
    setStatus(t.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!transmissionDate) {
      toast.warning('Data da transmissão é obrigatória');
      return;
    }

    setLoading(true);
    try {
      const body = {
        type,
        transmission_date: transmissionDate,
        guest_name: guestName || null,
        divulgation_date: divulgationDate || null,
        notes: notes || null,
        status,
      };

      const url = editingTransmission ? `/api/transmissions/${editingTransmission.id}` : '/api/transmissions';
      const method = editingTransmission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingTransmission ? 'Transmissão atualizada!' : 'Transmissão cadastrada!');
        resetForm();
        setShowForm(false);
        await loadTransmissions();
      } else {
        toast.error('Erro ao salvar transmissão');
      }
    } catch {
      toast.error('Erro ao salvar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = async (id: number, field: 'checklist_studio' | 'checklist_social' | 'checklist_divulgation', current: number) => {
    try {
      const response = await fetch(`/api/transmissions/${id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: current ? 0 : 1 }),
      });
      if (response.ok) await loadTransmissions();
    } catch {
      toast.error('Erro ao atualizar checklist');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Excluir Transmissão',
      message: 'Tem certeza que deseja excluir este registro?',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/transmissions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Transmissão excluída!');
        await loadTransmissions();
      }
    } catch {
      toast.error('Erro ao excluir transmissão');
    }
  };

  const filtered = transmissions.filter(t => filterType === 'all' || t.type === filterType);
  const pending = transmissions.filter(t => t.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] my-8 shadow-2xl border border-red-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-orange-900 p-6 border-b border-red-500/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Transmissões ao Vivo</h2>
              <p className="text-red-200 text-sm">{pending > 0 ? `${pending} transmissão(ões) pendente(s)` : 'Tudo em dia!'}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-4">
            {[['all', 'Todas'], ['galpao', 'Galpão da Querência'], ['podcast', 'Irmãos Cezar Podcast']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterType(val as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filterType === val ? 'bg-white text-red-900' : 'bg-red-800/50 text-white hover:bg-red-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400 text-sm">{filtered.length} registro(s)</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Transmissão
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Radio className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Nenhuma transmissão registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <div key={t.id} className={`bg-slate-700/50 rounded-lg p-4 border transition-all ${
                  t.status === 'done' ? 'border-green-500/30' : 'border-slate-600 hover:border-red-500/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold text-white ${
                          t.type === 'galpao' ? 'bg-orange-600' : 'bg-purple-600'
                        }`}>
                          {t.type === 'galpao' ? 'Galpão da Querência' : 'Irmãos Cezar Podcast'}
                        </span>
                        <span className="text-white font-semibold">
                          {new Date(t.transmission_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold text-white ${
                          t.status === 'done' ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {t.status === 'done' ? '✓ Realizada' : 'Pendente'}
                        </span>
                      </div>

                      {t.guest_name && (
                        <p className="text-slate-300 text-sm mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          Convidado: <span className="font-semibold">{t.guest_name}</span>
                        </p>
                      )}

                      {t.divulgation_date && (
                        <p className="text-slate-400 text-sm mb-2">
                          📢 Divulgação: {new Date(t.divulgation_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      {/* Checklist */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => toggleChecklist(t.id, 'checklist_studio', t.checklist_studio)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            t.checklist_studio ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          {t.checklist_studio ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-400" />}
                          Estúdio preparado
                        </button>
                        <button
                          onClick={() => toggleChecklist(t.id, 'checklist_social', t.checklist_social)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            t.checklist_social ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          {t.checklist_social ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-400" />}
                          Redes sociais prontas
                        </button>
                        {t.type === 'podcast' && (
                          <button
                            onClick={() => toggleChecklist(t.id, 'checklist_divulgation', t.checklist_divulgation)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              t.checklist_divulgation ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            }`}
                          >
                            {t.checklist_divulgation ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-400" />}
                            Divulgação postada
                          </button>
                        )}
                      </div>

                      {t.notes && (
                        <p className="text-slate-400 text-sm mt-2 italic">{t.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
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
          <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[90vh] shadow-2xl border border-red-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-red-900 to-orange-900 p-5 border-b border-red-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingTransmission ? 'Editar Transmissão' : 'Nova Transmissão'}
                </h3>
                <button onClick={() => { resetForm(); setShowForm(false); }} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Programa</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="galpao">Galpão da Querência</option>
                  <option value="podcast">Irmãos Cezar Podcast</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-1">Data da Transmissão *</label>
                <input
                  type="date"
                  value={transmissionDate}
                  onChange={e => setTransmissionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {type === 'podcast' && (
                <>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-1">Nome do Convidado</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Nome do convidado do episódio"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-1">Data da Divulgação</label>
                    <input
                      type="date"
                      value={divulgationDate}
                      onChange={e => setDivulgationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-white text-sm font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="done">Realizada</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-1">Observações</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Alguma observação sobre a transmissão..."
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-all"
              >
                {loading ? 'Salvando...' : editingTransmission ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
