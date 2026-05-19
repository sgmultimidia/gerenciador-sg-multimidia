import { useState } from 'react';
import { X, FileText, Calendar, DollarSign } from 'lucide-react';
import type { Client } from '@/shared/types';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { Select } from './ui';
import { generateMonthlyReceiptPDF } from '@/react-app/utils/pdfGenerator';

interface MonthlyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function MonthlyReceiptModal({
  isOpen,
  onClose,
  clients
}: MonthlyReceiptModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [monthReference, setMonthReference] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const selectedClient = clients.find(c => c.id === Number(selectedClientId));

  const handleReset = () => {
    setSelectedClientId('');
    setAmount('');
    setDescription('');
    const now = new Date();
    setMonthReference(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const generateReceipt = async () => {
    if (!selectedClient || !amount || !description || !monthReference) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      // Create monthly receipt
      const receiptResponse = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          amount: finalAmount,
          description: description,
          month_reference: monthReference
        })
      });

      if (!receiptResponse.ok) {
        throw new Error('Falha ao criar recibo');
      }

      const receipt = await receiptResponse.json();

      // Create cash transaction
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
          description: `Recibo Mensal - ${selectedClient.name} - ${monthName}/${year}`,
          category: 'Recibo Mensal',
          client_id: selectedClient.id,
          quote_id: null,
          receipt_id: receipt.id,
          payment_method: null,
          transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      // Generate PDF
      try {
        generateMonthlyReceiptPDF({
          client_name: selectedClient.name,
          client_whatsapp: selectedClient.whatsapp,
          amount: finalAmount,
          description: description,
          month_reference: monthReference,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
      
      toast.success('Recibo mensal gerado com sucesso!');
      handleReset();
      onClose();
    } catch (error) {
      toast.error('Erro ao gerar recibo mensal');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-green-500/30 max-w-2xl w-full my-8 flex flex-col">
        <div className="bg-slate-800 border-b border-green-500/30 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">Recibo Mensal</h3>
              <p className="text-sm text-slate-400 mt-1">Gerar recibo para pagamentos recorrentes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Client Selection */}
            <Select
              label="Cliente"
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.client_type === 'juridica' ? 'PJ' : 'PF'}
                </option>
              ))}
            </Select>

            {/* Month Reference */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mês de Referência <span className="text-red-400">*</span>
              </label>
              <input
                type="month"
                value={monthReference}
                onChange={(e) => setMonthReference(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor (R$) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Descrição do Serviço <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exemplo: Mensalidade de manutenção de redes sociais"
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-green-300">Importante:</span> Este recibo será registrado automaticamente 
                no controle de caixa como entrada de receita. Uma cópia em PDF será gerada para impressão.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-green-500/30 bg-slate-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={generateReceipt}
              disabled={loading || !selectedClientId || !amount || !description || !monthReference}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50"
            >
              {loading ? 'Gerando...' : 'Gerar Recibo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
