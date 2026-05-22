import { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, History, Download, Plus } from 'lucide-react';
import type { Client } from '@/shared/types';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { generateMonthlyReceiptPDF, generateReceiptPDF } from '@/react-app/utils/pdfGenerator';

interface MonthlyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function MonthlyReceiptModal({ isOpen, onClose, clients }: MonthlyReceiptModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [activeTab, setActiveTab] = useState<'monthly' | 'avulso' | 'history'>('monthly');

  // Monthly receipt states
  const [monthlyClientId, setMonthlyClientId] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [monthlyDescription, setMonthlyDescription] = useState('');
  const [monthlyReference, setMonthlyReference] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Avulso receipt states
  const [avulsoClientId, setAvulsoClientId] = useState('');
  const [avulsoAmount, setAvulsoAmount] = useState('');
  const [avulsoDescription, setAvulsoDescription] = useState('');

  // History states
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterClient, setFilterClient] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') loadHistory();
  }, [isOpen, activeTab, filterClient]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const url = filterClient ? `/api/monthly-receipts?client_id=${filterClient}` : '/api/monthly-receipts';
      const response = await fetch(url);
      if (response.ok) setReceipts(await response.json());
    } catch { } finally { setLoadingHistory(false); }
  };

  const monthlyClient = clients.find(c => c.id === parseInt(monthlyClientId));
  const avulsoClient = clients.find(c => c.id === parseInt(avulsoClientId));

  const generateMonthly = async () => {
    if (!monthlyClientId || !monthlyAmount || !monthlyDescription || !monthlyReference) {
      toast.warning('Preencha todos os campos'); return;
    }
    const amount = parseFloat(monthlyAmount);
    if (isNaN(amount) || amount <= 0) { toast.warning('Valor inválido'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: monthlyClient!.id, amount, description: monthlyDescription, month_reference: monthlyReference })
      });
      if (!res.ok) throw new Error();

      const [year, month] = monthlyReference.split('-');
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income', amount, client_id: monthlyClient!.id,
          description: `Recibo Mensal - ${monthlyClient!.name} - ${monthNames[parseInt(month)-1]}/${year}`,
          category: 'Recibo Mensal', transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      generateMonthlyReceiptPDF({
        client_name: monthlyClient!.name, client_whatsapp: monthlyClient!.whatsapp,
        amount, description: monthlyDescription, month_reference: monthlyReference,
        created_at: new Date().toISOString(),
      });

      toast.success('Recibo mensal gerado!');
      if (monthlyClient!.whatsapp) {
        const number = monthlyClient!.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${monthlyClient!.name}! Segue o recibo de ${monthNames[parseInt(month)-1]}/${year} no valor de R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}. Obrigado!`);
        window.open(`https://wa.me/55${number}?text=${msg}`, '_blank');
      }

      setMonthlyClientId(''); setMonthlyAmount(''); setMonthlyDescription('');
      onClose();
    } catch { toast.error('Erro ao gerar recibo'); } finally { setLoading(false); }
  };

  const generateAvulso = async () => {
    if (!avulsoClientId || !avulsoAmount || !avulsoDescription) {
      toast.warning('Preencha todos os campos'); return;
    }
    const amount = parseFloat(avulsoAmount);
    if (isNaN(amount) || amount <= 0) { toast.warning('Valor inválido'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: avulsoClient!.id, amount, description: avulsoDescription, month_reference: new Date().toISOString().substring(0, 7) })
      });
      if (!res.ok) throw new Error();
      const receipt = await res.json();

      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income', amount, client_id: avulsoClient!.id,
          description: `Recibo Avulso - ${avulsoClient!.name} - ${avulsoDescription}`,
          category: 'Recibo Avulso', transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      generateReceiptPDF({
        receipt_number: receipt.id?.toString() || '0',
        quote_number: 'AVU',
        client_name: avulsoClient!.name,
        client_whatsapp: avulsoClient!.whatsapp,
        client_email: avulsoClient!.email,
        items: [{ id: '1', name: avulsoDescription, price: amount, type: 'service' as const }],
        subtotal: amount,
        discount_percentage: 0,
        discount_value: 0,
        total: amount,
        created_at: new Date().toISOString(),
      });

      toast.success('Recibo avulso gerado!');
      if (avulsoClient!.whatsapp) {
        const number = avulsoClient!.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${avulsoClient!.name}! Segue o recibo no valor de R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits:2})} referente a: ${avulsoDescription}. Obrigado!`);
        window.open(`https://wa.me/55${number}?text=${msg}`, '_blank');
      }

      setAvulsoClientId(''); setAvulsoAmount(''); setAvulsoDescription('');
      onClose();
    } catch { toast.error('Erro ao gerar recibo'); } finally { setLoading(false); }
  };

  const reissuePDF = (receipt: any) => {
    generateMonthlyReceiptPDF({
      client_name: receipt.client_name, client_whatsapp: receipt.client_whatsapp || '',
      amount: Number(receipt.amount), description: receipt.description,
      month_reference: receipt.month_reference, created_at: receipt.created_at,
    });
    toast.success('PDF gerado!');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'monthly', label: 'Recibo Mensal', icon: Calendar },
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
                <p className="text-green-200 text-sm">Gestão centralizada de recibos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex border-t border-green-800">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  activeTab === id ? 'bg-green-800/50 text-white border-b-2 border-green-400' : 'text-green-300 hover:bg-green-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Monthly Tab */}
          {activeTab === 'monthly' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Cliente *</label>
                <select value={monthlyClientId} onChange={e => setMonthlyClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" /> Mês de Referência *
                </label>
                <input type="month" value={monthlyReference} onChange={e => setMonthlyReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" /> Valor (R$) *
                </label>
                <input type="number" step="0.01" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Descrição do Serviço *</label>
                <textarea value={monthlyDescription} onChange={e => setMonthlyDescription(e.target.value)}
                  placeholder="Ex: Transmissão ao vivo quinzenal" rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-slate-300">
                <span className="font-semibold text-green-300">Importante:</span> O valor será lançado automaticamente no caixa como receita.
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">Cancelar</button>
                <button onClick={generateMonthly} disabled={loading || !monthlyClientId || !monthlyAmount || !monthlyDescription}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all">
                  {loading ? 'Gerando...' : 'Gerar Recibo'}
                </button>
              </div>
            </div>
          )}

          {/* Avulso Tab */}
          {activeTab === 'avulso' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Cliente *</label>
                <select value={avulsoClientId} onChange={e => setAvulsoClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" /> Valor (R$) *
                </label>
                <input type="number" step="0.01" value={avulsoAmount} onChange={e => setAvulsoAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Descrição do Serviço *</label>
                <textarea value={avulsoDescription} onChange={e => setAvulsoDescription(e.target.value)}
                  placeholder="Ex: Gravação de áudio - 2 faixas" rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-slate-300">
                <span className="font-semibold text-green-300">Importante:</span> O valor será lançado automaticamente no caixa como receita.
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">Cancelar</button>
                <button onClick={generateAvulso} disabled={loading || !avulsoClientId || !avulsoAmount || !avulsoDescription}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all">
                  {loading ? 'Gerando...' : 'Gerar Recibo'}
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
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
                          <p className="text-slate-400 text-xs mt-0.5">{receipt.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-green-400 font-bold text-sm">
                              R$ {Number(receipt.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(receipt.month_reference + '-01').toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-slate-500 text-xs">{new Date(receipt.created_at).toLocaleDateString('pt-BR')}</span>
                          <button onClick={() => reissuePDF(receipt)}
                            className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all" title="Baixar PDF">
                            <Download className="w-3.5 h-3.5" />
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
