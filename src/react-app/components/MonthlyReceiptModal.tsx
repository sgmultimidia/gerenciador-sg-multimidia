import { useState, useEffect } from 'react';
import { X, FileText, DollarSign, History, Download, Plus, Trash2 } from 'lucide-react';
import type { Client } from '@/shared/types';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { generateReceiptPDF } from '@/react-app/utils/pdfGenerator';

interface MonthlyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function MonthlyReceiptModal({ isOpen, onClose, clients }: MonthlyReceiptModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [activeTab, setActiveTab] = useState<'avulso' | 'history'>('avulso');
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // History
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterClient, setFilterClient] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'history') loadHistory();
  }, [isOpen, activeTab, filterClient]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const url = filterClient ? `/api/monthly-receipts?client_id=${filterClient}` : '/api/monthly-receipts';
      const res = await fetch(url);
      if (res.ok) setReceipts(await res.json());
    } catch { } finally { setLoadingHistory(false); }
  };

  const selectedClient = clients.find(c => c.id === parseInt(clientId));

  const generateAvulso = async () => {
    if (!clientId || !amount || !description) { toast.warning('Preencha todos os campos'); return; }
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) { toast.warning('Valor inválido'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient!.id,
          amount: value,
          description,
          month_reference: new Date().toISOString().substring(0, 7)
        })
      });
      if (!res.ok) throw new Error();
      const receipt = await res.json();

      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income', amount: value, client_id: selectedClient!.id,
          description: `Recibo Avulso - ${selectedClient!.name} - ${description}`,
          category: 'Recibo Avulso',
          transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      generateReceiptPDF({
        receipt_number: receipt.id?.toString() || '0',
        quote_number: 'AVU',
        client_name: selectedClient!.name,
        client_whatsapp: selectedClient!.whatsapp,
        client_email: selectedClient!.email,
        items: [{ id: '1', name: description, price: value, type: 'service' as const }],
        subtotal: value,
        discount_percentage: 0,
        discount_value: 0,
        total: value,
        created_at: new Date().toISOString(),
      });

      toast.success('Recibo gerado!');

      if (selectedClient!.whatsapp) {
        const number = selectedClient!.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${selectedClient!.name}! Segue o recibo no valor de R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente a: ${description}. Obrigado!`);
        window.open(`https://wa.me/55${number}?text=${msg}`, '_blank');
      }

      setClientId(''); setAmount(''); setDescription('');
      onClose();
    } catch { toast.error('Erro ao gerar recibo'); } finally { setLoading(false); }
  };

  const deleteReceipt = async (receipt: any) => {
    if (!window.confirm(`Excluir o recibo de ${receipt.client_name}? Esta ação não pode ser desfeita.`)) return;

    try {
      const res = await fetch(`/api/monthly-receipts/${receipt.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReceipts(prev => prev.filter(r => r.id !== receipt.id));
      toast.success('Recibo excluído');
    } catch { toast.error('Erro ao excluir recibo'); }
  };

  const reissuePDF = (receipt: any) => {
    generateReceiptPDF({
      receipt_number: receipt.id?.toString() || '0',
      quote_number: 'AVU',
      client_name: receipt.client_name,
      client_whatsapp: receipt.client_whatsapp || '',
      client_email: '',
      items: [{ id: '1', name: receipt.description, price: Number(receipt.amount), type: 'service' as const }],
      subtotal: Number(receipt.amount),
      discount_percentage: 0,
      discount_value: 0,
      total: Number(receipt.amount),
      created_at: receipt.created_at,
    });
    toast.success('PDF gerado!');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'avulso', label: 'Recibo Avulso', icon: Plus },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] shadow-2xl border border-green-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-500/30 flex-shrink-0">
          <div className="p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Recibos</h3>
                <p className="text-green-200 text-sm">Gestão de recibos avulsos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex border-t border-green-800">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id as any)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === id ? 'bg-green-800/50 text-white border-b-2 border-green-400' : 'text-green-300 hover:bg-green-800/30'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'avulso' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Cliente *</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" /> Valor (R$) *
                </label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Descrição do Serviço *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Gravação de áudio - 2 faixas" rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-slate-300">
                <span className="font-semibold text-green-300">Importante:</span> O valor será lançado automaticamente no caixa como receita.
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={generateAvulso} disabled={loading || !clientId || !amount || !description}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all">
                  {loading ? 'Gerando...' : 'Gerar Recibo'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-5">
              <div className="mb-4">
                <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                  <option value="">Todos os clientes</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum recibo encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{receipt.client_name}</p>
                          <p className="text-slate-400 text-xs mt-0.5 truncate">{receipt.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-green-400 font-bold text-sm">
                              R$ {Number(receipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => reissuePDF(receipt)}
                            className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all" title="Baixar PDF">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteReceipt(receipt)}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
