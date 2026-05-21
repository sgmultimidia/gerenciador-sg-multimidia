import { useState } from 'react';
import { FileText, Clock } from 'lucide-react';
import ResponsiveModal from './ResponsiveModal';
import { useToast } from './ToastContainer';
import { generateReceiptPDF } from '@/react-app/utils/pdfGenerator';

interface Quote {
  id: number;
  quote_number: string;
  client_id: number;
  client_name: string;
  items: any[];
  subtotal: number;
  discount_percentage: number;
  discount_value?: number;
  total: number;
  created_at: string;
}

interface Client {
  id: number;
  name: string;
  whatsapp: string;
  email?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  client: Client | null;
}

export default function ReceiptGeneratorModal({ isOpen, onClose, quote, client }: Props) {
  const toast = useToast();
  const [overtimeMinutes, setOvertimeMinutes] = useState('0');
  const [overtimeValue, setOvertimeValue] = useState('0');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !quote || !client) return null;

  const calculateFinalTotal = () => {
    const overtime = parseFloat(overtimeValue) || 0;
    return quote.total + overtime;
  };

  const handleGenerateReceipt = async () => {
    setLoading(true);
    try {
      const minutes = parseInt(overtimeMinutes) || 0;
      const overtime = parseFloat(overtimeValue) || 0;
      const finalTotal = calculateFinalTotal();

      // Create receipt in database
      const receiptResponse = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
          overtime_minutes: minutes,
          overtime_value: overtime,
          final_total: finalTotal,
        }),
      });

      if (!receiptResponse.ok) {
        throw new Error('Erro ao criar recibo');
      }

      const receipt = await receiptResponse.json();

      // Create cash transaction
      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: finalTotal,
          description: `Recibo do Orçamento #${quote.quote_number} - ${client.name}`,
          category: 'Serviços',
          client_id: client.id,
          quote_id: quote.id,
          receipt_id: receipt.id,
          payment_method: null,
          transaction_date: new Date().toISOString().split('T')[0],
        }),
      });

      // Generate PDF
      generateReceiptPDF({
        receipt_number: `REC-${receipt.id.toString().padStart(6, '0')}`,
        quote_number: quote.quote_number,
        client_name: client.name,
        client_whatsapp: client.whatsapp,
        created_at: new Date().toISOString(),
        items: quote.items,
        subtotal: quote.subtotal,
        discount_percentage: quote.discount_percentage,
        discount_value: quote.discount_value,
        overtime_minutes: minutes,
        overtime_value: overtime,
        total: quote.total,
        final_total: finalTotal,
      });

      toast.success('Recibo gerado com sucesso!');
      
      // Offer WhatsApp
      if (client.whatsapp) {
        const number = client.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${client.name}! Segue o recibo referente ao orçamento #${quote.quote_number} no valor de R$ ${finalTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. O PDF foi gerado e está disponível. Qualquer dúvida estou à disposição!`);
        window.open(`https://wa.me/55${number}?text=${msg}`, '_blank');
      }
      
      onClose();
      
      // Reset form
      setOvertimeMinutes('0');
      setOvertimeValue('0');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Erro ao gerar recibo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar Recibo"
    >
      <div className="space-y-4">
        {/* Quote Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-300 font-medium mb-1">
                Orçamento #{quote.quote_number}
              </p>
              <p className="text-xs text-blue-200/80">
                Cliente: {client.name}
              </p>
              <p className="text-xs text-blue-200/80">
                Valor: R$ {quote.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Overtime Fields */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hora Extra (Opcional)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Minutos de Hora Extra
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={overtimeMinutes}
                onChange={(e) => setOvertimeMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Valor da Hora Extra (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={overtimeValue}
                onChange={(e) => setOvertimeValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            Se não houver hora extra, deixe os valores em zero
          </p>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-sm opacity-90">Valor do Orçamento</p>
              <p className="text-2xl font-bold">R$ {quote.total.toFixed(2)}</p>
            </div>
            {parseFloat(overtimeValue) > 0 && (
              <div className="text-right">
                <p className="text-sm opacity-90">+ Hora Extra</p>
                <p className="text-xl font-semibold">R$ {parseFloat(overtimeValue).toFixed(2)}</p>
              </div>
            )}
          </div>
          
          {parseFloat(overtimeValue) > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Total Final:</p>
                <p className="text-2xl font-bold">R$ {calculateFinalTotal().toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-300">
            ✓ O recibo será registrado automaticamente no controle de caixa
          </p>
          <p className="text-xs text-green-300">
            ✓ Um PDF será gerado para impressão ou envio ao cliente
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerateReceipt}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Gerar Recibo'}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
