import { X, FileCheck, Trash2 } from 'lucide-react';
import type { Quote, Receipt } from '@/shared/types';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface ReceiptsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  receipts: Receipt[];
  onDelete?: (receiptId: number) => void;
}

export default function ReceiptsHistoryModal({
  isOpen,
  onClose,
  quote,
  receipts,
  onDelete
}: ReceiptsHistoryModalProps) {
  const { confirm } = useConfirm();
  useLockBodyScroll(isOpen);
  
  if (!isOpen || !quote) return null;

  const handleDelete = async (receiptId: number) => {
    const confirmed = await confirm({
      title: 'Excluir Recibo',
      message: 'Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;

    if (onDelete) {
      onDelete(receiptId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-2xl w-full my-8 flex flex-col">
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-500/30 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileCheck className="w-6 h-6 text-green-400" />
              <h3 className="text-2xl font-bold text-white">Histórico de Recibos</h3>
            </div>
            <p className="text-green-200 text-sm">Orçamento #{quote.quote_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileCheck className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center text-lg">Nenhum recibo gerado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt, index) => (
                <div key={receipt.id} className="bg-slate-700/50 rounded-lg p-5 border border-green-500/30 hover:border-green-500/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold text-lg">Recibo #{index + 1}</h4>
                        <span className="text-xs px-2.5 py-1 rounded bg-green-600 text-white font-semibold">
                          {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {new Date(receipt.created_at).toLocaleString('pt-BR', { 
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-2xl">R$ {receipt.final_total.toFixed(2)}</p>
                      </div>
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-md transition-all"
                          title="Excluir recibo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {receipt.overtime_minutes > 0 && (
                    <div className="border-t border-slate-600 pt-4 mt-4">
                      <h5 className="text-green-300 font-semibold text-sm mb-3 uppercase tracking-wide">Tempo Excedente:</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Minutos excedentes:</span>
                          <span className="text-white font-semibold">{receipt.overtime_minutes} minutos</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Valor adicional:</span>
                          <span className="text-white font-semibold">R$ {receipt.overtime_value.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-400">Valor do orçamento:</span>
                      <span className="text-white font-semibold">R$ {quote.total.toFixed(2)}</span>
                    </div>
                    {receipt.overtime_value > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-green-400">+ Tempo excedente:</span>
                        <span className="text-green-400 font-semibold">R$ {receipt.overtime_value.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-slate-600">
                      <span className="text-white">Total do recibo:</span>
                      <span className="text-green-400">R$ {receipt.final_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
