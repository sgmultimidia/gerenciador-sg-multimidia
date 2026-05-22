import { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, History } from 'lucide-react';
import type { Client } from '@/shared/types';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { generateMonthlyReceiptPDF } from '@/react-app/utils/pdfGenerator';

interface MonthlyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function MonthlyReceiptModal({ isOpen, onClose, clients }: MonthlyReceiptModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [monthReference, setMonthReference] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  // History states
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterClient, setFilterClient] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'history') loadHistory();
  }, [isOpen, activeTab, filterClient]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const url = filterClient
        ? `/api/monthly-receipts?client_id=${filterClient}`
        : '/api/monthly-receipts';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));

  const generateReceipt = async () => {
    if (!selectedClientId || !amount || !description || !monthReference) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.warning('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      const receiptResponse = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient!.id,
          amount: finalAmount,
          description,
          month_reference: monthReference
        })
      });

      if (!receiptResponse.ok) throw new Error('Falha ao criar recibo');

      const receipt = await receiptResponse.json();

      const [year, month] = monthReference.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthName = monthNames[parseInt(month) - 1];

      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: finalAmount,
          description: `Recibo Mensal - ${selectedClient!.name} - ${monthName}/${year}`,
          category: 'Recibo Mensal',
          client_id: selectedClient!.id,
          quote_id: null,
          receipt_id: receipt.id,
          payment_method: null,
          transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      generateMonthlyReceiptPDF({
        receipt_number: receipt.receipt_number || receipt.id.toString(),
        client_name: selectedClient!.name,
        client_whatsapp: selectedClient!.whatsapp,
        amount: finalAmount,
        description,
        month_reference: monthReference,
        created_at: new Date().toISOString(),
      });

      toast.success('Recibo gerado com sucesso!');

      if (selectedClient!.whatsapp) {
        const number = selectedClient!.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${selectedClient!.name}! Segue o recibo referente ao mês de ${monthName}/${year} no valor de R$ ${finalAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. O PDF foi gerado. Qualquer dúvida estou à disposição!`);
        window.open(`https://wa.me/55${number}?text=${msg}`, '_blank');
      }

      setSelectedClientId('');
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      toast.error('Erro ao gerar recibo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] shadow-2xl border border-green-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-500/30 flex-shrink-0">
          <div className="p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Recibo Mensal</h3>
                <p className="text-green-200 text-sm">Gerar recibo para pagamentos recorrentes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-green-800">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'new'
                  ? 'bg-green-800/50 text-white border-b-2 border-green-400'
                  : 'text-green-300 hover:bg-green-800/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              Novo Recibo
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-green-800/50 text-white border-b-2 border-green-400'
                  : 'text-green-300 hover:bg-green-800/30'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'new' && (
            <div className="p-6 space-y-4">
              {/* Client */}
              <div>
                <label className="block text-white font-semibold mb-2">Cliente <span className="text-red-400">*</span></label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  Mês de Referência <span className="text-red-400">*</span>
                </label>
                <input
                  type="month"
                  value={monthReference}
                  onChange={(e) => setMonthReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Valor (R$) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-semibold mb-2">Descrição do Serviço <span className="text-red-400">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exemplo: Mensalidade de manutenção de redes sociais"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-green-300">Importante:</span> Este recibo será registrado automaticamente no controle de caixa como entrada de receita. Uma cópia em PDF será gerada para impressão.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateReceipt}
                  disabled={loading || !selectedClientId || !amount || !description || !monthReference}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                >
                  {loading ? 'Gerando...' : 'Gerar Recibo'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-5">
              <div className="mb-4">
                <select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Todos os clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
                        <span className="text-slate-500 text-xs flex-shrink-0">
                          {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                        </span>
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
